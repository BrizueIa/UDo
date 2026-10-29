import React, { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenSearchPalette: (initialQuery?: string) => void;
}

export const TopBarSearch: React.FC<Props> = ({
  searchQuery,
  onSearchChange,
  onOpenSearchPalette,
}) => {
  const { t } = useTranslation();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global Ctrl + Shift + F listener to focus & select search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      onSearchChange('');
      searchInputRef.current?.blur();
    } else if (e.key === 'Enter') {
      onOpenSearchPalette(searchQuery);
    }
  };

  return (
    <div className="flex-1 max-w-md mx-2 min-w-0">
      <div className="relative flex items-center group">
        <Search
          size={14}
          className="absolute left-3 text-theme-muted group-hover:text-theme-accent transition-colors pointer-events-none"
        />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder={t('nav.searchPlaceholder')}
          className="w-full bg-theme-card/70 hover:bg-theme-card focus:bg-theme-card text-xs text-theme-text placeholder-theme-muted pl-8 pr-16 py-1.5 rounded-lg outline-none border border-white/[0.06] hover:border-theme-accent/40 focus:border-theme-accent/60 transition-all shadow-inner"
        />
        <div className="absolute right-2.5 flex items-center space-x-1">
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="text-theme-muted hover:text-theme-text p-0.5 cursor-pointer"
              title={t('nav.clearSearch')}
            >
              <X size={12} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenSearchPalette(searchQuery)}
            className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-theme-hover text-theme-muted border border-white/[0.06] hover:border-theme-accent/40 hover:text-theme-text transition-colors cursor-pointer"
            title="Ctrl + K"
          >
            Ctrl K
          </button>
        </div>
      </div>
    </div>
  );
};
