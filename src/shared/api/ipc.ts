import { NoteItem, SubjectItem, FolderItem } from '../types';
import { initialNotes, initialSubjects, initialFolders } from '../data/initialData';

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
};
