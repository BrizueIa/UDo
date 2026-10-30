import React, { useRef, useEffect, useCallback } from 'react';
import { CheckSquare, Square, FileText } from 'lucide-react';
import { NoteItem } from '../../../../shared/types';
import { storedToVisualHtml, visualHtmlToStored, storedToPlainText } from '../../utils/richTextHtmlCodec';
import { RichFormatAction } from '../RichTextToolbar';
import { applyFormatToContentEditable } from '../../utils/richTextDomCommands';
import { useTranslation } from 'react-i18next';

interface Props {
  lineIndex: number;
  rawLine: string;
  notes: NoteItem[];
  placeholder?: string;
  onUpdateLine: (idx: number, nextRaw: string) => void;
  onSplitLine: (idx: number, beforeRaw: string, afterRaw: string) => void;
  onMergeWithPrev: (idx: number, currentTailRaw: string) => void;
  onToggleCheckbox: (idx: number) => void;
  onFocusLine: (idx: number, el: HTMLDivElement) => void;
  onSelectionChange: (coords: { x: number; y: number } | null, applyFn: (action: RichFormatAction) => void) => void;
  onNavigateLine: (fromIdx: number, dir: 'up' | 'down') => void;
  onSelectNote: (noteId: string, subjectId: string) => void;
  onCreateNoteWithTitle: (title: string) => void;
  onPasteImageAtLine: (idx: number, e: React.ClipboardEvent) => boolean;
  registerLineEl: (idx: number, el: HTMLDivElement | null) => void;
}

export const EditableTextLine: React.FC<Props> = ({
  lineIndex,
  rawLine,
  notes,
  placeholder,
  onUpdateLine,
  onSplitLine,
  onMergeWithPrev,
  onToggleCheckbox,
  onFocusLine,
  onSelectionChange,
  onNavigateLine,
  onSelectNote,
  onCreateNoteWithTitle,
  onPasteImageAtLine,
  registerLineEl,
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

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const html = storedToVisualHtml(bodyText);
    if (lastBodyRef.current !== bodyText || el.innerHTML !== html) {
      if (document.activeElement !== el || lastBodyRef.current !== bodyText) {
        el.innerHTML = html;
        lastBodyRef.current = bodyText;
      }
    }
  }, [bodyText]);

  useEffect(() => {
    const el = editorRef.current;
    if (el) {
      el.innerHTML = storedToVisualHtml(bodyText);
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
      className={`group relative ${
        taskMatch
          ? isChecked
            ? 'flex items-start gap-2 bg-[#1fd4a5]/[0.06] px-2 py-1 text-theme-muted'
            : 'flex items-start gap-2 hover:bg-theme-hover/30 px-2 py-1'
          : 'block py-0.5'
      } rounded-lg transition-colors`}
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
            const lines = text.replace(/\r\n/g, '\n').split('\n');
            if (lines.length === 1) {
              document.execCommand('insertText', false, lines[0]);
              syncDom();
            } else {
              document.execCommand('insertText', false, lines[0]);
              const currentFull = `${prefix}${visualHtmlToStored(editorRef.current!)}`;
              const restJoined = lines.slice(1).join('\n');
              onSplitLine(lineIndex, currentFull, restJoined);
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

            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              const currentBody = visualHtmlToStored(el).replace(/\r?\n/g, ' ');
              // If inside an empty task or bullet, pressing Enter exits the list
              if ((taskMatch || bulletMatch) && !currentBody.trim()) {
                onUpdateLine(lineIndex, '');
                return;
              }
              const nextLinePrefix = taskMatch ? '- [ ] ' : bulletMatch ? '- ' : '';
              onSplitLine(lineIndex, `${prefix}${currentBody}`, nextLinePrefix);
              return;
            }

            if (e.key === 'Backspace') {
              const sel = window.getSelection();
              const atStart =
                sel &&
                sel.isCollapsed &&
                sel.rangeCount > 0 &&
                sel.getRangeAt(0).startOffset === 0 &&
                (sel.getRangeAt(0).startContainer === el ||
                  sel.getRangeAt(0).startContainer === el.firstChild);

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

            if (e.key === 'ArrowUp') {
              e.preventDefault();
              onNavigateLine(lineIndex, 'up');
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              onNavigateLine(lineIndex, 'down');
            }
          }}
          className={`outline-none w-full min-h-[24px] break-words ${typographyClass} ${
            isChecked ? 'line-through opacity-70' : ''
          }`}
        />

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
