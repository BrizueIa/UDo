import React, { useState, useRef, useEffect } from 'react';
import { ThemeId, AccentColor, CustomThemeDefinition } from '../types';
import { Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeSettingsPanel } from './ThemeSettingsPanel';
import { PRESET_THEMES, ACCENTS } from '../data/themePresets';

export { PRESET_THEMES, ACCENTS };

interface Props {
  currentTheme: ThemeId;
  currentAccent: AccentColor;
  customThemes: CustomThemeDefinition[];
  onSelectTheme: (theme: ThemeId) => void;
  onSelectAccent: (accent: AccentColor) => void;
  onImportCustomTheme: (theme: CustomThemeDefinition) => void;
  onDeleteCustomTheme: (id: string) => void;
}

export const ThemeSelectorMenu: React.FC<Props> = ({
  currentTheme,
  currentAccent,
  customThemes,
  onSelectTheme,
  onSelectAccent,
  onImportCustomTheme,
  onDeleteCustomTheme,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, currentTheme]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
          isOpen ? 'text-theme-text bg-theme-hover' : 'hover:text-theme-text hover:bg-theme-hover'
        }`}
        title={t('settings.theme')}
      >
        <Palette size={15} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            onMouseLeave={() => document.documentElement.setAttribute('data-theme', currentTheme)}
            className="absolute right-0 top-full mt-2 w-80 bg-theme-card border border-theme-border rounded-xl shadow-2xl p-3 z-50 overflow-hidden"
          >
            <ThemeSettingsPanel
              currentTheme={currentTheme}
              currentAccent={currentAccent}
              customThemes={customThemes}
              onSelectTheme={onSelectTheme}
              onSelectAccent={onSelectAccent}
              onImportCustomTheme={onImportCustomTheme}
              onDeleteCustomTheme={onDeleteCustomTheme}
              onCloseMenu={() => setIsOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
