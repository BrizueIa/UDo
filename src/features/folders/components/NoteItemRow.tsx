import React, { useState } from 'react';
import { Check, Pin, Lock } from 'lucide-react';
import { NoteItem } from '../../../shared/types';
import { useTranslation } from 'react-i18next';
import { renderRichTitle } from '../../note-sheet/utils/inlineRichTextParser';

interface Props {
  note: NoteItem;
  isSelected: boolean;
  isMultiSelected?: boolean;
  multiSelectedIds?: string[];
  onSelect: () => void;
  onSelectWithEvent?: (e: React.MouseEvent) => void;
  onToggleComplete: () => void;
  onDropOnNote?: (draggedNoteId: string, targetNoteId: string, position: 'before' | 'after') => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export const NoteItemRow: React.FC<Props> = ({
  note,
  isSelected,
  isMultiSelected = false,
  multiSelectedIds = [],
  onSelect,
  onSelectWithEvent,
  onToggleComplete,
  onDropOnNote,
  onContextMenu,
}) => {
  const { t } = useTranslation();
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    const targetIds = isMultiSelected && multiSelectedIds.length > 1 ? multiSelectedIds : [note.id];
    e.dataTransfer.setData('application/udo-note-ids', JSON.stringify(targetIds));
    e.dataTransfer.setData('application/udo-note-id', note.id);
    e.dataTransfer.setData('text/plain', targetIds.join(','));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (
      e.dataTransfer.types.includes('application/udo-note-id') ||
      e.dataTransfer.types.includes('application/udo-note-ids') ||
      e.dataTransfer.types.includes('text/plain')
    ) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';

      const rect = e.currentTarget.getBoundingClientRect();
      const midPoint = rect.top + rect.height / 2;
      const pos = e.clientY < midPoint ? 'before' : 'after';
      if (pos !== dropPosition) {
        setDropPosition(pos);
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDropPosition(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const isFolder = e.dataTransfer.types.includes('application/udo-folder-id');
    if (isFolder) return;

    const draggedNoteId =
      e.dataTransfer.getData('application/udo-note-id') || e.dataTransfer.getData('text/plain');
    const pos = dropPosition || 'after';
    setDropPosition(null);

    if (draggedNoteId && draggedNoteId !== note.id && onDropOnNote) {
      setTimeout(() => {
        onDropOnNote(draggedNoteId, note.id, pos);
      }, 0);
    }
  };

  return (
    <div
      data-note-id={note.id}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={(e) => {
        if (onSelectWithEvent) onSelectWithEvent(e);
        else onSelect();
      }}
      onContextMenu={onContextMenu}
      className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-grab active:cursor-grabbing hover:translate-x-0.5 active:scale-[0.98] transition-all select-none border ${
        isMultiSelected
          ? 'bg-theme-accent/15 border-theme-accent/30 text-theme-text font-medium shadow-xs'
          : isSelected
          ? 'bg-theme-card text-theme-text font-semibold shadow-xs border-theme-accent/30 pl-3.5'
          : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover/40 border-transparent'
      }`}
    >
      {/* Subtle Active Note Left Accent Bar */}
      {isSelected && (
        <span
          className="absolute left-1 top-2.5 bottom-2.5 w-[2.5px] rounded-full bg-theme-accent shadow-[0_0_5px_var(--color-accent)] z-20"
          aria-hidden="true"
        />
      )}
      {/* Drop position indicator lines */}
      {dropPosition === 'before' && (
        <div className="absolute top-0 left-1 right-1 h-0.5 bg-theme-accent rounded-full z-30 shadow-xs" />
      )}
      {dropPosition === 'after' && (
        <div className="absolute bottom-0 left-1 right-1 h-0.5 bg-theme-accent rounded-full z-30 shadow-xs" />
      )}

      <div className="relative z-10 flex items-center space-x-2 min-w-0 flex-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete();
          }}
          className="flex-shrink-0 text-theme-muted hover:text-theme-accent transition-colors cursor-pointer"
        >
          {note.isCompleted ? (
            <div className="w-4 h-4 rounded-[5px] bg-[#1fd4a5]/20 border border-[#1fd4a5] text-[#1fd4a5] flex items-center justify-center transition-colors shadow-xs">
              <Check size={11} strokeWidth={3} />
            </div>
          ) : (
            <div className="w-4 h-4 rounded-[5px] border border-theme-muted/60 hover:border-theme-accent transition-colors" />
          )}
        </button>

        <span
          className={`text-[13px] truncate ${
            note.isCompleted
              ? 'line-through text-theme-muted/60 opacity-80'
              : 'text-theme-text'
          }`}
        >
          {renderRichTitle(note.title || t('note.titlePlaceholder'), 'note', 0, { ignoreSize: true })}
        </span>
      </div>

      {/* Right container: Private Lock & Pinned Note Badges */}
      <div className="relative z-10 flex items-center space-x-1 shrink-0">
        {note.isPrivate && (
          <span title={t('vault.privateNote') || 'Nota Privada'} className="inline-flex items-center">
            <Lock size={11} className="text-amber-500/80 shrink-0" />
          </span>
        )}
        {note.isPinned && (
          <Pin size={11} className="text-amber-400 rotate-45 shrink-0 fill-amber-400/30" />
        )}
      </div>
    </div>
  );
};
