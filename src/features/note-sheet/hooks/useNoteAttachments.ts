import { useState, useCallback } from 'react';
import { NoteItem, NoteAttachment } from '../../../shared/types';
import {
  isBlockedExtension,
  isImageFile,
  getFileExtension,
} from '../../../shared/utils/fileAttachments';
import { attachmentsApi } from '../../../shared/api/attachmentsApi';
import { useTranslation } from 'react-i18next';

interface Props {
  note: NoteItem;
  onUpdateNote: (note: NoteItem) => void;
  onAttachImageFile?: (file: File) => void;
}

export function useNoteAttachments({ note, onUpdateNote, onAttachImageFile }: Props) {
  const { t } = useTranslation();
  const [blockedFileError, setBlockedFileError] = useState<string | null>(null);

  const handleAttachFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileList = Array.from(files);
      if (fileList.length === 0) return;

      const newAttachments: NoteAttachment[] = [];

      for (const file of fileList) {
        if (isBlockedExtension(file.name)) {
          const ext = getFileExtension(file.name);
          setBlockedFileError(
            t('attachments.blockedExtensionError', { ext: `.${ext}` })
          );
          continue;
        }

        // Redirect images to existing image/sketch workflow if handler provided
        if (isImageFile(file.name) && onAttachImageFile) {
          onAttachImageFile(file);
          continue;
        }

        try {
          const buffer = await file.arrayBuffer();
          const savedPath = await attachmentsApi.saveAttachmentFile(
            file.name,
            new Uint8Array(buffer)
          );

          newAttachments.push({
            id: `attach-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            filePath: savedPath,
            mimeType: file.type || 'application/octet-stream',
            sizeBytes: file.size,
            extension: getFileExtension(file.name),
            kind: 'file',
            createdAt: new Date().toISOString(),
          });
        } catch (err) {
          console.error('Failed to attach file:', file.name, err);
        }
      }

      if (newAttachments.length > 0) {
        const existing = note.attachments || [];
        onUpdateNote({
          ...note,
          attachments: [...existing, ...newAttachments],
          updatedAt: new Date().toISOString(),
        });
      }
    },
    [note, onUpdateNote, onAttachImageFile, t]
  );

  const handleAddAttachment = useCallback(
    (attachment: NoteAttachment) => {
      const existing = note.attachments || [];
      onUpdateNote({
        ...note,
        attachments: [...existing, attachment],
        updatedAt: new Date().toISOString(),
      });
    },
    [note, onUpdateNote]
  );

  const handleRemoveAttachment = useCallback(
    (id: string) => {
      const existing = note.attachments || [];
      onUpdateNote({
        ...note,
        attachments: existing.filter((a) => a.id !== id),
        updatedAt: new Date().toISOString(),
      });
    },
    [note, onUpdateNote]
  );

  const handleUpdateAttachment = useCallback(
    (id: string, updates: Partial<NoteAttachment>) => {
      const existing = note.attachments || [];
      onUpdateNote({
        ...note,
        attachments: existing.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        updatedAt: new Date().toISOString(),
      });
    },
    [note, onUpdateNote]
  );

  return {
    blockedFileError,
    setBlockedFileError,
    handleAttachFiles,
    handleAddAttachment,
    handleRemoveAttachment,
    handleUpdateAttachment,
  };
}
