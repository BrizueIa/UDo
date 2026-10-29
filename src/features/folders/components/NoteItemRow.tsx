import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Pin } from 'lucide-react';
import { NoteItem } from '../../../shared/types';
import { useTranslation } from 'react-i18next';

interface Props {
  note: NoteItem;
  isSelected: boolean;
  onSelect: () => void;
  onToggleComplete: () => void;
  onDropOnNote?: (draggedNoteId: string, targetNoteId: string, position: 'before' | 'after') => void;
}

export const NoteItemRow: React.FC<Props> = ({
  note,
  isSelected,
  onSelect,
  onToggleComplete,
  onDropOnNote,
}) => {
  const { t } = useTranslation();
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('application/udo-note-id', note.id);
    e.dataTransfer.setData('text/plain', note.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes('application/udo-note-id') || e.dataTransfer.types.includes('text/plain')) {
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
    const draggedNoteId =
      e.dataTransfer.getData('application/udo-note-id') || e.dataTransfer.getData('text/plain');
    const pos = dropPosition || 'after';
    setDropPosition(null);

    if (draggedNoteId && draggedNoteId !== note.id && onDropOnNote) {
      onDropOnNote(draggedNoteId, note.id, pos);
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={onSelect}
      className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-grab active:cursor-grabbing hover:translate-x-0.5 active:scale-[0.98] transition-all select-none ${
        isSelected
          ? 'text-theme-text font-medium'
          : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover/40'
      }`}
    >
      {/* Drop position indicator lines */}
      {dropPosition === 'before' && (
        <div className="absolute top-0 left-1 right-1 h-0.5 bg-theme-accent rounded-full z-30 shadow-xs" />
      )}
      {dropPosition === 'after' && (
        <div className="absolute bottom-0 left-1 right-1 h-0.5 bg-theme-accent rounded-full z-30 shadow-xs" />
      )}

      {/* Sliding Active Pill */}
      {isSelected && (
        <motion.div
          layoutId="active-note-pill"
          className="absolute inset-0 bg-theme-card border border-theme-accent/50 rounded-lg shadow-sm pointer-events-none"
          transition={{ type: 'spring', stiffness: 450, damping: 32 }}
        />
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
            <CheckCircle2 size={15} className="text-emerald-500" />
          ) : (
            <Circle size={15} className="hover:stroke-theme-accent" />
          )}
        </button>

        <span
          className={`text-[13px] truncate ${
            note.isCompleted
              ? 'line-through text-theme-muted/60 opacity-80'
              : 'text-theme-text'
          }`}
        >
          {note.title || t('note.titlePlaceholder')}
        </span>
      </div>

      {/* Pinned Note Badge */}
      {note.isPinned && (
        <span className="relative z-10">
          <Pin size={11} className="text-amber-400 rotate-45 flex-shrink-0 ml-1 fill-amber-400/30" />
        </span>
      )}
    </div>
  );
};
