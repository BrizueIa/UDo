import React from 'react';
import { NoteAttachment } from '../../../shared/types';
import {
  formatFileSize,
  getFileCategory,
  getFileExtension,
} from '../../../shared/utils/fileAttachments';
import { attachmentsApi } from '../../../shared/api/attachmentsApi';
import {
  FileText,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  Box,
  File,
  X,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '../../../shared/ui/context-menu';

interface Props {
  attachment: NoteAttachment;
  onRemove: (id: string) => void;
}

export const FileAttachmentCard: React.FC<Props> = ({ attachment, onRemove }) => {
  const { t } = useTranslation();
  const { openContextMenu } = useContextMenu();
  const ext = (attachment.extension || getFileExtension(attachment.name)).toUpperCase();
  const category = getFileCategory(ext);

  const renderIcon = () => {
    switch (category) {
      case '3d':
        return <Box size={16} className="text-orange-400" />;
      case 'pdf':
        return <FileText size={16} className="text-red-400" />;
      case 'doc':
        return <FileText size={16} className="text-blue-400" />;
      case 'sheet':
        return <FileSpreadsheet size={16} className="text-emerald-400" />;
      case 'code':
        return <FileCode size={16} className="text-cyan-400" />;
      case 'archive':
        return <FileArchive size={16} className="text-amber-400" />;
      default:
        return <File size={16} className="text-theme-muted" />;
    }
  };

  const handleOpen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await attachmentsApi.openAttachmentNative(attachment.filePath);
    } catch (err) {
      console.error('Failed to open attachment native:', err);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await attachmentsApi.deleteAttachmentFile(attachment.filePath);
    } catch (err) {
      console.error('Failed to delete physical attachment file:', err);
    }
    onRemove(attachment.id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    openContextMenu(e, [
      {
        id: 'open-native',
        label: t('attachments.openWithSystemApp') || 'Abrir con aplicación del sistema',
        icon: <ExternalLink size={14} />,
        onClick: () => attachmentsApi.openAttachmentNative(attachment.filePath),
      },
      { id: 'sep-1', label: '', separator: true },
      {
        id: 'delete-attachment',
        label: t('attachments.deleteAttachment') || 'Eliminar adjunto',
        icon: <Trash2 size={14} />,
        danger: true,
        onClick: () => {
          attachmentsApi.deleteAttachmentFile(attachment.filePath).catch(() => {});
          onRemove(attachment.id);
        },
      },
    ]);
  };

  return (
    <div
      onClick={handleOpen}
      onContextMenu={handleContextMenu}
      className="group relative flex items-center space-x-3 px-3 py-2 rounded-xl bg-theme-card/60 hover:bg-theme-card border border-white/[0.06] hover:border-white/[0.14] transition-all shadow-xs hover:shadow-md w-64 cursor-pointer select-none"
      title={`${t('attachments.openWithSystemApp')}: ${attachment.name}`}
    >
      <div className="w-9 h-9 rounded-lg bg-theme-column/80 border border-white/[0.04] flex items-center justify-center shrink-0">
        {renderIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-theme-text truncate group-hover:text-theme-accent transition-colors flex items-center gap-1">
          <span className="truncate">{attachment.name}</span>
          <ExternalLink size={10} className="opacity-0 group-hover:opacity-60 shrink-0 transition-opacity" />
        </div>
        <div className="text-[10px] text-theme-muted flex items-center space-x-1.5 mt-0.5">
          <span className="font-mono uppercase px-1 py-0.2 bg-theme-base/60 rounded text-[9px] font-semibold text-theme-muted border border-white/[0.04]">
            .{ext}
          </span>
          <span>{formatFileSize(attachment.sizeBytes)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDelete}
        className="text-theme-muted hover:text-red-400 p-1 rounded opacity-0 group-hover:opacity-100 transition-all shrink-0 cursor-pointer"
        title={t('attachments.deleteAttachment')}
      >
        <X size={13} />
      </button>
    </div>
  );
};
