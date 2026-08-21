import React, { useRef } from "react";
import {
  Palette,
  Sparkles,
  Upload,
  Layers,
  Sliders,
  Check,
  Image as ImageIcon,
  SunMedium,
  Compass,
} from "lucide-react";
import { BgConfig, BgType } from "../../types";

interface BackgroundPanelProps {
  bgConfig: BgConfig;
  isCutoutActive: boolean;
  isProcessing: boolean;
  onUpdateBgConfig: (cfg: Partial<BgConfig>) => void;
  onUploadBgImage: (file: File) => void;
  onTriggerCutoutIfNeeded: () => void;
}

// Standard ID Photo Color Presets
const ID_PHOTO_COLORS = [
  { name: "中国红 (证件标准)", hex: "#C8102E", desc: "红底" },
  { name: "科技深蓝 (标准证件)", hex: "#0047AB", desc: "深蓝" },
  { name: "经典纯白 (护照/求职)", hex: "#FFFFFF", desc: "白底" },
  { name: "浅天蓝 (学生/考试)", hex: "#5C95FF", desc: "浅蓝" },
  { name: "毕业枣红 (学位认证)", hex: "#8A1538", desc: "枣红" },
  { name: "高级商务灰 (社保证件)", hex: "#6B7280", desc: "灰底" },
];

// Popular E-commerce & Morandi Palettes
const MORANDI_PALETTE = [
  { name: "奶杏白", hex: "#F5EFE6" },
  { name: "高级灰粉", hex: "#E8D5D5" },
  { name: "雾霾蓝", hex: "#B4C5D6" },
  { name: "鼠尾草绿", hex: "#CCD5AE" },
  { name: "焦糖暖棕", hex: "#D4A373" },
  { name: "燕麦灰", hex: "#E3DFD9" },
  { name: "深海墨蓝", hex: "#1A2530" },
  { name: "暗夜奢黑", hex: "#18181B" },
];

// Gradient Presets
const GRADIENT_PRESETS = [
  { name: "落日余晖", c1: "#FF7E5F", c2: "#FEB47B", angle: 45 },
  { name: "极光冰蓝", c1: "#4E65FF", c2: "#92EFFD", angle: 90 },
  { name: "薰衣草紫", c1: "#A18CD1", c2: "#FBC2EB", angle: 135 },
  { name: "高级冷灰", c1: "#374151", c2: "#111827", angle: 180 },
  { name: "青柠薄荷", c1: "#10B981", c2: "#6EE7B7", angle: 45 },
  { name: "香槟微醺", c1: "#FDE68A", c2: "#F59E0B", angle: 90 },
];

// Studio Texture Presets
const TEXTURE_PRESETS = [
  { id: "studio", name: "棚拍聚光", desc: "居中光晕" },
  { id: "warm_studio", name: "暖调影棚", desc: "温馨金光" },
  { id: "marble", name: "大理石纹", desc: "奢华纹理" },
];

