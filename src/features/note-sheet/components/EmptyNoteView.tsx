import React from 'react';
import { Plus, FolderPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { UDoLogo } from '../../../shared/ui/UDoLogo';

interface Props {
  onCreateNote: () => void;
  hasSubjects?: boolean;
  hasFolders?: boolean;
  onCreateSubject?: () => void;
  onCreateFolder?: () => void;
}

export const EmptyNoteView: React.FC<Props> = ({
  onCreateNote,
  hasSubjects = true,
  hasFolders = true,
  onCreateSubject,
  onCreateFolder,
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-sm text-theme-muted p-8 text-center space-y-4 select-none">
      <div className="flex flex-col items-center space-y-2">
        <UDoLogo variant="color" size={72} className="drop-shadow-xl" />
        <div className="space-y-0.5">
          <h2 className="text-xl font-bold tracking-tight text-theme-text font-sans">UDo</h2>
          <p className="text-xs font-mono text-theme-muted tracking-widest uppercase opacity-75">
            The way u do.
          </p>
        </div>
      </div>

      {!hasSubjects ? (
        <div className="pt-2 space-y-3 flex flex-col items-center max-w-sm">
          <h3 className="text-base font-bold text-theme-text">{t('emptyState.welcomeTitle')}</h3>
          <p className="text-xs text-theme-muted text-center leading-relaxed">
            {t('emptyState.welcomeDesc')}
          </p>
          <button
            type="button"
            onClick={onCreateSubject}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-theme-accent text-white text-xs font-semibold hover:bg-theme-accent-hover transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <FolderPlus size={15} />
            <span>{t('emptyState.createFirstProject')}</span>
          </button>
        </div>
      ) : !hasFolders ? (
        <div className="pt-2 space-y-3 flex flex-col items-center max-w-sm">
          <p className="text-sm font-semibold text-theme-text">{t('folders.noNotes')}</p>
          <p className="text-xs text-theme-muted text-center">
            {t('emptyState.projectReadyDesc')}
          </p>
          <div className="flex items-center space-x-2">
            {onCreateFolder && (
              <button
                type="button"
                onClick={onCreateFolder}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-theme-card border border-theme-border text-theme-text text-xs font-medium hover:bg-theme-hover transition-colors shadow-xs cursor-pointer"
              >
                <FolderPlus size={14} />
                <span>{t('folders.addFolder')}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onCreateNote}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-theme-accent text-white text-xs font-semibold hover:bg-theme-accent-hover transition-colors shadow-sm cursor-pointer"
            >
              <Plus size={14} />
              <span>{t('folders.addNote')} (Ctrl+N)</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="pt-2 space-y-3 flex flex-col items-center">
          <p className="text-sm font-medium">{t('folders.noNotes')}</p>
          <button
            type="button"
            onClick={onCreateNote}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-theme-accent text-white text-xs font-semibold hover:bg-theme-accent-hover transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={14} />
            <span>{t('folders.addNote')} (Ctrl+N)</span>
          </button>
        </div>
      )}
    </div>
  );
};
