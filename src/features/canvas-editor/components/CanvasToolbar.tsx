import React from 'react';
import {
  X,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Pen,
  Highlighter,
  ArrowRight,
  Square,
  Eraser,
  Crop,
  Grid,
  Undo2,
  Redo2,
  Download,
  Save,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type CanvasTool = 'pen' | 'highlighter' | 'arrow' | 'rectangle' | 'eraser' | 'crop';

export interface CanvasToolbarProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotate: () => void;
  activeTool: CanvasTool;
  onSelectTool: (tool: CanvasTool) => void;
  selectedColor: string;
  onSelectColor: (color: string) => void;
  colors: string[];
  showGrid: boolean;
  onToggleGrid: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onExportPng: () => void;
  onSave: () => void;
  onClose: () => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  title,
  onTitleChange,
  zoom,
  onZoomIn,
  onZoomOut,
  onRotate,
  activeTool,
  onSelectTool,
  selectedColor,
  onSelectColor,
  colors,
  showGrid,
  onToggleGrid,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onExportPng,
  onSave,
  onClose,
}) => {
  const { t } = useTranslation();

  return (
    <div className="h-14 bg-theme-sidebar border-b border-theme-border flex items-center justify-between px-4 select-none gap-2">
      {/* Title Input */}
      <div className="flex items-center space-x-2 max-w-xs">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={t('canvas.titlePlaceholder')}
          className="bg-theme-card hover:bg-theme-hover text-theme-text font-semibold text-xs px-2.5 py-1.5 rounded-lg border border-white/[0.08] focus:border-theme-accent outline-none transition-colors w-44"
        />
      </div>

      {/* Center Tools Ribbon */}
      <div className="flex items-center space-x-1 bg-theme-card/80 p-1 rounded-xl border border-theme-border">
        {/* Zoom Out & In */}
        <button
          type="button"
          onClick={onZoomOut}
          className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-hover"
          title={t('canvas.zoomOut')}
        >
          <ZoomOut size={15} />
        </button>
        <span className="text-[11px] font-mono text-theme-muted px-1 min-w-[38px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={onZoomIn}
          className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-hover"
          title={t('canvas.zoomIn')}
        >
          <ZoomIn size={15} />
        </button>

        <div className="w-[1px] h-4 bg-theme-border mx-1" />

        {/* Rotate */}
        <button
          type="button"
          onClick={onRotate}
          className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-hover"
          title={t('canvas.rotate')}
        >
          <RotateCw size={15} />
        </button>

        {/* Grid Toggle */}
        <button
          type="button"
          onClick={onToggleGrid}
          className={`p-1.5 rounded-lg transition-colors ${
            showGrid ? 'bg-theme-accent/20 text-theme-accent' : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover'
          }`}
          title={t('canvas.grid')}
        >
          <Grid size={15} />
        </button>

        <div className="w-[1px] h-4 bg-theme-border mx-1" />

        {/* Drawing Tools */}
        <button
          type="button"
          onClick={() => onSelectTool('pen')}
          className={`p-1.5 rounded-lg transition-colors ${
            activeTool === 'pen' ? 'bg-theme-accent text-white' : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover'
          }`}
          title={t('canvas.pen')}
        >
          <Pen size={15} />
        </button>

        <button
          type="button"
          onClick={() => onSelectTool('highlighter')}
          className={`p-1.5 rounded-lg transition-colors ${
            activeTool === 'highlighter' ? 'bg-theme-accent text-white' : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover'
          }`}
          title={t('canvas.highlighter')}
        >
          <Highlighter size={15} />
        </button>

        <button
          type="button"
          onClick={() => onSelectTool('arrow')}
          className={`p-1.5 rounded-lg transition-colors ${
            activeTool === 'arrow' ? 'bg-theme-accent text-white' : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover'
          }`}
          title={t('canvas.arrow')}
        >
          <ArrowRight size={15} />
        </button>

        <button
          type="button"
          onClick={() => onSelectTool('rectangle')}
          className={`p-1.5 rounded-lg transition-colors ${
            activeTool === 'rectangle' ? 'bg-theme-accent text-white' : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover'
          }`}
          title={t('canvas.rectangle')}
        >
          <Square size={15} />
        </button>

        <button
          type="button"
          onClick={() => onSelectTool('eraser')}
          className={`p-1.5 rounded-lg transition-colors ${
            activeTool === 'eraser' ? 'bg-theme-accent text-white' : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover'
          }`}
          title={t('canvas.eraser')}
        >
          <Eraser size={15} />
        </button>

        <button
          type="button"
          onClick={() => onSelectTool('crop')}
          className={`p-1.5 rounded-lg transition-colors ${
            activeTool === 'crop' ? 'bg-theme-accent text-white' : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover'
          }`}
          title={t('canvas.crop')}
        >
          <Crop size={15} />
        </button>

        <div className="w-[1px] h-4 bg-theme-border mx-1" />

        {/* Color Palette */}
        <div className="flex items-center space-x-1 px-1">
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onSelectColor(c)}
              className={`w-4 h-4 rounded-full transition-transform ${
                selectedColor === c ? 'scale-125 ring-2 ring-white/60' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="w-[1px] h-4 bg-theme-border mx-1" />

        {/* Undo / Redo */}
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-hover disabled:opacity-30"
          title={t('canvas.undo')}
        >
          <Undo2 size={15} />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-hover disabled:opacity-30"
          title={t('canvas.redo')}
        >
          <Redo2 size={15} />
        </button>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={onExportPng}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-theme-card hover:bg-theme-hover text-theme-text border border-theme-border transition-colors"
          title={t('canvas.exportPng')}
        >
          <Download size={14} />
          <span className="hidden sm:inline">{t('canvas.exportPng')}</span>
        </button>

        <button
          type="button"
          onClick={onSave}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
          title={t('canvas.save')}
        >
          <Save size={14} />
          <span>{t('canvas.save')}</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors"
          title={t('canvas.close')}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
