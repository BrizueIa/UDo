import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, Strikethrough, Highlighter, Baseline, Eraser, ChevronDown, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { stripRichTextFormatting } from '../utils/inlineRichTextParser';

interface Props {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  content: string;
  hasSelection?: boolean;
  onChangeContent: (newContent: string) => void;
}

const BRAND_COLORS = [
  { hex: '#8b85ff', name: 'Indigo' }, { hex: '#1fd4a5', name: 'Mint' },
  { hex: '#a986ff', name: 'Violet' }, { hex: '#ffc95f', name: 'Amber' },
  { hex: '#f43f5e', name: 'Coral' }, { hex: '#38bdf8', name: 'Sky' },
];

export const RichTextToolbar: React.FC<Props> = ({
  textareaRef,
  content,
  hasSelection = false,
  onChangeContent,
}) => {
  const { t } = useTranslation();
  const [showColor, setShowColor] = useState(false);
  const [showBg, setShowBg] = useState(false);
  const [showSize, setShowSize] = useState(false);
  const [customColor, setCustomColor] = useState('#5551f5');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowColor(false); setShowBg(false); setShowSize(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const wrapSelection = (prefix: string, suffix: string, cleanRegex?: RegExp) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    let sel = content.slice(start, end) || t('richText.sampleText');
    if (cleanRegex) sel = sel.replace(cleanRegex, '');

    const rep = `${prefix}${sel}${suffix}`;
    onChangeContent(content.slice(0, start) + rep + content.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start, start + rep.length);
    });
  };

  const applyColor = (hex: string | null) => {
    wrapSelection(hex ? `[color=${hex}]` : '', hex ? '[/color]' : '', /\[\/?color(?:=[^\]]+)?\]/gi);
    setShowColor(false);
  };

  const applyBg = (hex: string | null) => {
    wrapSelection(hex ? `[bg=${hex}]` : '', hex ? '[/bg]' : '', /\[\/?bg(?:=[^\]]+)?\]/gi);
    setShowBg(false);
  };

  const applySize = (key: string | null) => {
    wrapSelection(key && key !== 'base' ? `[size=${key}]` : '', key && key !== 'base' ? '[/size]' : '', /\[\/?size(?:=[^\]]+)?\]/gi);
    setShowSize(false);
  };

  const clearFormatting = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const sel = content.slice(start, end);
    if (!sel) return;
    const cleaned = stripRichTextFormatting(sel);
    onChangeContent(content.slice(0, start) + cleaned + content.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start, start + cleaned.length);
    });
  };

  return (
    <div
      ref={menuRef}
      className={`relative flex items-center flex-wrap gap-1 p-1.5 rounded-xl border transition-all duration-150 select-none ${
        hasSelection
          ? 'bg-theme-card/95 border-theme-accent/60 shadow-md ring-1 ring-theme-accent/30'
          : 'bg-theme-card/70 border-white/[0.06] shadow-xs'
      }`}
    >
      {/* Size Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => { setShowSize(!showSize); setShowColor(false); setShowBg(false); }}
          className="flex items-center space-x-1 px-2 py-1 rounded-lg hover:bg-theme-hover text-theme-text text-xs font-medium cursor-pointer"
          title={t('richText.textSize')}
        >
          <span className="text-[11px] font-sans">{t('richText.textSize')}</span>
          <ChevronDown size={11} className="text-theme-muted" />
        </button>
        {showSize && (
          <div className="absolute top-full left-0 mt-1 w-32 bg-theme-sidebar border border-theme-border rounded-xl shadow-xl py-1 z-30 space-y-0.5">
            {[
              { id: 'sm', label: t('richText.sizeSmall') },
              { id: 'base', label: t('richText.sizeNormal') },
              { id: 'lg', label: t('richText.sizeLarge') },
              { id: 'xl', label: t('richText.sizeSubtitle') },
              { id: '2xl', label: t('richText.sizeTitle') },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => applySize(s.id)}
                className="w-full text-left px-2.5 py-1 text-xs text-theme-text hover:bg-theme-hover transition-colors cursor-pointer"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-4 bg-white/[0.08] mx-0.5" />

      {/* Style Buttons */}
      <button type="button" onClick={() => wrapSelection('**', '**')} className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors cursor-pointer" title={`${t('richText.bold')} (Ctrl+B)`}><Bold size={13} /></button>
      <button type="button" onClick={() => wrapSelection('*', '*')} className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors cursor-pointer" title={`${t('richText.italic')} (Ctrl+I)`}><Italic size={13} /></button>
      <button type="button" onClick={() => wrapSelection('<u>', '</u>')} className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors cursor-pointer" title={`${t('richText.underline')} (Ctrl+U)`}><Underline size={13} /></button>
      <button type="button" onClick={() => wrapSelection('~~', '~~')} className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors cursor-pointer" title={t('richText.strikethrough')}><Strikethrough size={13} /></button>

      <div className="w-px h-4 bg-white/[0.08] mx-0.5" />

      {/* Text Color Picker */}
      <div className="relative">
        <button
          type="button"
          onClick={() => { setShowColor(!showColor); setShowBg(false); setShowSize(false); }}
          className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors cursor-pointer flex items-center space-x-1"
          title={t('richText.textColor')}
        >
          <Baseline size={13} />
          <span className="w-2 h-2 rounded-[2px] bg-gradient-to-r from-[#5551f5] via-[#1fd4a5] to-[#ffc95f]" />
        </button>
        {showColor && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-theme-sidebar border border-theme-border rounded-xl shadow-xl z-30 space-y-2 min-w-[150px]">
            <div className="grid grid-cols-6 gap-1.5">
              {BRAND_COLORS.map((c) => (
                <button key={c.hex} type="button" onClick={() => applyColor(c.hex)} className="w-5 h-5 rounded-[4px] hover:scale-110 transition-transform shadow-xs cursor-pointer border border-white/10" style={{ backgroundColor: c.hex }} title={c.name} />
              ))}
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-white/[0.06] text-[11px]">
              <input type="color" value={customColor} onChange={(e) => { setCustomColor(e.target.value); applyColor(e.target.value); }} className="w-6 h-5 rounded cursor-pointer bg-transparent border-0" title={t('richText.customColor')} />
              <button type="button" onClick={() => applyColor(null)} className="text-[11px] text-theme-muted hover:text-red-400 cursor-pointer flex items-center space-x-0.5">
                <X size={10} /><span>{t('richText.removeColor')}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Highlighter Picker */}
      <div className="relative">
        <button
          type="button"
          onClick={() => { setShowBg(!showBg); setShowColor(false); setShowSize(false); }}
          className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors cursor-pointer"
          title={t('richText.highlight')}
        >
          <Highlighter size={13} />
        </button>
        {showBg && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-theme-sidebar border border-theme-border rounded-xl shadow-xl z-30 space-y-2 min-w-[150px]">
            <div className="grid grid-cols-6 gap-1.5">
              {BRAND_COLORS.map((c) => (
                <button key={c.hex} type="button" onClick={() => applyBg(c.hex)} className="w-5 h-5 rounded-[4px] hover:scale-110 transition-transform shadow-xs cursor-pointer border border-white/10" style={{ backgroundColor: c.hex }} title={c.name} />
              ))}
            </div>
            <div className="flex items-center justify-end pt-1 border-t border-white/[0.06]">
              <button type="button" onClick={() => applyBg(null)} className="text-[11px] text-theme-muted hover:text-red-400 cursor-pointer flex items-center space-x-0.5">
                <X size={10} /><span>{t('richText.removeHighlight')}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="w-px h-4 bg-white/[0.08] mx-0.5" />

      {/* Clear Formatting */}
      <button type="button" onClick={clearFormatting} className="p-1.5 rounded-lg text-theme-muted hover:text-red-400 hover:bg-theme-hover transition-colors cursor-pointer" title={t('richText.clearFormatting')}>
        <Eraser size={13} />
      </button>

      {hasSelection && (
        <span className="ml-auto text-[10px] font-mono text-theme-accent bg-theme-accent/10 px-1.5 py-0.5 rounded-md border border-theme-accent/20">
          {t('richText.selectionActive')}
        </span>
      )}
    </div>
  );
};
