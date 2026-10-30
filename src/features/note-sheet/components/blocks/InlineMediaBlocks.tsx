import React, { useState, useRef } from 'react';
import { SketchItem, LinkItem, NoteAttachment } from '../../../../shared/types';
import { FileAttachmentCard } from '../FileAttachmentCard';
import { AudioAttachmentCard } from '../AudioAttachmentCard';
import {
  Pencil,
  Maximize2,
  Trash2,
  Link as LinkIcon,
  ExternalLink,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ResizableSketchProps {
  sketch: SketchItem;
  onAnnotate: (sketch: SketchItem) => void;
  onRemove: (sketchId: string) => void;
  onResize: (sketchId: string, newWidth: number) => void;
}

export const ResizableSketchBlock: React.FC<ResizableSketchProps> = ({
  sketch,
  onAnnotate,
  onRemove,
  onResize,
}) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [liveWidth, setLiveWidth] = useState<number | undefined>(sketch.width);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const startResize = (e: React.MouseEvent, side: 'left' | 'right') => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const initialW = containerRef.current?.offsetWidth || sketch.width || 420;

    const handleMove = (ev: MouseEvent) => {
      const delta = side === 'right' ? ev.clientX - startX : startX - ev.clientX;
      const clamped = Math.max(160, Math.min(820, initialW + delta * 1.4));
      setLiveWidth(Math.round(clamped));
    };

    const handleUp = (ev: MouseEvent) => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      const delta = side === 'right' ? ev.clientX - startX : startX - ev.clientX;
      const finalW = Math.round(Math.max(160, Math.min(820, initialW + delta * 1.4)));
      setLiveWidth(finalW);
      onResize(sketch.id, finalW);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  const effectiveWidth = liveWidth || sketch.width;

  return (
    <>
      <div className="my-2.5 flex flex-col items-start select-none">
        <div
          ref={containerRef}
          style={{ width: effectiveWidth ? `${effectiveWidth}px` : undefined, maxWidth: '100%' }}
          className="group relative rounded-xl bg-theme-card/50 border border-white/[0.08] hover:border-theme-accent/50 transition-colors overflow-hidden shadow-sm"
        >
          {/* Left Notion-style Resize Handle */}
          <div
            onMouseDown={(e) => startResize(e, 'left')}
            title={t('note.resizeImage')}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-12 rounded-full bg-black/60 border border-white/40 opacity-0 group-hover:opacity-100 cursor-ew-resize z-20 transition-opacity hover:bg-theme-accent"
          />

          {/* Right Notion-style Resize Handle */}
          <div
            onMouseDown={(e) => startResize(e, 'right')}
            title={t('note.resizeImage')}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-12 rounded-full bg-black/60 border border-white/40 opacity-0 group-hover:opacity-100 cursor-ew-resize z-20 transition-opacity hover:bg-theme-accent"
          />

          {/* Top-right Action Pill */}
          <div className="absolute top-2 right-2 flex items-center space-x-1 px-1.5 py-1 rounded-lg bg-black/75 border border-white/15 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAnnotate(sketch);
              }}
              className="p-1 text-white/80 hover:text-theme-accent rounded transition-colors cursor-pointer"
              title={t('note.annotate')}
            >
              <Pencil size={13} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsFullscreen(true);
              }}
              className="p-1 text-white/80 hover:text-white rounded transition-colors cursor-pointer"
              title={t('note.viewFullSize')}
            >
              <Maximize2 size={13} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(sketch.id);
              }}
              className="p-1 text-white/80 hover:text-red-400 rounded transition-colors cursor-pointer"
              title={t('note.deleteSketch')}
            >
              <Trash2 size={13} />
            </button>
          </div>

          <img
            src={sketch.dataUrl}
            alt={sketch.title || 'Image'}
            onClick={() => onAnnotate(sketch)}
            className="w-full h-auto max-h-[520px] object-contain block cursor-pointer bg-[#14151f]/60"
          />
          {sketch.title && (
            <div className="px-3 py-1 text-[11px] text-theme-muted border-t border-white/[0.05] bg-theme-card/80 truncate">
              {sketch.title}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Lightbox */}
      {isFullscreen && (
        <div
          onClick={() => setIsFullscreen(false)}
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-6 animate-in fade-in duration-150"
        >
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X size={20} />
          </button>
          <img
            src={sketch.dataUrl}
            alt={sketch.title}
            className="max-w-[92vw] max-h-[88vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </>
  );
};

interface InlineLinkBlockProps {
  link: LinkItem;
  onRemove: (linkId: string) => void;
}

export const InlineLinkBlock: React.FC<InlineLinkBlockProps> = ({ link, onRemove }) => {
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
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 min-w-0 pr-2"
      >
        <div className="text-xs font-medium text-theme-text truncate group-hover:text-theme-accent transition-colors">
          {link.title}
        </div>
        <div className="text-[10px] text-theme-muted truncate flex items-center space-x-1">
          <span>{domain}</span>
          <ExternalLink size={9} className="opacity-60 shrink-0" />
        </div>
      </a>
      <button
        type="button"
        onClick={() => onRemove(link.id)}
        className="text-theme-muted hover:text-red-400 p-1 rounded opacity-0 group-hover:opacity-100 transition-all shrink-0 cursor-pointer"
        title={t('note.deleteLink')}
      >
        <X size={12} />
      </button>
    </div>
  );
};

interface InlineAttachmentBlockProps {
  attachment: NoteAttachment;
  onRemove: (id: string) => void;
  onRename?: (id: string, newName: string) => void;
}

export const InlineAttachmentBlock: React.FC<InlineAttachmentBlockProps> = ({
  attachment,
  onRemove,
  onRename,
}) => {
  return (
    <div className="my-1.5">
      {attachment.kind === 'audio' ? (
        <AudioAttachmentCard
          attachment={attachment}
          onRemove={onRemove}
          onRename={onRename}
        />
      ) : (
        <FileAttachmentCard attachment={attachment} onRemove={onRemove} />
      )}
    </div>
  );
};
