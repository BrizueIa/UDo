import React from 'react';
import { NoteItem } from '../../../shared/types';
import { NoteItemRow } from './NoteItemRow';

interface Props {
  notes: NoteItem[];
  selectedNoteId: string;
  secondaryNoteId?: string;
  selectedNoteIds: Set<string>;
  onSelectFolder: (id: string) => void;
  onSelectNote: (id: string) => void;
  onNoteClick: (noteId: string, e: React.MouseEvent) => void;
  onToggleNoteComplete: (id: string) => void;
  onNoteContextMenu: (e: React.MouseEvent, note: NoteItem) => void;
  onReorderOrMoveNote?: (
    draggedNoteId: string,
    targetFolderId: string,
    targetNoteId?: string,
    position?: 'before' | 'after'
  ) => void;
}

export const RootNotesList: React.FC<Props> = ({
  notes,
  selectedNoteId,
  secondaryNoteId,
  selectedNoteIds,
  onSelectFolder,
  onSelectNote,
  onNoteClick,
  onToggleNoteComplete,
  onNoteContextMenu,
  onReorderOrMoveNote,
}) => {
  if (notes.length === 0) return null;

  return (
    <div className="space-y-0.5 mb-2">
      {notes.map((note) => (
        <NoteItemRow
          key={note.id}
          note={note}
          isSelected={note.id === selectedNoteId || note.id === secondaryNoteId}
          isMultiSelected={selectedNoteIds.has(note.id)}
          multiSelectedIds={Array.from(selectedNoteIds)}
          onSelect={() => {
            onSelectFolder('');
            onSelectNote(note.id);
          }}
          onSelectWithEvent={(e) => {
            onSelectFolder('');
            onSelectNote(note.id);
            onNoteClick(note.id, e);
          }}
          onToggleComplete={() => onToggleNoteComplete(note.id)}
          onContextMenu={(e) => onNoteContextMenu(e, note)}
          onDropOnNote={(draggedId, targetId, pos) => {
            if (onReorderOrMoveNote) {
              onReorderOrMoveNote(draggedId, '', targetId, pos);
            }
          }}
        />
      ))}
    </div>
  );
};
