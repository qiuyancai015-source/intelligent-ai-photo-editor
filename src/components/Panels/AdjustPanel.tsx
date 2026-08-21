import React from "react";
import { SlidersHorizontal, Sparkles, RotateCcw, Eye, Sun, Contrast, Droplets, Flame, Aperture, Focus } from "lucide-react";
import { ImageAdjustments } from "../../types";
import { FILTER_PRESETS } from "../../utils/imageAlgorithms";

interface AdjustPanelProps {
  adjustments: ImageAdjustments;
  isProcessing: boolean;
  onUpdateAdjustments: (adj: Partial<ImageAdjustments>) => void;
  onResetAdjustments: () => void;
  onAutoEnhance: () => void;
}

export const AdjustPanel: React.FC<AdjustPanelProps> = ({
  adjustments,
  isProcessing,
  onUpdateAdjustments,
  onResetAdjustments,
  onAutoEnhance,
}) => {
  return (
    <div id="panel-adjust" className="space-y-5 text-slate-200">
      {/* Title & Quick Actions */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            <span>专业滤镜与画质调色</span>
          </h2>
          <button
            id="btn-reset-adjustments"
            onClick={onResetAdjustments}
            className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>重置所有</span>
          </button>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          精选大师级电影胶片与电商色调，支持高光、暗部、饱和度与清晰度微调。
        </p>
      </div>

      {/* 1-Click AI Auto Enhance */}
      <button
        id="btn-ai-auto-enhance"
        onClick={onAutoEnhance}
        disabled={isProcessing}
        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
      >
        <Sparkles className="w-4 h-4" />
        <span>✨ AI智能一键自动调光 (色彩平衡)</span>
      </button>

      {/* Preset Filters Grid */}
      <div className="space-y-2.5">
        <span className="text-xs font-semibold text-slate-300">大师滤镜风格预设</span>
        <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
          {FILTER_PRESETS.map((filter) => {
            const isSelected = adjustments.filterId === filter.id;
            return (
              <button
                key={filter.id}
                id={`btn-filter-${filter.id}`}
                onClick={() => onUpdateAdjustments({ filterId: filter.id })}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  isSelected
                    ? "bg-slate-800 border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                    : "bg-slate-900 border-slate-800 hover:border-slate-700"
                }`}
              >
                <span className="text-lg">{filter.icon}</span>
                <span className="text-xs font-medium text-slate-200 truncate">{filter.name}</span>
                <span className="text-[9px] text-slate-500 truncate">{filter.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fine-Tuning Sliders */}
      <div className="space-y-3.5 pt-2 border-t border-slate-800/60">
        <span className="text-xs font-semibold text-slate-300">光影色彩精细调节</span>

        {/* Brightness */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>曝光亮度</span>
            </span>
            <span className="font-mono text-slate-200">{adjustments.brightness}</span>
          </div>
          <input
            id="slider-adj-brightness"
            type="range"
            min="-60"
            max="60"
            value={adjustments.brightness}
            onChange={(e) => onUpdateAdjustments({ brightness: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        {/* Contrast */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Contrast className="w-3.5 h-3.5 text-indigo-400" />
              <span>对比度</span>
            </span>
            <span className="font-mono text-slate-200">{adjustments.contrast}</span>
          </div>
          <input
            id="slider-adj-contrast"
            type="range"
            min="-60"
            max="60"
            value={adjustments.contrast}
            onChange={(e) => onUpdateAdjustments({ contrast: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        {/* Saturation */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-pink-400" />
              <span>色彩饱和度</span>
            </span>
            <span className="font-mono text-slate-200">{adjustments.saturation}</span>
          </div>
          <input
            id="slider-adj-saturation"
            type="range"
            min="-100"
            max="100"
            value={adjustments.saturation}
            onChange={(e) => onUpdateAdjustments({ saturation: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        {/* Temperature */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>色温 (暖/冷)</span>
            </span>
            <span className="font-mono text-slate-200">{adjustments.temperature}</span>
          </div>
          <input
            id="slider-adj-temperature"
            type="range"
            min="-60"
            max="60"
            value={adjustments.temperature}
            onChange={(e) => onUpdateAdjustments({ temperature: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* Sharpness */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Focus className="w-3.5 h-3.5 text-cyan-400" />
              <span>画面锐化度</span>
            </span>
            <span className="font-mono text-slate-200">{adjustments.sharpness}</span>
          </div>
          <input
            id="slider-adj-sharpness"
            type="range"
            min="0"
            max="80"
            value={adjustments.sharpness}
            onChange={(e) => onUpdateAdjustments({ sharpness: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        {/* Vignette */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Aperture className="w-3.5 h-3.5 text-purple-400" />
              <span>复古暗角</span>
            </span>
            <span className="font-mono text-slate-200">{adjustments.vignette}</span>
          </div>
          <input
            id="slider-adj-vignette"
            type="range"
            min="0"
            max="100"
            value={adjustments.vignette}
            onChange={(e) => onUpdateAdjustments({ vignette: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>
      </div>
    </div>
  );
};
