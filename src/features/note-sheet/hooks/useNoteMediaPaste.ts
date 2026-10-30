import { useEffect, useCallback } from 'react';
import { NoteItem, SketchItem } from '../../../shared/types';
import { api } from '../../../shared/api/ipc';
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
  onDropFiles?: (files: FileList) => void;
  onInsertEmbedToken?: (token: string) => string;
}

export function useNoteMediaPaste({
  note,
  onUpdateNote,
  onOpenMediaDrawer,
  onDropFiles,
  onInsertEmbedToken,
}: Props) {
  const { t } = useTranslation();

  const attachSketches = useCallback(
    (newSketches: SketchItem[]) => {
      if (newSketches.length === 0) return;
      const tokens = newSketches.map((s) => `[embed:sketch:${s.id}]`).join('\n');
      const nextContent = onInsertEmbedToken ? onInsertEmbedToken(tokens) : note.content;
      onUpdateNote({
        ...note,
        content: nextContent,
        sketches: [...note.sketches, ...newSketches],
        updatedAt: new Date().toISOString(),
      });
      onOpenMediaDrawer();
    },
    [note, onUpdateNote, onOpenMediaDrawer, onInsertEmbedToken]
  );

  // Global window paste listener (synchronous preventDefault to prevent pasting paths into textarea)
  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      if (document.querySelector('.fixed.inset-0.z-50')) return;

      const hasImages = hasClipboardImageContent(e.clipboardData);
      if (hasImages) {
        // MUST preventDefault synchronously before any async await!
        e.preventDefault();
        e.stopPropagation();

        const sketches = await processImageDropOrPaste(e, t('note.pastedImage'));
        attachSketches(sketches);
        return;
      }

      // If clipboard has no plain text, check native Tauri OS clipboard for binary image (Linux X11/Wayland)
      const plainText = e.clipboardData.getData('text/plain');
      if (!plainText) {
        const sketches = await processImageDropOrPaste(e, t('note.pastedImage'));
        if (sketches.length > 0) {
          attachSketches(sketches);
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
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

      // If outside inputs, handle Ctrl+V via native Tauri clipboard or navigator.clipboard
      if (!isInput) {
        try {
          const nativeDataUrl = await api.getClipboardImage();
          if (nativeDataUrl) {
            e.preventDefault();
            attachSketches([
              {
                id: `sketch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                title: t('note.pastedImage'),
                dataUrl: nativeDataUrl,
                createdAt: new Date().toISOString(),
              },
            ]);
            return;
          }

          if (typeof navigator !== 'undefined' && navigator.clipboard) {
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
          try {
            if (event.payload.type === 'drop') {
              if (document.querySelector('.fixed.inset-0.z-50')) return;
              const imagePaths = event.payload.paths.filter(isImagePath);
              if (imagePaths.length > 0) {
                const newSketches: SketchItem[] = [];
                for (const p of imagePaths) {
                  try {
                    const sk = await createSketchFromPath(p, t('note.droppedImage'));
                    newSketches.push(sk);
                  } catch (err) {
                    console.warn('Failed to load dropped image:', err);
                  }
                }
                if (newSketches.length > 0) {
                  attachSketches(newSketches);
                }
              }
            }
          } catch (err) {
            console.warn('onDragDropEvent processing error:', err);
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
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onDropFiles?.(e.dataTransfer.files);
      }
      const sketches = await processImageDropOrPaste(e, t('note.droppedImage'));
      if (sketches.length > 0) {
        attachSketches(sketches);
      }
    },
    [attachSketches, onDropFiles, t]
  );

  return {
    handleDragOver,
    handleDrop,
    attachSketches,
    attachSingleSketch: (sketch: SketchItem) => attachSketches([sketch]),
  };
}
