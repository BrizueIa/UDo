import React, { useState, useEffect } from 'react';
import { NoteItem, SubjectItem, FolderItem } from '../../../shared/types';
import { Search, Hash, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  isOpen: boolean;
  notes: NoteItem[];
  subjects: SubjectItem[];
  folders: FolderItem[];
  onClose: () => void;
  onSelectNote: (noteId: string, subjectId: string) => void;
}

export const CommandPalette: React.FC<Props> = ({
  isOpen,
  notes,
  subjects,
  folders,
  onClose,
  onSelectNote,
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  const filteredNotes = query.trim()
    ? notes.filter((n) => {
        const q = query.toLowerCase();
        return (
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      })
    : notes.slice(0, 10);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((idx) => Math.min(filteredNotes.length - 1, idx + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((idx) => Math.max(0, idx - 1));
    } else if (e.key === 'Enter' && filteredNotes[selectedIndex]) {
      e.preventDefault();
      const selected = filteredNotes[selectedIndex];
      onSelectNote(selected.id, selected.subjectId);
      onClose();
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
          {filteredNotes.length === 0 ? (
            <div className="py-8 text-center text-xs text-theme-muted">
              No matching notes found for "{query}"
            </div>
          ) : (
            filteredNotes.map((note, idx) => {
              const isSelected = idx === selectedIndex;
              const subject = subjects.find((s) => s.id === note.subjectId);
              const folder = folders.find((f) => f.id === note.folderId);

              return (
                <div
                  key={note.id}
                  onClick={() => {
                    onSelectNote(note.id, note.subjectId);
                    onClose();
                  }}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected ? 'bg-theme-card text-theme-text border border-theme-accent/40' : 'hover:bg-theme-hover/60 text-theme-muted'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <FileText size={15} className="text-theme-accent flex-shrink-0" />
                    <span className="text-xs font-medium text-theme-text truncate">
                      {note.title}
                    </span>
                    {note.tags.length > 0 && (
                      <span className="flex items-center space-x-1 text-[11px] text-theme-muted">
                        <Hash size={11} />
                        <span>{note.tags[0]}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 text-[11px] text-theme-muted">
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
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
