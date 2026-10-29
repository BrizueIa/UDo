import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Paperclip, UploadCloud, FolderOpen, ClipboardPaste, X, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SketchItem } from '../../../shared/types';
import {
  extractImageFile,
  fileToDataUrl,
  createSketchFromPath,
  extractImagePathsFromText,
} from '../../../shared/utils/imageClipboard';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAttachSketch: (sketch: SketchItem) => void;
}

export const ImageAttachmentModal: React.FC<Props> = ({ isOpen, onClose, onAttachSketch }) => {
  const { t } = useTranslation();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageTitle, setImageTitle] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setPreviewUrl(null);
      setImageTitle('');
      setIsDragOver(false);
    }
  }, [isOpen]);

  const handleImageLoaded = (dataUrl: string, title: string) => {
    setPreviewUrl(dataUrl);
    setImageTitle(title || t('note.pastedImage'));
  };

  const handleFile = async (file: File) => {
    try {
      const dataUrl = await fileToDataUrl(file);
      const name = file.name ? file.name.replace(/\.[^/.]+$/, '') : t('note.pastedImage');
      handleImageLoaded(dataUrl, name);
    } catch (err) {
      console.warn('Failed to read file:', err);
    }
  };

  const handleClipboardPaste = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      if (navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          for (const type of item.types) {
            if (type.startsWith('image/')) {
              const blob = await item.getType(type);
              const file = new File([blob], 'clipboard-image.png', { type });
              await handleFile(file);
              return;
            }
          }
        }
      }
      if (navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        const paths = extractImagePathsFromText(text);
        if (paths.length > 0) {
          const sk = await createSketchFromPath(paths[0], t('note.pastedImage'));
          handleImageLoaded(sk.dataUrl, sk.title);
        }
      }
    } catch (err) {
      console.warn('Clipboard read failed:', err);
    }
  }, [t]);

  // Listen for global Ctrl+V and Escape while modal is active
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter' && previewUrl) {
        e.preventDefault();
        handleConfirm();
      }
    };

    const handlePaste = async (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const file = extractImageFile(e);
      if (file) {
        e.preventDefault();
        await handleFile(file);
        return;
      }
      const plainText = e.clipboardData.getData('text/plain');
      const paths = extractImagePathsFromText(plainText);
      if (paths.length > 0) {
        e.preventDefault();
        try {
          const sk = await createSketchFromPath(paths[0], t('note.pastedImage'));
          handleImageLoaded(sk.dataUrl, sk.title);
        } catch (err) {
          console.warn('Failed to load image from path:', err);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('paste', handlePaste);
    };
  }, [isOpen, previewUrl, onClose]);

  const handleConfirm = () => {
    if (!previewUrl) return;
    const sketch: SketchItem = {
      id: `sketch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: imageTitle.trim() || t('note.pastedImage'),
      dataUrl: previewUrl,
      createdAt: new Date().toISOString(),
    };
    onAttachSketch(sketch);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-theme-sidebar border border-theme-border rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-theme-border/50">
          <div className="flex items-center space-x-2 text-theme-text font-bold text-sm">
            <Paperclip size={16} className="text-theme-accent" />
            <span>{t('note.attachImageModalTitle')}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Area */}
        {!previewUrl ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragOver(false);
            }}
            onDrop={async (e) => {
              e.preventDefault();
              setIsDragOver(false);
              const file = extractImageFile(e);
              if (file) await handleFile(file);
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
                {t('note.attachImagePrompt')}
              </p>
              <p className="text-xs text-theme-muted">
                {t('note.attachImageHint')}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleClipboardPaste}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-theme-accent text-white text-xs font-semibold hover:bg-theme-accent-hover shadow-sm transition-all cursor-pointer"
              >
                <ClipboardPaste size={14} />
                <span>{t('note.pasteClipboardBtn')}</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-theme-card hover:bg-theme-hover text-theme-text border border-theme-border text-xs font-medium transition-all cursor-pointer"
              >
                <FolderOpen size={14} className="text-theme-muted" />
                <span>{t('note.browseFileBtn')}</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) await handleFile(f);
                }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="max-h-60 rounded-xl overflow-hidden border border-theme-border bg-black/40 flex items-center justify-center p-2">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-56 max-w-full object-contain rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">
                {t('note.imageTitle')}
              </label>
              <input
                type="text"
                autoFocus
                value={imageTitle}
                onChange={(e) => setImageTitle(e.target.value)}
                className="w-full bg-theme-card border border-theme-border rounded-lg px-3 py-1.5 text-xs text-theme-text outline-none focus:border-theme-accent/60"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-theme-border/50">
              <button
                type="button"
                onClick={() => setPreviewUrl(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors"
              >
                {t('note.changeImage')}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex items-center space-x-1 px-4 py-1.5 rounded-lg bg-theme-accent text-white text-xs font-semibold hover:bg-theme-accent-hover shadow-sm transition-all"
              >
                <Check size={14} />
                <span>{t('note.attachToNote')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
