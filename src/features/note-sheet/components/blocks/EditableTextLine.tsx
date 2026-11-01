import React, { useRef, useEffect, useCallback } from 'react';
import { CheckSquare, Square, FileText } from 'lucide-react';
import { NoteItem } from '../../../../shared/types';
import {
  storedToVisualHtmlWithSelection,
  visualHtmlToStored,
  storedToPlainText,
} from '../../utils/richTextHtmlCodec';
import { RichFormatAction } from '../RichTextToolbar';
import { applyFormatToContentEditable } from '../../utils/richTextDomCommands';
import { useTranslation } from 'react-i18next';

interface Props {
  lineIndex: number;
  totalLines?: number;
  rawLine: string;
  notes: NoteItem[];
  selectionSlice?: { start: number; end: number };
  onLinePointerDown?: (lineIdx: number, charOffset: number, e: React.MouseEvent) => void;
  onLinePointerMove?: (lineIdx: number, charOffset: number, e: React.MouseEvent) => void;
  onStartOrExtendCrossSelection?: (
    anchorOffset: number,
    focusOffset: number,
    dir: 'left' | 'right' | 'up' | 'down',
    byWord: boolean
  ) => void;
  onSelectAll?: () => void;
  placeholder?: string;
  exclusionPadding?: { left?: number; right?: number; marginTop?: number };
  onUpdateLine: (idx: number, nextRaw: string) => void;
  onSplitLine: (idx: number, beforeRaw: string, afterRaw: string, focusToEnd?: boolean) => void;
  onPasteLines?: (idx: number, newLines: string[], targetOffset?: number) => void;
  onMergeWithPrev: (idx: number, currentTailRaw: string) => void;
  onToggleCheckbox: (idx: number) => void;
  onFocusLine: (idx: number, el: HTMLDivElement) => void;
  onSelectionChange: (coords: { x: number; y: number } | null, applyFn: (action: RichFormatAction) => void) => void;
  onNavigateLine: (fromIdx: number, dir: 'up' | 'down', targetX?: number) => void;
  onSelectNote: (noteId: string, subjectId: string) => void;
  onCreateNoteWithTitle: (title: string) => void;
  onPasteImageAtLine: (idx: number, e: React.ClipboardEvent) => boolean;
  registerLineEl: (idx: number, el: HTMLDivElement | null) => void;
  onMoveLine?: (fromIdx: number, toIdx: number) => void;
}

export function getCharOffsetFromPointWithin(
  el: HTMLElement,
  clientX: number,
  clientY: number
): number {
  const totalText = el.textContent || '';
  const totalLen = Array.from(totalText).length;
  if (totalLen === 0) return 0;

  const rect = el.getBoundingClientRect();
  const clampedX = Math.max(rect.left + 2, Math.min(clientX, rect.right - 2));
  const clampedY = Math.max(rect.top + 4, Math.min(clientY, rect.bottom - 4));

  const doc = document as unknown as {
    createRange: () => Range;
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
  };

  let pointRange: Range | null = null;
  if (typeof doc.caretRangeFromPoint === 'function') {
    pointRange = doc.caretRangeFromPoint(clampedX, clampedY);
  } else if (typeof doc.caretPositionFromPoint === 'function') {
    const pos = doc.caretPositionFromPoint(clampedX, clampedY);
    if (pos) {
      const r = doc.createRange();
      r.setStart(pos.offsetNode, pos.offset);
      r.collapse(true);
      pointRange = r;
    }
  }

  if (pointRange && el.contains(pointRange.startContainer)) {
    const preRange = document.createRange();
    preRange.selectNodeContents(el);
    preRange.setEnd(pointRange.startContainer, pointRange.startOffset);
    return Math.min(totalLen, Array.from(preRange.toString()).length);
  }

  return clientX <= rect.left + rect.width / 2 ? 0 : totalLen;
}

