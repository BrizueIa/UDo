import React from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { UDoLogo } from '../../../shared/ui/UDoLogo';

interface Props {
  onCreateNote: () => void;
}

export const EmptyNoteView: React.FC<Props> = ({ onCreateNote }) => {
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
    </div>
  );
};
