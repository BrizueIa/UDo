import React from 'react';
import { NoteFindBar } from './NoteFindBar';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  localTitle: string;
  isCompleted: boolean;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  isFindBarOpen: boolean;
  findQuery: string;
  currentMatchIndex: number;
  totalMatches: number;
  onSetIsFindBarOpen: (open: boolean) => void;
  onSetFindQuery: (q: string) => void;
  onSetCurrentMatchIndex: (idx: number | ((prev: number) => number)) => void;
}

export const NoteTitleBar: React.FC<Props> = ({
  localTitle,
  isCompleted,
  onTitleChange,
  onBlur,
  isFindBarOpen,
  findQuery,
  currentMatchIndex,
  totalMatches,
  onSetIsFindBarOpen,
  onSetFindQuery,
  onSetCurrentMatchIndex,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-4">
      <input
        type="text"
        value={localTitle}
        onChange={onTitleChange}
        onBlur={onBlur}
        placeholder={t('note.titlePlaceholder')}
        className={`w-full text-3xl font-bold bg-transparent outline-none border-b border-transparent focus:border-theme-accent/50 pb-1 transition-colors ${
          isCompleted ? 'line-through text-theme-muted opacity-80' : 'text-theme-text'
        }`}
      />

      {/* Find in Note Trigger & Toolbar */}
      <div className="flex-shrink-0 flex items-center space-x-2">
        <NoteFindBar
          isOpen={isFindBarOpen}
          findQuery={findQuery}
          matchIndex={currentMatchIndex}
          totalMatches={totalMatches}
          onChangeQuery={(q) => {
            onSetFindQuery(q);
            onSetCurrentMatchIndex(0);
          }}
          onNextMatch={() => {
            if (totalMatches > 0) {
              onSetCurrentMatchIndex((prev) => (prev + 1) % totalMatches);
            }
          }}
          onPrevMatch={() => {
            if (totalMatches > 0) {
              onSetCurrentMatchIndex((prev) => (prev - 1 + totalMatches) % totalMatches);
            }
          }}
          onClose={() => {
            onSetIsFindBarOpen(false);
            onSetFindQuery('');
            onSetCurrentMatchIndex(0);
          }}
        />
        {!isFindBarOpen && (
          <button
            type="button"
            onClick={() => onSetIsFindBarOpen(true)}
            className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-card border border-white/[0.05] transition-colors cursor-pointer"
            title={t('note.findInNote')}
          >
            <Search size={15} />
          </button>
        )}
      </div>
    </div>
  );
};
