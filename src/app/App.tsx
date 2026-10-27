import React, { useState, useEffect } from 'react';
import {
  NoteItem,
  SubjectItem,
  FolderItem,
  ViewFilter,
  SketchItem,
} from '../shared/types';
import { useThemeManager } from '../shared/hooks/useThemeManager';
import { useKeyboardShortcuts } from '../shared/hooks/useKeyboardShortcuts';
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
  const { t, i18n } = useTranslation();

  // State
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');
  const [filter, setFilter] = useState<ViewFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchPaletteInitialQuery, setSearchPaletteInitialQuery] = useState<string>('');

  // Modals & Mode Toggles
  const [isWidgetMode, setIsWidgetMode] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isSearchPaletteOpen, setIsSearchPaletteOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [activeSketch, setActiveSketch] = useState<SketchItem | null>(null);

  // Modular Theme Manager Hook
  const {
    currentTheme,
    setCurrentTheme,
    currentAccent,
    setCurrentAccent,
    customThemes,
    handleImportCustomTheme,
    handleDeleteCustomTheme,
  } = useThemeManager();

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

  const handleCreateNote = (targetFolderId?: string) => {
    let folderId = targetFolderId;
    let subjectId = selectedSubjectId;

    if (!folderId) {
      const defaultFolder = currentSubjectFolders[0] || folders[0];
      if (defaultFolder) {
        folderId = defaultFolder.id;
        subjectId = defaultFolder.subjectId;
      } else {
        return;
      }
    }

    const newNote: NoteItem = {
      id: `note-${Date.now()}`,
      folderId,
      subjectId,
      title: '',
      content: '',
      isCompleted: false,
      isPinned: false,
      tags: [],
      links: [],
      sketches: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNotes((prev) => [newNote, ...prev]);
    setSelectedNoteId(newNote.id);
    api.saveNote(newNote);
  };

  const handleAddFolder = (name: string) => {
    if (!selectedSubjectId) return;
    const newFolder: FolderItem = {
      id: `folder-${Date.now()}`,
      subjectId: selectedSubjectId,
      name,
      isExpanded: true,
      order: currentSubjectFolders.length,
    };
    setFolders((prev) => [...prev, newFolder]);
    api.saveFolder(newFolder);
  };

  const handleUpdateFolder = (updatedFolder: FolderItem) => {
    setFolders((prev) => prev.map((f) => (f.id === updatedFolder.id ? updatedFolder : f)));
    api.saveFolder(updatedFolder);
  };

  const handleDeleteFolder = (id: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== id));
    setNotes((prev) => prev.filter((n) => n.folderId !== id));
    api.deleteFolder(id);
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
    setSubjects((prev) => [...prev, newSubject]);
    setSelectedSubjectId(newSubject.id);
    api.saveSubject(newSubject);
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

  const handleOpenSearchPalette = (initialQuery?: string) => {
    setSearchPaletteInitialQuery(initialQuery || '');
    setIsSearchPaletteOpen(true);
  };

  // Modular Keyboard Shortcuts Hook
  useKeyboardShortcuts({
    onToggleSearchPalette: () => {
      setSearchPaletteInitialQuery(searchQuery);
      setIsSearchPaletteOpen((prev) => !prev);
    },
    onToggleWidgetMode: () => setIsWidgetMode((prev) => !prev),
    onToggleZenMode: () => setIsZenMode((prev) => !prev),
    onToggleShortcutsModal: () => setIsShortcutsModalOpen((prev) => !prev),
    onCreateNote: handleCreateNote,
    onToggleCurrentNoteComplete: () => {
      if (selectedNoteId) {
        handleToggleNoteComplete(selectedNoteId);
      }
    },
  });

  const getSubjectNoteCount = (subjectId: string) => {
    return notes.filter((n) => n.subjectId === subjectId).length;
  };

  // Filter Counts
  const pendingCount = notes.filter((n) => !n.isCompleted).length;
  const completedCount = notes.filter((n) => n.isCompleted).length;
  const totalCount = notes.length;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-theme-base text-theme-text font-sans antialiased">
      {/* Frameless Window Top Navigation Bar */}
      <TopBar
        currentSubjectName={currentSubject?.name}
        searchQuery={searchQuery}
        filter={filter}
        pendingCount={pendingCount}
        completedCount={completedCount}
        totalCount={totalCount}
        currentTheme={currentTheme}
        currentAccent={currentAccent}
        customThemes={customThemes}
        onSearchChange={setSearchQuery}
        onOpenSearchPalette={handleOpenSearchPalette}
        onFilterChange={setFilter}
        onSelectTheme={setCurrentTheme}
        onSelectAccent={setCurrentAccent}
        onImportCustomTheme={handleImportCustomTheme}
        onDeleteCustomTheme={handleDeleteCustomTheme}
        onToggleLanguage={() => i18n.changeLanguage(i18n.language.startsWith('es') ? 'en' : 'es')}
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
            onUpdateSubject={handleUpdateSubject}
            onDeleteSubject={handleDeleteSubject}
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
            searchQuery={searchQuery}
            onSelectNote={setSelectedNoteId}
            onToggleNoteComplete={handleToggleNoteComplete}
            onToggleFolderExpand={handleToggleFolderExpand}
            onAddFolder={handleAddFolder}
            onUpdateFolder={handleUpdateFolder}
            onDeleteFolder={handleDeleteFolder}
            onAddNote={handleCreateNote}
          />
        )}

        {/* Column 3: Note Detail View */}
        {currentNote ? (
          <NoteDetailView
            note={currentNote}
            folderName={currentFolder?.name || 'Notes'}
            folders={currentSubjectFolders}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            onOpenSketchAnnotator={(sketch) => setActiveSketch(sketch)}
            onOpenWhiteboard={() => {
              const newSketch: SketchItem = {
                id: `sketch-${Date.now()}`,
                title: 'New Canvas Drawing',
                dataUrl: '',
                createdAt: new Date().toISOString(),
              };
              setActiveSketch(newSketch);
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-theme-muted">
            {t('folders.empty')}
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
              updatedAt: new Date().toISOString(),
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
        initialQuery={searchPaletteInitialQuery}
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
