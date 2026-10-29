import React, { useState } from 'react';
import { NoteFindBar } from './NoteFindBar';
import { RichTextToolbar } from './RichTextToolbar';
import { useRichTextSelection } from '../hooks/useRichTextSelection';
import { useTranslation } from 'react-i18next';
import { renderRichTitle } from '../utils/inlineRichTextParser';

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
  const [isEditing, setIsEditing] = useState(false);
  const {
    inputRef,
    coords,
    handleMouseUp,
    handleKeyUp,
    closeToolbar,
  } = useRichTextSelection<HTMLInputElement>();

  return (
    <div className="flex items-center justify-between gap-4">
      {isEditing ? (
        <div className="relative w-full">
          <input
            ref={inputRef}
            type="text"
            autoFocus
            value={localTitle}
            onChange={onTitleChange}
            onMouseUp={handleMouseUp}
            onKeyUp={handleKeyUp}
            onBlur={(e) => {
              if (
                e.relatedTarget &&
                (e.relatedTarget as HTMLElement).closest('[data-rich-toolbar="true"]')
              ) {
                return;
              }
              setIsEditing(false);
              closeToolbar();
              onBlur();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsEditing(false);
                closeToolbar();
                onBlur();
              }
            }}
            placeholder={t('note.titlePlaceholder')}
            className={`w-full text-3xl font-bold bg-transparent outline-none border-b border-theme-accent/60 pb-1 transition-colors ${
              isCompleted ? 'line-through text-theme-muted opacity-80' : 'text-theme-text'
            }`}
          />
          <RichTextToolbar
            inputRef={inputRef}
            content={localTitle}
            coords={coords}
            onChangeContent={(newTitle) => {
              onTitleChange({ target: { value: newTitle } } as any);
            }}
            onClose={closeToolbar}
          />
        </div>
      ) : (
        <div
          onClick={() => {
            setIsEditing(true);
            setTimeout(() => inputRef.current?.focus(), 20);
          }}
          className={`w-full text-3xl font-bold pb-1 cursor-text select-text transition-colors border-b border-transparent hover:border-theme-border/40 ${
            isCompleted ? 'line-through text-theme-muted opacity-80' : 'text-theme-text'
          }`}
          title={t('note.clickToEditTitle')}
        >
          {localTitle ? (
            renderRichTitle(localTitle)
          ) : (
            <span className="text-theme-muted/50 font-normal italic text-2xl">
              {t('note.titlePlaceholder')}
            </span>
          )}
        </div>
      )}

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
            <span className="text-xs">🔍</span>
          </button>
        )}
      </div>
    </div>
  );
};
