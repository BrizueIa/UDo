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
    { id: 'all', label: `${t('nav.filterAll')} (${totalCount})` },
    { id: 'pending', label: `${t('nav.filterPending')} (${pendingCount})` },
    { id: 'completed', label: `${t('nav.filterCompleted')} (${completedCount})` },
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
            <span className="relative z-10 text-[11px]">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
