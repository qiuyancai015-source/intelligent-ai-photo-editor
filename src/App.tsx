import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ToolMode,
  CutoutConfig,
  EraserConfig,
  WatermarkConfig,
  AddWatermarkConfig,
  BgConfig,
  ImageAdjustments,
  CropConfig,
  TextElement,
  StickerElement,
  AiAnalysisResult,
  HistorySnapshot,
} from "./types";
import { Header } from "./components/Header";
import { Toolbar } from "./components/Toolbar";
import { CanvasArea } from "./components/CanvasArea";
import { RightPanel } from "./components/RightPanel";
import { BottomBar } from "./components/BottomBar";
import { ExportModal } from "./components/ExportModal";
import {
  removeBackgroundSmart,
  inpaintArea,
  updateCutoutEdges,
  detectRepeatedWatermarkMask,
  cropImageByRect,
  applyAdjustmentsAndFilters,
  renderCompositeCanvas,
} from "./utils/imageAlgorithms";
import { SAMPLE_IMAGES, SampleImage } from "./utils/sampleImages";

const DEFAULT_BG_CONFIG: BgConfig = {
  type: "transparent",
  color: "#FFFFFF",
  gradient: {
    type: "linear",
    angle: 45,
    color1: "#4E65FF",
    color2: "#92EFFD",
  },
  textureId: "studio",
  shadow: {
    enabled: false,
    blur: 24,
    offsetX: 0,
    offsetY: 12,
    color: "rgba(0,0,0,0.35)",
    opacity: 0.35,
  },
  stroke: {
    enabled: false,
    width: 6,
    color: "#FFFFFF",
  },
};

const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  temperature: 0,
  tint: 0,
  sharpness: 0,
  vignette: 0,
  blur: 0,
  sepia: 0,
  invert: false,
  filterId: "none",
};

const DEFAULT_CUTOUT_CONFIG: CutoutConfig = {
  isCutoutActive: false,
  featherRadius: 0,
  sensitivity: 35,
  edgeSmooth: 2,
  edgeExpansion: 0,
  keepOriginalSubject: true,
};

const DEFAULT_ERASER_CONFIG: EraserConfig = {
  brushSize: 28,
  brushHardness: 80,
  mode: "erase",
  aiMode: false,
};

const DEFAULT_WATERMARK_CONFIG: WatermarkConfig = {
  mode: "brush",
  brushSize: 24,
};

const DEFAULT_ADD_WATERMARK_CONFIG: AddWatermarkConfig = {
  enabled: false,
  type: "text",
  text: "© 2026 版权所有 · 盗图必究",
  layout: "tile",
  position: "bottom-right",
  customX: 50,
  customY: 50,
  fontSize: 22,
  color: "#FFFFFF",
  opacity: 0.35,
  rotation: -30,
  gapX: 200,
  gapY: 140,
  imageScale: 0.5,
  hasShadow: true,
};

const DEFAULT_CROP_CONFIG: CropConfig = {
  aspectRatio: "free",
  rotation: 0,
  flipH: false,
  flipV: false,
};

