export type ThemeId = 'tokyo-night' | 'catppuccin-mocha' | 'nord' | 'rose-pine' | 'oled' | 'catppuccin-latte';

export type AccentColor = 'purple' | 'blue' | 'emerald' | 'amber' | 'rose' | 'cyan';

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
  createdAt: string;
  updatedAt: string;
  dueDate?: string; // Optional deadline
  focusMinutes?: number; // Estimated countdown time
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
