import React, { useState, useEffect, useCallback } from 'react';
import { Paperclip, X, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SketchItem, NoteAttachment } from '../../../shared/types';
import { api } from '../../../shared/api/ipc';
import { attachmentsApi } from '../../../shared/api/attachmentsApi';
import {
  isBlockedExtension,
  isImageFile,
  getFileExtension,
  cleanAttachmentName,
} from '../../../shared/utils/fileAttachments';
import {
  fileToDataUrl,
  extractImagePathsFromText,
} from '../../../shared/utils/imageClipboard';
import { AttachmentStagedPreview, StagedItem } from './AttachmentStagedPreview';
import { AttachmentDropZone } from './AttachmentDropZone';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAttachSketch?: (sketch: SketchItem) => void;
  onAttachmentCreated?: (attachment: NoteAttachment) => void;
  onAttachFiles?: (files: FileList | File[]) => void;
}

export const AttachmentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onAttachSketch,
  onAttachmentCreated,
  onAttachFiles,
}) => {
  const { t } = useTranslation();
  const [stagedFiles, setStagedFiles] = useState<StagedItem[]>([]);
  const [singleTitle, setSingleTitle] = useState('');
  const [blockedError, setBlockedError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset state on open/close
  useEffect(() => {
    if (!isOpen) {
      setStagedFiles([]);
      setSingleTitle('');
      setBlockedError(null);
      setIsProcessing(false);
    }
  }, [isOpen]);

  const stagePaths = useCallback(
    async (paths: string[]) => {
      setBlockedError(null);
      const items: StagedItem[] = [];

      for (const p of paths) {
        const ext = getFileExtension(p);
        if (isBlockedExtension(p)) {
          setBlockedError(t('attachments.blockedExtensionError', { ext: `.${ext}` }));
          continue;
        }

        const rawName = p.replace(/\\/g, '/').split('/').pop() || 'file';
        const fileName = cleanAttachmentName(rawName);
        const isImg = isImageFile(p);
        let previewDataUrl: string | undefined;

        if (isImg) {
          try {
            const dataUrl = await api.readImageAsDataUrl(p);
            if (dataUrl) previewDataUrl = dataUrl;
          } catch (e) {
            console.warn('Failed to load image preview:', e);
          }
        }

        items.push({
          id: `staged-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: fileName,
          sourceType: 'path',
          path: p,
          previewDataUrl,
          isImage: isImg,
          sizeBytes: 0,
          extension: ext,
        });
      }

      if (items.length > 0) {
        setStagedFiles((prev) => [...prev, ...items]);
        if (items.length === 1 && !singleTitle) {
          setSingleTitle(items[0].name.replace(/\.[^/.]+$/, ''));
        }
      }
    },
    [singleTitle, t]
  );

  const stageFiles = useCallback(
    async (files: FileList | File[]) => {
      setBlockedError(null);
      const items: StagedItem[] = [];
      const fileList = Array.from(files);

      for (const file of fileList) {
        const ext = getFileExtension(file.name);
        if (isBlockedExtension(file.name)) {
          setBlockedError(t('attachments.blockedExtensionError', { ext: `.${ext}` }));
          continue;
        }

        const isImg = isImageFile(file.name);
        let previewDataUrl: string | undefined;

        if (isImg) {
          try {
            previewDataUrl = await fileToDataUrl(file);
          } catch (e) {
            console.warn('Failed to read image data URL:', e);
          }
        } else if (['mp3', 'wav', 'webm', 'ogg', 'm4a', 'flac'].includes(ext)) {
          previewDataUrl = URL.createObjectURL(file);
        }

        items.push({
          id: `staged-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: cleanAttachmentName(file.name),
          sourceType: 'file',
          file,
          previewDataUrl,
          isImage: isImg,
          sizeBytes: file.size,
          extension: ext,
        });
      }

      if (items.length > 0) {
        setStagedFiles((prev) => [...prev, ...items]);
        if (items.length === 1 && !singleTitle) {
          setSingleTitle(items[0].name.replace(/\.[^/.]+$/, ''));
        }
      }
    },
    [singleTitle, t]
  );

  const handleNativeBrowse = async () => {
    setBlockedError(null);
    try {
      const paths = await attachmentsApi.openAttachmentDialog(t);
      if (paths && paths.length > 0) {
        await stagePaths(paths);
      }
    } catch (err) {
      console.warn('Native open failed:', err);
    }
  };

  const handleClipboardPaste = useCallback(async () => {
    setBlockedError(null);
    try {
      const nativeDataUrl = await api.getClipboardImage();
      if (nativeDataUrl) {
        setStagedFiles([
          {
            id: `staged-${Date.now()}`,
            name: t('note.pastedImage'),
            sourceType: 'clipboard_image',
            previewDataUrl: nativeDataUrl,
            isImage: true,
            sizeBytes: 0,
            extension: 'png',
          },
        ]);
        setSingleTitle(t('note.pastedImage'));
        return;
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        if (navigator.clipboard.read) {
          const items = await navigator.clipboard.read();
          for (const item of items) {
            for (const type of item.types) {
              if (type.startsWith('image/')) {
                const blob = await item.getType(type);
                const file = new File([blob], 'clipboard-image.png', { type });
                await stageFiles([file]);
                return;
              }
            }
          }
        }
        if (navigator.clipboard.readText) {
          const text = await navigator.clipboard.readText();
          const paths = extractImagePathsFromText(text);
          if (paths.length > 0) {
            await stagePaths(paths);
          }
        }
      }
    } catch (err) {
      console.warn('Clipboard read failed:', err);
    }
  }, [stageFiles, stagePaths, t]);

  // Global keydown (Esc, Ctrl+V)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        handleClipboardPaste();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose, handleClipboardPaste]);

  const handleConfirm = async () => {
    if (stagedFiles.length === 0 || isProcessing) return;
    setIsProcessing(true);

    try {
      for (const item of stagedFiles) {
        const chosenTitle =
          stagedFiles.length === 1 && singleTitle.trim()
            ? singleTitle.trim()
            : item.name.replace(/\.[^/.]+$/, '');

        // 1. If it's an image and onAttachSketch provided: route to note sketch
        if (item.isImage && item.previewDataUrl && onAttachSketch) {
          onAttachSketch({
            id: `sketch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            title: chosenTitle,
            dataUrl: item.previewDataUrl,
            createdAt: new Date().toISOString(),
          });
          continue;
        }

        // 2. If it's a native file path: copy directly via Rust command
        if (item.sourceType === 'path' && item.path && onAttachmentCreated) {
          const saved = await attachmentsApi.saveAttachmentFromPath(item.path);
          const isAudio = ['mp3', 'wav', 'webm', 'ogg', 'm4a', 'flac'].includes(saved.extension);
          onAttachmentCreated({
            id: `attach-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: cleanAttachmentName(chosenTitle || saved.name),
            filePath: saved.filePath,
            mimeType: saved.mimeType,
            sizeBytes: saved.sizeBytes,
            extension: saved.extension,
            kind: isAudio ? 'audio' : 'file',
            createdAt: new Date().toISOString(),
          });
          continue;
        }

        // 3. If it's a browser File object: read buffer and save
        if (item.file && onAttachmentCreated) {
          const buffer = await item.file.arrayBuffer();
          const savedPath = await attachmentsApi.saveAttachmentFile(
            item.file.name,
            new Uint8Array(buffer)
          );
          const isAudio = ['mp3', 'wav', 'webm', 'ogg', 'm4a', 'flac'].includes(item.extension);
          onAttachmentCreated({
            id: `attach-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: cleanAttachmentName(chosenTitle || item.name),
            filePath: savedPath,
            mimeType: item.file.type || 'application/octet-stream',
            sizeBytes: item.sizeBytes,
            extension: item.extension,
            kind: isAudio ? 'audio' : 'file',
            createdAt: new Date().toISOString(),
          });
          continue;
        }

        // Fallback to onAttachFiles if present
        if (item.file && onAttachFiles) {
          onAttachFiles([item.file]);
        }
      }

      onClose();
    } catch (err) {
      console.error('Failed to attach files:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-theme-sidebar border border-theme-border rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-theme-border/50">
          <div className="flex items-center space-x-2 text-theme-text font-bold text-sm">
            <Paperclip size={16} className="text-theme-accent" />
            <span>{t('attachments.modalTitle')}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Security Warning Banner */}
        {blockedError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{blockedError}</span>
          </div>
        )}

        {/* Content Area */}
        {stagedFiles.length === 0 ? (
          <AttachmentDropZone
            onStageFiles={stageFiles}
            onStagePaths={stagePaths}
            onClipboardPaste={handleClipboardPaste}
            onNativeBrowse={handleNativeBrowse}
          />
        ) : (
          <AttachmentStagedPreview
            stagedFiles={stagedFiles}
            singleTitle={singleTitle}
            onSingleTitleChange={setSingleTitle}
            onReset={() => {
              setStagedFiles([]);
              setSingleTitle('');
              setBlockedError(null);
            }}
            onConfirm={handleConfirm}
            isProcessing={isProcessing}
          />
        )}
      </div>
    </div>
  );
};

// Backwards compatibility alias
export const ImageAttachmentModal = AttachmentModal;
