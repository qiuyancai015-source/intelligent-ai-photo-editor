import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  ToolMode,
  EraserConfig,
  WatermarkConfig,
  CropConfig,
  CropRect,
  TextElement,
  StickerElement,
} from "../types";
import {
  Upload,
  Sparkles,
  Image as ImageIcon,
  Eye,
  Scissors,
  RotateCcw,
  Check,
  RotateCw,
  Trash2,
  Maximize2,
} from "lucide-react";
import { SAMPLE_IMAGES, SampleImage } from "../utils/sampleImages";

const BADGE_BG_MAP: Record<string, string> = {
  hot: "bg-red-500",
  new: "bg-emerald-500",
  authentic: "bg-blue-500",
  discount: "bg-amber-500",
  sale: "bg-pink-500",
  verified: "bg-indigo-500",
  ai: "bg-purple-600",
};

const TransformHandles: React.FC<{
  type: "text" | "sticker";
  id: string;
  onDown: (type: "text" | "sticker", id: string, action: "move" | "scale" | "rotate", e: React.MouseEvent) => void;
  onRemove: () => void;
}> = ({ type, id, onDown, onRemove }) => (
  <>
    <button type="button" title="拖动缩放" aria-label="拖动缩放"
      className="absolute -right-5 -bottom-5 w-7 h-7 rounded-full bg-white border-2 border-indigo-500 text-indigo-600 shadow-lg cursor-nwse-resize flex items-center justify-center"
      onMouseDown={(e) => onDown(type, id, "scale", e)}><Maximize2 className="w-4 h-4" /></button>
    <button type="button" title="拖动旋转" aria-label="拖动旋转"
      className="absolute left-1/2 -translate-x-1/2 -top-12 w-7 h-7 rounded-full bg-indigo-500 border-2 border-white text-white shadow-lg cursor-grab flex items-center justify-center"
      onMouseDown={(e) => onDown(type, id, "rotate", e)}><RotateCw className="w-4 h-4" /></button>
    <button type="button" title="删除" aria-label="删除"
      className="absolute -left-5 -top-5 w-7 h-7 rounded-full bg-red-500 border-2 border-white text-white shadow-lg flex items-center justify-center"
      onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); onRemove(); }}><Trash2 className="w-4 h-4" /></button>
  </>
);

interface CanvasAreaProps {
  currentImageUrl: string | null;
  originalImageUrl: string | null;
  activeTool: ToolMode;
  zoom: number;
  isCompareActive: boolean;
  isProcessing: boolean;
  processingText?: string;
  eraserConfig: EraserConfig;
  watermarkConfig: WatermarkConfig;
  cropConfig: CropConfig;
  imageDimensions: { width: number; height: number };
  textElements?: TextElement[];
  stickers?: StickerElement[];
  selectedElement?: { type: "text" | "sticker"; id: string } | null;
  maskCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  onMaskUpdated?: () => void;
  onUpdateCropConfig?: (cfg: Partial<CropConfig>) => void;
  onApplyCurrentCrop?: () => void;
  onResetCropBox?: () => void;
  onClearImage?: () => void;
  onSelectElement?: (type: "text" | "sticker", id: string | null) => void;
  onUpdateTextElement?: (id: string, partial: Partial<TextElement>) => void;
  onUpdateStickerElement?: (id: string, partial: Partial<StickerElement>) => void;
  onRemoveText?: (id: string) => void;
  onRemoveSticker?: (id: string) => void;
  onTransformEnd?: () => void;
  onFileUpload: (file: File) => void;
  onSelectSample: (sample: SampleImage) => void;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  currentImageUrl,
  originalImageUrl,
  activeTool,
  zoom,
  isCompareActive,
  isProcessing,
  processingText = "正在AI智能计算中...",
  eraserConfig,
  watermarkConfig,
  cropConfig,
  imageDimensions,
  textElements = [],
  stickers = [],
  selectedElement = null,
  maskCanvasRef,
  onMaskUpdated,
  onUpdateCropConfig,
  onApplyCurrentCrop,
  onResetCropBox,
  onClearImage,
  onSelectElement,
  onUpdateTextElement,
  onUpdateStickerElement,
  onRemoveText,
  onRemoveSticker,
  onTransformEnd,
  onFileUpload,
  onSelectSample,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const originalImgRef = useRef<HTMLImageElement>(null);

