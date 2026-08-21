import React from "react";
import { Eraser, Paintbrush, Sparkles, Trash2, Undo, Zap, ShieldCheck } from "lucide-react";
import { EraserConfig } from "../../types";

interface EraserPanelProps {
  eraserConfig: EraserConfig;
  isProcessing: boolean;
  hasMask: boolean;
  onUpdateEraserConfig: (cfg: Partial<EraserConfig>) => void;
  onApplyErase: () => void;
  onClearMask: () => void;
}

export const EraserPanel: React.FC<EraserPanelProps> = ({
  eraserConfig,
  isProcessing,
  hasMask,
  onUpdateEraserConfig,
  onApplyErase,
  onClearMask,
}) => {
  return (
    <div id="panel-eraser" className="space-y-5 text-slate-200">
      {/* Title */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Eraser className="w-4 h-4 text-pink-400" />
            <span>智能消除笔 (一键抹除)</span>
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-semibold border border-pink-500/30">
            无痕修补
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          用涂抹画笔框选路人、杂物、电线或皮肤瑕疵，AI将智能分析背景纹理并无痕填充。
        </p>
      </div>

      {/* Main Erase Trigger Button */}
      <div className="space-y-2">
        <button
          id="btn-apply-erase"
          onClick={onApplyErase}
          disabled={isProcessing || !hasMask}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-sm shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span>{hasMask ? "✨ 立即抹除选中区域" : "请在画布上涂抹要抹除的物体"}</span>
        </button>

        {hasMask && (
          <button
            id="btn-clear-eraser-mask"
            onClick={onClearMask}
            className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-400 hover:text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>清空涂抹区域</span>
          </button>
        )}
      </div>

      {/* Brush Mode Toggle */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300">画笔操作模式</label>
        <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            id="btn-mode-erase"
            onClick={() => onUpdateEraserConfig({ mode: "erase" })}
            className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
              eraserConfig.mode === "erase"
                ? "bg-pink-600 text-white shadow-md shadow-pink-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Paintbrush className="w-3.5 h-3.5" />
            <span>涂抹标记 (抹除)</span>
          </button>
          <button
            id="btn-mode-restore"
            onClick={() => onUpdateEraserConfig({ mode: "restore" })}
            className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
              eraserConfig.mode === "restore"
                ? "bg-pink-600 text-white shadow-md shadow-pink-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>橡皮擦 (擦除标记)</span>
          </button>
        </div>
      </div>

      {/* Brush Size Slider */}
      <div className="space-y-2 pt-1 border-t border-slate-800/60">
        <div className="flex justify-between text-xs text-slate-300 font-medium">
          <span>消除画笔大小</span>
          <span className="font-mono text-pink-400">{eraserConfig.brushSize} px</span>
        </div>
        <input
          id="slider-eraser-brush-size"
          type="range"
          min="6"
          max="120"
          step="2"
          value={eraserConfig.brushSize}
          onChange={(e) => onUpdateEraserConfig({ brushSize: Number(e.target.value) })}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>细小瑕疵 (6px)</span>
          <span>大件路人 (120px)</span>
        </div>
      </div>

      {/* Fixed local inpainting engine */}
      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>算法引擎选择</span>
          </span>
          <span className="text-[10px] text-emerald-400">本地处理 · 隐私安全</span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <button
            id="btn-engine-local"
            onClick={() => onUpdateEraserConfig({ aiMode: false })}
            className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
              "bg-slate-800 border-indigo-500/80 text-white shadow-sm"
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
              <Zap className="w-3 h-3" />
              <span>极速 PatchMatch</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1">仅修改涂抹区，延续周边材质、纹理与光影</span>
          </button>
        </div>
      </div>

      {/* Practical Guide */}
      <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
        <div className="font-semibold text-slate-300 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>涂抹抹除技巧</span>
        </div>
        <ul className="list-disc pl-4 space-y-1 text-[10px] text-slate-400">
          <li>涂抹范围建议比物体边缘略大 5-10%，修补效果更自然。</li>
          <li>复杂大路人可分批小块消除，获得更逼真的周边环境融合。</li>
        </ul>
      </div>
    </div>
  );
};
