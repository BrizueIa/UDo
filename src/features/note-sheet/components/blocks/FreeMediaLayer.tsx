import React, { useState } from 'react';
import { SketchItem, NoteAttachment } from '../../../../shared/types';
import { FreeObjectWrapper, FreeBounds } from './FreeObjectWrapper';
import { FileAttachmentCard } from '../FileAttachmentCard';
import { AudioAttachmentCard } from '../AudioAttachmentCard';
import { X } from 'lucide-react';

interface Props {
  sketches: SketchItem[];
  attachments: NoteAttachment[];
  onUpdateSketch: (id: string, updates: Partial<SketchItem>) => void;
  onRemoveSketch: (id: string) => void;
  onOpenSketchAnnotator: (sketch: SketchItem) => void;
  onUpdateAttachment: (id: string, updates: Partial<NoteAttachment>) => void;
  onRemoveAttachment: (id: string) => void;
  onRenameAttachment: (id: string, newName: string) => void;
  reportBounds: (bounds: FreeBounds) => void;
  unregisterBounds: (id: string) => void;
}

export const FreeMediaLayer: React.FC<Props> = ({
  sketches,
  attachments,
  onUpdateSketch,
  onRemoveSketch,
  onOpenSketchAnnotator,
  onUpdateAttachment,
  onRemoveAttachment,
  onRenameAttachment,
  reportBounds,
  unregisterBounds,
}) => {
  const [fullscreenDataUrl, setFullscreenDataUrl] = useState<string | null>(null);

  return (
    <>
      <div className="absolute inset-0 pointer-events-none overflow-visible">
        {/* Free Sketches and Canvas Drawings */}
        {sketches.map((sk, idx) => (
          <FreeObjectWrapper
            key={`free-sk-${sk.id}`}
            id={`sketch-${sk.id}`}
            posX={sk.posX !== undefined ? sk.posX : (idx % 2 === 0 ? 0 : 380)}
            posY={sk.posY !== undefined ? sk.posY : idx * 160 + 20}
            width={sk.width || 360}
            height={sk.height}
            zIndex={sk.zIndex || 10}
            isBackground={sk.isBackground}
            onUpdateTransform={(updates) => onUpdateSketch(sk.id, updates)}
            onRemove={() => onRemoveSketch(sk.id)}
            onOpenEdit={() => onOpenSketchAnnotator(sk)}
            onViewFull={() => setFullscreenDataUrl(sk.dataUrl)}
            reportBounds={reportBounds}
            unregisterBounds={unregisterBounds}
          >
            <div className="relative w-full h-full flex flex-col justify-between">
              <img
                src={sk.dataUrl}
                alt={sk.title || 'Canvas'}
                onClick={() => onOpenSketchAnnotator(sk)}
                className="w-full h-auto object-contain block cursor-pointer bg-[#14151f]/60 max-h-[500px]"
              />
              {sk.title && (
                <div className="px-3 py-1 text-[11px] text-theme-muted border-t border-white/[0.04] bg-theme-card/80 truncate flex items-center justify-between">
                  <span className="truncate">{sk.title}</span>
                  <span className="text-[10px] opacity-60 font-mono">{sk.width || 360}px</span>
                </div>
              )}
            </div>
          </FreeObjectWrapper>
        ))}

        {/* Free Attachments (Audios, PDFs, Word, Excel, CSV, etc.) */}
        {attachments.map((att, idx) => (
          <FreeObjectWrapper
            key={`free-att-${att.id}`}
            id={`att-${att.id}`}
            posX={att.posX !== undefined ? att.posX : 20}
            posY={att.posY !== undefined ? att.posY : (sketches.length + idx) * 120 + 40}
            width={att.width || (att.kind === 'audio' ? 320 : 340)}
            height={att.height}
            zIndex={att.zIndex || 10}
            isBackground={att.isBackground}
            onUpdateTransform={(updates) => onUpdateAttachment(att.id, updates)}
            onRemove={() => onRemoveAttachment(att.id)}
            reportBounds={reportBounds}
            unregisterBounds={unregisterBounds}
          >
            <div className="p-1">
              {att.kind === 'audio' ? (
                <AudioAttachmentCard
                  attachment={att}
                  onRemove={onRemoveAttachment}
                  onRename={onRenameAttachment}
                />
              ) : (
                <FileAttachmentCard
                  attachment={att}
                  onRemove={onRemoveAttachment}
                />
              )}
            </div>
          </FreeObjectWrapper>
        ))}
      </div>

      {fullscreenDataUrl && (
        <div
          onClick={() => setFullscreenDataUrl(null)}
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-6 animate-in fade-in duration-150"
        >
          <button
            type="button"
            onClick={() => setFullscreenDataUrl(null)}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X size={20} />
          </button>
          <img
            src={fullscreenDataUrl}
            alt="Fullscreen preview"
            className="max-w-[92vw] max-h-[88vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </>
  );
};
