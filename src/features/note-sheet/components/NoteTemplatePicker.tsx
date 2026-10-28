import React, { useState, useEffect } from 'react';
import {
  FileText,
  Boxes,
  Users,
  CheckSquare,
  Lightbulb,
  Cpu,
  CalendarCheck2,
  Plus,
  Pencil,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CustomTemplateItem } from '../../../shared/types';
import { CustomTemplateModal } from './CustomTemplateModal';
import { BUILTIN_TEMPLATES, BuiltinTemplate } from '../data/builtinTemplates';

const STORAGE_KEY = 'udo_custom_templates_v1';

interface Props {
  onSelectTemplate: (content: string, title?: string) => void;
  variant?: 'inline' | 'dropdown';
  onClose?: () => void;
}

function renderTemplateIcon(name: BuiltinTemplate['iconName'], colorClass: string) {
  switch (name) {
    case 'file-text':
      return <FileText size={15} className={colorClass} />;
    case 'boxes':
      return <Boxes size={15} className={colorClass} />;
    case 'users':
      return <Users size={15} className={colorClass} />;
    case 'check-square':
      return <CheckSquare size={15} className={colorClass} />;
    case 'lightbulb':
      return <Lightbulb size={15} className={colorClass} />;
    case 'cpu':
      return <Cpu size={15} className={colorClass} />;
    case 'calendar':
      return <CalendarCheck2 size={15} className={colorClass} />;
  }
}

