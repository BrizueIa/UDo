import { BackupInfo, FolderItem, NoteItem, SubjectItem } from '../../../shared/types';

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
const STORAGE_KEY = 'udo_state_v1';

export interface InitialData {
  subjects: SubjectItem[];
  folders: FolderItem[];
  notes: NoteItem[];
}

export const backupIpc = {
  async listAutoBackups(): Promise<BackupInfo[]> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<BackupInfo[]>('list_auto_backups');
      } catch (err) {
        console.warn('Tauri list_auto_backups failed', err);
      }
    }
    return [];
  },

  async exportWorkspaceJson(targetPath: string): Promise<void> {
    if (isTauri) {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke('export_workspace_json', { targetPath });
    }
    const state = localStorage.getItem(STORAGE_KEY);
    const blob = new Blob([state || '{}'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = targetPath || 'udo-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  },

  async importWorkspaceJson(sourcePath: string): Promise<InitialData> {
    if (isTauri) {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<InitialData>('import_workspace_json', { sourcePath });
    }
    throw new Error('Native file import only supported inside Tauri desktop app');
  },

  async isAutostartEnabled(): Promise<boolean> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<boolean>('is_autostart_enabled');
      } catch (err) {
        console.warn('Tauri is_autostart_enabled failed', err);
      }
    }
    return localStorage.getItem('udo_autostart_web') === 'true';
  },

  async setAutostartEnabled(enabled: boolean): Promise<boolean> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<boolean>('set_autostart_enabled', { enabled });
      } catch (err) {
        console.warn('Tauri set_autostart_enabled failed', err);
      }
    }
    localStorage.setItem('udo_autostart_web', String(enabled));
    return enabled;
  },
};
