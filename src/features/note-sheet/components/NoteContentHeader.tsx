import React, { useState, useRef, useEffect } from 'react';
import { Eye, Edit3, ListTodo, LayoutTemplate } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NoteTemplatePicker } from './NoteTemplatePicker';

interface Props {
  viewMode: 'preview' | 'edit';
  onSetViewMode: (mode: 'preview' | 'edit') => void;
  onInsertTask: () => void;
  onSelectTemplate: (content: string, title?: string) => void;
}

export const NoteContentHeader: React.FC<Props> = ({
  viewMode,
  onSetViewMode,
  onInsertTask,
  onSelectTemplate,
}) => {
  const { t } = useTranslation();
  const [showTemplates, setShowTemplates] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowTemplates(false);
      }
    };
    if (showTemplates) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTemplates]);

  return (
    <div className="flex items-center justify-between pb-1 border-b border-white/[0.05]">
      <span className="text-[11px] font-bold tracking-wider text-theme-muted uppercase">
        {t('note.sheetContent')}
      </span>

      <div className="flex items-center space-x-2">
        {/* Template Picker Dropdown */}
        <div ref={containerRef} className="relative">
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-theme-card hover:bg-theme-hover text-theme-muted hover:text-theme-text border border-white/[0.05] text-xs transition-colors"
            title={t('templates.title')}
          >
            <LayoutTemplate size={13} className="text-amber-400" />
            <span className="text-[11px] font-medium">{t('templates.title')}</span>
          </button>
          {showTemplates && (
            <NoteTemplatePicker
              variant="dropdown"
              onSelectTemplate={(content, title) => {
                onSelectTemplate(content, title);
                setShowTemplates(false);
              }}
              onClose={() => setShowTemplates(false)}
            />
          )}
        </div>

        {/* Task Insertion Button */}
        <button
          type="button"
          onClick={onInsertTask}
          className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-theme-card hover:bg-theme-hover text-theme-muted hover:text-theme-text border border-white/[0.05] text-xs transition-colors"
          title={t('note.addTask')}
        >
          <ListTodo size={13} className="text-theme-accent" />
          <span className="text-[11px] font-medium">{t('note.addTask')}</span>
        </button>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-theme-card p-0.5 rounded-lg border border-white/[0.05]">
          <button
            type="button"
            onClick={() => onSetViewMode('preview')}
            className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              viewMode === 'preview'
                ? 'bg-theme-accent text-white shadow-xs'
                : 'text-theme-muted hover:text-theme-text'
            }`}
          >
            <Eye size={12} />
            <span>{t('note.interactive')}</span>
          </button>
          <button
            type="button"
            onClick={() => onSetViewMode('edit')}
            className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              viewMode === 'edit'
                ? 'bg-theme-accent text-white shadow-xs'
                : 'text-theme-muted hover:text-theme-text'
            }`}
            title="Ctrl + E"
          >
            <Edit3 size={12} />
            <span>{t('note.markdown')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
