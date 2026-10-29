import React from 'react';
import {
  FileText,
  Box,
  Music,
  FileSpreadsheet,
  Archive,
  Code,
  File,
  Check,
  RefreshCw,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatFileSize, getFileCategory, FileCategory } from '../../../shared/utils/fileAttachments';

export interface StagedItem {
  id: string;
  name: string;
  sourceType: 'path' | 'file' | 'clipboard_image';
  path?: string;
  file?: File;
  previewDataUrl?: string;
  isImage: boolean;
  sizeBytes: number;
  extension: string;
}

interface Props {
  stagedFiles: StagedItem[];
  singleTitle: string;
  onSingleTitleChange: (val: string) => void;
  onReset: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
}

function getCategoryIcon(cat: FileCategory, size = 28) {
  switch (cat) {
    case '3d':
      return <Box size={size} className="text-amber-400" />;
    case 'audio':
      return <Music size={size} className="text-emerald-400" />;
    case 'sheet':
      return <FileSpreadsheet size={size} className="text-teal-400" />;
    case 'code':
      return <Code size={size} className="text-sky-400" />;
    case 'archive':
      return <Archive size={size} className="text-purple-400" />;
    case 'pdf':
      return <FileText size={size} className="text-rose-400" />;
    case 'doc':
      return <FileText size={size} className="text-blue-400" />;
    default:
      return <File size={size} className="text-theme-accent" />;
  }
}

export const AttachmentStagedPreview: React.FC<Props> = ({
  stagedFiles,
  singleTitle,
  onSingleTitleChange,
  onReset,
  onConfirm,
  isProcessing,
}) => {
  const { t } = useTranslation();

  if (stagedFiles.length === 1) {
    const item = stagedFiles[0];
    const cat = getFileCategory(item.extension);

    return (
      <div className="space-y-4">
        {item.isImage && item.previewDataUrl ? (
          <div className="max-h-60 rounded-xl overflow-hidden border border-theme-border bg-black/40 flex items-center justify-center p-2">
            <img
              src={item.previewDataUrl}
              alt="Preview"
              className="max-h-56 max-w-full object-contain rounded-lg"
            />
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-theme-border bg-theme-card/60 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
              {getCategoryIcon(cat, 30)}
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-theme-accent/20 text-theme-accent uppercase font-bold tracking-wider">
                {item.extension ? item.extension.toUpperCase() : 'FILE'}
              </span>
              <p className="text-xs text-theme-muted pt-1">
                {formatFileSize(item.sizeBytes)}
              </p>
            </div>
            {cat === 'audio' && item.previewDataUrl && (
              <audio src={item.previewDataUrl} controls className="w-full mt-2 h-8" />
            )}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">
            {t('attachments.fileNameLabel')}
          </label>
          <input
            type="text"
            autoFocus
            value={singleTitle}
            onChange={(e) => onSingleTitleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onConfirm();
              }
            }}
            className="w-full bg-theme-card border border-theme-border rounded-lg px-3 py-1.5 text-xs text-theme-text outline-none focus:border-theme-accent/60"
          />
        </div>

        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-theme-border/50">
          <button
            type="button"
            onClick={onReset}
            disabled={isProcessing}
            className="px-3 py-1.5 rounded-lg text-xs text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors cursor-pointer"
          >
            {t('attachments.changeFile')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-theme-accent text-white text-xs font-semibold hover:bg-theme-accent-hover shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
            <span>{t('attachments.attachToNote')}</span>
          </button>
        </div>
      </div>
    );
  }

  // Multiple files staged
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-1">
        <span className="text-xs font-semibold text-theme-text">
          {t('attachments.fileSelectedPlural', { count: stagedFiles.length })}
        </span>
      </div>

      <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
        {stagedFiles.map((f) => (
          <div
            key={f.id}
            className="flex items-center justify-between p-2 rounded-lg bg-theme-card/60 border border-theme-border/50 text-xs"
          >
            <div className="flex items-center space-x-2 truncate pr-2">
              <span className="shrink-0">{getCategoryIcon(getFileCategory(f.extension), 16)}</span>
              <span className="text-theme-text truncate">{f.name}</span>
            </div>
            <span className="text-[10px] text-theme-muted shrink-0 font-mono">
              {formatFileSize(f.sizeBytes)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end space-x-2 pt-2 border-t border-theme-border/50">
        <button
          type="button"
          onClick={onReset}
          disabled={isProcessing}
          className="px-3 py-1.5 rounded-lg text-xs text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors cursor-pointer"
        >
          {t('attachments.changeFile')}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isProcessing}
          className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-theme-accent text-white text-xs font-semibold hover:bg-theme-accent-hover shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
          <span>{t('attachments.attachAllToNote', { count: stagedFiles.length })}</span>
        </button>
      </div>
    </div>
  );
};
