import React from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  onCreateNote: () => void;
}

export const EmptyNoteView: React.FC<Props> = ({ onCreateNote }) => {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-sm text-theme-muted p-8 text-center space-y-3">
      <p className="text-sm font-medium">{t('folders.noNotes')}</p>
      <button
        type="button"
        onClick={onCreateNote}
        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-theme-accent text-white text-xs font-semibold hover:bg-theme-accent-hover transition-colors shadow-sm cursor-pointer"
      >
        <Plus size={13} />
        <span>{t('folders.addNote')} (Ctrl+N)</span>
      </button>
    </div>
  );
};
