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
  X,
  RotateCcw,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CustomTemplateItem } from '../../../shared/types';
import { CustomTemplateModal } from './CustomTemplateModal';
import { NoteTemplateDropdown } from './NoteTemplateDropdown';
import { BUILTIN_TEMPLATES, BuiltinTemplate } from '../data/builtinTemplates';

const STORAGE_KEY = 'udo_custom_templates_v1';
const STORAGE_HIDDEN_BUILTINS = 'udo_hidden_builtin_templates_v1';

interface Props {
  onSelectTemplate: (content: string, title?: string) => void;
  variant?: 'inline' | 'dropdown';
  onClose?: () => void;
  onDismiss?: () => void;
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
  onDismiss,
}) => {
  const { t, i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');
  const dateStr = new Date().toLocaleDateString();

  const [activeTab, setActiveTab] = useState<'builtin' | 'custom'>('builtin');
  const [customTemplates, setCustomTemplates] = useState<CustomTemplateItem[]>([]);
  const [hiddenBuiltinIds, setHiddenBuiltinIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CustomTemplateItem | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setCustomTemplates(JSON.parse(saved));
      const hidden = localStorage.getItem(STORAGE_HIDDEN_BUILTINS);
      if (hidden) setHiddenBuiltinIds(JSON.parse(hidden));
    } catch {
      setCustomTemplates([]);
      setHiddenBuiltinIds([]);
    }
  }, []);

  const saveCustomTemplates = (updated: CustomTemplateItem[]) => {
    setCustomTemplates(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleDeleteBuiltin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t('templates.deleteConfirm'))) {
      const updated = [...hiddenBuiltinIds, id];
      setHiddenBuiltinIds(updated);
      localStorage.setItem(STORAGE_HIDDEN_BUILTINS, JSON.stringify(updated));
    }
  };

  const handleRestoreBuiltins = () => {
    setHiddenBuiltinIds([]);
    localStorage.removeItem(STORAGE_HIDDEN_BUILTINS);
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

  const visibleBuiltins = BUILTIN_TEMPLATES.filter((tpl) => !hiddenBuiltinIds.includes(tpl.id)).map(
    (tpl) => ({
      id: tpl.id,
      title: t(tpl.titleKey),
      desc: t(tpl.descKey),
      icon: renderTemplateIcon(tpl.iconName, tpl.iconColor),
      content: tpl.getContent(isEs, dateStr),
    })
  );

  if (variant === 'dropdown') {
    return (
      <>
        <NoteTemplateDropdown
          visibleBuiltins={visibleBuiltins}
          customTemplates={customTemplates}
          activeTab={activeTab}
          hiddenBuiltinCount={hiddenBuiltinIds.length}
          onSetActiveTab={setActiveTab}
          onSelectTemplate={onSelectTemplate}
          onDeleteBuiltin={handleDeleteBuiltin}
          onRestoreBuiltins={handleRestoreBuiltins}
          onEditCustom={(tpl) => {
            setEditingTemplate(tpl);
            setModalOpen(true);
          }}
          onDeleteCustom={handleDeleteCustom}
          onCreateCustom={() => {
            setEditingTemplate(null);
            setModalOpen(true);
          }}
          onClose={onClose}
        />

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
      <div
        style={{ backgroundColor: 'var(--color-bg-card)' }}
        className="p-4 rounded-xl border border-dashed border-theme-border bg-theme-card space-y-3 my-2 shadow-xs"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs text-theme-muted font-medium">{t('templates.starterPrompt')}</p>
          <div className="flex items-center space-x-2">
            {hiddenBuiltinIds.length > 0 && activeTab === 'builtin' && (
              <button
                type="button"
                onClick={handleRestoreBuiltins}
                className="text-[10px] text-theme-muted hover:text-theme-accent transition-colors flex items-center space-x-1"
                title={t('templates.restoreDefaults')}
              >
                <RotateCcw size={11} />
                <span>{t('templates.restoreDefaults')}</span>
              </button>
            )}
            <div className="flex items-center bg-theme-card/80 p-0.5 rounded-lg border border-theme-border/60">
              <button
                type="button"
                onClick={() => setActiveTab('builtin')}
                className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
                  activeTab === 'builtin' ? 'bg-theme-accent text-white' : 'text-theme-muted hover:text-theme-text'
                }`}
              >
                {t('templates.builtinTab')} ({visibleBuiltins.length})
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
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="p-1 rounded text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors ml-1"
                title={t('templates.hideStarterPrompt')}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {activeTab === 'builtin' ? (
            visibleBuiltins.length === 0 ? (
              <div className="col-span-2 sm:col-span-4 p-4 text-center text-xs text-theme-muted space-y-2">
                <p>{t('templates.noCustom')}</p>
                <button
                  type="button"
                  onClick={handleRestoreBuiltins}
                  className="text-[11px] text-theme-accent hover:underline flex items-center justify-center space-x-1 mx-auto"
                >
                  <RotateCcw size={11} />
                  <span>{t('templates.restoreDefaults')}</span>
                </button>
              </div>
            ) : (
              visibleBuiltins.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => onSelectTemplate(tpl.content, tpl.id !== 'blank' ? tpl.title : undefined)}
                  className="p-3 rounded-lg bg-theme-card/70 hover:bg-theme-hover border border-theme-border/50 hover:border-theme-accent/50 text-left transition-all hover:scale-[1.02] flex flex-col justify-between space-y-2 cursor-pointer group shadow-xs relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="p-1 rounded-md bg-white/[0.04] group-hover:scale-110 transition-transform">
                      {tpl.icon}
                    </span>
                    {tpl.id !== 'blank' && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteBuiltin(tpl.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-theme-muted hover:text-red-400 rounded hover:bg-white/10 transition-opacity"
                        title={t('templates.deleteTemplate')}
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-theme-text block truncate">{tpl.title}</span>
                    <span className="text-[10px] text-theme-muted line-clamp-2 leading-tight">{tpl.desc}</span>
                  </div>
                </div>
              ))
            )
          ) : customTemplates.length === 0 ? (
            <div className="col-span-2 sm:col-span-4 p-4 text-center text-xs text-theme-muted">
              {t('templates.noCustom')}
            </div>
          ) : (
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
