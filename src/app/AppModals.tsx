import React from 'react';
import { NoteItem, SubjectItem, FolderItem, SketchItem } from '../shared/types';
import { FocusTimerState } from '../shared/hooks/useFocusTimer';
import { ImageAnnotatorModal } from '../features/canvas-editor/components/ImageAnnotatorModal';
import { CommandPalette } from '../features/search-palette/components/CommandPalette';
import { QuickAddModal } from '../features/search-palette/components/QuickAddModal';
import { FocusTimerPopover } from '../features/focus-timer/components/FocusTimerPopover';
import { ShortcutsModal } from '../shared/ui/ShortcutsModal';
import { TrashModal } from '../features/trash/components/TrashModal';
import { VaultPinModal } from '../features/private-vault/components/VaultPinModal';
import { useAppModalState } from './useAppModalState';
import { useVaultState } from '../features/private-vault/hooks/useVaultState';

interface AppModalsProps {
  currentNote: NoteItem | null | undefined;
  notes: NoteItem[];
  subjects: SubjectItem[];
  folders: FolderItem[];
  selectedSubjectId: string;
  selectedFolderId: string;
  modalState: ReturnType<typeof useAppModalState>;
  vault: ReturnType<typeof useVaultState>;
  focusTimer: FocusTimerState;
  onSaveSketch: (sketch: SketchItem) => void;
  onSelectNoteFromPalette: (noteId: string, subjectId: string) => void;
  onQuickAddSave: (title: string, folderId: string, subjectId: string) => void;
  onNotesRestored?: () => void;
}

export const AppModals: React.FC<AppModalsProps> = ({
  currentNote,
  notes,
  subjects,
  folders,
  selectedSubjectId,
  selectedFolderId,
  modalState,
  vault,
  focusTimer,
  onSaveSketch,
  onSelectNoteFromPalette,
  onQuickAddSave,
  onNotesRestored = () => {},
}) => {
  return (
    <>
      {modalState.activeSketch && currentNote && (
        <ImageAnnotatorModal
          sketch={modalState.activeSketch}
          isOpen={!!modalState.activeSketch}
          onClose={() => modalState.setActiveSketch(null)}
          onSave={onSaveSketch}
        />
      )}

      <CommandPalette
        isOpen={modalState.isSearchPaletteOpen}
        initialQuery={modalState.searchPaletteInitialQuery}
        notes={notes}
        subjects={subjects}
        folders={folders}
        isVaultUnlocked={vault.isVaultUnlocked}
        onClose={() => modalState.setIsSearchPaletteOpen(false)}
        onSelectNote={onSelectNoteFromPalette}
      />

      <QuickAddModal
        isOpen={modalState.isQuickAddOpen}
        subjects={subjects}
        folders={folders}
        defaultSubjectId={selectedSubjectId}
        defaultFolderId={selectedFolderId}
        onClose={() => modalState.setIsQuickAddOpen(false)}
        onSave={onQuickAddSave}
      />

      {currentNote && (
        <FocusTimerPopover
          isOpen={modalState.isTimerModalOpen}
          noteId={currentNote.id}
          noteTitle={currentNote.title}
          accumulatedMinutes={currentNote.focusMinutes}
          timer={focusTimer}
          onClose={() => modalState.setIsTimerModalOpen(false)}
        />
      )}

      <ShortcutsModal
        isOpen={modalState.isShortcutsModalOpen}
        onClose={() => modalState.setIsShortcutsModalOpen(false)}
      />

      <TrashModal
        isOpen={modalState.isTrashModalOpen}
        isVaultUnlocked={vault.isVaultUnlocked}
        subjects={subjects}
        folders={folders}
        onClose={() => modalState.setIsTrashModalOpen(false)}
        onNotesRestored={onNotesRestored}
      />

      <VaultPinModal
        isOpen={vault.isPinModalOpen}
        mode={vault.pinModalMode}
        onClose={() => vault.setIsPinModalOpen(false)}
        onSuccess={vault.handleModalSuccess}
      />
    </>
  );
};
