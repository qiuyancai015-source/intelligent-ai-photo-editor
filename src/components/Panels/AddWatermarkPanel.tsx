import React, { useRef } from "react";
import {
  Stamp,
  Grid3X3,
  MousePointer,
  RotateCw,
  Eye,
  Type,
  Image as ImageIcon,
  Upload,
  ShieldCheck,
  Check,
  Trash2,
} from "lucide-react";
import { AddWatermarkConfig } from "../../types";

interface AddWatermarkPanelProps {
  config: AddWatermarkConfig;
  onChange: (config: AddWatermarkConfig | ((prev: AddWatermarkConfig) => AddWatermarkConfig)) => void;
  onApplyPreset: (text: string, isTile: boolean, angle: number) => void;
}

const WATERMARK_PRESETS = [
  {
    title: "证件专用",
    text: "仅供办理业务使用 他用无效",
    desc: "全屏平铺 · 倾斜防盗",
    angle: -30,
    isTile: true,
    color: "#EF4444",
  },
  {
    title: "版权保护",
    text: "© 2026 版权所有 · 盗图必究",
    desc: "右下角/平铺 · 商业保护",
    angle: 0,
    isTile: false,
    color: "#FFFFFF",
  },
  {
    title: "样品打样",
    text: "SAMPLE · 官方审阅样片",
    desc: "全屏斜向 · 防截图盗用",
    angle: -45,
    isTile: true,
    color: "#94A3B8",
  },
  {
    title: "正品实拍",
    text: "★ 官方旗舰店正品实拍 ★",
    desc: "底部居中 · 电商防搬运",
    angle: 0,
    isTile: false,
    color: "#F59E0B",
  },
  {
    title: "机密保护",
    text: "CONFIDENTIAL · 内部机密",
    desc: "全屏密集 · 防拍照外泄",
    angle: -35,
    isTile: true,
    color: "#DC2626",
  },
];

const PRESET_COLORS = [
  { label: "纯白", value: "#FFFFFF" },
  { label: "纯黑", value: "#000000" },
  { label: "防盗红", value: "#EF4444" },
  { label: "安全金", value: "#F59E0B" },
  { label: "半透灰", value: "#94A3B8" },
  { label: "科技蓝", value: "#3B82F6" },
];

const ROTATION_SHORTCUTS = [-45, -30, 0, 30, 45];

const POSITIONS = [
  { id: "top-left", label: "左上" },
  { id: "top-center", label: "上中" },
  { id: "top-right", label: "右上" },
  { id: "center-left", label: "左中" },
  { id: "center", label: "居中" },
  { id: "center-right", label: "右中" },
  { id: "bottom-left", label: "左下" },
  { id: "bottom-center", label: "下中" },
  { id: "bottom-right", label: "右下" },
] as const;

