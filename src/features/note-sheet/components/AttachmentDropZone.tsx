import React, { useRef, useState } from 'react';
import { UploadCloud, FolderOpen, ClipboardPaste } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { extractImagePathsFromText } from '../../../shared/utils/imageClipboard';

interface Props {
  onStageFiles: (files: FileList | File[]) => void;
  onStagePaths: (paths: string[]) => void;
  onClipboardPaste: () => void;
  onNativeBrowse: () => void;
}

export const AttachmentDropZone: React.FC<Props> = ({
  onStageFiles,
  onStagePaths,
  onClipboardPaste,
  onNativeBrowse,
}) => {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
      }}
      onDrop={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          onStageFiles(e.dataTransfer.files);
          return;
        }

        const uriList = e.dataTransfer.getData('text/uri-list');
        const plainText = e.dataTransfer.getData('text/plain');
        const paths = Array.from(
          new Set([...extractImagePathsFromText(uriList), ...extractImagePathsFromText(plainText)])
        );
        if (paths.length > 0) {
          onStagePaths(paths);
        }
      }}
      className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4 transition-all ${
        isDragOver
          ? 'border-theme-accent bg-theme-accent/10 ring-2 ring-theme-accent/30'
          : 'border-theme-border/70 hover:border-theme-accent/50 bg-theme-card/40'
      }`}
    >
      <div className="w-12 h-12 rounded-full bg-theme-accent/15 text-theme-accent flex items-center justify-center">
        <UploadCloud size={24} />
      </div>

      <div className="space-y-1">
        <p className="text-sm font-semibold text-theme-text">
          {t('attachments.modalPrompt')}
        </p>
        <p className="text-xs text-theme-muted max-w-sm">
          {t('attachments.modalHint')}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        <button
          type="button"
          onClick={onClipboardPaste}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-theme-accent text-white text-xs font-semibold hover:bg-theme-accent-hover shadow-sm transition-all cursor-pointer"
        >
          <ClipboardPaste size={14} />
          <span>{t('attachments.pasteClipboard')}</span>
        </button>

        <button
          type="button"
          onClick={onNativeBrowse}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-theme-card hover:bg-theme-hover text-theme-text border border-theme-border text-xs font-medium transition-all cursor-pointer"
        >
          <FolderOpen size={14} className="text-theme-muted" />
          <span>{t('attachments.browseNative')}</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onStageFiles(e.target.files);
            }
          }}
        />
      </div>
    </div>
  );
};
