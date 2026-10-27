import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  importJsonText: string;
  importError: string | null;
  onChangeImportText: (text: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImport: () => void;
}

export const ThemeImporterTab: React.FC<Props> = ({
  importJsonText,
  importError,
  onChangeImportText,
  onFileUpload,
  onImport,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="p-3 space-y-2.5">
      <div className="text-[11px] text-theme-muted leading-tight">
        {t('settings.vscodeNotice')}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={onFileUpload}
        className="hidden"
      />

      <div
        onClick={() => fileInputRef.current?.click()}
        className="border border-dashed border-white/[0.12] hover:border-theme-accent/60 rounded-xl p-3 text-center cursor-pointer transition-colors bg-theme-column/40 hover:bg-theme-column"
      >
        <Upload size={18} className="mx-auto text-theme-accent mb-1" />
        <p className="text-[11px] font-medium text-theme-text">
          {t('settings.dragVscodeFile')}
        </p>
      </div>

      <div className="space-y-1.5 pt-1">
        <div className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider">
          {t('settings.orPasteJson')}
        </div>
        <textarea
          value={importJsonText}
          onChange={(e) => onChangeImportText(e.target.value)}
          placeholder='{"name": "My Theme", "colors": { ... }}'
          rows={3}
          className="w-full bg-theme-column px-2.5 py-1.5 rounded-lg border border-white/[0.06] text-theme-text font-mono text-[10px] outline-none focus:border-theme-accent"
        />
        <button
          onClick={onImport}
          disabled={!importJsonText.trim()}
          className="w-full py-1.5 rounded-lg bg-theme-accent text-white text-xs font-semibold hover:bg-theme-accent-hover transition-colors disabled:opacity-50 shadow-xs"
        >
          {t('settings.importButton')}
        </button>
      </div>

      {importError && (
        <div className="p-2 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-[11px]">
          {importError}
        </div>
      )}
    </div>
  );
};
