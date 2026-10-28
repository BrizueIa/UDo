import React, { useState, useEffect } from 'react';
import { X, Save, FileCode } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CustomTemplateItem } from '../../../shared/types';

interface Props {
  isOpen: boolean;
  template?: CustomTemplateItem | null;
  onSave: (template: CustomTemplateItem) => void;
  onClose: () => void;
}

export const CustomTemplateModal: React.FC<Props> = ({
  isOpen,
  template,
  onSave,
  onClose,
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (template) {
      setTitle(template.title);
      setDescription(template.description);
      setContent(template.content);
    } else {
      setTitle('');
      setDescription('');
      setContent('# ');
    }
  }, [template, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: template?.id || `custom-tpl-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      content,
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-theme-card border border-theme-border rounded-2xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-theme-border/60 bg-theme-sidebar/50">
          <div className="flex items-center space-x-2">
            <FileCode size={16} className="text-theme-accent" />
            <span className="text-sm font-bold text-theme-text">
              {template ? t('templates.editTemplate') : t('templates.createTemplate')}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-theme-text block">
              {t('templates.templateTitle')} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('templates.templateTitlePlaceholder')}
              className="w-full bg-theme-column px-3 py-2 rounded-xl text-xs text-theme-text outline-none border border-theme-border/70 focus:border-theme-accent transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-theme-text block">
              {t('templates.templateDesc')}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('templates.templateDescPlaceholder')}
              className="w-full bg-theme-column px-3 py-2 rounded-xl text-xs text-theme-text outline-none border border-theme-border/70 focus:border-theme-accent transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-theme-text block">
              {t('templates.templateContent')}
            </label>
            <textarea
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('templates.templateContentPlaceholder')}
              className="w-full bg-theme-column p-3 rounded-xl text-xs text-theme-text font-mono leading-relaxed outline-none border border-theme-border/70 focus:border-theme-accent transition-colors resize-y"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-theme-border/40">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors"
            >
              {t('nav.cancel')}
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-theme-accent hover:bg-theme-accent-hover text-white transition-colors disabled:opacity-50 shadow-sm"
            >
              <Save size={13} />
              <span>{t('templates.saveTemplate')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
