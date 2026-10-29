import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, Scissors, Copy, Clipboard, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NoteItem, SketchItem } from '../../../shared/types';
import { buildDiacriticRegex } from '../../../shared/utils/diacritics';
import { hasClipboardImageContent, processImageDropOrPaste } from '../../../shared/utils/imageClipboard';
import { parseInlineRichText, RichTextParserOptions } from '../utils/inlineRichTextParser';
import { RichTextToolbar } from './RichTextToolbar';
import { useContextMenu } from '../../../shared/ui/context-menu';

interface Props {
  content: string;
  notes: NoteItem[];
  viewMode: 'preview' | 'edit';
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  findQuery?: string;
  currentMatchIndex?: number;
  onChangeContent: (newContent: string) => void;
  onToggleCheckbox: (lineIndex: number) => void;
  onSelectNote: (noteId: string, subjectId: string) => void;
  onCreateNoteWithTitle: (title: string) => void;
  onMatchCountCalculated?: (count: number) => void;
  onUndoText?: () => void;
  onRedoText?: () => void;
  onAttachSketches?: (sketches: SketchItem[]) => void;
}

export const MarkdownSheetPreview: React.FC<Props> = ({
  content,
  notes,
  viewMode,
  textareaRef,
  findQuery = '',
  currentMatchIndex = 0,
  onChangeContent,
  onToggleCheckbox,
  onSelectNote,
  onCreateNoteWithTitle,
  onMatchCountCalculated,
  onUndoText,
  onRedoText,
  onAttachSketches,
}) => {
  const { t } = useTranslation();
  const { openContextMenu } = useContextMenu();
  const [selectionCoords, setSelectionCoords] = useState<{ x: number; y: number } | null>(null);

  const handleEditorContextMenu = (e: React.MouseEvent) => {
    openContextMenu(e, [
      {
        id: 'cut',
        label: t('editor.cut') || 'Cortar',
        icon: <Scissors size={14} />,
        shortcut: 'Ctrl+X',
        onClick: () => document.execCommand('cut'),
      },
      {
        id: 'copy',
        label: t('editor.copy') || 'Copiar',
        icon: <Copy size={14} />,
        shortcut: 'Ctrl+C',
        onClick: () => document.execCommand('copy'),
      },
      {
        id: 'paste',
        label: t('editor.paste') || 'Pegar',
        icon: <Clipboard size={14} />,
        shortcut: 'Ctrl+V',
        onClick: async () => {
          try {
            const text = await navigator.clipboard.readText();
            if (text && textareaRef.current) {
              const el = textareaRef.current;
              const start = el.selectionStart;
              const end = el.selectionEnd;
              const next = content.substring(0, start) + text + content.substring(end);
              onChangeContent(next);
            }
          } catch {}
        },
      },
      { id: 'sep-1', label: '', separator: true },
      {
        id: 'insert-task',
        label: t('editor.insertTask') || 'Insertar Tarea',
        icon: <CheckSquare size={14} />,
        onClick: () => {
          if (textareaRef.current) {
            const el = textareaRef.current;
            const start = el.selectionStart;
            const next = content.substring(0, start) + '\n- [ ] ' + content.substring(start);
            onChangeContent(next);
          }
        },
      },
      {
        id: 'find',
        label: t('editor.find') || 'Buscar en la nota',
        icon: <Search size={14} />,
        shortcut: 'Ctrl+F',
        onClick: () => {
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true }));
        },
      },
    ]);
  };

  // Calculate total matches in content (diacritic-insensitive)
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

  // Scroll active match into view smoothly
  useEffect(() => {
    if (findQuery.trim()) {
      const activeEl = document.querySelector('[data-find-active="true"]');
      activeEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentMatchIndex, findQuery]);

  // Close floating toolbar when clicking outside textarea
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (textareaRef.current?.contains(target) || target.closest('[data-rich-toolbar="true"]')) {
        return;
      }
      setSelectionCoords(null);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [textareaRef]);

  const matchCounter = { current: 0 };
  const parserOpts: RichTextParserOptions = {
    notes,
    findQuery,
    currentMatchIndex,
    matchCounter,
    onSelectNote,
    onCreateNoteWithTitle,
    t,
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const el = textareaRef.current;
    if (!el) return;
    if (el.selectionStart !== el.selectionEnd && el.value.slice(el.selectionStart, el.selectionEnd).trim().length > 0) {
      const rect = el.getBoundingClientRect();
      const x = Math.max(rect.left + 50, Math.min(rect.right - 50, e.clientX));
      const y = Math.max(rect.top + 20, e.clientY);
      setSelectionCoords({ x, y });
    } else {
      setSelectionCoords(null);
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = textareaRef.current;
    if (!el) return;
    if (el.selectionStart !== el.selectionEnd && el.value.slice(el.selectionStart, el.selectionEnd).trim().length > 0) {
      if (!selectionCoords) {
        const rect = el.getBoundingClientRect();
        setSelectionCoords({ x: rect.left + rect.width / 2, y: rect.top + 60 });
      }
    } else if (e.key !== 'Shift' && e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Meta') {
      setSelectionCoords(null);
    }
  };

  const handleShortcutWrap = (prefix: string, suffix: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const sel = content.slice(start, end) || t('richText.sampleText');
    const rep = `${prefix}${sel}${suffix}`;
    onChangeContent(content.slice(0, start) + rep + content.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start, start + rep.length);
    });
  };

  const contentLines = content.split('\n');
  const hasCheckboxes = contentLines.some((l) => /^\s*[-*]\s+\[[ xX]\]/.test(l));

  if (viewMode === 'preview') {
    return (
      <div className="min-h-[350px] p-5 rounded-2xl bg-theme-card/30 border border-white/[0.05] space-y-2 text-sm text-theme-text leading-relaxed select-text shadow-xs">
        {content.trim() ? (
          contentLines.map((line, idx) => {
            const checkMatch = line.match(/^(\s*[-*]\s+)\[([ xX])\]\s*(.*)$/);
            if (checkMatch) {
              const isChecked = checkMatch[2].toLowerCase() === 'x';
              const text = checkMatch[3];

              return (
                <div
                  key={idx}
                  onClick={() => onToggleCheckbox(idx)}
                  className={`flex items-start space-x-2.5 py-1 px-2 rounded-lg cursor-pointer transition-colors group ${
                    isChecked ? 'bg-[#1fd4a5]/10 text-theme-muted' : 'hover:bg-theme-hover/60 text-theme-text'
                  }`}
                >
                  <button type="button" className="mt-0.5 shrink-0 text-theme-muted group-hover:text-theme-accent transition-colors">
                    {isChecked ? (
                      <CheckSquare size={16} className="text-[#1fd4a5] fill-[#1fd4a5]/20 rounded-[5px]" />
                    ) : (
                      <Square size={16} className="text-theme-muted rounded-[5px]" />
                    )}
                  </button>
                  <span className={`text-sm ${isChecked ? 'line-through opacity-70' : ''}`}>
                    {parseInlineRichText(text, parserOpts, `line-${idx}`)}
                  </span>
                </div>
              );
            }

            if (line.startsWith('# ')) {
              return (
                <h1 key={idx} className="text-2xl font-bold text-theme-text pt-2 pb-1 border-b border-white/[0.05]">
                  {parseInlineRichText(line.slice(2), parserOpts, `h1-${idx}`)}
                </h1>
              );
            }
            if (line.startsWith('## ')) {
              return (
                <h2 key={idx} className="text-xl font-semibold text-theme-text pt-2 pb-0.5">
                  {parseInlineRichText(line.slice(3), parserOpts, `h2-${idx}`)}
                </h2>
              );
            }
            if (line.startsWith('### ')) {
              return (
                <h3 key={idx} className="text-base font-semibold text-theme-text pt-1">
                  {parseInlineRichText(line.slice(4), parserOpts, `h3-${idx}`)}
                </h3>
              );
            }

            if (/^\s*[-*]\s+/.test(line)) {
              return (
                <li key={idx} className="list-disc list-inside text-sm text-theme-text/90 ml-2">
                  {parseInlineRichText(line.replace(/^\s*[-*]\s+/, ''), parserOpts, `li-${idx}`)}
                </li>
              );
            }

            if (!line.trim()) return <div key={idx} className="h-2" />;

            return (
              <p key={idx} className="text-sm text-theme-text/90 leading-relaxed">
                {parseInlineRichText(line, parserOpts, `p-${idx}`)}
              </p>
            );
          })
        ) : (
          <p className="text-xs text-theme-muted italic">{t('note.markdownPlaceholder')}</p>
        )}
      </div>
    );
  }

  // Edit Mode: Floating Toolbar + Interactive Checklists Block + Textarea
  return (
    <div className="space-y-3 relative">
      {/* Word-style Floating Mini-Toolbar on Selection */}
      <RichTextToolbar
        inputRef={textareaRef}
        content={content}
        coords={selectionCoords}
        onChangeContent={onChangeContent}
        onClose={() => setSelectionCoords(null)}
      />

      {hasCheckboxes && (
        <div
          style={{ backgroundColor: 'var(--color-bg-card)' }}
          className="p-3 bg-theme-card border border-theme-border rounded-xl space-y-1.5 shadow-xs"
        >
          <div className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">
            {t('note.interactiveChecklists')}
          </div>
          <div className="space-y-1">
            {contentLines.map((line, idx) => {
              const checkMatch = line.match(/^(\s*[-*]\s+)\[([ xX])\]\s*(.*)$/);
              if (!checkMatch) return null;
              const isChecked = checkMatch[2].toLowerCase() === 'x';
              const taskText = checkMatch[3];

              return (
                <div
                  key={idx}
                  onClick={() => onToggleCheckbox(idx)}
                  className="flex items-center space-x-2 py-0.5 px-1.5 rounded-lg hover:bg-theme-hover cursor-pointer text-xs group"
                >
                  <button type="button" className="text-theme-muted group-hover:text-theme-accent">
                    {isChecked ? (
                      <CheckSquare size={14} className="text-[#1fd4a5] fill-[#1fd4a5]/20 rounded-[4px]" />
                    ) : (
                      <Square size={14} className="text-theme-muted rounded-[4px]" />
                    )}
                  </button>
                  <span className={isChecked ? 'line-through text-theme-muted' : 'text-theme-text'}>
                    {taskText || t('note.newTask')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onChangeContent(e.target.value)}
        onMouseUp={handleMouseUp}
        onKeyUp={handleKeyUp}
        onKeyDown={(e) => {
          const isCtrl = e.ctrlKey || e.metaKey;
          if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'b') {
            e.preventDefault();
            handleShortcutWrap('**', '**');
          } else if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'i') {
            e.preventDefault();
            handleShortcutWrap('*', '*');
          } else if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'u') {
            e.preventDefault();
            handleShortcutWrap('<u>', '</u>');
          } else if (isCtrl && !e.shiftKey && (e.key.toLowerCase() === 'z' || e.code === 'KeyZ')) {
            e.preventDefault();
            onUndoText?.();
          } else if (
            (isCtrl && (e.key.toLowerCase() === 'y' || e.code === 'KeyY')) ||
            (isCtrl && e.shiftKey && (e.key.toLowerCase() === 'z' || e.code === 'KeyZ'))
          ) {
            e.preventDefault();
            onRedoText?.();
          }
        }}
        onPaste={async (e) => {
          if (hasClipboardImageContent(e.clipboardData)) {
            e.preventDefault();
            e.stopPropagation();
            const sketches = await processImageDropOrPaste(e, t('note.pastedImage'));
            if (sketches.length > 0 && onAttachSketches) {
              onAttachSketches(sketches);
            }
          }
        }}
        onContextMenu={handleEditorContextMenu}
        placeholder={t('note.markdownPlaceholder')}
        style={{
          backgroundColor: 'var(--color-bg-sidebar)',
          color: 'var(--color-text-main)',
        }}
        className="w-full min-h-[350px] bg-theme-sidebar focus:bg-theme-card text-theme-text p-4 rounded-xl outline-none font-mono text-xs leading-relaxed resize-y border border-theme-border focus:border-theme-accent/60 transition-all shadow-inner"
      />
    </div>
  );
};
