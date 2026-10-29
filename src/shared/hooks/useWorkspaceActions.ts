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
      if (!noteId || !targetFolderId) return;
      const targetFolder = folders.find((f) => f.id === targetFolderId);
      if (!targetFolder) return;
      const targetNote = notes.find((n) => n.id === noteId);
      if (!targetNote || targetNote.folderId === targetFolderId) return;

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
      if (!draggedNoteId || !targetFolderId) return;
      if (targetNoteId && draggedNoteId === targetNoteId) return;

      const targetFolder = folders.find((f) => f.id === targetFolderId);
      if (!targetFolder) return;

      const draggedNote = notes.find((n) => n.id === draggedNoteId);
      if (!draggedNote) return;

      recordSnapshot(getSnapshot());

      const remainingNotes = notes.filter((n) => n.id !== draggedNoteId);
      const targetFolderNotes = remainingNotes
        .filter((n) => n.folderId === targetFolderId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const otherNotes = remainingNotes.filter((n) => n.folderId !== targetFolderId);

      let insertIndex = targetFolderNotes.length;
      if (targetNoteId) {
        const targetIdx = targetFolderNotes.findIndex((n) => n.id === targetNoteId);
        if (targetIdx !== -1) {
          insertIndex = position === 'before' ? targetIdx : targetIdx + 1;
        }
      }

      const updatedDraggedNote: NoteItem = {
        ...draggedNote,
        folderId: targetFolderId,
        subjectId: targetFolder.subjectId,
        updatedAt: new Date().toISOString(),
      };

      const reorderedFolderNotes = [...targetFolderNotes];
      reorderedFolderNotes.splice(insertIndex, 0, updatedDraggedNote);

      const finalizedFolderNotes = reorderedFolderNotes.map((n, idx) => ({
        ...n,
        order: idx,
      }));

      setNotes([...otherNotes, ...finalizedFolderNotes]);
      setSelectedFolderId(targetFolderId);
      setSelectedSubjectId(targetFolder.subjectId);
      setSelectedNoteId(draggedNoteId);

      for (const noteToSave of finalizedFolderNotes) {
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
      let targetFolder = subjectFolders[0];

      if (!targetFolder) {
        const newFolder: FolderItem = {
          id: `folder-${Date.now()}`,
          subjectId: targetSubjectId,
          name: 'General',
          isExpanded: true,
          order: 0,
        };
        setFolders((prev) => [...prev, newFolder]);
        await api.saveFolder(newFolder).catch(console.error);
        targetFolder = newFolder;
      }

      const updated: NoteItem = {
        ...targetNote,
        subjectId: targetSubjectId,
        folderId: targetFolder.id,
        updatedAt: new Date().toISOString(),
      };

      setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
      setSelectedSubjectId(targetSubjectId);
      setSelectedFolderId(targetFolder.id);
      setSelectedNoteId(noteId);

      await api.saveNote(updated).catch(console.error);
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

  return {
    handleMoveNoteToFolder,
    handleReorderOrMoveNote,
    handleMoveNoteToSubject,
    handleMoveFolderToSubject,
    handleConvertFolderToSubject,
  };
}
