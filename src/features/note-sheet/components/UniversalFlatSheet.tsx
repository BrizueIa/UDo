import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Scissors, Copy, Clipboard, CheckSquare, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NoteItem, SketchItem, LinkItem, NoteAttachment } from '../../../shared/types';
import { buildDiacriticRegex } from '../../../shared/utils/diacritics';
import { hasClipboardImageContent, processImageDropOrPaste } from '../../../shared/utils/imageClipboard';
import { RichTextToolbar, RichFormatAction } from './RichTextToolbar';
import { EditableTextLine } from './blocks/EditableTextLine';
import { FreeMediaLayer } from './blocks/FreeMediaLayer';
import { FreeBounds } from './blocks/FreeObjectWrapper';
import { InlineLinkBlock } from './blocks/InlineMediaBlocks';
import { useContextMenu } from '../../../shared/ui/context-menu';
import { playTaskCompleteSound } from '../../../shared/utils/soundEffects';
import {
  CrossLineTextRange,
  createCrossLineRange,
  getVisibleLineLength,
  getLineSelectionSlice,
  applyFormatToCrossLineRange,
  deleteOrReplaceCrossLineRange,
  extractPlainTextFromCrossLineRange,
  extendCrossLineRangeByKey,
} from '../utils/crossLineSelectionEngine';

interface Props {
  content: string; notes: NoteItem[]; sketches: SketchItem[]; links: LinkItem[]; attachments: NoteAttachment[];
  findQuery?: string; currentMatchIndex?: number; activeCursorLineRef: React.MutableRefObject<number>;
  onChangeContent: (newContent: string) => void; onSelectNote: (noteId: string, subjectId: string) => void;
  onCreateNoteWithTitle: (title: string) => void; onMatchCountCalculated?: (count: number) => void;
  onUndoText?: () => void; onRedoText?: () => void;
  onAttachSketchesAtLine: (sketches: SketchItem[], lineIdx: number) => void;
  onOpenSketchAnnotator: (sketch: SketchItem) => void; onRemoveSketch: (sketchId: string) => void;
  onUpdateSketch: (sketchId: string, updates: Partial<SketchItem>) => void; onRemoveLink: (linkId: string) => void;
  onRemoveAttachment: (attachmentId: string) => void; onRenameAttachment: (attachmentId: string, newName: string) => void;
  onUpdateAttachment?: (attachmentId: string, updates: Partial<NoteAttachment>) => void;
}

const EMBED_REGEX = /^\[embed:(sketch|attachment|link):([^\]]+)\]$/i;

