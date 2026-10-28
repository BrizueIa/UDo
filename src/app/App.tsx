import React, { useState } from 'react';
import { ViewFilter, SketchItem } from '../shared/types';
import { useThemeManager } from '../shared/hooks/useThemeManager';
import { useWorkspaceState } from '../shared/hooks/useWorkspaceState';
import { useTreeNavigation } from '../shared/hooks/useTreeNavigation';
import { useKeyboardShortcuts, ColumnIndex } from '../shared/hooks/useKeyboardShortcuts';
import { TopBar } from './TopBar';
import { SubjectsSidebar } from '../features/subjects/components/SubjectsSidebar';
import { FoldersList } from '../features/folders/components/FoldersList';
import { NoteDetailView } from '../features/note-sheet/components/NoteDetailView';
import { FloatingWidget } from '../features/floating-widget/components/FloatingWidget';
import { ImageAnnotatorModal } from '../features/canvas-editor/components/ImageAnnotatorModal';
import { CommandPalette } from '../features/search-palette/components/CommandPalette';
import { ShortcutsModal } from '../shared/ui/ShortcutsModal';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const App: React.FC = () => {
  const { t, i18n } = useTranslation();

  // State slices from workspace hook
  const {
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

  // Theme Manager Hook
  const {
    currentTheme,
    setCurrentTheme,
    currentAccent,
    setCurrentAccent,
    customThemes,
    handleImportCustomTheme,
    handleDeleteCustomTheme,
  } = useThemeManager();

  // Tree Navigation Hook in Column 2 (folders & notes)
  const {
    handleVerticalNavigate,
    handleHorizontalNavigate,
    handleEnterTreeItem,
  } = useTreeNavigation({
    activeColumn,
    subjects,
    selectedSubjectId,
    currentSubjectFolders,
    notes,
    searchQuery,
    filter,
    activeTagFilter,
    selectedFolderId,
    selectedNoteId,
    setSelectedSubjectId,
    setSelectedFolderId,
    setSelectedNoteId,
    handleToggleFolderExpand,
    setActiveColumn,
  });

  const handleOpenSearchPalette = (initialQuery?: string) => {
    setSearchPaletteInitialQuery(initialQuery || '');
    setIsSearchPaletteOpen(true);
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
      handleCreateNote(selectedFolderId);
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
    onNavigateHorizontal: handleHorizontalNavigate,
    onEnterTreeItem: handleEnterTreeItem,
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
            selectedFolderId={selectedFolderId}
            selectedNoteId={selectedNoteId}
            filter={filter}
            searchQuery={searchQuery}
            activeTagFilter={activeTagFilter}
            isFocused={activeColumn === 2}
            onClearTagFilter={() => setActiveTagFilter(null)}
            onSelectFolder={(id) => {
              setSelectedFolderId(id);
              setActiveColumn(2);
            }}
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
                setActiveColumn(3);
              }}
              onCreateNoteWithTitle={(title) => {
                handleCreateNote(selectedFolderId, title);
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
            <div className="flex-1 flex flex-col items-center justify-center text-sm text-theme-muted p-8 text-center space-y-3">
              <p className="text-sm font-medium">{t('folders.noNotes')}</p>
              <button
                type="button"
                onClick={() => {
                  handleCreateNote(selectedFolderId);
                  setActiveColumn(3);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-theme-accent text-white text-xs font-semibold hover:bg-theme-accent-hover transition-colors shadow-sm cursor-pointer"
              >
                <Plus size={13} />
                <span>{t('folders.addNote')} (Ctrl+N)</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Always-on-Top Floating Widget Mode */}
      {isWidgetMode && (
        <FloatingWidget
          notes={notes}
          onToggleComplete={handleToggleNoteComplete}
          onQuickAddNote={(title) => handleCreateNote(selectedFolderId, title)}
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
