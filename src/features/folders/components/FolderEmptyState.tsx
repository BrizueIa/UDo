import React from 'react';
import { Layers, FolderPlus, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SubjectItem } from '../../../shared/types';

interface Props {
  currentSubject?: SubjectItem;
  onCreateFolder: () => void;
  onCreateNote: () => void;
}

export const FolderEmptyState: React.FC<Props> = ({
  currentSubject,
  onCreateFolder,
  onCreateNote,
}) => {
  const { t } = useTranslation();

  if (!currentSubject) {
    return (
      <div data-folders-empty className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center space-y-2 select-none">
        <Layers size={22} className="text-theme-muted opacity-50" />
        <p className="text-xs font-medium text-theme-muted">
          {t('emptyState.noProjectSelected')}
        </p>
      </div>
    );
  }

  return (
    <div data-folders-empty className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center space-y-3 select-none">
      <div className="w-10 h-10 rounded-xl bg-theme-card border border-white/[0.08] flex items-center justify-center text-theme-muted">
        <FolderPlus size={18} className="text-theme-muted" />
      </div>
      <div className="space-y-1">
        <p className="text-xs font-semibold text-theme-text">
          {t('emptyState.emptyProjectTitle')}
        </p>
        <p className="text-[11px] text-theme-muted max-w-[200px] leading-tight">
          {t('emptyState.emptyProjectDesc')}
        </p>
      </div>
      <div className="flex items-center space-x-2 pt-1">
        <button
          type="button"
          onClick={onCreateFolder}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-theme-card border border-theme-border text-theme-text text-[11px] font-medium hover:bg-theme-hover transition-colors shadow-xs"
        >
          <FolderPlus size={13} />
          <span>{t('folders.addFolder')}</span>
        </button>
        <button
          type="button"
          onClick={onCreateNote}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-theme-accent text-white text-[11px] font-semibold hover:bg-theme-accent-hover transition-colors shadow-xs"
        >
          <Plus size={13} />
          <span>{t('folders.addNote')}</span>
        </button>
      </div>
    </div>
  );
};
