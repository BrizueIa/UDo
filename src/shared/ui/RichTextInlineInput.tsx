import React, { useRef, useState, useEffect, useCallback } from 'react';
import { RichTextToolbar, RichFormatAction } from '../../features/note-sheet/components/RichTextToolbar';
import { storedToVisualHtml, visualHtmlToStored, storedToPlainText } from '../../features/note-sheet/utils/richTextHtmlCodec';
import { applyFormatToContentEditable } from '../../features/note-sheet/utils/richTextDomCommands';

interface Props {
  value: string;
  onChange: (newValue: string) => void;
  onCommit?: (finalValue: string) => void;
  onCancel?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export const RichTextInlineInput: React.FC<Props> = ({
  value,
  onChange,
  onCommit,
  onCancel,
  onBlur,
  placeholder = '',
  className = '',
  autoFocus = true,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const lastEmittedRef = useRef<string>(value);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const html = storedToVisualHtml(value);
    if (el.innerHTML !== html && lastEmittedRef.current !== value) {
      el.innerHTML = html;
      lastEmittedRef.current = value;
    }
  }, [value]);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    el.innerHTML = storedToVisualHtml(value);
    lastEmittedRef.current = value;
    if (autoFocus) {
      requestAnimationFrame(() => {
        el.focus();
        const sel = window.getSelection();
        if (sel) {
          const range = document.createRange();
          range.selectNodeContents(el);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      });
    }
  }, []);

  const syncFromDom = useCallback(() => {
    const el = editorRef.current;
    if (!el) return '';
    const stored = visualHtmlToStored(el).replace(/\r?\n/g, ' ');
    lastEmittedRef.current = stored;
    onChange(stored);
    return stored;
  }, [onChange]);

  const checkSelection = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      setCoords(null);
      return;
    }
    const range = sel.getRangeAt(0);
    if (!el.contains(range.commonAncestorContainer)) {
      setCoords(null);
      return;
    }
    const text = sel.toString().trim();
    if (!text) {
      setCoords(null);
      return;
    }
    savedRangeRef.current = range.cloneRange();
    const rect = range.getBoundingClientRect();
    const hostRect = el.getBoundingClientRect();
    const x = rect.width > 0 ? rect.left + rect.width / 2 : hostRect.left + hostRect.width / 2;
    const y = rect.top > 0 ? rect.top : hostRect.top;
    setCoords({ x, y });
  }, []);

  const handleApplyFormat = (action: RichFormatAction) => {
    const el = editorRef.current;
    if (!el) return;
    const nextRange = applyFormatToContentEditable(
      el,
      action,
      savedRangeRef.current,
      (stored) => {
        const singleLine = stored.replace(/\r?\n/g, ' ');
        lastEmittedRef.current = singleLine;
        onChange(singleLine);
      }
    );
    if (nextRange) {
      savedRangeRef.current = nextRange.cloneRange();
    }
  };

  const isEmpty = !storedToPlainText(value).trim();

  return (
    <div className="relative flex-1 min-w-0">
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={syncFromDom}
        onMouseUp={checkSelection}
        onKeyUp={(e) => {
          if (e.key !== 'Shift' && e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Meta') {
            checkSelection();
          }
        }}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData('text/plain').replace(/\r?\n/g, ' ');
          document.execCommand('insertText', false, text);
          syncFromDom();
        }}
        onKeyDown={(e) => {
          const isCtrl = e.ctrlKey || e.metaKey;
          if (e.key === 'Enter') {
            e.preventDefault();
            setCoords(null);
            const finalVal = syncFromDom();
            onCommit?.(finalVal);
            onBlur?.();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            setCoords(null);
            onCancel?.();
            onBlur?.();
          } else if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'b') {
            e.preventDefault();
            handleApplyFormat({ type: 'bold' });
          } else if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'i') {
            e.preventDefault();
            handleApplyFormat({ type: 'italic' });
          } else if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'u') {
            e.preventDefault();
            handleApplyFormat({ type: 'underline' });
          }
        }}
        onBlur={(e) => {
          if (
            e.relatedTarget &&
            (e.relatedTarget as HTMLElement).closest('[data-rich-toolbar="true"]')
          ) {
            return;
          }
          setCoords(null);
          const finalVal = syncFromDom();
          onCommit?.(finalVal);
          onBlur?.();
        }}
        className={`outline-none whitespace-nowrap overflow-x-auto no-scrollbar ${className}`}
      />
      {isEmpty && placeholder && (
        <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-theme-muted/50 italic select-none truncate max-w-full">
          {placeholder}
        </span>
      )}
      <RichTextToolbar
        inputRef={editorRef}
        coords={coords}
        onApplyFormat={handleApplyFormat}
        onClose={() => setCoords(null)}
      />
    </div>
  );
};
