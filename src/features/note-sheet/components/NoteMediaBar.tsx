import React, { useRef } from 'react';
import { Paperclip, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NoteAttachment } from '../../../shared/types';
import { VoiceRecorderButton } from './VoiceRecorderButton';

interface Props {
  isMediaDrawerOpen: boolean;
  totalMediaCount: number;
  onToggleMediaDrawer: () => void;
  onToggleAddLink: () => void;
  onOpenWhiteboard: () => void;
  onOpenAttachModal?: () => void;
  onOpenAttachImageModal?: () => void;
  onAttachFiles?: (files: FileList) => void;
  onAttachmentCreated?: (attachment: NoteAttachment) => void;
  onError?: (message: string) => void;
}

export const NoteMediaBar: React.FC<Props> = ({
  isMediaDrawerOpen,
  totalMediaCount,
  onToggleMediaDrawer,
  onToggleAddLink,
  onOpenWhiteboard,
  onOpenAttachModal,
  onOpenAttachImageModal,
  onAttachFiles,
  onAttachmentCreated,
  onError,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenAttach = onOpenAttachModal || onOpenAttachImageModal;

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAttachFiles?.(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div className="border-t border-b border-white/[0.05] py-2 flex items-center justify-between text-xs flex-wrap gap-2">
      <button
        type="button"
        onClick={onToggleMediaDrawer}
        className="flex items-center space-x-2 text-theme-muted hover:text-theme-text font-medium transition-colors cursor-pointer"
      >
        <Paperclip size={14} className="text-theme-accent" />
        <span>
          {isMediaDrawerOpen ? t('note.hideMedia') : t('note.showMedia')}
        </span>
        {totalMediaCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-full bg-theme-accent/20 text-theme-accent text-[10px] font-semibold">
            {totalMediaCount}
          </span>
        )}
      </button>

      <div className="flex items-center flex-wrap gap-1.5">
        {/* Fallback hidden file input for pure web or test environments */}
        {!handleOpenAttach && onAttachFiles && (
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
          />
        )}

        {/* Universal Attach Button (opens Universal Attachment Modal) */}
        {handleOpenAttach ? (
          <button
            type="button"
            onClick={handleOpenAttach}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-theme-card hover:bg-theme-hover text-theme-muted hover:text-theme-text border border-white/[0.05] transition-colors text-[11px] cursor-pointer"
            title={t('attachments.modalTitle')}
          >
            <Paperclip size={12} className="text-theme-accent" />
            <span>{t('attachments.attachResource')}</span>
          </button>
        ) : onAttachFiles ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-theme-card hover:bg-theme-hover text-theme-muted hover:text-theme-text border border-white/[0.05] transition-colors text-[11px] cursor-pointer"
            title={t('attachments.attachFile')}
          >
            <Paperclip size={12} className="text-theme-accent" />
            <span>{t('attachments.attachResource')}</span>
          </button>
        ) : null}

        {/* Voice Note Recorder Button */}
        {onAttachmentCreated && (
          <VoiceRecorderButton
            onAttachmentCreated={onAttachmentCreated}
            onError={onError}
          />
        )}

        {/* Add Link */}
        <button
          type="button"
          onClick={onToggleAddLink}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-theme-card hover:bg-theme-hover text-theme-muted hover:text-theme-text border border-white/[0.05] transition-colors text-[11px] cursor-pointer"
        >
          <LinkIcon size={12} />
          <span>{t('note.addLink')}</span>
        </button>

        {/* Whiteboard / Sketch */}
        <button
          type="button"
          onClick={onOpenWhiteboard}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-theme-card hover:bg-theme-hover text-theme-muted hover:text-theme-text border border-white/[0.05] transition-colors text-[11px] cursor-pointer"
        >
          <ImageIcon size={12} />
          <span>{t('note.addSketch')}</span>
        </button>
      </div>
    </div>
  );
};
