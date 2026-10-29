const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export const attachmentsApi = {
  isTauri,

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
    // Browser fallback: Create a Blob URL
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
    // Browser fallback: open link / download
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
};
