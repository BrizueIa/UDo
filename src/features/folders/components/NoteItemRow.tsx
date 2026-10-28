import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Pin } from 'lucide-react';
import { NoteItem } from '../../../shared/types';
import { useTranslation } from 'react-i18next';

interface Props {
  note: NoteItem;
  isSelected: boolean;
  onSelect: () => void;
  onToggleComplete: () => void;
}

export const NoteItemRow: React.FC<Props> = ({
  note,
  isSelected,
  onSelect,
  onToggleComplete,
}) => {
  const { t } = useTranslation();

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('application/udo-note-id', note.id);
    e.dataTransfer.setData('text/plain', note.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onSelect}
      className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-grab active:cursor-grabbing hover:translate-x-0.5 active:scale-[0.98] transition-all select-none ${
        isSelected
          ? 'text-theme-text font-medium'
          : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover/40'
      }`}
    >
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
