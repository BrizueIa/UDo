import React, { useState, useCallback, useEffect } from 'react';
import { ViewFilter, SketchItem } from '../shared/types';
import { useThemeManager } from '../shared/hooks/useThemeManager';
import { useWorkspaceState } from '../shared/hooks/useWorkspaceState';
import { useTreeNavigation } from '../shared/hooks/useTreeNavigation';
import { useKeyboardShortcuts, ColumnIndex } from '../shared/hooks/useKeyboardShortcuts';
import { useFocusTimer } from '../shared/hooks/useFocusTimer';
import { useTrayEvents } from '../shared/hooks/useTrayEvents';
import { useSidebarCollapse } from '../shared/hooks/useSidebarCollapse';
import { useAudioState } from '../shared/hooks/useAudioState';
import { useAppModalState } from './useAppModalState';
import { useVaultState } from '../features/private-vault/hooks/useVaultState';
import { api } from '../shared/api/ipc';
import {
  playTaskCompleteSound,
  playNoteCreatedSound,
} from '../shared/utils/soundEffects';
import { TopBar } from './TopBar';
import { SubjectsSidebar } from '../features/subjects/components/SubjectsSidebar';
import { FoldersList } from '../features/folders/components/FoldersList';
import { NoteDetailView } from '../features/note-sheet/components/NoteDetailView';
import { EmptyNoteView } from '../features/note-sheet/components/EmptyNoteView';
import { AppWidgetView } from './AppWidgetView';
import { AppModals } from './AppModals';
import { useTranslation } from 'react-i18next';

