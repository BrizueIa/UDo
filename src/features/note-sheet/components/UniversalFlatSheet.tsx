import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Scissors, Copy, Clipboard, CheckSquare, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NoteItem, SketchItem, LinkItem, NoteAttachment } from '../../../shared/types';
import { buildDiacriticRegex } from '../../../shared/utils/diacritics';
import { hasClipboardImageContent, processImageDropOrPaste } from '../../../shared/utils/imageClipboard';
import { RichTextToolbar, RichFormatAction } from './RichTextToolbar';
import { EditableTextLine } from './blocks/EditableTextLine';
import {
  ResizableSketchBlock,
  InlineLinkBlock,
  InlineAttachmentBlock,
} from './blocks/InlineMediaBlocks';
import { useContextMenu } from '../../../shared/ui/context-menu';
import { playTaskCompleteSound } from '../../../shared/utils/soundEffects';

interface Props {
  content: string;
  notes: NoteItem[];
  sketches: SketchItem[];
  links: LinkItem[];
  attachments: NoteAttachment[];
  findQuery?: string;
  currentMatchIndex?: number;
  activeCursorLineRef: React.MutableRefObject<number>;
  onChangeContent: (newContent: string) => void;
  onSelectNote: (noteId: string, subjectId: string) => void;
  onCreateNoteWithTitle: (title: string) => void;
  onMatchCountCalculated?: (count: number) => void;
  onUndoText?: () => void;
  onRedoText?: () => void;
  onAttachSketchesAtLine: (sketches: SketchItem[], lineIdx: number) => void;
  onOpenSketchAnnotator: (sketch: SketchItem) => void;
  onRemoveSketch: (sketchId: string) => void;
  onResizeSketch: (sketchId: string, width: number) => void;
  onUpdateSketchSideNote: (sketchId: string, sideNote: string) => void;
  onRemoveLink: (linkId: string) => void;
  onRemoveAttachment: (attachmentId: string) => void;
  onRenameAttachment: (attachmentId: string, newName: string) => void;
}

const EMBED_REGEX = /^\[embed:(sketch|attachment|link):([^\]]+)\]$/i;

