import { useState, useEffect, useCallback } from 'react';
import { NoteItem, SubjectItem, FolderItem } from '../types';
import { api } from '../api/ipc';
import { useWorkspaceHistory, WorkspaceSnapshot } from './useWorkspaceHistory';
import { useWorkspaceActions } from './useWorkspaceActions';
import { useWorkspaceBatchActions } from './useWorkspaceBatchActions';

export function useWorkspaceState() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

  const { recordSnapshot, undo, redo } = useWorkspaceHistory();

  const getSnapshot = (): WorkspaceSnapshot => ({
    subjects,
    folders,
    notes,
    selectedSubjectId,
    selectedFolderId,
    selectedNoteId,
  });

  const {
    handleMoveNoteToFolder,
    handleReorderOrMoveNote,
    handleReorderFolder,
    handleMoveNoteToSubject,
    handleMoveFolderToSubject,
    handleConvertFolderToSubject,
  } = useWorkspaceActions({
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
  });

  const {
    handleBatchDeleteNotes,
    handleBatchToggleCompleteNotes,
    handleBatchMoveNotesToFolder,
    handleBatchMoveNotesToSubject,
    handleToggleSubjectPrivate,
    handleDuplicateNote,
  } = useWorkspaceBatchActions({
    notes,
    folders,
    selectedNoteId,
    setNotes,
    setSubjects,
    setSelectedNoteId,
    recordSnapshot,
    getSnapshot,
  });

  const reloadWorkspaceData = useCallback(async () => {
    const data = await api.getInitialData();
    const updatedFolders = [...data.folders];
    data.subjects.forEach((subj) => {
      const hasFolder = updatedFolders.some((f) => f.subjectId === subj.id);
      if (!hasFolder) {
        const autoFolder: FolderItem = {
          id: `folder-${Date.now()}-${subj.id}`,
          subjectId: subj.id,
          name: 'General',
          isExpanded: true,
          order: 0,
        };
        updatedFolders.push(autoFolder);
        api.saveFolder(autoFolder);
      }
    });
    setSubjects(data.subjects);
    setFolders(updatedFolders);
    setNotes(data.notes);
    if (data.subjects.length > 0) {
      setSelectedSubjectId(data.subjects[0].id);
      const firstSubjectFolders = updatedFolders.filter((f) => f.subjectId === data.subjects[0].id);
      if (firstSubjectFolders.length > 0) {
        setSelectedFolderId(firstSubjectFolders[0].id);
      }
    }
    if (data.notes.length > 0) {
      setSelectedNoteId(data.notes[0].id);
    }
  }, []);

  useEffect(() => {
    reloadWorkspaceData();
  }, [reloadWorkspaceData]);

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);
  const currentSubjectFolders = folders
    .filter((f) => f.subjectId === selectedSubjectId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const currentNote = notes.find((n) => n.id === selectedNoteId);
  const currentFolder = folders.find((f) => f.id === (currentNote?.folderId || selectedFolderId));

  const handleUpdateNote = useCallback((updatedNote: NoteItem) => {
    setNotes((prev) => prev.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
    api.saveNote(updatedNote);
  }, []);

  const handleToggleNoteComplete = (id: string) => {
    recordSnapshot(getSnapshot());
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
        const updated = { ...n, isCompleted: !n.isCompleted, updatedAt: new Date().toISOString() };
        api.saveNote(updated);
        return updated;
      })
    );
  };

  const handleDeleteNote = (id: string) => {
    recordSnapshot(getSnapshot());
    setNotes((prev) => prev.filter((n) => n.id !== id));
    api.deleteNote(id);
    if (selectedNoteId === id) {
      const remaining = notes.filter((n) => n.id !== id);
      setSelectedNoteId(remaining.length > 0 ? remaining[0].id : '');
    }
  };

  const handleCreateNote = (
    targetFolderId?: string,
    initialTitle: string = '',
    targetSubjectId?: string
  ) => {
    recordSnapshot(getSnapshot());

    let subjectId = targetSubjectId || selectedSubjectId;
    let folderId = '';

    if (targetFolderId !== undefined && targetFolderId !== '') {
      const existingFolder = folders.find((f) => f.id === targetFolderId);
      if (existingFolder) {
        folderId = existingFolder.id;
        subjectId = existingFolder.subjectId;
      }
    } else if (targetFolderId === undefined && selectedFolderId) {
      const existingFolder = folders.find(
        (f) => f.id === selectedFolderId && f.subjectId === subjectId
      );
      if (existingFolder) {
        folderId = existingFolder.id;
      }
    }

    // Auto-expand folder if collapsed so new note is visible
    if (folderId) {
      setFolders((prev) =>
        prev.map((f) => {
          if (f.id === folderId && !f.isExpanded) {
            const updated = { ...f, isExpanded: true };
            api.saveFolder(updated).catch(console.error);
            return updated;
          }
          return f;
        })
      );
    }

    const siblingNotes = notes.filter((n) =>
      folderId
        ? n.folderId === folderId
        : n.subjectId === subjectId && (!n.folderId || n.folderId === '')
    );
    const newNote: NoteItem = {
      id: `note-${Date.now()}`,
      folderId,
      subjectId,
      title: initialTitle,
      content: '',
      isCompleted: false,
      isPinned: false,
      order: siblingNotes.length,
      tags: activeTagFilter ? [activeTagFilter] : [],
      links: [],
      sketches: [],
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNotes((prev) => [newNote, ...prev]);
    setSelectedNoteId(newNote.id);
    setSelectedFolderId(folderId);
    setSelectedSubjectId(subjectId);
    api.saveNote(newNote).catch((err) => console.error('Failed to save new note:', err));
  };

  const handleAddFolder = (name: string, targetSubjectId?: string) => {
    recordSnapshot(getSnapshot());
    const subjectId = targetSubjectId || selectedSubjectId;
    if (!subjectId) return null;
    const subjFolders = folders.filter((f) => f.subjectId === subjectId);
    const newFolder: FolderItem = {
      id: `folder-${Date.now()}`,
      subjectId,
      name,
      isExpanded: true,
      order: subjFolders.length,
    };
    setFolders((prev) => [...prev, newFolder]);
    setSelectedFolderId(newFolder.id);
    api.saveFolder(newFolder);
    return newFolder;
  };

  const handleUpdateFolder = (updatedFolder: FolderItem) => {
    setFolders((prev) => prev.map((f) => (f.id === updatedFolder.id ? updatedFolder : f)));
    api.saveFolder(updatedFolder);
  };

  const handleDeleteFolder = (id: string) => {
    recordSnapshot(getSnapshot());
    const remainingFolders = folders.filter((f) => f.id !== id);
    setNotes((prev) => prev.filter((n) => n.folderId !== id));
    api.deleteFolder(id);

    setFolders(remainingFolders);
    if (selectedFolderId === id) {
      const activeSubjFolders = remainingFolders.filter((f) => f.subjectId === selectedSubjectId);
      setSelectedFolderId(activeSubjFolders[0]?.id || '');
    }
  };

  const handleToggleFolderExpand = (id: string) => {
    setFolders((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        const updated = { ...f, isExpanded: !f.isExpanded };
        api.saveFolder(updated);
        return updated;
      })
    );
  };

  const handleAddSubject = (name: string, color: string) => {
    recordSnapshot(getSnapshot());
    const newSubject: SubjectItem = { id: `sub-${Date.now()}`, name, color, order: subjects.length };
    const defaultFolder: FolderItem = { id: `folder-${Date.now()}`, subjectId: newSubject.id, name: 'General', isExpanded: true, order: 0 };
    setSubjects((prev) => [...prev, newSubject]);
    setFolders((prev) => [...prev, defaultFolder]);
    setSelectedSubjectId(newSubject.id);
    setSelectedFolderId(defaultFolder.id);
    api.saveSubject(newSubject);
    api.saveFolder(defaultFolder);
  };

  const handleUpdateSubject = (updatedSubject: SubjectItem) => {
    setSubjects((prev) => prev.map((s) => (s.id === updatedSubject.id ? updatedSubject : s)));
    api.saveSubject(updatedSubject);
  };

  const handleDeleteSubject = (id: string) => {
    recordSnapshot(getSnapshot());
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    setFolders((prev) => prev.filter((f) => f.subjectId !== id));
    setNotes((prev) => prev.filter((n) => n.subjectId !== id));
    api.deleteSubject(id);

    if (selectedSubjectId === id) {
      const remaining = subjects.filter((s) => s.id !== id);
      setSelectedSubjectId(remaining.length > 0 ? remaining[0].id : '');
    }
  };

  const getSubjectNoteCount = (subjectId: string) => {
    return notes.filter((n) => n.subjectId === subjectId).length;
  };

  const handleWorkspaceUndo = async () => {
    try {
      const prev = await undo(getSnapshot());
      if (prev) {
        setSubjects(prev.subjects);
        setFolders(prev.folders);
        setNotes(prev.notes);
        setSelectedSubjectId(prev.selectedSubjectId);
        setSelectedFolderId(prev.selectedFolderId);
        setSelectedNoteId(prev.selectedNoteId);
      }
    } catch (err) {
      console.error('handleWorkspaceUndo error:', err);
    }
  };

  const handleWorkspaceRedo = async () => {
    try {
      const next = await redo(getSnapshot());
      if (next) {
        setSubjects(next.subjects);
        setFolders(next.folders);
        setNotes(next.notes);
        setSelectedSubjectId(next.selectedSubjectId);
        setSelectedFolderId(next.selectedFolderId);
        setSelectedNoteId(next.selectedNoteId);
      }
    } catch (err) {
      console.error('handleWorkspaceRedo error:', err);
    }
  };

  return {
    subjects,
    folders,
    notes,
    selectedSubjectId,
    selectedFolderId,
    selectedNoteId,
    activeTagFilter,
    currentSubject,
    currentSubjectFolders,
    currentNote,
    currentFolder,
    setSelectedSubjectId,
    setSelectedFolderId,
    setSelectedNoteId,
    setActiveTagFilter,
    handleUpdateNote,
    handleToggleNoteComplete,
    handleDeleteNote,
    handleCreateNote,
    handleMoveNoteToFolder,
    handleReorderOrMoveNote,
    handleReorderFolder,
    handleMoveNoteToSubject,
    handleMoveFolderToSubject,
    handleConvertFolderToSubject,
    handleAddFolder,
    handleUpdateFolder,
    handleDeleteFolder,
    handleToggleFolderExpand,
    handleAddSubject,
    handleUpdateSubject,
    handleDeleteSubject,
    getSubjectNoteCount,
    handleWorkspaceUndo,
    handleWorkspaceRedo,
    reloadWorkspaceData,
    handleBatchDeleteNotes,
    handleBatchToggleCompleteNotes,
    handleBatchMoveNotesToFolder,
    handleBatchMoveNotesToSubject,
    handleToggleSubjectPrivate,
    handleDuplicateNote,
  };
}
