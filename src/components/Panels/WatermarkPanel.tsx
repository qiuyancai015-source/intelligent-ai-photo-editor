import React from "react";
import { Droplet, Sparkles, BoxSelect, Paintbrush, CornerDownRight, CornerDownLeft, CornerUpRight, CornerUpLeft, Trash2, Zap } from "lucide-react";
import { WatermarkConfig, AiAnalysisResult } from "../../types";

interface WatermarkPanelProps {
  watermarkConfig: WatermarkConfig;
  isProcessing: boolean;
  hasMask: boolean;
  aiAnalysis: AiAnalysisResult | null;
  onUpdateWatermarkConfig: (cfg: Partial<WatermarkConfig>) => void;
  onApplyWatermarkRemoval: () => void;
  onAutoWatermarkRemoval: () => void;
  onApplyPresetCorner: (corner: "bottom-right" | "bottom-left" | "top-right" | "top-left" | "center", instantRemove?: boolean) => void;
  onClearMask: () => void;
}

export const WatermarkPanel: React.FC<WatermarkPanelProps> = ({
  watermarkConfig,
  isProcessing,
  hasMask,
  aiAnalysis,
  onUpdateWatermarkConfig,
  onApplyWatermarkRemoval,
  onAutoWatermarkRemoval,
  onApplyPresetCorner,
  onClearMask,
}) => {
  return (
    <div id="panel-watermark" className="space-y-5 text-slate-200">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Droplet className="w-4 h-4 text-cyan-400" />
            <span>智能去水印 / 瑕疵贴纸</span>
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
            高频纹理重构
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          移除 mask 标记的 Logo / 水印，仅修改涂抹区域；其余画面完全不动。参考周边原有材质、纹理、颗粒、色彩和光影填充，禁止纯色补丁与模糊残影。
        </p>
      </div>

      {/* Main Action Button */}
      <div className="space-y-2">
        <button
          id="btn-auto-detect-remove-watermark"
          onClick={onAutoWatermarkRemoval}
          disabled={isProcessing}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 via-cyan-500 to-emerald-500 hover:brightness-110 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <Zap className="w-4 h-4" />
          <span>一键识别并去除全图水印</span>
        </button>
        <p className="text-[10px] text-slate-500 text-center">适合重复平铺、半透明文字和斜纹水印</p>
        <button
          id="btn-apply-watermark-removal"
          onClick={onApplyWatermarkRemoval}
          disabled={isProcessing || !hasMask}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span>{hasMask ? "✨ 立即智能去除选中水印" : "请先在画面上涂抹或框选水印"}</span>
        </button>

        {hasMask && (
          <button
            id="btn-clear-wm-mask"
            onClick={onClearMask}
            className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-400 hover:text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>清空水印选区 (重新选取)</span>
          </button>
        )}
      </div>

      {/* 1-Click Instant Preset Watermark Remover */}
      <div className="space-y-2.5 pt-2 border-t border-slate-800/60">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>⚡ 常见角标水印 1键直消</span>
          </label>
          <span className="text-[10px] text-slate-500">点击自动识别并清除</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            id="btn-preset-wm-br-instant"
            onClick={() => onApplyPresetCorner("bottom-right", true)}
            disabled={isProcessing}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/60 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-between transition-all group active:scale-[0.98]"
          >
            <span className="flex items-center gap-1.5">
              <CornerDownRight className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>右下角水印</span>
            </span>
            <span className="text-[10px] text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/50">秒消</span>
          </button>

          <button
            id="btn-preset-wm-bl-instant"
            onClick={() => onApplyPresetCorner("bottom-left", true)}
            disabled={isProcessing}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/60 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-between transition-all group active:scale-[0.98]"
          >
            <span className="flex items-center gap-1.5">
              <CornerDownLeft className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>左下角水印</span>
            </span>
            <span className="text-[10px] text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/50">秒消</span>
          </button>

          <button
            id="btn-preset-wm-tr-instant"
            onClick={() => onApplyPresetCorner("top-right", true)}
            disabled={isProcessing}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/60 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-between transition-all group active:scale-[0.98]"
          >
            <span className="flex items-center gap-1.5">
              <CornerUpRight className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>右上角水印</span>
            </span>
            <span className="text-[10px] text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/50">秒消</span>
          </button>

          <button
            id="btn-preset-wm-tl-instant"
            onClick={() => onApplyPresetCorner("top-left", true)}
            disabled={isProcessing}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/60 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-between transition-all group active:scale-[0.98]"
          >
            <span className="flex items-center gap-1.5">
              <CornerUpLeft className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>左上角水印</span>
            </span>
            <span className="text-[10px] text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/50">秒消</span>
          </button>
        </div>
      </div>

      {/* Manual Selection Mode Toggle */}
      <div className="space-y-2 pt-2 border-t border-slate-800/60">
        <label className="text-xs font-semibold text-slate-300">手动精确选取方式</label>
        <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            id="btn-wm-mode-brush"
            onClick={() => onUpdateWatermarkConfig({ mode: "brush" })}
            className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
              watermarkConfig.mode === "brush"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Paintbrush className="w-3.5 h-3.5" />
            <span>自由画笔涂抹</span>
          </button>
          <button
            id="btn-wm-mode-box"
            onClick={() => onUpdateWatermarkConfig({ mode: "box" })}
            className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
              watermarkConfig.mode === "box"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <BoxSelect className="w-3.5 h-3.5" />
            <span>矩形拉框选择</span>
          </button>
        </div>
      </div>

      {/* Brush Size for Brush Mode */}
      {watermarkConfig.mode === "brush" && (
        <div className="space-y-2 pt-1 border-t border-slate-800/60">
          <div className="flex justify-between text-xs text-slate-300 font-medium">
            <span>涂抹画笔粗细</span>
            <span className="font-mono text-cyan-400">{watermarkConfig.brushSize} px</span>
          </div>
          <input
            id="slider-wm-brush-size"
            type="range"
            min="6"
            max="120"
            step="2"
            value={watermarkConfig.brushSize}
            onChange={(e) => onUpdateWatermarkConfig({ brushSize: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>
      )}

      {/* AI Watermark Detection status */}
      {aiAnalysis && (
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-slate-300 font-medium">
            <span>AI 检测结果:</span>
            <span className={aiAnalysis.watermarkDetected ? "text-amber-400" : "text-emerald-400"}>
              {aiAnalysis.watermarkDetected ? "⚠️ 检测到明显水印/字符" : "✅ 画面干净无明显水印"}
            </span>
          </div>
          {aiAnalysis.watermarkLocations && aiAnalysis.watermarkLocations.length > 0 && (
            <p className="text-[11px] text-slate-400">
              位置分布: {aiAnalysis.watermarkLocations.join("、")}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
