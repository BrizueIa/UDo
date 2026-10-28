import React from 'react';
import { Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Props {
  cropSelection: CropRect | null;
  isCropping: boolean;
  onApplyCrop: () => void;
  onCancelCrop: () => void;
}

export const CanvasCropOverlay: React.FC<Props> = ({
  cropSelection,
  isCropping,
  onApplyCrop,
  onCancelCrop,
}) => {
  const { t } = useTranslation();

  if (!cropSelection) return null;

  return (
    <>
      {/* Rule of Thirds Guides */}
      <div
        style={{
          left: `${cropSelection.x}px`,
          top: `${cropSelection.y}px`,
          width: `${cropSelection.w}px`,
          height: `${cropSelection.h}px`,
        }}
        className="absolute pointer-events-none border-2 border-dashed border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] z-20"
      >
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-40">
          <div className="border-r border-b border-white/60" />
          <div className="border-r border-b border-white/60" />
          <div className="border-b border-white/60" />
          <div className="border-r border-b border-white/60" />
          <div className="border-r border-b border-white/60" />
          <div className="border-b border-white/60" />
          <div className="border-r border-white/60" />
          <div className="border-r border-white/60" />
          <div />
        </div>
      </div>

      {/* Floating Apply Crop Control */}
      {!isCropping && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-theme-sidebar/95 border border-theme-border rounded-xl px-4 py-2 flex items-center space-x-3 shadow-xl z-30 pointer-events-auto">
          <span className="text-xs text-theme-muted font-medium font-mono">
            {Math.round(cropSelection.w)} × {Math.round(cropSelection.h)} px
          </span>
          <button
            type="button"
            onClick={onApplyCrop}
            className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Check size={14} />
            <span>{t('canvas.applyCrop')}</span>
          </button>
          <button
            type="button"
            onClick={onCancelCrop}
            className="p-1 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors"
            title={t('canvas.cancelCrop')}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </>
  );
};
