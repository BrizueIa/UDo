import React from 'react';
import { NoteItem, SubjectItem, FolderItem, SketchItem } from '../shared/types';
import { FocusTimerState } from '../shared/hooks/useFocusTimer';
import { ImageAnnotatorModal } from '../features/canvas-editor/components/ImageAnnotatorModal';
import { CommandPalette } from '../features/search-palette/components/CommandPalette';
import { QuickAddModal } from '../features/search-palette/components/QuickAddModal';
import { FocusTimerPopover } from '../features/focus-timer/components/FocusTimerPopover';
import { ShortcutsModal } from '../shared/ui/ShortcutsModal';

interface AppModalsProps {
  currentNote: NoteItem | null | undefined;
  notes: NoteItem[];
  subjects: SubjectItem[];
  folders: FolderItem[];
  selectedSubjectId: string;
  selectedFolderId: string;
  activeSketch: SketchItem | null;
  isSearchPaletteOpen: boolean;
  searchPaletteInitialQuery: string;
  isQuickAddOpen: boolean;
  isTimerModalOpen: boolean;
  isShortcutsModalOpen: boolean;
  focusTimer: FocusTimerState;
  onCloseSketch: () => void;
  onSaveSketch: (sketch: SketchItem) => void;
  onCloseSearchPalette: () => void;
  onSelectNoteFromPalette: (noteId: string, subjectId: string) => void;
  onCloseQuickAdd: () => void;
  onQuickAddSave: (title: string, folderId: string, subjectId: string) => void;
  onCloseTimerModal: () => void;
  onCloseShortcutsModal: () => void;
}

export const AppModals: React.FC<AppModalsProps> = ({
  currentNote,
  notes,
  subjects,
  folders,
  selectedSubjectId,
  selectedFolderId,
  activeSketch,
  isSearchPaletteOpen,
  searchPaletteInitialQuery,
  isQuickAddOpen,
  isTimerModalOpen,
  isShortcutsModalOpen,
  focusTimer,
  onCloseSketch,
  onSaveSketch,
  onCloseSearchPalette,
  onSelectNoteFromPalette,
  onCloseQuickAdd,
  onQuickAddSave,
  onCloseTimerModal,
  onCloseShortcutsModal,
}) => {
  return (
    <>
      {activeSketch && currentNote && (
        <ImageAnnotatorModal
          sketch={activeSketch}
          isOpen={!!activeSketch}
          onClose={onCloseSketch}
          onSave={onSaveSketch}
        />
      )}

      <CommandPalette
        isOpen={isSearchPaletteOpen}
        initialQuery={searchPaletteInitialQuery}
        notes={notes}
        subjects={subjects}
        folders={folders}
        onClose={onCloseSearchPalette}
        onSelectNote={onSelectNoteFromPalette}
      />

      <QuickAddModal
        isOpen={isQuickAddOpen}
        subjects={subjects}
        folders={folders}
        defaultSubjectId={selectedSubjectId}
        defaultFolderId={selectedFolderId}
        onClose={onCloseQuickAdd}
        onSave={onQuickAddSave}
      />

      {currentNote && (
        <FocusTimerPopover
          isOpen={isTimerModalOpen}
          noteId={currentNote.id}
          noteTitle={currentNote.title}
          accumulatedMinutes={currentNote.focusMinutes}
          timer={focusTimer}
          onClose={onCloseTimerModal}
        />
      )}

      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={onCloseShortcutsModal}
      />
    </>
  );
};
