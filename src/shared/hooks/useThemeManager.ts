import { useState, useEffect } from 'react';
import { ThemeId, AccentColor, CustomThemeDefinition } from '../types';
import {
  applyCustomThemeStyles,
  removeCustomThemeStyles,
  getCustomThemes,
  saveCustomTheme,
  deleteCustomTheme,
} from '../utils/themeImporter';

export function useThemeManager() {
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(() => {
    return (localStorage.getItem('udo_theme') as ThemeId) || 'tokyo-night';
  });

  const [currentAccent, setCurrentAccent] = useState<AccentColor>(() => {
    const saved = localStorage.getItem('udo_accent') as AccentColor;
    if (saved && saved !== 'purple') return saved;
    return 'default';
  });

  const [customThemes, setCustomThemes] = useState<CustomThemeDefinition[]>(() => {
    return getCustomThemes();
  });

  // Apply theme & custom theme styles to DOM
  useEffect(() => {
    if (currentTheme.startsWith('custom-')) {
      const custom = customThemes.find((t) => t.id === currentTheme);
      if (custom) {
        applyCustomThemeStyles(custom);
      }
    } else {
      removeCustomThemeStyles();
      document.documentElement.setAttribute('data-theme', currentTheme);
    }
    localStorage.setItem('udo_theme', currentTheme);
  }, [currentTheme, customThemes]);

  // Apply accent to DOM (only override theme accent if explicitly chosen)
  useEffect(() => {
    if (currentAccent === 'default') {
      document.documentElement.removeAttribute('data-accent');
    } else {
      document.documentElement.setAttribute('data-accent', currentAccent);
    }
    localStorage.setItem('udo_accent', currentAccent);
  }, [currentAccent]);

  const handleImportCustomTheme = (theme: CustomThemeDefinition) => {
    saveCustomTheme(theme);
    setCustomThemes((prev) => [...prev.filter((t) => t.id !== theme.id), theme]);
    setCurrentTheme(theme.id);
  };

  const handleDeleteCustomTheme = (id: string) => {
    deleteCustomTheme(id);
    setCustomThemes((prev) => prev.filter((t) => t.id !== id));
    if (currentTheme === id) {
      removeCustomThemeStyles();
      setCurrentTheme('tokyo-night');
    }
  };

  return {
    currentTheme,
    setCurrentTheme,
    currentAccent,
    setCurrentAccent,
    customThemes,
    handleImportCustomTheme,
    handleDeleteCustomTheme,
  };
}
