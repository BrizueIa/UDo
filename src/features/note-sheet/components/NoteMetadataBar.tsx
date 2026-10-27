import React, { useState } from 'react';
import { Clock, Tag, Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatRelativeTime } from '../../../shared/utils/formatTime';

interface Props {
  updatedAt: string;
  tags: string[];
  activeTagFilter?: string | null;
  onSelectTagFilter: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onAddTag: (tag: string) => void;
}

export const NoteMetadataBar: React.FC<Props> = ({
  updatedAt,
  tags,
  activeTagFilter,
  onSelectTagFilter,
  onRemoveTag,
  onAddTag,
}) => {
  const { t, i18n } = useTranslation();
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      onAddTag(newTagInput.trim());
      setNewTagInput('');
      setShowTagInput(false);
    } else if (e.key === 'Escape') {
      setShowTagInput(false);
      setNewTagInput('');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-theme-muted">
      {/* Modification Time */}
      <span className="flex items-center space-x-1.5">
        <Clock size={13} />
        <span>
          {t('note.modified')}: {formatRelativeTime(updatedAt, i18n.language)}
        </span>
      </span>

      {/* Tags List */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Tag size={13} className="text-theme-muted flex-shrink-0" />
        {tags.map((tag) => {
          const isActive = activeTagFilter === tag;
          return (
            <span
              key={tag}
              onClick={() => onSelectTagFilter(tag)}
              className={`inline-flex items-center space-x-1 pl-2 pr-1.5 py-0.5 rounded-md cursor-pointer transition-colors text-xs ${
                isActive
                  ? 'bg-theme-accent text-white font-semibold shadow-sm'
                  : 'bg-theme-card text-theme-text hover:bg-theme-hover border border-white/[0.05]'
              }`}
              title={t('note.filterByTag', { tag })}
            >
              <span>#{tag}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveTag(tag);
                }}
                className={`p-0.5 rounded hover:bg-red-500/20 hover:text-red-400 transition-colors ${
                  isActive ? 'text-white/80 hover:text-white' : 'text-theme-muted'
                }`}
                title={t('note.removeTag')}
              >
                <X size={11} />
              </button>
            </span>
          );
        })}

        {showTagInput ? (
          <input
            type="text"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => setShowTagInput(false)}
            placeholder={t('note.tagPlaceholder')}
            autoFocus
            className="bg-theme-card px-2 py-0.5 rounded text-xs outline-none border border-theme-accent text-theme-text shadow-inner"
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowTagInput(true)}
            className="flex items-center space-x-1 px-2 py-0.5 rounded-md hover:bg-theme-card text-theme-muted hover:text-theme-text transition-colors"
            title={t('note.addTag')}
          >
            <Plus size={12} />
            <span>{t('note.addTag')}</span>
          </button>
        )}
      </div>
    </div>
  );
};
