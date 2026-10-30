import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SketchItem, SketchWrapMode, LinkItem, NoteAttachment } from '../../../../shared/types';
import { FileAttachmentCard } from '../FileAttachmentCard';
import { AudioAttachmentCard } from '../AudioAttachmentCard';
import { storedToVisualHtml, visualHtmlToStored, storedToPlainText } from '../../utils/richTextHtmlCodec';
import { applyFormatToContentEditable } from '../../utils/richTextDomCommands';
import { RichFormatAction } from '../RichTextToolbar';
import { SketchWrapPopover } from './SketchWrapPopover';
import { Pencil, Maximize2, Trash2, Link as LinkIcon, ExternalLink, X, Move, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ResizableSketchProps {
  sketch: SketchItem;
  onAnnotate: (sketch: SketchItem) => void;
  onRemove: (sketchId: string) => void;
  onUpdateSketch: (sketchId: string, updates: Partial<SketchItem>) => void;
  onSelectionChange?: (coords: { x: number; y: number } | null, applyFn: (action: RichFormatAction) => void) => void;
  onWriteAbove?: () => void;
  onWriteBelow?: () => void;
}

export const ResizableSketchBlock: React.FC<ResizableSketchProps> = ({
  sketch, onAnnotate, onRemove, onUpdateSketch, onSelectionChange, onWriteAbove, onWriteBelow,
}) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const sideNoteRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [liveWidth, setLiveWidth] = useState<number | undefined>(sketch.width);
  const [livePos, setLivePos] = useState<{ x: number; y: number }>({ x: sketch.posX || 0, y: sketch.posY || 0 });
  const [showWrapMenu, setShowWrapMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lastSideNoteRef = useRef<string>(sketch.sideNote || '');

  const wrapMode: SketchWrapMode = sketch.wrapMode || 'square-left';

  useEffect(() => {
    const el = sideNoteRef.current;
    if (!el) return;
    const raw = sketch.sideNote || '';
    if (lastSideNoteRef.current !== raw) {
      el.innerHTML = storedToVisualHtml(raw).replace(/\n/g, '<br>');
      lastSideNoteRef.current = raw;
    }
  }, [sketch.sideNote]);

  useEffect(() => {
    const el = sideNoteRef.current;
    if (el && sketch.sideNote) {
      el.innerHTML = storedToVisualHtml(sketch.sideNote).replace(/\n/g, '<br>');
      lastSideNoteRef.current = sketch.sideNote;
    }
  }, []);

  const handleApplySideFormat = useCallback((action: RichFormatAction) => {
    const el = sideNoteRef.current;
    if (!el) return;
    const nextRange = applyFormatToContentEditable(el, action, savedRangeRef.current, (stored) => {
      lastSideNoteRef.current = stored;
      onUpdateSketch(sketch.id, { sideNote: stored });
    });
    if (nextRange) savedRangeRef.current = nextRange.cloneRange();
  }, [onUpdateSketch, sketch.id]);

  const checkSideSelection = useCallback(() => {
    const el = sideNoteRef.current;
    if (!el || !onSelectionChange) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      onSelectionChange(null, handleApplySideFormat);
      return;
    }
    const range = sel.getRangeAt(0);
    if (!el.contains(range.commonAncestorContainer) || !sel.toString().trim()) {
      onSelectionChange(null, handleApplySideFormat);
      return;
    }
    savedRangeRef.current = range.cloneRange();
    const rect = range.getBoundingClientRect();
    const hostRect = el.getBoundingClientRect();
    const x = rect.width > 0 ? rect.left + rect.width / 2 : hostRect.left + hostRect.width / 2;
    const y = rect.top > 0 ? rect.top : hostRect.top;
    onSelectionChange({ x, y }, handleApplySideFormat);
  }, [handleApplySideFormat, onSelectionChange]);

  const startResize = (e: React.MouseEvent, side: 'left' | 'right') => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const initialW = containerRef.current?.offsetWidth || sketch.width || 360;

    const handleMove = (ev: MouseEvent) => {
      const delta = side === 'right' ? ev.clientX - startX : startX - ev.clientX;
      setLiveWidth(Math.round(Math.max(120, Math.min(760, initialW + delta))));
    };

    const handleUp = (ev: MouseEvent) => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      const delta = side === 'right' ? ev.clientX - startX : startX - ev.clientX;
      const finalW = Math.round(Math.max(120, Math.min(760, initialW + delta)));
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
      setLivePos({ x: Math.round(initX + (ev.clientX - startX)), y: Math.round(initY + (ev.clientY - startY)) });
    };

    const handleUp = (ev: MouseEvent) => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      const nextX = Math.round(initX + (ev.clientX - startX));
      const nextY = Math.round(initY + (ev.clientY - startY));
      setLivePos({ x: nextX, y: nextY });
      onUpdateSketch(sketch.id, { posX: nextX, posY: nextY });
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  const effectiveWidth = liveWidth || sketch.width || 340;
  const isSideEmpty = !storedToPlainText(sketch.sideNote || '').trim();
  const isFloating = wrapMode === 'behind' || wrapMode === 'front';

  return (
    <>
      <div
        style={isFloating ? { transform: `translate(${livePos.x}px, ${livePos.y}px)` } : undefined}
        className={`my-2 relative w-full ${
          wrapMode === 'behind' ? 'z-0 opacity-75' : wrapMode === 'front' ? 'z-30' : 'z-10'
        } ${
          wrapMode === 'square-right'
            ? 'flex flex-row-reverse items-start gap-4'
            : wrapMode === 'inline'
            ? 'flex flex-col items-start gap-1.5'
            : 'flex flex-row items-start gap-4'
        }`}
      >
        <div
          ref={containerRef}
          style={{ width: `${effectiveWidth}px`, maxWidth: '100%' }}
          className="group relative shrink-0 rounded-xl bg-theme-card/40 border border-white/[0.07] hover:border-theme-accent/50 transition-colors overflow-visible shadow-sm select-none"
        >
          <div onMouseDown={(e) => startResize(e, 'left')} title={t('note.resizeImage')} className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-12 rounded-full bg-black/65 border border-white/35 opacity-0 group-hover:opacity-100 cursor-ew-resize z-20 transition-all hover:bg-theme-accent" />
          <div onMouseDown={(e) => startResize(e, 'right')} title={t('note.resizeImage')} className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-12 rounded-full bg-black/65 border border-white/35 opacity-0 group-hover:opacity-100 cursor-ew-resize z-20 transition-all hover:bg-theme-accent" />

          <div className="absolute top-2 right-2 flex items-center space-x-1 px-1.5 py-1 rounded-lg bg-black/80 border border-white/15 opacity-0 group-hover:opacity-100 transition-opacity z-30">
            {isFloating && (
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

        {/* Borderless, Natural Editable Text Flow beside the Image/Canvas */}
        {wrapMode !== 'inline' && (
          <div onClick={() => sideNoteRef.current?.focus()} className="relative flex-1 min-w-[140px] py-0.5 cursor-text">
            <div
              ref={sideNoteRef}
              contentEditable
              suppressContentEditableWarning
              onInput={() => {
                const el = sideNoteRef.current;
                if (!el) return;
                const stored = visualHtmlToStored(el);
                lastSideNoteRef.current = stored;
                onUpdateSketch(sketch.id, { sideNote: stored });
              }}
              onMouseUp={checkSideSelection}
              onKeyUp={(e) => {
                if (e.key !== 'Shift' && e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Meta') {
                  checkSideSelection();
                }
              }}
              onKeyDown={(e) => {
                const isCtrl = e.ctrlKey || e.metaKey;
                if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'b') {
                  e.preventDefault();
                  handleApplySideFormat({ type: 'bold' });
                } else if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'i') {
                  e.preventDefault();
                  handleApplySideFormat({ type: 'italic' });
                } else if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'u') {
                  e.preventDefault();
                  handleApplySideFormat({ type: 'underline' });
                } else if (e.key === 'ArrowUp' && onWriteAbove) {
                  e.preventDefault();
                  onWriteAbove();
                } else if (e.key === 'ArrowDown' && onWriteBelow) {
                  e.preventDefault();
                  onWriteBelow();
                }
              }}
              className="outline-none w-full min-h-[120px] text-sm text-theme-text/95 leading-relaxed whitespace-pre-wrap break-words"
            />
            {isSideEmpty && (
              <span className="pointer-events-none absolute left-0 top-1 text-xs text-theme-muted/25 italic select-none">
                {t('note.sideNotePlaceholder')}
              </span>
            )}
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

export const InlineLinkBlock: React.FC<{ link: LinkItem; onRemove: (id: string) => void }> = ({ link, onRemove }) => {
  const { t } = useTranslation();
  let domain = link.url;
  try {
    const u = new URL(link.url.startsWith('http') ? link.url : `https://${link.url}`);
    domain = u.hostname.replace(/^www\./, '');
  } catch {}

  return (
    <div className="my-1.5 inline-flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-theme-card/70 hover:bg-theme-card border border-white/[0.07] hover:border-white/[0.15] transition-all shadow-xs max-w-md group select-none">
      <div className="w-7 h-7 rounded-lg bg-theme-column/80 border border-white/[0.04] flex items-center justify-center shrink-0 text-blue-400">
        <LinkIcon size={13} />
      </div>
      <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0 pr-2">
        <div className="text-xs font-medium text-theme-text truncate group-hover:text-theme-accent transition-colors">{link.title}</div>
        <div className="text-[10px] text-theme-muted truncate flex items-center space-x-1">
          <span>{domain}</span>
          <ExternalLink size={9} className="opacity-60 shrink-0" />
        </div>
      </a>
      <button type="button" onClick={() => onRemove(link.id)} className="text-theme-muted hover:text-red-400 p-1 rounded opacity-0 group-hover:opacity-100 transition-all shrink-0 cursor-pointer" title={t('note.deleteLink')}>
        <X size={12} />
      </button>
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
