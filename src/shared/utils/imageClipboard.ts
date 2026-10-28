import { SketchItem } from '../types';

/**
 * Extracts the first image file from a ClipboardEvent or DragEvent.
 */
export function extractImageFile(
  event: React.ClipboardEvent | React.DragEvent | ClipboardEvent | DragEvent
): File | null {
  if ('clipboardData' in event && event.clipboardData) {
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) return file;
      }
    }
    const files = event.clipboardData.files;
    for (let i = 0; i < files.length; i++) {
      if (files[i].type.startsWith('image/')) {
        return files[i];
      }
    }
  }

  if ('dataTransfer' in event && event.dataTransfer) {
    const files = event.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
      if (files[i].type.startsWith('image/')) {
        return files[i];
      }
    }
  }

  return null;
}

/**
 * Converts a File to a base64 Data URL string.
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to dataUrl'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Converts an image file to a SketchItem ready to be attached to a note.
 */
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

/**
 * Convenience helper to inspect an event and produce a SketchItem if an image is present.
 */
export async function processImageDropOrPaste(
  event: React.ClipboardEvent | React.DragEvent,
  fallbackTitle: string = 'Pasted Image'
): Promise<SketchItem | null> {
  const file = extractImageFile(event);
  if (!file) return null;
  return createSketchFromImage(file, fallbackTitle);
}
