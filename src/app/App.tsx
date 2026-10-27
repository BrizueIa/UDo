import React, { useState } from 'react';
import { ViewFilter, SketchItem } from '../shared/types';
import { useThemeManager } from '../shared/hooks/useThemeManager';
import { useWorkspaceState } from '../shared/hooks/useWorkspaceState';
import { useKeyboardShortcuts, ColumnIndex } from '../shared/hooks/useKeyboardShortcuts';
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

  // State slices
  const {
    subjects,
    folders,
    notes,
    selectedSubjectId,
    selectedNoteId,
    activeTagFilter,
    currentSubject,
    currentSubjectFolders,
    currentNote,
    currentFolder,
    setSelectedSubjectId,
    setSelectedNoteId,
    setActiveTagFilter,
    handleUpdateNote,
    handleToggleNoteComplete,
    handleDeleteNote,
    handleCreateNote,
    handleAddFolder,
    handleUpdateFolder,
    handleDeleteFolder,
    handleToggleFolderExpand,
    handleAddSubject,
    handleUpdateSubject,
    handleDeleteSubject,
    getSubjectNoteCount,
  } = useWorkspaceState();

  const [filter, setFilter] = useState<ViewFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchPaletteInitialQuery, setSearchPaletteInitialQuery] = useState<string>('');
  const [activeColumn, setActiveColumn] = useState<ColumnIndex>(2);

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

  const handleOpenSearchPalette = (initialQuery?: string) => {
    setSearchPaletteInitialQuery(initialQuery || '');
    setIsSearchPaletteOpen(true);
  };

  // Keyboard vertical navigation (j/k or ArrowDown/ArrowUp) (FR-08)
  const handleVerticalNavigate = (direction: 'up' | 'down') => {
    if (activeColumn === 1) {
      const curIdx = subjects.findIndex((s) => s.id === selectedSubjectId);
      const nextIdx =
        direction === 'down'
          ? Math.min(subjects.length - 1, curIdx + 1)
          : Math.max(0, curIdx - 1);
      if (subjects[nextIdx]) {
        setSelectedSubjectId(subjects[nextIdx].id);
      }
    } else if (activeColumn === 2) {
      const visibleNotes = notes.filter((n) => {
        if (!currentSubjectFolders.some((f) => f.id === n.folderId)) return false;
        if (filter === 'pending' && n.isCompleted) return false;
        if (filter === 'completed' && !n.isCompleted) return false;
        if (activeTagFilter && !n.tags.includes(activeTagFilter)) return false;
        return true;
      });
      const curIdx = visibleNotes.findIndex((n) => n.id === selectedNoteId);
      const nextIdx =
        direction === 'down'
          ? Math.min(visibleNotes.length - 1, curIdx + 1)
          : Math.max(0, curIdx - 1);
      if (visibleNotes[nextIdx]) {
        setSelectedNoteId(visibleNotes[nextIdx].id);
      }
    }
  };

  // Global Escape handler (FR-08)
  const handleEscape = () => {
    if (isSearchPaletteOpen) {
      setIsSearchPaletteOpen(false);
    } else if (isShortcutsModalOpen) {
      setIsShortcutsModalOpen(false);
    } else if (activeSketch) {
      setActiveSketch(null);
    } else if (activeTagFilter) {
      setActiveTagFilter(null);
    } else if (searchQuery) {
      setSearchQuery('');
    }
  };

  // Keyboard Shortcuts Hook (FR-08)
  useKeyboardShortcuts({
    onToggleSearchPalette: () => {
      setSearchPaletteInitialQuery(searchQuery);
      setIsSearchPaletteOpen((prev) => !prev);
    },
    onToggleWidgetMode: () => setIsWidgetMode((prev) => !prev),
    onToggleZenMode: () => setIsZenMode((prev) => !prev),
    onToggleShortcutsModal: () => setIsShortcutsModalOpen((prev) => !prev),
    onCreateNote: () => {
      handleCreateNote();
      setActiveColumn(3);
    },
    onCreateFolder: () =>
      handleAddFolder(`${t('folders.addFolder')} ${currentSubjectFolders.length + 1}`),
    onToggleCurrentNoteComplete: () => {
      if (selectedNoteId) {
        handleToggleNoteComplete(selectedNoteId);
      }
    },
    onFocusMarkdownEditor: () => setActiveColumn(3),
    onSetActiveColumn: setActiveColumn,
    onCycleColumn: (direction) => {
      setActiveColumn((prev) =>
        direction === 'next'
          ? ((prev % 3 + 1) as ColumnIndex)
          : (((prev - 2 + 3) % 3 + 1) as ColumnIndex)
      );
    },
    onNavigateVertical: handleVerticalNavigate,
    onEscape: handleEscape,
  });

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
        {/* Column 1: Subjects Sidebar */}
        {!isZenMode && (
          <SubjectsSidebar
            subjects={subjects}
            selectedSubjectId={selectedSubjectId}
            isFocused={activeColumn === 1}
            onSelectSubject={(id) => {
              setSelectedSubjectId(id);
              setActiveColumn(1);
            }}
            onAddSubject={handleAddSubject}
            onUpdateSubject={handleUpdateSubject}
            onDeleteSubject={handleDeleteSubject}
            getSubjectNoteCount={getSubjectNoteCount}
          />
        )}

        {/* Column 2: Folders & Tasks List */}
        {!isZenMode && (
          <FoldersList
            currentSubject={currentSubject}
            folders={currentSubjectFolders}
            notes={notes}
            selectedNoteId={selectedNoteId}
            filter={filter}
            searchQuery={searchQuery}
            activeTagFilter={activeTagFilter}
            isFocused={activeColumn === 2}
            onClearTagFilter={() => setActiveTagFilter(null)}
            onSelectNote={(id) => {
              setSelectedNoteId(id);
              setActiveColumn(2);
            }}
            onToggleNoteComplete={handleToggleNoteComplete}
            onToggleFolderExpand={handleToggleFolderExpand}
            onAddFolder={handleAddFolder}
            onUpdateFolder={handleUpdateFolder}
            onDeleteFolder={handleDeleteFolder}
            onAddNote={(folderId) => {
              handleCreateNote(folderId);
              setActiveColumn(3);
            }}
          />
        )}

        {/* Column 3: Note Detail View */}
        <div
          onClick={() => setActiveColumn(3)}
          className={`flex-1 flex overflow-hidden transition-all ${
            activeColumn === 3 ? 'ring-1 ring-inset ring-theme-accent/20' : ''
          }`}
        >
          {currentNote ? (
            <NoteDetailView
              note={currentNote}
              notes={notes}
              folderName={currentFolder?.name || 'Notes'}
              folders={currentSubjectFolders}
              activeTagFilter={activeTagFilter}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
              onSelectNote={(noteId, subjectId) => {
                setSelectedSubjectId(subjectId);
                setSelectedNoteId(noteId);
              }}
              onCreateNoteWithTitle={(title) => {
                handleCreateNote(undefined, title);
                setActiveColumn(3);
              }}
              onSelectTagFilter={(tag) => setActiveTagFilter(tag)}
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
        </div>
      </main>

      {/* Always-on-Top Floating Widget Mode */}
      {isWidgetMode && (
        <FloatingWidget
          notes={notes}
          onToggleComplete={handleToggleNoteComplete}
          onQuickAddNote={(title) => handleCreateNote(undefined, title)}
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

      {/* Command Palette (Ctrl+K or /) (FR-05) */}
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
          setActiveColumn(3);
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
