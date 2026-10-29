import { useState, useRef, useCallback } from 'react';

export function useRichTextSelection<T extends HTMLInputElement | HTMLTextAreaElement>() {
  const inputRef = useRef<T>(null);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);

  const updateSelectionCoords = useCallback((e?: React.MouseEvent<T> | React.KeyboardEvent<T>) => {
    const el = inputRef.current;
    if (!el) {
      setCoords(null);
      return;
    }
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    if (start !== end && el.value.slice(start, end).trim().length > 0) {
      const rect = el.getBoundingClientRect();
      let clientX = rect.left + rect.width / 2;
      let clientY = rect.top;

      if (e && 'clientX' in e && e.clientX && e.clientY) {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const x = Math.max(rect.left + 50, Math.min(rect.right - 50, clientX));
      const y = Math.max(rect.top - 6, Math.min(rect.bottom, clientY));
      setCoords({ x, y });
    } else {
      setCoords(null);
    }
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent<T>) => {
    updateSelectionCoords(e);
  }, [updateSelectionCoords]);

  const handleKeyUp = useCallback((e: React.KeyboardEvent<T>) => {
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') {
      return;
    }
    updateSelectionCoords(e);
  }, [updateSelectionCoords]);

  const closeToolbar = useCallback(() => {
    setCoords(null);
  }, []);

  return {
    inputRef,
    coords,
    setCoords,
    handleMouseUp,
    handleKeyUp,
    closeToolbar,
  };
}
