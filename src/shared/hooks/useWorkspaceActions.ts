import React from 'react';
import { NoteItem, SubjectItem, FolderItem } from '../types';
import { api } from '../api/ipc';
import { WorkspaceSnapshot } from './useWorkspaceHistory';

interface Props {
  subjects: SubjectItem[];
  folders: FolderItem[];
  notes: NoteItem[];
  selectedSubjectId: string;
  selectedFolderId: string;
  selectedNoteId: string;
  setSubjects: React.Dispatch<React.SetStateAction<SubjectItem[]>>;
  setFolders: React.Dispatch<React.SetStateAction<FolderItem[]>>;
  setNotes: React.Dispatch<React.SetStateAction<NoteItem[]>>;
  setSelectedSubjectId: (id: string) => void;
  setSelectedFolderId: (id: string) => void;
  setSelectedNoteId: (id: string) => void;
  recordSnapshot: (snapshot: WorkspaceSnapshot) => void;
}

export function useWorkspaceActions({
  subjects,
  folders,
  notes,
  selectedSubjectId,
  selectedFolderId,
  selectedNoteId,
  setSubjects,
  setFolders,
  setNotes,
  setSelectedSubjectId,
  setSelectedFolderId,
  setSelectedNoteId,
  recordSnapshot,
}: Props) {
  const getSnapshot = (): WorkspaceSnapshot => ({
    subjects,
    folders,
    notes,
    selectedSubjectId,
    selectedFolderId,
    selectedNoteId,
  });

  const handleMoveNoteToFolder = async (noteId: string, targetFolderId: string) => {
    try {
      if (!noteId) return;
      const targetNote = notes.find((n) => n.id === noteId);
      if (!targetNote) return;

      if (!targetFolderId) {
        if (!targetNote.folderId || targetNote.folderId === '') return;
        recordSnapshot(getSnapshot());
        const updated: NoteItem = {
          ...targetNote,
          folderId: '',
          updatedAt: new Date().toISOString(),
        };
        setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
        setSelectedFolderId('');
        setSelectedNoteId(noteId);
        await api.saveNote(updated).catch((err) => console.error('Failed to save note move:', err));
        return;
      }

      const targetFolder = folders.find((f) => f.id === targetFolderId);
      if (!targetFolder) return;
      if (targetNote.folderId === targetFolderId) return;

      recordSnapshot(getSnapshot());

      const updated: NoteItem = {
        ...targetNote,
        folderId: targetFolderId,
        subjectId: targetFolder.subjectId,
        updatedAt: new Date().toISOString(),
      };

      setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
      setSelectedFolderId(targetFolderId);
      setSelectedSubjectId(targetFolder.subjectId);
      setSelectedNoteId(noteId);

      await api.saveNote(updated).catch((err) => console.error('Failed to save note move:', err));
    } catch (err) {
      console.error('Error in handleMoveNoteToFolder:', err);
    }
  };

  const handleReorderOrMoveNote = async (
    draggedNoteId: string,
    targetFolderId: string,
    targetNoteId?: string,
    position: 'before' | 'after' = 'after'
  ) => {
    try {
      if (!draggedNoteId) return;
      if (targetNoteId && draggedNoteId === targetNoteId) return;

      const draggedNote = notes.find((n) => n.id === draggedNoteId);
      if (!draggedNote) return;

      const targetFolder = targetFolderId ? folders.find((f) => f.id === targetFolderId) : undefined;
      const targetSubjectId = targetFolder
        ? targetFolder.subjectId
        : selectedSubjectId || draggedNote.subjectId;

      recordSnapshot(getSnapshot());

      const isTargetRoot = !targetFolderId;
      const remainingNotes = notes.filter((n) => n.id !== draggedNoteId);
      const targetGroupNotes = remainingNotes
        .filter((n) =>
          isTargetRoot
            ? (!n.folderId || n.folderId === '') && n.subjectId === targetSubjectId
            : n.folderId === targetFolderId
        )
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const otherNotes = remainingNotes.filter((n) =>
        isTargetRoot
          ? n.folderId !== '' || n.subjectId !== targetSubjectId
          : n.folderId !== targetFolderId
      );

      let insertIndex = targetGroupNotes.length;
      if (targetNoteId) {
        const targetIdx = targetGroupNotes.findIndex((n) => n.id === targetNoteId);
        if (targetIdx !== -1) {
          insertIndex = position === 'before' ? targetIdx : targetIdx + 1;
        }
      }

      const updatedDraggedNote: NoteItem = {
        ...draggedNote,
        folderId: targetFolderId || '',
        subjectId: targetSubjectId,
        updatedAt: new Date().toISOString(),
      };

      const reorderedGroupNotes = [...targetGroupNotes];
      reorderedGroupNotes.splice(insertIndex, 0, updatedDraggedNote);

      const finalizedGroupNotes = reorderedGroupNotes.map((n, idx) => ({
        ...n,
        order: idx,
      }));

      setNotes([...otherNotes, ...finalizedGroupNotes]);
      setSelectedFolderId(targetFolderId || '');
      setSelectedSubjectId(targetSubjectId);
      setSelectedNoteId(draggedNoteId);

      for (const noteToSave of finalizedGroupNotes) {
        await api.saveNote(noteToSave).catch((err) => console.error('Failed to save note order:', err));
      }
    } catch (err) {
      console.error('Error during handleReorderOrMoveNote:', err);
    }
  };

  const handleMoveNoteToSubject = async (noteId: string, targetSubjectId: string) => {
    try {
      if (!noteId || !targetSubjectId) return;
      const targetNote = notes.find((n) => n.id === noteId);
      if (!targetNote || targetNote.subjectId === targetSubjectId) return;

      recordSnapshot(getSnapshot());

      const subjectFolders = folders.filter((f) => f.subjectId === targetSubjectId);
      const targetFolderId = subjectFolders[0]?.id || '';

      const updated: NoteItem = {
        ...targetNote,
        subjectId: targetSubjectId,
        folderId: targetFolderId,
        updatedAt: new Date().toISOString(),
      };

      setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
      setSelectedSubjectId(targetSubjectId);
      setSelectedFolderId(targetFolderId);
      setSelectedNoteId(noteId);

      await api.saveNote(updated).catch((err) => console.error('Failed to move note to subject:', err));
    } catch (err) {
      console.error('Error in handleMoveNoteToSubject:', err);
    }
  };

  const handleMoveFolderToSubject = async (folderId: string, targetSubjectId: string) => {
    try {
      if (!folderId || !targetSubjectId) return;
      const folder = folders.find((f) => f.id === folderId);
      if (!folder || folder.subjectId === targetSubjectId) return;

      recordSnapshot(getSnapshot());

      const updatedFolder = { ...folder, subjectId: targetSubjectId };
      setFolders((prev) => prev.map((f) => (f.id === folderId ? updatedFolder : f)));
      await api.saveFolder(updatedFolder).catch(console.error);

      const notesToUpdate: NoteItem[] = [];
      setNotes((prev) =>
        prev.map((n) => {
          if (n.folderId === folderId) {
            const updatedNote = { ...n, subjectId: targetSubjectId, updatedAt: new Date().toISOString() };
            notesToUpdate.push(updatedNote);
            return updatedNote;
          }
          return n;
        })
      );
      setSelectedSubjectId(targetSubjectId);
      setSelectedFolderId(folderId);

      for (const n of notesToUpdate) {
        await api.saveNote(n).catch(console.error);
      }
    } catch (err) {
      console.error('Error in handleMoveFolderToSubject:', err);
    }
  };

  const handleConvertFolderToSubject = async (folderId: string) => {
    try {
      if (!folderId) return;
      const folder = folders.find((f) => f.id === folderId);
      if (!folder) return;

      recordSnapshot(getSnapshot());

      const colors = ['#f97316', '#10b981', '#6366f1', '#ec4899', '#3b82f6', '#eab308', '#8b5cf6', '#14b8a6'];
      const newSubject: SubjectItem = {
        id: `sub-${Date.now()}`,
        name: folder.name,
        color: colors[subjects.length % colors.length],
        order: subjects.length,
      };
      setSubjects((prev) => [...prev, newSubject]);
      await api.saveSubject(newSubject).catch(console.error);

      const updatedFolder = { ...folder, subjectId: newSubject.id };
      setFolders((prev) => prev.map((f) => (f.id === folderId ? updatedFolder : f)));
      await api.saveFolder(updatedFolder).catch(console.error);

      const notesToUpdate: NoteItem[] = [];
      setNotes((prev) =>
        prev.map((n) => {
          if (n.folderId === folderId) {
            const updatedNote = { ...n, subjectId: newSubject.id, updatedAt: new Date().toISOString() };
            notesToUpdate.push(updatedNote);
            return updatedNote;
          }
          return n;
        })
      );
      setSelectedSubjectId(newSubject.id);
      setSelectedFolderId(folderId);

      for (const n of notesToUpdate) {
        await api.saveNote(n).catch(console.error);
      }
    } catch (err) {
      console.error('Error in handleConvertFolderToSubject:', err);
    }
  };

  const handleReorderFolder = async (
    draggedFolderId: string,
    targetFolderId: string,
    position: 'before' | 'after' = 'after'
  ) => {
    try {
      if (!draggedFolderId || !targetFolderId || draggedFolderId === targetFolderId) return;

      const draggedFolder = folders.find((f) => f.id === draggedFolderId);
      const targetFolder = folders.find((f) => f.id === targetFolderId);
      if (!draggedFolder || !targetFolder) return;

      const targetSubjectId = targetFolder.subjectId;
      recordSnapshot(getSnapshot());

      const remainingFolders = folders.filter((f) => f.id !== draggedFolderId);
      const targetSubjectFolders = remainingFolders
        .filter((f) => f.subjectId === targetSubjectId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const otherFolders = remainingFolders.filter((f) => f.subjectId !== targetSubjectId);

      let insertIndex = targetSubjectFolders.length;
      const targetIdx = targetSubjectFolders.findIndex((f) => f.id === targetFolderId);
      if (targetIdx !== -1) {
        insertIndex = position === 'before' ? targetIdx : targetIdx + 1;
      }

      const updatedDraggedFolder: FolderItem = {
        ...draggedFolder,
        subjectId: targetSubjectId,
      };

      const reorderedFolders = [...targetSubjectFolders];
      reorderedFolders.splice(insertIndex, 0, updatedDraggedFolder);

      const finalizedSubjectFolders = reorderedFolders.map((f, idx) => ({
        ...f,
        order: idx,
      }));

      if (draggedFolder.subjectId !== targetSubjectId) {
        setNotes((prev) =>
          prev.map((n) =>
            n.folderId === draggedFolderId ? { ...n, subjectId: targetSubjectId } : n
          )
        );
        const folderNotes = notes.filter((n) => n.folderId === draggedFolderId);
        for (const n of folderNotes) {
          await api.saveNote({ ...n, subjectId: targetSubjectId }).catch(console.error);
        }
      }

      setFolders([...otherFolders, ...finalizedSubjectFolders]);
      setSelectedFolderId(draggedFolderId);
      setSelectedSubjectId(targetSubjectId);

      for (const folderToSave of finalizedSubjectFolders) {
        await api.saveFolder(folderToSave).catch((err) =>
          console.error('Failed to save folder order:', err)
        );
      }
    } catch (err) {
      console.error('Error during handleReorderFolder:', err);
    }
  };

  return {
    handleMoveNoteToFolder,
    handleReorderOrMoveNote,
    handleReorderFolder,
    handleMoveNoteToSubject,
    handleMoveFolderToSubject,
    handleConvertFolderToSubject,
  };
}
