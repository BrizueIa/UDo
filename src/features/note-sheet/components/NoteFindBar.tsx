import React, { useEffect, useRef } from 'react';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  isOpen: boolean;
  findQuery: string;
  matchIndex: number;
  totalMatches: number;
  onChangeQuery: (q: string) => void;
  onNextMatch: () => void;
  onPrevMatch: () => void;
  onClose: () => void;
}

export const NoteFindBar: React.FC<Props> = ({
  isOpen,
  findQuery,
  matchIndex,
  totalMatches,
  onChangeQuery,
  onNextMatch,
  onPrevMatch,
  onClose,
}) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        onPrevMatch();
      } else {
        onNextMatch();
      }
    }
  };

  const matchLabel =
    findQuery.trim().length === 0
      ? ''
      : totalMatches > 0
      ? `${matchIndex + 1} / ${totalMatches}`
      : '0 / 0';

  return (
    <div className="flex items-center space-x-2 bg-theme-sidebar/95 border border-theme-border/80 px-3 py-1.5 rounded-xl shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-1 duration-150 text-xs">
      <Search size={14} className="text-theme-muted flex-shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={findQuery}
        onChange={(e) => onChangeQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('note.findInNotePlaceholder')}
        className="bg-transparent text-xs text-theme-text placeholder-theme-muted outline-none w-44"
      />

      {findQuery.trim().length > 0 && (
        <span
          className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${
            totalMatches > 0
              ? 'bg-theme-card text-theme-text border border-white/[0.05]'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {matchLabel}
        </span>
      )}

      <div className="flex items-center space-x-0.5 border-l border-theme-border/60 pl-1.5 text-theme-muted">
        <button
          type="button"
          onClick={onPrevMatch}
          disabled={totalMatches === 0}
          className="p-1 rounded hover:bg-theme-hover hover:text-theme-text disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title={t('note.prevMatch')}
        >
          <ChevronUp size={14} />
        </button>
        <button
          type="button"
          onClick={onNextMatch}
          disabled={totalMatches === 0}
          className="p-1 rounded hover:bg-theme-hover hover:text-theme-text disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title={t('note.nextMatch')}
        >
          <ChevronDown size={14} />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-theme-hover hover:text-theme-text transition-colors ml-1"
          title={t('note.closeFind')}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
