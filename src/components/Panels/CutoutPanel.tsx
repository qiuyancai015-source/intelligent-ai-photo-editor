import React, { useState } from "react";
import { Scissors, Sparkles, Sliders, Layers, RefreshCw, Check, Palette, CheckCircle2 } from "lucide-react";
import { CutoutConfig, BgConfig, AiAnalysisResult } from "../../types";

interface CutoutPanelProps {
  cutoutConfig: CutoutConfig;
  bgConfig: BgConfig;
  isProcessing: boolean;
  aiAnalysis: AiAnalysisResult | null;
  onApplyCutout: () => void;
  onRestoreOriginal: () => void;
  onUpdateCutoutConfig: (cfg: Partial<CutoutConfig>) => void;
  onUpdateBgConfig: (cfg: Partial<BgConfig>) => void;
  onRunAiAnalyze: () => void;
  onDownloadTransparentPng?: () => void;
}

export const CutoutPanel: React.FC<CutoutPanelProps> = ({
  cutoutConfig,
  bgConfig,
  isProcessing,
  aiAnalysis,
  onApplyCutout,
  onRestoreOriginal,
  onUpdateCutoutConfig,
  onUpdateBgConfig,
  onRunAiAnalyze,
  onDownloadTransparentPng,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<"portrait" | "product" | "solid">("portrait");

  const applyPreset = (type: "portrait" | "product" | "solid") => {
    setSelectedPreset(type);
    if (type === "portrait") {
      onUpdateCutoutConfig({ sensitivity: 28, featherRadius: 2, edgeExpansion: 1 });
    } else if (type === "product") {
      onUpdateCutoutConfig({ sensitivity: 38, featherRadius: 1, edgeExpansion: 0 });
    } else if (type === "solid") {
      onUpdateCutoutConfig({ sensitivity: 58, featherRadius: 1, edgeExpansion: -1 });
    }
  };

  return (
    <div id="panel-cutout" className="space-y-5 text-slate-200">
      {/* Header Info */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Scissors className="w-4 h-4 text-indigo-400" />
            <span>智能一键抠图 (去背景)</span>
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
            发丝级边缘
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          输出透明背景，清除外围描边、光晕和色溢；椰奶飞溅、细小液滴、雾气、闪光和粒子完整保留，椰子外壳、椰肉、叶片边缘干净锐利，不添加额外轮廓。
        </p>
      </div>

      {/* Main Action Button */}
      <div className="space-y-2">
        <button
          id="btn-trigger-cutout"
          onClick={() => onApplyCutout()}
          disabled={isProcessing}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span>{cutoutConfig.isCutoutActive ? "✨ 重新应用发丝抠图" : "✨ 开始一键抠图 (去背景)"}</span>
        </button>

        {cutoutConfig.isCutoutActive && (
          <div className="space-y-2 pt-1">
            {onDownloadTransparentPng && (
              <button
                id="btn-download-cutout-png"
                type="button"
                onClick={onDownloadTransparentPng}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <span>💾 立即保存透明底 PNG (无损)</span>
              </button>
            )}
            <button
              id="btn-revert-cutout"
              onClick={() => onRestoreOriginal()}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>恢复未抠图原图</span>
            </button>
          </div>
        )}
      </div>

      {/* Quick Cutout Presets */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          <span>场景预设</span>
        </span>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => applyPreset("portrait")}
            className={`p-2 rounded-lg border text-center transition-all text-xs flex flex-col items-center gap-1 ${
              selectedPreset === "portrait"
                ? "bg-indigo-600/30 border-indigo-500 text-white font-semibold"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <span className="text-base">👤</span>
            <span>人像发丝</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset("product")}
            className={`p-2 rounded-lg border text-center transition-all text-xs flex flex-col items-center gap-1 ${
              selectedPreset === "product"
                ? "bg-indigo-600/30 border-indigo-500 text-white font-semibold"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <span className="text-base">🛍️</span>
            <span>商品物体</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset("solid")}
            className={`p-2 rounded-lg border text-center transition-all text-xs flex flex-col items-center gap-1 ${
              selectedPreset === "solid"
                ? "bg-indigo-600/30 border-indigo-500 text-white font-semibold"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <span className="text-base">🟩</span>
            <span>绿幕单色</span>
          </button>
        </div>
      </div>

      {/* Quick Background Switcher (Immediate visual confirmation) */}
      <div className="space-y-2 pt-1 border-t border-slate-800/60">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-pink-400" />
            <span>抠图底色快速预览</span>
          </span>
          <span className="text-[10px] text-slate-500">
            {bgConfig.type === "transparent" ? "透明底 (PNG)" : bgConfig.color}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {/* Transparent */}
          <button
            type="button"
            onClick={() => onUpdateBgConfig({ type: "transparent" })}
            className={`h-11 rounded-lg border relative flex flex-col items-center justify-center gap-0.5 overflow-hidden transition-all ${
              bgConfig.type === "transparent"
                ? "ring-2 ring-indigo-500 border-indigo-500 font-bold"
                : "border-slate-700 hover:border-slate-600"
            }`}
            style={{
              backgroundImage: `linear-gradient(45deg, #334155 25%, transparent 25%), linear-gradient(-45deg, #334155 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #334155 75%), linear-gradient(-45deg, transparent 75%, #334155 75%)`,
              backgroundSize: "8px 8px",
              backgroundColor: "#1e293b",
            }}
          >
            <span className="text-[10px] font-bold text-white bg-slate-950/80 px-1.5 py-0.5 rounded shadow">
              透明底
            </span>
          </button>

          {/* White */}
          <button
            type="button"
            onClick={() => onUpdateBgConfig({ type: "color", color: "#FFFFFF" })}
            className={`h-11 rounded-lg border relative flex flex-col items-center justify-center bg-white text-slate-900 transition-all ${
              bgConfig.type === "color" && bgConfig.color.toUpperCase() === "#FFFFFF"
                ? "ring-2 ring-indigo-500 border-indigo-500 font-bold"
                : "border-slate-700 hover:border-slate-600"
            }`}
          >
            <span className="text-[10px] font-bold">纯白底</span>
          </button>

          {/* ID Red */}
          <button
            type="button"
            onClick={() => onUpdateBgConfig({ type: "color", color: "#D32F2F" })}
            className={`h-11 rounded-lg border relative flex flex-col items-center justify-center bg-[#D32F2F] text-white transition-all ${
              bgConfig.type === "color" && bgConfig.color === "#D32F2F"
                ? "ring-2 ring-white border-white font-bold"
                : "border-slate-700 hover:border-slate-600"
            }`}
          >
            <span className="text-[10px] font-bold">证件红</span>
          </button>

          {/* ID Blue */}
          <button
            type="button"
            onClick={() => onUpdateBgConfig({ type: "color", color: "#1976D2" })}
            className={`h-11 rounded-lg border relative flex flex-col items-center justify-center bg-[#1976D2] text-white transition-all ${
              bgConfig.type === "color" && bgConfig.color === "#1976D2"
                ? "ring-2 ring-white border-white font-bold"
                : "border-slate-700 hover:border-slate-600"
            }`}
          >
            <span className="text-[10px] font-bold">证件蓝</span>
          </button>
        </div>
      </div>

      {/* Advanced Edge Matting Sliders */}
      <div className="space-y-3.5 pt-1 border-t border-slate-800/60">
        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          <span>边缘微调与发丝羽化</span>
        </span>

        {/* Feather radius */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400">
            <span>边缘羽化程度 (发丝平滑)</span>
            <span className="font-mono text-slate-200">{cutoutConfig.featherRadius} px</span>
          </div>
          <input
            id="slider-feather-radius"
            type="range"
            min="0"
            max="6"
            step="1"
            value={cutoutConfig.featherRadius}
            onChange={(e) => onUpdateCutoutConfig({ featherRadius: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        {/* Edge shrink / extend */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400">
            <span>边缘收缩 / 延伸</span>
            <span className="font-mono text-slate-200">
              {(cutoutConfig.edgeExpansion || 0) > 0 ? `延伸 +${cutoutConfig.edgeExpansion}` : (cutoutConfig.edgeExpansion || 0) < 0 ? `收缩 ${cutoutConfig.edgeExpansion}` : "原轮廓 0"} px
            </span>
          </div>
          <input id="slider-edge-expansion" type="range" min="-10" max="10" step="1"
            value={cutoutConfig.edgeExpansion || 0}
            onChange={(e) => onUpdateCutoutConfig({ edgeExpansion: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500" />
          <div className="flex justify-between text-[10px] text-slate-600"><span>向内收缩 · 去白边</span><span>向外延伸 · 保细节</span></div>
        </div>

        {/* Sensitivity */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400">
            <span>抠图敏感度 (色差容差)</span>
            <span className="font-mono text-slate-200">{cutoutConfig.sensitivity}%</span>
          </div>
          <input
            id="slider-cutout-sensitivity"
            type="range"
            min="10"
            max="90"
            step="5"
            value={cutoutConfig.sensitivity}
            onChange={(e) => onUpdateCutoutConfig({ sensitivity: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>

      {/* AI Subject Analysis Card */}
      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>AI 视觉主体感知</span>
          </span>
          <button
            id="btn-ai-analyze-trigger"
            onClick={onRunAiAnalyze}
            disabled={isProcessing}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium disabled:opacity-50 flex items-center gap-1"
          >
            {aiAnalysis ? "重新分析" : "点击深度分析"}
          </button>
        </div>

        {aiAnalysis ? (
          <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400">
              <span>识别主体类型:</span>
              <span className="font-semibold text-indigo-300">
                {aiAnalysis.subjectType === "portrait"
                  ? "👤 人像 (证件/写真)"
                  : aiAnalysis.subjectType === "product"
                  ? "🛍️ 商业商品"
                  : aiAnalysis.subjectType === "pet"
                  ? "🐾 宠物萌宠"
                  : aiAnalysis.subjectType || "常规主体"}
              </span>
            </div>
            {aiAnalysis.subjectDescription && (
              <p className="text-[11px] text-slate-400 line-clamp-2">
                {aiAnalysis.subjectDescription}
              </p>
            )}
            {aiAnalysis.suggestedImprovements && aiAnalysis.suggestedImprovements.length > 0 && (
              <div className="pt-1 border-t border-slate-800/60 space-y-0.5">
                <span className="text-[10px] text-slate-500">AI建议:</span>
                {aiAnalysis.suggestedImprovements.slice(0, 2).map((item, idx) => (
                  <div key={idx} className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-slate-400">
            支持智能识别照片主体类型、边缘精细度与智能推荐背景配色。
          </p>
        )}
      </div>

      {/* Subject Outline & Shadow Effects */}
      <div className="space-y-3 pt-2 border-t border-slate-800/60">
        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-pink-400" />
          <span>主体装饰特效</span>
        </span>

        {/* Outline Stroke */}
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-300 cursor-pointer flex items-center gap-2">
              <input
                id="checkbox-subject-stroke"
                type="checkbox"
                checked={bgConfig.stroke.enabled}
                onChange={(e) => {
                  onUpdateBgConfig({
                    stroke: { ...bgConfig.stroke, enabled: e.target.checked },
                  });
                }}
                className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span>主体描边光效 (贴纸风)</span>
            </label>
            {bgConfig.stroke.enabled && (
              <input
                type="color"
                value={bgConfig.stroke.color}
                onChange={(e) =>
                  onUpdateBgConfig({
                    stroke: { ...bgConfig.stroke, color: e.target.value },
                  })
                }
                className="w-5 h-5 rounded border-0 cursor-pointer bg-transparent"
              />
            )}
          </div>

          {bgConfig.stroke.enabled && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>描边宽度</span>
                <span>{bgConfig.stroke.width}px</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={bgConfig.stroke.width}
                onChange={(e) =>
                  onUpdateBgConfig({
                    stroke: { ...bgConfig.stroke, width: Number(e.target.value) },
                  })
                }
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Subject Shadow */}
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-300 cursor-pointer flex items-center gap-2">
              <input
                id="checkbox-subject-shadow"
                type="checkbox"
                checked={bgConfig.shadow.enabled}
                onChange={(e) => {
                  onUpdateBgConfig({
                    shadow: { ...bgConfig.shadow, enabled: e.target.checked },
                  });
                }}
                className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span>立体投影阴影 (电商棚拍)</span>
            </label>
          </div>

          {bgConfig.shadow.enabled && (
            <div className="space-y-2 pt-1">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>阴影模糊度</span>
                  <span>{bgConfig.shadow.blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={bgConfig.shadow.blur}
                  onChange={(e) =>
                    onUpdateBgConfig({
                      shadow: { ...bgConfig.shadow, blur: Number(e.target.value) },
                    })
                  }
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>垂直投影偏移</span>
                  <span>{bgConfig.shadow.offsetY}px</span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="40"
                  value={bgConfig.shadow.offsetY}
                  onChange={(e) =>
                    onUpdateBgConfig({
                      shadow: { ...bgConfig.shadow, offsetY: Number(e.target.value) },
                    })
                  }
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
