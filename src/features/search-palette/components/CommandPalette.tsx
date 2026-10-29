import React, { useState, useEffect } from 'react';
import { NoteItem, SubjectItem, FolderItem } from '../../../shared/types';
import { Search, Hash, FileText, CornerDownLeft, ArrowUpDown, Paperclip } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../../shared/api/ipc';
import { buildDiacriticRegex, normalizeDiacritics } from '../../../shared/utils/diacritics';
import { renderRichTitle } from '../../note-sheet/utils/inlineRichTextParser';

interface Props {
  isOpen: boolean;
  initialQuery?: string;
  notes: NoteItem[];
  subjects: SubjectItem[];
  folders: FolderItem[];
  isVaultUnlocked?: boolean;
  onClose: () => void;
  onSelectNote: (noteId: string, subjectId: string) => void;
}

export const CommandPalette: React.FC<Props> = ({
  isOpen,
  initialQuery = '',
  notes,
  subjects,
  folders,
  isVaultUnlocked = false,
  onClose,
  onSelectNote,
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState(initialQuery);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<NoteItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setSelectedIndex(0);
    }
  }, [isOpen, initialQuery]);

  // Query SQLite FTS5 index via api.searchNotes
  useEffect(() => {
    let isCancelled = false;
    const trimmed = query.trim();
    const privateSubIds = new Set(subjects.filter((s) => s.isPrivate).map((s) => s.id));
    const allowedNotes = isVaultUnlocked
      ? notes
      : notes.filter((n) => !privateSubIds.has(n.subjectId));

    if (!trimmed) {
      setResults(allowedNotes.slice(0, 10));
      return;
    }

    api.searchNotes(trimmed, isVaultUnlocked).then((res) => {
      if (!isCancelled) {
        setResults(res);
        setSelectedIndex(0);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [query, notes, subjects, isVaultUnlocked]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((idx) => Math.min(results.length - 1, idx + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((idx) => Math.max(0, idx - 1));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      const selected = results[selectedIndex];
      onSelectNote(selected.id, selected.subjectId);
      onClose();
    }
  };

  // Helper to extract a context snippet if content matches (diacritic-insensitive)
  const getContentSnippet = (content: string, q: string) => {
    if (!q.trim()) return null;
    try {
      const regex = buildDiacriticRegex(q.trim());
      const match = regex.exec(content);
      if (!match) return null;

      const matchPos = match.index;
      const matchedLength = match[0].length;
      const start = Math.max(0, matchPos - 25);
      const end = Math.min(content.length, matchPos + matchedLength + 35);
      const prefix = start > 0 ? '...' : '';
      const suffix = end < content.length ? '...' : '';
      return `${prefix}${content.substring(start, end).replace(/\n/g, ' ')}${suffix}`;
    } catch {
      return null;
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 px-4 select-none animate-in fade-in duration-100"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-theme-sidebar border border-theme-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Search Input Header */}
        <div className="flex items-center space-x-3 px-4 py-3.5 border-b border-theme-border">
          <Search size={18} className="text-theme-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('nav.searchPlaceholder')}
            autoFocus
            className="flex-1 bg-transparent text-sm text-theme-text placeholder-theme-muted outline-none"
          />
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-theme-hover text-theme-muted border border-theme-border/50">
            Esc
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {results.length === 0 ? (
            <div className="py-8 text-center text-xs text-theme-muted">
              {query.trim()
                ? t('palette.noResults', { query })
                : t('palette.noNotes')}
            </div>
          ) : (
            results.map((note, idx) => {
              const isSelected = idx === selectedIndex;
              const subject = subjects.find((s) => s.id === note.subjectId);
              const folder = folders.find((f) => f.id === note.folderId);
              const snippet = getContentSnippet(note.content, query.trim());
              const normQ = normalizeDiacritics(query.trim().toLowerCase());
              const matchingAttachment = normQ ? note.attachments?.find((a) =>
                normalizeDiacritics(a.name || '').toLowerCase().includes(normQ) ||
                (normQ.startsWith('.') && a.extension?.toLowerCase() === normQ.slice(1)) ||
                a.extension?.toLowerCase() === normQ
              ) : undefined;

              return (
                <div
                  key={note.id}
                  onClick={() => {
                    onSelectNote(note.id, note.subjectId);
                    onClose();
                  }}
                  className={`flex flex-col space-y-1 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-theme-card text-theme-text border border-theme-accent/40 shadow-xs'
                      : 'hover:bg-theme-hover/60 text-theme-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <FileText size={15} className="text-theme-accent flex-shrink-0" />
                      <span className="text-xs font-medium text-theme-text truncate">
                        {renderRichTitle(note.title || t('note.untitled', 'Untitled note'))}
                      </span>
                      {matchingAttachment && (
                        <span className="flex items-center space-x-1 text-[11px] text-theme-accent bg-theme-accent/10 px-1.5 py-0.5 rounded-md border border-theme-accent/20 truncate">
                          <Paperclip size={10} className="shrink-0" />
                          <span className="truncate max-w-[120px]">{matchingAttachment.name}</span>
                        </span>
                      )}
                      {note.tags.length > 0 && !matchingAttachment && (
                        <span className="flex items-center space-x-0.5 text-[11px] text-theme-muted">
                          <Hash size={11} />
                          <span>{note.tags[0]}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 text-[11px] text-theme-muted flex-shrink-0">
                      {subject && (
                        <span className="flex items-center space-x-1">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: subject.color }}
                          />
                          <span>{subject.name}</span>
                        </span>
                      )}
                      {folder && <span>/ {folder.name}</span>}
                    </div>
                  </div>

                  {/* Context Preview of Matching Text (FR-05) */}
                  {snippet && (
                    <div className="pl-6 text-[11px] text-theme-muted/80 font-mono italic truncate">
                      "{snippet}"
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="px-3 py-2 bg-theme-column/60 border-t border-theme-border/60 flex items-center justify-between text-[11px] text-theme-muted">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <ArrowUpDown size={12} />
              <span>{t('palette.navigate')}</span>
            </span>
            <span className="flex items-center space-x-1">
              <CornerDownLeft size={12} />
              <span>{t('palette.open')}</span>
            </span>
          </div>
          <span>{t('palette.closeHint')}</span>
        </div>
      </div>
    </div>
  );
};