export const UniversalFlatSheet: React.FC<Props> = ({
  content, notes, sketches, links, attachments, findQuery = '',
  activeCursorLineRef, onChangeContent, onSelectNote, onCreateNoteWithTitle,
  onMatchCountCalculated, onUndoText, onRedoText, onAttachSketchesAtLine,
  onOpenSketchAnnotator, onRemoveSketch, onUpdateSketch,
  onRemoveLink, onRemoveAttachment, onRenameAttachment, onUpdateAttachment,
}) => {
  const { t } = useTranslation();
  const { openContextMenu } = useContextMenu();
  const [toolbarCoords, setToolbarCoords] = useState<{ x: number; y: number } | null>(null);
  const activeApplyFormatRef = useRef<((action: RichFormatAction) => void) | null>(null);
  const lineElementsRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const sheetContainerRef = useRef<HTMLDivElement>(null);
  const [boundsMap, setBoundsMap] = useState<Map<string, FreeBounds>>(new Map());

  const [crossSelection, setCrossSelection] = useState<CrossLineTextRange | null>(null);
  const [isDraggingMouse, setIsDraggingMouse] = useState<boolean>(false);
  const isMouseDownRef = useRef<boolean>(false);
  const dragAnchorRef = useRef<{ line: number; offset: number } | null>(null);
  const applyFormatToRangeRef = useRef<((action: RichFormatAction) => void) | null>(null);

  const lines = (content || '').split('\n');

  const referencedLinkIds = new Set<string>();
  lines.forEach((line) => {
    const m = line.trim().match(EMBED_REGEX);
    if (!m) return;
    const [, kind, id] = m;
    if (kind.toLowerCase() === 'link') referencedLinkIds.add(id);
  });

  const orphanLinks = links.filter((l) => !referencedLinkIds.has(l.id));

  const handleReportBounds = useCallback((b: FreeBounds) => {
    setBoundsMap((prev) => {
      const ex = prev.get(b.id);
      if (ex && ex.left === b.left && ex.top === b.top && ex.width === b.width && ex.height === b.height) return prev;
      const next = new Map(prev);
      next.set(b.id, b);
      return next;
    });
  }, []);

  const handleUnregisterBounds = useCallback((id: string) => {
    setBoundsMap((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const getLineExclusion = useCallback(
    (lineIdx: number) => {
      if (boundsMap.size === 0) return undefined;
      const el = lineElementsRef.current.get(lineIdx);
      const containerW = sheetContainerRef.current?.offsetWidth || 760;

      let lineTop = lineIdx * 28;
      let lineBottom = lineTop + 28;
      let naturalLineTop = lineTop;

      if (el && sheetContainerRef.current) {
        const cRect = sheetContainerRef.current.getBoundingClientRect();
        const lRect = el.getBoundingClientRect();
        const groupEl = el.closest('.group') as HTMLElement | null;
        const currentMarginTop = groupEl ? parseFloat(groupEl.style.marginTop) || 0 : 0;
        naturalLineTop = (lRect.top - cRect.top + sheetContainerRef.current.scrollTop) - currentMarginTop;
        lineTop = naturalLineTop;
        lineBottom = lineTop + Math.max(lRect.height, 24);
      }

      let left = 0;
      let right = 0;
      let maxOverlappingBottom = 0;
      let isFullBarrier = false;

      boundsMap.forEach((b) => {
        const objBottom = b.top + b.height;
        if (b.top <= lineBottom - 3 && objBottom >= lineTop + 3) {
          if (objBottom > maxOverlappingBottom) maxOverlappingBottom = objBottom;
          if (b.width > containerW - 220 || (b.left < 100 && b.left + b.width > containerW - 100)) isFullBarrier = true;
        }
      });

      if (!isFullBarrier && boundsMap.size >= 2) {
        boundsMap.forEach((b1) => {
          boundsMap.forEach((b2) => {
            if (b1.id >= b2.id) return;
            const b1Bottom = b1.top + b1.height;
            const b2Bottom = b2.top + b2.height;
            const pairTop = Math.max(b1.top, b2.top);
            const pairBottom = Math.min(b1Bottom, b2Bottom);
            if (pairBottom > pairTop + 10 && pairTop <= lineBottom - 3 && pairBottom >= lineTop + 3) {
              const gap = Math.abs(b2.left - b1.left) - Math.min(b1.width, b2.width);
              if (gap < 240) {
                isFullBarrier = true;
                maxOverlappingBottom = Math.max(maxOverlappingBottom, b1Bottom, b2Bottom);
              }
            }
          });
        });
      }

      if (isFullBarrier) {
        return { marginTop: Math.round(Math.max(0, maxOverlappingBottom - naturalLineTop + 14)) };
      }

      boundsMap.forEach((b) => {
        const objBottom = b.top + b.height;
        if (b.top <= lineBottom - 3 && objBottom >= lineTop + 3) {
          const objCenter = b.left + b.width / 2;
          if (objCenter < containerW / 2) left = Math.max(left, b.left + b.width + 16);
          else right = Math.max(right, containerW - b.left + 16);
        }
      });

      if (left <= 0 && right <= 0) return undefined;
      return {
        left: left > 0 ? Math.round(left) : undefined,
        right: right > 0 ? Math.round(right) : undefined,
      };
    },
    [boundsMap]
  );

  const lastMatchCountRef = useRef<number>(0);
  useEffect(() => {
    const q = findQuery.trim();
    if (!q) {
      if (lastMatchCountRef.current !== 0) {
        lastMatchCountRef.current = 0;
        onMatchCountCalculated?.(0);
      }
      return;
    }
    try {
      const matches = content.match(buildDiacriticRegex(q, 'gi'));
      const count = matches ? matches.length : 0;
      if (lastMatchCountRef.current !== count) {
        lastMatchCountRef.current = count;
        onMatchCountCalculated?.(count);
      }
    } catch {
      if (lastMatchCountRef.current !== 0) {
        lastMatchCountRef.current = 0;
        onMatchCountCalculated?.(0);
      }
    }
  }, [content, findQuery, onMatchCountCalculated]);

  const registerLineEl = useCallback((idx: number, el: HTMLDivElement | null) => {
    if (el) lineElementsRef.current.set(idx, el);
    else lineElementsRef.current.delete(idx);
  }, []);

  const focusLineAt = useCallback((idx: number, position: boolean | number = true, targetX?: number) => {
    requestAnimationFrame(() => {
      const targetEl = lineElementsRef.current.get(idx);
      if (!targetEl) return;
      targetEl.focus();
      const sel = window.getSelection();
      if (!sel) return;

      if (targetX !== undefined) {
        const doc = document as unknown as {
          createRange: () => Range;
          caretRangeFromPoint?: (x: number, y: number) => Range | null;
          caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
        };
        const rect = targetEl.getBoundingClientRect();
        const targetY = typeof position === 'boolean' && position ? Math.max(rect.top, rect.bottom - 6) : Math.min(rect.bottom, rect.top + 6);
        let pointRange: Range | null = null;
        if (typeof doc.caretRangeFromPoint === 'function') {
          pointRange = doc.caretRangeFromPoint(targetX, targetY);
        } else if (typeof doc.caretPositionFromPoint === 'function') {
          const pos = doc.caretPositionFromPoint(targetX, targetY);
          if (pos) {
            const r = doc.createRange();
            r.setStart(pos.offsetNode, pos.offset);
            r.collapse(true);
            pointRange = r;
          }
        }
        if (pointRange && targetEl.contains(pointRange.startContainer)) {
          sel.removeAllRanges();
          sel.addRange(pointRange);
          return;
        }
      }

      const range = document.createRange();
      if (typeof position === 'number') {
        let currentOffset = 0;
        let found = false;
        const traverse = (node: Node) => {
          if (found) return;
          if (node.nodeType === Node.TEXT_NODE) {
            const len = node.textContent?.length || 0;
            if (currentOffset + len >= position) {
              range.setStart(node, Math.min(position - currentOffset, len));
              range.collapse(true);
              found = true;
              return;
            }
            currentOffset += len;
          } else {
            for (let i = 0; i < node.childNodes.length; i++) {
              traverse(node.childNodes[i]);
              if (found) return;
            }
          }
        };
        traverse(targetEl);
        if (!found) {
          range.selectNodeContents(targetEl);
          range.collapse(false);
        }
      } else {
        range.selectNodeContents(targetEl);
        range.collapse(!position);
      }

      sel.removeAllRanges();
      sel.addRange(range);
    });
  }, []);

  const handleUpdateLine = useCallback((idx: number, nextRaw: string) => {
    const nextLines = [...lines];
    nextLines[idx] = nextRaw;
    onChangeContent(nextLines.join('\n'));
  }, [lines, onChangeContent]);

  const handleSplitLine = useCallback((idx: number, beforeRaw: string, afterRaw: string, focusToEnd = false) => {
    const nextLines = [...lines];
    const extraLines = afterRaw.split('\n');
    nextLines.splice(idx, 1, beforeRaw, ...extraLines);
    onChangeContent(nextLines.join('\n'));
    const nextFocusIdx = idx + 1;
    activeCursorLineRef.current = nextFocusIdx;
    focusLineAt(nextFocusIdx, focusToEnd);
  }, [lines, onChangeContent, activeCursorLineRef, focusLineAt]);

  const handlePasteLines = useCallback((idx: number, newLines: string[], targetOffset?: number) => {
    const nextLines = [...lines];
    nextLines.splice(idx, 1, ...newLines);
    onChangeContent(nextLines.join('\n'));
    const nextFocusIdx = idx + newLines.length - 1;
    activeCursorLineRef.current = nextFocusIdx;
    focusLineAt(nextFocusIdx, targetOffset !== undefined ? targetOffset : true);
  }, [lines, onChangeContent, activeCursorLineRef, focusLineAt]);

  const handleMergeWithPrev = useCallback((idx: number, currentTailRaw: string) => {
    if (idx <= 0) return;
    const nextLines = [...lines];
    const prevLine = nextLines[idx - 1];
    if (EMBED_REGEX.test(prevLine.trim())) {
      nextLines.splice(idx - 1, 1);
      onChangeContent(nextLines.join('\n'));
      focusLineAt(idx - 1, false);
      return;
    }
    const prevTaskMatch = prevLine.match(/^(\s*[-*]\s+)\[([ xX])\]\s*(.*)$/);
    const prevHMatch = !prevTaskMatch ? prevLine.match(/^#{1,3}\s+(.*)$/) : null;
    const prevBulletMatch = !prevTaskMatch && !prevHMatch ? prevLine.match(/^(\s*[-*]\s+)(.*)$/) : null;
    const prevBody = prevTaskMatch ? prevTaskMatch[3] : prevHMatch ? prevHMatch[1] : prevBulletMatch ? prevBulletMatch[2] : prevLine;
    const junctionOffset = prevBody.length;

    nextLines.splice(idx - 1, 2, `${prevLine}${currentTailRaw}`);
    onChangeContent(nextLines.join('\n'));
    activeCursorLineRef.current = idx - 1;
    focusLineAt(idx - 1, junctionOffset);
  }, [lines, onChangeContent, activeCursorLineRef, focusLineAt]);

  const handleToggleCheckbox = useCallback((idx: number) => {
    const targetLine = lines[idx];
    if (targetLine === undefined) return;
    const match = targetLine.match(/^(\s*[-*]\s+\[)( |x|X)(\])(.*)$/);
    if (match) {
      const isChecked = match[2].toLowerCase() === 'x';
      if (!isChecked) playTaskCompleteSound();
      const nextLines = [...lines];
      nextLines[idx] = `${match[1]}${isChecked ? ' ' : 'x'}${match[3]}${match[4]}`;
      onChangeContent(nextLines.join('\n'));
    }
  }, [lines, onChangeContent]);

  const handleNavigateLine = useCallback((fromIdx: number, dir: 'up' | 'down', targetX?: number) => {
    let step = dir === 'up' ? fromIdx - 1 : fromIdx + 1;
    while (step >= 0 && step < lines.length) {
      if (!EMBED_REGEX.test(lines[step].trim())) {
        activeCursorLineRef.current = step;
        focusLineAt(step, dir === 'up', targetX);
        return;
      }
      step = dir === 'up' ? step - 1 : step + 1;
    }
  }, [lines, activeCursorLineRef, focusLineAt]);

  const handlePasteImageAtLine = useCallback((idx: number, e: React.ClipboardEvent): boolean => {
    const hasPlainText = Boolean(e.clipboardData.getData('text/plain'));
    if (!hasClipboardImageContent(e.clipboardData) && hasPlainText) return false;
    e.preventDefault();
    e.stopPropagation();
    processImageDropOrPaste(e, t('note.pastedImage')).then((newSketches) => {
      if (newSketches.length > 0) onAttachSketchesAtLine(newSketches, idx);
    });
    return true;
  }, [onAttachSketchesAtLine, t]);

  const handleLinePointerDown = useCallback(
    (lineIdx: number, charOffset: number, e: React.MouseEvent) => {
      if (e.button !== 0) return;

      if (e.shiftKey && dragAnchorRef.current) {
        e.preventDefault();
        const { line: anchorLine, offset: anchorOffset } = dragAnchorRef.current;
        const range = createCrossLineRange(anchorLine, anchorOffset, lineIdx, charOffset);
        setCrossSelection(range);
        window.getSelection()?.removeAllRanges();
        sheetContainerRef.current?.focus({ preventScroll: true });
        return;
      }

      isMouseDownRef.current = true;
      setIsDraggingMouse(true);
      setToolbarCoords(null);
      dragAnchorRef.current = { line: lineIdx, offset: charOffset };
      if (crossSelection) {
        setCrossSelection(null);
      }
    },
    [crossSelection]
  );

  const handleLinePointerMove = useCallback(
    (lineIdx: number, charOffset: number) => {
      if (!isMouseDownRef.current || !dragAnchorRef.current) return;
      const { line: anchorLine, offset: anchorOffset } = dragAnchorRef.current;

      // While dragging inside the same starting line before crossing lines, preserve native browser selection
      if (anchorLine === lineIdx && crossSelection === null) {
        return;
      }

      if (anchorLine === lineIdx && charOffset === anchorOffset) {
        if (crossSelection !== null) setCrossSelection(null);
        return;
      }

      const nextRange = createCrossLineRange(anchorLine, anchorOffset, lineIdx, charOffset);
      setCrossSelection(nextRange);
      window.getSelection()?.removeAllRanges();
    },
    [crossSelection]
  );

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isMouseDownRef.current) {
        isMouseDownRef.current = false;
        setIsDraggingMouse(false);
        if (crossSelection) {
          sheetContainerRef.current?.focus({ preventScroll: true });
        }
      }
    };
    const handleDocumentClick = (e: MouseEvent) => {
      if (crossSelection && sheetContainerRef.current) {
        if (!sheetContainerRef.current.contains(e.target as Node)) {
          setCrossSelection(null);
        }
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('mousedown', handleDocumentClick);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, [crossSelection]);

  const handleStartOrExtendCrossSelection = useCallback(
    (
      fromLineIdx: number,
      anchorOffset: number,
      focusOffset: number,
      dir: 'left' | 'right' | 'up' | 'down',
      byWord: boolean
    ) => {
      const baseRange =
        crossSelection ?? createCrossLineRange(fromLineIdx, anchorOffset, fromLineIdx, focusOffset);
      const nextRange = extendCrossLineRangeByKey(lines, baseRange, dir, byWord);

      if (
        nextRange.startLine === nextRange.endLine &&
        nextRange.startOffset === nextRange.endOffset
      ) {
        setCrossSelection(null);
        activeCursorLineRef.current = nextRange.focusLine;
        focusLineAt(nextRange.focusLine, nextRange.focusOffset);
        return;
      }

      dragAnchorRef.current = { line: nextRange.anchorLine, offset: nextRange.anchorOffset };
      setCrossSelection(nextRange);
      window.getSelection()?.removeAllRanges();
      sheetContainerRef.current?.focus({ preventScroll: true });
    },
    [crossSelection, lines, activeCursorLineRef, focusLineAt]
  );

  const handleApplyFormatToCrossRange = useCallback(
    (range: CrossLineTextRange, action: RichFormatAction) => {
      const { lines: nextLines, range: updatedRange } = applyFormatToCrossLineRange(
        lines,
        range,
        action
      );
      onChangeContent(nextLines.join('\n'));
      setCrossSelection(updatedRange);
    },
    [lines, onChangeContent]
  );

  useEffect(() => {
    if (!crossSelection || isDraggingMouse) {
      if (activeApplyFormatRef.current === applyFormatToRangeRef.current) {
        setToolbarCoords(null);
        activeApplyFormatRef.current = null;
      }
      return;
    }
    const targetEl = lineElementsRef.current.get(crossSelection.startLine);
    if (!targetEl) return;
    const markEl = targetEl.querySelector('mark[data-udo-sel="true"]') as HTMLElement | null;
    const rect = (markEl || targetEl).getBoundingClientRect();
    const hostRect = targetEl.getBoundingClientRect();
    const x = rect.width > 0 ? rect.left + rect.width / 2 : hostRect.left + hostRect.width / 2;
    const y = Math.max(20, rect.top > 0 ? rect.top : hostRect.top);
    const applyFn = (action: RichFormatAction) => {
      handleApplyFormatToCrossRange(crossSelection, action);
    };
    applyFormatToRangeRef.current = applyFn;
    activeApplyFormatRef.current = applyFn;
    setToolbarCoords({ x, y });
  }, [crossSelection, isDraggingMouse, handleApplyFormatToCrossRange]);

  const handleSelectionChange = useCallback(
    (coords: { x: number; y: number } | null, applyFn: (action: RichFormatAction) => void) => {
      if (crossSelection) return;
      activeApplyFormatRef.current = applyFn;
      setToolbarCoords(coords);
    },
    [crossSelection]
  );

  const handleSelectAllDocument = useCallback(() => {
    const lastIdx = Math.max(0, lines.length - 1);
    const lastLen = getVisibleLineLength(lines[lastIdx] || '');
    const fullRange = createCrossLineRange(0, 0, lastIdx, lastLen);
    dragAnchorRef.current = { line: 0, offset: 0 };
    setCrossSelection(fullRange);
    window.getSelection()?.removeAllRanges();
    sheetContainerRef.current?.focus({ preventScroll: true });
  }, [lines]);

  const handleSheetContextMenu = (e: React.MouseEvent) => {
    openContextMenu(e, [
      { id: 'cut', label: t('editor.cut'), icon: <Scissors size={14} />, shortcut: 'Ctrl+X', onClick: () => {
        if (crossSelection) {
          const text = extractPlainTextFromCrossLineRange(lines, crossSelection);
          navigator.clipboard.writeText(text);
          const res = deleteOrReplaceCrossLineRange(lines, crossSelection, '');
          onChangeContent(res.lines.join('\n'));
          setCrossSelection(null);
          activeCursorLineRef.current = res.cursorLine;
          focusLineAt(res.cursorLine, res.cursorOffset);
        } else {
          document.execCommand('cut');
        }
      }},
      { id: 'copy', label: t('editor.copy'), icon: <Copy size={14} />, shortcut: 'Ctrl+C', onClick: () => {
        if (crossSelection) {
          const text = extractPlainTextFromCrossLineRange(lines, crossSelection);
          navigator.clipboard.writeText(text);
        } else {
          document.execCommand('copy');
        }
      }},
      { id: 'paste', label: t('editor.paste'), icon: <Clipboard size={14} />, shortcut: 'Ctrl+V', onClick: async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
            if (crossSelection) {
              const res = deleteOrReplaceCrossLineRange(lines, crossSelection, text);
              onChangeContent(res.lines.join('\n'));
              setCrossSelection(null);
              activeCursorLineRef.current = res.cursorLine;
              focusLineAt(res.cursorLine, res.cursorOffset);
              return;
            }
            const idx = Math.max(0, Math.min(activeCursorLineRef.current, lines.length - 1));
            const pasteLines = text.replace(/\r\n?/g, '\n').split('\n');
            const nextLines = [...lines];
            const currentLine = nextLines[idx] || '';
            if (pasteLines.length === 1) {
              nextLines[idx] = `${currentLine}${pasteLines[0]}`;
              onChangeContent(nextLines.join('\n'));
              focusLineAt(idx, true);
            } else {
              const firstLine = `${currentLine}${pasteLines[0]}`;
              const rest = pasteLines.slice(1);
              nextLines.splice(idx, 1, firstLine, ...rest);
              onChangeContent(nextLines.join('\n'));
              const targetIdx = idx + pasteLines.length - 1;
              activeCursorLineRef.current = targetIdx;
              focusLineAt(targetIdx, true);
            }
          }
        } catch {}
      }},
      { id: 'sep-1', label: '', separator: true },
      { id: 'insert-task', label: t('editor.insertTask'), icon: <CheckSquare size={14} />, onClick: () => {
        const idx = Math.min(activeCursorLineRef.current, lines.length - 1);
        const nextLines = [...lines];
        if (!(nextLines[idx] || '').trim()) nextLines[idx] = '- [ ] ';
        else nextLines.splice(idx + 1, 0, '- [ ] ');
        onChangeContent(nextLines.join('\n'));
      }},
      { id: 'find', label: t('editor.find'), icon: <Search size={14} />, shortcut: 'Ctrl+F', onClick: () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true })) },
    ]);
  };

  const handleMoveLine = useCallback(
    (fromIdx: number, toIdx: number) => {
      if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || fromIdx >= lines.length || toIdx >= lines.length) return;
      const nextLines = [...lines];
      const [moved] = nextLines.splice(fromIdx, 1);
      nextLines.splice(toIdx, 0, moved);
      onChangeContent(nextLines.join('\n'));
    },
    [lines, onChangeContent]
  );

  let maxBottom = 380;
  boundsMap.forEach((b) => {
    if (b.top + b.height + 80 > maxBottom) maxBottom = b.top + b.height + 80;
  });

  return (
    <div
      ref={sheetContainerRef}
      tabIndex={-1}
      onContextMenu={handleSheetContextMenu}
      onKeyDown={(e) => {
        const isCtrl = e.ctrlKey || e.metaKey;

        // Granular cross-line selection keyboard operations
        if (crossSelection) {
          if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'b') {
            e.preventDefault();
            handleApplyFormatToCrossRange(crossSelection, { type: 'bold' });
            return;
          }
          if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'i') {
            e.preventDefault();
            handleApplyFormatToCrossRange(crossSelection, { type: 'italic' });
            return;
          }
          if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'u') {
            e.preventDefault();
            handleApplyFormatToCrossRange(crossSelection, { type: 'underline' });
            return;
          }

          if (isCtrl && e.key.toLowerCase() === 'c') {
            e.preventDefault();
            const text = extractPlainTextFromCrossLineRange(lines, crossSelection);
            navigator.clipboard.writeText(text);
            return;
          }

          if (isCtrl && e.key.toLowerCase() === 'x') {
            e.preventDefault();
            const text = extractPlainTextFromCrossLineRange(lines, crossSelection);
            navigator.clipboard.writeText(text);
            const res = deleteOrReplaceCrossLineRange(lines, crossSelection, '');
            onChangeContent(res.lines.join('\n'));
            setCrossSelection(null);
            activeCursorLineRef.current = res.cursorLine;
            focusLineAt(res.cursorLine, res.cursorOffset);
            return;
          }

          if (isCtrl && e.key.toLowerCase() === 'v') {
            e.preventDefault();
            navigator.clipboard
              .readText()
              .then((text) => {
                if (!text) return;
                const res = deleteOrReplaceCrossLineRange(lines, crossSelection, text);
                onChangeContent(res.lines.join('\n'));
                setCrossSelection(null);
                activeCursorLineRef.current = res.cursorLine;
                focusLineAt(res.cursorLine, res.cursorOffset);
              })
              .catch(() => {});
            return;
          }

          if (e.key === 'Backspace' || e.key === 'Delete') {
            e.preventDefault();
            const res = deleteOrReplaceCrossLineRange(lines, crossSelection, '');
            onChangeContent(res.lines.join('\n'));
            setCrossSelection(null);
            activeCursorLineRef.current = res.cursorLine;
            focusLineAt(res.cursorLine, res.cursorOffset);
            return;
          }

          if (e.key === 'Enter') {
            e.preventDefault();
            const res = deleteOrReplaceCrossLineRange(lines, crossSelection, '\n');
            onChangeContent(res.lines.join('\n'));
            setCrossSelection(null);
            activeCursorLineRef.current = res.cursorLine;
            focusLineAt(res.cursorLine, res.cursorOffset);
            return;
          }

          if (!isCtrl && !e.altKey && e.key.length === 1) {
            e.preventDefault();
            const res = deleteOrReplaceCrossLineRange(lines, crossSelection, e.key);
            onChangeContent(res.lines.join('\n'));
            setCrossSelection(null);
            activeCursorLineRef.current = res.cursorLine;
            focusLineAt(res.cursorLine, res.cursorOffset);
            return;
          }

          if (e.shiftKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            const dirMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
              ArrowUp: 'up',
              ArrowDown: 'down',
              ArrowLeft: 'left',
              ArrowRight: 'right',
            };
            handleStartOrExtendCrossSelection(
              crossSelection.focusLine,
              crossSelection.anchorOffset,
              crossSelection.focusOffset,
              dirMap[e.key],
              isCtrl
            );
            return;
          }

          if (!e.shiftKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape'].includes(e.key)) {
            e.preventDefault();
            const collapseToStart = e.key === 'ArrowUp' || e.key === 'ArrowLeft';
            const targetIdx = collapseToStart ? crossSelection.startLine : crossSelection.endLine;
            const targetOffset = collapseToStart ? crossSelection.startOffset : crossSelection.endOffset;
            setCrossSelection(null);
            activeCursorLineRef.current = targetIdx;
            focusLineAt(targetIdx, targetOffset);
            return;
          }
        }

        // Ctrl + A (Select All document text)
        if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'a') {
          e.preventDefault();
          handleSelectAllDocument();
          return;
        }

        if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'z') {
          e.preventDefault();
          setCrossSelection(null);
          onUndoText?.();
        } else if ((isCtrl && e.key.toLowerCase() === 'y') || (isCtrl && e.shiftKey && e.key.toLowerCase() === 'z')) {
          e.preventDefault();
          setCrossSelection(null);
          onRedoText?.();
        }
      }}
      style={{ minHeight: `${maxBottom}px` }}
      className="relative py-1 space-y-1 text-sm text-theme-text leading-relaxed select-text outline-none"
    >
      <RichTextToolbar
        inputRef={sheetContainerRef}
        coords={toolbarCoords}
        onApplyFormat={(action) => activeApplyFormatRef.current?.(action)}
        onClose={() => setToolbarCoords(null)}
      />

      {/* Capa 2: Free Universal Media Layer */}
      <FreeMediaLayer
        sketches={sketches} attachments={attachments}
        onUpdateSketch={onUpdateSketch} onRemoveSketch={onRemoveSketch}
        onOpenSketchAnnotator={onOpenSketchAnnotator}
        onUpdateAttachment={onUpdateAttachment || (() => {})}
        onRemoveAttachment={onRemoveAttachment} onRenameAttachment={onRenameAttachment}
        reportBounds={handleReportBounds} unregisterBounds={handleUnregisterBounds}
      />

      {/* Capa 1: Continuous Flat Text Lines */}
      {lines.map((line, idx) => {
        const embedMatch = line.trim().match(EMBED_REGEX);
        if (embedMatch) {
          const [, rawKind, itemId] = embedMatch;
          const kind = rawKind.toLowerCase();
          if (kind === 'sketch' || kind === 'attachment') return null;
          if (kind === 'link') {
            const lnk = links.find((l) => l.id === itemId);
            return lnk ? (
              <InlineLinkBlock
                key={`lnk-${lnk.id}-${idx}`}
                link={lnk}
                lineIndex={idx}
                exclusionPadding={getLineExclusion(idx)}
                registerLineEl={registerLineEl}
                onRemove={onRemoveLink}
                onMoveUp={idx > 0 ? () => handleMoveLine(idx, idx - 1) : undefined}
                onMoveDown={idx < lines.length - 1 ? () => handleMoveLine(idx, idx + 1) : undefined}
                onMoveLine={handleMoveLine}
              />
            ) : null;
          }
        }

        const lineVisibleLen = crossSelection ? getVisibleLineLength(line) : 0;
        const selectionSlice = crossSelection
          ? getLineSelectionSlice(idx, lineVisibleLen, crossSelection)
          : undefined;

        return (
          <EditableTextLine
            key={`line-${idx}`}
            lineIndex={idx}
            totalLines={lines.length}
            rawLine={line}
            notes={notes}
            selectionSlice={selectionSlice}
            onLinePointerDown={handleLinePointerDown}
            onLinePointerMove={handleLinePointerMove}
            onStartOrExtendCrossSelection={(anchorOffset, focusOffset, dir, byWord) =>
              handleStartOrExtendCrossSelection(idx, anchorOffset, focusOffset, dir, byWord)
            }
            onSelectAll={handleSelectAllDocument}
            placeholder={idx === 0 && lines.length === 1 ? t('note.flatSheetPlaceholder') : undefined}
            exclusionPadding={getLineExclusion(idx)}
            onUpdateLine={handleUpdateLine}
            onSplitLine={handleSplitLine}
            onPasteLines={handlePasteLines}
            onMergeWithPrev={handleMergeWithPrev}
            onToggleCheckbox={handleToggleCheckbox}
            onFocusLine={(i) => {
              activeCursorLineRef.current = i;
              if (crossSelection && (i < crossSelection.startLine || i > crossSelection.endLine)) {
                setCrossSelection(null);
              }
            }}
            onSelectionChange={handleSelectionChange}
            onNavigateLine={handleNavigateLine}
            onSelectNote={onSelectNote}
            onCreateNoteWithTitle={onCreateNoteWithTitle}
            onPasteImageAtLine={handlePasteImageAtLine}
            registerLineEl={registerLineEl}
            onMoveLine={handleMoveLine}
          />
        );
      })}

      {orphanLinks.map((lnk, orphanIdx) => {
        const orphanLineIdx = lines.length + orphanIdx;
        return (
          <InlineLinkBlock
            key={`legacy-lnk-${lnk.id}`}
            link={lnk}
            lineIndex={orphanLineIdx}
            exclusionPadding={getLineExclusion(orphanLineIdx)}
            registerLineEl={registerLineEl}
            onRemove={onRemoveLink}
          />
        );
      })}

      <div
        onClick={() => {
          const lastIdx = Math.max(0, lines.length - 1);
          activeCursorLineRef.current = lastIdx;
          focusLineAt(lastIdx, true);
        }}
        className="clear-both min-h-[140px] w-full cursor-text"
      />
    </div>
  );
};
