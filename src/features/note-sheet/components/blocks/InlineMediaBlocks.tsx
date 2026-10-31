import React, { useState, useRef } from 'react';
import { SketchItem, SketchWrapMode, LinkItem, NoteAttachment } from '../../../../shared/types';
import { FileAttachmentCard } from '../FileAttachmentCard';
import { AudioAttachmentCard } from '../AudioAttachmentCard';
import { SketchWrapPopover } from './SketchWrapPopover';
import { Pencil, Maximize2, Trash2, Link as LinkIcon, ExternalLink, X, Move, Layers, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../../../shared/api/ipc';

interface ResizableSketchProps {
  sketch: SketchItem;
  onAnnotate: (sketch: SketchItem) => void;
  onRemove: (sketchId: string) => void;
  onUpdateSketch: (sketchId: string, updates: Partial<SketchItem>) => void;
}

export const ResizableSketchBlock: React.FC<ResizableSketchProps> = ({
  sketch, onAnnotate, onRemove, onUpdateSketch,
}) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [liveWidth, setLiveWidth] = useState<number | undefined>(sketch.width);
  const [livePos, setLivePos] = useState<{ x: number; y: number }>({ x: sketch.posX || 0, y: sketch.posY || 0 });
  const [showWrapMenu, setShowWrapMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const wrapMode: SketchWrapMode = sketch.wrapMode || 'square-left';
  const effectiveWidth = liveWidth || sketch.width || 340;
  const isFloating = wrapMode === 'behind' || wrapMode === 'front';

  const startResize = (e: React.MouseEvent, side: 'left' | 'right') => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const initialW = containerRef.current?.offsetWidth || sketch.width || 340;

    const handleMove = (ev: MouseEvent) => {
      const delta = side === 'right' ? ev.clientX - startX : startX - ev.clientX;
      setLiveWidth(Math.round(Math.max(140, Math.min(760, initialW + delta))));
    };

    const handleUp = (ev: MouseEvent) => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      const delta = side === 'right' ? ev.clientX - startX : startX - ev.clientX;
      const finalW = Math.round(Math.max(140, Math.min(760, initialW + delta)));
      setLiveWidth(finalW);
      onUpdateSketch(sketch.id, { width: finalW });
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  const startFreeDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const initX = livePos.x;
    const initY = livePos.y;

    const handleMove = (ev: MouseEvent) => {
      const deltaX = ev.clientX - startX;
      if (wrapMode === 'square-left' || wrapMode === 'square-right') {
        if (deltaX > 80 && wrapMode === 'square-left') {
          onUpdateSketch(sketch.id, { wrapMode: 'square-right' });
        } else if (deltaX < -80 && wrapMode === 'square-right') {
          onUpdateSketch(sketch.id, { wrapMode: 'square-left' });
        }
      } else {
        setLivePos({ x: Math.round(initX + deltaX), y: Math.round(initY + (ev.clientY - startY)) });
      }
    };

    const handleUp = (ev: MouseEvent) => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      if (wrapMode === 'behind' || wrapMode === 'front') {
        const nextX = Math.round(initX + (ev.clientX - startX));
        const nextY = Math.round(initY + (ev.clientY - startY));
        setLivePos({ x: nextX, y: nextY });
        onUpdateSketch(sketch.id, { posX: nextX, posY: nextY });
      }
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  return (
    <>
      <div
        ref={containerRef}
        style={{
          width: `${effectiveWidth}px`,
          maxWidth: '100%',
          ...(wrapMode === 'square-left'
            ? { float: 'left', margin: '4px 16px 8px 0', clear: 'none', position: 'relative', zIndex: 10 }
            : wrapMode === 'square-right'
            ? { float: 'right', margin: '4px 0 8px 16px', clear: 'none', position: 'relative', zIndex: 10 }
            : wrapMode === 'inline'
            ? { float: 'none', clear: 'both', margin: '12px auto 12px 0', display: 'block' }
            : wrapMode === 'behind'
            ? { position: 'absolute', transform: `translate(${livePos.x}px, ${livePos.y}px)`, zIndex: 0, opacity: 0.8 }
            : { position: 'absolute', transform: `translate(${livePos.x}px, ${livePos.y}px)`, zIndex: 30 }),
        }}
        className={`group relative select-none rounded-xl bg-theme-card/40 border border-white/[0.07] hover:border-theme-accent/50 transition-colors shadow-sm overflow-visible ${
          isFloating ? 'cursor-move' : ''
        }`}
      >
        <div onMouseDown={(e) => startResize(e, 'left')} title={t('note.resizeImage')} className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-12 rounded-full bg-black/65 border border-white/35 opacity-0 group-hover:opacity-100 cursor-ew-resize z-20 transition-all hover:bg-theme-accent" />
        <div onMouseDown={(e) => startResize(e, 'right')} title={t('note.resizeImage')} className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-12 rounded-full bg-black/65 border border-white/35 opacity-0 group-hover:opacity-100 cursor-ew-resize z-20 transition-all hover:bg-theme-accent" />

        <div className="absolute top-2 right-2 flex items-center space-x-1 px-1.5 py-1 rounded-lg bg-black/80 border border-white/15 opacity-0 group-hover:opacity-100 transition-opacity z-30">
          {wrapMode !== 'inline' && (
            <button type="button" onMouseDown={startFreeDrag} className="p-1 text-theme-accent hover:text-white rounded cursor-move" title={t('note.dragPosition')}>
              <Move size={13} />
            </button>
          )}
          <button type="button" onClick={(e) => { e.stopPropagation(); setShowWrapMenu((v) => !v); }} className="p-1 text-white/85 hover:text-theme-accent rounded transition-colors cursor-pointer" title={t('note.wrapMode')}>
            <Layers size={13} />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onAnnotate(sketch); }} className="p-1 text-white/85 hover:text-theme-accent rounded transition-colors cursor-pointer" title={t('note.annotate')}>
            <Pencil size={13} />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); setIsFullscreen(true); }} className="p-1 text-white/85 hover:text-white rounded transition-colors cursor-pointer" title={t('note.viewFullSize')}>
            <Maximize2 size={13} />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(sketch.id); }} className="p-1 text-white/85 hover:text-red-400 rounded transition-colors cursor-pointer" title={t('note.deleteSketch')}>
            <Trash2 size={13} />
          </button>
        </div>

        {showWrapMenu && (
          <SketchWrapPopover
            sketch={sketch}
            wrapMode={wrapMode}
            onSelectWrapMode={(mode) => {
              onUpdateSketch(sketch.id, { wrapMode: mode, posX: 0, posY: 0 });
              setLivePos({ x: 0, y: 0 });
              setShowWrapMenu(false);
            }}
          />
        )}

        <img
          src={sketch.dataUrl}
          alt={sketch.title || 'Image'}
          onClick={() => onAnnotate(sketch)}
          className="w-full h-auto max-h-[480px] object-contain block cursor-pointer rounded-t-xl bg-[#14151f]/50"
        />
        {sketch.title && (
          <div className="px-3 py-1 text-[11px] text-theme-muted border-t border-white/[0.04] bg-theme-card/70 rounded-b-xl truncate flex items-center justify-between">
            <span className="truncate">{sketch.title}</span>
            <span className="text-[10px] opacity-60 font-mono">{effectiveWidth}px</span>
          </div>
        )}
      </div>

      {isFullscreen && (
        <div onClick={() => setIsFullscreen(false)} className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-6 animate-in fade-in duration-150">
          <button type="button" onClick={() => setIsFullscreen(false)} className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer">
            <X size={20} />
          </button>
          <img src={sketch.dataUrl} alt={sketch.title} className="max-w-[92vw] max-h-[88vh] object-contain rounded-xl shadow-2xl" />
        </div>
      )}
    </>
  );
};

