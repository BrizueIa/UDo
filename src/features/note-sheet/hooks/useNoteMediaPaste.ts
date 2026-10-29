import { useEffect, useCallback } from 'react';
import { NoteItem, SketchItem } from '../../../shared/types';
import {
  processImageDropOrPaste,
  isImagePath,
  createSketchFromPath,
  hasClipboardImageContent,
  extractImagePathsFromText,
  createSketchFromImage,
} from '../../../shared/utils/imageClipboard';
import { useTranslation } from 'react-i18next';

interface Props {
  note: NoteItem;
  onUpdateNote: (note: NoteItem) => void;
  onOpenMediaDrawer: () => void;
}

export function useNoteMediaPaste({ note, onUpdateNote, onOpenMediaDrawer }: Props) {
  const { t } = useTranslation();

  const attachSketches = useCallback(
    (newSketches: SketchItem[]) => {
      if (newSketches.length === 0) return;
      onUpdateNote({
        ...note,
        sketches: [...note.sketches, ...newSketches],
        updatedAt: new Date().toISOString(),
      });
      onOpenMediaDrawer();
    },
    [note, onUpdateNote, onOpenMediaDrawer]
  );

  // Global window paste listener (synchronous preventDefault to prevent pasting paths into textarea)
  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      if (!e.clipboardData) return;

      const hasImages = hasClipboardImageContent(e.clipboardData);
      if (hasImages) {
        // MUST preventDefault synchronously before any async await!
        e.preventDefault();
        e.stopPropagation();

        const sketches = await processImageDropOrPaste(e, t('note.pastedImage'));
        attachSketches(sketches);
      }
    };

    window.addEventListener('paste', handleGlobalPaste, true);
    return () => window.removeEventListener('paste', handleGlobalPaste, true);
  }, [attachSketches, t]);

  // Keydown listener for Ctrl+V when viewing note in interactive mode (outside input)
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const isCtrlV = (e.ctrlKey || e.metaKey) && (e.code === 'KeyV' || e.key.toLowerCase() === 'v');
      if (!isCtrlV) return;

      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      // If outside inputs, handle Ctrl+V via navigator.clipboard
      if (!isInput && typeof navigator !== 'undefined' && navigator.clipboard) {
        try {
          // Try reading clipboard items first (binary image)
          if (navigator.clipboard.read) {
            const items = await navigator.clipboard.read();
            const sketches: SketchItem[] = [];
            for (const item of items) {
              for (const type of item.types) {
                if (type.startsWith('image/')) {
                  const blob = await item.getType(type);
                  const file = new File([blob], 'clipboard-image.png', { type });
                  const sk = await createSketchFromImage(file, t('note.pastedImage'));
                  sketches.push(sk);
                }
              }
            }
            if (sketches.length > 0) {
              e.preventDefault();
              attachSketches(sketches);
              return;
            }
          }

          // Fallback to clipboard text containing image paths (Linux screenshot copies)
          if (navigator.clipboard.readText) {
            const text = await navigator.clipboard.readText();
            const paths = extractImagePathsFromText(text);
            if (paths.length > 0) {
              e.preventDefault();
              const sketches: SketchItem[] = [];
              for (const p of paths) {
                try {
                  const sk = await createSketchFromPath(p, t('note.pastedImage'));
                  sketches.push(sk);
                } catch (err) {
                  console.warn('Failed to load image from path:', p, err);
                }
              }
              attachSketches(sketches);
            }
          }
        } catch (err) {
          console.warn('Clipboard read error on Ctrl+V:', err);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [attachSketches, t]);

  // Tauri Native OS File Drag & Drop listener
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupTauriDrop = async () => {
      if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) return;
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const unsub = await getCurrentWindow().onDragDropEvent(async (event) => {
          if (event.payload.type === 'drop') {
            const imagePaths = event.payload.paths.filter(isImagePath);
            if (imagePaths.length > 0) {
              const newSketches = await Promise.all(
                imagePaths.map((p) => createSketchFromPath(p, t('note.droppedImage')))
              );
              attachSketches(newSketches);
            }
          }
        });
        unlisten = unsub;
      } catch (err) {
        console.warn('Tauri onDragDropEvent listener failed:', err);
      }
    };

    setupTauriDrop();
    return () => {
      if (unlisten) unlisten();
    };
  }, [attachSketches, t]);

  // HTML5 Drag & Drop handlers for browser / webview element
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const sketches = await processImageDropOrPaste(e, t('note.droppedImage'));
      attachSketches(sketches);
    },
    [attachSketches, t]
  );

  return { handleDragOver, handleDrop };
}
