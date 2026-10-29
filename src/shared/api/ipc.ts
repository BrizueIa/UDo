import { NoteItem, SubjectItem, FolderItem } from '../types';
import { initialNotes, initialSubjects, initialFolders } from '../data/initialData';
import { normalizeDiacritics } from '../utils/diacritics';

// Safe check if running inside Tauri runtime
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

// Local storage fallback for web development and tests
const STORAGE_KEY = 'udo_state_v1';

interface LocalState {
  subjects: SubjectItem[];
  folders: FolderItem[];
  notes: NoteItem[];
}

function getLocalState(): LocalState {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse local state, resetting to default', e);
    }
  }
  const defaultState: LocalState = {
    subjects: initialSubjects,
    folders: initialFolders,
    notes: initialNotes,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
  return defaultState;
}

function saveLocalState(state: LocalState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export interface WindowEnvironment {
  os: 'macos' | 'windows' | 'linux';
  desktop: string;
  controlsSide: 'left' | 'right';
  showMinMax: boolean;
  isTilingWm: boolean;
}

export const api = {
  isTauri,

  async getInitialData(): Promise<LocalState> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<LocalState>('get_initial_data');
      } catch (err) {
        console.warn('Tauri invoke failed, falling back to local storage', err);
      }
    }
    return getLocalState();
  },

  async searchNotes(query: string, includePrivate: boolean = false): Promise<NoteItem[]> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<NoteItem[]>('search_notes', { query, includePrivate });
      } catch (err) {
        console.warn('Tauri search_notes failed, falling back to local search', err);
      }
    }
    const state = getLocalState();
    const q = normalizeDiacritics(query.trim());
    if (!q) return [];
    const lowerRaw = query.trim().toLowerCase();
    const extCandidate = lowerRaw.startsWith('.') ? lowerRaw.slice(1) : lowerRaw;
    const privateSubIds = new Set(
      state.subjects.filter((s) => s.isPrivate).map((s) => s.id)
    );
    return state.notes.filter((n) => {
      if (!includePrivate && privateSubIds.has(n.subjectId)) return false;

      if (lowerRaw === '.canvas' || lowerRaw === 'canvas' || lowerRaw === '.sketch') {
        return (n.sketches && n.sketches.length > 0) ?? false;
      }
      if (lowerRaw === '.audio' || lowerRaw === 'audio') {
        return n.attachments?.some(
          (a) => a.kind === 'audio' || ['mp3', 'wav', 'webm', 'm4a', 'ogg', 'flac', 'aac'].includes(a.extension?.toLowerCase() || '')
        ) ?? false;
      }
      if (lowerRaw === '.img' || lowerRaw === '.image' || lowerRaw === 'image') {
        return n.attachments?.some((a) => ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp'].includes(a.extension?.toLowerCase() || '')) ?? false;
      }
      if (lowerRaw === '.3d' || lowerRaw === '.cad' || lowerRaw === '3d') {
        return n.attachments?.some((a) => ['stl', '3mf', 'step', 'stp', 'blend', 'obj', 'gcode'].includes(a.extension?.toLowerCase() || '')) ?? false;
      }
      if (lowerRaw === '.doc' || lowerRaw === '.document' || lowerRaw === 'doc') {
        return n.attachments?.some((a) => ['pdf', 'doc', 'docx', 'txt', 'md', 'rtf'].includes(a.extension?.toLowerCase() || '')) ?? false;
      }
      if (lowerRaw === '.sheet' || lowerRaw === 'sheet') {
        return n.attachments?.some((a) => ['xls', 'xlsx', 'csv', 'tsv'].includes(a.extension?.toLowerCase() || '')) ?? false;
      }
      if (lowerRaw === '.code' || lowerRaw === 'code') {
        return n.attachments?.some((a) => ['ts', 'tsx', 'js', 'jsx', 'rs', 'py', 'json', 'yaml', 'yml', 'toml', 'html', 'css', 'sql'].includes(a.extension?.toLowerCase() || '')) ?? false;
      }
      if (lowerRaw === '.archive' || lowerRaw === '.zip' || lowerRaw === 'archive') {
        return n.attachments?.some((a) => ['zip', 'tar', 'gz', '7z', 'rar'].includes(a.extension?.toLowerCase() || '')) ?? false;
      }
      if (lowerRaw.startsWith('.') && extCandidate.length >= 1) {
        return n.attachments?.some(
          (a) =>
            a.extension?.toLowerCase() === extCandidate ||
            a.name?.toLowerCase().endsWith(`.${extCandidate}`)
        ) ?? false;
      }

      return (
        normalizeDiacritics(n.title).includes(q) ||
        normalizeDiacritics(n.content).includes(q) ||
        n.tags.some((tag) => normalizeDiacritics(tag).includes(q)) ||
        n.attachments?.some((a) => normalizeDiacritics(a.name || '').includes(q)) ||
        n.sketches?.some((s) => normalizeDiacritics(s.title || '').includes(q))
      );
    });
  },

  async saveNote(note: NoteItem): Promise<NoteItem> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<NoteItem>('save_note', { note });
      } catch (err) {
        console.warn('Tauri invoke failed, using local storage fallback', err);
      }
    }
    const state = getLocalState();
    const index = state.notes.findIndex((n) => n.id === note.id);
    if (index >= 0) {
      state.notes[index] = note;
    } else {
      state.notes.push(note);
    }
    saveLocalState(state);
    return note;
  },

  async deleteNote(noteId: string): Promise<void> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('delete_note', { id: noteId });
        return;
      } catch (err) {
        console.warn('Tauri invoke failed, using local storage fallback', err);
      }
    }
    const state = getLocalState();
    state.notes = state.notes.filter((n) => n.id !== noteId);
    saveLocalState(state);
  },

  async saveSubject(subject: SubjectItem): Promise<SubjectItem> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<SubjectItem>('save_subject', { subject });
      } catch (err) {
        console.warn('Tauri invoke failed, using local storage fallback', err);
      }
    }
    const state = getLocalState();
    const index = state.subjects.findIndex((s) => s.id === subject.id);
    if (index >= 0) {
      state.subjects[index] = subject;
    } else {
      state.subjects.push(subject);
    }
    saveLocalState(state);
    return subject;
  },

  async deleteSubject(subjectId: string): Promise<void> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('delete_subject', { id: subjectId });
        return;
      } catch (err) {
        console.warn('Tauri invoke failed, using local storage fallback', err);
      }
    }
    const state = getLocalState();
    state.subjects = state.subjects.filter((s) => s.id !== subjectId);
    state.folders = state.folders.filter((f) => f.subjectId !== subjectId);
    state.notes = state.notes.filter((n) => n.subjectId !== subjectId);
    saveLocalState(state);
  },

  async saveFolder(folder: FolderItem): Promise<FolderItem> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<FolderItem>('save_folder', { folder });
      } catch (err) {
        console.warn('Tauri invoke failed, using local storage fallback', err);
      }
    }
    const state = getLocalState();
    const index = state.folders.findIndex((f) => f.id === folder.id);
    if (index >= 0) {
      state.folders[index] = folder;
    } else {
      state.folders.push(folder);
    }
    saveLocalState(state);
    return folder;
  },

  async deleteFolder(folderId: string): Promise<void> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('delete_folder', { id: folderId });
        return;
      } catch (err) {
        console.warn('Tauri invoke failed, using local storage fallback', err);
      }
    }
    const state = getLocalState();
    state.folders = state.folders.filter((f) => f.id !== folderId);
    state.notes = state.notes.filter((n) => n.folderId !== folderId);
    saveLocalState(state);
  },

  async toggleWidgetMode(isMini: boolean): Promise<void> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('toggle_widget_mode', { isMini });
      } catch (err) {
        console.warn('Tauri widget toggle failed', err);
      }
    }
  },

  async setWidgetSize(size: 'compact' | 'expanded' | 'medium'): Promise<void> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('set_widget_size', { size });
      } catch (err) {
        console.warn('Tauri set widget size failed', err);
      }
    }
  },

  async minimizeWindow(): Promise<void> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('minimize_window');
      } catch (err) {
        console.warn('Tauri minimize failed', err);
      }
    }
  },

  async toggleMaximizeWindow(): Promise<void> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('toggle_maximize_window');
      } catch (err) {
        console.warn('Tauri toggle maximize failed', err);
      }
    }
  },

  async closeWindowToTray(): Promise<void> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('close_window_to_tray');
      } catch (err) {
        console.warn('Tauri close to tray failed', err);
      }
    }
  },

  async getWindowEnv(): Promise<WindowEnvironment> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<WindowEnvironment>('get_window_env');
      } catch (err) {
        console.warn('Tauri getWindowEnv failed', err);
      }
    }
    // Browser fallback
    const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/.test(navigator.platform);
    return {
      os: isMac ? 'macos' : 'linux',
      desktop: 'web',
      controlsSide: isMac ? 'left' : 'right',
      showMinMax: true,
      isTilingWm: false,
    };
  },

  async getClipboardImage(): Promise<string | null> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<string | null>('get_clipboard_image');
      } catch (err) {
        console.warn('Tauri get_clipboard_image failed', err);
      }
    }
    return null;
  },

  async readImageAsDataUrl(path: string): Promise<string | null> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<string>('read_image_as_data_url', { path });
      } catch (err) {
        console.warn('Tauri read_image_as_data_url failed', err);
      }
    }
    return null;
  },

  async sendNativeNotification(title: string, body: string): Promise<void> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('send_native_notification', { title, body });
        return;
      } catch (err) {
        console.warn('Tauri native notification failed, falling back to web notification', err);
      }
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification(title, { body });
          }
        });
      }
    }
  },
};
