import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Move, Maximize2, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface FreeBounds {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Props {
  id: string;
  posX?: number;
  posY?: number;
  width?: number;
  height?: number;
  zIndex?: number;
  onUpdateTransform: (updates: {
    posX?: number;
    posY?: number;
    width?: number;
    height?: number;
    zIndex?: number;
  }) => void;
  onRemove: () => void;
  onOpenEdit?: () => void;
  onViewFull?: () => void;
  reportBounds?: (bounds: FreeBounds) => void;
  unregisterBounds?: (id: string) => void;
  children: React.ReactNode;
}

export const FreeObjectWrapper: React.FC<Props> = ({
  id,
  posX = 0,
  posY = 0,
  width = 340,
  height,
  zIndex = 10,
  onUpdateTransform,
  onRemove,
  onOpenEdit,
  onViewFull,
  reportBounds,
  unregisterBounds,
  children,
}) => {
  const { t } = useTranslation();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [livePos, setLivePos] = useState<{ x: number; y: number }>({ x: posX, y: posY });
  const [liveWidth, setLiveWidth] = useState<number>(width);
  const [liveHeight, setLiveHeight] = useState<number | undefined>(height);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setLivePos({ x: posX, y: posY });
  }, [posX, posY]);

  useEffect(() => {
    setLiveWidth(width);
  }, [width]);

  useEffect(() => {
    setLiveHeight(height);
  }, [height]);

  const updateBounds = useCallback(() => {
    const el = wrapperRef.current;
    const h = liveHeight || el?.offsetHeight || 160;
    reportBounds?.({
      id,
      left: livePos.x,
      top: livePos.y,
      width: liveWidth,
      height: h,
    });
  }, [id, livePos.x, livePos.y, liveWidth, liveHeight, reportBounds]);

  useEffect(() => {
    updateBounds();
  }, [updateBounds]);

  useEffect(() => {
    return () => {
      unregisterBounds?.(id);
    };
  }, [id, unregisterBounds]);

  const handleStartDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const initX = livePos.x;
    const initY = livePos.y;

    const onMove = (ev: MouseEvent) => {
      const nextX = Math.max(0, Math.round(initX + (ev.clientX - startX)));
      const nextY = Math.max(0, Math.round(initY + (ev.clientY - startY)));
      setLivePos({ x: nextX, y: nextY });
    };

    const onUp = (ev: MouseEvent) => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      setIsDragging(false);
      const finalX = Math.max(0, Math.round(initX + (ev.clientX - startX)));
      const finalY = Math.max(0, Math.round(initY + (ev.clientY - startY)));
      setLivePos({ x: finalX, y: finalY });
      onUpdateTransform({ posX: finalX, posY: finalY });
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const handleStartResize = (e: React.MouseEvent, corner: 'se' | 'e' | 's') => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const initW = liveWidth;
    const initH = liveHeight || wrapperRef.current?.offsetHeight || 180;

    const onMove = (ev: MouseEvent) => {
      if (corner === 'se' || corner === 'e') {
        const nextW = Math.round(Math.max(160, Math.min(840, initW + (ev.clientX - startX))));
        setLiveWidth(nextW);
      }
      if (corner === 'se' || corner === 's') {
        const nextH = Math.round(Math.max(80, Math.min(1000, initH + (ev.clientY - startY))));
        setLiveHeight(nextH);
      }
    };

    const onUp = (ev: MouseEvent) => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      const finalW = Math.round(Math.max(160, Math.min(840, initW + (ev.clientX - startX))));
      const finalH = Math.round(Math.max(80, Math.min(1000, initH + (ev.clientY - startY))));
      setLiveWidth(finalW);
      setLiveHeight(finalH);
      onUpdateTransform({ width: finalW, height: finalH });
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div
      ref={wrapperRef}
      style={{
        transform: `translate3d(${livePos.x}px, ${livePos.y}px, 0)`,
        width: `${liveWidth}px`,
        height: liveHeight ? `${liveHeight}px` : undefined,
        zIndex: zIndex || 10,
      }}
      className={`absolute top-0 left-0 group select-none pointer-events-auto transition-shadow ${
        isDragging ? 'shadow-2xl ring-2 ring-theme-accent cursor-grabbing' : 'hover:shadow-xl'
      }`}
    >
      {/* Floating Action Controls */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="pointer-events-auto absolute -top-4 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-0.5 px-1.5 py-0.5 rounded-lg bg-black/85 border border-white/15 text-white/90 shadow-xl z-50 text-[11px]"
      >
        <button
          type="button"
          onMouseDown={handleStartDrag}
          className="p-1 text-theme-accent hover:text-white rounded cursor-grab active:cursor-grabbing"
          title={t('note.dragPosition')}
        >
          <Move size={12} />
        </button>
        {onOpenEdit && (
          <button type="button" onClick={onOpenEdit} className="p-1 hover:text-theme-accent rounded" title={t('note.annotate')}>
            <Pencil size={12} />
          </button>
        )}
        {onViewFull && (
          <button type="button" onClick={onViewFull} className="p-1 hover:text-white rounded" title={t('note.viewFullSize')}>
            <Maximize2 size={12} />
          </button>
        )}
        <button type="button" onClick={onRemove} className="p-1 hover:text-red-400 rounded" title={t('note.deleteSketch')}>
          <Trash2 size={12} />
        </button>
      </div>

      {/* Main Object Body */}
      <div className="relative w-full h-full rounded-xl bg-theme-card/90 border border-white/[0.08] hover:border-theme-accent/40 shadow-md overflow-hidden">
        {children}
      </div>

      {/* Resizing Handles */}
      <div
        onMouseDown={(e) => handleStartResize(e, 'e')}
        className="pointer-events-auto absolute right-0 top-3 bottom-3 w-1.5 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-theme-accent rounded-r transition-all"
        title={t('note.resizeImage')}
      />
      <div
        onMouseDown={(e) => handleStartResize(e, 's')}
        className="pointer-events-auto absolute left-3 right-3 bottom-0 h-1.5 cursor-ns-resize opacity-0 group-hover:opacity-100 hover:bg-theme-accent rounded-b transition-all"
        title={t('note.resizeImage')}
      />
      <div
        onMouseDown={(e) => handleStartResize(e, 'se')}
        className="pointer-events-auto absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-theme-accent opacity-0 group-hover:opacity-100 cursor-nwse-resize shadow-md transition-all z-40"
        title={t('note.resizeImage')}
      />
    </div>
  );
};