  // Pan state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Brush drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isCursorInside, setIsCursorInside] = useState(false);

  // Watermark box drag state
  const [boxStart, setBoxStart] = useState<{ x: number; y: number } | null>(null);
  const [boxCurrent, setBoxCurrent] = useState<{ x: number; y: number } | null>(null);

  // Crop Interactive drag state
  const [cropDragType, setCropDragType] = useState<string | null>(null);
  const [cropDragStart, setCropDragStart] = useState<{ clientX: number; clientY: number; rect: CropRect } | null>(null);

  // Text & Sticker Interactive Drag & Transform State
  const [elementDragType, setElementDragType] = useState<"move" | "scale" | "rotate" | null>(null);
  const [elementDragTarget, setElementDragTarget] = useState<{ type: "text" | "sticker"; id: string } | null>(null);
  const [elementDragStart, setElementDragStart] = useState<{
    clientX: number;
    clientY: number;
    startX: number;
    startY: number;
    startScale: number;
    startRotation: number;
    centerClientX: number;
    centerClientY: number;
    startDist: number;
    startAngle: number;
  } | null>(null);

  // Drag-and-drop file state
  const [isDragOver, setIsDragOver] = useState(false);

  const isBrushTool =
    activeTool === "eraser" || (activeTool === "watermark" && watermarkConfig.mode === "brush");
  const isBoxTool = activeTool === "watermark" && watermarkConfig.mode === "box";
  const isCropTool = activeTool === "crop";
  const isStickerTool = activeTool === "sticker";

  const currentBrushSize =
    activeTool === "eraser" ? eraserConfig.brushSize : watermarkConfig.brushSize;

  const currentCropRect: CropRect = cropConfig.cropRect || { x: 5, y: 5, width: 90, height: 90 };

  // Reset pan when image changes
  useEffect(() => {
    setPan({ x: 0, y: 0 });
  }, [currentImageUrl]);

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  // Convert client coordinates to image canvas pixel coordinates
  const getCanvasCoords = useCallback(
    (clientX: number, clientY: number) => {
      const img = imageRef.current;
      if (!img) return null;
      const rect = img.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * (img.naturalWidth || img.width);
      const y = ((clientY - rect.top) / rect.height) * (img.naturalHeight || img.height);
      return { x, y, rectX: clientX - rect.left, rectY: clientY - rect.top };
    },
    []
  );

  // Brush drawing handlers
  const startDrawing = (e: React.MouseEvent) => {
    // Middle mouse button or Spacebar pan
    if (e.button === 1 || e.altKey) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (isBoxTool) {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      if (coords) {
        setBoxStart({ x: coords.x, y: coords.y });
        setBoxCurrent({ x: coords.x, y: coords.y });
      }
      return;
    }

    if (!isBrushTool || !maskCanvasRef.current || !imageRef.current) return;
    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (!coords) return;

    setIsDrawing(true);
    const maskCanvas = maskCanvasRef.current;
    const ctx = maskCanvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (activeTool === "eraser" && eraserConfig.mode === "restore") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = currentBrushSize;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(239, 68, 68, 0.75)";
      ctx.strokeStyle = "rgba(239, 68, 68, 0.75)";
      ctx.lineWidth = currentBrushSize;
    }

    ctx.beginPath();
    ctx.arc(coords.x, coords.y, currentBrushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.restore();

    onMaskUpdated?.();
  };

  const draw = (e: React.MouseEvent) => {
    // Track mouse for custom cursor
    if (containerRef.current) {
      const cRect = containerRef.current.getBoundingClientRect();
      setMousePos({ x: e.clientX - cRect.left, y: e.clientY - cRect.top });
    }

    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
      return;
    }

