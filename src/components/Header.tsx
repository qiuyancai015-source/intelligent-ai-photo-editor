import React from "react";
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  SplitSquareVertical,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
  Layers,
  Home,
} from "lucide-react";

interface HeaderProps {
  hasImage: boolean;
  canUndo: boolean;
  canRedo: boolean;
  undoTitle?: string;
  redoTitle?: string;
  zoom: number;
  isCompareActive: boolean;
  isProcessing: boolean;
  isCutoutActive?: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onToggleCompare: () => void;
  onOpenExport: () => void;
  onReset: () => void;
  onGoHome: () => void;
  imageDimensions?: { width: number; height: number };
}

export const Header: React.FC<HeaderProps> = ({
  hasImage,
  canUndo,
  canRedo,
  undoTitle,
  redoTitle,
  zoom,
  isCompareActive,
  isProcessing,
  isCutoutActive = false,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onToggleCompare,
  onOpenExport,
  onReset,
  onGoHome,
  imageDimensions,
}) => {
  return (
    <header
      id="app-header"
      className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between text-white select-none z-30 flex-shrink-0"
    >
      {/* Brand & Logo - Clickable to go home */}
      <div
        id="btn-brand-home"
        onClick={onGoHome}
        className="flex items-center gap-3 cursor-pointer group hover:opacity-90 transition-opacity"
        title="点击返回首页 / 重新开始"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-sm tracking-wide text-slate-100 group-hover:text-indigo-300 transition-colors">
              智能AI修图大师
            </h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30">
              PRO 2026
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            一键抠图 · 消除去水印 · 换背景底色 · 滤镜调色
          </p>
        </div>
      </div>

      {/* Center Tools: Undo, Redo, Zoom, Compare */}
      {hasImage && (
        <div className="flex items-center gap-1 bg-slate-800/80 rounded-lg p-1 border border-slate-700/60 shadow-inner">
          {/* History */}
          <button
            id="btn-undo"
            onClick={onUndo}
            disabled={!canUndo}
            title={canUndo ? `撤销: ${undoTitle || "上一步"} (Ctrl+Z)` : "无可撤销操作 (Ctrl+Z)"}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 disabled:text-slate-600 disabled:hover:bg-transparent transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            id="btn-redo"
            onClick={onRedo}
            disabled={!canRedo}
            title={canRedo ? `重做: ${redoTitle || "下一步"} (Ctrl+Y)` : "无可重做操作 (Ctrl+Y)"}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 disabled:text-slate-600 disabled:hover:bg-transparent transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-700 mx-1" />

          {/* Zoom */}
          <button
            id="btn-zoom-out"
            onClick={onZoomOut}
            title="缩小"
            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono px-1.5 text-slate-300 min-w-[42px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            id="btn-zoom-in"
            onClick={onZoomIn}
            title="放大"
            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            id="btn-zoom-fit"
            onClick={onZoomFit}
            title="适应画布"
            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-slate-700 mx-1" />

          {/* Compare original */}
          <button
            id="btn-compare"
            onClick={onToggleCompare}
            title="原图对比 (按住或切换查看)"
            className={`px-2.5 py-1 text-xs rounded flex items-center gap-1.5 font-medium transition-colors ${
              isCompareActive
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                : "hover:bg-slate-700 text-slate-300"
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>原图对比</span>
          </button>
        </div>
      )}

      {/* Right Controls: Image Info & Export */}
      <div className="flex items-center gap-2">
        {hasImage && imageDimensions && (
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 font-mono bg-slate-800/50 px-2.5 py-1 rounded border border-slate-700/50">
            <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {imageDimensions.width} × {imageDimensions.height} px
            </span>
          </div>
        )}

        {/* Home Button */}
        {hasImage && (
          <button
            id="btn-header-go-home"
            onClick={onGoHome}
            title="返回首页 / 重新开始"
            className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Home className="w-3.5 h-3.5 text-indigo-400" />
            <span>回首页</span>
          </button>
        )}

        {hasImage && (
          <button
            id="btn-export-main"
            onClick={onOpenExport}
            disabled={isProcessing}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-all transform active:scale-95 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isCutoutActive ? "保存透明PNG" : "导出高清图"}</span>
          </button>
        )}
      </div>
    </header>
  );
};