export const NoteTemplatePicker: React.FC<Props> = ({
  onSelectTemplate,
  variant = 'inline',
  onClose,
}) => {
  const { t, i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');
  const dateStr = new Date().toLocaleDateString();

  const [activeTab, setActiveTab] = useState<'builtin' | 'custom'>('builtin');
  const [customTemplates, setCustomTemplates] = useState<CustomTemplateItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CustomTemplateItem | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setCustomTemplates(JSON.parse(saved));
    } catch {
      setCustomTemplates([]);
    }
  }, []);

  const saveCustomTemplates = (updated: CustomTemplateItem[]) => {
    setCustomTemplates(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleSaveModal = (tpl: CustomTemplateItem) => {
    const exists = customTemplates.some((c) => c.id === tpl.id);
    const updated = exists
      ? customTemplates.map((c) => (c.id === tpl.id ? tpl : c))
      : [...customTemplates, tpl];
    saveCustomTemplates(updated);
  };

  const handleDeleteCustom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t('templates.deleteConfirm'))) {
      saveCustomTemplates(customTemplates.filter((c) => c.id !== id));
    }
  };

  const resolvedBuiltins = BUILTIN_TEMPLATES.map((tpl) => ({
    id: tpl.id,
    title: t(tpl.titleKey),
    desc: t(tpl.descKey),
    icon: renderTemplateIcon(tpl.iconName, tpl.iconColor),
    content: tpl.getContent(isEs, dateStr),
  }));

  if (variant === 'dropdown') {
    return (
      <>
        <div className="absolute right-0 top-full mt-1.5 w-72 bg-theme-card/95 backdrop-blur-md border border-theme-border rounded-xl shadow-2xl py-2 z-40 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between px-3 pb-1.5 border-b border-theme-border/50 mb-1">
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setActiveTab('builtin')}
                className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
                  activeTab === 'builtin' ? 'bg-theme-accent text-white' : 'text-theme-muted hover:text-theme-text'
                }`}
              >
                {t('templates.builtinTab')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('custom')}
                className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
                  activeTab === 'custom' ? 'bg-theme-accent text-white' : 'text-theme-muted hover:text-theme-text'
                }`}
              >
                {t('templates.customTab')} ({customTemplates.length})
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingTemplate(null);
                setModalOpen(true);
              }}
              className="p-1 rounded text-theme-accent hover:bg-theme-hover transition-colors"
              title={t('templates.createTemplate')}
            >
              <Plus size={13} />
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-0.5 px-1">
            {activeTab === 'builtin' ? (
              resolvedBuiltins.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    onSelectTemplate(tpl.content, tpl.id !== 'blank' ? tpl.title : undefined);
                    onClose?.();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-start space-x-2.5 hover:bg-theme-hover/60 transition-colors group cursor-pointer"
                >
                  <span className="mt-0.5 shrink-0 group-hover:scale-110 transition-transform">{tpl.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-theme-text truncate">{tpl.title}</div>
                    <div className="text-[10px] text-theme-muted truncate">{tpl.desc}</div>
                  </div>
                </button>
              ))
            ) : customTemplates.length === 0 ? (
              <div className="p-4 text-center text-xs text-theme-muted">
                {t('templates.noCustom')}
              </div>
            ) : (
              customTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => {
                    onSelectTemplate(tpl.content, tpl.title);
                    onClose?.();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-theme-hover/60 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <Sparkles size={14} className="text-theme-accent shrink-0" />
                    <div className="truncate">
                      <div className="text-xs font-semibold text-theme-text truncate">{tpl.title}</div>
                      <div className="text-[10px] text-theme-muted truncate">{tpl.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTemplate(tpl);
                        setModalOpen(true);
                      }}
                      className="p-1 text-theme-muted hover:text-theme-text rounded hover:bg-white/10"
                      title={t('templates.editTemplate')}
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteCustom(tpl.id, e)}
                      className="p-1 text-theme-muted hover:text-red-400 rounded hover:bg-white/10"
                      title={t('templates.deleteTemplate')}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <CustomTemplateModal
          isOpen={modalOpen}
          template={editingTemplate}
          onSave={handleSaveModal}
          onClose={() => setModalOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <div className="p-4 rounded-xl border border-dashed border-theme-border/80 bg-theme-card/20 space-y-3 my-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-theme-muted font-medium">{t('templates.starterPrompt')}</p>
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-theme-card/80 p-0.5 rounded-lg border border-theme-border/60">
              <button
                type="button"
                onClick={() => setActiveTab('builtin')}
                className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
                  activeTab === 'builtin' ? 'bg-theme-accent text-white' : 'text-theme-muted hover:text-theme-text'
                }`}
              >
                {t('templates.builtinTab')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('custom')}
                className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
                  activeTab === 'custom' ? 'bg-theme-accent text-white' : 'text-theme-muted hover:text-theme-text'
                }`}
              >
                {t('templates.customTab')} ({customTemplates.length})
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingTemplate(null);
                setModalOpen(true);
              }}
              className="flex items-center space-x-1 px-2 py-0.5 rounded bg-theme-card hover:bg-theme-hover border border-theme-border text-[11px] font-medium text-theme-text transition-colors"
            >
              <Plus size={12} className="text-theme-accent" />
              <span>{t('templates.createTemplate')}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {activeTab === 'builtin'
            ? resolvedBuiltins.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => onSelectTemplate(tpl.content, tpl.id !== 'blank' ? tpl.title : undefined)}
                  className="p-3 rounded-lg bg-theme-card/70 hover:bg-theme-hover border border-theme-border/50 hover:border-theme-accent/50 text-left transition-all hover:scale-[1.02] flex flex-col justify-between space-y-2 cursor-pointer group shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="p-1 rounded-md bg-white/[0.04] group-hover:scale-110 transition-transform">
                      {tpl.icon}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-theme-text block truncate">{tpl.title}</span>
                    <span className="text-[10px] text-theme-muted line-clamp-2 leading-tight">{tpl.desc}</span>
                  </div>
                </button>
              ))
            : (
              <>
                {customTemplates.map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => onSelectTemplate(tpl.content, tpl.title)}
                    className="p-3 rounded-lg bg-theme-card/70 hover:bg-theme-hover border border-theme-border/50 hover:border-theme-accent/50 text-left transition-all hover:scale-[1.02] flex flex-col justify-between space-y-2 cursor-pointer group shadow-xs relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="p-1 rounded-md bg-white/[0.04] text-theme-accent">
                        <Sparkles size={14} />
                      </span>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTemplate(tpl);
                            setModalOpen(true);
                          }}
                          className="p-1 text-theme-muted hover:text-theme-text rounded hover:bg-white/10"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCustom(tpl.id, e)}
                          className="p-1 text-theme-muted hover:text-red-400 rounded hover:bg-white/10"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-theme-text block truncate">{tpl.title}</span>
                      <span className="text-[10px] text-theme-muted line-clamp-2 leading-tight">
                        {tpl.description || t('templates.title')}
                      </span>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setEditingTemplate(null);
                    setModalOpen(true);
                  }}
                  className="p-3 rounded-lg border-2 border-dashed border-theme-border/60 hover:border-theme-accent/50 hover:bg-theme-card/40 flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer text-theme-muted hover:text-theme-text"
                >
                  <Plus size={18} className="text-theme-accent" />
                  <span className="text-xs font-semibold">{t('templates.createTemplate')}</span>
                </button>
              </>
            )}
        </div>
      </div>

      <CustomTemplateModal
        isOpen={modalOpen}
        template={editingTemplate}
        onSave={handleSaveModal}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
};
