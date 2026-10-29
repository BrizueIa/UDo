const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export interface AudioDeviceOption {
  id: string;
  name: string;
}

export interface SavedAttachmentInfo {
  name: string;
  filePath: string;
  mimeType: string;
  sizeBytes: number;
  extension: string;
}

export const attachmentsApi = {
  isTauri,

  async openAttachmentDialog(t: (key: string) => string): Promise<string[]> {
    if (isTauri) {
      try {
        const { open } = await import('@tauri-apps/plugin-dialog');
        const selected = await open({
          multiple: true,
          title: t('attachments.selectFilesTitle'),
          filters: [
            {
              name: t('attachments.filterAll'),
              extensions: ['*'],
            },
            {
              name: t('attachments.filterImages'),
              extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'ico'],
            },
            {
              name: t('attachments.filterDocuments'),
              extensions: ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'txt', 'md', 'csv', 'odt', 'pptx'],
            },
            {
              name: t('attachments.filterAudio'),
              extensions: ['mp3', 'wav', 'webm', 'ogg', 'm4a', 'flac', 'aac', 'opus'],
            },
            {
              name: t('attachments.filter3D'),
              extensions: ['stl', '3mf', 'step', 'stp', 'blend', 'obj', 'gcode'],
            },
            {
              name: t('attachments.filterArchives'),
              extensions: ['zip', 'tar', 'gz', '7z', 'rar'],
            },
          ],
        });

        if (!selected) return [];
        return Array.isArray(selected) ? selected : [selected];
      } catch (err) {
        console.warn('Tauri openAttachmentDialog failed:', err);
      }
    }
    return [];
  },

  async saveAttachmentFromPath(sourcePath: string): Promise<SavedAttachmentInfo> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<SavedAttachmentInfo>('save_attachment_from_path', { sourcePath });
      } catch (err) {
        console.warn('Tauri save_attachment_from_path failed', err);
        throw err;
      }
    }
    throw new Error('Native path attachments are only supported in desktop mode');
  },

  async saveAttachmentFile(fileName: string, bytes: Uint8Array): Promise<string> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<string>('save_attachment_file', {
          fileName,
          bytes: Array.from(bytes),
        });
      } catch (err) {
        console.warn('Tauri save_attachment_file failed, falling back to data URL', err);
      }
    }
    const blob = new Blob([bytes as unknown as BlobPart]);
    return URL.createObjectURL(blob);
  },

  async openAttachmentNative(filePath: string): Promise<void> {
    if (isTauri && filePath && !filePath.startsWith('blob:') && !filePath.startsWith('data:')) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('open_attachment_native', { filePath });
        return;
      } catch (err) {
        console.warn('Tauri open_attachment_native failed', err);
      }
    }
    if (filePath) {
      window.open(filePath, '_blank');
    }
  },

  async readAttachmentBase64(filePath: string): Promise<string> {
    if (isTauri && filePath && !filePath.startsWith('blob:') && !filePath.startsWith('data:')) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<string>('read_attachment_base64', { filePath });
      } catch (err) {
        console.warn('Tauri read_attachment_base64 failed', err);
      }
    }
    return filePath;
  },

  async deleteAttachmentFile(filePath: string): Promise<void> {
    if (isTauri && filePath && !filePath.startsWith('blob:') && !filePath.startsWith('data:')) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('delete_attachment_file', { filePath });
      } catch (err) {
        console.warn('Tauri delete_attachment_file failed', err);
      }
    } else if (filePath && filePath.startsWith('blob:')) {
      URL.revokeObjectURL(filePath);
    }
  },

  async getSystemAudioDevices(): Promise<{ inputs: AudioDeviceOption[]; outputs: AudioDeviceOption[] }> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke('get_system_audio_devices');
      } catch (err) {
        console.warn('Tauri get_system_audio_devices failed', err);
      }
    }
    return { inputs: [], outputs: [] };
  },

  async startNativeRecording(targetDevice?: string): Promise<boolean> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('start_native_recording', { targetDevice: targetDevice || null });
        return true;
      } catch (err) {
        console.warn('Tauri start_native_recording failed', err);
      }
    }
    return false;
  },

  async stopNativeRecording(): Promise<string | null> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<string>('stop_native_recording');
      } catch (err) {
        console.warn('Tauri stop_native_recording failed', err);
      }
    }
    return null;
  },

  async cancelNativeRecording(): Promise<void> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('cancel_native_recording');
      } catch (err) {
        console.warn('Tauri cancel_native_recording failed', err);
      }
    }
  },
};
