import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FolderItem, NoteItem } from '../../../shared/types';
import { NoteItemRow } from './NoteItemRow';

interface Props {
  folder: FolderItem;
  visibleNotes: NoteItem[];
  selectedNoteId: string;
  secondaryNoteId?: string;
  selectedNoteIds: Set<string>;
  onSelectFolder: (id: string) => void;
  onSelectNote: (id: string) => void;
  onNoteClick: (noteId: string, e: React.MouseEvent) => void;
  onToggleNoteComplete: (id: string) => void;
  onNoteContextMenu: (e: React.MouseEvent, note: NoteItem) => void;
  onAddNote: (folderId: string) => void;
  onReorderOrMoveNote?: (
    draggedNoteId: string,
    targetFolderId: string,
    targetNoteId?: string,
    position?: 'before' | 'after'
  ) => void;
  onBatchMoveNotesToFolder?: (ids: string[], folderId: string) => void;
}

export const FolderNotesAccordion: React.FC<Props> = ({
  folder,
  visibleNotes,
  selectedNoteId,
  secondaryNoteId,
  selectedNoteIds,
  onSelectFolder,
  onSelectNote,
  onNoteClick,
  onToggleNoteComplete,
  onNoteContextMenu,
  onAddNote,
  onReorderOrMoveNote,
  onBatchMoveNotesToFolder,
}) => {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <AnimatePresence initial={false}>
      {folder.isExpanded && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          onDragOver={(e) => {
            if (
              e.dataTransfer.types.includes('application/udo-note-id') ||
              e.dataTransfer.types.includes('application/udo-note-ids') ||
              e.dataTransfer.types.includes('text/plain')
            ) {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (!isDragOver) setIsDragOver(true);
            }
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setIsDragOver(false);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
            if (e.dataTransfer.types.includes('application/udo-folder-id')) return;

            const noteIdsRaw = e.dataTransfer.getData('application/udo-note-ids');
            if (noteIdsRaw && onBatchMoveNotesToFolder) {
              try {
                const ids: string[] = JSON.parse(noteIdsRaw);
                onBatchMoveNotesToFolder(ids, folder.id);
                return;
              } catch {}
            }

            const noteId =
              e.dataTransfer.getData('application/udo-note-id') ||
              e.dataTransfer.getData('text/plain');
            if (noteId && onReorderOrMoveNote) {
              setTimeout(() => {
                onReorderOrMoveNote(noteId, folder.id);
              }, 0);
            }
          }}
          className={`overflow-hidden pl-3 space-y-0.5 border-l ml-4 transition-colors rounded-r-lg ${
            isDragOver
              ? 'border-theme-accent bg-theme-accent/10 ring-1 ring-theme-accent/30'
              : 'border-white/[0.06]'
          }`}
        >
          {visibleNotes.length === 0 ? (
            <div
              onClick={() => onAddNote(folder.id)}
              className="flex items-center justify-between text-[11px] text-theme-muted/70 hover:text-theme-accent py-1.5 px-2 rounded-lg hover:bg-theme-hover/40 cursor-pointer transition-colors group"
              title={`${t('folders.addNote')} (Ctrl+N)`}
            >
              <span>{t('folders.noNotes')}</span>
              <span className="text-[10px] text-theme-accent opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
                <Plus size={11} />
                <span>{t('folders.addNote')}</span>
              </span>
            </div>
          ) : (
            visibleNotes.map((note) => (
              <NoteItemRow
                key={note.id}
                note={note}
                isSelected={note.id === selectedNoteId || note.id === secondaryNoteId}
                isMultiSelected={selectedNoteIds.has(note.id)}
                multiSelectedIds={Array.from(selectedNoteIds)}
                onSelect={() => {
                  onSelectFolder(folder.id);
                  onSelectNote(note.id);
                }}
                onSelectWithEvent={(e) => {
                  onSelectFolder(folder.id);
                  onSelectNote(note.id);
                  onNoteClick(note.id, e);
                }}
                onToggleComplete={() => onToggleNoteComplete(note.id)}
                onContextMenu={(e) => onNoteContextMenu(e, note)}
                onDropOnNote={(draggedId, targetId, pos) => {
                  if (onReorderOrMoveNote) {
                    onReorderOrMoveNote(draggedId, folder.id, targetId, pos);
                  }
                }}
              />
            ))
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
