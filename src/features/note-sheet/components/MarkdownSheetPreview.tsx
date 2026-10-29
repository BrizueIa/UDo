import React, { useEffect } from 'react';
import { CheckSquare, Square, FileText, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NoteItem } from '../../../shared/types';
import { buildDiacriticRegex, normalizeDiacritics } from '../../../shared/utils/diacritics';

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
}) => {
  const { t } = useTranslation();

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
      const activeEl = document.querySelector('[data-current-find-match="true"]');
      activeEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentMatchIndex, findQuery]);

  let matchCounter = 0;

  const renderTextWithHighlights = (rawText: string, keyPrefix: string): React.ReactNode => {
    const q = findQuery.trim();
    if (!q) return rawText;

    try {
      const regex = buildDiacriticRegex(q, 'gi');
      const segments = rawText.split(regex);
      const normQ = normalizeDiacritics(q);

      return segments.map((segment, segIdx) => {
        if (segment && normalizeDiacritics(segment) === normQ) {
          const thisIndex = matchCounter++;
          const isCurrent = thisIndex === currentMatchIndex;
          return (
            <mark
              key={`${keyPrefix}-find-${segIdx}-${thisIndex}`}
              data-find-match="true"
              data-current-find-match={isCurrent ? 'true' : undefined}
              className={`rounded px-0.5 transition-all ${
                isCurrent
                  ? 'bg-amber-400 text-black font-semibold ring-2 ring-amber-500 shadow-sm'
                  : 'bg-amber-300/40 text-theme-text'
              }`}
            >
              {segment}
            </mark>
          );
        }
        return segment;
      });
    } catch {
      return rawText;
    }
  };

  const renderInlineMarkdown = (text: string): React.ReactNode => {
    // Detects [[Wiki Links]], `code`, **bold**, *italic*
    const parts = text.split(/(\[\[[^\]]+\]\]|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      // Wiki Link [[Title]]
      if (part.startsWith('[[') && part.endsWith(']]')) {
        const wikiTitle = part.slice(2, -2).trim();
        const existingNote = notes.find(
          (n) => n.title.toLowerCase() === wikiTitle.toLowerCase()
        );

        if (existingNote) {
          return (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectNote(existingNote.id, existingNote.subjectId);
              }}
              className="inline-flex items-center space-x-1 px-2 py-0.5 mx-1 rounded-md bg-theme-accent/20 hover:bg-theme-accent/30 text-theme-accent border border-theme-accent/40 font-medium text-xs transition-colors cursor-pointer"
              title={t('note.openWikiLink', { title: wikiTitle })}
            >
              <FileText size={12} className="flex-shrink-0" />
              <span>{wikiTitle}</span>
            </button>
          );
        }

        return (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCreateNoteWithTitle(wikiTitle);
            }}
            className="inline-flex items-center space-x-1 px-2 py-0.5 mx-1 rounded-md bg-theme-card hover:bg-theme-hover text-theme-muted hover:text-theme-text border border-dashed border-white/[0.15] text-xs transition-colors cursor-pointer"
            title={t('note.createWikiLink', { title: wikiTitle })}
          >
            <Plus size={12} className="flex-shrink-0" />
            <span>{wikiTitle}</span>
          </button>
        );
      }

      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 rounded bg-theme-column font-mono text-xs text-theme-accent border border-white/[0.05]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-theme-text">
            {renderTextWithHighlights(part.slice(2, -2), `strong-${i}`)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={i} className="italic text-theme-muted">
            {renderTextWithHighlights(part.slice(1, -1), `em-${i}`)}
          </em>
        );
      }
      return renderTextWithHighlights(part, `text-${i}`);
    });
  };

  const contentLines = content.split('\n');
  const hasCheckboxes = contentLines.some((l) => /^\s*[-*]\s+\[[ xX]\]/.test(l));

  if (viewMode === 'preview') {
    return (
      <div className="min-h-[350px] p-5 rounded-2xl bg-theme-card/30 border border-white/[0.05] space-y-2 text-sm text-theme-text leading-relaxed select-text shadow-xs">
        {content.trim() ? (
          contentLines.map((line, idx) => {
            // Task Checkbox match (- [ ] or - [x])
            const checkMatch = line.match(/^(\s*[-*]\s+)\[([ xX])\]\s*(.*)$/);
            if (checkMatch) {
              const isChecked = checkMatch[2].toLowerCase() === 'x';
              const text = checkMatch[3];

              return (
                <div
                  key={idx}
                  onClick={() => onToggleCheckbox(idx)}
                  className={`flex items-start space-x-2.5 py-1 px-2 rounded-lg cursor-pointer transition-colors group ${
                    isChecked
                      ? 'bg-emerald-500/10 text-theme-muted'
                      : 'hover:bg-theme-hover/60 text-theme-text'
                  }`}
                >
                  <button
                    type="button"
                    className="mt-0.5 shrink-0 text-theme-muted group-hover:text-theme-accent transition-colors"
                  >
                    {isChecked ? (
                      <CheckSquare size={16} className="text-emerald-400 fill-emerald-400/20" />
                    ) : (
                      <Square size={16} className="text-theme-muted" />
                    )}
                  </button>
                  <span className={`text-sm ${isChecked ? 'line-through opacity-70' : ''}`}>
                    {renderInlineMarkdown(text)}
                  </span>
                </div>
              );
            }

            // Headings (#, ##, ###)
            if (line.startsWith('# ')) {
              return (
                <h1 key={idx} className="text-2xl font-bold text-theme-text pt-2 pb-1 border-b border-white/[0.05]">
                  {renderInlineMarkdown(line.slice(2))}
                </h1>
              );
            }
            if (line.startsWith('## ')) {
              return (
                <h2 key={idx} className="text-xl font-semibold text-theme-text pt-2 pb-0.5">
                  {renderInlineMarkdown(line.slice(3))}
                </h2>
              );
            }
            if (line.startsWith('### ')) {
              return (
                <h3 key={idx} className="text-base font-semibold text-theme-text pt-1">
                  {renderInlineMarkdown(line.slice(4))}
                </h3>
              );
            }

            // Bullet Lists (- or *)
            if (/^\s*[-*]\s+/.test(line)) {
              return (
                <li key={idx} className="list-disc list-inside text-sm text-theme-text/90 ml-2">
                  {renderInlineMarkdown(line.replace(/^\s*[-*]\s+/, ''))}
                </li>
              );
            }

            // Empty line
            if (!line.trim()) {
              return <div key={idx} className="h-2" />;
            }

            // Regular paragraph
            return (
              <p key={idx} className="text-sm text-theme-text/90 leading-relaxed">
                {renderInlineMarkdown(line)}
              </p>
            );
          })
        ) : (
          <p className="text-xs text-theme-muted italic">
            {t('note.markdownPlaceholder')}
          </p>
        )}
      </div>
    );
  }

  // Edit Mode: Textarea + Quick Checklists Block
  return (
    <div className="space-y-3">
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
                      <CheckSquare size={14} className="text-emerald-400 fill-emerald-400/20" />
                    ) : (
                      <Square size={14} className="text-theme-muted" />
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
