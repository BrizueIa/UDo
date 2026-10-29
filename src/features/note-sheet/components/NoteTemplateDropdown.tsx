import React from 'react';
import { Plus, Pencil, Trash2, Sparkles, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CustomTemplateItem } from '../../../shared/types';

interface ResolvedTemplate {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  content: string;
}

interface Props {
  visibleBuiltins: ResolvedTemplate[];
  customTemplates: CustomTemplateItem[];
  activeTab: 'builtin' | 'custom';
  hiddenBuiltinCount: number;
  onSetActiveTab: (tab: 'builtin' | 'custom') => void;
  onSelectTemplate: (content: string, title?: string) => void;
  onDeleteBuiltin: (id: string, e: React.MouseEvent) => void;
  onRestoreBuiltins: () => void;
  onEditCustom: (tpl: CustomTemplateItem) => void;
  onDeleteCustom: (id: string, e: React.MouseEvent) => void;
  onCreateCustom: () => void;
  onClose?: () => void;
}

export const NoteTemplateDropdown: React.FC<Props> = ({
  visibleBuiltins,
  customTemplates,
  activeTab,
  hiddenBuiltinCount,
  onSetActiveTab,
  onSelectTemplate,
  onDeleteBuiltin,
  onRestoreBuiltins,
  onEditCustom,
  onDeleteCustom,
  onCreateCustom,
  onClose,
}) => {
  const { t } = useTranslation();

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-card)',
        color: 'var(--color-text-main)',
      }}
      className="absolute right-0 top-full mt-1.5 w-72 bg-theme-card border border-theme-border rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="flex items-center justify-between px-3 pb-1.5 border-b border-theme-border/50 mb-1">
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => onSetActiveTab('builtin')}
            className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
              activeTab === 'builtin' ? 'bg-theme-accent text-white' : 'text-theme-muted hover:text-theme-text'
            }`}
          >
            {t('templates.builtinTab')} ({visibleBuiltins.length})
          </button>
          <button
            type="button"
            onClick={() => onSetActiveTab('custom')}
            className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
              activeTab === 'custom' ? 'bg-theme-accent text-white' : 'text-theme-muted hover:text-theme-text'
            }`}
          >
            {t('templates.customTab')} ({customTemplates.length})
          </button>
        </div>
        <div className="flex items-center space-x-1">
          {hiddenBuiltinCount > 0 && activeTab === 'builtin' && (
            <button
              type="button"
              onClick={onRestoreBuiltins}
              className="p-1 rounded text-theme-muted hover:text-theme-accent transition-colors"
              title={t('templates.restoreDefaults')}
            >
              <RotateCcw size={12} />
            </button>
          )}
          <button
            type="button"
            onClick={onCreateCustom}
            className="p-1 rounded text-theme-accent hover:bg-theme-hover transition-colors"
            title={t('templates.createTemplate')}
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto space-y-0.5 px-1">
        {activeTab === 'builtin' ? (
          visibleBuiltins.length === 0 ? (
            <div className="p-4 text-center text-xs text-theme-muted space-y-2">
              <p>{t('templates.noCustom')}</p>
              <button
                type="button"
                onClick={onRestoreBuiltins}
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
                onClick={() => {
                  onSelectTemplate(tpl.content, tpl.id !== 'blank' ? tpl.title : undefined);
                  onClose?.();
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-theme-hover/60 transition-colors group cursor-pointer"
              >
                <div className="flex items-start space-x-2.5 min-w-0 flex-1">
                  <span className="mt-0.5 shrink-0 group-hover:scale-110 transition-transform">{tpl.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-theme-text truncate">{tpl.title}</div>
                    <div className="text-[10px] text-theme-muted truncate">{tpl.desc}</div>
                  </div>
                </div>
                {tpl.id !== 'blank' && (
                  <button
                    type="button"
                    onClick={(e) => onDeleteBuiltin(tpl.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-theme-muted hover:text-red-400 rounded hover:bg-white/10 transition-opacity ml-1"
                    title={t('templates.deleteTemplate')}
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            ))
          )
        ) : customTemplates.length === 0 ? (
          <div className="p-4 text-center text-xs text-theme-muted">{t('templates.noCustom')}</div>
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
                    onEditCustom(tpl);
                  }}
                  className="p-1 text-theme-muted hover:text-theme-text rounded hover:bg-white/10"
                  title={t('templates.editTemplate')}
                >
                  <Pencil size={11} />
                </button>
                <button
                  type="button"
                  onClick={(e) => onDeleteCustom(tpl.id, e)}
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
  );
};