    if (isBoxTool && boxStart) {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      if (coords) {
        setBoxCurrent({ x: coords.x, y: coords.y });
      }
      return;
    }

    if (!isDrawing || !isBrushTool || !maskCanvasRef.current) return;
    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (!coords) return;

    const maskCanvas = maskCanvasRef.current;
    const ctx = maskCanvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (activeTool === "eraser" && eraserConfig.mode === "restore") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = currentBrushSize;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "rgba(239, 68, 68, 0.75)";
      ctx.lineWidth = currentBrushSize;
    }

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.restore();

    onMaskUpdated?.();
  };

  const stopDrawing = () => {
    if (isPanning) setIsPanning(false);

    if (isBoxTool && boxStart && boxCurrent && maskCanvasRef.current) {
      const x = Math.min(boxStart.x, boxCurrent.x);
      const y = Math.min(boxStart.y, boxCurrent.y);
      const w = Math.abs(boxCurrent.x - boxStart.x);
      const h = Math.abs(boxCurrent.y - boxStart.y);

      const maskCanvas = maskCanvasRef.current;
      const ctx = maskCanvas.getContext("2d");
      if (ctx && w > 4 && h > 4) {
        ctx.fillStyle = "rgba(239, 68, 68, 0.75)";
        ctx.fillRect(x, y, w, h);
        onMaskUpdated?.();
      }
      setBoxStart(null);
      setBoxCurrent(null);
    }

    if (isDrawing) {
      setIsDrawing(false);
      onMaskUpdated?.();
    }
  };

  // Sync mask canvas resolution to match main image
  useEffect(() => {
    if (!currentImageUrl || !maskCanvasRef.current) return;
    const img = new Image();
    img.src = currentImageUrl;
    img.onload = () => {
      if (maskCanvasRef.current) {
        maskCanvasRef.current.width = img.naturalWidth;
        maskCanvasRef.current.height = img.naturalHeight;
      }
    };
  }, [currentImageUrl, maskCanvasRef]);

  // Crop Drag Handler Setup
  const handleCropHandleDown = (type: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCropDragType(type);
    setCropDragStart({
      clientX: e.clientX,
      clientY: e.clientY,
      rect: { ...currentCropRect },
    });
  };

  useEffect(() => {
    if (!cropDragType || !cropDragStart || !imageRef.current) return;

    const onGlobalMouseMove = (e: MouseEvent) => {
      const img = imageRef.current;
      if (!img) return;
      const imgRect = img.getBoundingClientRect();
      const deltaPercentX = ((e.clientX - cropDragStart.clientX) / imgRect.width) * 100;
      const deltaPercentY = ((e.clientY - cropDragStart.clientY) / imgRect.height) * 100;

      let { x, y, width, height } = cropDragStart.rect;

      if (cropDragType === "move") {
        x = Math.max(0, Math.min(100 - width, x + deltaPercentX));
        y = Math.max(0, Math.min(100 - height, y + deltaPercentY));
      } else {
        if (cropDragType.includes("w")) {
          const newW = Math.max(5, width - deltaPercentX);
          const newX = x + (width - newW);
          if (newX >= 0) {
            x = newX;
            width = newW;
          }
        }
        if (cropDragType.includes("e")) {
          width = Math.max(5, Math.min(100 - x, width + deltaPercentX));
        }
        if (cropDragType.includes("n")) {
          const newH = Math.max(5, height - deltaPercentY);
          const newY = y + (height - newH);
          if (newY >= 0) {
            y = newY;
            height = newH;
          }
        }
        if (cropDragType.includes("s")) {
          height = Math.max(5, Math.min(100 - y, height + deltaPercentY));
        }
      }

      onUpdateCropConfig?.({
        cropRect: { x, y, width, height },
      });
    };

    const onGlobalMouseUp = () => {
      setCropDragType(null);
      setCropDragStart(null);
    };

    window.addEventListener("mousemove", onGlobalMouseMove);
    window.addEventListener("mouseup", onGlobalMouseUp);

    return () => {
      window.removeEventListener("mousemove", onGlobalMouseMove);
      window.removeEventListener("mouseup", onGlobalMouseUp);
    };
  }, [cropDragType, cropDragStart, onUpdateCropConfig]);

  // Text & Sticker Drag & Transform Handler Setup
  const handleElementMouseDown = (
    type: "text" | "sticker",
    id: string,
    dragType: "move" | "scale" | "rotate",
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    e.preventDefault();

    onSelectElement?.(type, id);

    let startX = 50;
    let startY = 50;
    let startScale = 1;
    let startRotation = 0;

    if (type === "text") {
      const el = textElements.find((t) => t.id === id);
      if (el) {
        startX = el.x;
        startY = el.y;
        startScale = el.scale || 1;
        startRotation = el.rotation || 0;
      }
    } else {
      const el = stickers.find((s) => s.id === id);
      if (el) {
        startX = el.x;
        startY = el.y;
        startScale = el.scale || 1;
        startRotation = el.rotation || 0;
      }
    }

    const img = imageRef.current;
    let centerClientX = e.clientX;
    let centerClientY = e.clientY;

    if (img) {
      const rect = img.getBoundingClientRect();
      centerClientX = rect.left + (startX / 100) * rect.width;
      centerClientY = rect.top + (startY / 100) * rect.height;
    }

    const startDist = Math.max(10, Math.hypot(e.clientX - centerClientX, e.clientY - centerClientY));
    const startAngle = Math.atan2(e.clientY - centerClientY, e.clientX - centerClientX) * (180 / Math.PI);

    setElementDragType(dragType);
    setElementDragTarget({ type, id });
    setElementDragStart({
      clientX: e.clientX,
      clientY: e.clientY,
      startX,
      startY,
      startScale,
      startRotation,
      centerClientX,
      centerClientY,
      startDist,
      startAngle,
    });
  };

  useEffect(() => {
    if (!elementDragType || !elementDragTarget || !elementDragStart || !imageRef.current) return;

    const onGlobalElementMouseMove = (e: MouseEvent) => {
      const img = imageRef.current;
      if (!img) return;
      const rect = img.getBoundingClientRect();

      if (elementDragType === "move") {
        const deltaX = ((e.clientX - elementDragStart.clientX) / rect.width) * 100;
        const deltaY = ((e.clientY - elementDragStart.clientY) / rect.height) * 100;
        const newX = Math.max(2, Math.min(98, elementDragStart.startX + deltaX));
        const newY = Math.max(2, Math.min(98, elementDragStart.startY + deltaY));

        if (elementDragTarget.type === "text") {
          onUpdateTextElement?.(elementDragTarget.id, { x: newX, y: newY });
        } else {
          onUpdateStickerElement?.(elementDragTarget.id, { x: newX, y: newY });
        }
      } else if (elementDragType === "scale") {
        const currentDist = Math.hypot(
          e.clientX - elementDragStart.centerClientX,
          e.clientY - elementDragStart.centerClientY
        );
        const ratio = currentDist / Math.max(10, elementDragStart.startDist);
        const newScale = Math.max(
          0.25,
          Math.min(3.5, Number((elementDragStart.startScale * ratio).toFixed(2)))
        );

        if (elementDragTarget.type === "text") {
          onUpdateTextElement?.(elementDragTarget.id, { scale: newScale });
        } else {
          onUpdateStickerElement?.(elementDragTarget.id, { scale: newScale });
        }
      } else if (elementDragType === "rotate") {
        const currentAngle =
          Math.atan2(
            e.clientY - elementDragStart.centerClientY,
            e.clientX - elementDragStart.centerClientX
          ) *
          (180 / Math.PI);
        const angleDelta = currentAngle - elementDragStart.startAngle;
        let rawRotation = Math.round((elementDragStart.startRotation + angleDelta) % 360);
        if (rawRotation > 180) rawRotation -= 360;
        if (rawRotation < -180) rawRotation += 360;

        if (elementDragTarget.type === "text") {
          onUpdateTextElement?.(elementDragTarget.id, { rotation: rawRotation });
        } else {
          onUpdateStickerElement?.(elementDragTarget.id, { rotation: rawRotation });
        }
      }
    };

    const onGlobalElementMouseUp = () => {
      setElementDragType(null);
      setElementDragTarget(null);
      setElementDragStart(null);
      onTransformEnd?.();
    };

    window.addEventListener("mousemove", onGlobalElementMouseMove);
    window.addEventListener("mouseup", onGlobalElementMouseUp);

    return () => {
      window.removeEventListener("mousemove", onGlobalElementMouseMove);
      window.removeEventListener("mouseup", onGlobalElementMouseUp);
    };
  }, [
    elementDragType,
    elementDragTarget,
    elementDragStart,
    onUpdateTextElement,
    onUpdateStickerElement,
    onTransformEnd,
  ]);

  // Empty state view
  if (!currentImageUrl) {
    return (
      <div
        id="canvas-empty-state"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex-1 flex flex-col items-center justify-center p-8 bg-slate-950 relative overflow-y-auto transition-colors ${
          isDragOver ? "bg-indigo-950/40 ring-2 ring-indigo-500 ring-inset" : ""
        }`}
      >
        <div className="max-w-xl w-full text-center space-y-6">
          {/* Main Upload Dropzone */}
          <label
            id="dropzone-upload-label"
            className="block border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-3xl p-10 bg-slate-900/50 hover:bg-slate-900/80 cursor-pointer transition-all group shadow-2xl shadow-indigo-500/5"
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  onFileUpload(e.target.files[0]);
                }
              }}
            />
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-indigo-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
              点击或拖拽图片到这里
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              支持 JPG, PNG, WEBP, HEIC 等常见格式，最高支持 8K 超清画质
            </p>
            <div className="inline-flex items-center gap-2 mt-4 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300 font-medium group-hover:border-indigo-500/40 transition-colors">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>一键自动识别主体 · 去水印 · 消除瑕疵</span>
            </div>
          </label>

          {/* Preset Sample Images */}
          <div className="space-y-3 pt-2 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                没有图片？点击下方示例体验全部功能：
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {SAMPLE_IMAGES.map((sample) => (
                <button
                  key={sample.id}
                  id={`sample-card-${sample.id}`}
                  onClick={() => onSelectSample(sample)}
                  className="group relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-indigo-500/80 transition-all hover:scale-[1.03] shadow-md text-left flex flex-col"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-slate-800 relative">
                    <img
                      src={sample.url}
                      alt={sample.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-950/80 text-indigo-300 backdrop-blur-sm">
                      {sample.badge}
                    </span>
                  </div>
                  <div className="p-2 flex-1 flex flex-col justify-between">
                    <div className="text-xs font-medium text-slate-200 truncate">
                      {sample.title}
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {sample.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const cropWPixels = Math.round((currentCropRect.width / 100) * (imageDimensions.width || 1));
  const cropHPixels = Math.round((currentCropRect.height / 100) * (imageDimensions.height || 1));

  return (
    <div
      ref={containerRef}
      id="main-canvas-workspace"
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseEnter={() => setIsCursorInside(true)}
      onMouseLeave={() => {
        setIsCursorInside(false);
        stopDrawing();
      }}
      className="flex-1 bg-slate-950 relative overflow-hidden select-none flex items-center justify-center cursor-default"
      style={{
        backgroundImage: `
          linear-gradient(45deg, #0f172a 25%, transparent 25%), 
          linear-gradient(-45deg, #0f172a 25%, transparent 25%), 
          linear-gradient(45deg, transparent 75%, #0f172a 75%), 
          linear-gradient(-45deg, transparent 75%, #0f172a 75%)
        `,
        backgroundSize: "24px 24px",
        backgroundPosition: "0 0, 0 12px, 12px -12px, -12px 0px",
        backgroundColor: "#090d16",
      }}
    >
      {/* Clear the current project and return to the upload home state. */}
      <button
        id="btn-clear-current-image"
        type="button"
        disabled={isProcessing}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm("确定清空当前图片和全部编辑内容吗？此操作相当于重新开始。")) {
            onClearImage?.();
          }
        }}
        className="absolute top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-red-500/90 border border-slate-700 hover:border-red-400 text-slate-300 hover:text-white text-xs font-semibold shadow-xl backdrop-blur-md transition-all disabled:opacity-50"
        title="清空图片并重新开始"
      >
        <Trash2 className="w-4 h-4" />
        <span>清空图片</span>
      </button>

      {/* Loading Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-40 flex flex-col items-center justify-center gap-3">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <Sparkles className="w-6 h-6 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <p className="text-sm font-semibold text-slate-200 tracking-wide">
            {processingText}
          </p>
          <span className="text-xs text-slate-400">正在利用先进算法与AI模型渲染精细细节...</span>
        </div>
      )}

      {/* Main Canvas Viewport with Zoom & Pan */}
      <div
        id="canvas-viewport"
        className="relative transition-transform duration-75 origin-center shadow-2xl"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {/* Render Image or Cutout Composite */}
        {isCompareActive && originalImageUrl ? (
          <div className="relative select-none">
            <img
              ref={originalImgRef}
              src={originalImageUrl}
              alt="Original"
              className="max-h-[80vh] max-w-[80vw] object-contain rounded-lg pointer-events-none block shadow-xl"
            />
            <div className="absolute top-3 left-3 bg-indigo-600/90 text-white text-xs font-bold px-2 py-1 rounded shadow backdrop-blur-sm flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>原图模式 (对比中)</span>
            </div>
          </div>
        ) : (
          <div className="relative select-none">
            {/* Base Image */}
            <img
              ref={imageRef}
              src={currentImageUrl}
              alt="Workspace Canvas"
              className="max-h-[80vh] max-w-[80vw] object-contain rounded-lg pointer-events-none block shadow-xl"
            />

            {/* Mask Drawing Canvas (For Eraser / Watermark) */}
            <canvas
              ref={maskCanvasRef as any}
              id="mask-drawing-canvas"
              className={`absolute inset-0 w-full h-full pointer-events-none z-10 ${
                isBrushTool || isBoxTool ? "opacity-100" : "opacity-0"
              }`}
            />

            {/* Direct manipulation layer for text and stickers. The composite
                image remains the export source; this layer supplies selection,
                move, resize and rotation handles on the working canvas. */}
            {isStickerTool && (
              <div className="absolute inset-0 z-40 pointer-events-none overflow-visible">
                {textElements.map((item) => {
                  const selected = selectedElement?.type === "text" && selectedElement.id === item.id;
                  return (
                    <div key={item.id} className="absolute pointer-events-auto touch-none"
                      style={{left:`${item.x}%`,top:`${item.y}%`,transform:`translate(-50%,-50%) rotate(${item.rotation || 0}deg) scale(${item.scale || 1})`}}
                      onMouseDown={(e)=>handleElementMouseDown("text",item.id,"move",e)}>
                      <div className={`relative whitespace-nowrap px-2 py-1 cursor-move ${selected ? "outline outline-2 outline-indigo-400 outline-offset-4" : ""}`}
                        style={{fontSize:`${item.fontSize}px`,fontFamily:item.fontFamily,fontWeight:item.fontWeight,color:item.color,background:item.bgColor || "transparent",textShadow:item.hasShadow ? "0 2px 4px rgba(0,0,0,.65)" : undefined}}>
                        {item.text}
                        {selected && <TransformHandles type="text" id={item.id} onDown={handleElementMouseDown} onRemove={()=>onRemoveText?.(item.id)} />}
                      </div>
                    </div>
                  );
                })}
                {stickers.map((item) => {
                  const selected = selectedElement?.type === "sticker" && selectedElement.id === item.id;
                  return (
                    <div key={item.id} className="absolute pointer-events-auto touch-none"
                      style={{left:`${item.x}%`,top:`${item.y}%`,transform:`translate(-50%,-50%) rotate(${item.rotation || 0}deg) scale(${item.scale || 1})`}}
                      onMouseDown={(e)=>handleElementMouseDown("sticker",item.id,"move",e)}>
                      <div className={`relative px-4 py-2 rounded-xl text-white font-black whitespace-nowrap cursor-move shadow-lg ${BADGE_BG_MAP[item.badgeType]} ${selected ? "outline outline-2 outline-indigo-300 outline-offset-4" : ""}`}>
                        {item.title}
                        {selected && <TransformHandles type="sticker" id={item.id} onDown={handleElementMouseDown} onRemove={()=>onRemoveSticker?.(item.id)} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Watermark Box Drag Preview Overlay */}
            {isBoxTool && boxStart && boxCurrent && (
              <div
                className="absolute border-2 border-dashed border-red-400 bg-red-500/35 z-20 pointer-events-none rounded shadow-sm ring-1 ring-white/50"
                style={{
                  left: `${(Math.min(boxStart.x, boxCurrent.x) / (imageRef.current?.naturalWidth || 1)) * 100}%`,
                  top: `${(Math.min(boxStart.y, boxCurrent.y) / (imageRef.current?.naturalHeight || 1)) * 100}%`,
                  width: `${(Math.abs(boxCurrent.x - boxStart.x) / (imageRef.current?.naturalWidth || 1)) * 100}%`,
                  height: `${(Math.abs(boxCurrent.y - boxStart.y) / (imageRef.current?.naturalHeight || 1)) * 100}%`,
                }}
              />
            )}

            {/* Interactive Free Crop Overlay Box */}
            {isCropTool && (
              <div className="absolute inset-0 pointer-events-auto z-30 select-none">
                {/* 4 Shaded Dim Backdrop Regions */}
                <div
                  className="absolute bg-black/65 backdrop-blur-[1px]"
                  style={{ top: 0, left: 0, right: 0, height: `${currentCropRect.y}%` }}
                />
                <div
                  className="absolute bg-black/65 backdrop-blur-[1px]"
                  style={{
                    top: `${currentCropRect.y + currentCropRect.height}%`,
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }}
                />
                <div
                  className="absolute bg-black/65 backdrop-blur-[1px]"
                  style={{
                    top: `${currentCropRect.y}%`,
                    left: 0,
                    width: `${currentCropRect.x}%`,
                    height: `${currentCropRect.height}%`,
                  }}
                />
                <div
                  className="absolute bg-black/65 backdrop-blur-[1px]"
                  style={{
                    top: `${currentCropRect.y}%`,
                    left: `${currentCropRect.x + currentCropRect.width}%`,
                    right: 0,
                    height: `${currentCropRect.height}%`,
                  }}
                />

                {/* Draggable & Resizable Active Crop Rectangle */}
                <div
                  id="active-crop-box"
                  className="absolute border-2 border-blue-400 shadow-2xl ring-1 ring-white/60 cursor-move transition-shadow"
                  style={{
                    left: `${currentCropRect.x}%`,
                    top: `${currentCropRect.y}%`,
                    width: `${currentCropRect.width}%`,
                    height: `${currentCropRect.height}%`,
                  }}
                  onMouseDown={(e) => handleCropHandleDown("move", e)}
                >
                  {/* Rule of Thirds 3x3 Grid Lines */}
                  <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
                    <div className="border-r border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-b border-white/30" />
                    <div className="border-r border-white/30" />
                    <div className="border-r border-white/30" />
                    <div />
                  </div>

                  {/* 4 Corner Handles */}
                  <div
                    className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-white border-2 border-blue-500 rounded-sm cursor-nw-resize shadow-md hover:scale-125 transition-transform"
                    onMouseDown={(e) => handleCropHandleDown("nw", e)}
                  />
                  <div
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white border-2 border-blue-500 rounded-sm cursor-ne-resize shadow-md hover:scale-125 transition-transform"
                    onMouseDown={(e) => handleCropHandleDown("ne", e)}
                  />
                  <div
                    className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-white border-2 border-blue-500 rounded-sm cursor-sw-resize shadow-md hover:scale-125 transition-transform"
                    onMouseDown={(e) => handleCropHandleDown("sw", e)}
                  />
                  <div
                    className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border-2 border-blue-500 rounded-sm cursor-se-resize shadow-md hover:scale-125 transition-transform"
                    onMouseDown={(e) => handleCropHandleDown("se", e)}
                  />

                  {/* 4 Edge Handles */}
                  <div
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-white border border-blue-500 rounded-sm cursor-n-resize shadow-sm hover:scale-125 transition-transform"
                    onMouseDown={(e) => handleCropHandleDown("n", e)}
                  />
                  <div
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-white border border-blue-500 rounded-sm cursor-s-resize shadow-sm hover:scale-125 transition-transform"
                    onMouseDown={(e) => handleCropHandleDown("s", e)}
                  />
                  <div
                    className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-6 bg-white border border-blue-500 rounded-sm cursor-w-resize shadow-sm hover:scale-125 transition-transform"
                    onMouseDown={(e) => handleCropHandleDown("w", e)}
                  />
                  <div
                    className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-6 bg-white border border-blue-500 rounded-sm cursor-e-resize shadow-sm hover:scale-125 transition-transform"
                    onMouseDown={(e) => handleCropHandleDown("e", e)}
                  />

                  {/* Quick Crop Action Pill */}
                  <div
                    className="absolute -bottom-11 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-900/95 border border-slate-700 shadow-xl px-2.5 py-1 rounded-full text-xs backdrop-blur-md whitespace-nowrap z-40"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <span className="text-[10px] font-mono text-blue-400 px-1 border-r border-slate-700">
                      {cropWPixels} × {cropHPixels}
                    </span>
                    <button
                      id="btn-crop-confirm-pill"
                      onClick={(e) => {
                        e.stopPropagation();
                        onApplyCurrentCrop?.();
                      }}
                      className="px-2 py-0.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition-colors"
                    >
                      <Check className="w-3 h-3" />
                      <span>确认</span>
                    </button>
                    <button
                      id="btn-crop-reset-pill"
                      onClick={(e) => {
                        e.stopPropagation();
                        onResetCropBox?.();
                      }}
                      className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="重置选框"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interactive Brush Cursor Indicator */}
      {isCursorInside && isBrushTool && mousePos && (
        <div
          className="pointer-events-none fixed z-50 rounded-full border-2 border-red-400 bg-red-500/20 shadow-sm"
          style={{
            width: `${currentBrushSize * zoom}px`,
            height: `${currentBrushSize * zoom}px`,
            left: `${mousePos.x + (containerRef.current?.getBoundingClientRect().left || 0) - (currentBrushSize * zoom) / 2}px`,
            top: `${mousePos.y + (containerRef.current?.getBoundingClientRect().top || 0) - (currentBrushSize * zoom) / 2}px`,
          }}
        />
      )}

      {/* Floating Canvas Quick Tips */}
      <div className="absolute bottom-3 left-4 z-20 flex items-center gap-2 pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2 shadow-lg">
          {isCropTool ? (
            <span>💡 提示：拖拽四个角或边缘控制点自由调整裁剪构图，点击确认即可裁剪</span>
          ) : isBrushTool ? (
            <span>💡 提示：在图片上直接涂抹想要抹除或去水印的区域</span>
          ) : isBoxTool ? (
            <span>💡 提示：在水印上按住鼠标左键拉出矩形框选</span>
          ) : (
            <span>💡 提示：滚轮缩放，按住 Alt 或中键拖映画布</span>
          )}
        </div>
      </div>
    </div>
  );
};
