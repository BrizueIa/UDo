import { CustomThemeDefinition } from '../types';

const CUSTOM_THEMES_KEY = 'udo_custom_themes_v1';

/**
 * Strips 8-digit hex (#rrggbbaa) to 6-digit hex (#rrggbb) if needed
 */
function normalizeHex(color?: string, fallback: string = '#1e1e1e'): string {
  if (!color || typeof color !== 'string') return fallback;
  const trimmed = color.trim();
  if (trimmed.startsWith('#')) {
    if (trimmed.length === 9) {
      return trimmed.substring(0, 7); // Strip alpha
    }
    if (trimmed.length === 4) {
      // #rgb -> #rrggbb
      return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
    }
    return trimmed;
  }
  return trimmed;
}

/**
 * Parses a Visual Studio Code theme JSON string and produces a UDo theme definition
 */
export function parseVSCodeTheme(
  jsonContent: string,
  nameOverride?: string
): CustomThemeDefinition {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonContent);
  } catch (err) {
    throw new Error('Invalid JSON format: please verify the VS Code theme file content.');
  }

  const colors = parsed.colors || {};
  const isDark = parsed.type !== 'light';

  const defaultBg = isDark ? '#1e1e2e' : '#f8f9fa';
  const defaultText = isDark ? '#e2e8f0' : '#1e293b';

  const bgBase = normalizeHex(colors['editor.background'] || colors['background'], defaultBg);
  const bgSidebar = normalizeHex(colors['sideBar.background'] || colors['activityBar.background'], bgBase);
  const bgColumn = normalizeHex(colors['editorGroupHeader.tabsBackground'] || colors['sideBarSectionHeader.background'], bgBase);
  const bgCard = normalizeHex(colors['editorWidget.background'] || colors['input.background'] || colors['dropdown.background'], bgBase);
  const bgHover = normalizeHex(colors['list.hoverBackground'] || colors['list.activeSelectionBackground'], '#374151');
  const border = normalizeHex(colors['panel.border'] || colors['editorGroup.border'] || colors['sideBar.border'] || colors['input.border'], '#4b5563');
  const textMain = normalizeHex(colors['editor.foreground'] || colors['foreground'], defaultText);
  const textMuted = normalizeHex(colors['descriptionForeground'] || colors['editorLineNumber.foreground'], '#94a3b8');
  const accent = normalizeHex(colors['activityBarBadge.background'] || colors['button.background'] || colors['focusBorder'], '#6366f1');

  const themeName = nameOverride || parsed.name || 'Imported Theme';
  const id = `custom-${Date.now()}`;

  return {
    id,
    name: themeName,
    colors: {
      bgBase,
      bgSidebar,
      bgColumn,
      bgCard,
      bgHover,
      border,
      textMain,
      textMuted,
      accent,
    },
  };
}

/**
 * Injects custom CSS variables into the document element
 */
export function applyCustomThemeStyles(theme: CustomThemeDefinition) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme.id);

  root.style.setProperty('--color-bg-base', theme.colors.bgBase);
  root.style.setProperty('--color-bg-sidebar', theme.colors.bgSidebar);
  root.style.setProperty('--color-bg-column', theme.colors.bgColumn);
  root.style.setProperty('--color-bg-card', theme.colors.bgCard);
  root.style.setProperty('--color-bg-hover', theme.colors.bgHover);
  root.style.setProperty('--color-border', theme.colors.border);
  root.style.setProperty('--color-text-main', theme.colors.textMain);
  root.style.setProperty('--color-text-muted', theme.colors.textMuted);
  root.style.setProperty('--color-accent', theme.colors.accent);
  root.style.setProperty('--color-accent-glow', `${theme.colors.accent}40`);
  root.style.setProperty('--color-accent-hover', theme.colors.accent);
}

/**
 * Clears custom style overrides from the document element
 */
export function removeCustomThemeStyles() {
  const root = document.documentElement;
  const props = [
    '--color-bg-base',
    '--color-bg-sidebar',
    '--color-bg-column',
    '--color-bg-card',
    '--color-bg-hover',
    '--color-border',
    '--color-text-main',
    '--color-text-muted',
    '--color-accent',
    '--color-accent-glow',
    '--color-accent-hover',
  ];
  props.forEach((p) => root.style.removeProperty(p));
}

export function getCustomThemes(): CustomThemeDefinition[] {
  try {
    const raw = localStorage.getItem(CUSTOM_THEMES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to parse custom themes from localStorage', e);
    return [];
  }
}

export function saveCustomTheme(theme: CustomThemeDefinition): void {
  const themes = getCustomThemes().filter((t) => t.id !== theme.id);
  themes.push(theme);
  localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(themes));
}

export function deleteCustomTheme(id: string): void {
  const themes = getCustomThemes().filter((t) => t.id !== id);
  localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(themes));
}
