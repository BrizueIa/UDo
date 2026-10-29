import { useState, useCallback, useEffect, useRef } from 'react';

interface Props {
  allVisibleNoteIds: string[];
  currentFolderNoteIds?: string[];
  allVisibleFolderIds?: string[];
  activeNoteId?: string;
  onBatchDelete?: (noteIds: string[], folderIds?: string[]) => void;
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
  currentFolderNoteIds = [],
  allVisibleFolderIds = [],
  activeNoteId,
  onBatchDelete,
}: Props) {
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set());
  const [lastSelectionType, setLastSelectionType] = useState<'note' | 'folder'>('note');
  const [lastFocusedNoteId, setLastFocusedNoteId] = useState<string | null>(null);
  const [lastFocusedFolderId, setLastFocusedFolderId] = useState<string | null>(null);
  const [anchorNoteId, setAnchorNoteId] = useState<string | null>(null);
  const [marqueeRect, setMarqueeRect] = useState<MarqueeRect | null>(null);

  const isDraggingMarqueeRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const clearSelection = useCallback(() => {
    setSelectedNoteIds(new Set());
    setSelectedFolderIds(new Set());
    setLastFocusedNoteId(null);
    setLastFocusedFolderId(null);
    setAnchorNoteId(null);
  }, []);

  const selectAll = useCallback(() => {
    if (lastSelectionType === 'folder' || (selectedFolderIds.size > 0 && selectedNoteIds.size === 0)) {
      setSelectedFolderIds(new Set(allVisibleFolderIds));
      setSelectedNoteIds(new Set());
    } else {
      const targetIds = currentFolderNoteIds.length > 0 ? currentFolderNoteIds : allVisibleNoteIds;
      setSelectedNoteIds(new Set(targetIds));
      setSelectedFolderIds(new Set());
      setLastSelectionType('note');
    }
  }, [lastSelectionType, selectedFolderIds.size, selectedNoteIds.size, allVisibleFolderIds, currentFolderNoteIds, allVisibleNoteIds]);

  const handleNoteClick = useCallback(
    (noteId: string, e: React.MouseEvent) => {
      setLastSelectionType('note');
      if (e.ctrlKey || e.metaKey) {
        setSelectedNoteIds((prev) => {
          const next = new Set(prev);
          if (next.has(noteId)) next.delete(noteId);
          else next.add(noteId);
          return next;
        });
        setLastFocusedNoteId(noteId);
        setAnchorNoteId(noteId);
      } else if (e.shiftKey && (anchorNoteId || lastFocusedNoteId || activeNoteId)) {
        const sequence = currentFolderNoteIds.length > 0 ? currentFolderNoteIds : allVisibleNoteIds;
        const anchor = anchorNoteId || lastFocusedNoteId || activeNoteId || sequence[0];
        const fromIdx = sequence.indexOf(anchor);
        const toIdx = sequence.indexOf(noteId);
        if (fromIdx !== -1 && toIdx !== -1) {
          const start = Math.min(fromIdx, toIdx);
          const end = Math.max(fromIdx, toIdx);
          const rangeIds = sequence.slice(start, end + 1);
          setSelectedNoteIds(new Set(rangeIds));
          setSelectedFolderIds(new Set());
        } else {
          setSelectedNoteIds(new Set([noteId]));
        }
        setLastFocusedNoteId(noteId);
      } else {
        setSelectedNoteIds(new Set([noteId]));
        setSelectedFolderIds(new Set());
        setLastFocusedNoteId(noteId);
        setAnchorNoteId(noteId);
      }
    },
    [allVisibleNoteIds, currentFolderNoteIds, lastFocusedNoteId, anchorNoteId, activeNoteId]
  );

  const handleFolderClick = useCallback(
    (folderId: string, e: React.MouseEvent) => {
      setLastSelectionType('folder');
      if (e.ctrlKey || e.metaKey) {
        setSelectedFolderIds((prev) => {
          const next = new Set(prev);
          if (next.has(folderId)) next.delete(folderId);
          else next.add(folderId);
          return next;
        });
        setLastFocusedFolderId(folderId);
      } else if (e.shiftKey && lastFocusedFolderId) {
        const fromIdx = allVisibleFolderIds.indexOf(lastFocusedFolderId);
        const toIdx = allVisibleFolderIds.indexOf(folderId);
        if (fromIdx !== -1 && toIdx !== -1) {
          const start = Math.min(fromIdx, toIdx);
          const end = Math.max(fromIdx, toIdx);
          const rangeIds = allVisibleFolderIds.slice(start, end + 1);
          setSelectedFolderIds(new Set(rangeIds));
          setSelectedNoteIds(new Set());
        } else {
          setSelectedFolderIds(new Set([folderId]));
        }
        setLastFocusedFolderId(folderId);
      } else {
        setSelectedFolderIds(new Set([folderId]));
        setSelectedNoteIds(new Set());
        setLastFocusedFolderId(folderId);
      }
    },
    [allVisibleFolderIds, lastFocusedFolderId]
  );

  const handleContainerMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
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
      let hasDragged = false;

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!isDraggingMarqueeRef.current) return;
        const currentX = moveEvent.clientX;
        const currentY = moveEvent.clientY;
        const left = Math.min(startPosRef.current.x, currentX);
        const top = Math.min(startPosRef.current.y, currentY);
        const width = Math.abs(currentX - startPosRef.current.x);
        const height = Math.abs(currentY - startPosRef.current.y);

        if (width > 6 || height > 6) {
          hasDragged = true;
          setMarqueeRect({ left, top, width, height });

          const noteEls = document.querySelectorAll<HTMLElement>('[data-note-id]');
          const newlySelectedNotes = new Set<string>();
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
              if (id) newlySelectedNotes.add(id);
            }
          });

          const folderEls = document.querySelectorAll<HTMLElement>('[data-folder-id]');
          const newlySelectedFolders = new Set<string>();
          folderEls.forEach((el) => {
            const rect = el.getBoundingClientRect();
            const intersects = !(
              rect.right < left ||
              rect.left > left + width ||
              rect.bottom < top ||
              rect.top > top + height
            );
            if (intersects) {
              const id = el.getAttribute('data-folder-id');
              if (id) newlySelectedFolders.add(id);
            }
          });

          if (moveEvent.ctrlKey || moveEvent.metaKey) {
            setSelectedNoteIds((prev) => new Set([...prev, ...newlySelectedNotes]));
            setSelectedFolderIds((prev) => new Set([...prev, ...newlySelectedFolders]));
          } else {
            setSelectedNoteIds(newlySelectedNotes);
            setSelectedFolderIds(newlySelectedFolders);
          }
        }
      };

      const onMouseUp = () => {
        isDraggingMarqueeRef.current = false;
        setMarqueeRect(null);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        if (!hasDragged) {
          clearSelection();
        }
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [clearSelection]
  );

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
        e.preventDefault();
        selectAll();
        return;
      }

      if (e.key === 'Escape' && (selectedNoteIds.size > 0 || selectedFolderIds.size > 0)) {
        e.preventDefault();
        clearSelection();
        return;
      }

      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        (selectedNoteIds.size > 0 || selectedFolderIds.size > 0)
      ) {
        if (selectedNoteIds.size > 1 || selectedFolderIds.size > 0) {
          e.preventDefault();
          onBatchDelete?.(Array.from(selectedNoteIds), Array.from(selectedFolderIds));
        }
        return;
      }

      if (e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        const sequence = currentFolderNoteIds.length > 0 ? currentFolderNoteIds : allVisibleNoteIds;
        if (sequence.length === 0) return;
        e.preventDefault();

        const anchor = anchorNoteId || lastFocusedNoteId || activeNoteId || sequence[0];
        const anchorIdx = sequence.indexOf(anchor);
        const curIdx = lastFocusedNoteId ? sequence.indexOf(lastFocusedNoteId) : anchorIdx;
        const validCurIdx = curIdx === -1 ? anchorIdx : curIdx;

        let nextIdx = validCurIdx;
        if (e.key === 'ArrowDown') {
          nextIdx = Math.min(sequence.length - 1, validCurIdx + 1);
        } else {
          nextIdx = Math.max(0, validCurIdx - 1);
        }

        const nextNoteId = sequence[nextIdx];
        setLastFocusedNoteId(nextNoteId);
        if (!anchorNoteId) setAnchorNoteId(anchor);
        setLastSelectionType('note');

        const start = Math.min(anchorIdx, nextIdx);
        const end = Math.max(anchorIdx, nextIdx);
        const rangeIds = sequence.slice(start, end + 1);
        setSelectedNoteIds(new Set(rangeIds));
        setSelectedFolderIds(new Set());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedNoteIds,
    selectedFolderIds,
    allVisibleNoteIds,
    currentFolderNoteIds,
    lastFocusedNoteId,
    anchorNoteId,
    activeNoteId,
    selectAll,
    clearSelection,
    onBatchDelete,
  ]);

  return {
    selectedNoteIds,
    selectedFolderIds,
    setSelectedNoteIds,
    setSelectedFolderIds,
    clearSelection,
    selectAll,
    handleNoteClick,
    handleFolderClick,
    handleContainerMouseDown,
    marqueeRect,
  };
}
