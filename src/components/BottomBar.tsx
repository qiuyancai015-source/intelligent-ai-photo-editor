import React from "react";
import { SAMPLE_IMAGES, SampleImage } from "../utils/sampleImages";
import { Image as ImageIcon, Sparkles, Sliders } from "lucide-react";

interface BottomBarProps {
  hasImage: boolean;
  onSelectSample: (sample: SampleImage) => void;
  activeToolName: string;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  hasImage,
  onSelectSample,
  activeToolName,
}) => {
  if (!hasImage) return null;

  return (
    <footer
      id="app-bottom-bar"
      className="h-11 bg-slate-900 border-t border-slate-800 px-4 flex items-center justify-between text-xs text-slate-400 select-none flex-shrink-0 z-20"
    >
      {/* Sample Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto max-w-[60vw]">
        <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium whitespace-nowrap">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>换测试图:</span>
        </span>
        <div className="flex items-center gap-1.5">
          {SAMPLE_IMAGES.map((sample) => (
            <button
              key={sample.id}
              onClick={() => onSelectSample(sample)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 hover:text-white border border-slate-700/60 whitespace-nowrap transition-colors"
            >
              {sample.title}
            </button>
          ))}
        </div>
      </div>

      {/* Current Active Tool Status */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-slate-400">
          当前模式: <strong className="text-indigo-300">{activeToolName}</strong>
        </span>
      </div>
    </footer>
  );
};
