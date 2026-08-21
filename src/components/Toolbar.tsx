import React from "react";
import {
  Scissors,
  Eraser,
  Droplet,
  Stamp,
  Palette,
  SlidersHorizontal,
  Crop,
  Type,
} from "lucide-react";
import { ToolMode } from "../types";

interface ToolbarProps {
  activeTool: ToolMode;
  onSelectTool: (tool: ToolMode) => void;
  disabled?: boolean;
}

interface ToolItem {
  id: ToolMode;
  name: string;
  sub: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

const TOOLS: ToolItem[] = [
  {
    id: "cutout",
    name: "一键抠图",
    sub: "发丝级自动提取",
    icon: Scissors,
    badge: "AI",
    badgeColor: "bg-indigo-500",
  },
  {
    id: "eraser",
    name: "智能消除笔",
    sub: "涂抹无痕抹除",
    icon: Eraser,
    badge: "强效",
    badgeColor: "bg-pink-500",
  },
  {
    id: "watermark",
    name: "去水印",
    sub: "一键框选清理",
    icon: Droplet,
  },
  {
    id: "add_watermark",
    name: "添加水印",
    sub: "防盗与全屏平铺",
    icon: Stamp,
    badge: "防盗",
    badgeColor: "bg-emerald-500",
  },
  {
    id: "background",
    name: "更换背景",
    sub: "证件底色与场景",
    icon: Palette,
    badge: "推荐",
    badgeColor: "bg-amber-500",
  },
  {
    id: "adjust",
    name: "滤镜调色",
    sub: "18+电影预设",
    icon: SlidersHorizontal,
  },
  {
    id: "crop",
    name: "裁剪旋转",
    sub: "标准证件与社交",
    icon: Crop,
  },
  {
    id: "sticker",
    name: "文字贴纸",
    sub: "电商徽章与标签",
    icon: Type,
  },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onSelectTool,
  disabled = false,
}) => {
  return (
    <aside
      id="main-toolbar"
      className="w-20 sm:w-24 bg-slate-900 border-r border-slate-800 flex flex-col py-3 px-1.5 gap-1.5 flex-shrink-0 z-20 overflow-y-auto select-none"
    >
      <div className="px-2 pb-1 text-[10px] uppercase font-bold text-slate-500 tracking-wider text-center">
        功能工具
      </div>

      {TOOLS.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id;

        return (
          <button
            key={tool.id}
            id={`tool-btn-${tool.id}`}
            onClick={() => onSelectTool(tool.id)}
            disabled={disabled}
            className={`relative group w-full py-2.5 px-1.5 rounded-xl flex flex-col items-center justify-center transition-all ${
              isActive
                ? "bg-gradient-to-b from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/80"
            } disabled:opacity-40 disabled:pointer-events-none`}
          >
            {/* Badge */}
            {tool.badge && (
              <span
                className={`absolute top-1 right-1 text-[8px] font-bold text-white px-1 rounded-full ${
                  tool.badgeColor || "bg-indigo-500"
                } shadow-sm`}
              >
                {tool.badge}
              </span>
            )}

            <Icon
              className={`w-5 h-5 mb-1 transition-transform group-hover:scale-110 ${
                isActive ? "text-white" : "text-slate-300"
              }`}
            />
            <span
              className={`text-xs font-medium tracking-tight text-center ${
                isActive ? "text-white font-semibold" : "text-slate-300"
              }`}
            >
              {tool.name}
            </span>
          </button>
        );
      })}
    </aside>
  );
};
