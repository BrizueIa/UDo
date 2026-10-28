import React, { useState, useCallback } from 'react';
import { ViewFilter, SketchItem } from '../shared/types';
import { useThemeManager } from '../shared/hooks/useThemeManager';
import { useWorkspaceState } from '../shared/hooks/useWorkspaceState';
import { useTreeNavigation } from '../shared/hooks/useTreeNavigation';
import { useKeyboardShortcuts, ColumnIndex } from '../shared/hooks/useKeyboardShortcuts';
import { useFocusTimer } from '../shared/hooks/useFocusTimer';
import { useTrayEvents } from '../shared/hooks/useTrayEvents';
import { api } from '../shared/api/ipc';
import {
  playTaskCompleteSound,
  playNoteCreatedSound,
  isAudioMuted,
  toggleAudioMute,
  getAudioVolume,
  setAudioVolume,
  setAudioMuted,
} from '../shared/utils/soundEffects';
import { TopBar } from './TopBar';
import { SubjectsSidebar } from '../features/subjects/components/SubjectsSidebar';
import { FoldersList } from '../features/folders/components/FoldersList';
import { NoteDetailView } from '../features/note-sheet/components/NoteDetailView';
import { EmptyNoteView } from '../features/note-sheet/components/EmptyNoteView';
import { FloatingWidget } from '../features/floating-widget/components/FloatingWidget';
import { AppModals } from './AppModals';
import { useTranslation } from 'react-i18next';