export const BackgroundPanel: React.FC<BackgroundPanelProps> = ({
  bgConfig,
  isCutoutActive,
  isProcessing,
  onUpdateBgConfig,
  onUploadBgImage,
  onTriggerCutoutIfNeeded,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setType = (type: BgType) => {
    onUpdateBgConfig({ type });
    if (!isCutoutActive) {
      onTriggerCutoutIfNeeded();
    }
  };

  return (
    <div id="panel-background" className="space-y-5 text-slate-200">
      {/* Title */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-amber-400" />
            <span>智能更换背景底色</span>
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
            证件照/电商推荐
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          一键秒换红/蓝/白标准证件照底色、莫兰迪色系、渐变光效或自定义影棚场景。
        </p>
      </div>

      {/* Notice if cutout is not active yet */}
      {!isCutoutActive && (
        <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-between text-xs text-indigo-200">
          <span>💡 选择背景色将自动执行智能抠图提取主体</span>
          <button
            id="btn-quick-cutout-for-bg"
            onClick={onTriggerCutoutIfNeeded}
            className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] shadow transition-colors"
          >
            一键抠图
          </button>
        </div>
      )}

      {/* Background Category Tabs */}
      <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] font-medium">
        <button
          id="tab-bg-color"
          onClick={() => setType("color")}
          className={`py-1.5 rounded-lg transition-colors ${
            bgConfig.type === "color"
              ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          纯色底
        </button>
        <button
          id="tab-bg-transparent"
          onClick={() => setType("transparent")}
          className={`py-1.5 rounded-lg transition-colors ${
            bgConfig.type === "transparent"
              ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          透明底
        </button>
        <button
          id="tab-bg-gradient"
          onClick={() => setType("gradient")}
          className={`py-1.5 rounded-lg transition-colors ${
            bgConfig.type === "gradient"
              ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          渐变光效
        </button>
        <button
          id="tab-bg-texture"
          onClick={() => setType("texture")}
          className={`py-1.5 rounded-lg transition-colors ${
            bgConfig.type === "texture" || bgConfig.type === "image"
              ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          场景/自定义
        </button>
      </div>

      {/* 1. Standard ID Photo Color Presets */}
      {bgConfig.type === "color" && (
        <div className="space-y-3.5">
          {/* ID Photo Special Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>🇨🇳 标准证件照底色</span>
              <span className="text-[10px] text-indigo-400 font-normal">一键秒变专业证件</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {ID_PHOTO_COLORS.map((item) => {
                const isSelected = bgConfig.color.toLowerCase() === item.hex.toLowerCase();
                return (
                  <button
                    key={item.hex}
                    id={`btn-id-color-${item.desc}`}
                    onClick={() => {
                      onUpdateBgConfig({ type: "color", color: item.hex });
                      if (!isCutoutActive) onTriggerCutoutIfNeeded();
                    }}
                    className={`group p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      isSelected
                        ? "bg-slate-800 border-amber-500 ring-2 ring-amber-500/20 shadow-md"
                        : "bg-slate-900 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-full shadow-inner border border-white/20 relative flex items-center justify-center"
                      style={{ backgroundColor: item.hex }}
                    >
                      {isSelected && (
                        <Check
                          className={`w-4 h-4 ${
                            item.hex === "#FFFFFF" ? "text-slate-900" : "text-white"
                          }`}
                        />
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-slate-300 group-hover:text-white truncate">
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Morandi & Designer Palettes */}
          <div className="space-y-2 pt-2 border-t border-slate-800/60">
            <span className="text-xs font-semibold text-slate-300">莫兰迪 & 电商高级色系</span>
            <div className="grid grid-cols-4 gap-2">
              {MORANDI_PALETTE.map((item) => {
                const isSelected = bgConfig.color.toLowerCase() === item.hex.toLowerCase();
                return (
                  <button
                    key={item.hex}
                    id={`btn-morandi-color-${item.name}`}
                    onClick={() => {
                      onUpdateBgConfig({ type: "color", color: item.hex });
                      if (!isCutoutActive) onTriggerCutoutIfNeeded();
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? "bg-slate-800 border-amber-500 shadow-md"
                        : "bg-slate-900 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full shadow-inner border border-white/10 flex items-center justify-center"
                      style={{ backgroundColor: item.hex }}
                    >
                      {isSelected && (
                        <Check
                          className={`w-3.5 h-3.5 ${
                            item.hex === "#F5EFE6" || item.hex === "#E3DFD9"
                              ? "text-slate-900"
                              : "text-white"
                          }`}
                        />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 truncate">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Color Picker */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-300">自定义任意 HEX 颜色</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">{bgConfig.color}</span>
              <input
                id="input-bg-custom-color"
                type="color"
                value={bgConfig.color}
                onChange={(e) => {
                  onUpdateBgConfig({ type: "color", color: e.target.value });
                  if (!isCutoutActive) onTriggerCutoutIfNeeded();
                }}
                className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. Transparent Background Mode */}
      {bgConfig.type === "transparent" && (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-xl border border-slate-700 flex items-center justify-center bg-[conic-gradient(#334155_90deg,#1e293b_90deg_180deg,#334155_180deg_270deg,#1e293b_270deg)] bg-[length:12px_12px]" />
          <h4 className="text-xs font-bold text-slate-200">透明通道背景已激活</h4>
          <p className="text-[11px] text-slate-400">
            导出时将保存为透明 PNG，适合用于海报排版、PPT插入、电商上架及社交表情包。
          </p>
        </div>
      )}

      {/* 3. Gradient Mode */}
      {bgConfig.type === "gradient" && (
        <div className="space-y-3.5">
          <span className="text-xs font-semibold text-slate-300">预设渐变流光</span>
          <div className="grid grid-cols-3 gap-2">
            {GRADIENT_PRESETS.map((grad, i) => (
              <button
                key={i}
                id={`btn-gradient-preset-${i}`}
                onClick={() => {
                  onUpdateBgConfig({
                    type: "gradient",
                    gradient: {
                      ...bgConfig.gradient,
                      color1: grad.c1,
                      color2: grad.c2,
                      angle: grad.angle,
                    },
                  });
                  if (!isCutoutActive) onTriggerCutoutIfNeeded();
                }}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/60 flex flex-col items-center gap-1.5 transition-all"
              >
                <div
                  className="w-full h-8 rounded-lg shadow-inner"
                  style={{
                    background: `linear-gradient(${grad.angle}deg, ${grad.c1}, ${grad.c2})`,
                  }}
                />
                <span className="text-[10px] text-slate-300 font-medium">{grad.name}</span>
              </button>
            ))}
          </div>

          {/* Gradient Angle Slider */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>渐变光线角度</span>
              </span>
              <span className="font-mono text-amber-400">{bgConfig.gradient.angle}°</span>
            </div>
            <input
              id="slider-gradient-angle"
              type="range"
              min="0"
              max="360"
              value={bgConfig.gradient.angle}
              onChange={(e) =>
                onUpdateBgConfig({
                  gradient: { ...bgConfig.gradient, angle: Number(e.target.value) },
                })
              }
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>
      )}

      {/* 4. Texture & Custom Image Mode */}
      {(bgConfig.type === "texture" || bgConfig.type === "image") && (
        <div className="space-y-3.5">
          <span className="text-xs font-semibold text-slate-300">影棚摄影场景</span>
          <div className="grid grid-cols-3 gap-2">
            {TEXTURE_PRESETS.map((tex) => {
              const isSelected = bgConfig.type === "texture" && bgConfig.textureId === tex.id;
              return (
                <button
                  key={tex.id}
                  id={`btn-texture-${tex.id}`}
                  onClick={() => {
                    onUpdateBgConfig({ type: "texture", textureId: tex.id });
                    if (!isCutoutActive) onTriggerCutoutIfNeeded();
                  }}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    isSelected
                      ? "bg-slate-800 border-amber-500 shadow-md"
                      : "bg-slate-900 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <SunMedium className="w-5 h-5 text-amber-400 mb-1" />
                  <span className="text-xs font-medium text-slate-200">{tex.name}</span>
                  <span className="text-[9px] text-slate-500">{tex.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Upload Custom Background */}
          <div className="pt-2 border-t border-slate-800/60">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  onUploadBgImage(e.target.files[0]);
                }
              }}
            />
            <button
              id="btn-upload-custom-bg"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/60 text-xs font-medium text-slate-300 flex items-center justify-center gap-2 transition-all"
            >
              <Upload className="w-4 h-4 text-indigo-400" />
              <span>上传自定义背景图片</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
