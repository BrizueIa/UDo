import { SketchItem } from '../types';
import { api } from '../api/ipc';

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.bmp'];

export function isImagePath(path: string): boolean {
  const clean = path.trim().replace(/^file:\/\//, '').split('?')[0].split('#')[0];
  const lower = clean.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function extractImagePathsFromText(text: string): string[] {
  if (!text || typeof text !== 'string') return [];
  // Split by newlines or whitespace (e.g. Dolphin/Nautilus paste multiple files)
  const tokens = text.split(/[\r\n\t ]+/).map((t) => t.trim()).filter(Boolean);
  const results: string[] = [];

  for (const token of tokens) {
    let clean = token;
    if (clean.startsWith('file://')) {
      try {
        clean = decodeURIComponent(new URL(clean).pathname);
      } catch {
        clean = decodeURIComponent(clean.replace(/^file:\/\//, ''));
      }
    }
    if (isImagePath(clean)) {
      results.push(clean);
    }
  }

  return results;
}

export function hasClipboardImageContent(clipboardData: DataTransfer | null): boolean {
  if (!clipboardData) return false;
  // 1. Direct binary images
  for (let i = 0; i < clipboardData.items.length; i++) {
    if (clipboardData.items[i].type.startsWith('image/')) return true;
  }
  for (let i = 0; i < clipboardData.files.length; i++) {
    if (clipboardData.files[i].type.startsWith('image/')) return true;
  }
  // 2. File paths in text/uri-list or text/plain
  const uriList = clipboardData.getData('text/uri-list');
  if (extractImagePathsFromText(uriList).length > 0) return true;

  const plainText = clipboardData.getData('text/plain');
  if (extractImagePathsFromText(plainText).length > 0) return true;

  return false;
}

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
  let dataUrl: string | null = null;
  try {
    dataUrl = await api.readImageAsDataUrl(filePath);
  } catch (err) {
    console.warn('api.readImageAsDataUrl failed:', err);
  }

  if (!dataUrl) {
    throw new Error(`Failed to load image from path: ${filePath}`);
  }

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
): Promise<SketchItem[]> {
  const items: SketchItem[] = [];

  // Check direct file binary
  const file = extractImageFile(event);
  if (file) {
    const sk = await createSketchFromImage(file, fallbackTitle);
    items.push(sk);
    return items;
  }

  // Check path strings from clipboard
  if ('clipboardData' in event && event.clipboardData) {
    const uriList = event.clipboardData.getData('text/uri-list');
    const plainText = event.clipboardData.getData('text/plain');
    const paths = Array.from(
      new Set([...extractImagePathsFromText(uriList), ...extractImagePathsFromText(plainText)])
    );

    for (const p of paths) {
      try {
        const sk = await createSketchFromPath(p, fallbackTitle);
        items.push(sk);
      } catch (err) {
        console.warn('Failed to load image from path:', p, err);
      }
    }
  }

  // 3. Fallback to native Tauri OS clipboard image reader (essential on Linux X11/Wayland)
  try {
    const nativeDataUrl = await api.getClipboardImage();
    if (nativeDataUrl) {
      items.push({
        id: `sketch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: fallbackTitle,
        dataUrl: nativeDataUrl,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn('api.getClipboardImage fallback failed:', err);
  }

  return items;
}
