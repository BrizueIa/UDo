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

  const handleMoveNoteToFolder = (noteId: string, targetFolderId: string) => {
    const targetFolder = folders.find((f) => f.id === targetFolderId);
    if (!targetFolder) return;

    recordSnapshot(getSnapshot());

    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === noteId) {
          const updated = {
            ...n,
            folderId: targetFolderId,
            subjectId: targetFolder.subjectId,
            updatedAt: new Date().toISOString(),
          };
          api.saveNote(updated);
          return updated;
        }
        return n;
      })
    );
    setSelectedFolderId(targetFolderId);
    setSelectedSubjectId(targetFolder.subjectId);
    setSelectedNoteId(noteId);
  };

  const handleReorderOrMoveNote = (
    draggedNoteId: string,
    targetFolderId: string,
    targetNoteId?: string,
    position: 'before' | 'after' = 'after'
  ) => {
    const targetFolder = folders.find((f) => f.id === targetFolderId);
    if (!targetFolder) return;

    recordSnapshot(getSnapshot());

    setNotes((prev) => {
      const draggedNote = prev.find((n) => n.id === draggedNoteId);
      if (!draggedNote) return prev;

      // Filter out dragged note from current list
      const remainingNotes = prev.filter((n) => n.id !== draggedNoteId);

      // Get all notes in target folder
      const targetFolderNotes = remainingNotes.filter((n) => n.folderId === targetFolderId);
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

      // Update order index for all notes in target folder
      const finalizedFolderNotes = reorderedFolderNotes.map((n, idx) => {
        const withOrder = { ...n, order: idx };
        api.saveNote(withOrder);
        return withOrder;
      });

      return [...otherNotes, ...finalizedFolderNotes];
    });

    setSelectedFolderId(targetFolderId);
    setSelectedSubjectId(targetFolder.subjectId);
    setSelectedNoteId(draggedNoteId);
  };

  const handleMoveNoteToSubject = (noteId: string, targetSubjectId: string) => {
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
      api.saveFolder(newFolder);
      targetFolder = newFolder;
    }

    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === noteId) {
          const updated = {
            ...n,
            subjectId: targetSubjectId,
            folderId: targetFolder.id,
            updatedAt: new Date().toISOString(),
          };
          api.saveNote(updated);
          return updated;
        }
        return n;
      })
    );
    setSelectedSubjectId(targetSubjectId);
    setSelectedFolderId(targetFolder.id);
    setSelectedNoteId(noteId);
  };

  const handleMoveFolderToSubject = (folderId: string, targetSubjectId: string) => {
    const folder = folders.find((f) => f.id === folderId);
    if (!folder || folder.subjectId === targetSubjectId) return;

    recordSnapshot(getSnapshot());

    const updatedFolder = { ...folder, subjectId: targetSubjectId };
    setFolders((prev) => prev.map((f) => (f.id === folderId ? updatedFolder : f)));
    api.saveFolder(updatedFolder);

    setNotes((prev) =>
      prev.map((n) => {
        if (n.folderId === folderId) {
          const updatedNote = { ...n, subjectId: targetSubjectId, updatedAt: new Date().toISOString() };
          api.saveNote(updatedNote);
          return updatedNote;
        }
        return n;
      })
    );
    setSelectedSubjectId(targetSubjectId);
    setSelectedFolderId(folderId);
  };

  const handleConvertFolderToSubject = (folderId: string) => {
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
    api.saveSubject(newSubject);

    const updatedFolder = { ...folder, subjectId: newSubject.id };
    setFolders((prev) => prev.map((f) => (f.id === folderId ? updatedFolder : f)));
    api.saveFolder(updatedFolder);

    setNotes((prev) =>
      prev.map((n) => {
        if (n.folderId === folderId) {
          const updatedNote = { ...n, subjectId: newSubject.id, updatedAt: new Date().toISOString() };
          api.saveNote(updatedNote);
          return updatedNote;
        }
        return n;
      })
    );
    setSelectedSubjectId(newSubject.id);
    setSelectedFolderId(folderId);
  };

  return {
    handleMoveNoteToFolder,
    handleReorderOrMoveNote,
    handleMoveNoteToSubject,
    handleMoveFolderToSubject,
    handleConvertFolderToSubject,
  };
}
