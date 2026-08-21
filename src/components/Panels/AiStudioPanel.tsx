import React, { useState } from "react";
import { Sparkles, Wand2, RefreshCw, Layers, Check } from "lucide-react";

interface AiStudioPanelProps {
  isProcessing: boolean;
  onGenerateAiBackground: (prompt: string, style: string) => void;
}

const AI_STYLE_PRESETS = [
  { id: "studio", name: "摄影棚展台", desc: "柔和摄影光影 · 极简商品台", icon: "🏛️" },
  { id: "gradient", name: "轻奢光晕", desc: "高级流光溢彩 · 柔焦渐变", icon: "✨" },
  { id: "nature", name: "清新自然", desc: "树影斑驳 · 暖阳微风", icon: "🌿" },
  { id: "office", name: "现代职场", desc: "商务写字楼 · 简约明朗", icon: "💼" },
  { id: "interior", name: "温馨家居", desc: "北欧原木 · 暖意生活", icon: "☕" },
  { id: "cyberpunk", name: "赛博霓虹", desc: "暗夜流光 · 未来科技", icon: "🌆" },
];

export const AiStudioPanel: React.FC<AiStudioPanelProps> = ({
  isProcessing,
  onGenerateAiBackground,
}) => {
  const [prompt, setPrompt] = useState("Minimalist luxury marble podium with soft golden sunbeams and plant shadow");
  const [selectedStyle, setSelectedStyle] = useState("studio");

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    onGenerateAiBackground(prompt.trim(), selectedStyle);
  };

  return (
    <div id="panel-ai-studio" className="space-y-5 text-slate-200">
      {/* Title */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI 场景创意背景生成</span>
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
            Gemini 视觉
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          输入文字描述或选择预设风格，由生成式AI为您的商品或人像生成专属商业摄影级背景。
        </p>
      </div>

      {/* Style Presets Grid */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-300">场景光影风格预设</span>
        <div className="grid grid-cols-2 gap-2">
          {AI_STYLE_PRESETS.map((style) => {
            const isSelected = selectedStyle === style.id;
            return (
              <button
                key={style.id}
                id={`btn-ai-style-${style.id}`}
                onClick={() => setSelectedStyle(style.id)}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  isSelected
                    ? "bg-slate-800 border-purple-500 shadow-md ring-1 ring-purple-500/30"
                    : "bg-slate-900 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base">{style.icon}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-purple-400" />}
                </div>
                <div className="mt-1">
                  <div className="text-xs font-semibold text-slate-200">{style.name}</div>
                  <div className="text-[10px] text-slate-400 line-clamp-1">{style.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Prompt Input */}
      <div className="space-y-2 pt-1 border-t border-slate-800/60">
        <label className="text-xs font-semibold text-slate-300">场景描述词 (Prompt)</label>
        <textarea
          id="textarea-ai-prompt"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="例如：现代极简大理石展台，温暖自然光照射，高级质感..."
          className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500 placeholder-slate-600 resize-none"
        />
      </div>

      {/* Generate Action Button */}
      <button
        id="btn-trigger-ai-gen-bg"
        onClick={handleGenerate}
        disabled={isProcessing || !prompt.trim()}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xs shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
      >
        <Wand2 className="w-4 h-4 animate-spin-slow" />
        <span>{isProcessing ? "AI生成中..." : "🚀 立即生成并应用AI背景"}</span>
      </button>
    </div>
  );
};
