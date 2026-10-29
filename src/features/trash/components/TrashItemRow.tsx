import React from 'react';
import { RotateCcw, Trash2, CheckSquare, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NoteItem, SubjectItem, FolderItem } from '../../../shared/types';
import { formatRelativeTime } from '../../../shared/utils/formatTime';

interface Props {
  note: NoteItem;
  isSelected: boolean;
  subject?: SubjectItem;
  folder?: FolderItem;
  onToggleSelect: (id: string) => void;
  onRestore: (id: string) => void;
  onPermanentlyDelete: (id: string) => void;
}

export const TrashItemRow: React.FC<Props> = ({
  note,
  isSelected,
  subject,
  folder,
  onToggleSelect,
  onRestore,
  onPermanentlyDelete,
}) => {
  const { t, i18n } = useTranslation();
  const formattedTime = formatRelativeTime(note.updatedAt, i18n.language);

  return (
    <div
      onClick={() => onToggleSelect(note.id)}
      className={`group flex items-center justify-between px-3 py-2 rounded-xl border transition-all cursor-pointer ${
        isSelected
          ? 'bg-theme-accent/15 border-theme-accent/30 text-theme-text'
          : 'border-transparent hover:bg-theme-card/70 hover:border-theme-border/40 text-theme-text'
      }`}
    >
      <div className="flex items-center space-x-2.5 min-w-0 flex-1">
        <div className="text-theme-muted shrink-0">
          {isSelected ? (
            <CheckSquare size={14} className="text-theme-accent" />
          ) : (
            <Square size={14} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium truncate">{note.title || t('note.titlePlaceholder')}</div>
          <div className="text-[11px] text-theme-muted flex items-center space-x-1.5 mt-0.5 truncate">
            {subject && (
              <span className="flex items-center space-x-1 truncate shrink-0">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: subject.color }} />
                <span className="truncate">{subject.name}</span>
              </span>
            )}
            {folder && <span className="truncate">/ {folder.name}</span>}
            <span className="shrink-0">• {formattedTime}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRestore(note.id);
          }}
          title={t('trash.restore') || 'Restaurar'}
          className="p-1 rounded-md text-theme-muted hover:text-theme-accent hover:bg-theme-accent/15 transition-colors cursor-pointer"
        >
          <RotateCcw size={13} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPermanentlyDelete(note.id);
          }}
          title={t('trash.permanentlyDelete') || 'Eliminar definitivamente'}
          className="p-1 rounded-md text-theme-muted hover:text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};
