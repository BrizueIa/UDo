import { NoteItem } from '../../../shared/types';

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
const STORAGE_KEY = 'udo_state_v1';

export const trashIpc = {
  async getDeletedNotes(includePrivate: boolean = false): Promise<NoteItem[]> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<NoteItem[]>('get_deleted_notes', { includePrivate });
      } catch (err) {
        console.warn('Tauri get_deleted_notes failed, falling back', err);
      }
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    try {
      const state = JSON.parse(saved);
      const notes: (NoteItem & { is_deleted?: boolean })[] = state.notes || [];
      const privateSubIds = new Set(
        (state.subjects || []).filter((s: { isPrivate?: boolean }) => s.isPrivate).map((s: { id: string }) => s.id)
      );
      return notes.filter((n) => {
        if (!n.is_deleted) return false;
        if (!includePrivate && privateSubIds.has(n.subjectId)) return false;
        return true;
      });
    } catch {
      return [];
    }
  },

  async restoreNote(id: string): Promise<void> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('restore_note', { id });
        return;
      } catch (err) {
        console.warn('Tauri restore_note failed, falling back', err);
      }
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const state = JSON.parse(saved);
      state.notes = (state.notes || []).map((n: NoteItem & { is_deleted?: boolean }) =>
        n.id === id ? { ...n, is_deleted: false } : n
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  },

  async restoreNotesBatch(ids: string[]): Promise<void> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('restore_notes_batch', { ids });
        return;
      } catch (err) {
        console.warn('Tauri restore_notes_batch failed, falling back', err);
      }
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const state = JSON.parse(saved);
      const idSet = new Set(ids);
      state.notes = (state.notes || []).map((n: NoteItem & { is_deleted?: boolean }) =>
        idSet.has(n.id) ? { ...n, is_deleted: false } : n
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  },

  async permanentlyDeleteNotes(ids: string[]): Promise<void> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('permanently_delete_notes', { ids });
        return;
      } catch (err) {
        console.warn('Tauri permanently_delete_notes failed, falling back', err);
      }
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const state = JSON.parse(saved);
      const idSet = new Set(ids);
      state.notes = (state.notes || []).filter((n: NoteItem) => !idSet.has(n.id));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  },

  async emptyTrash(includePrivate: boolean = false): Promise<void> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('empty_trash', { includePrivate });
        return;
      } catch (err) {
        console.warn('Tauri empty_trash failed, falling back', err);
      }
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const state = JSON.parse(saved);
      const privateSubIds = new Set(
        (state.subjects || []).filter((s: { isPrivate?: boolean }) => s.isPrivate).map((s: { id: string }) => s.id)
      );
      state.notes = (state.notes || []).filter((n: NoteItem & { is_deleted?: boolean }) => {
        if (!n.is_deleted) return true;
        if (!includePrivate && privateSubIds.has(n.subjectId)) return true;
        return false;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  },
};
