import { useRef, useCallback } from 'react';
import { SubjectItem, FolderItem, NoteItem } from '../types';
import { api } from '../api/ipc';

export interface WorkspaceSnapshot {
  subjects: SubjectItem[];
  folders: FolderItem[];
  notes: NoteItem[];
  selectedSubjectId: string;
  selectedFolderId: string;
  selectedNoteId: string;
}

const MAX_HISTORY = 40;

export function useWorkspaceHistory() {
  const undoStackRef = useRef<WorkspaceSnapshot[]>([]);
  const redoStackRef = useRef<WorkspaceSnapshot[]>([]);

  const recordSnapshot = useCallback((snapshot: WorkspaceSnapshot) => {
    // Clone snapshot deep enough for entities
    const cloned: WorkspaceSnapshot = {
      subjects: [...snapshot.subjects],
      folders: [...snapshot.folders],
      notes: [...snapshot.notes],
      selectedSubjectId: snapshot.selectedSubjectId,
      selectedFolderId: snapshot.selectedFolderId,
      selectedNoteId: snapshot.selectedNoteId,
    };

    undoStackRef.current.push(cloned);
    if (undoStackRef.current.length > MAX_HISTORY) {
      undoStackRef.current.shift();
    }
    // Any new action clears the redo stack
    redoStackRef.current = [];
  }, []);

  const syncDatabaseDiff = useCallback(async (current: WorkspaceSnapshot, target: WorkspaceSnapshot) => {
    try {
      const currentSubjectMap = new Map(current.subjects.map((s) => [s.id, s]));
      const targetSubjectMap = new Map(target.subjects.map((s) => [s.id, s]));
      const currentFolderMap = new Map(current.folders.map((f) => [f.id, f]));
      const targetFolderMap = new Map(target.folders.map((f) => [f.id, f]));
      const currentNoteMap = new Map(current.notes.map((n) => [n.id, n]));
      const targetNoteMap = new Map(target.notes.map((n) => [n.id, n]));

      // 1. Restored or updated Subjects in target (first for foreign key constraints)
      for (const targetSubject of target.subjects) {
        const cur = currentSubjectMap.get(targetSubject.id);
        if (!cur || cur.name !== targetSubject.name || cur.color !== targetSubject.color) {
          await api.saveSubject(targetSubject).catch((err) => console.error('Undo sync saveSubject failed:', err));
        }
      }

      // 2. Restored or updated Folders in target
      for (const targetFolder of target.folders) {
        const cur = currentFolderMap.get(targetFolder.id);
        if (
          !cur ||
          cur.name !== targetFolder.name ||
          cur.subjectId !== targetFolder.subjectId ||
          cur.isExpanded !== targetFolder.isExpanded ||
          cur.order !== targetFolder.order
        ) {
          await api.saveFolder(targetFolder).catch((err) => console.error('Undo sync saveFolder failed:', err));
        }
      }

      // 3. Restored or updated Notes in target
      for (const targetNote of target.notes) {
        const cur = currentNoteMap.get(targetNote.id);
        if (
          !cur ||
          cur.folderId !== targetNote.folderId ||
          cur.subjectId !== targetNote.subjectId ||
          cur.title !== targetNote.title ||
          cur.content !== targetNote.content ||
          cur.isCompleted !== targetNote.isCompleted ||
          cur.isPinned !== targetNote.isPinned ||
          cur.order !== targetNote.order
        ) {
          await api.saveNote(targetNote).catch((err) => console.error('Undo sync saveNote failed:', err));
        }
      }

      // 4. Notes deleted in target (delete children before parents)
      for (const curNote of current.notes) {
        if (!targetNoteMap.has(curNote.id)) {
          await api.deleteNote(curNote.id).catch((err) => console.error('Undo sync deleteNote failed:', err));
        }
      }

      // 5. Folders deleted in target
      for (const curFolder of current.folders) {
        if (!targetFolderMap.has(curFolder.id)) {
          await api.deleteFolder(curFolder.id).catch((err) => console.error('Undo sync deleteFolder failed:', err));
        }
      }

      // 6. Subjects deleted in target
      for (const curSubject of current.subjects) {
        if (!targetSubjectMap.has(curSubject.id)) {
          await api.deleteSubject(curSubject.id).catch((err) => console.error('Undo sync deleteSubject failed:', err));
        }
      }
    } catch (err) {
      console.error('Error in syncDatabaseDiff:', err);
    }
  }, []);

  const undo = useCallback(
    async (current: WorkspaceSnapshot): Promise<WorkspaceSnapshot | null> => {
      const stack = undoStackRef.current;
      if (stack.length === 0) return null;

      const previous = stack.pop()!;
      redoStackRef.current.push({
        subjects: [...current.subjects],
        folders: [...current.folders],
        notes: [...current.notes],
        selectedSubjectId: current.selectedSubjectId,
        selectedFolderId: current.selectedFolderId,
        selectedNoteId: current.selectedNoteId,
      });

      await syncDatabaseDiff(current, previous);
      return previous;
    },
    [syncDatabaseDiff]
  );

  const redo = useCallback(
    async (current: WorkspaceSnapshot): Promise<WorkspaceSnapshot | null> => {
      const stack = redoStackRef.current;
      if (stack.length === 0) return null;

      const next = stack.pop()!;
      undoStackRef.current.push({
        subjects: [...current.subjects],
        folders: [...current.folders],
        notes: [...current.notes],
        selectedSubjectId: current.selectedSubjectId,
        selectedFolderId: current.selectedFolderId,
        selectedNoteId: current.selectedNoteId,
      });

      await syncDatabaseDiff(current, next);
      return next;
    },
    [syncDatabaseDiff]
  );

  return {
    recordSnapshot,
    undo,
    redo,
    canUndo: () => undoStackRef.current.length > 0,
    canRedo: () => redoStackRef.current.length > 0,
  };
}
