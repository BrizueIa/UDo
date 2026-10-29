export type ThemeId =
  | 'udo-original'
  | 'tokyo-night'
  | 'default-dark'
  | 'catppuccin-mocha'
  | 'dracula'
  | 'gruvbox'
  | 'monokai'
  | 'one-dark'
  | 'solarized-dark'
  | 'vesper'
  | 'oled'
  | 'nord'
  | 'rose-pine'
  | 'synthwave'
  | 'default-light'
  | 'catppuccin-latte'
  | 'gruvbox-light'
  | 'one-light'
  | 'solarized-light'
  | (string & {});

export interface ThemePreset {
  id: ThemeId;
  name: string;
  category: 'dark' | 'light';
  icon: string;
  previewColors: [string, string, string];
}

export type AccentColor = 'default' | 'purple' | 'blue' | 'emerald' | 'amber' | 'rose' | 'cyan';

export interface CustomThemeDefinition {
  id: string;
  name: string;
  colors: {
    bgBase: string;
    bgSidebar: string;
    bgColumn: string;
    bgCard: string;
    bgHover: string;
    border: string;
    textMain: string;
    textMuted: string;
    accent: string;
  };
}

export type ViewFilter = 'all' | 'pending' | 'completed';

export interface LinkItem {
  id: string;
  title: string;
  url: string;
}

export interface SketchItem {
  id: string;
  title: string;
  dataUrl: string; // Base64 or local image path
  createdAt: string;
}

export interface NoteAttachment {
  id: string;
  name: string;
  filePath: string;
  mimeType: string;
  sizeBytes: number;
  extension: string;
  kind: 'file' | 'audio';
  durationSeconds?: number;
  createdAt: string;
}

export interface NoteItem {
  id: string;
  folderId: string;
  subjectId: string;
  title: string;
  content: string; // Markdown body
  isCompleted: boolean;
  isPinned: boolean;
  tags: string[];
  links: LinkItem[];
  sketches: SketchItem[];
  attachments: NoteAttachment[];
  createdAt: string;
  updatedAt: string;
  dueDate?: string; // Optional deadline
  focusMinutes?: number; // Estimated countdown time
  order?: number; // Manual sorting order in folder
}

export interface FolderItem {
  id: string;
  subjectId: string;
  name: string;
  isExpanded: boolean;
  order: number;
}

export interface SubjectItem {
  id: string;
  name: string;
  color: string; // Hex or tailwind color class
  icon?: string;
  order: number;
}

export interface SearchResult {
  note: NoteItem;
  subjectName: string;
  folderName: string;
  matches: string[];
}

export interface CustomTemplateItem {
  id: string;
  title: string;
  description: string;
  content: string;
  updatedAt: string;
}
