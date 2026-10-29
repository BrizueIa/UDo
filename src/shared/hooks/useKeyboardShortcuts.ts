import { useEffect } from 'react';

export type ColumnIndex = 1 | 2 | 3;

interface ShortcutHandlers {
  onToggleSearchPalette: () => void;
  onToggleQuickAdd?: () => void;
  onToggleWidgetMode: () => void;
  onToggleZenMode: () => void;
  onToggleSidebar?: () => void;
  onToggleFolders?: () => void;
  onToggleShortcutsModal: () => void;
  onCreateNote: () => void;
  onCreateFolder: () => void;
  onToggleCurrentNoteComplete: () => void;
  onFocusMarkdownEditor: () => void;
  onSetActiveColumn: (col: ColumnIndex) => void;
  onCycleColumn: (direction: 'next' | 'prev') => void;
  onNavigateVertical: (direction: 'up' | 'down') => void;
  onNavigateHorizontal?: (direction: 'left' | 'right') => void;
  onEnterTreeItem?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onEscape: () => void;
}

export function useKeyboardShortcuts({
  onToggleSearchPalette,
  onToggleQuickAdd,
  onToggleWidgetMode,
  onToggleZenMode,
  onToggleSidebar,
  onToggleFolders,
  onToggleShortcutsModal,
  onCreateNote,
  onCreateFolder,
  onToggleCurrentNoteComplete,
  onFocusMarkdownEditor,
  onSetActiveColumn,
  onCycleColumn,
  onNavigateVertical,
  onNavigateHorizontal,
  onEnterTreeItem,
  onUndo,
  onRedo,
  onEscape,
}: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Esc: Global escape handler (FR-08)
      if (e.key === 'Escape') {
        onEscape();
        return;
      }

      // Ctrl + Z: Undo workspace action outside text inputs (FR-08)
      if (!isInput && e.ctrlKey && !e.shiftKey && (e.code === 'KeyZ' || e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        onUndo?.();
        return;
      }

      // Ctrl + Y or Ctrl + Shift + Z: Redo workspace action outside text inputs (FR-08)
      if (
        !isInput &&
        ((e.ctrlKey && (e.code === 'KeyY' || e.key.toLowerCase() === 'y')) ||
          (e.ctrlKey && e.shiftKey && (e.code === 'KeyZ' || e.key.toLowerCase() === 'z')))
      ) {
        e.preventDefault();
        onRedo?.();
        return;
      }

      // Ctrl + Space (or Ctrl + Alt + Space): Quick Add Spotlight (FR-12)
      if (e.ctrlKey && (e.code === 'Space' || e.key === ' ')) {
        e.preventDefault();
        onToggleQuickAdd?.();
        return;
      }

      // Ctrl + Shift + N: New folder (FR-08)
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        onCreateFolder();
        return;
      }

      // Ctrl + N: New note in current folder (FR-08)
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        onCreateNote();
        return;
      }

      // Ctrl + D or Ctrl + Enter: Toggle completion state (FR-08)
      if (
        (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'd') ||
        (e.ctrlKey && e.key === 'Enter')
      ) {
        e.preventDefault();
        onToggleCurrentNoteComplete();
        return;
      }

      // Ctrl + E: Switch to Markdown edit mode (FR-08)
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        onFocusMarkdownEditor();
        return;
      }

      // Ctrl + K: Command Palette
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onToggleSearchPalette();
        return;
      }

      // Alt + W: Toggle Widget Mode
      if (e.altKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        onToggleWidgetMode();
        return;
      }

      // F11: Zen Mode
      if (e.key === 'F11') {
        e.preventDefault();
        onToggleZenMode();
        return;
      }

      // Ctrl + B: Toggle Column 1 (Subjects Sidebar)
      if (e.ctrlKey && !e.shiftKey && (e.code === 'KeyB' || e.key.toLowerCase() === 'b')) {
        e.preventDefault();
        onToggleSidebar?.();
        return;
      }

      // Ctrl + \ or Alt + B: Toggle Column 2 (Folders List)
      if (
        (e.ctrlKey && (e.key === '\\' || e.code === 'Backslash')) ||
        (e.altKey && (e.code === 'KeyB' || e.key.toLowerCase() === 'b'))
      ) {
        e.preventDefault();
        onToggleFolders?.();
        return;
      }

      // Ctrl + /: Shortcuts Modal
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        onToggleShortcutsModal();
        return;
      }

      // Non-input navigation shortcuts
      if (!isInput) {
        // /: Open Command Palette (FR-05 & FR-08)
        if (e.key === '/') {
          e.preventDefault();
          onToggleSearchPalette();
          return;
        }

        // ?: Open Shortcuts modal
        if (e.key === '?') {
          e.preventDefault();
          onToggleShortcutsModal();
          return;
        }

        // 1, 2, 3: Direct jump to column (FR-08)
        if (e.key === '1') {
          e.preventDefault();
          onSetActiveColumn(1);
          return;
        }
        if (e.key === '2') {
          e.preventDefault();
          onSetActiveColumn(2);
          return;
        }
        if (e.key === '3') {
          e.preventDefault();
          onSetActiveColumn(3);
          return;
        }

        // Tab / Shift + Tab: Cycle focus between Column 1 ↔ 2 ↔ 3 (FR-08)
        if (e.key === 'Tab') {
          e.preventDefault();
          onCycleColumn(e.shiftKey ? 'prev' : 'next');
          return;
        }

        // Enter: Open / toggle tree item or focus
        if (e.key === 'Enter') {
          e.preventDefault();
          onEnterTreeItem?.();
          return;
        }

        // ArrowRight / l / ArrowLeft / h: Expand / collapse folder in tree
        if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'l') {
          e.preventDefault();
          onNavigateHorizontal?.('right');
          return;
        }
        if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'h') {
          e.preventDefault();
          onNavigateHorizontal?.('left');
          return;
        }

        // n: Create note in selected folder when navigating
        if (e.key.toLowerCase() === 'n') {
          e.preventDefault();
          onCreateNote();
          return;
        }

        // j / k or ↓ / ↑: Navigate items in active column (FR-08) - only without Shift
        if (!e.shiftKey && (e.key.toLowerCase() === 'j' || e.key === 'ArrowDown')) {
          e.preventDefault();
          onNavigateVertical('down');
          return;
        }
        if (!e.shiftKey && (e.key.toLowerCase() === 'k' || e.key === 'ArrowUp')) {
          e.preventDefault();
          onNavigateVertical('up');
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onToggleSearchPalette,
    onToggleQuickAdd,
    onToggleWidgetMode,
    onToggleZenMode,
    onToggleSidebar,
    onToggleFolders,
    onToggleShortcutsModal,
    onCreateNote,
    onCreateFolder,
    onToggleCurrentNoteComplete,
    onFocusMarkdownEditor,
    onSetActiveColumn,
    onCycleColumn,
    onNavigateVertical,
    onNavigateHorizontal,
    onEnterTreeItem,
    onUndo,
    onRedo,
    onEscape,
  ]);
}
