import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  Trash2,
  FolderInput,
  Copy,
  Link,
  Plus,
  Folder,
} from 'lucide-react';
import { FolderItem, NoteItem } from '../../../shared/types';
import { useContextMenu } from '../../../shared/ui/context-menu';

interface Props {
  folders: FolderItem[];
  selectedNoteIds: Set<string>;
  onToggleNoteComplete: (id: string) => void;
  onBatchToggleCompleteNotes?: (ids: string[]) => void;
  onMoveNoteToFolder?: (noteId: string, folderId: string) => void;
  onBatchMoveNotesToFolder?: (ids: string[], folderId: string) => void;
  onBatchDeleteNotes?: (ids: string[]) => void;
  onDuplicateNote?: (id: string) => void;
  onAddNote: (folderId: string) => void;
  onToggleFolderExpand: (folderId: string) => void;
  onDeleteFolder: (folderId: string) => void;
}

export function useFoldersContextMenu({
  folders,
  selectedNoteIds,
  onToggleNoteComplete,
  onBatchToggleCompleteNotes,
  onMoveNoteToFolder,
  onBatchMoveNotesToFolder,
  onBatchDeleteNotes,
  onDuplicateNote,
  onAddNote,
  onToggleFolderExpand,
  onDeleteFolder,
}: Props) {
  const { t } = useTranslation();
  const { openContextMenu } = useContextMenu();

  const handleNoteContextMenu = (e: React.MouseEvent, note: NoteItem) => {
    e.preventDefault();
    e.stopPropagation();

    const isTargetMulti = selectedNoteIds.has(note.id) && selectedNoteIds.size > 1;
    const targetIds = isTargetMulti ? Array.from(selectedNoteIds) : [note.id];

    if (isTargetMulti) {
      openContextMenu(e, [
        {
          id: 'batch-complete',
          label: t('batch.toggleComplete') || `Marcar ${targetIds.length} notas`,
          icon: <CheckCircle2 size={14} />,
          onClick: () => onBatchToggleCompleteNotes?.(targetIds),
        },
        {
          id: 'batch-move',
          label: t('batch.moveToFolder') || 'Mover a carpeta...',
          icon: <FolderInput size={14} />,
          submenu: [
            {
              id: 'sub-batch-root',
              label: t('folders.noFolder'),
              onClick: () => onBatchMoveNotesToFolder?.(targetIds, ''),
            },
            ...folders.map((f) => ({
              id: `sub-${f.id}`,
              label: f.name,
              onClick: () => onBatchMoveNotesToFolder?.(targetIds, f.id),
            })),
          ],
        },
        { id: 'sep-1', label: '', separator: true },
        {
          id: 'batch-delete',
          label: t('batch.deleteNotes') || `Mover ${targetIds.length} notas a papelera`,
          icon: <Trash2 size={14} />,
          danger: true,
          onClick: () => onBatchDeleteNotes?.(targetIds),
        },
      ]);
    } else {
      openContextMenu(e, [
        {
          id: 'toggle-complete',
          label: note.isCompleted
            ? t('note.markPending') || 'Marcar como pendiente'
            : t('note.markCompleted') || 'Marcar como completada',
          icon: <CheckCircle2 size={14} />,
          onClick: () => onToggleNoteComplete(note.id),
        },
        {
          id: 'duplicate',
          label: t('note.duplicate') || 'Duplicar nota',
          icon: <Copy size={14} />,
          onClick: () => onDuplicateNote?.(note.id),
        },
        {
          id: 'copy-link',
          label: t('note.copyWikiLink') || 'Copiar [[Wiki-Link]]',
          icon: <Link size={14} />,
          onClick: () => navigator.clipboard.writeText(`[[${note.title}]]`),
        },
        {
          id: 'move-to',
          label: t('note.moveToFolder') || 'Mover a carpeta...',
          icon: <FolderInput size={14} />,
          submenu: [
            {
              id: 'sub-single-root',
              label: t('folders.noFolder'),
              onClick: () => onMoveNoteToFolder?.(note.id, ''),
            },
            ...folders.map((f) => ({
              id: `sub-${f.id}`,
              label: f.name,
              onClick: () => onMoveNoteToFolder?.(note.id, f.id),
            })),
          ],
        },
        { id: 'sep-1', label: '', separator: true },
        {
          id: 'delete-note',
          label: t('note.delete') || 'Mover a la papelera',
          icon: <Trash2 size={14} />,
          danger: true,
          onClick: () => onBatchDeleteNotes?.([note.id]),
        },
      ]);
    }
  };

  const handleFolderContextMenu = (e: React.MouseEvent, folder: FolderItem) => {
    e.preventDefault();
    e.stopPropagation();

    openContextMenu(e, [
      {
        id: 'new-note',
        label: t('folders.addNote'),
        icon: <Plus size={14} />,
        shortcut: 'Ctrl+N',
        onClick: () => onAddNote(folder.id),
      },
      {
        id: 'toggle-expand',
        label: folder.isExpanded
          ? t('folders.collapseFolder') || 'Colapsar carpeta'
          : t('folders.expandFolder') || 'Expandir carpeta',
        icon: <Folder size={14} />,
        onClick: () => onToggleFolderExpand(folder.id),
      },
      { id: 'sep-1', label: '', separator: true },
      {
        id: 'delete-folder',
        label: t('folders.deleteFolder'),
        icon: <Trash2 size={14} />,
        danger: true,
        onClick: () => onDeleteFolder(folder.id),
      },
    ]);
  };

  return {
    handleNoteContextMenu,
    handleFolderContextMenu,
  };
}
