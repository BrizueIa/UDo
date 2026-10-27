import React, { useState, useEffect } from 'react';
import {
  NoteItem,
  SubjectItem,
  FolderItem,
  ViewFilter,
  ThemeId,
  SketchItem,
} from '../shared/types';
import { api } from '../shared/api/ipc';
import { TopBar } from './TopBar';
import { SubjectsSidebar } from '../features/subjects/components/SubjectsSidebar';
import { FoldersList } from '../features/folders/components/FoldersList';
import { NoteDetailView } from '../features/note-sheet/components/NoteDetailView';
import { FloatingWidget } from '../features/floating-widget/components/FloatingWidget';
import { ImageAnnotatorModal } from '../features/canvas-editor/components/ImageAnnotatorModal';
import { CommandPalette } from '../features/search-palette/components/CommandPalette';
import { ShortcutsModal } from '../shared/ui/ShortcutsModal';
import { useTranslation } from 'react-i18next';

export const App: React.FC = () => {
  const { i18n } = useTranslation();

  // State
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');
  const [filter, setFilter] = useState<ViewFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Mode Toggles
  const [isWidgetMode, setIsWidgetMode] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isSearchPaletteOpen, setIsSearchPaletteOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [activeSketch, setActiveSketch] = useState<SketchItem | null>(null);

  // Theme & Language
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(() => {
    return (localStorage.getItem('udo_theme') as ThemeId) || 'tokyo-night';
  });

  const themes: ThemeId[] = [
    'tokyo-night',
    'catppuccin-mocha',
    'nord',
    'rose-pine',
    'oled',
    'catppuccin-latte',
  ];

  // Apply theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('udo_theme', currentTheme);
  }, [currentTheme]);

  // Load initial data from Rust / LocalStorage
  useEffect(() => {
    api.getInitialData().then((data) => {
      setSubjects(data.subjects);
      setFolders(data.folders);
      setNotes(data.notes);
      if (data.subjects.length > 0) {
        setSelectedSubjectId(data.subjects[0].id);
      }
      if (data.notes.length > 0) {
        setSelectedNoteId(data.notes[0].id);
      }
    });
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in text inputs, unless Ctrl is held
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchPaletteOpen((prev) => !prev);
      } else if (e.altKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        setIsWidgetMode((prev) => !prev);
      } else if (e.key === 'F11') {
        e.preventDefault();
        setIsZenMode((prev) => !prev);
      } else if (!isInput && e.key === '?') {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
      } else if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleCreateNote();
      } else if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (selectedNoteId) {
          handleToggleNoteComplete(selectedNoteId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNoteId, folders, selectedSubjectId]);

  // Handlers
  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);
  const currentSubjectFolders = folders.filter((f) => f.subjectId === selectedSubjectId);
  const currentNote = notes.find((n) => n.id === selectedNoteId);
  const currentFolder = folders.find((f) => f.id === currentNote?.folderId);

  const handleUpdateNote = (updatedNote: NoteItem) => {
    setNotes((prev) => prev.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
    api.saveNote(updatedNote);
  };

  const handleToggleNoteComplete = (id: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const updated = { ...n, isCompleted: !n.isCompleted };
          api.saveNote(updated);
          return updated;
        }
        return n;
      })
    );
  };

  const handleCreateNote = (folderId?: string) => {
    const targetFolderId = folderId || currentSubjectFolders[0]?.id;
    if (!targetFolderId) return;

    const newNote: NoteItem = {
      id: `note-${Date.now()}`,
      folderId: targetFolderId,
      subjectId: selectedSubjectId,
      title: 'New Note',
      content: '',
      isCompleted: false,
      isPinned: false,
      tags: [],
      links: [],
      sketches: [],
      createdAt: new Date().toISOString(),
      updatedAt: 'Just now',
    };

    setNotes((prev) => [newNote, ...prev]);
    setSelectedNoteId(newNote.id);
    api.saveNote(newNote);
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    api.deleteNote(id);
    if (selectedNoteId === id) {
      const remaining = notes.filter((n) => n.id !== id);
      setSelectedNoteId(remaining[0]?.id || '');
    }
  };

  const handleAddFolder = () => {
    const name = prompt('Folder name:') || 'New Folder';
    const newFolder: FolderItem = {
      id: `fold-${Date.now()}`,
      subjectId: selectedSubjectId,
      name,
      isExpanded: true,
      order: currentSubjectFolders.length,
    };
    setFolders((prev) => [...prev, newFolder]);
    api.saveFolder(newFolder);
  };

  const handleToggleFolderExpand = (folderId: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, isExpanded: !f.isExpanded } : f))
    );
  };

  const handleAddSubject = () => {
    const name = prompt('Subject / Project name:') || 'New Project';
    const colors = ['#f97316', '#10b981', '#6366f1', '#ec4899', '#3b82f6', '#eab308'];
    const newSubject: SubjectItem = {
      id: `subj-${Date.now()}`,
      name,
      color: colors[subjects.length % colors.length],
      order: subjects.length,
    };
    setSubjects((prev) => [...prev, newSubject]);
    setSelectedSubjectId(newSubject.id);
    api.saveSubject(newSubject);
  };

  const handleCycleTheme = () => {
    const nextIdx = (themes.indexOf(currentTheme) + 1) % themes.length;
    setCurrentTheme(themes[nextIdx]);
  };

  const handleCycleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'es' : 'en';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('udo_language', nextLang);
  };

  // Filtered notes by query or filter tab
  const getSubjectNoteCount = (subjectId: string) => {
    return notes.filter((n) => n.subjectId === subjectId && !n.isCompleted).length;
  };

  const pendingCount = notes.filter((n) => !n.isCompleted).length;
  const completedCount = notes.filter((n) => n.isCompleted).length;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-theme-base text-theme-text font-sans">
      {/* Top Header */}
      <TopBar
        currentSubjectName={currentSubject?.name}
        searchQuery={searchQuery}
        filter={filter}
        pendingCount={pendingCount}
        completedCount={completedCount}
        totalCount={notes.length}
        currentTheme={currentTheme}
        onSearchChange={setSearchQuery}
        onFilterChange={setFilter}
        onToggleTheme={handleCycleTheme}
        onToggleLanguage={handleCycleLanguage}
        onToggleShortcutsModal={() => setIsShortcutsModalOpen(true)}
        onToggleWidgetMode={() => setIsWidgetMode((m) => !m)}
      />

      {/* Main 3-Column Workspace */}
      <main className="flex-1 flex overflow-hidden">
        {/* Column 1: Subjects Sidebar (collapses in Zen Mode) */}
        {!isZenMode && (
          <SubjectsSidebar
            subjects={subjects}
            selectedSubjectId={selectedSubjectId}
            onSelectSubject={setSelectedSubjectId}
            onAddSubject={handleAddSubject}
            getSubjectNoteCount={getSubjectNoteCount}
          />
        )}

        {/* Column 2: Folders & Tasks List (collapses in Zen Mode) */}
        {!isZenMode && (
          <FoldersList
            currentSubject={currentSubject}
            folders={currentSubjectFolders}
            notes={notes}
            selectedNoteId={selectedNoteId}
            filter={filter}
            onSelectNote={setSelectedNoteId}
            onToggleNoteComplete={handleToggleNoteComplete}
            onToggleFolderExpand={handleToggleFolderExpand}
            onAddFolder={handleAddFolder}
            onAddNote={handleCreateNote}
          />
        )}

        {/* Column 3: Note Detail View */}
        {currentNote ? (
          <NoteDetailView
            note={currentNote}
            folderName={currentFolder?.name || 'Notes'}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            onOpenSketchAnnotator={(sketch) => setActiveSketch(sketch)}
            onOpenWhiteboard={() => {
              // Create new sketch on the fly
              const newSketch: SketchItem = {
                id: `sketch-${Date.now()}`,
                title: 'New Canvas Drawing',
                dataUrl:
                  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="600" height="450"><rect width="600" height="450" fill="%231a1a1a"/></svg>',
                createdAt: new Date().toISOString(),
              };
              handleUpdateNote({
                ...currentNote,
                sketches: [...currentNote.sketches, newSketch],
              });
              setActiveSketch(newSketch);
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-theme-muted">
            Select or create a note to get started
          </div>
        )}
      </main>

      {/* Always-on-Top Floating Widget Mode */}
      {isWidgetMode && (
        <FloatingWidget
          notes={notes}
          onToggleComplete={handleToggleNoteComplete}
          onQuickAddNote={(title) => {
            const defaultFolder = currentSubjectFolders[0] || folders[0];
            if (!defaultFolder) return;
            const newNote: NoteItem = {
              id: `note-${Date.now()}`,
              folderId: defaultFolder.id,
              subjectId: defaultFolder.subjectId,
              title,
              content: '',
              isCompleted: false,
              isPinned: false,
              tags: [],
              links: [],
              sketches: [],
              createdAt: new Date().toISOString(),
              updatedAt: 'Just now',
            };
            setNotes((prev) => [newNote, ...prev]);
            api.saveNote(newNote);
          }}
          onRestoreFullApp={() => setIsWidgetMode(false)}
        />
      )}

      {/* Image Annotator & Canvas Modal */}
      {activeSketch && currentNote && (
        <ImageAnnotatorModal
          sketch={activeSketch}
          isOpen={!!activeSketch}
          onClose={() => setActiveSketch(null)}
          onSave={(updatedSketch) => {
            handleUpdateNote({
              ...currentNote,
              sketches: currentNote.sketches.map((s) =>
                s.id === updatedSketch.id ? updatedSketch : s
              ),
            });
            setActiveSketch(null);
          }}
        />
      )}

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isSearchPaletteOpen}
        notes={notes}
        subjects={subjects}
        folders={folders}
        onClose={() => setIsSearchPaletteOpen(false)}
        onSelectNote={(noteId, subjectId) => {
          setSelectedSubjectId(subjectId);
          setSelectedNoteId(noteId);
        }}
      />

      {/* Shortcuts Modal (?) */}
      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
};