export const AddWatermarkPanel: React.FC<AddWatermarkPanelProps> = ({
  config,
  onChange,
  onApplyPreset,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        onChange((prev) => ({
          ...prev,
          enabled: true,
          type: "image",
          imageUrl: result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 select-none" id="add-watermark-panel">
      {/* Enable Toggle Header */}
      <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/70 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Stamp className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">添加防盗水印</h4>
            <p className="text-xs text-slate-400">
              {config.enabled ? "水印渲染已启用" : "已暂停渲染水印"}
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, enabled: e.target.checked }))
            }
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
        </label>
      </div>

      {/* Watermark Type Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          水印形式
        </label>
        <div className="grid grid-cols-2 gap-2 bg-slate-800/60 p-1.5 rounded-xl border border-slate-700/60">
          <button
            id="watermark-type-text-btn"
            onClick={() =>
              onChange((prev) => ({ ...prev, enabled: true, type: "text" }))
            }
            className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all ${
              config.type === "text"
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20 font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
            }`}
          >
            <Type className="w-4 h-4" />
            文字防盗水印
          </button>
          <button
            id="watermark-type-image-btn"
            onClick={() =>
              onChange((prev) => ({ ...prev, enabled: true, type: "image" }))
            }
            className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all ${
              config.type === "image"
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20 font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            图片 / Logo 水印
          </button>
        </div>
      </div>

      {/* Quick Presets for Text */}
      {config.type === "text" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              一键防盗模版
            </label>
            <span className="text-[10px] text-slate-500">点击即用</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {WATERMARK_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                id={`watermark-preset-${idx}`}
                onClick={() => {
                  onChange((prev) => ({
                    ...prev,
                    enabled: true,
                    type: "text",
                    text: preset.text,
                    layout: preset.isTile ? "tile" : "single",
                    rotation: preset.angle,
                    color: preset.color,
                  }));
                }}
                className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between group ${
                  config.text === preset.text
                    ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                    : "bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{preset.title}</span>
                    <span className="text-[10px] text-slate-500">
                      {preset.desc}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[230px]">
                    {preset.text}
                  </div>
                </div>
                {config.text === preset.text ? (
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    应用
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Text Watermark Content Input */}
      {config.type === "text" && (
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            水印文字内容
          </label>
          <input
            id="watermark-text-input"
            type="text"
            value={config.text}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, enabled: true, text: e.target.value }))
            }
            placeholder="输入水印文字，如：仅供办理XX使用 他用无效"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
          />

          {/* Preset Color Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>文字颜色</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={config.color}
                  onChange={(e) =>
                    onChange((prev) => ({ ...prev, color: e.target.value }))
                  }
                  className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="font-mono text-[11px]">{config.color}</span>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() =>
                    onChange((prev) => ({ ...prev, color: c.value }))
                  }
                  title={c.label}
                  className={`h-7 rounded-md border flex items-center justify-center transition-all ${
                    config.color === c.value
                      ? "ring-2 ring-emerald-500 ring-offset-1 ring-offset-slate-900 border-white"
                      : "border-slate-700 hover:border-slate-500"
                  }`}
                  style={{ backgroundColor: c.value }}
                >
                  {config.color === c.value && (
                    <Check
                      className={`w-3.5 h-3.5 ${
                        c.value === "#FFFFFF" ? "text-slate-900" : "text-white"
                      }`}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Shadow toggle */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-400">文字投影 (增强复杂背景可读性)</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.hasShadow}
                onChange={(e) =>
                  onChange((prev) => ({ ...prev, hasShadow: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>
      )}

      {/* Image / Logo Upload */}
      {config.type === "image" && (
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Logo 图标 / 印章图片
          </label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleLogoUpload}
            accept="image/*"
            className="hidden"
          />

          {config.imageUrl ? (
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={config.imageUrl}
                  alt="Watermark Logo"
                  className="w-12 h-12 object-contain bg-slate-900 rounded-lg p-1 border border-slate-700"
                />
                <div>
                  <div className="text-xs font-medium text-white">已加载 Logo</div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] text-emerald-400 hover:underline mt-0.5"
                  >
                    更换图片
                  </button>
                </div>
              </div>
              <button
                onClick={() =>
                  onChange((prev) => ({ ...prev, imageUrl: undefined }))
                }
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                title="删除 Logo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              id="upload-watermark-logo-btn"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-6 border-2 border-dashed border-slate-700 hover:border-emerald-500/70 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-slate-200 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-700/60 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 flex items-center justify-center transition-colors">
                <Upload className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium">点击上传 Logo / 印章图片</span>
              <span className="text-[10px] text-slate-500">
                支持 PNG(透明底)、JPG、SVG
              </span>
            </button>
          )}

          {/* Logo scale */}
          {config.imageUrl && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Logo 缩放大小</span>
                <span className="font-mono text-emerald-400">
                  {Math.round(config.imageScale * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.1}
                max={2.0}
                step={0.05}
                value={config.imageScale}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    imageScale: parseFloat(e.target.value),
                  }))
                }
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          )}
        </div>
      )}

      {/* Watermark Layout Mode (Tile vs Single) */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          排版布局
        </label>
        <div className="grid grid-cols-2 gap-2 bg-slate-800/60 p-1.5 rounded-xl border border-slate-700/60">
          <button
            id="watermark-layout-tile-btn"
            onClick={() =>
              onChange((prev) => ({ ...prev, layout: "tile" }))
            }
            className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all ${
              config.layout === "tile"
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20 font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
            全屏平铺 (防盗)
          </button>
          <button
            id="watermark-layout-single-btn"
            onClick={() =>
              onChange((prev) => ({ ...prev, layout: "single" }))
            }
            className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all ${
              config.layout === "single"
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20 font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
            }`}
          >
            <MousePointer className="w-4 h-4" />
            单点 / 9宫格定位
          </button>
        </div>

        {/* 9-Grid Position Selector for Single Mode */}
        {config.layout === "single" && (
          <div className="space-y-2 pt-1">
            <span className="text-xs text-slate-400">选择水印位置</span>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-900/80 p-2 rounded-xl border border-slate-700">
              {POSITIONS.map((pos) => (
                <button
                  key={pos.id}
                  id={`watermark-pos-${pos.id}`}
                  onClick={() =>
                    onChange((prev) => ({ ...prev, position: pos.id }))
                  }
                  className={`py-2 text-xs rounded-lg font-medium transition-all ${
                    config.position === pos.id
                      ? "bg-emerald-500 text-white shadow font-semibold"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750"
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tile Density / Spacing */}
        {config.layout === "tile" && (
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>水平间距 (Gap X)</span>
                <span className="font-mono text-emerald-400">{config.gapX}px</span>
              </div>
              <input
                type="range"
                min={100}
                max={360}
                step={10}
                value={config.gapX}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    gapX: parseInt(e.target.value),
                  }))
                }
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>垂直间距 (Gap Y)</span>
                <span className="font-mono text-emerald-400">{config.gapY}px</span>
              </div>
              <input
                type="range"
                min={60}
                max={280}
                step={10}
                value={config.gapY}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    gapY: parseInt(e.target.value),
                  }))
                }
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Rotation & Opacity Controls */}
      <div className="space-y-4 pt-2 border-t border-slate-800">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          角度与透明度调节
        </label>

        {/* Font Size (if text) */}
        {config.type === "text" && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>文字字号</span>
              <span className="font-mono text-emerald-400">{config.fontSize}px</span>
            </div>
            <input
              type="range"
              min={12}
              max={80}
              step={2}
              value={config.fontSize}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  fontSize: parseInt(e.target.value),
                }))
              }
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        )}

        {/* Opacity */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              透明度
            </span>
            <span className="font-mono text-emerald-400">
              {Math.round(config.opacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0.05}
            max={1.0}
            step={0.02}
            value={config.opacity}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                opacity: parseFloat(e.target.value),
              }))
            }
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        {/* Rotation */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <RotateCw className="w-3.5 h-3.5" />
              旋转角度
            </span>
            <span className="font-mono text-emerald-400">{config.rotation}°</span>
          </div>
          <input
            type="range"
            min={-90}
            max={90}
            step={1}
            value={config.rotation}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                rotation: parseInt(e.target.value),
              }))
            }
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          {/* Quick rotation buttons */}
          <div className="grid grid-cols-5 gap-1.5">
            {ROTATION_SHORTCUTS.map((ang) => (
              <button
                key={ang}
                onClick={() =>
                  onChange((prev) => ({ ...prev, rotation: ang }))
                }
                className={`py-1 text-[11px] font-mono rounded border transition-all ${
                  config.rotation === ang
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold"
                    : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200"
                }`}
              >
                {ang}°
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
