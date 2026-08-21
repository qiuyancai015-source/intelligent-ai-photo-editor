export type ToolMode =
  | "cutout"         // 一键抠图
  | "eraser"         // 智能消除笔
  | "watermark"      // 智能去水印
  | "add_watermark"  // 添加防盗水印
  | "background"     // 换背景色
  | "adjust"         // 滤镜调色
  | "crop"           // 裁剪旋转
  | "sticker"        // 文字贴纸
  | "ai_studio";     // AI生成背景与扩展

export interface AddWatermarkConfig {
  enabled: boolean;
  type: "text" | "image";
  text: string;
  imageUrl?: string;
  layout: "tile" | "single"; // Full-screen tile vs Single position
  position: "top-left" | "top-center" | "top-right" | "center-left" | "center" | "center-right" | "bottom-left" | "bottom-center" | "bottom-right" | "custom";
  customX: number; // percentage 0-100
  customY: number; // percentage 0-100
  fontSize: number; // in px
  color: string; // hex
  opacity: number; // 0.05 to 1.0
  rotation: number; // -90 to 90
  gapX: number; // for tile mode (e.g. 160)
  gapY: number; // for tile mode (e.g. 120)
  imageScale: number; // 0.1 to 2.0
  hasShadow: boolean;
}

export interface ImageAdjustments {
  brightness: number;  // -100 to 100 (default 0)
  contrast: number;    // -100 to 100 (default 0)
  saturation: number;  // -100 to 100 (default 0)
  temperature: number; // -100 to 100 (default 0)
  tint: number;        // -100 to 100 (default 0)
  sharpness: number;   // 0 to 100 (default 0)
  vignette: number;    // 0 to 100 (default 0)
  blur: number;        // 0 to 50 (default 0)
  sepia: number;       // 0 to 100 (default 0)
  invert: boolean;     // default false
  filterId: string;    // 'none', 'film', 'vintage', etc.
}

export type BgType = "transparent" | "color" | "gradient" | "texture" | "image" | "ai";

export interface BgConfig {
  type: BgType;
  color: string;
  gradient: {
    type: "linear" | "radial";
    angle: number;
    color1: string;
    color2: string;
    color3?: string;
  };
  textureId?: string;
  imageUrl?: string;
  shadow: {
    enabled: boolean;
    blur: number;
    offsetX: number;
    offsetY: number;
    color: string;
    opacity: number;
  };
  stroke: {
    enabled: boolean;
    width: number;
    color: string;
  };
}

export interface CutoutConfig {
  isCutoutActive: boolean;
  featherRadius: number; // 0 to 10
  sensitivity: number;   // 1 to 100
  edgeSmooth: number;    // 0 to 10
  edgeExpansion: number; // -10 shrink, 0 original, +10 extend
  keepOriginalSubject: boolean;
  maskDataUrl?: string;
}

export interface EraserConfig {
  brushSize: number;
  brushHardness: number;
  mode: "erase" | "restore";
  aiMode: boolean; // Legacy field; eraser now always uses local PatchMatch
}

export interface WatermarkConfig {
  mode: "brush" | "box" | "auto";
  brushSize: number;
  boxRect?: { x: number; y: number; width: number; height: number };
}

export interface CropRect {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
}

export interface CropConfig {
  aspectRatio: string; // 'free', '1:1', '4:3', '3:4', '16:9', '9:16', 'id_1', 'id_2'
  rotation: number;    // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
  cropRect?: CropRect;
  outputWidth?: number;  // official ID-photo output pixels at 300 DPI
  outputHeight?: number;
}

export interface TextElement {
  id: string;
  text: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  fontSize: number;
  scale?: number; // scale multiplier e.g. 0.5 - 3.0
  color: string;
  bgColor?: string;
  fontFamily: string;
  fontWeight: string;
  hasShadow: boolean;
  hasBorder: boolean;
  rotation: number; // in degrees -180 to 180
}

export interface StickerElement {
  id: string;
  title: string;
  badgeType: "hot" | "new" | "authentic" | "discount" | "sale" | "verified" | "ai";
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface HistorySnapshot {
  id: string;
  title: string;
  timestamp: number;
  baseWorkingImageUrl: string;
  cutoutDataUrl: string | null;
  cutoutConfig: CutoutConfig;
  bgConfig: BgConfig;
  adjustments: ImageAdjustments;
  cropConfig: CropConfig;
  textElements: TextElement[];
  stickers: StickerElement[];
  addWatermarkConfig: AddWatermarkConfig;
  imageDimensions: { width: number; height: number };
}

export interface EditHistoryItem {
  id: string;
  title: string;
  timestamp: number;
  imageDataUrl: string;
  originalDataUrl: string;
  cutoutDataUrl?: string;
  bgConfig: BgConfig;
  adjustments: ImageAdjustments;
  cropConfig: CropConfig;
}

export interface AiAnalysisResult {
  subjectType?: string;
  subjectDescription?: string;
  watermarkDetected?: boolean;
  watermarkLocations?: string[];
  suggestedBgColor?: string;
  suggestedImprovements?: string[];
  colorTone?: string;
}
