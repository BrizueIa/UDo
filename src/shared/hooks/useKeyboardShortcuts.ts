import { useEffect } from 'react';

interface ShortcutHandlers {
  onToggleSearchPalette: () => void;
  onToggleWidgetMode: () => void;
  onToggleZenMode: () => void;
  onToggleShortcutsModal: () => void;
  onCreateNote: () => void;
  onToggleCurrentNoteComplete: () => void;
}

export function useKeyboardShortcuts({
  onToggleSearchPalette,
  onToggleWidgetMode,
  onToggleZenMode,
  onToggleShortcutsModal,
  onCreateNote,
  onToggleCurrentNoteComplete,
}: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onToggleSearchPalette();
      } else if (e.altKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        onToggleWidgetMode();
      } else if (e.key === 'F11') {
        e.preventDefault();
        onToggleZenMode();
      } else if (!isInput && e.key === '?') {
        e.preventDefault();
        onToggleShortcutsModal();
      } else if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        onCreateNote();
      } else if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        onToggleCurrentNoteComplete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onToggleSearchPalette,
    onToggleWidgetMode,
    onToggleZenMode,
    onToggleShortcutsModal,
    onCreateNote,
    onToggleCurrentNoteComplete,
  ]);
}
