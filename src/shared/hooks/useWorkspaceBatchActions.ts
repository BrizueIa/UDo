import React, { useCallback } from 'react';
import { FolderItem, NoteItem, SubjectItem } from '../types';
import { api } from '../api/ipc';
import { WorkspaceSnapshot } from './useWorkspaceHistory';

interface Props {
  notes: NoteItem[];
  folders: FolderItem[];
  selectedNoteId: string;
  setNotes: React.Dispatch<React.SetStateAction<NoteItem[]>>;
  setSubjects: React.Dispatch<React.SetStateAction<SubjectItem[]>>;
  setSelectedNoteId: React.Dispatch<React.SetStateAction<string>>;
  recordSnapshot: (snapshot: WorkspaceSnapshot) => void;
  getSnapshot: () => WorkspaceSnapshot;
}

export function useWorkspaceBatchActions({
  notes,
  folders,
  selectedNoteId,
  setNotes,
  setSubjects,
  setSelectedNoteId,
  recordSnapshot,
  getSnapshot,
}: Props) {
  const handleBatchDeleteNotes = useCallback(
    (ids: string[]) => {
      if (!ids || ids.length === 0) return;
      recordSnapshot(getSnapshot());
      const idSet = new Set(ids);

      setNotes((prev) => prev.filter((n) => !idSet.has(n.id)));
      ids.forEach((id) => api.deleteNote(id));

      if (idSet.has(selectedNoteId)) {
        const remaining = notes.filter((n) => !idSet.has(n.id));
        setSelectedNoteId(remaining.length > 0 ? remaining[0].id : '');
      }
    },
    [notes, selectedNoteId, recordSnapshot, getSnapshot, setNotes, setSelectedNoteId]
  );

  const handleBatchToggleCompleteNotes = useCallback(
    (ids: string[]) => {
      if (!ids || ids.length === 0) return;
      recordSnapshot(getSnapshot());
      const idSet = new Set(ids);

      const targetNotes = notes.filter((n) => idSet.has(n.id));
      const hasAnyPending = targetNotes.some((n) => !n.isCompleted);
      const newStatus = hasAnyPending;

      setNotes((prev) =>
        prev.map((n) => {
          if (idSet.has(n.id)) {
            const updated = { ...n, isCompleted: newStatus };
            api.saveNote(updated);
            return updated;
          }
          return n;
        })
      );
    },
    [notes, recordSnapshot, getSnapshot, setNotes]
  );

  const handleBatchMoveNotesToFolder = useCallback(
    (ids: string[], targetFolderId: string) => {
      if (!ids || ids.length === 0) return;
      const targetFolder = folders.find((f) => f.id === targetFolderId);
      if (!targetFolder) return;

      recordSnapshot(getSnapshot());
      const idSet = new Set(ids);

      setNotes((prev) =>
        prev.map((n) => {
          if (idSet.has(n.id)) {
            const updated: NoteItem = {
              ...n,
              folderId: targetFolder.id,
              subjectId: targetFolder.subjectId,
            };
            api.saveNote(updated);
            return updated;
          }
          return n;
        })
      );
    },
    [folders, recordSnapshot, getSnapshot, setNotes]
  );

  const handleToggleSubjectPrivate = useCallback(
    (subject: SubjectItem) => {
      recordSnapshot(getSnapshot());
      const updated: SubjectItem = {
        ...subject,
        isPrivate: !subject.isPrivate,
      };
      setSubjects((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      api.saveSubject(updated);
    },
    [recordSnapshot, getSnapshot, setSubjects]
  );

  const handleDuplicateNote = useCallback(
    (noteId: string) => {
      const source = notes.find((n) => n.id === noteId);
      if (!source) return;

      recordSnapshot(getSnapshot());
      const duplicate: NoteItem = {
        ...source,
        id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title: `${source.title} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: 'Justo ahora',
      };

      setNotes((prev) => [duplicate, ...prev]);
      api.saveNote(duplicate);
      setSelectedNoteId(duplicate.id);
    },
    [notes, recordSnapshot, getSnapshot, setNotes, setSelectedNoteId]
  );

  return {
    handleBatchDeleteNotes,
    handleBatchToggleCompleteNotes,
    handleBatchMoveNotesToFolder,
    handleToggleSubjectPrivate,
    handleDuplicateNote,
  };
}