export const App: React.FC = () => {
  const { t, i18n } = useTranslation();

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
  } = useWorkspaceState();

  const [filter, setFilter] = useState<ViewFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchPaletteInitialQuery, setSearchPaletteInitialQuery] = useState('');
  const [activeColumn, setActiveColumn] = useState<ColumnIndex>(2);

  const [isWidgetMode, setIsWidgetMode] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isSearchPaletteOpen, setIsSearchPaletteOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [activeSketch, setActiveSketch] = useState<SketchItem | null>(null);
  const [soundMuted, setSoundMuted] = useState(() => isAudioMuted());
  const [soundVolume, setSoundVolume] = useState(() => getAudioVolume());

  // Focus Timer Hook with persistent focusMinutes recording (FR-14)
  const handleSprintCompleted = useCallback(
    (noteId: string, secondsSpent: number) => {
      const minutesSpent = Math.max(1, Math.round(secondsSpent / 60));
      const targetNote = notes.find((n) => n.id === noteId);
      if (targetNote) {
        handleUpdateNote({
          ...targetNote,
          focusMinutes: (targetNote.focusMinutes || 0) + minutesSpent,
        });
      }
    },
    [notes, handleUpdateNote]
  );

  const focusTimer = useFocusTimer({
    onSprintCompleted: handleSprintCompleted,
  });

  const handleToggleAudioMute = () => {
    setSoundMuted(toggleAudioMute());
  };

  const handleVolumeChange = (vol: number) => {
    setAudioVolume(vol);
    setSoundVolume(vol);
    if (soundMuted && vol > 0) {
      setAudioMuted(false);
      setSoundMuted(false);
    }
  };

  const handleToggleWidgetMode = (explicitVal?: boolean) => {
    setIsWidgetMode((prev) => {
      const next = typeof explicitVal === 'boolean' ? explicitVal : !prev;
      api.toggleWidgetMode(next);
      return next;
    });
  };

  useTrayEvents({
    onToggleWidget: () => handleToggleWidgetMode(),
    onQuickAdd: () => setIsQuickAddOpen(true),
  });

  const {
    currentTheme,
    setCurrentTheme,
    currentAccent,
    setCurrentAccent,
    customThemes,
    handleImportCustomTheme,
    handleDeleteCustomTheme,
  } = useThemeManager();

  const { handleVerticalNavigate, handleHorizontalNavigate, handleEnterTreeItem } =
    useTreeNavigation({
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

  const handleEscape = () => {
    if (isQuickAddOpen) setIsQuickAddOpen(false);
    else if (isTimerModalOpen) setIsTimerModalOpen(false);
    else if (isSearchPaletteOpen) setIsSearchPaletteOpen(false);
    else if (isShortcutsModalOpen) setIsShortcutsModalOpen(false);
    else if (activeSketch) setActiveSketch(null);
    else if (activeTagFilter) setActiveTagFilter(null);
    else if (searchQuery) setSearchQuery('');
  };

  const handleToggleNoteCompleteWithSound = (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (target && !target.isCompleted) playTaskCompleteSound();
    handleToggleNoteComplete(id);
  };

  const handleCreateNewNote = useCallback((folderId = selectedFolderId, title?: string) => {
    handleCreateNote(folderId, title);
    playNoteCreatedSound();
    setActiveColumn(3);
  }, [selectedFolderId, handleCreateNote]);

  const handleSaveSketch = useCallback((updatedSketch: SketchItem) => {
    if (!currentNote) return;
    const exists = currentNote.sketches.some((s) => s.id === updatedSketch.id);
    const newSketches = exists
      ? currentNote.sketches.map((s) => (s.id === updatedSketch.id ? updatedSketch : s))
      : [...currentNote.sketches, updatedSketch];
    handleUpdateNote({
      ...currentNote,
      sketches: newSketches,
    });
    setActiveSketch(null);
  }, [currentNote, handleUpdateNote]);

  const handleQuickAddSave = (title: string, folderId: string, subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedFolderId(folderId);
    handleCreateNewNote(folderId, title);
  };

  useKeyboardShortcuts({
    onToggleSearchPalette: () => {
      setSearchPaletteInitialQuery(searchQuery);
      setIsSearchPaletteOpen((prev) => !prev);
    },
    onToggleQuickAdd: () => setIsQuickAddOpen((prev) => !prev),
    onToggleWidgetMode: handleToggleWidgetMode,
    onToggleZenMode: () => setIsZenMode((prev) => !prev),
    onToggleShortcutsModal: () => setIsShortcutsModalOpen((prev) => !prev),
    onCreateNote: () => handleCreateNewNote(),
    onCreateFolder: () =>
      handleAddFolder(`${t('folders.addFolder')} ${currentSubjectFolders.length + 1}`),
    onToggleCurrentNoteComplete: () => {
      if (selectedNoteId) handleToggleNoteCompleteWithSound(selectedNoteId);
    },
    onFocusMarkdownEditor: () => setActiveColumn(3),
    onSetActiveColumn: setActiveColumn,
    onCycleColumn: (dir) =>
      setActiveColumn((p) =>
        dir === 'next' ? ((p % 3 + 1) as ColumnIndex) : (((p - 2 + 3) % 3 + 1) as ColumnIndex)
      ),
    onNavigateVertical: handleVerticalNavigate,
    onNavigateHorizontal: handleHorizontalNavigate,
    onEnterTreeItem: handleEnterTreeItem,
    onEscape: handleEscape,
  });

  if (isWidgetMode) {
    return (
      <div className="h-screen w-screen bg-transparent text-theme-text font-sans antialiased overflow-hidden flex flex-col">
        <FloatingWidget
          notes={notes}
          folders={folders}
          defaultFolderId={selectedFolderId}
          timer={focusTimer}
          onToggleComplete={handleToggleNoteCompleteWithSound}
          onQuickAddNote={(title, folderId) => {
            const target = folderId || selectedFolderId;
            handleCreateNote(target, title);
            playNoteCreatedSound();
          }}
          onUpdateNote={handleUpdateNote}
          onRestoreFullApp={() => handleToggleWidgetMode(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-theme-base text-theme-text font-sans antialiased">
      <TopBar
        currentSubjectName={currentSubject?.name}
        searchQuery={searchQuery}
        filter={filter}
        pendingCount={notes.filter((n) => !n.isCompleted).length}
        completedCount={notes.filter((n) => n.isCompleted).length}
        totalCount={notes.length}
        currentTheme={currentTheme}
        currentAccent={currentAccent}
        customThemes={customThemes}
        timer={focusTimer}
        isAudioMuted={soundMuted}
        audioVolume={soundVolume}
        onVolumeChange={handleVolumeChange}
        onSearchChange={setSearchQuery}
        onOpenSearchPalette={(q) => {
          setSearchPaletteInitialQuery(q || '');
          setIsSearchPaletteOpen(true);
        }}
        onFilterChange={setFilter}
        onSelectTheme={setCurrentTheme}
        onSelectAccent={setCurrentAccent}
        onImportCustomTheme={handleImportCustomTheme}
        onDeleteCustomTheme={handleDeleteCustomTheme}
        onToggleLanguage={() => i18n.changeLanguage(i18n.language.startsWith('es') ? 'en' : 'es')}
        onToggleShortcutsModal={() => setIsShortcutsModalOpen(true)}
        onToggleWidgetMode={handleToggleWidgetMode}
        onToggleAudioMute={handleToggleAudioMute}
        onOpenTimerModal={() => setIsTimerModalOpen(true)}
      />

      <main className="flex-1 flex overflow-hidden">
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
            onMoveNoteToSubject={handleMoveNoteToSubject}
          />
        )}

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
            onToggleNoteComplete={handleToggleNoteCompleteWithSound}
            onToggleFolderExpand={handleToggleFolderExpand}
            onAddFolder={handleAddFolder}
            onUpdateFolder={handleUpdateFolder}
            onDeleteFolder={handleDeleteFolder}
            onAddNote={(folderId) => handleCreateNewNote(folderId)}
            onMoveNoteToFolder={handleMoveNoteToFolder}
          />
        )}

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
              activeTimerFormatted={
                (focusTimer.isRunning || focusTimer.isPaused) &&
                focusTimer.noteId === currentNote.id
                  ? focusTimer.formattedTime
                  : undefined
              }
              isTimerRunning={focusTimer.isRunning && focusTimer.noteId === currentNote.id}
              onOpenFocusTimer={() => setIsTimerModalOpen(true)}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
              onSelectNote={(noteId, subjectId) => {
                setSelectedSubjectId(subjectId);
                setSelectedNoteId(noteId);
                setActiveColumn(3);
              }}
              onCreateNoteWithTitle={(title) => handleCreateNewNote(selectedFolderId, title)}
              onSelectTagFilter={(tag) => setActiveTagFilter(tag)}
              onOpenSketchAnnotator={(sketch) => setActiveSketch(sketch)}
              onOpenWhiteboard={() => {
                setActiveSketch({
                  id: `sketch-${Date.now()}`,
                  title: t('note.whiteboardDrawing'),
                  dataUrl: '',
                  createdAt: new Date().toISOString(),
                });
              }}
            />
          ) : (
            <EmptyNoteView onCreateNote={() => handleCreateNewNote()} />
          )}
        </div>
      </main>

      <AppModals
        currentNote={currentNote}
        notes={notes}
        subjects={subjects}
        folders={folders}
        selectedSubjectId={selectedSubjectId}
        selectedFolderId={selectedFolderId}
        activeSketch={activeSketch}
        isSearchPaletteOpen={isSearchPaletteOpen}
        searchPaletteInitialQuery={searchPaletteInitialQuery}
        isQuickAddOpen={isQuickAddOpen}
        isTimerModalOpen={isTimerModalOpen}
        isShortcutsModalOpen={isShortcutsModalOpen}
        focusTimer={focusTimer}
        onCloseSketch={() => setActiveSketch(null)}
        onSaveSketch={handleSaveSketch}
        onCloseSearchPalette={() => setIsSearchPaletteOpen(false)}
        onSelectNoteFromPalette={(noteId, subjectId) => {
          setSelectedSubjectId(subjectId);
          setSelectedNoteId(noteId);
          setActiveColumn(3);
        }}
        onCloseQuickAdd={() => setIsQuickAddOpen(false)}
        onQuickAddSave={handleQuickAddSave}
        onCloseTimerModal={() => setIsTimerModalOpen(false)}
        onCloseShortcutsModal={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
};