export default function App() {
  // Main Image States
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [baseWorkingImageUrl, setBaseWorkingImageUrl] = useState<string | null>(null); // Post erase/watermark/crop
  const [cutoutDataUrl, setCutoutDataUrl] = useState<string | null>(null);
  const [displayImageUrl, setDisplayImageUrl] = useState<string | null>(null);

  // Active Tool & UI States
  const [activeTool, setActiveTool] = useState<ToolMode>("cutout");
  const [zoom, setZoom] = useState<number>(1);
  const [isCompareActive, setIsCompareActive] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingText, setProcessingText] = useState<string>("正在智能处理...");
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [hasDrawnMask, setHasDrawnMask] = useState<boolean>(false);

  // Tool Configurations
  const [cutoutConfig, setCutoutConfig] = useState<CutoutConfig>(DEFAULT_CUTOUT_CONFIG);
  const [eraserConfig, setEraserConfig] = useState<EraserConfig>(DEFAULT_ERASER_CONFIG);
  const [watermarkConfig, setWatermarkConfig] = useState<WatermarkConfig>(DEFAULT_WATERMARK_CONFIG);
  const [addWatermarkConfig, setAddWatermarkConfig] = useState<AddWatermarkConfig>(DEFAULT_ADD_WATERMARK_CONFIG);
  const [bgConfig, setBgConfig] = useState<BgConfig>(DEFAULT_BG_CONFIG);
  const [adjustments, setAdjustments] = useState<ImageAdjustments>(DEFAULT_ADJUSTMENTS);
  const [cropConfig, setCropConfig] = useState<CropConfig>(DEFAULT_CROP_CONFIG);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [stickers, setStickers] = useState<StickerElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<{ type: "text" | "sticker"; id: string } | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysisResult | null>(null);

  // Image Dimensions
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  // Undo / Redo History Stack (Full State Snapshots)
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  // Keep the stack/index in refs as well as state. Several tools can finish in
  // quick succession, and relying on a closed-over historyIndex would make
  // each new snapshot slice from the same old position (collapsing undo to the
  // first edit).
  const historyRef = useRef<HistorySnapshot[]>([]);
  const historyIndexRef = useRef(-1);

  // Mask drawing canvas ref
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const hiddenFileInputRef = useRef<HTMLInputElement | null>(null);
  const compositeRenderIdRef = useRef(0);

  // Save state snapshot for undo/redo
  const pushHistorySnapshot = useCallback(
    (title: string, overrides?: Partial<HistorySnapshot>) => {
      if (!baseWorkingImageUrl) return;

      const snapshot: HistorySnapshot = {
        id: "snap_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        title,
        timestamp: Date.now(),
        baseWorkingImageUrl,
        cutoutDataUrl,
        cutoutConfig,
        bgConfig,
        adjustments,
        cropConfig,
        textElements,
        stickers,
        addWatermarkConfig,
        imageDimensions,
        ...overrides,
      };

      const upToCurrent = historyRef.current.slice(0, historyIndexRef.current + 1);
      const appended = [...upToCurrent, snapshot];
      const newStack = appended.length > 30 ? appended.slice(-30) : appended;
      const newIndex = newStack.length - 1;

      historyRef.current = newStack;
      historyIndexRef.current = newIndex;
      setHistory(newStack);
      setHistoryIndex(newIndex);
    },
    [
      baseWorkingImageUrl,
      cutoutDataUrl,
      cutoutConfig,
      bgConfig,
      adjustments,
      cropConfig,
      textElements,
      stickers,
      addWatermarkConfig,
      imageDimensions,
    ]
  );

  // Parameter-only edits must also be first-class undo steps. Previously the
  // UI updated the background immediately but never appended it to history,
  // so Undo skipped all color choices and jumped back to the cutout/import.
  const handleUpdateBgConfig = useCallback(
    (cfg: Partial<BgConfig>) => {
      const nextBgConfig: BgConfig = { ...bgConfig, ...cfg };
      if (JSON.stringify(nextBgConfig) === JSON.stringify(bgConfig)) return;

      setBgConfig(nextBgConfig);
      const title =
        nextBgConfig.type === "transparent"
          ? "切换透明背景"
          : nextBgConfig.type === "color"
            ? `更换背景色 ${nextBgConfig.color.toUpperCase()}`
            : nextBgConfig.type === "gradient"
              ? "更换渐变背景"
              : "更换场景背景";
      pushHistorySnapshot(title, { bgConfig: nextBgConfig });
    },
    [bgConfig, pushHistorySnapshot]
  );

  // Load a new image file
  const handleLoadImage = (fileOrUrl: File | string, titleHint?: string) => {
    setIsProcessing(true);
    setProcessingText("正在导入图片并校准色彩通道...");

    const finishLoad = (dataUrl: string) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const dims = {
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
        };
        setImageDimensions(dims);
        setOriginalImageUrl(dataUrl);
        setBaseWorkingImageUrl(dataUrl);
        setCutoutDataUrl(null);
        setDisplayImageUrl(dataUrl);
        setCutoutConfig(DEFAULT_CUTOUT_CONFIG);
        setBgConfig(DEFAULT_BG_CONFIG);
        setAdjustments(DEFAULT_ADJUSTMENTS);
        setCropConfig(DEFAULT_CROP_CONFIG);
        setTextElements([]);
        setStickers([]);
        setAddWatermarkConfig(DEFAULT_ADD_WATERMARK_CONFIG);
        setAiAnalysis(null);
        setZoom(1);

        const initialSnapshot: HistorySnapshot = {
          id: "snap_init_" + Date.now(),
          title: titleHint || "导入原始图片",
          timestamp: Date.now(),
          baseWorkingImageUrl: dataUrl,
          cutoutDataUrl: null,
          cutoutConfig: DEFAULT_CUTOUT_CONFIG,
          bgConfig: DEFAULT_BG_CONFIG,
          adjustments: DEFAULT_ADJUSTMENTS,
          cropConfig: DEFAULT_CROP_CONFIG,
          textElements: [],
          stickers: [],
          addWatermarkConfig: DEFAULT_ADD_WATERMARK_CONFIG,
          imageDimensions: dims,
        };

        historyRef.current = [initialSnapshot];
        historyIndexRef.current = 0;
        setHistory([initialSnapshot]);
        setHistoryIndex(0);
        setIsProcessing(false);
        clearMaskCanvas();
      };
      img.onerror = () => {
        setIsProcessing(false);
      };
      img.src = dataUrl;
    };

    if (typeof fileOrUrl === "string") {
      // If it's an external url, load into an offscreen image to convert to dataUrl
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth || img.width;
        c.height = img.naturalHeight || img.height;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        finishLoad(c.toDataURL("image/png"));
      };
      img.src = fileOrUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          finishLoad(e.target.result as string);
        }
      };
      reader.readAsDataURL(fileOrUrl);
    }
  };

  // Clear mask canvas
  const clearMaskCanvas = () => {
    if (maskCanvasRef.current) {
      const ctx = maskCanvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
      }
    }
    setHasDrawnMask(false);
  };

  // Re-composite whenever cutout, background, adjustments, text, or stickers change
  const refreshCompositeView = useCallback(async () => {
    if (!baseWorkingImageUrl) return;
    const renderId = ++compositeRenderIdRef.current;

    try {
      let subjectToRender = cutoutConfig.isCutoutActive && cutoutDataUrl ? cutoutDataUrl : baseWorkingImageUrl;
      if (cutoutConfig.isCutoutActive && cutoutDataUrl && cutoutConfig.maskDataUrl) subjectToRender = await updateCutoutEdges(cutoutDataUrl, cutoutConfig.maskDataUrl, cutoutConfig.featherRadius, cutoutConfig.edgeExpansion);

      // 1. Apply adjustments and filters if any
      const adjusted = await applyAdjustmentsAndFilters(subjectToRender, adjustments);

      // 2. Composite background if cutout active
      if (cutoutConfig.isCutoutActive) {
        const composite = await renderCompositeCanvas(
          adjusted,
          bgConfig,
          textElements,
          stickers,
          addWatermarkConfig,
          1
        );
        if (renderId === compositeRenderIdRef.current) setDisplayImageUrl(composite.toDataURL("image/png"));
      } else {
        // If not cutout, check if text/stickers/watermark exist
        if (textElements.length > 0 || stickers.length > 0 || addWatermarkConfig.enabled) {
          const comp = await renderCompositeCanvas(
            adjusted,
            { ...bgConfig, type: "transparent" },
            textElements,
            stickers,
            addWatermarkConfig,
            1
          );
          if (renderId === compositeRenderIdRef.current) setDisplayImageUrl(comp.toDataURL("image/png"));
        } else {
          if (renderId === compositeRenderIdRef.current) setDisplayImageUrl(adjusted);
        }
      }
    } catch (err) {
      console.error("Composite render failed:", err);
    }
  }, [
    baseWorkingImageUrl,
    cutoutConfig.isCutoutActive,
    cutoutConfig.maskDataUrl,
    cutoutConfig.featherRadius,
    cutoutConfig.edgeExpansion,
    cutoutDataUrl,
    adjustments,
    bgConfig,
    textElements,
    stickers,
    addWatermarkConfig,
  ]);

  useEffect(() => {
    refreshCompositeView();
  }, [refreshCompositeView]);

  // 1. 一键抠图 (AI Cutout)
  const handleApplyCutout = async (overrideSensitivity?: number, overrideFeather?: number) => {
    if (!baseWorkingImageUrl) return;
    setIsProcessing(true);
    setProcessingText("正在进行发丝级智能边缘分割与抠图 (去背景)...");

    const targetSensitivity =
      typeof overrideSensitivity === "number" && !isNaN(overrideSensitivity)
        ? overrideSensitivity
        : (typeof cutoutConfig.sensitivity === "number" ? cutoutConfig.sensitivity : 40);

    const targetFeather =
      typeof overrideFeather === "number" && !isNaN(overrideFeather)
        ? overrideFeather
        : (typeof cutoutConfig.featherRadius === "number" ? cutoutConfig.featherRadius : 2);

    try {
      // Automatically switch to transparent background so transparent checkerboard displays immediately
      const nextBgConfig: BgConfig = { ...bgConfig, type: "transparent" };
      setBgConfig(nextBgConfig);

      const { cutoutDataUrl: newCutout, maskDataUrl: newMask } = await removeBackgroundSmart(baseWorkingImageUrl, {
        sensitivity: targetSensitivity,
        featherRadius: targetFeather,
        edgeSmooth: typeof cutoutConfig.edgeSmooth === "number" ? cutoutConfig.edgeSmooth : 2,
        edgeExpansion: typeof cutoutConfig.edgeExpansion === "number" ? cutoutConfig.edgeExpansion : 0,
      });

      const nextCutoutConfig: CutoutConfig = {
        ...cutoutConfig,
        isCutoutActive: true,
        sensitivity: targetSensitivity,
        featherRadius: targetFeather,
        maskDataUrl: newMask,
      };

      setCutoutDataUrl(newCutout);
      setCutoutConfig(nextCutoutConfig);
      pushHistorySnapshot("智能一键抠图", {
        cutoutDataUrl: newCutout,
        cutoutConfig: nextCutoutConfig,
        bgConfig: nextBgConfig,
      });
    } catch (err) {
      console.error("Cutout error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // 恢复未抠图原图
  const handleRestoreOriginal = () => {
    const nextCutoutConfig: CutoutConfig = { ...cutoutConfig, isCutoutActive: false };
    setCutoutConfig(nextCutoutConfig);
    setCutoutDataUrl(null);
    pushHistorySnapshot("恢复未抠图原图", {
      cutoutDataUrl: null,
      cutoutConfig: nextCutoutConfig,
    });
  };

  // 2. 智能消除笔 (Magic Eraser)
  const handleApplyErase = async () => {
    if (!baseWorkingImageUrl || !maskCanvasRef.current) return;
    const editingCutout = cutoutConfig.isCutoutActive && !!cutoutDataUrl;
    const eraseSource = editingCutout ? cutoutDataUrl! : baseWorkingImageUrl;
    setIsProcessing(true);
    setProcessingText("极速 PatchMatch 正在延续周边材质与纹理...");

    try {
      // Always use the local PatchMatch engine. It preserves transparent
      // cutouts and never sends the image to Gemini.
      const inpainted = await inpaintArea(eraseSource, maskCanvasRef.current, {
        iterations: 6,
        patchRadius: 16,
      });

      if (editingCutout) {
        setCutoutDataUrl(inpainted);
        pushHistorySnapshot("透明主体智能消除区域", {
          cutoutDataUrl: inpainted,
          cutoutConfig,
        });
      } else {
        setBaseWorkingImageUrl(inpainted);
        setCutoutDataUrl(null);
        const nextCutoutConfig: CutoutConfig = { ...cutoutConfig, isCutoutActive: false };
        setCutoutConfig(nextCutoutConfig);
        pushHistorySnapshot("智能消除区域", {
          baseWorkingImageUrl: inpainted,
          cutoutDataUrl: null,
          cutoutConfig: nextCutoutConfig,
        });
      }
      clearMaskCanvas();
    } catch (err) {
      console.error("Inpaint erase error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. 智能去水印 (Watermark Removal)
  const handleApplyWatermarkRemoval = async () => {
    if (!baseWorkingImageUrl || !maskCanvasRef.current) return;
    setIsProcessing(true);
    setProcessingText("仅处理水印 mask，正在复用周边原有纹理、颗粒、色彩与光影...");

    try {
      const inpainted = await inpaintArea(baseWorkingImageUrl, maskCanvasRef.current, {
        iterations: 5,
        patchRadius: 16,
      });

      setBaseWorkingImageUrl(inpainted);
      setCutoutDataUrl(null);
      const nextCutoutConfig: CutoutConfig = { ...cutoutConfig, isCutoutActive: false };
      setCutoutConfig(nextCutoutConfig);
      pushHistorySnapshot("智能去水印", {
        baseWorkingImageUrl: inpainted,
        cutoutDataUrl: null,
        cutoutConfig: nextCutoutConfig,
      });
      clearMaskCanvas();
    } catch (err) {
      console.error("Watermark removal error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAutoWatermarkRemoval = async () => {
    if (!baseWorkingImageUrl) return;
    const editingCutout = cutoutConfig.isCutoutActive && !!cutoutDataUrl;
    const source = editingCutout ? cutoutDataUrl! : baseWorkingImageUrl;
    setIsProcessing(true);
    setProcessingText("正在识别水印文字，仅在检测 mask 内复用周边原有纹理...");
    try {
      const autoMask = await detectRepeatedWatermarkMask(source);
      const cleaned = await inpaintArea(source, autoMask, { iterations: 5, patchRadius: 20 });
      if (editingCutout) {
        setCutoutDataUrl(cleaned);
        pushHistorySnapshot("一键识别并去除全图水印", { cutoutDataUrl: cleaned, cutoutConfig });
      } else {
        setBaseWorkingImageUrl(cleaned);
        pushHistorySnapshot("一键识别并去除全图水印", { baseWorkingImageUrl: cleaned });
      }
    } catch (err) {
      console.error("Auto watermark removal error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // 1-Click Preset Corner Watermark Box
  const handleApplyPresetCorner = async (
    corner: "bottom-right" | "bottom-left" | "top-right" | "top-left" | "center",
    instantRemove: boolean = false
  ) => {
    if (!maskCanvasRef.current || !imageDimensions.width) return;
    const w = imageDimensions.width;
    const h = imageDimensions.height;
    const maskCanvas = maskCanvasRef.current;
    maskCanvas.width = w;
    maskCanvas.height = h;
    const ctx = maskCanvas.getContext("2d");
    if (!ctx) return;

    clearMaskCanvas();
    ctx.fillStyle = "rgba(239, 68, 68, 0.85)";

    if (corner === "bottom-right") {
      ctx.fillRect(w * 0.68, h * 0.86, w * 0.31, h * 0.13);
    } else if (corner === "bottom-left") {
      ctx.fillRect(w * 0.01, h * 0.86, w * 0.31, h * 0.13);
    } else if (corner === "top-right") {
      ctx.fillRect(w * 0.68, h * 0.01, w * 0.31, h * 0.13);
    } else if (corner === "top-left") {
      ctx.fillRect(w * 0.01, h * 0.01, w * 0.31, h * 0.13);
    } else if (corner === "center") {
      ctx.fillRect(w * 0.25, h * 0.35, w * 0.5, h * 0.3);
    }
    setHasDrawnMask(true);

    if (instantRemove) {
      // Small timeout to allow canvas buffer to commit before inpainting
      setTimeout(() => {
        handleApplyWatermarkRemoval();
      }, 50);
    }
  };

  // AI Subject Analysis
  const handleRunAiAnalyze = async () => {
    if (!baseWorkingImageUrl) return;
    setIsProcessing(true);
    setProcessingText("Gemini 正在分析图像主体特征与推荐修图方案...");

    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: baseWorkingImageUrl }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAiAnalysis(data.data);
      }
    } catch (err) {
      console.error("AI Analyze error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // AI Generate Background
  const handleGenerateAiBackground = async (prompt: string, style: string) => {
    setIsProcessing(true);
    setProcessingText("Gemini 正在生成商业摄影级定制背景场景...");

    try {
      const res = await fetch("/api/ai/generate-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `场景生成失败 (${res.status})`);
      if (data.success && data.imageUrl) {
        // Cut the subject out first. handleApplyCutout intentionally switches
        // the canvas to transparent, so applying the generated background
        // before it caused the new scene to be overwritten immediately.
        if (!cutoutConfig.isCutoutActive) {
          await handleApplyCutout();
        }
        setBgConfig((prev) => ({
          ...prev,
          type: "image",
          imageUrl: data.imageUrl,
        }));
        if (data.source === "studio-render") {
          console.info("AI 场景服务不可用，已按场景描述关键词使用本地背景渲染。");
        }
        return;
      }
      throw new Error(data?.message || "未获得有效的场景图片");
    } catch (err) {
      console.error("AI BG Generate error:", err);
      window.alert(err instanceof Error ? err.message : "AI 场景生成失败，请稍后重试");
    } finally {
      setIsProcessing(false);
    }
  };

  // Upload Custom Background Image
  const handleUploadBgImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setBgConfig((prev) => ({
          ...prev,
          type: "image",
          imageUrl: e.target?.result as string,
        }));
        if (!cutoutConfig.isCutoutActive) {
          handleApplyCutout();
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // AI Auto Enhance / Color Tone
  const handleAutoEnhance = () => {
    const nextAdjustments: ImageAdjustments = {
      brightness: 8,
      contrast: 12,
      saturation: 15,
      temperature: 4,
      tint: 0,
      sharpness: 20,
      vignette: 10,
      blur: 0,
      sepia: 0,
      invert: false,
      filterId: "natural",
    };
    setAdjustments(nextAdjustments);
    pushHistorySnapshot("一键画质色彩增强", {
      adjustments: nextAdjustments,
    });
  };

  // Helper function to rotate an image data URL
  const rotateImageDataUrl = (imgSrc: string, direction: "cw" | "ccw"): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalHeight || img.height;
        c.height = img.naturalWidth || img.width;
        const ctx = c.getContext("2d")!;
        ctx.translate(c.width / 2, c.height / 2);
        ctx.rotate((direction === "cw" ? 90 : -90) * (Math.PI / 180));
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        resolve(c.toDataURL("image/png"));
      };
      img.src = imgSrc;
    });
  };

  // Helper function to flip an image data URL
  const flipImageDataUrl = (imgSrc: string, axis: "h" | "v"): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth || img.width;
        c.height = img.naturalHeight || img.height;
        const ctx = c.getContext("2d")!;
        ctx.translate(axis === "h" ? c.width : 0, axis === "v" ? c.height : 0);
        ctx.scale(axis === "h" ? -1 : 1, axis === "v" ? -1 : 1);
        ctx.drawImage(img, 0, 0);
        resolve(c.toDataURL("image/png"));
      };
      img.src = imgSrc;
    });
  };

  // Helper function to crop an image data URL to a target aspect ratio
  const cropImageDataUrl = (
    imgSrc: string,
    targetRatio: number
  ): Promise<{ dataUrl: string; width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const origW = img.naturalWidth || img.width;
        const origH = img.naturalHeight || img.height;
        const currentRatio = origW / origH;

        let cropW = origW;
        let cropH = origH;
        let cropX = 0;
        let cropY = 0;

        if (currentRatio > targetRatio) {
          cropW = origH * targetRatio;
          cropX = (origW - cropW) / 2;
        } else {
          cropH = origW / targetRatio;
          cropY = (origH - cropH) / 2;
        }

        const c = document.createElement("canvas");
        c.width = Math.round(cropW);
        c.height = Math.round(cropH);
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, c.width, c.height);
        resolve({
          dataUrl: c.toDataURL("image/png"),
          width: c.width,
          height: c.height,
        });
      };
      img.src = imgSrc;
    });
  };

  // Rotate 90 deg
  const handleRotate90 = async (direction: "cw" | "ccw") => {
    if (!baseWorkingImageUrl) return;
    setIsProcessing(true);
    setProcessingText("正在旋转画布并重新映射坐标...");

    try {
      const rotatedBase = await rotateImageDataUrl(baseWorkingImageUrl, direction);
      let rotatedCutout: string | null = null;
      if (cutoutDataUrl) {
        rotatedCutout = await rotateImageDataUrl(cutoutDataUrl, direction);
      }

      const nextDims = { width: imageDimensions.height, height: imageDimensions.width };
      setBaseWorkingImageUrl(rotatedBase);
      if (rotatedCutout) setCutoutDataUrl(rotatedCutout);
      setImageDimensions(nextDims);
      pushHistorySnapshot(direction === "cw" ? "顺时针旋转 90°" : "逆时针旋转 90°", {
        baseWorkingImageUrl: rotatedBase,
        cutoutDataUrl: rotatedCutout,
        imageDimensions: nextDims,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Flip Horizontal / Vertical
  const handleFlip = async (axis: "h" | "v") => {
    if (!baseWorkingImageUrl) return;

    const flippedBase = await flipImageDataUrl(baseWorkingImageUrl, axis);
    let flippedCutout: string | null = null;
    if (cutoutDataUrl) {
      flippedCutout = await flipImageDataUrl(cutoutDataUrl, axis);
    }

    setBaseWorkingImageUrl(flippedBase);
    if (flippedCutout) setCutoutDataUrl(flippedCutout);
    pushHistorySnapshot(axis === "h" ? "水平镜像翻转" : "垂直镜像翻转", {
      baseWorkingImageUrl: flippedBase,
      cutoutDataUrl: flippedCutout,
    });
  };

  // Crop Ratio / ID Photo Specs Preset Adjuster
  const handleApplyCropRatio = (ratio: string) => {
    const imgW = imageDimensions.width || 1000;
    const imgH = imageDimensions.height || 1000;
    const imgAspect = imgW / imgH;

    let targetRatio = 1;
    const officialPixels: Record<string, { width: number; height: number }> = {
      id_1: { width: 295, height: 413 },
      id_2: { width: 413, height: 579 },
      id_large_1: { width: 390, height: 567 },
      id_small_2: { width: 413, height: 531 },
    };
    if (ratio === "1:1") targetRatio = 1;
    else if (ratio === "4:3") targetRatio = 4 / 3;
    else if (ratio === "3:4") targetRatio = 3 / 4;
    else if (ratio === "id_1") targetRatio = 25 / 35;
    else if (ratio === "id_2") targetRatio = 35 / 49;
    else if (ratio === "id_large_1") targetRatio = 33 / 48;
    else if (ratio === "id_small_2") targetRatio = 35 / 45;
    else if (ratio === "16:9") targetRatio = 16 / 9;
    else if (ratio === "9:16") targetRatio = 9 / 16;
    else {
      // Free form
      setCropConfig((prev) => ({
        ...prev,
        aspectRatio: "free",
        cropRect: prev.cropRect || { x: 5, y: 5, width: 90, height: 90 },
      }));
      return;
    }

    let wPercent = 90;
    let hPercent = 90;

    if (imgAspect > targetRatio) {
      // Image is wider than target crop
      hPercent = 90;
      const targetPxH = (hPercent / 100) * imgH;
      const targetPxW = targetPxH * targetRatio;
      wPercent = Math.min(95, (targetPxW / imgW) * 100);
    } else {
      // Image is taller than target crop
      wPercent = 90;
      const targetPxW = (wPercent / 100) * imgW;
      const targetPxH = targetPxW / targetRatio;
      hPercent = Math.min(95, (targetPxH / imgH) * 100);
    }

    const nextRect = {
      x: Math.max(0, (100 - wPercent) / 2),
      y: Math.max(0, (100 - hPercent) / 2),
      width: Math.min(100, wPercent),
      height: Math.min(100, hPercent),
    };

    setCropConfig((prev) => ({
      ...prev,
      aspectRatio: ratio,
      cropRect: nextRect,
      outputWidth: officialPixels[ratio]?.width,
      outputHeight: officialPixels[ratio]?.height,
    }));
  };

  // Confirm Apply Current Free/Fixed Crop Rect
  const handleApplyCurrentCrop = async () => {
    if (!baseWorkingImageUrl) return;
    const cropRect = cropConfig.cropRect || { x: 5, y: 5, width: 90, height: 90 };

    setIsProcessing(true);
    setProcessingText("正在精准裁切图片并重新生成像素矩阵...");

    try {
      const officialSize = cropConfig.outputWidth && cropConfig.outputHeight
        ? { width: cropConfig.outputWidth, height: cropConfig.outputHeight }
        : undefined;
      const baseResult = await cropImageByRect(baseWorkingImageUrl, cropRect, officialSize);
      let croppedCutout: string | null = null;
      if (cutoutDataUrl) {
        const cutoutResult = await cropImageByRect(cutoutDataUrl, cropRect, officialSize);
        croppedCutout = cutoutResult.dataUrl;
      }

      const nextDims = { width: baseResult.width, height: baseResult.height };
      setBaseWorkingImageUrl(baseResult.dataUrl);
      if (croppedCutout) setCutoutDataUrl(croppedCutout);
      setImageDimensions(nextDims);

      const resetRect = { x: 5, y: 5, width: 90, height: 90 };
      setCropConfig((prev) => ({ ...prev, cropRect: resetRect, aspectRatio: "free", outputWidth: undefined, outputHeight: undefined }));

      pushHistorySnapshot("应用自定义构图裁剪", {
        baseWorkingImageUrl: baseResult.dataUrl,
        cutoutDataUrl: croppedCutout,
        imageDimensions: nextDims,
      });
    } catch (err) {
      console.error("Crop error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset Crop Box
  const handleResetCropBox = () => {
    setCropConfig((prev) => ({
      ...prev,
      aspectRatio: "free",
      cropRect: { x: 5, y: 5, width: 90, height: 90 },
      outputWidth: undefined,
      outputHeight: undefined,
    }));
  };

  // Add Text Element
  const handleAddText = (text: string, color: string, bgColor?: string) => {
    const newElem: TextElement = {
      id: "text_" + Date.now(),
      text,
      x: 50,
      y: 85,
      fontSize: 32,
      color,
      bgColor,
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontWeight: "bold",
      hasShadow: true,
      hasBorder: true,
      rotation: 0,
    };
    setTextElements((prev) => {
      const next = [...prev, newElem];
      pushHistorySnapshot("添加文字元素", { textElements: next });
      return next;
    });
  };

  // Add Sticker
  const handleAddSticker = (badgeType: StickerElement["badgeType"], title: string) => {
    const newSticker: StickerElement = {
      id: "sticker_" + Date.now(),
      title,
      badgeType,
      x: 20 + Math.random() * 20,
      y: 20 + Math.random() * 20,
      scale: 1,
      rotation: -5 + Math.random() * 10,
    };
    setStickers((prev) => {
      const next = [...prev, newSticker];
      pushHistorySnapshot("添加贴纸标识", { stickers: next });
      return next;
    });
  };

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      const snap = history[prevIdx];
      if (snap) {
        setHistoryIndex(prevIdx);
        historyIndexRef.current = prevIdx;
        setBaseWorkingImageUrl(snap.baseWorkingImageUrl);
        setCutoutDataUrl(snap.cutoutDataUrl);
        setCutoutConfig(snap.cutoutConfig);
        setBgConfig(snap.bgConfig);
        setAdjustments(snap.adjustments);
        setCropConfig(snap.cropConfig);
        setTextElements(snap.textElements);
        setStickers(snap.stickers);
        setAddWatermarkConfig(snap.addWatermarkConfig);
        setImageDimensions(snap.imageDimensions);
        clearMaskCanvas();
      }
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      const snap = history[nextIdx];
      if (snap) {
        setHistoryIndex(nextIdx);
        historyIndexRef.current = nextIdx;
        setBaseWorkingImageUrl(snap.baseWorkingImageUrl);
        setCutoutDataUrl(snap.cutoutDataUrl);
        setCutoutConfig(snap.cutoutConfig);
        setBgConfig(snap.bgConfig);
        setAdjustments(snap.adjustments);
        setCropConfig(snap.cropConfig);
        setTextElements(snap.textElements);
        setStickers(snap.stickers);
        setAddWatermarkConfig(snap.addWatermarkConfig);
        setImageDimensions(snap.imageDimensions);
        clearMaskCanvas();
      }
    }
  }, [history, historyIndex]);

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(4, prev + 0.2));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.2, prev - 0.2));
  const handleZoomFit = () => setZoom(1);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        handleRedo();
      } else if (e.key === " " && !e.repeat) {
        setIsCompareActive(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === " ") {
        setIsCompareActive(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [historyIndex, history]);

  // High Resolution Export Handler
  const handleExport = async (
    format: "png" | "jpeg" | "webp",
    quality: number,
    scale: number,
    forceTransparentCutout: boolean = false
  ) => {
    if (!baseWorkingImageUrl) return;

    try {
      const isCutout = cutoutConfig.isCutoutActive && !!cutoutDataUrl;
      const subjectToRender = isCutout ? cutoutDataUrl : baseWorkingImageUrl;
      const adjusted = await applyAdjustmentsAndFilters(subjectToRender, adjustments);

      const effectiveBg: BgConfig = forceTransparentCutout
        ? { ...DEFAULT_BG_CONFIG, type: "transparent", shadow: { ...DEFAULT_BG_CONFIG.shadow, enabled: false }, stroke: { ...DEFAULT_BG_CONFIG.stroke, enabled: false } }
        : isCutout
          ? bgConfig
          : { ...bgConfig, type: "transparent" };

      const canvas = await renderCompositeCanvas(
        adjusted,
        effectiveBg,
        textElements,
        stickers,
        addWatermarkConfig,
        scale,
        format === "jpeg"
      );

      const mime = format === "png" ? "image/png" : format === "jpeg" ? "image/jpeg" : "image/webp";
      const dataUrl = canvas.toDataURL(mime, quality);

      // Trigger browser download
      const link = document.createElement("a");
      link.download = `${forceTransparentCutout ? "magicphoto_cutout_transparent" : "magicphoto"}_${Date.now()}.${format === "jpeg" ? "jpg" : format}`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  // Tool Names for status
  const toolNameMap: Record<ToolMode, string> = {
    cutout: "一键抠图",
    eraser: "智能消除笔",
    watermark: "智能去水印",
    add_watermark: "添加防盗水印",
    background: "更换背景底色",
    adjust: "滤镜调色",
    crop: "裁剪旋转",
    sticker: "文字贴纸",
    ai_studio: "AI场景生图",
  };

  // Return to Landing / Home Page
  const handleGoHome = () => {
    setDisplayImageUrl(null);
    setBaseWorkingImageUrl(null);
    setOriginalImageUrl(null);
    setCutoutDataUrl(null);
    setCutoutConfig(DEFAULT_CUTOUT_CONFIG);
    setBgConfig(DEFAULT_BG_CONFIG);
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setCropConfig(DEFAULT_CROP_CONFIG);
    setTextElements([]);
    setStickers([]);
    setSelectedElement(null);
    setAddWatermarkConfig(DEFAULT_ADD_WATERMARK_CONFIG);
    clearMaskCanvas();
    historyRef.current = [];
    historyIndexRef.current = -1;
    setHistory([]);
    setHistoryIndex(-1);
    setHasDrawnMask(false);
    setAiAnalysis(null);
    setZoom(1);
    setIsCompareActive(false);
  };

  // Direct 1-Click Transparent PNG Download
  const handleDirectDownloadTransparentPng = async () => {
    if (!cutoutConfig.isCutoutActive || !cutoutDataUrl) {
      window.alert("请先完成一键抠图，再保存透明底 PNG。");
      return;
    }
    await handleExport("png", 1, 1, true);
  };

  const isCutoutActive = cutoutConfig.isCutoutActive && !!cutoutDataUrl;
  const isTransparentBg = bgConfig.type === "transparent";

  return (
    <div id="magic-photo-studio-app" className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Hidden File Input */}
      <input
        ref={hiddenFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleLoadImage(e.target.files[0]);
          }
        }}
      />

      {/* Top Header */}
      <Header
        hasImage={!!displayImageUrl}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        undoTitle={historyIndex > 0 ? history[historyIndex]?.title : undefined}
        redoTitle={historyIndex < history.length - 1 ? history[historyIndex + 1]?.title : undefined}
        zoom={zoom}
        isCompareActive={isCompareActive}
        isProcessing={isProcessing}
        isCutoutActive={isCutoutActive && isTransparentBg}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomFit={handleZoomFit}
        onToggleCompare={() => setIsCompareActive((prev) => !prev)}
        onOpenExport={() => setIsExportOpen(true)}
        onGoHome={handleGoHome}
        onReset={() => {
          if (originalImageUrl) {
            setBaseWorkingImageUrl(originalImageUrl);
            setCutoutConfig(DEFAULT_CUTOUT_CONFIG);
            setBgConfig(DEFAULT_BG_CONFIG);
            setAdjustments(DEFAULT_ADJUSTMENTS);
            setCropConfig(DEFAULT_CROP_CONFIG);
            setTextElements([]);
            setStickers([]);
            setAddWatermarkConfig(DEFAULT_ADD_WATERMARK_CONFIG);
            setCutoutDataUrl(null);
            clearMaskCanvas();
            pushHistorySnapshot("重置为原始照片", {
              baseWorkingImageUrl: originalImageUrl,
              cutoutDataUrl: null,
              cutoutConfig: DEFAULT_CUTOUT_CONFIG,
              bgConfig: DEFAULT_BG_CONFIG,
              adjustments: DEFAULT_ADJUSTMENTS,
              cropConfig: DEFAULT_CROP_CONFIG,
              textElements: [],
              stickers: [],
              addWatermarkConfig: DEFAULT_ADD_WATERMARK_CONFIG,
            });
          }
        }}
        imageDimensions={imageDimensions}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Toolbar */}
        <Toolbar
          activeTool={activeTool}
          onSelectTool={(tool) => {
            setActiveTool(tool);
            clearMaskCanvas();
          }}
          disabled={!displayImageUrl && activeTool !== "cutout"}
        />

        {/* Center Canvas Area */}
        <CanvasArea
          currentImageUrl={displayImageUrl}
          originalImageUrl={originalImageUrl}
          activeTool={activeTool}
          zoom={zoom}
          isCompareActive={isCompareActive}
          isProcessing={isProcessing}
          processingText={processingText}
          eraserConfig={eraserConfig}
          watermarkConfig={watermarkConfig}
          cropConfig={cropConfig}
          imageDimensions={imageDimensions}
          textElements={textElements}
          stickers={stickers}
          selectedElement={selectedElement}
          maskCanvasRef={maskCanvasRef}
          onSelectElement={(type, id) => setSelectedElement(id ? { type, id } : null)}
          onUpdateTextElement={(id, partial) =>
            setTextElements((prev) => prev.map((item) => item.id === id ? { ...item, ...partial } : item))
          }
          onUpdateStickerElement={(id, partial) =>
            setStickers((prev) => prev.map((item) => item.id === id ? { ...item, ...partial } : item))
          }
          onRemoveText={(id) => {
            setTextElements((prev) => prev.filter((item) => item.id !== id));
            setSelectedElement(null);
          }}
          onRemoveSticker={(id) => {
            setStickers((prev) => prev.filter((item) => item.id !== id));
            setSelectedElement(null);
          }}
          onMaskUpdated={() => setHasDrawnMask(true)}
          onUpdateCropConfig={(cfg) => setCropConfig((prev) => ({ ...prev, ...cfg }))}
          onApplyCurrentCrop={handleApplyCurrentCrop}
          onResetCropBox={handleResetCropBox}
          onClearImage={handleGoHome}
          onFileUpload={handleLoadImage}
          onSelectSample={(sample: SampleImage) => {
            handleLoadImage(sample.url, sample.title);
            setActiveTool(sample.recommendedTool);
          }}
        />

        {/* Right Parameters & Controls Panel */}
        <RightPanel
          activeTool={activeTool}
          isProcessing={isProcessing}
          hasImage={!!displayImageUrl}
          hasMask={hasDrawnMask}
          cutoutConfig={cutoutConfig}
          eraserConfig={eraserConfig}
          watermarkConfig={watermarkConfig}
          addWatermarkConfig={addWatermarkConfig}
          bgConfig={bgConfig}
          adjustments={adjustments}
          cropConfig={cropConfig}
          imageDimensions={imageDimensions}
          textElements={textElements}
          stickers={stickers}
          aiAnalysis={aiAnalysis}
          onApplyCutout={handleApplyCutout}
          onRestoreOriginal={handleRestoreOriginal}
          onUpdateCutoutConfig={(cfg) => setCutoutConfig((prev) => ({ ...prev, ...cfg }))}
          onUpdateEraserConfig={(cfg) => setEraserConfig((prev) => ({ ...prev, ...cfg }))}
          onApplyErase={handleApplyErase}
          onClearMask={clearMaskCanvas}
          onUpdateWatermarkConfig={(cfg) => setWatermarkConfig((prev) => ({ ...prev, ...cfg }))}
          onUpdateAddWatermarkConfig={setAddWatermarkConfig}
          onApplyWatermarkRemoval={handleApplyWatermarkRemoval}
          onAutoWatermarkRemoval={handleAutoWatermarkRemoval}
          onApplyPresetCorner={handleApplyPresetCorner}
          onUpdateBgConfig={handleUpdateBgConfig}
          onUploadBgImage={handleUploadBgImage}
          onTriggerCutoutIfNeeded={handleApplyCutout}
          onUpdateAdjustments={(adj) => setAdjustments((prev) => ({ ...prev, ...adj }))}
          onResetAdjustments={() => {
            setAdjustments(DEFAULT_ADJUSTMENTS);
            pushHistorySnapshot("重置调色参数", { adjustments: DEFAULT_ADJUSTMENTS });
          }}
          onAutoEnhance={handleAutoEnhance}
          onUpdateCropConfig={(cfg) => setCropConfig((prev) => ({ ...prev, ...cfg }))}
          onRotate90={handleRotate90}
          onFlip={handleFlip}
          onApplyCropRatio={handleApplyCropRatio}
          onApplyCurrentCrop={handleApplyCurrentCrop}
          onResetCropBox={handleResetCropBox}
          onAddText={handleAddText}
          onAddSticker={handleAddSticker}
          onRemoveText={(id) => {
            setTextElements((prev) => {
              const next = prev.filter((t) => t.id !== id);
              pushHistorySnapshot("删除文字图层", { textElements: next });
              return next;
            });
          }}
          onRemoveSticker={(id) => {
            setStickers((prev) => {
              const next = prev.filter((s) => s.id !== id);
              pushHistorySnapshot("删除贴纸图层", { stickers: next });
              return next;
            });
          }}
          onRunAiAnalyze={handleRunAiAnalyze}
          onDownloadTransparentPng={handleDirectDownloadTransparentPng}
        />
      </div>

      {/* Bottom Status & Sample Switcher Bar */}
      <BottomBar
        hasImage={!!displayImageUrl}
        onSelectSample={(sample: SampleImage) => {
          handleLoadImage(sample.url, sample.title);
          setActiveTool(sample.recommendedTool);
        }}
        activeToolName={toolNameMap[activeTool] || "修图"}
      />

      {/* High Resolution Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onExport={handleExport}
        dimensions={imageDimensions}
        isCutoutActive={isCutoutActive}
        isTransparentBg={isTransparentBg}
      />
    </div>
  );
}
