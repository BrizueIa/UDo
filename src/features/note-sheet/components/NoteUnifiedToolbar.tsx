import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Link as LinkIcon, Image as ImageIcon, ListTodo, LayoutTemplate, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NoteAttachment } from '../../../shared/types';
import { VoiceRecorderButton } from './VoiceRecorderButton';
import { NoteTemplatePicker } from './NoteTemplatePicker';

interface Props {
  onOpenAttachModal: () => void;
  onAttachmentCreated: (attachment: NoteAttachment) => void;
  onError: (msg: string) => void;
  onOpenWhiteboard: () => void;
  onInsertTask: () => void;
  onSelectTemplate: (content: string, title?: string) => void;
  showLinkInput: boolean;
  onToggleAddLink: () => void;
  newLinkTitle: string;
  newLinkUrl: string;
  onSetNewLinkTitle: (val: string) => void;
  onSetNewLinkUrl: (val: string) => void;
  onAddLink: (e: React.FormEvent) => void;
  onCloseLinkInput: () => void;
}

export const NoteUnifiedToolbar: React.FC<Props> = ({
  onOpenAttachModal, onAttachmentCreated, onError, onOpenWhiteboard,
  onInsertTask, onSelectTemplate, showLinkInput, onToggleAddLink,
  newLinkTitle, newLinkUrl, onSetNewLinkTitle, onSetNewLinkUrl,
  onAddLink, onCloseLinkInput,
}) => {
  const { t } = useTranslation();
  const [showTemplates, setShowTemplates] = useState(false);
  const templateContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (templateContainerRef.current && !templateContainerRef.current.contains(e.target as Node)) {
        setShowTemplates(false);
      }
    };
    if (showTemplates) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTemplates]);

  const btnCls =
    'flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-theme-card hover:bg-theme-hover text-theme-muted hover:text-theme-text border border-white/[0.05] transition-colors text-[11px] font-medium cursor-pointer';

  return (
    <div className="space-y-2">
      <div className="border-y border-white/[0.06] py-2 flex items-center justify-between text-xs flex-wrap gap-1.5 select-none">
        <div className="flex items-center flex-wrap gap-1.5">
          <button type="button" onClick={onOpenAttachModal} className={btnCls} title={t('attachments.modalTitle')}>
            <Paperclip size={12} className="text-theme-accent" />
            <span>{t('attachments.attachResource')}</span>
          </button>

          <VoiceRecorderButton onAttachmentCreated={onAttachmentCreated} onError={onError} />

          <button
            type="button"
            onClick={onToggleAddLink}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border transition-colors text-[11px] font-medium cursor-pointer ${
              showLinkInput
                ? 'bg-theme-accent/20 text-theme-accent border-theme-accent/40'
                : 'bg-theme-card hover:bg-theme-hover text-theme-muted hover:text-theme-text border-white/[0.05]'
            }`}
          >
            <LinkIcon size={12} className="text-blue-400" />
            <span>{t('note.addLink')}</span>
          </button>

          <button type="button" onClick={onOpenWhiteboard} className={btnCls}>
            <ImageIcon size={12} className="text-pink-400" />
            <span>{t('note.addSketch')}</span>
          </button>

          <button type="button" onClick={onInsertTask} className={btnCls} title={t('note.addTask')}>
            <ListTodo size={13} className="text-[#1fd4a5]" />
            <span>{t('note.addTask')}</span>
          </button>

          <div ref={templateContainerRef} className="relative">
            <button
              type="button"
              onClick={() => setShowTemplates(!showTemplates)}
              className={btnCls}
              title={t('templates.title')}
            >
              <LayoutTemplate size={12} className="text-amber-400" />
              <span>{t('templates.title')}</span>
            </button>
            {showTemplates && (
              <NoteTemplatePicker
                variant="dropdown"
                onSelectTemplate={(content, title) => {
                  onSelectTemplate(content, title);
                  setShowTemplates(false);
                }}
                onClose={() => setShowTemplates(false)}
              />
            )}
          </div>
        </div>
      </div>

      {showLinkInput && (
        <form
          onSubmit={onAddLink}
          className="flex items-center space-x-2 py-1.5 px-2.5 rounded-lg bg-theme-column border border-theme-accent/40 text-xs w-full max-w-lg shadow-sm animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <LinkIcon size={12} className="text-theme-accent shrink-0" />
          <input
            type="text"
            placeholder={t('note.linkTitle')}
            value={newLinkTitle}
            onChange={(e) => onSetNewLinkTitle(e.target.value)}
            className="bg-theme-card px-2 py-0.5 rounded outline-none border border-white/[0.06] text-theme-text text-xs flex-1"
            autoFocus
            required
          />
          <input
            type="text"
            placeholder={t('note.linkUrl')}
            value={newLinkUrl}
            onChange={(e) => onSetNewLinkUrl(e.target.value)}
            className="bg-theme-card px-2 py-0.5 rounded outline-none border border-white/[0.06] text-theme-text text-xs flex-1"
            required
          />
          <button
            type="submit"
            className="px-2.5 py-0.5 rounded bg-theme-accent text-white font-medium hover:bg-theme-accent-hover text-xs transition-colors shadow-xs cursor-pointer"
          >
            {t('note.save')}
          </button>
          <button type="button" onClick={onCloseLinkInput} className="p-0.5 text-theme-muted hover:text-theme-text cursor-pointer">
            <X size={12} />
          </button>
        </form>
      )}
    </div>
  );
};
