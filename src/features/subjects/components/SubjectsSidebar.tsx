import React from 'react';
import { SubjectItem } from '../../../shared/types';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

interface Props {
  subjects: SubjectItem[];
  selectedSubjectId: string;
  onSelectSubject: (id: string) => void;
  onAddSubject: () => void;
  getSubjectNoteCount: (id: string) => number;
}

export const SubjectsSidebar: React.FC<Props> = ({
  subjects,
  selectedSubjectId,
  onSelectSubject,
  onAddSubject,
  getSubjectNoteCount,
}) => {
  const { t } = useTranslation();

  return (
    <aside className="w-56 flex-shrink-0 bg-theme-sidebar border-r border-theme-border flex flex-col h-full select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-theme-border/50">
        <span className="text-xs font-semibold tracking-wider text-theme-muted uppercase">
          {t('nav.subjects')}
        </span>
        <button
          onClick={onAddSubject}
          className="p-1 rounded-md text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors"
          title={t('nav.addSubject')}
        >
          <Plus size={15} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {subjects.map((subject) => {
          const isSelected = subject.id === selectedSubjectId;
          const count = getSubjectNoteCount(subject.id);

          return (
            <motion.button
              key={subject.id}
              onClick={() => onSelectSubject(subject.id)}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-theme-card text-theme-text shadow-sm border border-theme-accent/30'
                  : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover/60 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: subject.color }}
                />
                <span className="truncate text-[13px]">{subject.name}</span>
              </div>

              {count > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-mono text-[11px] ${
                    isSelected
                      ? 'bg-theme-accent/20 text-theme-accent font-semibold'
                      : 'bg-theme-card/70 text-theme-muted'
                  }`}
                >
                  {count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </aside>
  );
};
