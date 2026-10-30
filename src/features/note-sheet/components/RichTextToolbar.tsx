import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  Baseline,
  Eraser,
  ChevronDown,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { stripRichTextFormatting } from '../utils/inlineRichTextParser';

export type RichFormatAction =
  | { type: 'bold' }
  | { type: 'italic' }
  | { type: 'underline' }
  | { type: 'strikethrough' }
  | { type: 'color'; hex: string | null }
  | { type: 'bg'; hex: string | null }
  | { type: 'size'; size: string | null }
  | { type: 'clear' };

interface Props {
  inputRef?: React.RefObject<HTMLElement | null>;
  content?: string;
  coords: { x: number; y: number } | null;
  onChangeContent?: (newContent: string) => void;
  onApplyFormat?: (action: RichFormatAction) => void;
  onClose?: () => void;
}

const BRAND_COLORS = [
  { hex: '#5551f5', name: 'Indigo' },
  { hex: '#1fd4a5', name: 'Mint' },
  { hex: '#ffc95f', name: 'Amber' },
  { hex: '#a986ff', name: 'Violet' },
  { hex: '#f43f5e', name: 'Coral' },
  { hex: '#38bdf8', name: 'Sky' },
  { hex: '#ffffff', name: 'White' },
];

export const RichTextToolbar: React.FC<Props> = ({
  inputRef,
  content = '',
  coords,
  onChangeContent,
  onApplyFormat,
  onClose,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'color' | 'bg' | 'size' | null>(null);
  const [customColor, setCustomColor] = useState('#5551f5');
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!coords) setActiveTab(null);
  }, [coords]);

  useEffect(() => {
    if (!coords) return;
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        toolbarRef.current?.contains(target) ||
        target.closest('[data-rich-toolbar="true"]') ||
        inputRef?.current?.contains(target)
      ) {
        return;
      }
      onClose?.();
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [coords, inputRef, onClose]);

  if (!coords) return null;

  const dispatchFormat = (
    action: RichFormatAction,
    prefix = '',
    suffix = '',
    cleanRegex?: RegExp
  ) => {
    if (onApplyFormat) {
      onApplyFormat(action);
      return;
    }
    const el = inputRef?.current as HTMLInputElement | HTMLTextAreaElement | null;
    if (!el || !onChangeContent || !('selectionStart' in el)) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    if (action.type === 'clear') {
      const sel = content.slice(start, end);
      if (!sel) return;
      const cleaned = stripRichTextFormatting(sel);
      onChangeContent(content.slice(0, start) + cleaned + content.slice(end));
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start, start + cleaned.length);
      });
      return;
    }
    let sel = content.slice(start, end) || t('richText.sampleText');
    if (cleanRegex) sel = sel.replace(cleanRegex, '');
    const rep = `${prefix}${sel}${suffix}`;
    onChangeContent(content.slice(0, start) + rep + content.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start, start + rep.length);
    });
  };

  const applyColor = (hex: string | null) =>
    dispatchFormat(
      { type: 'color', hex },
      hex ? `[color=${hex}]` : '',
      hex ? '[/color]' : '',
      /\[\/?color(?:=[^\]]+)?\]/gi
    );

  const applyBg = (hex: string | null) =>
    dispatchFormat(
      { type: 'bg', hex },
      hex ? `[bg=${hex}]` : '',
      hex ? '[/bg]' : '',
      /\[\/?bg(?:=[^\]]+)?\]/gi
    );

  const applySize = (size: string | null) =>
    dispatchFormat(
      { type: 'size', size },
      size && size !== 'base' ? `[size=${size}]` : '',
      size && size !== 'base' ? '[/size]' : '',
      /\[\/?size(?:=[^\]]+)?\]/gi
    );

  const safeX = Math.max(160, Math.min(window.innerWidth - 160, coords.x));
  const isNearTop = coords.y < 85;
  const safeY = isNearTop ? coords.y + 36 : Math.max(50, coords.y - 10);

  return (
    <div
      ref={toolbarRef}
      data-rich-toolbar="true"
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      style={{ left: `${safeX}px`, top: `${safeY}px` }}
      className={`fixed z-50 -translate-x-1/2 flex flex-col items-center animate-in fade-in zoom-in-95 duration-100 select-none ${
        isNearTop ? '' : '-translate-y-full'
      }`}
    >
      {isNearTop && (
        <div className="w-2.5 h-2.5 -mb-1 rotate-45 bg-theme-card border-l border-t border-theme-border z-10" />
      )}

      <div className="flex flex-col bg-theme-card border border-theme-border rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.5)] p-1 text-theme-text transition-all max-w-[90vw]">
        <div className="flex items-center space-x-0.5">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onClick={() => dispatchFormat({ type: 'bold' }, '**', '**')}
            className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors cursor-pointer"
            title={`${t('richText.bold')} (Ctrl+B)`}
          >
            <Bold size={13} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onClick={() => dispatchFormat({ type: 'italic' }, '*', '*')}
            className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors cursor-pointer"
            title={`${t('richText.italic')} (Ctrl+I)`}
          >
            <Italic size={13} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onClick={() => dispatchFormat({ type: 'underline' }, '<u>', '</u>')}
            className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors cursor-pointer"
            title={`${t('richText.underline')} (Ctrl+U)`}
          >
            <Underline size={13} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onClick={() => dispatchFormat({ type: 'strikethrough' }, '~~', '~~')}
            className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors cursor-pointer"
            title={t('richText.strikethrough')}
          >
            <Strikethrough size={13} />
          </button>

          <div className="w-px h-3.5 bg-theme-border mx-0.5" />

          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onClick={() => setActiveTab(activeTab === 'color' ? null : 'color')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 ${
              activeTab === 'color'
                ? 'text-theme-accent bg-theme-hover'
                : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover'
            }`}
            title={t('richText.textColor')}
          >
            <Baseline size={13} />
            <span className="w-1.5 h-1.5 rounded-[2px] bg-[#1fd4a5]" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onClick={() => setActiveTab(activeTab === 'bg' ? null : 'bg')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'bg'
                ? 'text-amber-400 bg-theme-hover'
                : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover'
            }`}
            title={t('richText.highlight')}
          >
            <Highlighter size={13} />
          </button>

          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onClick={() => setActiveTab(activeTab === 'size' ? null : 'size')}
            className={`px-1.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px] font-sans flex items-center space-x-0.5 ${
              activeTab === 'size'
                ? 'text-theme-accent bg-theme-hover font-semibold'
                : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover'
            }`}
            title={t('richText.textSize')}
          >
            <span>{t('richText.textSize')}</span>
            <ChevronDown size={10} />
          </button>

          <div className="w-px h-3.5 bg-theme-border mx-0.5" />

          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onClick={() => dispatchFormat({ type: 'clear' })}
            className="p-1.5 rounded-lg text-theme-muted hover:text-red-400 hover:bg-theme-hover transition-colors cursor-pointer"
            title={t('richText.clearFormatting')}
          >
            <Eraser size={13} />
          </button>
        </div>

        {activeTab && (
          <div className="pt-2 pb-1 px-1 mt-1 border-t border-theme-border/60 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-100">
            {activeTab === 'color' && (
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-theme-muted font-mono">{t('richText.textColor')}:</span>
                <div className="flex items-center space-x-1">
                  {BRAND_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onClick={() => applyColor(c.hex)}
                      className="w-4 h-4 rounded-[3px] hover:scale-125 transition-transform border border-white/20 shadow-xs cursor-pointer"
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                  <input
                    type="color"
                    value={customColor}
                    onMouseDown={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      setCustomColor(e.target.value);
                      applyColor(e.target.value);
                    }}
                    className="w-4 h-4 rounded cursor-pointer bg-transparent border-0"
                    title={t('richText.customColor')}
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onClick={() => applyColor(null)}
                    className="text-[10px] text-theme-muted hover:text-red-400 p-0.5 cursor-pointer ml-1"
                    title={t('richText.removeColor')}
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'bg' && (
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-theme-muted font-mono">{t('richText.highlight')}:</span>
                <div className="flex items-center space-x-1">
                  {BRAND_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onClick={() => applyBg(c.hex)}
                      className="w-4 h-4 rounded-[3px] hover:scale-125 transition-transform border border-white/20 shadow-xs cursor-pointer"
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onClick={() => applyBg(null)}
                    className="text-[10px] text-theme-muted hover:text-red-400 p-0.5 cursor-pointer ml-1"
                    title={t('richText.removeHighlight')}
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'size' && (
              <div className="flex items-center space-x-1">
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
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onClick={() => applySize(s.id)}
                    className="px-1.5 py-0.5 rounded text-[10px] text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors cursor-pointer"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {!isNearTop && (
        <div className="w-2.5 h-2.5 -mt-1 rotate-45 bg-theme-card border-r border-b border-theme-border z-10" />
      )}
    </div>
  );
};
