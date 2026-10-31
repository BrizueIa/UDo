import React, { useCallback } from 'react';
import { FolderItem, NoteItem, SubjectItem } from '../types';
import { api } from '../api/ipc';
import { WorkspaceSnapshot } from './useWorkspaceHistory';

interface Props {
  notes: NoteItem[];
  folders: FolderItem[];
  selectedNoteId: string;
  selectedFolderId?: string;
  selectedSubjectId?: string;
  setNotes: React.Dispatch<React.SetStateAction<NoteItem[]>>;
  setFolders: React.Dispatch<React.SetStateAction<FolderItem[]>>;
  setSelectedFolderId?: React.Dispatch<React.SetStateAction<string>>;
  setSubjects: React.Dispatch<React.SetStateAction<SubjectItem[]>>;
  setSelectedNoteId: React.Dispatch<React.SetStateAction<string>>;
  recordSnapshot: (snapshot: WorkspaceSnapshot) => void;
  getSnapshot: () => WorkspaceSnapshot;
  deletedNoteIdsRef?: React.MutableRefObject<Set<string>>;
}

export function useWorkspaceBatchActions({
  notes,
  folders,
  selectedNoteId,
  selectedFolderId,
  selectedSubjectId,
  setNotes,
  setFolders,
  setSelectedFolderId,
  setSubjects,
  setSelectedNoteId,
  recordSnapshot,
  getSnapshot,
  deletedNoteIdsRef,
}: Props) {
  const handleBatchDeleteFolders = useCallback(
    (folderIds: string[]) => {
      if (!folderIds || folderIds.length === 0) return;
      recordSnapshot(getSnapshot());
      const idSet = new Set(folderIds);

      // Track deleted notes and notify API so late editor flush doesn't revive them
      const folderNotes = notes.filter((n) => n.folderId && idSet.has(n.folderId));
      folderNotes.forEach((n) => {
        deletedNoteIdsRef?.current.add(n.id);
        api.deleteNote(n.id);
      });

      setFolders((prev) => prev.filter((f) => !idSet.has(f.id)));
      setNotes((prev) => prev.filter((n) => !n.folderId || !idSet.has(n.folderId)));
      folderIds.forEach((id) => api.deleteFolder(id));

      if (selectedFolderId && idSet.has(selectedFolderId) && setSelectedFolderId) {
        const remaining = folders.filter((f) => !idSet.has(f.id) && f.subjectId === selectedSubjectId);
        setSelectedFolderId(remaining[0]?.id || '');
      }
    },
    [folders, notes, selectedFolderId, selectedSubjectId, recordSnapshot, getSnapshot, setFolders, setNotes, setSelectedFolderId, deletedNoteIdsRef]
  );
  const handleBatchDeleteNotes = useCallback(
    (ids: string[]) => {
      if (!ids || ids.length === 0) return;
      recordSnapshot(getSnapshot());
      const idSet = new Set(ids);

      ids.forEach((id) => {
        deletedNoteIdsRef?.current.add(id);
        api.deleteNote(id);
      });

      setNotes((prev) => prev.filter((n) => !idSet.has(n.id)));

      if (idSet.has(selectedNoteId)) {
        const remaining = notes.filter((n) => !idSet.has(n.id));
        setSelectedNoteId(remaining.length > 0 ? remaining[0].id : '');
      }
    },
    [notes, selectedNoteId, recordSnapshot, getSnapshot, setNotes, setSelectedNoteId, deletedNoteIdsRef]
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
      recordSnapshot(getSnapshot());
      const idSet = new Set(ids);

      if (!targetFolderId) {
        setNotes((prev) =>
          prev.map((n) => {
            if (idSet.has(n.id)) {
              const updated: NoteItem = {
                ...n,
                folderId: '',
              };
              api.saveNote(updated);
              return updated;
            }
            return n;
          })
        );
        return;
      }

      const targetFolder = folders.find((f) => f.id === targetFolderId);
      if (!targetFolder) return;

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

  const handleBatchMoveNotesToSubject = useCallback(
    (ids: string[], targetSubjectId: string) => {
      if (!ids || ids.length === 0) return;
      recordSnapshot(getSnapshot());
      const idSet = new Set(ids);

      setNotes((prev) =>
        prev.map((n) => {
          if (idSet.has(n.id)) {
            const updated: NoteItem = {
              ...n,
              subjectId: targetSubjectId,
              folderId: '',
            };
            api.saveNote(updated);
            return updated;
          }
          return n;
        })
      );
    },
    [recordSnapshot, getSnapshot, setNotes]
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

  const handleToggleFolderPrivate = useCallback(
    (folder: FolderItem) => {
      recordSnapshot(getSnapshot());
      const updated: FolderItem = {
        ...folder,
        isPrivate: !folder.isPrivate,
      };
      setFolders((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      api.saveFolder(updated);
    },
    [recordSnapshot, getSnapshot, setFolders]
  );

  const handleToggleNotePrivate = useCallback(
    (note: NoteItem) => {
      recordSnapshot(getSnapshot());
      const updated: NoteItem = {
        ...note,
        isPrivate: !note.isPrivate,
        updatedAt: new Date().toISOString(),
      };
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      api.saveNote(updated);
    },
    [recordSnapshot, getSnapshot, setNotes]
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
    handleBatchDeleteFolders,
    handleBatchToggleCompleteNotes,
    handleBatchMoveNotesToFolder,
    handleBatchMoveNotesToSubject,
    handleToggleSubjectPrivate,
    handleToggleFolderPrivate,
    handleToggleNotePrivate,
    handleDuplicateNote,
  };
}
