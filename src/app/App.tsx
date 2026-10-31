import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ViewFilter, SketchItem, NoteItem, FolderItem } from '../shared/types';
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
import { playTaskCompleteSound, playNoteCreatedSound } from '../shared/utils/soundEffects';
import { TopBar } from './TopBar';
import { SubjectsSidebar } from '../features/subjects/components/SubjectsSidebar';
import { FoldersList } from '../features/folders/components/FoldersList';
import { SplitNoteWorkspace } from '../features/note-sheet/components/SplitNoteWorkspace';
import { AppWidgetView } from './AppWidgetView';
import { AppModals } from './AppModals';
import { useTranslation } from 'react-i18next';
import { useUpdateChecker } from '../shared/hooks/useUpdateChecker';
import { UpdateNotificationBanner } from '../shared/components/UpdateNotificationBanner';

export const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { appVersion, updateInfo, isChecking, checkForUpdates, dismissUpdate, openReleasePage } = useUpdateChecker();

  const {
    subjects, folders, notes, selectedSubjectId, selectedFolderId, selectedNoteId, activeTagFilter,
    currentSubject, currentSubjectFolders, currentNote,
    setSelectedSubjectId, setSelectedFolderId, setSelectedNoteId, setActiveTagFilter,
    handleUpdateNote, handleToggleNoteComplete, handleDeleteNote, handleCreateNote,
    handleMoveNoteToFolder, handleReorderOrMoveNote, handleReorderFolder,
    handleMoveNoteToSubject, handleMoveFolderToSubject, handleConvertFolderToSubject,
    handleAddFolder, handleUpdateFolder, handleDeleteFolder, handleToggleFolderExpand,
    handleAddSubject, handleUpdateSubject, handleDeleteSubject,
    handleWorkspaceUndo, handleWorkspaceRedo, reloadWorkspaceData,
    handleBatchDeleteNotes, handleBatchDeleteFolders, handleBatchToggleCompleteNotes, handleBatchMoveNotesToFolder,
    handleBatchMoveNotesToSubject, handleToggleSubjectPrivate, handleToggleFolderPrivate, handleToggleNotePrivate, handleDuplicateNote,
  } = useWorkspaceState();

  const vault = useVaultState();

  const isFolderItemPrivate = useCallback((fId?: string): boolean => {
    if (!fId) return false;
    const f = folders.find((folder) => folder.id === fId);
    if (!f) return false;
    if (f.isPrivate) return true;
    return subjects.some((s) => s.id === f.subjectId && s.isPrivate);
  }, [folders, subjects]);

  const isNoteItemPrivate = useCallback((note?: NoteItem): boolean => {
    if (!note) return false;
    if (note.isPrivate) return true;
    if (note.folderId && isFolderItemPrivate(note.folderId)) return true;
    return subjects.some((s) => s.id === note.subjectId && s.isPrivate);
  }, [isFolderItemPrivate, subjects]);

  const isCurrentNotePrivate = !vault.isVaultUnlocked && isNoteItemPrivate(currentNote);
  const effectiveCurrentNote = isCurrentNotePrivate ? undefined : currentNote;

  useEffect(() => {
    if (!vault.isVaultUnlocked) {
      const isSubPrivate = subjects.some((s) => s.id === selectedSubjectId && s.isPrivate);
      const isFoldPrivate = isFolderItemPrivate(selectedFolderId);
      const isNotePriv = notes.some((n) => n.id === selectedNoteId && isNoteItemPrivate(n));

      if (isSubPrivate || isFoldPrivate || isNotePriv) {
        const pubSubject = subjects.find((s) => !s.isPrivate);
        setSelectedSubjectId(pubSubject?.id || '');

        const pubFolders = folders.filter((f) => f.subjectId === pubSubject?.id && !f.isPrivate);
        setSelectedFolderId(pubFolders[0]?.id || '');

        const pubNotes = notes.filter((n) => n.subjectId === pubSubject?.id && !isNoteItemPrivate(n));
        setSelectedNoteId(pubNotes[0]?.id || '');
      }
    }
  }, [vault.isVaultUnlocked, subjects, folders, notes, selectedSubjectId, selectedFolderId, selectedNoteId, isFolderItemPrivate, isNoteItemPrivate, setSelectedSubjectId, setSelectedFolderId, setSelectedNoteId]);

  const visibleNotes = useMemo(() => {
    if (vault.isVaultUnlocked) return notes;
    return notes.filter((n) => !isNoteItemPrivate(n));
  }, [notes, vault.isVaultUnlocked, isNoteItemPrivate]);

  const pendingCount = useMemo(() => visibleNotes.filter((n) => !n.isCompleted).length, [visibleNotes]);
  const completedCount = useMemo(() => visibleNotes.filter((n) => n.isCompleted).length, [visibleNotes]);
  const totalCount = visibleNotes.length;

  const getVisibleSubjectNoteCount = useCallback((subjectId: string) => {
    return visibleNotes.filter((n) => n.subjectId === subjectId).length;
  }, [visibleNotes]);

  const handleToggleNotePrivateWithPin = useCallback((note: NoteItem) => {
    if (!vault.hasPin) {
      vault.openUnlockOrSetup();
      return;
    }
    handleToggleNotePrivate(note);
  }, [vault, handleToggleNotePrivate]);

  const handleToggleFolderPrivateWithPin = useCallback((folder: FolderItem) => {
    if (!vault.hasPin) {
      vault.openUnlockOrSetup();
      return;
    }
    handleToggleFolderPrivate(folder);
  }, [vault, handleToggleFolderPrivate]);

  const [filter, setFilter] = useState<ViewFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeColumn, setActiveColumn] = useState<ColumnIndex>(2);
  const [isWidgetMode, setIsWidgetMode] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [splitSecondaryNoteId, setSplitSecondaryNoteId] = useState<string | null>(null);

  const { isSidebarCollapsed, isFoldersCollapsed, setIsSidebarCollapsed, toggleSidebar, toggleFolders } = useSidebarCollapse();
  const { soundMuted, soundVolume, handleToggleAudioMute, handleVolumeChange } = useAudioState();
  const modalState = useAppModalState();

  const [showBreadcrumbs, setShowBreadcrumbs] = useState<boolean>(() => localStorage.getItem('udo_show_breadcrumbs') !== 'false');
  const handleToggleBreadcrumbs = (show: boolean) => {
    setShowBreadcrumbs(show);
    localStorage.setItem('udo_show_breadcrumbs', String(show));
  };

  const secondaryNote = notes.find((n) => n.id === splitSecondaryNoteId);

  const handleOpenInSplitView = useCallback((targetNoteId: string) => {
    if (!effectiveCurrentNote || effectiveCurrentNote.id === targetNoteId) {
      setSelectedNoteId(targetNoteId);
      return;
    }
    setSplitSecondaryNoteId(targetNoteId);
    setIsSidebarCollapsed(true);
    localStorage.setItem('udo:sidebar-collapsed', 'true');
  }, [effectiveCurrentNote, setSelectedNoteId, setIsSidebarCollapsed]);

  const handleCloseSplitView = useCallback((keepWhich: 'primary' | 'secondary' = 'primary') => {
    if (keepWhich === 'secondary' && splitSecondaryNoteId) setSelectedNoteId(splitSecondaryNoteId);
    setSplitSecondaryNoteId(null);
    setIsSidebarCollapsed(false);
    localStorage.setItem('udo:sidebar-collapsed', 'false');
  }, [splitSecondaryNoteId, setSelectedNoteId, setIsSidebarCollapsed]);

  const handleRevealLocation = (targetNote: NoteItem) => {
    setSelectedSubjectId(targetNote.subjectId);
    if (targetNote.folderId) {
      setSelectedFolderId(targetNote.folderId);
      handleToggleFolderExpand(targetNote.folderId);
    } else setSelectedFolderId('');
  };

  const handleSprintCompleted = useCallback((noteId: string, secondsSpent: number) => {
    const minutesSpent = Math.max(1, Math.round(secondsSpent / 60));
    const targetNote = notes.find((n) => n.id === noteId);
    if (targetNote) handleUpdateNote({ ...targetNote, focusMinutes: (targetNote.focusMinutes || 0) + minutesSpent });
  }, [notes, handleUpdateNote]);

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
    onRestoreFull: () => handleToggleWidgetMode(false),
  });

  const {
    currentTheme, setCurrentTheme, currentAccent, setCurrentAccent,
    customThemes, handleImportCustomTheme, handleDeleteCustomTheme,
  } = useThemeManager();

  const { handleVerticalNavigate, handleHorizontalNavigate, handleEnterTreeItem } = useTreeNavigation({
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

  const handleCreateNewNote = useCallback((folderId = selectedFolderId, title?: string, subjectId?: string) => {
    handleCreateNote(folderId, title, subjectId);
    playNoteCreatedSound();
    setActiveColumn(3);
  }, [selectedFolderId, handleCreateNote]);

  const handleSaveSketch = useCallback((updatedSketch: SketchItem) => {
    if (!effectiveCurrentNote) return;
    const exists = effectiveCurrentNote.sketches.some((s) => s.id === updatedSketch.id);
    const sketchWithPos: SketchItem = {
      ...updatedSketch,
      posX: updatedSketch.posX !== undefined ? updatedSketch.posX : 0,
      posY: updatedSketch.posY !== undefined ? updatedSketch.posY : effectiveCurrentNote.sketches.length * 180 + 40,
      zIndex: updatedSketch.zIndex || 10,
    };
    const newSketches = exists
      ? effectiveCurrentNote.sketches.map((s) => (s.id === updatedSketch.id ? sketchWithPos : s))
      : [...effectiveCurrentNote.sketches, sketchWithPos];
    const nextContent = exists
      ? effectiveCurrentNote.content
      : `${effectiveCurrentNote.content ? `${effectiveCurrentNote.content}\n` : '\n'}[embed:sketch:${updatedSketch.id}]\n`;
    handleUpdateNote({ ...effectiveCurrentNote, content: nextContent, sketches: newSketches });
    modalState.setActiveSketch(null);
  }, [effectiveCurrentNote, handleUpdateNote, modalState]);

  const handleQuickAddSave = (title: string, folderId: string, subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedFolderId(folderId);
    handleCreateNewNote(folderId, title, subjectId);
  };

  const handleAppUndo = useCallback(() => {
    if (activeColumn === 3 && effectiveCurrentNote) {
      const customEvent = new CustomEvent('udo-note-undo', { cancelable: true });
      window.dispatchEvent(customEvent);
      if (!customEvent.defaultPrevented) {
        handleWorkspaceUndo();
      }
    } else {
      handleWorkspaceUndo();
    }
  }, [activeColumn, effectiveCurrentNote, handleWorkspaceUndo]);

  const handleAppRedo = useCallback(() => {
    if (activeColumn === 3 && effectiveCurrentNote) {
      const customEvent = new CustomEvent('udo-note-redo', { cancelable: true });
      window.dispatchEvent(customEvent);
      if (!customEvent.defaultPrevented) {
        handleWorkspaceRedo();
      }
    } else {
      handleWorkspaceRedo();
    }
  }, [activeColumn, effectiveCurrentNote, handleWorkspaceRedo]);

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
      setActiveColumn((p) => (dir === 'next' ? ((p % 3 + 1) as ColumnIndex) : (((p - 2 + 3) % 3 + 1) as ColumnIndex))),
    onNavigateVertical: handleVerticalNavigate,
    onNavigateHorizontal: handleHorizontalNavigate,
    onEnterTreeItem: handleEnterTreeItem,
    onUndo: handleAppUndo,
    onRedo: handleAppRedo,
    onEscape: handleEscape,
  });

  if (isWidgetMode) {
    return (
      <AppWidgetView
        notes={notes} subjects={subjects} folders={folders}
        selectedSubjectId={selectedSubjectId} selectedFolderId={selectedFolderId}
        isVaultUnlocked={vault.isVaultUnlocked} timer={focusTimer}
        onSelectSubject={setSelectedSubjectId} onSelectFolder={setSelectedFolderId}
        onToggleComplete={handleToggleNoteCompleteWithSound} onAddFolder={handleAddFolder}
        onCreateNewNote={handleCreateNewNote}
        onOpenNoteInFullApp={(noteId, subjectId, folderId) => {
          setSelectedSubjectId(subjectId); setSelectedFolderId(folderId); setSelectedNoteId(noteId);
          handleToggleWidgetMode(false); setActiveColumn(3);
        }}
        onRestoreFullApp={() => handleToggleWidgetMode(false)}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-theme-base text-theme-text font-sans antialiased">
      <TopBar
        currentSubjectName={currentSubject?.name} searchQuery={searchQuery} filter={filter}
        pendingCount={pendingCount}
        completedCount={completedCount}
        totalCount={totalCount} currentTheme={currentTheme} currentAccent={currentAccent}
        customThemes={customThemes} timer={focusTimer} isAudioMuted={soundMuted} audioVolume={soundVolume}
        isSidebarCollapsed={isSidebarCollapsed} isFoldersCollapsed={isFoldersCollapsed} isZenMode={isZenMode}
        onVolumeChange={handleVolumeChange} onSearchChange={setSearchQuery}
        onOpenSearchPalette={(q) => { modalState.setSearchPaletteInitialQuery(q || ''); modalState.setIsSearchPaletteOpen(true); }}
        onFilterChange={setFilter} onSelectTheme={setCurrentTheme} onSelectAccent={setCurrentAccent}
        onImportCustomTheme={handleImportCustomTheme} onDeleteCustomTheme={handleDeleteCustomTheme}
        onToggleLanguage={() => i18n.changeLanguage(i18n.language.startsWith('es') ? 'en' : 'es')}
        onToggleShortcutsModal={() => modalState.setIsShortcutsModalOpen(true)}
        onToggleWidgetMode={handleToggleWidgetMode} onToggleAudioMute={handleToggleAudioMute}
        onToggleSidebar={toggleSidebar} onToggleFolders={toggleFolders}
        onToggleZenMode={() => setIsZenMode((p) => !p)}
        onOpenTimerModal={() => modalState.setIsTimerModalOpen(true)}
        showBreadcrumbs={showBreadcrumbs} onToggleBreadcrumbs={handleToggleBreadcrumbs}
        hasVaultPin={vault.hasPin} isVaultUnlocked={vault.isVaultUnlocked}
        onOpenPinSetup={vault.openUnlockOrSetup} onOpenPinChange={vault.openChangePin}
        onLockVault={vault.lockVault} onWorkspaceReloaded={reloadWorkspaceData}
        appVersion={appVersion}
        updateInfo={updateInfo}
        onCheckForUpdates={checkForUpdates}
        isCheckingUpdates={isChecking}
        onOpenRelease={openReleasePage}
      />

      <main className="flex-1 flex overflow-hidden">
        {!isZenMode && !isSidebarCollapsed && (
          <SubjectsSidebar
            subjects={subjects} folders={folders} selectedSubjectId={selectedSubjectId}
            activeNoteSubjectId={effectiveCurrentNote?.subjectId}
            secondaryNoteSubjectId={secondaryNote?.subjectId}
            isFocused={activeColumn === 1}
            isVaultUnlocked={vault.isVaultUnlocked} onToggleVault={vault.handleToggleVault}
            onOpenTrash={() => modalState.setIsTrashModalOpen(true)}
            onToggleSubjectPrivate={handleToggleSubjectPrivate}
            onAddFolderToSubject={(subjId) => handleAddFolder(t('folders.addFolder'), subjId)}
            onSelectSubject={(id) => { setSelectedSubjectId(id); setActiveColumn(1); }}
            onAddSubject={handleAddSubject} onUpdateSubject={handleUpdateSubject}
            onDeleteSubject={handleDeleteSubject} getSubjectNoteCount={getVisibleSubjectNoteCount}
            onMoveNoteToFolder={handleMoveNoteToFolder} onMoveNoteToSubject={handleMoveNoteToSubject}
            onBatchMoveNotesToSubject={handleBatchMoveNotesToSubject}
            onMoveFolderToSubject={handleMoveFolderToSubject}
            onConvertFolderToSubject={handleConvertFolderToSubject}
            onFocusColumn={() => setActiveColumn(1)}
          />
        )}

        {!isZenMode && !isFoldersCollapsed && (
          <FoldersList
            currentSubject={currentSubject} folders={currentSubjectFolders} notes={notes}
            selectedFolderId={selectedFolderId} selectedNoteId={selectedNoteId}
            secondaryNoteId={secondaryNote?.id}
            activeNoteFolderId={effectiveCurrentNote?.folderId}
            secondaryNoteFolderId={secondaryNote?.folderId}
            filter={filter}
            searchQuery={searchQuery} activeTagFilter={activeTagFilter}
            isFocused={activeColumn === 2} onClearTagFilter={() => setActiveTagFilter(null)}
            isVaultUnlocked={vault.isVaultUnlocked}
            onSelectFolder={(id) => { setSelectedFolderId(id); setActiveColumn(2); }}
            onSelectNote={(id) => { setSelectedNoteId(id); setActiveColumn(2); }}
            onToggleNoteComplete={handleToggleNoteCompleteWithSound}
            onToggleFolderExpand={handleToggleFolderExpand} onAddFolder={handleAddFolder}
            onUpdateFolder={handleUpdateFolder} onDeleteFolder={handleDeleteFolder}
            onAddNote={(folderId) => handleCreateNewNote(folderId)}
            onMoveNoteToFolder={handleMoveNoteToFolder} onReorderOrMoveNote={handleReorderOrMoveNote}
            onReorderFolder={handleReorderFolder} onBatchDeleteNotes={handleBatchDeleteNotes}
            onBatchDeleteFolders={handleBatchDeleteFolders}
            onBatchToggleCompleteNotes={handleBatchToggleCompleteNotes}
            onBatchMoveNotesToFolder={handleBatchMoveNotesToFolder}
            onDuplicateNote={handleDuplicateNote} onOpenInSplitView={handleOpenInSplitView}
            onToggleNotePrivate={handleToggleNotePrivateWithPin}
            onToggleFolderPrivate={handleToggleFolderPrivateWithPin}
          />
        )}

        <div
          onClick={() => setActiveColumn(3)}
          className={`flex-1 flex overflow-hidden transition-all ${
            activeColumn === 3 ? 'ring-1 ring-inset ring-theme-accent/20' : ''
          }`}
        >
          <SplitNoteWorkspace
            primaryNote={effectiveCurrentNote} secondaryNote={secondaryNote}
            notes={notes} subjects={subjects} folders={folders}
            currentSubjectFolders={currentSubjectFolders} showBreadcrumbs={showBreadcrumbs}
            activeTagFilter={activeTagFilter} focusTimer={focusTimer}
            onRevealNoteLocation={handleRevealLocation}
            onOpenFocusTimer={() => modalState.setIsTimerModalOpen(true)}
            onUpdateNote={handleUpdateNote} onDeleteNote={handleDeleteNote}
            onToggleNotePrivate={handleToggleNotePrivateWithPin}
            onSelectNote={(noteId, subjectId) => { setSelectedSubjectId(subjectId); setSelectedNoteId(noteId); setActiveColumn(3); }}
            onCreateNoteWithTitle={(title) => handleCreateNewNote(selectedFolderId, title)}
            onCreateNewNote={() => handleCreateNewNote()}
            onSelectTagFilter={(tag) => setActiveTagFilter(tag)}
            onOpenSketchAnnotator={(sketch) => modalState.setActiveSketch(sketch)}
            onOpenWhiteboard={() => modalState.setActiveSketch({
              id: `sketch-${Date.now()}`, title: t('note.whiteboardDrawing'), dataUrl: '', createdAt: new Date().toISOString(),
            })}
            onWorkspaceUndo={handleWorkspaceUndo} onWorkspaceRedo={handleWorkspaceRedo}
            onOpenInSplitView={handleOpenInSplitView} onCloseSplitView={handleCloseSplitView}
            onCreateSubject={() => handleAddSubject(t('nav.defaultProjectName') || 'Mi Proyecto', '#5551f5')}
            onCreateFolder={() => handleAddFolder(t('folders.addFolder'))}
          />
        </div>
      </main>

      <AppModals
        currentNote={effectiveCurrentNote} notes={notes} subjects={subjects} folders={folders}
        selectedSubjectId={selectedSubjectId} selectedFolderId={selectedFolderId}
        modalState={modalState} vault={vault} focusTimer={focusTimer}
        onSaveSketch={handleSaveSketch}
        onSelectNoteFromPalette={(noteId, subjectId) => { setSelectedSubjectId(subjectId); setSelectedNoteId(noteId); setActiveColumn(3); }}
        onQuickAddSave={handleQuickAddSave} onNotesRestored={reloadWorkspaceData}
      />

      <UpdateNotificationBanner
        updateInfo={updateInfo}
        onDismiss={dismissUpdate}
        onOpenRelease={openReleasePage}
      />
    </div>
  );
};