function getSelectionOffsetsWithin(el: HTMLElement): {
  anchorOffset: number;
  focusOffset: number;
  totalLen: number;
} {
  const totalLen = Array.from(el.textContent || '').length;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !sel.anchorNode || !sel.focusNode) {
    return { anchorOffset: 0, focusOffset: 0, totalLen };
  }

  let anchorOffset = 0;
  if (el.contains(sel.anchorNode)) {
    const r = document.createRange();
    r.selectNodeContents(el);
    r.setEnd(sel.anchorNode, sel.anchorOffset);
    anchorOffset = Math.min(totalLen, Array.from(r.toString()).length);
  }

  let focusOffset = anchorOffset;
  if (el.contains(sel.focusNode)) {
    const r = document.createRange();
    r.selectNodeContents(el);
    r.setEnd(sel.focusNode, sel.focusOffset);
    focusOffset = Math.min(totalLen, Array.from(r.toString()).length);
  }

  return { anchorOffset, focusOffset, totalLen };
}

function isCaretAtStart(el: HTMLElement): boolean {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return false;
  const range = sel.getRangeAt(0);
  if (!el.contains(range.startContainer)) return false;
  const preRange = range.cloneRange();
  preRange.selectNodeContents(el);
  preRange.setEnd(range.startContainer, range.startOffset);
  return preRange.toString().length === 0;
}

function isCaretAtEnd(el: HTMLElement): boolean {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return false;
  const range = sel.getRangeAt(0);
  if (!el.contains(range.endContainer)) return false;
  const postRange = range.cloneRange();
  postRange.selectNodeContents(el);
  postRange.setStart(range.endContainer, range.endOffset);
  return postRange.toString().length === 0;
}

function isCaretAtFirstLine(el: HTMLElement): boolean {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return false;
  const range = sel.getRangeAt(0);
  if (!el.contains(range.startContainer)) return false;

  if (isCaretAtStart(el)) return true;

  const rects = range.getClientRects();
  const caretRect = rects.length > 0 ? rects[0] : range.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();

  if (!caretRect || caretRect.height === 0) {
    return isCaretAtStart(el);
  }

  return caretRect.top - elRect.top < 18;
}

function isCaretAtLastLine(el: HTMLElement): boolean {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return false;
  const range = sel.getRangeAt(0);
  if (!el.contains(range.startContainer)) return false;

  if (isCaretAtEnd(el)) return true;

  const rects = range.getClientRects();
  const caretRect = rects.length > 0 ? rects[0] : range.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();

  if (!caretRect || caretRect.height === 0) {
    return isCaretAtEnd(el);
  }

  return elRect.bottom - caretRect.bottom < 18;
}

function extractContentAroundCaret(el: HTMLElement, fallbackBody: string): { before: string; after: string } {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    return { before: fallbackBody, after: '' };
  }
  const range = sel.getRangeAt(0);
  if (!el.contains(range.startContainer)) {
    return { before: fallbackBody, after: '' };
  }

  const preRange = range.cloneRange();
  preRange.selectNodeContents(el);
  preRange.setEnd(range.startContainer, range.startOffset);
  const preDiv = document.createElement('div');
  preDiv.appendChild(preRange.cloneContents());
  const before = visualHtmlToStored(preDiv).replace(/\r?\n/g, ' ');

  const postRange = range.cloneRange();
  postRange.selectNodeContents(el);
  postRange.setStart(range.endContainer, range.endOffset);
  const postDiv = document.createElement('div');
  postDiv.appendChild(postRange.cloneContents());
  const after = visualHtmlToStored(postDiv).replace(/\r?\n/g, ' ');

  return { before, after };
}

