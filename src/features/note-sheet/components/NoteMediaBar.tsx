import React from 'react';
import { Paperclip, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  isMediaDrawerOpen: boolean;
  totalMediaCount: number;
  onToggleMediaDrawer: () => void;
  onToggleAddLink: () => void;
  onOpenWhiteboard: () => void;
}

export const NoteMediaBar: React.FC<Props> = ({
  isMediaDrawerOpen,
  totalMediaCount,
  onToggleMediaDrawer,
  onToggleAddLink,
  onOpenWhiteboard,
}) => {
  const { t } = useTranslation();

  return (
    <div className="border-t border-b border-white/[0.05] py-2 flex items-center justify-between text-xs">
      <button
        onClick={onToggleMediaDrawer}
        className="flex items-center space-x-2 text-theme-muted hover:text-theme-text font-medium transition-colors"
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

      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleAddLink}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-theme-card hover:bg-theme-hover text-theme-muted hover:text-theme-text border border-white/[0.05] transition-colors text-[11px]"
        >
          <LinkIcon size={12} />
          <span>{t('note.addLink')}</span>
        </button>
        <button
          onClick={onOpenWhiteboard}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-theme-card hover:bg-theme-hover text-theme-muted hover:text-theme-text border border-white/[0.05] transition-colors text-[11px]"
        >
          <ImageIcon size={12} />
          <span>{t('note.addSketch')}</span>
        </button>
      </div>
    </div>
  );
};
