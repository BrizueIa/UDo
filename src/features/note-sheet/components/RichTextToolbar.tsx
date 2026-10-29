import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, Strikethrough, Highlighter, Baseline, Eraser, ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { stripRichTextFormatting } from '../utils/inlineRichTextParser';

interface Props {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  content: string;
  coords: { x: number; y: number } | null;
  onChangeContent: (newContent: string) => void;
}

const BRAND_COLORS = [
  { hex: '#8b85ff', name: 'Indigo' }, { hex: '#1fd4a5', name: 'Mint' },
  { hex: '#a986ff', name: 'Violet' }, { hex: '#ffc95f', name: 'Amber' },
  { hex: '#f43f5e', name: 'Coral' }, { hex: '#38bdf8', name: 'Sky' },
];

export const RichTextToolbar: React.FC<Props> = ({ textareaRef, content, coords, onChangeContent }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'color' | 'bg' | 'size' | null>(null);
  const [customColor, setCustomColor] = useState('#5551f5');
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!coords) { setIsExpanded(false); setActiveTab(null); }
  }, [coords]);

  if (!coords) return null;

  const wrapSelection = (prefix: string, suffix: string, cleanRegex?: RegExp) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    let sel = content.slice(start, end) || t('richText.sampleText');
    if (cleanRegex) sel = sel.replace(cleanRegex, '');
    const rep = `${prefix}${sel}${suffix}`;
    onChangeContent(content.slice(0, start) + rep + content.slice(end));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start, start + rep.length); });
  };

  const applyColor = (hex: string | null) => wrapSelection(hex ? `[color=${hex}]` : '', hex ? '[/color]' : '', /\[\/?color(?:=[^\]]+)?\]/gi);
  const applyBg = (hex: string | null) => wrapSelection(hex ? `[bg=${hex}]` : '', hex ? '[/bg]' : '', /\[\/?bg(?:=[^\]]+)?\]/gi);
  const applySize = (key: string | null) => wrapSelection(key && key !== 'base' ? `[size=${key}]` : '', key && key !== 'base' ? '[/size]' : '', /\[\/?size(?:=[^\]]+)?\]/gi);

  const clearFormatting = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const sel = content.slice(start, end);
    if (!sel) return;
    const cleaned = stripRichTextFormatting(sel);
    onChangeContent(content.slice(0, start) + cleaned + content.slice(end));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start, start + cleaned.length); });
  };

  const safeX = Math.max(160, Math.min(window.innerWidth - 160, coords.x));
  const safeY = Math.max(50, coords.y);

  return (
    <div
      ref={toolbarRef}
      onMouseDown={(e) => e.preventDefault()}
      style={{ left: `${safeX}px`, top: `${safeY}px` }}
      className="fixed z-50 -translate-x-1/2 -translate-y-full -mt-2 flex flex-col items-center animate-in fade-in zoom-in-95 duration-100 select-none"
    >
      <div className="flex flex-col bg-theme-sidebar/95 backdrop-blur-md border border-white/[0.12] rounded-2xl shadow-2xl p-1 text-theme-text transition-all max-w-[90vw]">
        {/* Main row */}
        <div className="flex items-center space-x-0.5">
          <button type="button" onClick={() => wrapSelection('**', '**')} className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-card transition-colors cursor-pointer" title={`${t('richText.bold')} (Ctrl+B)`}><Bold size={13} /></button>
          <button type="button" onClick={() => wrapSelection('*', '*')} className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-card transition-colors cursor-pointer" title={`${t('richText.italic')} (Ctrl+I)`}><Italic size={13} /></button>
          <button type="button" onClick={() => wrapSelection('<u>', '</u>')} className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-card transition-colors cursor-pointer" title={`${t('richText.underline')} (Ctrl+U)`}><Underline size={13} /></button>
          <button type="button" onClick={() => wrapSelection('~~', '~~')} className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-card transition-colors cursor-pointer" title={t('richText.strikethrough')}><Strikethrough size={13} /></button>

          <div className="w-px h-3.5 bg-white/[0.08] mx-0.5" />

          {/* Color trigger */}
          <button type="button" onClick={() => { setIsExpanded(true); setActiveTab(activeTab === 'color' ? null : 'color'); }} className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 ${activeTab === 'color' ? 'text-theme-accent bg-theme-card' : 'text-theme-muted hover:text-theme-text hover:bg-theme-card'}`} title={t('richText.textColor')}>
            <Baseline size={13} /><span className="w-1.5 h-1.5 rounded-[2px] bg-[#1fd4a5]" />
          </button>

          {/* Highlight trigger */}
          <button type="button" onClick={() => { setIsExpanded(true); setActiveTab(activeTab === 'bg' ? null : 'bg'); }} className={`p-1.5 rounded-lg transition-colors cursor-pointer ${activeTab === 'bg' ? 'text-amber-400 bg-theme-card' : 'text-theme-muted hover:text-theme-text hover:bg-theme-card'}`} title={t('richText.highlight')}>
            <Highlighter size={13} />
          </button>

          {/* Size trigger */}
          <button type="button" onClick={() => { setIsExpanded(true); setActiveTab(activeTab === 'size' ? null : 'size'); }} className={`px-1.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px] font-sans flex items-center space-x-0.5 ${activeTab === 'size' ? 'text-theme-accent bg-theme-card font-semibold' : 'text-theme-muted hover:text-theme-text hover:bg-theme-card'}`} title={t('richText.textSize')}>
            <span>{t('richText.textSize')}</span><ChevronDown size={10} />
          </button>

          <div className="w-px h-3.5 bg-white/[0.08] mx-0.5" />

          {/* Clear Formatting & Expand */}
          <button type="button" onClick={clearFormatting} className="p-1.5 rounded-lg text-theme-muted hover:text-red-400 hover:bg-theme-card transition-colors cursor-pointer" title={t('richText.clearFormatting')}><Eraser size={13} /></button>
          <button type="button" onClick={() => { setIsExpanded(!isExpanded); if (isExpanded) setActiveTab(null); }} className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isExpanded ? 'text-theme-accent bg-theme-card' : 'text-theme-muted hover:text-theme-text hover:bg-theme-card'}`} title="Options"><SlidersHorizontal size={12} /></button>
        </div>

        {/* Expandable options */}
        {isExpanded && (
          <div className="pt-1.5 pb-0.5 px-1 mt-1 border-t border-white/[0.06] space-y-1.5">
            {(activeTab === 'color' || !activeTab) && (
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-theme-muted font-mono">{t('richText.textColor')}:</span>
                <div className="flex items-center space-x-1">
                  {BRAND_COLORS.map((c) => (
                    <button key={c.hex} type="button" onClick={() => applyColor(c.hex)} className="w-4 h-4 rounded-[3px] hover:scale-125 transition-transform border border-white/20 shadow-xs cursor-pointer" style={{ backgroundColor: c.hex }} title={c.name} />
                  ))}
                  <input type="color" value={customColor} onChange={(e) => { setCustomColor(e.target.value); applyColor(e.target.value); }} className="w-4 h-4 rounded cursor-pointer bg-transparent border-0" title={t('richText.customColor')} />
                  <button type="button" onClick={() => applyColor(null)} className="text-[10px] text-theme-muted hover:text-red-400 p-0.5 cursor-pointer" title={t('richText.removeColor')}><X size={11} /></button>
                </div>
              </div>
            )}

            {(activeTab === 'bg' || !activeTab) && (
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-theme-muted font-mono">{t('richText.highlight')}:</span>
                <div className="flex items-center space-x-1">
                  {BRAND_COLORS.map((c) => (
                    <button key={c.hex} type="button" onClick={() => applyBg(c.hex)} className="w-4 h-4 rounded-[3px] hover:scale-125 transition-transform border border-white/20 shadow-xs cursor-pointer opacity-90" style={{ backgroundColor: c.hex }} title={c.name} />
                  ))}
                  <button type="button" onClick={() => applyBg(null)} className="text-[10px] text-theme-muted hover:text-red-400 p-0.5 cursor-pointer" title={t('richText.removeHighlight')}><X size={11} /></button>
                </div>
              </div>
            )}

            {(activeTab === 'size' || !activeTab) && (
              <div className="flex items-center space-x-1 pt-0.5">
                {[
                  { id: 'sm', label: t('richText.sizeSmall') }, { id: 'base', label: t('richText.sizeNormal') },
                  { id: 'lg', label: t('richText.sizeLarge') }, { id: 'xl', label: t('richText.sizeSubtitle') },
                  { id: '2xl', label: t('richText.sizeTitle') },
                ].map((s) => (
                  <button key={s.id} type="button" onClick={() => applySize(s.id)} className="px-1.5 py-0.5 rounded text-[10px] text-theme-muted hover:text-theme-text hover:bg-theme-card transition-colors cursor-pointer">{s.label}</button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="w-2 h-2 -mt-1 rotate-45 bg-theme-sidebar border-r border-b border-white/[0.12]" />
    </div>
  );
};
