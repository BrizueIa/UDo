import { AccentColor, ThemePreset } from '../types';

export const PRESET_THEMES: ThemePreset[] = [
  // Temas Oscuros
  { id: 'udo-original', name: 'UDo', category: 'dark', previewColors: ['#5551f5', '#1fd4a5', '#ffc95f'] },
  { id: 'tokyo-night', name: 'Tokyo Night', category: 'dark', previewColors: ['#1a1b26', '#7aa2f7', '#bb9af7'] },
  { id: 'default-dark', name: 'Default Dark', category: 'dark', previewColors: ['#1e1e1e', '#007acc', '#cccccc'] },
  { id: 'catppuccin-mocha', name: 'Catppuccin Mocha', category: 'dark', previewColors: ['#1e1e2e', '#cba6f7', '#89b4fa'] },
  { id: 'dracula', name: 'Dracula', category: 'dark', previewColors: ['#282a36', '#bd93f9', '#ff79c6'] },
  { id: 'gruvbox', name: 'Gruvbox Material', category: 'dark', previewColors: ['#282828', '#fe8019', '#fabd2f'] },
  { id: 'monokai', name: 'Monokai', category: 'dark', previewColors: ['#272822', '#a6e22e', '#fd971f'] },
  { id: 'one-dark', name: 'One Dark Pro', category: 'dark', previewColors: ['#21252b', '#61afef', '#98c379'] },
  { id: 'solarized-dark', name: 'Solarized Dark', category: 'dark', previewColors: ['#002b36', '#268bd2', '#2aa198'] },
  { id: 'vesper', name: 'Vesper', category: 'dark', previewColors: ['#101010', '#ffc799', '#ffffff'] },
  { id: 'oled', name: 'OLED Pure Black', category: 'dark', previewColors: ['#000000', '#6366f1', '#fafafa'] },
  { id: 'nord', name: 'Nord', category: 'dark', previewColors: ['#2e3440', '#88c0d0', '#81a1c1'] },
  { id: 'rose-pine', name: 'Rosé Pine', category: 'dark', previewColors: ['#191724', '#ebbcba', '#c4a7e7'] },
  { id: 'synthwave', name: "Synthwave '84", category: 'dark', previewColors: ['#1f1635', '#fe4450', '#ff7edb'] },

  // Temas Claros
  { id: 'default-light', name: 'Default Light', category: 'light', previewColors: ['#ffffff', '#0969da', '#1f2328'] },
  { id: 'catppuccin-latte', name: 'Catppuccin Latte', category: 'light', previewColors: ['#eff1f5', '#8839ef', '#4c4f69'] },
  { id: 'gruvbox-light', name: 'Gruvbox Material', category: 'light', previewColors: ['#fbf1c7', '#af3a03', '#3c3836'] },
  { id: 'one-light', name: 'One Light', category: 'light', previewColors: ['#fafafa', '#4078f2', '#383a42'] },
  { id: 'solarized-light', name: 'Solarized Light', category: 'light', previewColors: ['#fdf6e3', '#268bd2', '#657b83'] },
];

export const ACCENTS: { id: AccentColor; nameKey: string; color: string }[] = [
  { id: 'default', nameKey: 'settings.originalTheme', color: 'var(--color-accent)' },
  { id: 'blue', nameKey: 'Blue', color: '#3b82f6' },
  { id: 'purple', nameKey: 'Purple', color: '#8b5cf6' },
  { id: 'emerald', nameKey: 'Emerald', color: '#10b981' },
  { id: 'amber', nameKey: 'Amber', color: '#f59e0b' },
  { id: 'rose', nameKey: 'Rose', color: '#f43f5e' },
  { id: 'cyan', nameKey: 'Cyan', color: '#06b6d4' },
];
