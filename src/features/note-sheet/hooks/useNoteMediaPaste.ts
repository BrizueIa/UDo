import { useEffect, useCallback } from 'react';
import { NoteItem } from '../../../shared/types';
import {
  processImageDropOrPaste,
  isImagePath,
  createSketchFromPath,
} from '../../../shared/utils/imageClipboard';
import { useTranslation } from 'react-i18next';

interface Props {
  note: NoteItem;
  onUpdateNote: (note: NoteItem) => void;
  onOpenMediaDrawer: () => void;
}

export function useNoteMediaPaste({ note, onUpdateNote, onOpenMediaDrawer }: Props) {
  const { t } = useTranslation();

  // Global window paste listener (FR-16: Ctrl+V anywhere in note)
  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      // Check if clipboard contains an image
      const sketch = await processImageDropOrPaste(e, t('note.pastedImage'));
      if (sketch) {
        e.preventDefault();
        onUpdateNote({
          ...note,
          sketches: [...note.sketches, sketch],
          updatedAt: new Date().toISOString(),
        });
        onOpenMediaDrawer();
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [note, onUpdateNote, onOpenMediaDrawer, t]);

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
              onUpdateNote({
                ...note,
                sketches: [...note.sketches, ...newSketches],
                updatedAt: new Date().toISOString(),
              });
              onOpenMediaDrawer();
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
  }, [note, onUpdateNote, onOpenMediaDrawer, t]);

  // HTML5 Drag & Drop handlers for browser / webview element
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const sketch = await processImageDropOrPaste(e, t('note.droppedImage'));
      if (sketch) {
        onUpdateNote({
          ...note,
          sketches: [...note.sketches, sketch],
          updatedAt: new Date().toISOString(),
        });
        onOpenMediaDrawer();
      }
    },
    [note, onUpdateNote, onOpenMediaDrawer, t]
  );

  return { handleDragOver, handleDrop };
}
