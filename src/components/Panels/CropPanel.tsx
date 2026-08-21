import React from "react";
import { Crop, RotateCw, RotateCcw, FlipHorizontal, FlipVertical, Check, RefreshCw, Scissors } from "lucide-react";
import { CropConfig } from "../../types";

interface CropPanelProps {
  cropConfig: CropConfig;
  imageDimensions: { width: number; height: number };
  onUpdateCropConfig: (cfg: Partial<CropConfig>) => void;
  onRotate90: (direction: "cw" | "ccw") => void;
  onFlip: (axis: "h" | "v") => void;
  onApplyCropRatio: (ratio: string) => void;
  onApplyCurrentCrop: () => void;
  onResetCropBox: () => void;
}

const CROP_RATIOS = [
  { id: "free", label: "自由裁剪", ratio: "可拖动任意手柄" },
  { id: "1:1", label: "1:1 正方形", ratio: "头像/朋友圈" },
  { id: "3:4", label: "3:4 竖图", ratio: "小红书/海报" },
  { id: "4:3", label: "4:3 横图", ratio: "经典摄影" },
  { id: "9:16", label: "9:16 满屏", ratio: "抖音/快手/故事" },
  { id: "16:9", label: "16:9 宽屏", ratio: "影视横屏" },
];

const ID_PHOTO_SPECS = [
  { id: "id_1", name: "标准 1 寸", size: "25 × 35 mm", desc: "295 × 413 px · 300 DPI" },
  { id: "id_2", name: "标准 2 寸", size: "35 × 49 mm", desc: "413 × 579 px · 300 DPI" },
  { id: "id_large_1", name: "大 1 寸", size: "33 × 48 mm", desc: "390 × 567 px · 300 DPI" },
  { id: "id_small_2", name: "小 2 寸", size: "35 × 45 mm", desc: "413 × 531 px · 300 DPI" },
];

export const CropPanel: React.FC<CropPanelProps> = ({
  cropConfig,
  imageDimensions,
  onUpdateCropConfig,
  onRotate90,
  onFlip,
  onApplyCropRatio,
  onApplyCurrentCrop,
  onResetCropBox,
}) => {
  const currentCropW = cropConfig.cropRect
    ? Math.round((cropConfig.cropRect.width / 100) * imageDimensions.width)
    : imageDimensions.width;
  const currentCropH = cropConfig.cropRect
    ? Math.round((cropConfig.cropRect.height / 100) * imageDimensions.height)
    : imageDimensions.height;

  return (
    <div id="panel-crop" className="space-y-5 text-slate-200">
      {/* Title */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Crop className="w-4 h-4 text-blue-400" />
            <span>裁剪旋转与自由构图</span>
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
            {currentCropW} × {currentCropH} px
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          拖动画面上的 8 处控制点可自由调整裁剪尺寸与构图，支持预设黄金比例与无损旋转。
        </p>
      </div>

      {/* Primary Crop Actions */}
      <div className="space-y-2">
        <button
          id="btn-apply-current-crop"
          onClick={onApplyCurrentCrop}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
        >
          <Scissors className="w-4 h-4" />
          <span>✂️ 确认应用当前裁剪选区</span>
        </button>

        <button
          id="btn-reset-crop-box"
          onClick={onResetCropBox}
          className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-400 hover:text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>重置为全图裁剪框</span>
        </button>
      </div>

      {/* Rotation & Flip Controls */}
      <div className="space-y-2 pt-1 border-t border-slate-800/60">
        <span className="text-xs font-semibold text-slate-300">画布旋转与翻转</span>
        <div className="grid grid-cols-4 gap-2">
          <button
            id="btn-rotate-ccw"
            onClick={() => onRotate90("ccw")}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/60 flex flex-col items-center gap-1 text-slate-300 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-blue-400" />
            <span className="text-[10px]">左转90°</span>
          </button>
          <button
            id="btn-rotate-cw"
            onClick={() => onRotate90("cw")}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/60 flex flex-col items-center gap-1 text-slate-300 transition-colors"
          >
            <RotateCw className="w-4 h-4 text-blue-400" />
            <span className="text-[10px]">右转90°</span>
          </button>
          <button
            id="btn-flip-h"
            onClick={() => onFlip("h")}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/60 flex flex-col items-center gap-1 text-slate-300 transition-colors"
          >
            <FlipHorizontal className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px]">水平翻转</span>
          </button>
          <button
            id="btn-flip-v"
            onClick={() => onFlip("v")}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/60 flex flex-col items-center gap-1 text-slate-300 transition-colors"
          >
            <FlipVertical className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px]">垂直翻转</span>
          </button>
        </div>
      </div>

      {/* Social Aspect Ratios */}
      <div className="space-y-2 pt-2 border-t border-slate-800/60">
        <span className="text-xs font-semibold text-slate-300">裁剪比例与构图预设</span>
        <div className="grid grid-cols-3 gap-2">
          {CROP_RATIOS.map((item) => {
            const isSelected = cropConfig.aspectRatio === item.id;
            return (
              <button
                key={item.id}
                id={`btn-crop-ratio-${item.id}`}
                onClick={() => onApplyCropRatio(item.id)}
                className={`p-2.5 rounded-xl border flex flex-col items-start gap-1 transition-all ${
                  isSelected
                    ? "bg-slate-800 border-blue-500 shadow-md ring-1 ring-blue-500/30"
                    : "bg-slate-900 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-semibold text-slate-200">{item.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </div>
                <span className="text-[10px] text-slate-400 line-clamp-1">{item.ratio}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Standard ID Photo Specifications */}
      <div className="space-y-2 pt-2 border-t border-slate-800/60">
        <span className="text-xs font-semibold text-slate-300">🇨🇳 官方标准证件照规格</span>
        <div className="grid grid-cols-2 gap-2">
          {ID_PHOTO_SPECS.map((spec) => {
            const isSelected = cropConfig.aspectRatio === spec.id;
            return (
              <button
                key={spec.id}
                id={`btn-id-spec-${spec.id}`}
                onClick={() => onApplyCropRatio(spec.id)}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  isSelected
                    ? "bg-slate-800 border-blue-500 shadow-md ring-1 ring-blue-500/30"
                    : "bg-slate-900 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-slate-200">{spec.name}</span>
                  <span className="text-[10px] font-mono text-blue-400">{spec.size}</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">{spec.desc}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
