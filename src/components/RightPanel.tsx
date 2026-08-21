import React from "react";
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
} from "../types";
import { CutoutPanel } from "./Panels/CutoutPanel";
import { EraserPanel } from "./Panels/EraserPanel";
import { WatermarkPanel } from "./Panels/WatermarkPanel";
import { AddWatermarkPanel } from "./Panels/AddWatermarkPanel";
import { BackgroundPanel } from "./Panels/BackgroundPanel";
import { AdjustPanel } from "./Panels/AdjustPanel";
import { CropPanel } from "./Panels/CropPanel";
import { StickerTextPanel } from "./Panels/StickerTextPanel";

interface RightPanelProps {
  activeTool: ToolMode;
  isProcessing: boolean;
  hasImage: boolean;
  hasMask: boolean;
  cutoutConfig: CutoutConfig;
  eraserConfig: EraserConfig;
  watermarkConfig: WatermarkConfig;
  addWatermarkConfig: AddWatermarkConfig;
  bgConfig: BgConfig;
  adjustments: ImageAdjustments;
  cropConfig: CropConfig;
  imageDimensions: { width: number; height: number };
  textElements: TextElement[];
  stickers: StickerElement[];
  aiAnalysis: AiAnalysisResult | null;
  onApplyCutout: () => void;
  onRestoreOriginal: () => void;
  onUpdateCutoutConfig: (cfg: Partial<CutoutConfig>) => void;
  onUpdateEraserConfig: (cfg: Partial<EraserConfig>) => void;
  onApplyErase: () => void;
  onClearMask: () => void;
  onUpdateWatermarkConfig: (cfg: Partial<WatermarkConfig>) => void;
  onUpdateAddWatermarkConfig: (cfg: AddWatermarkConfig | ((prev: AddWatermarkConfig) => AddWatermarkConfig)) => void;
  onApplyWatermarkRemoval: () => void;
  onAutoWatermarkRemoval: () => void;
  onApplyPresetCorner: (corner: "bottom-right" | "bottom-left" | "top-right" | "top-left" | "center", instantRemove?: boolean) => void;
  onUpdateBgConfig: (cfg: Partial<BgConfig>) => void;
  onUploadBgImage: (file: File) => void;
  onTriggerCutoutIfNeeded: () => void;
  onUpdateAdjustments: (adj: Partial<ImageAdjustments>) => void;
  onResetAdjustments: () => void;
  onAutoEnhance: () => void;
  onUpdateCropConfig: (cfg: Partial<CropConfig>) => void;
  onRotate90: (direction: "cw" | "ccw") => void;
  onFlip: (axis: "h" | "v") => void;
  onApplyCropRatio: (ratio: string) => void;
  onApplyCurrentCrop: () => void;
  onResetCropBox: () => void;
  selectedElement?: { type: "text" | "sticker"; id: string } | null;
  onSelectElement?: (type: "text" | "sticker", id: string | null) => void;
  onAddText: (text: string, color: string, bgColor?: string) => void;
  onAddSticker: (badgeType: StickerElement["badgeType"], title: string) => void;
  onUpdateText?: (id: string, updates: Partial<TextElement>) => void;
  onUpdateSticker?: (id: string, updates: Partial<StickerElement>) => void;
  onRemoveText: (id: string) => void;
  onRemoveSticker: (id: string) => void;
  onRunAiAnalyze: () => void;
  onDownloadTransparentPng?: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  activeTool,
  isProcessing,
  hasImage,
  hasMask,
  cutoutConfig,
  eraserConfig,
  watermarkConfig,
  addWatermarkConfig,
  bgConfig,
  adjustments,
  cropConfig,
  imageDimensions,
  textElements,
  stickers,
  aiAnalysis,
  onApplyCutout,
  onRestoreOriginal,
  onUpdateCutoutConfig,
  onUpdateEraserConfig,
  onApplyErase,
  onClearMask,
  onUpdateWatermarkConfig,
  onUpdateAddWatermarkConfig,
  onApplyWatermarkRemoval,
  onAutoWatermarkRemoval,
  onApplyPresetCorner,
  onUpdateBgConfig,
  onUploadBgImage,
  onTriggerCutoutIfNeeded,
  onUpdateAdjustments,
  onResetAdjustments,
  onAutoEnhance,
  onUpdateCropConfig,
  onRotate90,
  onFlip,
  onApplyCropRatio,
  onApplyCurrentCrop,
  onResetCropBox,
  selectedElement = null,
  onSelectElement = () => {},
  onAddText,
  onAddSticker,
  onUpdateText = () => {},
  onUpdateSticker = () => {},
  onRemoveText,
  onRemoveSticker,
  onRunAiAnalyze,
  onDownloadTransparentPng,
}) => {
  if (!hasImage) {
    return (
      <aside
        id="right-control-panel-empty"
        className="w-80 bg-slate-900 border-l border-slate-800 p-6 flex flex-col items-center justify-center text-center text-slate-500 select-none flex-shrink-0"
      >
        <p className="text-xs">导入图片后，此处将展示所选工具的完整调节参数与智能AI选项。</p>
      </aside>
    );
  }

  return (
    <aside
      id="right-control-panel"
      className="w-80 sm:w-96 bg-slate-900 border-l border-slate-800 p-5 flex flex-col gap-4 overflow-y-auto flex-shrink-0 z-20 select-none shadow-xl"
    >
      {activeTool === "cutout" && (
        <CutoutPanel
          cutoutConfig={cutoutConfig}
          bgConfig={bgConfig}
          isProcessing={isProcessing}
          aiAnalysis={aiAnalysis}
          onApplyCutout={onApplyCutout}
          onRestoreOriginal={onRestoreOriginal}
          onUpdateCutoutConfig={onUpdateCutoutConfig}
          onUpdateBgConfig={onUpdateBgConfig}
          onRunAiAnalyze={onRunAiAnalyze}
          onDownloadTransparentPng={onDownloadTransparentPng}
        />
      )}

      {activeTool === "eraser" && (
        <EraserPanel
          eraserConfig={eraserConfig}
          isProcessing={isProcessing}
          hasMask={hasMask}
          onUpdateEraserConfig={onUpdateEraserConfig}
          onApplyErase={onApplyErase}
          onClearMask={onClearMask}
        />
      )}

      {activeTool === "watermark" && (
        <WatermarkPanel
          watermarkConfig={watermarkConfig}
          isProcessing={isProcessing}
          hasMask={hasMask}
          aiAnalysis={aiAnalysis}
          onUpdateWatermarkConfig={onUpdateWatermarkConfig}
          onApplyWatermarkRemoval={onApplyWatermarkRemoval}
          onAutoWatermarkRemoval={onAutoWatermarkRemoval}
          onApplyPresetCorner={onApplyPresetCorner}
          onClearMask={onClearMask}
        />
      )}

      {activeTool === "add_watermark" && (
        <AddWatermarkPanel
          config={addWatermarkConfig}
          onChange={onUpdateAddWatermarkConfig}
          onApplyPreset={(text, isTile, angle) => {
            onUpdateAddWatermarkConfig((prev) => ({
              ...prev,
              enabled: true,
              type: "text",
              text,
              layout: isTile ? "tile" : "single",
              rotation: angle,
            }));
          }}
        />
      )}

      {activeTool === "background" && (
        <BackgroundPanel
          bgConfig={bgConfig}
          isCutoutActive={cutoutConfig.isCutoutActive}
          isProcessing={isProcessing}
          onUpdateBgConfig={onUpdateBgConfig}
          onUploadBgImage={onUploadBgImage}
          onTriggerCutoutIfNeeded={onTriggerCutoutIfNeeded}
        />
      )}

      {activeTool === "adjust" && (
        <AdjustPanel
          adjustments={adjustments}
          isProcessing={isProcessing}
          onUpdateAdjustments={onUpdateAdjustments}
          onResetAdjustments={onResetAdjustments}
          onAutoEnhance={onAutoEnhance}
        />
      )}

      {activeTool === "crop" && (
        <CropPanel
          cropConfig={cropConfig}
          imageDimensions={imageDimensions}
          onUpdateCropConfig={onUpdateCropConfig}
          onRotate90={onRotate90}
          onFlip={onFlip}
          onApplyCropRatio={onApplyCropRatio}
          onApplyCurrentCrop={onApplyCurrentCrop}
          onResetCropBox={onResetCropBox}
        />
      )}

      {activeTool === "sticker" && (
        <StickerTextPanel
          textElements={textElements}
          stickers={stickers}
          selectedElement={selectedElement}
          onSelectElement={onSelectElement}
          onAddText={onAddText}
          onAddSticker={onAddSticker}
          onUpdateText={onUpdateText}
          onUpdateSticker={onUpdateSticker}
          onRemoveText={onRemoveText}
          onRemoveSticker={onRemoveSticker}
        />
      )}

    </aside>
  );
};
