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

interface LineRange {
  anchor: number;
  current: number;
  start: number;
  end: number;
}

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

  const [selectedLineRange, setSelectedLineRange] = useState<LineRange | null>(null);
  const isMouseDownRef = useRef<boolean>(false);
  const dragStartLineRef = useRef<number | null>(null);
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

  const handleLineMouseDown = useCallback((lineIdx: number, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isMouseDownRef.current = true;
    dragStartLineRef.current = lineIdx;
    if (selectedLineRange) {
      setSelectedLineRange(null);
    }
  }, [selectedLineRange]);

  const handleLineMouseEnter = useCallback((lineIdx: number) => {
    if (!isMouseDownRef.current || dragStartLineRef.current === null) return;
    const anchor = dragStartLineRef.current;
    if (anchor === lineIdx) {
      if (selectedLineRange !== null) setSelectedLineRange(null);
      return;
    }
    const start = Math.min(anchor, lineIdx);
    const end = Math.max(anchor, lineIdx);
    setSelectedLineRange({ anchor, current: lineIdx, start, end });
    window.getSelection()?.removeAllRanges();
  }, [selectedLineRange]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isMouseDownRef.current = false;
      dragStartLineRef.current = null;
    };
    const handleDocumentClick = (e: MouseEvent) => {
      if (selectedLineRange && sheetContainerRef.current) {
        if (!sheetContainerRef.current.contains(e.target as Node)) {
          setSelectedLineRange(null);
        }
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('mousedown', handleDocumentClick);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, [selectedLineRange]);

  const handleExtendSelection = useCallback((fromIdx: number, dir: 'up' | 'down') => {
    setSelectedLineRange((prev) => {
      const anchor = prev ? prev.anchor : fromIdx;
      const current = prev ? prev.current : fromIdx;
      let newCurrent = dir === 'up' ? current - 1 : current + 1;
      newCurrent = Math.max(0, Math.min(newCurrent, lines.length - 1));
      if (newCurrent === anchor && prev && prev.current !== anchor) {
        return null;
      }
      const start = Math.min(anchor, newCurrent);
      const end = Math.max(anchor, newCurrent);
      return { anchor, current: newCurrent, start, end };
    });
    window.getSelection()?.removeAllRanges();
  }, [lines.length]);

  const handleApplyFormatToRange = useCallback((startIdx: number, endIdx: number, action: RichFormatAction) => {
    const nextLines = [...lines];
    for (let i = startIdx; i <= endIdx; i++) {
      const cur = nextLines[i] || '';
      if (!cur.trim()) continue;
      if (action.type === 'bold') {
        nextLines[i] = cur.startsWith('**') && cur.endsWith('**') ? cur.slice(2, -2) : `**${cur}**`;
      } else if (action.type === 'italic') {
        nextLines[i] = cur.startsWith('*') && cur.endsWith('*') ? cur.slice(1, -1) : `*${cur}*`;
      } else if (action.type === 'underline') {
        nextLines[i] = cur.startsWith('<u>') && cur.endsWith('</u>') ? cur.slice(3, -4) : `<u>${cur}</u>`;
      } else if (action.type === 'strikethrough') {
        nextLines[i] = cur.startsWith('~~') && cur.endsWith('~~') ? cur.slice(2, -2) : `~~${cur}~~`;
      } else if (action.type === 'color' && action.hex) {
        nextLines[i] = `[color=${action.hex}]${cur}[/color]`;
      } else if (action.type === 'bg' && action.hex) {
        nextLines[i] = `[bg=${action.hex}]${cur}[/bg]`;
      } else if (action.type === 'size' && action.size) {
        nextLines[i] = `[size=${action.size}]${cur}[/size]`;
      }
    }
    onChangeContent(nextLines.join('\n'));
  }, [lines, onChangeContent]);

  useEffect(() => {
    if (!selectedLineRange) {
      if (activeApplyFormatRef.current === applyFormatToRangeRef.current) {
        setToolbarCoords(null);
        activeApplyFormatRef.current = null;
      }
      return;
    }
    const targetEl = lineElementsRef.current.get(selectedLineRange.start);
    if (!targetEl) return;
    const rect = targetEl.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = Math.max(20, rect.top);
    const applyFn = (action: RichFormatAction) => {
      handleApplyFormatToRange(selectedLineRange.start, selectedLineRange.end, action);
    };
    applyFormatToRangeRef.current = applyFn;
    activeApplyFormatRef.current = applyFn;
    setToolbarCoords({ x, y });
  }, [selectedLineRange, handleApplyFormatToRange]);

  const handleSelectionChange = useCallback(
    (coords: { x: number; y: number } | null, applyFn: (action: RichFormatAction) => void) => {
      if (selectedLineRange) return;
      activeApplyFormatRef.current = applyFn;
      setToolbarCoords(coords);
    },
    [selectedLineRange]
  );

  const handleSheetContextMenu = (e: React.MouseEvent) => {
    openContextMenu(e, [
      { id: 'cut', label: t('editor.cut'), icon: <Scissors size={14} />, shortcut: 'Ctrl+X', onClick: () => {
        if (selectedLineRange) {
          const text = lines.slice(selectedLineRange.start, selectedLineRange.end + 1).join('\n');
          navigator.clipboard.writeText(text);
          const nextLines = [...lines];
          nextLines.splice(selectedLineRange.start, selectedLineRange.end - selectedLineRange.start + 1, '');
          onChangeContent(nextLines.join('\n'));
          const targetIdx = selectedLineRange.start;
          setSelectedLineRange(null);
          focusLineAt(targetIdx, false);
        } else {
          document.execCommand('cut');
        }
      }},
      { id: 'copy', label: t('editor.copy'), icon: <Copy size={14} />, shortcut: 'Ctrl+C', onClick: () => {
        if (selectedLineRange) {
          const text = lines.slice(selectedLineRange.start, selectedLineRange.end + 1).join('\n');
          navigator.clipboard.writeText(text);
        } else {
          document.execCommand('copy');
        }
      }},
      { id: 'paste', label: t('editor.paste'), icon: <Clipboard size={14} />, shortcut: 'Ctrl+V', onClick: async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
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
      onContextMenu={handleSheetContextMenu}
      onKeyDown={(e) => {
        const isCtrl = e.ctrlKey || e.metaKey;

        // Multi-line selection keyboard operations
        if (selectedLineRange) {
          if (isCtrl && e.key.toLowerCase() === 'c') {
            e.preventDefault();
            const text = lines.slice(selectedLineRange.start, selectedLineRange.end + 1).join('\n');
            navigator.clipboard.writeText(text);
            return;
          }

          if (isCtrl && e.key.toLowerCase() === 'x') {
            e.preventDefault();
            const text = lines.slice(selectedLineRange.start, selectedLineRange.end + 1).join('\n');
            navigator.clipboard.writeText(text);
            const nextLines = [...lines];
            nextLines.splice(selectedLineRange.start, selectedLineRange.end - selectedLineRange.start + 1, '');
            onChangeContent(nextLines.join('\n'));
            const targetIdx = selectedLineRange.start;
            setSelectedLineRange(null);
            activeCursorLineRef.current = targetIdx;
            focusLineAt(targetIdx, false);
            return;
          }

          if (e.key === 'Backspace' || e.key === 'Delete') {
            e.preventDefault();
            const nextLines = [...lines];
            nextLines.splice(selectedLineRange.start, selectedLineRange.end - selectedLineRange.start + 1, '');
            onChangeContent(nextLines.join('\n'));
            const targetIdx = selectedLineRange.start;
            setSelectedLineRange(null);
            activeCursorLineRef.current = targetIdx;
            focusLineAt(targetIdx, false);
            return;
          }

          if (e.key === 'Enter') {
            e.preventDefault();
            const nextLines = [...lines];
            nextLines.splice(selectedLineRange.start, selectedLineRange.end - selectedLineRange.start + 1, '', '');
            onChangeContent(nextLines.join('\n'));
            const targetIdx = selectedLineRange.start + 1;
            setSelectedLineRange(null);
            activeCursorLineRef.current = targetIdx;
            focusLineAt(targetIdx, false);
            return;
          }

          if (!isCtrl && !e.altKey && e.key.length === 1) {
            e.preventDefault();
            const nextLines = [...lines];
            nextLines.splice(selectedLineRange.start, selectedLineRange.end - selectedLineRange.start + 1, e.key);
            onChangeContent(nextLines.join('\n'));
            const targetIdx = selectedLineRange.start;
            setSelectedLineRange(null);
            activeCursorLineRef.current = targetIdx;
            focusLineAt(targetIdx, true);
            return;
          }

          if (e.shiftKey && e.key === 'ArrowUp') {
            e.preventDefault();
            handleExtendSelection(selectedLineRange.current, 'up');
            return;
          }

          if (e.shiftKey && e.key === 'ArrowDown') {
            e.preventDefault();
            handleExtendSelection(selectedLineRange.current, 'down');
            return;
          }

          if (!e.shiftKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape'].includes(e.key)) {
            e.preventDefault();
            const targetIdx = (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ? selectedLineRange.start : selectedLineRange.end;
            setSelectedLineRange(null);
            activeCursorLineRef.current = targetIdx;
            focusLineAt(targetIdx, e.key === 'ArrowRight' || e.key === 'ArrowDown');
            return;
          }
        }

        // Ctrl + A (Select All lines)
        if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'a') {
          e.preventDefault();
          setSelectedLineRange({
            anchor: 0,
            current: lines.length - 1,
            start: 0,
            end: lines.length - 1,
          });
          window.getSelection()?.removeAllRanges();
          return;
        }

        if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'z') {
          e.preventDefault();
          onUndoText?.();
        } else if ((isCtrl && e.key.toLowerCase() === 'y') || (isCtrl && e.shiftKey && e.key.toLowerCase() === 'z')) {
          e.preventDefault();
          onRedoText?.();
        }
      }}
      style={{ minHeight: `${maxBottom}px` }}
      className="relative py-1 space-y-1 text-sm text-theme-text leading-relaxed select-text"
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

        const isLineSelected =
          selectedLineRange !== null && idx >= selectedLineRange.start && idx <= selectedLineRange.end;

        return (
          <EditableTextLine
            key={`line-${idx}`}
            lineIndex={idx}
            totalLines={lines.length}
            rawLine={line}
            notes={notes}
            isSelected={isLineSelected}
            onMouseDown={(e) => handleLineMouseDown(idx, e)}
            onMouseEnter={() => handleLineMouseEnter(idx)}
            onExtendSelection={(dir) => handleExtendSelection(idx, dir)}
            onSelectAll={() => {
              setSelectedLineRange({
                anchor: 0,
                current: lines.length - 1,
                start: 0,
                end: lines.length - 1,
              });
              window.getSelection()?.removeAllRanges();
            }}
            placeholder={idx === 0 && lines.length === 1 ? t('note.flatSheetPlaceholder') : undefined}
            exclusionPadding={getLineExclusion(idx)}
            onUpdateLine={handleUpdateLine}
            onSplitLine={handleSplitLine}
            onPasteLines={handlePasteLines}
            onMergeWithPrev={handleMergeWithPrev}
            onToggleCheckbox={handleToggleCheckbox}
            onFocusLine={(i) => {
              activeCursorLineRef.current = i;
              if (selectedLineRange && (i < selectedLineRange.start || i > selectedLineRange.end)) {
                setSelectedLineRange(null);
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