export const UniversalFlatSheet: React.FC<Props> = ({
  content, notes, sketches, links, attachments, findQuery = '',
  activeCursorLineRef, onChangeContent, onSelectNote, onCreateNoteWithTitle,
  onMatchCountCalculated, onUndoText, onRedoText, onAttachSketchesAtLine,
  onOpenSketchAnnotator, onRemoveSketch, onResizeSketch, onUpdateSketchSideNote,
  onRemoveLink, onRemoveAttachment, onRenameAttachment,
}) => {
  const { t } = useTranslation();
  const { openContextMenu } = useContextMenu();
  const [toolbarCoords, setToolbarCoords] = useState<{ x: number; y: number } | null>(null);
  const activeApplyFormatRef = useRef<((action: RichFormatAction) => void) | null>(null);
  const lineElementsRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const sheetContainerRef = useRef<HTMLDivElement>(null);

  const lines = (content || '').split('\n');

  // Identify media items not yet referenced via [embed:type:id] for seamless backward compatibility
  const referencedSketchIds = new Set<string>();
  const referencedAttachmentIds = new Set<string>();
  const referencedLinkIds = new Set<string>();

  lines.forEach((line) => {
    const m = line.trim().match(EMBED_REGEX);
    if (!m) return;
    const [, kind, id] = m;
    if (kind.toLowerCase() === 'sketch') referencedSketchIds.add(id);
    else if (kind.toLowerCase() === 'attachment') referencedAttachmentIds.add(id);
    else if (kind.toLowerCase() === 'link') referencedLinkIds.add(id);
  });

  const orphanSketches = sketches.filter((s) => !referencedSketchIds.has(s.id));
  const orphanAttachments = attachments.filter((a) => !referencedAttachmentIds.has(a.id));
  const orphanLinks = links.filter((l) => !referencedLinkIds.has(l.id));

  // Auto-normalize legacy/orphan items into [embed:...] lines + ensure a trailing editable text line after embeds
  useEffect(() => {
    const nextLines = [...lines];
    let changed = false;

    orphanSketches.forEach((s) => {
      nextLines.push(`[embed:sketch:${s.id}]`);
      changed = true;
    });
    orphanAttachments.forEach((a) => {
      nextLines.push(`[embed:attachment:${a.id}]`);
      changed = true;
    });
    orphanLinks.forEach((l) => {
      nextLines.push(`[embed:link:${l.id}]`);
      changed = true;
    });

    if (nextLines.length > 0 && EMBED_REGEX.test(nextLines[nextLines.length - 1].trim())) {
      nextLines.push('');
      changed = true;
    }

    if (changed) {
      onChangeContent(nextLines.join('\n'));
    }
  }, [orphanSketches.length, orphanAttachments.length, orphanLinks.length, lines, onChangeContent]);

  useEffect(() => {
    const q = findQuery.trim();
    if (!q) {
      onMatchCountCalculated?.(0);
      return;
    }
    try {
      const regex = buildDiacriticRegex(q, 'gi');
      const matches = content.match(regex);
      onMatchCountCalculated?.(matches ? matches.length : 0);
    } catch {
      onMatchCountCalculated?.(0);
    }
  }, [content, findQuery, onMatchCountCalculated]);

  const registerLineEl = useCallback((idx: number, el: HTMLDivElement | null) => {
    if (el) lineElementsRef.current.set(idx, el);
    else lineElementsRef.current.delete(idx);
  }, []);

  const focusLineAt = useCallback((idx: number, toEnd = true) => {
    requestAnimationFrame(() => {
      const targetEl = lineElementsRef.current.get(idx);
      if (!targetEl) return;
      targetEl.focus();
      const sel = window.getSelection();
      if (!sel) return;
      const range = document.createRange();
      range.selectNodeContents(targetEl);
      range.collapse(!toEnd);
      sel.removeAllRanges();
      sel.addRange(range);
    });
  }, []);

  const handleUpdateLine = useCallback((idx: number, nextRaw: string) => {
    const nextLines = [...lines];
    nextLines[idx] = nextRaw;
    onChangeContent(nextLines.join('\n'));
  }, [lines, onChangeContent]);

  const handleSplitLine = useCallback((idx: number, beforeRaw: string, afterRaw: string) => {
    const nextLines = [...lines];
    const extraLines = afterRaw.split('\n');
    nextLines.splice(idx, 1, beforeRaw, ...extraLines);
    onChangeContent(nextLines.join('\n'));
    const nextFocusIdx = idx + extraLines.length;
    activeCursorLineRef.current = nextFocusIdx;
    focusLineAt(nextFocusIdx, true);
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
    nextLines.splice(idx - 1, 2, `${prevLine}${currentTailRaw}`);
    onChangeContent(nextLines.join('\n'));
    activeCursorLineRef.current = idx - 1;
    focusLineAt(idx - 1, true);
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

  const handleNavigateLine = useCallback((fromIdx: number, dir: 'up' | 'down') => {
    let step = dir === 'up' ? fromIdx - 1 : fromIdx + 1;
    while (step >= 0 && step < lines.length) {
      if (!EMBED_REGEX.test(lines[step].trim())) {
        activeCursorLineRef.current = step;
        focusLineAt(step, true);
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

  const handleSheetContextMenu = (e: React.MouseEvent) => {
    openContextMenu(e, [
      { id: 'cut', label: t('editor.cut'), icon: <Scissors size={14} />, shortcut: 'Ctrl+X', onClick: () => document.execCommand('cut') },
      { id: 'copy', label: t('editor.copy'), icon: <Copy size={14} />, shortcut: 'Ctrl+C', onClick: () => document.execCommand('copy') },
      {
        id: 'paste', label: t('editor.paste'), icon: <Clipboard size={14} />, shortcut: 'Ctrl+V',
        onClick: async () => {
          try {
            const text = await navigator.clipboard.readText();
            if (text) {
              const idx = activeCursorLineRef.current;
              const nextLines = [...lines];
              nextLines[idx] = `${nextLines[idx] || ''}${text}`;
              onChangeContent(nextLines.join('\n'));
            }
          } catch {}
        },
      },
      { id: 'sep-1', label: '', separator: true },
      {
        id: 'insert-task', label: t('editor.insertTask'), icon: <CheckSquare size={14} />,
        onClick: () => {
          const idx = Math.min(activeCursorLineRef.current, lines.length - 1);
          const nextLines = [...lines];
          if (!(nextLines[idx] || '').trim()) nextLines[idx] = '- [ ] ';
          else nextLines.splice(idx + 1, 0, '- [ ] ');
          onChangeContent(nextLines.join('\n'));
        },
      },
      {
        id: 'find', label: t('editor.find'), icon: <Search size={14} />, shortcut: 'Ctrl+F',
        onClick: () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true })),
      },
    ]);
  };

  return (
    <div
      ref={sheetContainerRef}
      onContextMenu={handleSheetContextMenu}
      onKeyDown={(e) => {
        const isCtrl = e.ctrlKey || e.metaKey;
        if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'z') {
          e.preventDefault();
          onUndoText?.();
        } else if (
          (isCtrl && e.key.toLowerCase() === 'y') ||
          (isCtrl && e.shiftKey && e.key.toLowerCase() === 'z')
        ) {
          e.preventDefault();
          onRedoText?.();
        }
      }}
      className="min-h-[380px] py-2 space-y-1 text-sm text-theme-text leading-relaxed select-text"
    >
      <RichTextToolbar
        inputRef={sheetContainerRef}
        coords={toolbarCoords}
        onApplyFormat={(action) => activeApplyFormatRef.current?.(action)}
        onClose={() => setToolbarCoords(null)}
      />

      {lines.map((line, idx) => {
        const embedMatch = line.trim().match(EMBED_REGEX);
        if (embedMatch) {
          const [, rawKind, itemId] = embedMatch;
          const kind = rawKind.toLowerCase();

          if (kind === 'sketch') {
            const sk = sketches.find((s) => s.id === itemId);
            if (!sk) return null;
            return (
              <ResizableSketchBlock
                key={`sk-${sk.id}-${idx}`}
                sketch={sk}
                onAnnotate={onOpenSketchAnnotator}
                onRemove={onRemoveSketch}
                onResize={onResizeSketch}
                onUpdateSideNote={onUpdateSketchSideNote}
                onWriteBelow={() => {
                  const nextIdx = idx + 1;
                  if (nextIdx >= lines.length || EMBED_REGEX.test(lines[nextIdx].trim())) {
                    const nextLines = [...lines];
                    nextLines.splice(nextIdx, 0, '');
                    onChangeContent(nextLines.join('\n'));
                  }
                  activeCursorLineRef.current = nextIdx;
                  focusLineAt(nextIdx, true);
                }}
              />
            );
          }

          if (kind === 'attachment') {
            const att = attachments.find((a) => a.id === itemId);
            if (!att) return null;
            return (
              <InlineAttachmentBlock
                key={`att-${att.id}-${idx}`}
                attachment={att}
                onRemove={onRemoveAttachment}
                onRename={onRenameAttachment}
              />
            );
          }

          if (kind === 'link') {
            const lnk = links.find((l) => l.id === itemId);
            if (!lnk) return null;
            return (
              <InlineLinkBlock
                key={`lnk-${lnk.id}-${idx}`}
                link={lnk}
                onRemove={onRemoveLink}
              />
            );
          }
        }

        return (
          <EditableTextLine
            key={`line-${idx}`}
            lineIndex={idx}
            rawLine={line}
            notes={notes}
            placeholder={idx === 0 && lines.length === 1 ? t('note.flatSheetPlaceholder') : undefined}
            onUpdateLine={handleUpdateLine}
            onSplitLine={handleSplitLine}
            onMergeWithPrev={handleMergeWithPrev}
            onToggleCheckbox={handleToggleCheckbox}
            onFocusLine={(i) => {
              activeCursorLineRef.current = i;
            }}
            onSelectionChange={(coords, applyFn) => {
              activeApplyFormatRef.current = applyFn;
              setToolbarCoords(coords);
            }}
            onNavigateLine={handleNavigateLine}
            onSelectNote={onSelectNote}
            onCreateNoteWithTitle={onCreateNoteWithTitle}
            onPasteImageAtLine={handlePasteImageAtLine}
            registerLineEl={registerLineEl}
          />
        );
      })}

      {/* Clickable bottom space to always place cursor at the bottom of the sheet */}
      <div
        onClick={() => {
          const lastIdx = lines.length - 1;
          if (EMBED_REGEX.test((lines[lastIdx] || '').trim())) {
            const nextLines = [...lines, ''];
            onChangeContent(nextLines.join('\n'));
            activeCursorLineRef.current = nextLines.length - 1;
            focusLineAt(nextLines.length - 1, true);
          } else {
            activeCursorLineRef.current = lastIdx;
            focusLineAt(lastIdx, true);
          }
        }}
        className="min-h-[120px] w-full cursor-text"
      />
    </div>
  );
};
