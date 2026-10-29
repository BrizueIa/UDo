import React from 'react';
import { ViewFilter } from '../shared/types';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface Props {
  filter: ViewFilter;
  pendingCount: number;
  completedCount: number;
  totalCount: number;
  onFilterChange: (f: ViewFilter) => void;
}

export const TopBarFilterTabs: React.FC<Props> = ({
  filter,
  pendingCount,
  completedCount,
  totalCount,
  onFilterChange,
}) => {
  const { t } = useTranslation();

  const filterTabs = [
    { id: 'all', label: t('nav.filterAll'), count: totalCount, dotColor: null },
    { id: 'pending', label: t('nav.filterPending'), count: pendingCount, dotColor: 'bg-amber-400' },
    { id: 'completed', label: t('nav.filterCompleted'), count: completedCount, dotColor: 'bg-[#1fd4a5]' },
  ];

  return (
    <div className="hidden lg:flex items-center bg-theme-column/80 p-0.5 rounded-lg border border-white/[0.05] text-xs font-medium">
      {filterTabs.map((tab) => {
        const isSelected = filter === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onFilterChange(tab.id as ViewFilter)}
            className={`relative px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              isSelected ? 'text-white font-semibold' : 'text-theme-muted hover:text-theme-text'
            }`}
          >
            {isSelected && (
              <motion.div
                layoutId="topbar-active-filter"
                className="absolute inset-0 bg-theme-accent rounded-md shadow-sm"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            <span className="relative z-10 text-[11px] flex items-center space-x-1">
              {tab.dotColor && <span className={`w-1.5 h-1.5 rounded-[2px] ${tab.dotColor}`} />}
              <span>{tab.label}</span>
              <span className="opacity-75 font-mono text-[10px]">({tab.count})</span>
            </span>
          </button>
        );
      })}
    </div>
  );
};