export const EditableTextLine: React.FC<Props> = ({
  lineIndex,
  totalLines,
  rawLine,
  notes,
  selectionSlice,
  onLinePointerDown,
  onLinePointerMove,
  onStartOrExtendCrossSelection,
  onSelectAll,
  placeholder,
  exclusionPadding,
  onUpdateLine,
  onSplitLine,
  onPasteLines,
  onMergeWithPrev,
  onToggleCheckbox,
  onFocusLine,
  onSelectionChange,
  onNavigateLine,
  onSelectNote,
  onCreateNoteWithTitle,
  onPasteImageAtLine,
  registerLineEl,
  onMoveLine,
}) => {
  const { t } = useTranslation();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const taskMatch = rawLine.match(/^(\s*[-*]\s+)\[([ xX])\]\s*(.*)$/);
  const h1Match = !taskMatch ? rawLine.match(/^#\s+(.*)$/) : null;
  const h2Match = !taskMatch && !h1Match ? rawLine.match(/^##\s+(.*)$/) : null;
  const h3Match = !taskMatch && !h1Match && !h2Match ? rawLine.match(/^###\s+(.*)$/) : null;
  const bulletMatch = !taskMatch && !h1Match && !h2Match && !h3Match ? rawLine.match(/^(\s*[-*]\s+)(.*)$/) : null;

  const prefix = taskMatch
    ? `${taskMatch[1]}[${taskMatch[2]}] `
    : h1Match
    ? '# '
    : h2Match
    ? '## '
    : h3Match
    ? '### '
    : bulletMatch
    ? bulletMatch[1]
    : '';

  const bodyText = taskMatch
    ? taskMatch[3]
    : h1Match
    ? h1Match[1]
    : h2Match
    ? h2Match[1]
    : h3Match
    ? h3Match[1]
    : bulletMatch
    ? bulletMatch[2]
    : rawLine;

  const isChecked = taskMatch ? taskMatch[2].toLowerCase() === 'x' : false;
  const lastBodyRef = useRef<string>(bodyText);
  const hadSelectionSliceRef = useRef<boolean>(false);

  const selStart = selectionSlice?.start;
  const selEnd = selectionSlice?.end;
  const hasActiveSlice = selStart !== undefined && selEnd !== undefined;

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const html = storedToVisualHtmlWithSelection(bodyText, selStart, selEnd);
    const sliceChanged = hasActiveSlice || hadSelectionSliceRef.current;
    if (sliceChanged || lastBodyRef.current !== bodyText || el.innerHTML !== html) {
      if (sliceChanged || document.activeElement !== el || lastBodyRef.current !== bodyText) {
        el.innerHTML = html;
        lastBodyRef.current = bodyText;
      }
    }
    hadSelectionSliceRef.current = hasActiveSlice;
  }, [bodyText, selStart, selEnd, hasActiveSlice]);

  useEffect(() => {
    const el = editorRef.current;
    if (el) {
      el.innerHTML = storedToVisualHtmlWithSelection(bodyText, selStart, selEnd);
      lastBodyRef.current = bodyText;
    }
  }, []);

  const syncDom = useCallback(() => {
    const el = editorRef.current;
    if (!el) return bodyText;
    const nextBody = visualHtmlToStored(el).replace(/\r?\n/g, ' ');
    lastBodyRef.current = nextBody;

    // Auto-convert typed "- [ ] " or "[] " at start of plain line into task
    if (!prefix && /^(\[\s?\]|-\s+\[\s?\])\s+/.test(nextBody)) {
      const cleanBody = nextBody.replace(/^(\[\s?\]|-\s+\[\s?\])\s+/, '');
      onUpdateLine(lineIndex, `- [ ] ${cleanBody}`);
      return cleanBody;
    }

    onUpdateLine(lineIndex, `${prefix}${nextBody}`);
    return nextBody;
  }, [bodyText, lineIndex, onUpdateLine, prefix]);

  const handleApplyFormat = useCallback(
    (action: RichFormatAction) => {
      const el = editorRef.current;
      if (!el) return;
      const nextRange = applyFormatToContentEditable(
        el,
        action,
        savedRangeRef.current,
        (stored) => {
          const single = stored.replace(/\r?\n/g, ' ');
          lastBodyRef.current = single;
          onUpdateLine(lineIndex, `${prefix}${single}`);
        }
      );
      if (nextRange) savedRangeRef.current = nextRange.cloneRange();
    },
    [lineIndex, onUpdateLine, prefix]
  );

  const checkSelection = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      onSelectionChange(null, handleApplyFormat);
      return;
    }
    const range = sel.getRangeAt(0);
    if (!el.contains(range.commonAncestorContainer) || !sel.toString().trim()) {
      onSelectionChange(null, handleApplyFormat);
      return;
    }
    savedRangeRef.current = range.cloneRange();
    const rect = range.getBoundingClientRect();
    const hostRect = el.getBoundingClientRect();
    const x = rect.width > 0 ? rect.left + rect.width / 2 : hostRect.left + hostRect.width / 2;
    const y = rect.top > 0 ? rect.top : hostRect.top;
    onSelectionChange({ x, y }, handleApplyFormat);
  }, [handleApplyFormat, onSelectionChange]);

  const wikiMatches = Array.from(bodyText.matchAll(/\[\[([^\]]+)\]\]/g)).map((m) => m[1].trim());
  const isEmpty = !storedToPlainText(bodyText).trim() && !prefix;

  const typographyClass = h1Match
    ? 'text-2xl font-bold text-theme-text pt-2 pb-1 border-b border-white/[0.05]'
    : h2Match
    ? 'text-xl font-semibold text-theme-text pt-1.5 pb-0.5'
    : h3Match
    ? 'text-base font-semibold text-theme-text pt-1'
    : 'text-sm text-theme-text/95 leading-relaxed';

  return (
    <div
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        const el = editorRef.current;
        const offset = el ? getCharOffsetFromPointWithin(el, e.clientX, e.clientY) : 0;
        onLinePointerDown?.(lineIndex, offset, e);
      }}
      onMouseMove={(e) => {
        if ((e.buttons & 1) !== 1) return;
        const el = editorRef.current;
        const offset = el ? getCharOffsetFromPointWithin(el, e.clientX, e.clientY) : 0;
        onLinePointerMove?.(lineIndex, offset, e);
      }}
      style={{
        paddingLeft: exclusionPadding?.left ? `${exclusionPadding.left}px` : undefined,
        paddingRight: exclusionPadding?.right ? `${exclusionPadding.right}px` : undefined,
        marginTop: exclusionPadding?.marginTop ? `${exclusionPadding.marginTop}px` : undefined,
      }}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('application/udo-link-line')) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }
      }}
      onDrop={(e) => {
        const fromIdxStr = e.dataTransfer.getData('application/udo-link-line');
        if (fromIdxStr && onMoveLine) {
          e.preventDefault();
          e.stopPropagation();
          const fromIdx = parseInt(fromIdxStr, 10);
          if (!isNaN(fromIdx) && fromIdx !== lineIndex) {
            onMoveLine(fromIdx, lineIndex);
          }
        }
      }}
      className={`group relative ${
        taskMatch
          ? isChecked
            ? 'flex items-start gap-2 bg-[#1fd4a5]/[0.06] px-2 py-1 text-theme-muted'
            : 'flex items-start gap-2 hover:bg-theme-hover/30 px-2 py-1'
          : 'block py-0.5'
      } rounded-lg transition-[padding,margin,background-color] duration-75`}
    >
      {taskMatch && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onToggleCheckbox(lineIndex)}
          className="mt-1 shrink-0 text-theme-muted hover:text-theme-accent transition-colors cursor-pointer"
        >
          {isChecked ? (
            <CheckSquare size={16} className="text-[#1fd4a5] fill-[#1fd4a5]/20 rounded-[5px]" />
          ) : (
            <Square size={16} className="text-theme-muted rounded-[5px]" />
          )}
        </button>
      )}

      {bulletMatch && (
        <span className="inline-block mt-2 w-1.5 h-1.5 rounded-full bg-theme-accent/70 shrink-0 ml-1.5 mr-2 align-middle" />
      )}

      <div className={`relative ${taskMatch ? 'flex-1 min-w-0' : 'w-full'}`}>
        <div
          ref={(el) => {
            editorRef.current = el;
            registerLineEl(lineIndex, el);
          }}
          contentEditable
          suppressContentEditableWarning
          onFocus={(e) => onFocusLine(lineIndex, e.currentTarget)}
          onInput={syncDom}
          onMouseUp={checkSelection}
          onKeyUp={(e) => {
            if (e.key !== 'Shift' && e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Meta') {
              checkSelection();
            }
          }}
          onPaste={(e) => {
            if (onPasteImageAtLine(lineIndex, e)) return;
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            if (!text) return;

            const el = editorRef.current;
            if (!el) return;

            const normalized = text.replace(/\r\n?/g, '\n');
            const pasteLines = normalized.split('\n');

            if (pasteLines.length === 1) {
              document.execCommand('insertText', false, pasteLines[0]);
              syncDom();
            } else {
              const currentBody = visualHtmlToStored(el).replace(/\r?\n/g, ' ');
              const { before, after } = extractContentAroundCaret(el, currentBody);

              const firstLineFull = `${prefix}${before}${pasteLines[0]}`;
              const middleLines = pasteLines.slice(1, -1);
              const lastLineFull = `${pasteLines[pasteLines.length - 1]}${after}`;
              const allSplice = [firstLineFull, ...middleLines, lastLineFull];

              if (onPasteLines) {
                onPasteLines(lineIndex, allSplice, pasteLines[pasteLines.length - 1].length);
              } else {
                onSplitLine(lineIndex, firstLineFull, [...middleLines, lastLineFull].join('\n'), true);
              }
            }
          }}
          onKeyDown={(e) => {
            const el = editorRef.current;
            if (!el) return;
            const isCtrl = e.ctrlKey || e.metaKey;

            if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'b') {
              e.preventDefault();
              handleApplyFormat({ type: 'bold' });
              return;
            }
            if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'i') {
              e.preventDefault();
              handleApplyFormat({ type: 'italic' });
              return;
            }
            if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'u') {
              e.preventDefault();
              handleApplyFormat({ type: 'underline' });
              return;
            }

            if (e.key === 'Enter') {
              e.preventDefault();
              const currentBody = visualHtmlToStored(el).replace(/\r?\n/g, ' ');

              // If inside an empty task or bullet, pressing Enter exits the list
              if ((taskMatch || bulletMatch) && !currentBody.trim()) {
                onUpdateLine(lineIndex, '');
                return;
              }

              const { before, after } = extractContentAroundCaret(el, currentBody);
              const nextLinePrefix = e.shiftKey ? '' : taskMatch ? '- [ ] ' : bulletMatch ? '- ' : '';
              const beforeRaw = `${prefix}${before}`;
              const afterRaw = `${nextLinePrefix}${after}`;

              onSplitLine(lineIndex, beforeRaw, afterRaw, false);
              return;
            }

            if (e.key === 'Backspace') {
              const atStart = isCaretAtStart(el);
              const currentBody = visualHtmlToStored(el).replace(/\r?\n/g, ' ');
              if (!currentBody.trim() || atStart) {
                if (prefix) {
                  e.preventDefault();
                  onUpdateLine(lineIndex, currentBody);
                  return;
                }
                if (lineIndex > 0 && (!currentBody.trim() || atStart)) {
                  e.preventDefault();
                  onMergeWithPrev(lineIndex, currentBody);
                  return;
                }
              }
            }

            if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'a') {
              e.preventDefault();
              onSelectAll?.();
              return;
            }

            if (e.key === 'ArrowUp') {
              const sel = window.getSelection();
              if (e.shiftKey) {
                if (isCaretAtFirstLine(el) && lineIndex > 0) {
                  e.preventDefault();
                  const { anchorOffset, focusOffset } = getSelectionOffsetsWithin(el);
                  onStartOrExtendCrossSelection?.(anchorOffset, focusOffset, 'up', isCtrl);
                  return;
                }
              } else {
                if (isCaretAtFirstLine(el)) {
                  e.preventDefault();
                  const range = sel?.rangeCount ? sel.getRangeAt(0) : null;
                  const rect = range?.getBoundingClientRect();
                  onNavigateLine(lineIndex, 'up', rect?.left);
                  return;
                }
              }
            }

            if (e.key === 'ArrowDown') {
              const sel = window.getSelection();
              if (e.shiftKey) {
                if (isCaretAtLastLine(el) && totalLines !== undefined && lineIndex < totalLines - 1) {
                  e.preventDefault();
                  const { anchorOffset, focusOffset } = getSelectionOffsetsWithin(el);
                  onStartOrExtendCrossSelection?.(anchorOffset, focusOffset, 'down', isCtrl);
                  return;
                }
              } else {
                if (isCaretAtLastLine(el)) {
                  e.preventDefault();
                  const range = sel?.rangeCount ? sel.getRangeAt(0) : null;
                  const rect = range?.getBoundingClientRect();
                  onNavigateLine(lineIndex, 'down', rect?.left);
                  return;
                }
              }
            }

            if (e.key === 'ArrowLeft') {
              if (e.shiftKey) {
                const { anchorOffset, focusOffset } = getSelectionOffsetsWithin(el);
                if (focusOffset <= 0 && lineIndex > 0) {
                  e.preventDefault();
                  onStartOrExtendCrossSelection?.(anchorOffset, focusOffset, 'left', isCtrl);
                  return;
                }
              } else if (isCaretAtStart(el) && lineIndex > 0) {
                e.preventDefault();
                onNavigateLine(lineIndex, 'up');
                return;
              }
            }

            if (e.key === 'ArrowRight') {
              if (e.shiftKey) {
                const { anchorOffset, focusOffset, totalLen } = getSelectionOffsetsWithin(el);
                if (focusOffset >= totalLen && totalLines !== undefined && lineIndex < totalLines - 1) {
                  e.preventDefault();
                  onStartOrExtendCrossSelection?.(anchorOffset, focusOffset, 'right', isCtrl);
                  return;
                }
              } else if (isCaretAtEnd(el) && totalLines !== undefined && lineIndex < totalLines - 1) {
                e.preventDefault();
                onNavigateLine(lineIndex, 'down');
                return;
              }
            }
          }}
          className={`outline-none w-full min-h-[24px] break-words ${typographyClass} ${
            isChecked ? 'line-through opacity-70' : ''
          }`}
        />

        {hasActiveSlice && selStart === 0 && selEnd === 0 && !bodyText.trim() && (
          <span
            data-udo-sel="true"
            className="pointer-events-none absolute left-0 top-1 inline-block w-2 h-4 bg-[#3b82f6]/40 rounded-[2px]"
          />
        )}

        {isEmpty && placeholder && (
          <span className="pointer-events-none absolute left-0 top-0.5 text-sm text-theme-muted/45 italic select-none">
            {placeholder}
          </span>
        )}

        {wikiMatches.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1 select-none">
            {wikiMatches.map((wikiTitle, i) => {
              const target = notes.find((n) => n.title.toLowerCase() === wikiTitle.toLowerCase());
              return (
                <button
                  key={`${wikiTitle}-${i}`}
                  type="button"
                  onClick={() =>
                    target ? onSelectNote(target.id, target.subjectId) : onCreateNoteWithTitle(wikiTitle)
                  }
                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] bg-theme-accent/15 hover:bg-theme-accent/25 text-theme-accent border border-theme-accent/30 cursor-pointer transition-colors"
                  title={t(target ? 'note.openWikiLink' : 'note.createWikiLink', { title: wikiTitle })}
                >
                  <FileText size={11} />
                  <span>{wikiTitle}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
