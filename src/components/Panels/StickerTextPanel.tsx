import React, { useState } from "react";
import {
  Type,
  Tag,
  Plus,
  Trash2,
  RotateCw,
  Maximize2,
  Move,
  Sliders,
  Palette,
  Sparkles,
  Copy,
  Layers,
} from "lucide-react";
import { TextElement, StickerElement } from "../../types";

interface StickerTextPanelProps {
  textElements: TextElement[];
  stickers: StickerElement[];
  selectedElement: { type: "text" | "sticker"; id: string } | null;
  onSelectElement: (type: "text" | "sticker", id: string | null) => void;
  onAddText: (text: string, color: string, bgColor?: string) => void;
  onAddSticker: (badgeType: StickerElement["badgeType"], title: string) => void;
  onUpdateText: (id: string, updates: Partial<TextElement>) => void;
  onUpdateSticker: (id: string, updates: Partial<StickerElement>) => void;
  onRemoveText: (id: string) => void;
  onRemoveSticker: (id: string) => void;
}

const BADGE_PRESETS: { type: StickerElement["badgeType"]; label: string; bg: string }[] = [
  { type: "hot", label: "🔥 爆款热销", bg: "bg-red-500" },
  { type: "new", label: "✨ 新品首发", bg: "bg-emerald-500" },
  { type: "authentic", label: "🛡️ 正品保障", bg: "bg-blue-500" },
  { type: "discount", label: "🏷️ 限时特惠", bg: "bg-amber-500" },
  { type: "sale", label: "💥 狂欢大促", bg: "bg-pink-500" },
  { type: "verified", label: "✓ 官方认证", bg: "bg-indigo-500" },
  { type: "ai", label: "⚡ AI 生成", bg: "bg-purple-600" },
];

const POSITION_PRESETS = [
  { label: "左上", x: 18, y: 15 },
  { label: "中上", x: 50, y: 15 },
  { label: "右上", x: 82, y: 15 },
  { label: "居左", x: 18, y: 50 },
  { label: "正中", x: 50, y: 50 },
  { label: "居右", x: 82, y: 50 },
  { label: "左下", x: 18, y: 85 },
  { label: "中下", x: 50, y: 85 },
  { label: "右下", x: 82, y: 85 },
];

