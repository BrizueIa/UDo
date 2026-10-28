import { useState, useEffect } from 'react';
import { NoteItem, SubjectItem, FolderItem } from '../types';
import { api } from '../api/ipc';

export function useWorkspaceState() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

  useEffect(() => {
    api.getInitialData().then((data) => {
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
    });
  }, []);

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);
  const currentSubjectFolders = folders.filter((f) => f.subjectId === selectedSubjectId);
  const currentNote = notes.find((n) => n.id === selectedNoteId);
  const currentFolder = folders.find((f) => f.id === (currentNote?.folderId || selectedFolderId));

  const handleUpdateNote = (updatedNote: NoteItem) => {
    setNotes((prev) => prev.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
    api.saveNote(updatedNote);
  };

  const handleToggleNoteComplete = (id: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const updated = {
            ...n,
            isCompleted: !n.isCompleted,
            updatedAt: new Date().toISOString(),
          };
          api.saveNote(updated);
          return updated;
        }
        return n;
      })
    );
  };

  const handleDeleteNote = (id: string) => {
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
    let folderId = targetFolderId || selectedFolderId;
    let subjectId = targetSubjectId || selectedSubjectId;

    if (folderId && !targetSubjectId) {
      const knownFolder = folders.find((f) => f.id === folderId);
      if (knownFolder) subjectId = knownFolder.subjectId;
    }

    if (!folderId) {
      const subjFolders = folders.filter((f) => f.subjectId === subjectId);
      if (subjFolders.length > 0) {
        folderId = subjFolders[0].id;
      } else if (subjectId) {
        const autoFolder: FolderItem = {
          id: `folder-${Date.now()}`,
          subjectId,
          name: 'General',
          isExpanded: true,
          order: 0,
        };
        setFolders((prev) => [...prev, autoFolder]);
        api.saveFolder(autoFolder);
        folderId = autoFolder.id;
      } else {
        return;
      }
    }

    // Auto-expand folder if collapsed so new note is visible
    setFolders((prev) =>
      prev.map((f) => {
        if (f.id === folderId && !f.isExpanded) {
          const updated = { ...f, isExpanded: true };
          api.saveFolder(updated);
          return updated;
        }
        return f;
      })
    );

    const newNote: NoteItem = {
      id: `note-${Date.now()}`,
      folderId,
      subjectId,
      title: initialTitle,
      content: '',
      isCompleted: false,
      isPinned: false,
      tags: activeTagFilter ? [activeTagFilter] : [],
      links: [],
      sketches: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNotes((prev) => [newNote, ...prev]);
    setSelectedNoteId(newNote.id);
    setSelectedFolderId(folderId);
    setSelectedSubjectId(subjectId);
    api.saveNote(newNote);
  };

  const handleAddFolder = (name: string, targetSubjectId?: string) => {
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
    const deleted = folders.find((f) => f.id === id);
    const remainingFolders = folders.filter((f) => f.id !== id);
    setNotes((prev) => prev.filter((n) => n.folderId !== id));
    api.deleteFolder(id);

    if (deleted) {
      const subjectHasRemaining = remainingFolders.some((f) => f.subjectId === deleted.subjectId);
      if (!subjectHasRemaining) {
        const autoFolder: FolderItem = {
          id: `folder-${Date.now()}`,
          subjectId: deleted.subjectId,
          name: 'General',
          isExpanded: true,
          order: 0,
        };
        remainingFolders.push(autoFolder);
        api.saveFolder(autoFolder);
      }
    }

    setFolders(remainingFolders);
    if (selectedFolderId === id) {
      const activeSubjFolders = remainingFolders.filter((f) => f.subjectId === selectedSubjectId);
      setSelectedFolderId(activeSubjFolders[0]?.id || '');
    }
  };

  const handleToggleFolderExpand = (id: string) => {
    setFolders((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          const updated = { ...f, isExpanded: !f.isExpanded };
          api.saveFolder(updated);
          return updated;
        }
        return f;
      })
    );
  };

  const handleAddSubject = (name: string, color: string) => {
    const newSubject: SubjectItem = {
      id: `sub-${Date.now()}`,
      name,
      color,
      order: subjects.length,
    };
    const defaultFolder: FolderItem = {
      id: `folder-${Date.now()}`,
      subjectId: newSubject.id,
      name: 'General',
      isExpanded: true,
      order: 0,
    };
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

  const handleMoveNoteToFolder = (noteId: string, targetFolderId: string) => {
    const targetFolder = folders.find((f) => f.id === targetFolderId);
    if (!targetFolder) return;

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

  const handleMoveNoteToSubject = (noteId: string, targetSubjectId: string) => {
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
    handleMoveNoteToSubject,
    handleAddFolder,
    handleUpdateFolder,
    handleDeleteFolder,
    handleToggleFolderExpand,
    handleAddSubject,
    handleUpdateSubject,
    handleDeleteSubject,
    getSubjectNoteCount,
  };
}
