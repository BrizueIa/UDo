import { useState, useCallback, useEffect, useRef } from 'react';

interface Props {
  allVisibleNoteIds: string[];
  onBatchDelete?: (noteIds: string[]) => void;
  onClearActiveNote?: () => void;
}

export interface MarqueeRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function useMultiSelection({
  allVisibleNoteIds,
  onBatchDelete,
}: Props) {
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());
  const [lastFocusedNoteId, setLastFocusedNoteId] = useState<string | null>(null);
  const [marqueeRect, setMarqueeRect] = useState<MarqueeRect | null>(null);

  const isDraggingMarqueeRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const clearSelection = useCallback(() => {
    setSelectedNoteIds(new Set());
    setLastFocusedNoteId(null);
  }, []);

  const selectAll = useCallback(() => {
    setSelectedNoteIds(new Set(allVisibleNoteIds));
  }, [allVisibleNoteIds]);

  const handleNoteClick = useCallback(
    (noteId: string, e: React.MouseEvent) => {
      if (e.ctrlKey || e.metaKey) {
        setSelectedNoteIds((prev) => {
          const next = new Set(prev);
          if (next.has(noteId)) {
            next.delete(noteId);
          } else {
            next.add(noteId);
          }
          return next;
        });
        setLastFocusedNoteId(noteId);
      } else if (e.shiftKey && lastFocusedNoteId) {
        const fromIdx = allVisibleNoteIds.indexOf(lastFocusedNoteId);
        const toIdx = allVisibleNoteIds.indexOf(noteId);
        if (fromIdx !== -1 && toIdx !== -1) {
          const start = Math.min(fromIdx, toIdx);
          const end = Math.max(fromIdx, toIdx);
          const rangeIds = allVisibleNoteIds.slice(start, end + 1);
          setSelectedNoteIds((prev) => new Set([...prev, ...rangeIds]));
        } else {
          setSelectedNoteIds(new Set([noteId]));
        }
      } else {
        setSelectedNoteIds(new Set([noteId]));
        setLastFocusedNoteId(noteId);
      }
    },
    [allVisibleNoteIds, lastFocusedNoteId]
  );

  // Marquee mouse drag handling on container
  const handleContainerMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Ignore if clicking on button, input, or inside a note item
      const target = e.target as HTMLElement;
      if (
        e.button !== 0 ||
        target.closest('button') ||
        target.closest('input') ||
        target.closest('[data-note-id]')
      ) {
        return;
      }

      isDraggingMarqueeRef.current = true;
      startPosRef.current = { x: e.clientX, y: e.clientY };

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!isDraggingMarqueeRef.current) return;
        const currentX = moveEvent.clientX;
        const currentY = moveEvent.clientY;

        const left = Math.min(startPosRef.current.x, currentX);
        const top = Math.min(startPosRef.current.y, currentY);
        const width = Math.abs(currentX - startPosRef.current.x);
        const height = Math.abs(currentY - startPosRef.current.y);

        if (width > 6 || height > 6) {
          setMarqueeRect({ left, top, width, height });

          // Intersect with notes
          const noteEls = document.querySelectorAll<HTMLElement>('[data-note-id]');
          const newlySelected = new Set<string>();

          noteEls.forEach((el) => {
            const rect = el.getBoundingClientRect();
            const intersects = !(
              rect.right < left ||
              rect.left > left + width ||
              rect.bottom < top ||
              rect.top > top + height
            );
            if (intersects) {
              const id = el.getAttribute('data-note-id');
              if (id) newlySelected.add(id);
            }
          });

          if (moveEvent.ctrlKey || moveEvent.metaKey) {
            setSelectedNoteIds((prev) => new Set([...prev, ...newlySelected]));
          } else {
            setSelectedNoteIds(newlySelected);
          }
        }
      };

      const onMouseUp = () => {
        isDraggingMarqueeRef.current = false;
        setMarqueeRect(null);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    []
  );

  // Global key bindings: Delete/Supr, Escape, Ctrl+A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable);

      if (isInputFocused) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        const container = document.querySelector('[data-folders-container]');
        if (container && container.contains(activeEl || null)) {
          e.preventDefault();
          selectAll();
        }
      } else if (e.key === 'Escape' && selectedNoteIds.size > 0) {
        e.preventDefault();
        clearSelection();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNoteIds.size > 1) {
        e.preventDefault();
        if (onBatchDelete) {
          onBatchDelete(Array.from(selectedNoteIds));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNoteIds, selectAll, clearSelection, onBatchDelete]);

  return {
    selectedNoteIds,
    setSelectedNoteIds,
    clearSelection,
    selectAll,
    handleNoteClick,
    handleContainerMouseDown,
    marqueeRect,
  };
}