export const StickerTextPanel: React.FC<StickerTextPanelProps> = ({
  textElements,
  stickers,
  selectedElement,
  onSelectElement,
  onAddText,
  onAddSticker,
  onUpdateText,
  onUpdateSticker,
  onRemoveText,
  onRemoveSticker,
}) => {
  const [inputText, setInputText] = useState("双11特惠 · 爆款精选");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [textBgColor, setTextBgColor] = useState("#EF4444");

  const handleAddText = () => {
    if (!inputText.trim()) return;
    onAddText(inputText.trim(), textColor, textBgColor);
    setInputText("");
  };

  const activeText =
    selectedElement?.type === "text"
      ? textElements.find((t) => t.id === selectedElement.id)
      : null;
  const activeSticker =
    selectedElement?.type === "sticker"
      ? stickers.find((s) => s.id === selectedElement.id)
      : null;

  return (
    <div id="panel-sticker-text" className="space-y-5 text-slate-200">
      {/* Title */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Type className="w-4 h-4 text-pink-400" />
            <span>文字排版与电商徽章</span>
          </h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          可直接在图片上拖拽移动、旋转手柄旋转、拖动四角缩放，或在下方调节属性。
        </p>
      </div>

      {/* ACTIVE SELECTED ELEMENT CONTROLS */}
      {activeText && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-pink-500/50 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-pink-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>调节选中文字: "{activeText.text.slice(0, 10)}"</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onSelectElement("text", null)}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                取消选中
              </button>
              <button
                onClick={() => onRemoveText(activeText.id)}
                className="p-1 rounded bg-red-950/60 hover:bg-red-600 text-red-400 hover:text-white transition-colors"
                title="删除图层"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Text Content Live Edit */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-400">文字文案内容</label>
            <input
              type="text"
              value={activeText.text}
              onChange={(e) => onUpdateText(activeText.id, { text: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-pink-500"
            />
          </div>

          {/* Scale / Font Size */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Maximize2 className="w-3 h-3 text-pink-400" />
                <span>缩放倍率</span>
              </span>
              <span className="font-mono text-pink-400 text-[11px]">
                {((activeText.scale || 1) * 100).toFixed(0)}% ({activeText.fontSize}px)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  onUpdateText(activeText.id, {
                    scale: Math.max(0.3, Number(((activeText.scale || 1) - 0.1).toFixed(2))),
                  })
                }
                className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center"
              >
                -
              </button>
              <input
                type="range"
                min="0.3"
                max="3.0"
                step="0.05"
                value={activeText.scale || 1}
                onChange={(e) => onUpdateText(activeText.id, { scale: parseFloat(e.target.value) })}
                className="flex-1 accent-pink-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <button
                onClick={() =>
                  onUpdateText(activeText.id, {
                    scale: Math.min(3.0, Number(((activeText.scale || 1) + 0.1).toFixed(2))),
                  })
                }
                className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          {/* Rotation Angle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <RotateCw className="w-3 h-3 text-pink-400" />
                <span>旋转角度</span>
              </span>
              <span className="font-mono text-pink-400 text-[11px]">
                {activeText.rotation || 0}°
              </span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              step="1"
              value={activeText.rotation || 0}
              onChange={(e) => onUpdateText(activeText.id, { rotation: parseInt(e.target.value) })}
              className="w-full accent-pink-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="grid grid-cols-4 gap-1 pt-1">
              {[0, 90, 180, -90].map((deg) => (
                <button
                  key={deg}
                  onClick={() => onUpdateText(activeText.id, { rotation: deg })}
                  className={`py-1 rounded text-[10px] font-mono transition-colors ${
                    activeText.rotation === deg
                      ? "bg-pink-600 text-white font-bold"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {deg}°
                </button>
              ))}
            </div>
          </div>

          {/* Quick 9-Grid Position */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Move className="w-3 h-3 text-pink-400" />
                <span>九宫格快速对齐位置</span>
              </span>
              <span className="font-mono text-slate-400 text-[10px]">
                X:{Math.round(activeText.x)}% Y:{Math.round(activeText.y)}%
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {POSITION_PRESETS.map((pos) => (
                <button
                  key={pos.label}
                  onClick={() => onUpdateText(activeText.id, { x: pos.x, y: pos.y })}
                  className="py-1 rounded bg-slate-800 hover:bg-pink-900/40 hover:text-pink-300 text-slate-300 text-[10px] transition-colors"
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color & Styling Options */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                <span>文字颜色</span>
                <input
                  type="color"
                  value={activeText.color}
                  onChange={(e) => onUpdateText(activeText.id, { color: e.target.value })}
                  className="w-5 h-5 rounded border-0 cursor-pointer bg-transparent"
                />
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                <span>胶囊底色</span>
                <input
                  type="color"
                  value={activeText.bgColor || "#EF4444"}
                  onChange={(e) => onUpdateText(activeText.id, { bgColor: e.target.value })}
                  className="w-5 h-5 rounded border-0 cursor-pointer bg-transparent"
                />
                {activeText.bgColor && (
                  <button
                    onClick={() => onUpdateText(activeText.id, { bgColor: undefined })}
                    className="text-[10px] text-slate-500 hover:text-red-400 ml-1"
                  >
                    无底色
                  </button>
                )}
              </label>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <label className="flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeText.hasShadow}
                  onChange={(e) => onUpdateText(activeText.id, { hasShadow: e.target.checked })}
                  className="accent-pink-500 rounded"
                />
                <span>投影立体感</span>
              </label>
              <label className="flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeText.hasBorder}
                  onChange={(e) => onUpdateText(activeText.id, { hasBorder: e.target.checked })}
                  className="accent-pink-500 rounded"
                />
                <span>白边描边</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {activeSticker && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/50 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>调节贴纸徽章: "{activeSticker.title}"</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onSelectElement("sticker", null)}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                取消选中
              </button>
              <button
                onClick={() => onRemoveSticker(activeSticker.id)}
                className="p-1 rounded bg-red-950/60 hover:bg-red-600 text-red-400 hover:text-white transition-colors"
                title="删除图层"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Sticker Title Edit */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-400">贴纸标题文案</label>
            <input
              type="text"
              value={activeSticker.title}
              onChange={(e) => onUpdateSticker(activeSticker.id, { title: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Scale */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Maximize2 className="w-3 h-3 text-amber-400" />
                <span>缩放大小</span>
              </span>
              <span className="font-mono text-amber-400 text-[11px]">
                {(activeSticker.scale * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  onUpdateSticker(activeSticker.id, {
                    scale: Math.max(0.3, Number((activeSticker.scale - 0.1).toFixed(2))),
                  })
                }
                className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center"
              >
                -
              </button>
              <input
                type="range"
                min="0.3"
                max="3.0"
                step="0.05"
                value={activeSticker.scale}
                onChange={(e) =>
                  onUpdateSticker(activeSticker.id, { scale: parseFloat(e.target.value) })
                }
                className="flex-1 accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <button
                onClick={() =>
                  onUpdateSticker(activeSticker.id, {
                    scale: Math.min(3.0, Number((activeSticker.scale + 0.1).toFixed(2))),
                  })
                }
                className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          {/* Rotation */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <RotateCw className="w-3 h-3 text-amber-400" />
                <span>旋转角度</span>
              </span>
              <span className="font-mono text-amber-400 text-[11px]">
                {activeSticker.rotation || 0}°
              </span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              step="1"
              value={activeSticker.rotation || 0}
              onChange={(e) =>
                onUpdateSticker(activeSticker.id, { rotation: parseInt(e.target.value) })
              }
              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="grid grid-cols-4 gap-1 pt-1">
              {[0, 90, 180, -90].map((deg) => (
                <button
                  key={deg}
                  onClick={() => onUpdateSticker(activeSticker.id, { rotation: deg })}
                  className={`py-1 rounded text-[10px] font-mono transition-colors ${
                    activeSticker.rotation === deg
                      ? "bg-amber-500 text-slate-950 font-bold"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {deg}°
                </button>
              ))}
            </div>
          </div>

          {/* Quick 9-Grid Position */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Move className="w-3 h-3 text-amber-400" />
                <span>九宫格快速对齐位置</span>
              </span>
              <span className="font-mono text-slate-400 text-[10px]">
                X:{Math.round(activeSticker.x)}% Y:{Math.round(activeSticker.y)}%
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {POSITION_PRESETS.map((pos) => (
                <button
                  key={pos.label}
                  onClick={() => onUpdateSticker(activeSticker.id, { x: pos.x, y: pos.y })}
                  className="py-1 rounded bg-slate-800 hover:bg-amber-900/40 hover:text-amber-300 text-slate-300 text-[10px] transition-colors"
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 1. Add Text Section */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5 text-pink-400" />
          <span>添加自定义文字标题</span>
        </span>

        <input
          id="input-text-content"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="输入文案..."
          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-pink-500 placeholder-slate-600"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer">
              <span>文字颜色</span>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-5 h-5 rounded border-0 cursor-pointer bg-transparent"
              />
            </label>
            <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer">
              <span>底色胶囊</span>
              <input
                type="color"
                value={textBgColor}
                onChange={(e) => setTextBgColor(e.target.value)}
                className="w-5 h-5 rounded border-0 cursor-pointer bg-transparent"
              />
            </label>
          </div>

          <button
            id="btn-add-text-action"
            onClick={handleAddText}
            disabled={!inputText.trim()}
            className="px-3.5 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white text-xs font-medium flex items-center gap-1 shadow transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>添加</span>
          </button>
        </div>
      </div>

      {/* 2. Popular E-commerce Badges Grid */}
      <div className="space-y-2 pt-1 border-t border-slate-800/60">
        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-amber-400" />
          <span>一键添加热门电商贴纸</span>
        </span>
        <div className="grid grid-cols-2 gap-2">
          {BADGE_PRESETS.map((badge) => (
            <button
              key={badge.type}
              id={`btn-add-badge-${badge.type}`}
              onClick={() => onAddSticker(badge.type, badge.label)}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-pink-500/60 flex items-center justify-between text-slate-300 text-xs font-medium transition-all group"
            >
              <span>{badge.label}</span>
              <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-pink-400 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* 3. Layer list with Selection State */}
      {(textElements.length > 0 || stickers.length > 0) && (
        <div className="space-y-2 pt-2 border-t border-slate-800/60">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>当前图层元素 (点击选择并调节)</span>
          </span>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {textElements.map((item) => {
              const isSelected = selectedElement?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectElement("text", isSelected ? null : item.id)}
                  className={`p-2 rounded-lg border flex items-center justify-between text-xs cursor-pointer transition-all ${
                    isSelected
                      ? "bg-pink-950/40 border-pink-500 text-pink-200 shadow-sm"
                      : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Type className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? "text-pink-400" : "text-slate-400"}`} />
                    <span className="truncate">{item.text}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {((item.scale || 1) * 100).toFixed(0)}%
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveText(item.id);
                      }}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {stickers.map((item) => {
              const isSelected = selectedElement?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectElement("sticker", isSelected ? null : item.id)}
                  className={`p-2 rounded-lg border flex items-center justify-between text-xs cursor-pointer transition-all ${
                    isSelected
                      ? "bg-amber-950/40 border-amber-500 text-amber-200 shadow-sm"
                      : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Tag className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? "text-amber-400" : "text-slate-400"}`} />
                    <span className="truncate">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {(item.scale * 100).toFixed(0)}%
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveSticker(item.id);
                      }}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
