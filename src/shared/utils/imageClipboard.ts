import { SketchItem } from '../types';

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.bmp'];

export function isImagePath(path: string): boolean {
  const lower = path.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Extracts the first image file from a ClipboardEvent, DragEvent or general Event.
 */
export function extractImageFile(
  event: React.ClipboardEvent | React.DragEvent | ClipboardEvent | DragEvent
): File | null {
  if ('clipboardData' in event && event.clipboardData) {
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) return file;
      }
    }
    const files = event.clipboardData.files;
    for (let i = 0; i < files.length; i++) {
      if (files[i].type.startsWith('image/')) return files[i];
    }
  }

  if ('dataTransfer' in event && event.dataTransfer) {
    const files = event.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
      if (files[i].type.startsWith('image/') || isImagePath(files[i].name)) {
        return files[i];
      }
    }
  }

  return null;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Failed to convert file to dataUrl'));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function createSketchFromImage(
  file: File,
  fallbackTitle: string = 'Pasted Image'
): Promise<SketchItem> {
  const dataUrl = await fileToDataUrl(file);
  const cleanName = file.name ? file.name.replace(/\.[^/.]+$/, '') : fallbackTitle;

  return {
    id: `sketch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: cleanName || fallbackTitle,
    dataUrl,
    createdAt: new Date().toISOString(),
  };
}

export async function createSketchFromPath(
  filePath: string,
  fallbackTitle: string = 'Dropped Image'
): Promise<SketchItem> {
  const { readFile } = await import('@tauri-apps/plugin-fs');
  const bytes = await readFile(filePath);
  const ext = filePath.split('.').pop()?.toLowerCase() || 'png';
  const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;

  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  const dataUrl = `data:${mime};base64,${base64}`;

  const fileName = filePath.replace(/\\/g, '/').split('/').pop() || fallbackTitle;
  const cleanName = fileName.replace(/\.[^/.]+$/, '');

  return {
    id: `sketch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: cleanName || fallbackTitle,
    dataUrl,
    createdAt: new Date().toISOString(),
  };
}

export async function processImageDropOrPaste(
  event: React.ClipboardEvent | React.DragEvent | ClipboardEvent | DragEvent,
  fallbackTitle: string = 'Pasted Image'
): Promise<SketchItem | null> {
  const file = extractImageFile(event);
  if (!file) return null;
  return createSketchFromImage(file, fallbackTitle);
}