export const App: React.FC = () => {
  const { t, i18n } = useTranslation();

  const {
    subjects, folders, notes, selectedSubjectId, selectedFolderId, selectedNoteId, activeTagFilter,
    currentSubject, currentSubjectFolders, currentNote, currentFolder,
    setSelectedSubjectId, setSelectedFolderId, setSelectedNoteId, setActiveTagFilter,
    handleUpdateNote, handleToggleNoteComplete, handleDeleteNote, handleCreateNote,
    handleMoveNoteToFolder, handleReorderOrMoveNote, handleReorderFolder,
    handleMoveNoteToSubject, handleMoveFolderToSubject, handleConvertFolderToSubject,
    handleAddFolder, handleUpdateFolder, handleDeleteFolder, handleToggleFolderExpand,
    handleAddSubject, handleUpdateSubject, handleDeleteSubject, getSubjectNoteCount,
    handleWorkspaceUndo, handleWorkspaceRedo, reloadWorkspaceData,
    handleBatchDeleteNotes, handleBatchToggleCompleteNotes, handleBatchMoveNotesToFolder,
    handleToggleSubjectPrivate, handleDuplicateNote,
  } = useWorkspaceState();

  const vault = useVaultState();

  useEffect(() => {
    if (!vault.isVaultUnlocked) {
      const selectedSub = subjects.find((s) => s.id === selectedSubjectId);
      if (selectedSub?.isPrivate) {
        const firstPublic = subjects.find((s) => !s.isPrivate);
        if (firstPublic) setSelectedSubjectId(firstPublic.id);
      }
    }
  }, [vault.isVaultUnlocked, subjects, selectedSubjectId, setSelectedSubjectId]);

  const [filter, setFilter] = useState<ViewFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeColumn, setActiveColumn] = useState<ColumnIndex>(2);
  const [isWidgetMode, setIsWidgetMode] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);

  const { isSidebarCollapsed, isFoldersCollapsed, toggleSidebar, toggleFolders } = useSidebarCollapse();
  const { soundMuted, soundVolume, handleToggleAudioMute, handleVolumeChange } = useAudioState();
  const modalState = useAppModalState();

  const [showBreadcrumbs, setShowBreadcrumbs] = useState<boolean>(
    () => localStorage.getItem('udo_show_breadcrumbs') !== 'false'
  );
  const handleToggleBreadcrumbs = (show: boolean) => {
    setShowBreadcrumbs(show);
    localStorage.setItem('udo_show_breadcrumbs', String(show));
  };

  const noteSubject = subjects.find((s) => s.id === currentNote?.subjectId);
  const noteFolder = folders.find((f) => f.id === currentNote?.folderId);
  const handleRevealLocation = () => {
    if (!currentNote) return;
    setSelectedSubjectId(currentNote.subjectId);
    setSelectedFolderId(currentNote.folderId);
    handleToggleFolderExpand(currentNote.folderId);
  };

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

  const focusTimer = useFocusTimer({ onSprintCompleted: handleSprintCompleted });

  const handleToggleWidgetMode = (explicitVal?: boolean) => {
    setIsWidgetMode((prev) => {
      const next = typeof explicitVal === 'boolean' ? explicitVal : !prev;
      api.toggleWidgetMode(next);
      if (!next) setIsZenMode(false);
      return next;
    });
  };

  useTrayEvents({
    onToggleWidget: () => handleToggleWidgetMode(),
    onQuickAdd: () => modalState.setIsQuickAddOpen(true),
  });

  const {
    currentTheme, setCurrentTheme, currentAccent, setCurrentAccent,
    customThemes, handleImportCustomTheme, handleDeleteCustomTheme,
  } = useThemeManager();

  const { handleVerticalNavigate, handleHorizontalNavigate, handleEnterTreeItem } =
    useTreeNavigation({
      activeColumn, subjects, selectedSubjectId, currentSubjectFolders, notes,
      searchQuery, filter, activeTagFilter, selectedFolderId, selectedNoteId,
      setSelectedSubjectId, setSelectedFolderId, setSelectedNoteId,
      handleToggleFolderExpand, setActiveColumn,
    });

  const handleEscape = () => {
    if (modalState.handleEscapeModals()) return;
    if (activeTagFilter) setActiveTagFilter(null);
    else if (searchQuery) setSearchQuery('');
    else if (isZenMode) setIsZenMode(false);
  };

  const handleToggleNoteCompleteWithSound = (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (target && !target.isCompleted) playTaskCompleteSound();
    handleToggleNoteComplete(id);
  };

  const handleCreateNewNote = useCallback(
    (folderId = selectedFolderId, title?: string, subjectId?: string) => {
      handleCreateNote(folderId, title, subjectId);
      playNoteCreatedSound();
      setActiveColumn(3);
    },
    [selectedFolderId, handleCreateNote]
  );

  const handleSaveSketch = useCallback((updatedSketch: SketchItem) => {
    if (!currentNote) return;
    const exists = currentNote.sketches.some((s) => s.id === updatedSketch.id);
    const newSketches = exists
      ? currentNote.sketches.map((s) => (s.id === updatedSketch.id ? updatedSketch : s))
      : [...currentNote.sketches, updatedSketch];
    handleUpdateNote({ ...currentNote, sketches: newSketches });
    modalState.setActiveSketch(null);
  }, [currentNote, handleUpdateNote, modalState]);

  const handleQuickAddSave = (title: string, folderId: string, subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedFolderId(folderId);
    handleCreateNewNote(folderId, title, subjectId);
  };

  useKeyboardShortcuts({
    onToggleSearchPalette: () => {
      modalState.setSearchPaletteInitialQuery(searchQuery);
      modalState.setIsSearchPaletteOpen((prev) => !prev);
    },
    onToggleQuickAdd: () => modalState.setIsQuickAddOpen((prev) => !prev),
    onToggleWidgetMode: handleToggleWidgetMode,
    onToggleZenMode: () => setIsZenMode((prev) => !prev),
    onToggleSidebar: toggleSidebar,
    onToggleFolders: toggleFolders,
    onToggleShortcutsModal: () => modalState.setIsShortcutsModalOpen((prev) => !prev),
    onCreateNote: () => handleCreateNewNote(),
    onCreateFolder: () => handleAddFolder(`${t('folders.addFolder')} ${currentSubjectFolders.length + 1}`),
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
    onUndo: handleWorkspaceUndo,
    onRedo: handleWorkspaceRedo,
    onEscape: handleEscape,
  });

  if (isWidgetMode) {
    return (
      <AppWidgetView
        notes={notes}
        subjects={subjects}
        folders={folders}
        selectedSubjectId={selectedSubjectId}
        selectedFolderId={selectedFolderId}
        isVaultUnlocked={vault.isVaultUnlocked}
        timer={focusTimer}
        onSelectSubject={setSelectedSubjectId}
        onSelectFolder={setSelectedFolderId}
        onToggleComplete={handleToggleNoteCompleteWithSound}
        onAddFolder={handleAddFolder}
        onCreateNewNote={handleCreateNewNote}
        onOpenNoteInFullApp={(noteId, subjectId, folderId) => {
          setSelectedSubjectId(subjectId);
          setSelectedFolderId(folderId);
          setSelectedNoteId(noteId);
          handleToggleWidgetMode(false);
          setActiveColumn(3);
        }}
        onRestoreFullApp={() => handleToggleWidgetMode(false)}
      />
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
        isSidebarCollapsed={isSidebarCollapsed}
        isFoldersCollapsed={isFoldersCollapsed}
        isZenMode={isZenMode}
        onVolumeChange={handleVolumeChange}
        onSearchChange={setSearchQuery}
        onOpenSearchPalette={(q) => { modalState.setSearchPaletteInitialQuery(q || ''); modalState.setIsSearchPaletteOpen(true); }}
        onFilterChange={setFilter}
        onSelectTheme={setCurrentTheme}
        onSelectAccent={setCurrentAccent}
        onImportCustomTheme={handleImportCustomTheme}
        onDeleteCustomTheme={handleDeleteCustomTheme}
        onToggleLanguage={() => i18n.changeLanguage(i18n.language.startsWith('es') ? 'en' : 'es')}
        onToggleShortcutsModal={() => modalState.setIsShortcutsModalOpen(true)}
        onToggleWidgetMode={handleToggleWidgetMode}
        onToggleAudioMute={handleToggleAudioMute}
        onToggleSidebar={toggleSidebar}
        onToggleFolders={toggleFolders}
        onToggleZenMode={() => setIsZenMode((p) => !p)}
        onOpenTimerModal={() => modalState.setIsTimerModalOpen(true)}
        showBreadcrumbs={showBreadcrumbs}
        onToggleBreadcrumbs={handleToggleBreadcrumbs}
        hasVaultPin={vault.hasPin}
        isVaultUnlocked={vault.isVaultUnlocked}
        onOpenPinSetup={vault.openUnlockOrSetup}
        onOpenPinChange={vault.openChangePin}
        onLockVault={vault.lockVault}
        onWorkspaceReloaded={reloadWorkspaceData}
      />

      <main className="flex-1 flex overflow-hidden">
        {!isZenMode && !isSidebarCollapsed && (
          <SubjectsSidebar
            subjects={subjects}
            folders={folders}
            selectedSubjectId={selectedSubjectId}
            activeNoteSubjectId={currentNote?.subjectId}
            isFocused={activeColumn === 1}
            isVaultUnlocked={vault.isVaultUnlocked}
            onToggleVault={vault.handleToggleVault}
            onOpenTrash={() => modalState.setIsTrashModalOpen(true)}
            onToggleSubjectPrivate={handleToggleSubjectPrivate}
            onAddFolderToSubject={(subjId) => handleAddFolder(t('folders.addFolder'), subjId)}
            onSelectSubject={(id) => { setSelectedSubjectId(id); setActiveColumn(1); }}
            onAddSubject={handleAddSubject}
            onUpdateSubject={handleUpdateSubject}
            onDeleteSubject={handleDeleteSubject}
            getSubjectNoteCount={getSubjectNoteCount}
            onMoveNoteToFolder={handleMoveNoteToFolder}
            onMoveNoteToSubject={handleMoveNoteToSubject}
            onMoveFolderToSubject={handleMoveFolderToSubject}
            onConvertFolderToSubject={handleConvertFolderToSubject}
          />
        )}

        {!isZenMode && !isFoldersCollapsed && (
          <FoldersList
            currentSubject={currentSubject}
            folders={currentSubjectFolders}
            notes={notes}
            selectedFolderId={selectedFolderId}
            selectedNoteId={selectedNoteId}
            activeNoteFolderId={currentNote?.folderId}
            filter={filter}
            searchQuery={searchQuery}
            activeTagFilter={activeTagFilter}
            isFocused={activeColumn === 2}
            onClearTagFilter={() => setActiveTagFilter(null)}
            onSelectFolder={(id) => { setSelectedFolderId(id); setActiveColumn(2); }}
            onSelectNote={(id) => { setSelectedNoteId(id); setActiveColumn(2); }}
            onToggleNoteComplete={handleToggleNoteCompleteWithSound}
            onToggleFolderExpand={handleToggleFolderExpand}
            onAddFolder={handleAddFolder}
            onUpdateFolder={handleUpdateFolder}
            onDeleteFolder={handleDeleteFolder}
            onAddNote={(folderId) => handleCreateNewNote(folderId)}
            onMoveNoteToFolder={handleMoveNoteToFolder}
            onReorderOrMoveNote={handleReorderOrMoveNote}
            onReorderFolder={handleReorderFolder}
            onBatchDeleteNotes={handleBatchDeleteNotes}
            onBatchToggleCompleteNotes={handleBatchToggleCompleteNotes}
            onBatchMoveNotesToFolder={handleBatchMoveNotesToFolder}
            onDuplicateNote={handleDuplicateNote}
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
              key={currentNote.id}
              note={currentNote}
              notes={notes}
              folderName={noteFolder?.name || currentFolder?.name || 'Notes'}
              folders={currentSubjectFolders}
              subjectName={noteSubject?.name}
              subjectColor={noteSubject?.color}
              onRevealLocation={handleRevealLocation}
              showBreadcrumbs={showBreadcrumbs}
              activeTagFilter={activeTagFilter}
              activeTimerFormatted={
                (focusTimer.isRunning || focusTimer.isPaused) &&
                focusTimer.noteId === currentNote.id
                  ? focusTimer.formattedTime
                  : undefined
              }
              isTimerRunning={focusTimer.isRunning && focusTimer.noteId === currentNote.id}
              onOpenFocusTimer={() => modalState.setIsTimerModalOpen(true)}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
              onSelectNote={(noteId, subjectId) => { setSelectedSubjectId(subjectId); setSelectedNoteId(noteId); setActiveColumn(3); }}
              onCreateNoteWithTitle={(title) => handleCreateNewNote(selectedFolderId, title)}
              onSelectTagFilter={(tag) => setActiveTagFilter(tag)}
              onOpenSketchAnnotator={(sketch) => modalState.setActiveSketch(sketch)}
              onOpenWhiteboard={() => modalState.setActiveSketch({
                id: `sketch-${Date.now()}`,
                title: t('note.whiteboardDrawing'),
                dataUrl: '',
                createdAt: new Date().toISOString(),
              })}
              onWorkspaceUndo={handleWorkspaceUndo}
              onWorkspaceRedo={handleWorkspaceRedo}
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
        modalState={modalState}
        vault={vault}
        focusTimer={focusTimer}
        onSaveSketch={handleSaveSketch}
        onSelectNoteFromPalette={(noteId, subjectId) => {
          setSelectedSubjectId(subjectId);
          setSelectedNoteId(noteId);
          setActiveColumn(3);
        }}
        onQuickAddSave={handleQuickAddSave}
        onNotesRestored={reloadWorkspaceData}
      />
    </div>
  );
};