export interface InlineLinkBlockProps {
  link: LinkItem;
  lineIndex?: number;
  exclusionPadding?: { left?: number; right?: number; marginTop?: number };
  registerLineEl?: (lineIndex: number, el: HTMLDivElement | null) => void;
  onRemove: (id: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onMoveLine?: (fromIdx: number, toIdx: number) => void;
}

export const InlineLinkBlock: React.FC<InlineLinkBlockProps> = ({
  link,
  lineIndex,
  exclusionPadding,
  registerLineEl,
  onRemove,
  onMoveUp,
  onMoveDown,
  onMoveLine,
}) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (lineIndex !== undefined && registerLineEl) {
      registerLineEl(lineIndex, containerRef.current);
      return () => registerLineEl(lineIndex, null);
    }
  }, [lineIndex, registerLineEl]);

  let domain = link.url;
  try {
    const u = new URL(link.url.startsWith('http') ? link.url : `https://${link.url}`);
    domain = u.hostname.replace(/^www\./, '');
  } catch {}

  const handleOpenLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    api.openExternalUrl(link.url);
  };

  return (
    <div
      ref={containerRef}
      style={{
        paddingLeft: exclusionPadding?.left ? `${exclusionPadding.left}px` : undefined,
        paddingRight: exclusionPadding?.right ? `${exclusionPadding.right}px` : undefined,
        marginTop: exclusionPadding?.marginTop ? `${exclusionPadding.marginTop}px` : undefined,
      }}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('application/udo-link-line')) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }
      }}
      onDrop={(e) => {
        const fromIdxStr = e.dataTransfer.getData('application/udo-link-line');
        if (fromIdxStr && lineIndex !== undefined && onMoveLine) {
          e.preventDefault();
          e.stopPropagation();
          const fromIdx = parseInt(fromIdxStr, 10);
          if (!isNaN(fromIdx) && fromIdx !== lineIndex) {
            onMoveLine(fromIdx, lineIndex);
          }
        }
      }}
      className="group/link-container relative py-1 transition-[padding,margin] duration-75 block max-w-full"
    >
      <div
        draggable={lineIndex !== undefined}
        onDragStart={(e) => {
          if (lineIndex !== undefined) {
            e.dataTransfer.setData('application/udo-link-line', String(lineIndex));
            e.dataTransfer.effectAllowed = 'move';
          }
        }}
        className="inline-flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-theme-card/70 hover:bg-theme-card border border-white/[0.07] hover:border-white/[0.15] transition-all shadow-xs max-w-md group select-none relative"
      >
        {/* Drag handle */}
        {lineIndex !== undefined && (
          <div
            className="text-theme-muted/40 hover:text-theme-muted cursor-grab active:cursor-grabbing p-0.5 -ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
            title={t('note.dragPosition') || 'Arrastrar para reordenar'}
          >
            <GripVertical size={13} />
          </div>
        )}

        <div className="w-7 h-7 rounded-lg bg-theme-column/80 border border-white/[0.04] flex items-center justify-center shrink-0 text-blue-400">
          <LinkIcon size={13} />
        </div>

        <button
          type="button"
          onClick={handleOpenLink}
          className="flex-1 min-w-0 pr-2 text-left cursor-pointer"
        >
          <div className="text-xs font-medium text-theme-text truncate group-hover:text-theme-accent transition-colors">
            {link.title || domain}
          </div>
          <div className="text-[10px] text-theme-muted truncate flex items-center space-x-1">
            <span>{domain}</span>
            <ExternalLink size={9} className="opacity-60 shrink-0" />
          </div>
        </button>

        {/* Action buttons (Move Up, Move Down, Delete) */}
        <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {onMoveUp && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              className="text-theme-muted hover:text-theme-text p-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
              title={t('note.moveUp') || 'Subir'}
            >
              <ChevronUp size={12} />
            </button>
          )}
          {onMoveDown && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              className="text-theme-muted hover:text-theme-text p-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
              title={t('note.moveDown') || 'Bajar'}
            >
              <ChevronDown size={12} />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(link.id);
            }}
            className="text-theme-muted hover:text-red-400 p-1 rounded hover:bg-red-400/10 transition-all cursor-pointer"
            title={t('note.deleteLink')}
          >
            <X size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

export const InlineAttachmentBlock: React.FC<{
  attachment: NoteAttachment;
  onRemove: (id: string) => void;
  onRename?: (id: string, newName: string) => void;
}> = ({ attachment, onRemove, onRename }) => (
  <div className="my-1.5">
    {attachment.kind === 'audio' ? (
      <AudioAttachmentCard attachment={attachment} onRemove={onRemove} onRename={onRename} />
    ) : (
      <FileAttachmentCard attachment={attachment} onRemove={onRemove} />
    )}
  </div>
);
