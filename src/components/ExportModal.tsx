import React, { useState } from "react";
import { Download, X, Copy, Check, Sparkles, Image as ImageIcon, FileCode2, Loader2 } from "lucide-react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: "png" | "jpeg" | "webp", quality: number, scale: number) => Promise<void>;
  dimensions: { width: number; height: number };
  isCutoutActive?: boolean;
  isTransparentBg?: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  dimensions,
  isCutoutActive = false,
  isTransparentBg = false,
}) => {
  const needsTransparentPng = isCutoutActive || isTransparentBg;
  const [format, setFormat] = useState<"png" | "jpeg" | "webp">(needsTransparentPng ? "png" : "png");
  const [quality, setQuality] = useState(0.95);
  const [scale, setScale] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const handleDownloadZip = async () => {
    if (isDownloadingZip) return;
    try {
      setIsDownloadingZip(true);
      const res = await fetch("/api/export-project-zip");
      if (!res.ok) throw new Error("下载服务异常: " + res.status);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "remix-photo-editor-project.zip";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error("ZIP download failed:", err);
      alert("ZIP 下载失败：" + (err?.message || "网络错误，请稍后重试"));
    } finally {
      setIsDownloadingZip(false);
    }
  };

  // Sync format to PNG whenever opened with transparent cutout
  React.useEffect(() => {
    if (needsTransparentPng) {
      setFormat("png");
    }
  }, [isOpen, needsTransparentPng]);

  if (!isOpen) return null;

  const currentW = dimensions.width * scale;
  const currentH = dimensions.height * scale;

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      await onExport(format, quality, scale);
      onClose();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      id="export-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">导出修图作品</h3>
              <p className="text-[11px] text-slate-400">
                {needsTransparentPng ? "检测到抠图透明通道，已自动优选 PNG 格式" : "选择文件格式与分辨率倍率"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notice for transparent cutout */}
        {needsTransparentPng && (
          <div className="p-3 rounded-xl bg-indigo-950/50 border border-indigo-500/40 text-xs text-indigo-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-indigo-100 block font-semibold">已激活抠图 / 透明底色</strong>
              <span className="text-[11px] text-indigo-300">
                保存为 <strong>PNG</strong> 格式可完整保留透明通道。若选 JPG 则会自动填充纯白底。
              </span>
            </div>
          </div>
        )}

        {/* Format Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">导出格式</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                id: "png",
                name: "PNG",
                tag: needsTransparentPng ? "透明底必选" : "推荐",
                desc: "无损透明通道",
              },
              {
                id: "jpeg",
                name: "JPG",
                tag: "不含透明",
                desc: "适合实色背景",
              },
              {
                id: "webp",
                name: "WebP",
                tag: "高压缩",
                desc: "新一代轻量画质",
              },
            ].map((fmt) => (
              <button
                key={fmt.id}
                id={`btn-export-fmt-${fmt.id}`}
                onClick={() => setFormat(fmt.id as any)}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all relative ${
                  format === fmt.id
                    ? "bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20 text-white"
                    : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{fmt.name}</span>
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded font-medium ${
                      fmt.id === "png" && needsTransparentPng
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {fmt.tag}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1">{fmt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Warning if user selects JPG on transparent image */}
        {needsTransparentPng && format === "jpeg" && (
          <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200 leading-snug">
            ⚠️ <strong>提示</strong>：JPG 格式不支持透明通道，导出会将透明背景自动填充为白色。如需保留透明底，请点击切换为 <strong>PNG</strong> 格式。
          </div>
        )}

        {/* Resolution Scale Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">分辨率倍率 (清晰度)</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { scale: 1, label: "1× 原始尺寸", desc: `${dimensions.width}×${dimensions.height}` },
              { scale: 2, label: "2× 2K高清", desc: `${dimensions.width * 2}×${dimensions.height * 2}` },
              { scale: 4, label: "4× 4K超清", desc: `${dimensions.width * 4}×${dimensions.height * 4}` },
            ].map((item) => (
              <button
                key={item.scale}
                id={`btn-export-scale-${item.scale}`}
                onClick={() => setScale(item.scale)}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  scale === item.scale
                    ? "bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20 text-white"
                    : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <span className="text-xs font-bold text-slate-200">{item.label}</span>
                <span className="text-[10px] font-mono text-indigo-400 mt-1">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quality slider for JPG/WebP */}
        {format !== "png" && (
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex justify-between text-xs text-slate-300">
              <span>画质压缩比例</span>
              <span className="font-mono text-indigo-400">{Math.round(quality * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1"
              step="0.05"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        )}

        {/* Dimension Summary */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5 text-slate-300">
            <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>最终输出尺寸:</span>
          </span>
          <span className="text-indigo-300 font-bold">
            {currentW} × {currentH} px
          </span>
        </div>

        {/* Full Project Code ZIP Download Option */}
        <div className="p-3 rounded-xl bg-slate-950/90 border border-indigo-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <FileCode2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <div className="truncate">
              <span className="text-xs font-semibold text-slate-200 block truncate">需要移植完整项目工程？</span>
              <span className="text-[10px] text-slate-400 block truncate">含全部组件、算法、服务端与配置文件 (ZIP)</span>
            </div>
          </div>
          <button
            id="btn-modal-download-zip"
            onClick={handleDownloadZip}
            disabled={isDownloadingZip}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/50 text-xs font-semibold flex items-center gap-1 flex-shrink-0 transition-colors disabled:opacity-50"
          >
            {isDownloadingZip ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Download className="w-3 h-3" />
            )}
            <span>{isDownloadingZip ? "打包中..." : "下载源码ZIP"}</span>
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            id="btn-cancel-export"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
          >
            取消
          </button>
          <button
            id="btn-confirm-export-download"
            onClick={handleDownload}
            disabled={isExporting}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? "正在导出..." : "立即保存下载"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
