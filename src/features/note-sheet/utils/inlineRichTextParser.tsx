import React from 'react';
import { FileText, Plus } from 'lucide-react';
import { NoteItem } from '../../../shared/types';
import { buildDiacriticRegex, normalizeDiacritics } from '../../../shared/utils/diacritics';

export interface RichTextParserOptions {
  notes: NoteItem[];
  findQuery?: string;
  currentMatchIndex?: number;
  matchCounter?: { current: number };
  onSelectNote: (noteId: string, subjectId: string) => void;
  onCreateNoteWithTitle: (title: string) => void;
  t: (key: string, options?: any) => string;
}

export interface RenderRichTitleOptions {
  ignoreSize?: boolean;
  isNoteTitle?: boolean;
}

export const TITLE_SIZE_MAP: Record<string, string> = {
  sm: 'text-xl font-bold',
  base: 'text-2xl font-bold',
  lg: 'text-3xl font-bold',
  xl: 'text-4xl font-extrabold',
  '2xl': 'text-5xl font-extrabold',
};

const SIZE_MAP: Record<string, string> = {
  sm: 'text-xs', base: 'text-sm', lg: 'text-lg font-medium', xl: 'text-xl font-semibold', '2xl': 'text-2xl font-bold',
};

const INLINE_TOKEN_REGEX = /(\[\[[^\]]+\]\]|`[^`]+`|\*\*[\s\S]*?\*\*|~~[\s\S]*?~~|<u>[\s\S]*?<\/u>|\[color=[^\]]+\][\s\S]*?\[\/color\]|\[bg=[^\]]+\][\s\S]*?\[\/bg\]|\[size=(?:sm|base|lg|xl|2xl)\][\s\S]*?\[\/size\]|\*[^*]+\*)/g;

export function stripRichTextFormatting(text: string): string {
  return text
    .replace(/\[color=[^\]]+\]/gi, '').replace(/\[\/color\]/gi, '')
    .replace(/\[bg=[^\]]+\]/gi, '').replace(/\[\/bg\]/gi, '')
    .replace(/\[size=[^\]]+\]/gi, '').replace(/\[\/size\]/gi, '')
    .replace(/<\/?u>/gi, '').replace(/~~/g, '').replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, '');
}

export function renderRichTitle(
  text: string,
  keyPrefix = 'title',
  depth = 0,
  options?: RenderRichTitleOptions
): React.ReactNode {
  if (!text) return null;
  if (depth > 4) return text;

  return text.split(INLINE_TOKEN_REGEX).map((part, i) => {
    if (!part) return null;
    const key = `${keyPrefix}-${i}`;

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={key} className="px-1 py-0.5 mx-0.5 rounded bg-theme-column font-mono text-[11px] text-theme-accent border border-white/[0.05]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={key} className="font-bold">{renderRichTitle(part.slice(2, -2), `${key}-b`, depth + 1, options)}</strong>;
    }
    if (part.startsWith('~~') && part.endsWith('~~')) {
      return <del key={key} className="line-through opacity-75">{renderRichTitle(part.slice(2, -2), `${key}-del`, depth + 1, options)}</del>;
    }
    if (part.startsWith('<u>') && part.endsWith('</u>')) {
      return <u key={key} className="underline underline-offset-2">{renderRichTitle(part.slice(3, -4), `${key}-u`, depth + 1, options)}</u>;
    }
    const colorMatch = part.match(/^\[color=([^\]]+)\]([\s\S]*?)\[\/color\]$/);
    if (colorMatch) {
      return <span key={key} style={{ color: colorMatch[1] }}>{renderRichTitle(colorMatch[2], `${key}-c`, depth + 1, options)}</span>;
    }
    const bgMatch = part.match(/^\[bg=([^\]]+)\]([\s\S]*?)\[\/bg\]$/);
    if (bgMatch) {
      const color = bgMatch[1];
      const bg = color.startsWith('#') && color.length === 7 ? `${color}33` : 'rgba(255, 201, 95, 0.25)';
      return (
        <mark key={key} style={{ backgroundColor: bg, borderBottom: `2px solid ${color}`, padding: '0 3px', borderRadius: '4px', color: 'inherit' }}>
          {renderRichTitle(bgMatch[2], `${key}-bg`, depth + 1, options)}
        </mark>
      );
    }
    const sizeMatch = part.match(/^\[size=([^\]]+)\]([\s\S]*?)\[\/size\]$/);
    if (sizeMatch) {
      if (options?.ignoreSize) {
        return (
          <React.Fragment key={key}>
            {renderRichTitle(sizeMatch[2], `${key}-sz`, depth + 1, options)}
          </React.Fragment>
        );
      }
      const sizeClass = options?.isNoteTitle
        ? (TITLE_SIZE_MAP[sizeMatch[1]] || 'text-3xl font-bold')
        : (SIZE_MAP[sizeMatch[1]] || 'text-base');
      return <span key={key} className={sizeClass}>{renderRichTitle(sizeMatch[2], `${key}-sz`, depth + 1, options)}</span>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={key} className="italic">{renderRichTitle(part.slice(1, -1), `${key}-em`, depth + 1, options)}</em>;
    }
    return part.replace(/\[\/?(?:color|bg|size)(?:=[^\]]+)?\]/gi, '').replace(/<\/?u>/gi, '');
  });
}

export function renderTextWithHighlights(rawText: string, keyPrefix: string, options: RichTextParserOptions): React.ReactNode {
  const q = options.findQuery?.trim();
  if (!q) return rawText;

  try {
    const regex = buildDiacriticRegex(q, 'gi');
    return rawText.split(regex).map((segment, idx) => {
      const isMatch = normalizeDiacritics(segment.toLowerCase()) === normalizeDiacritics(q.toLowerCase());
      if (isMatch) {
        const matchNum = options.matchCounter ? options.matchCounter.current++ : 0;
        const isActive = matchNum === options.currentMatchIndex;
        return (
          <mark
            key={`${keyPrefix}-${idx}`}
            data-find-active={isActive ? 'true' : undefined}
            className={`px-0.5 rounded transition-all duration-150 ${
              isActive ? 'bg-amber-400 text-black font-bold ring-2 ring-amber-500 shadow-sm' : 'bg-amber-300/40 text-theme-text'
            }`}
          >
            {segment}
          </mark>
        );
      }
      return segment;
    });
  } catch {
    return rawText;
  }
}

export function parseInlineRichText(
  text: string,
  options: RichTextParserOptions,
  keyPrefix = 'inline',
  depth = 0
): React.ReactNode {
  if (!text) return null;
  if (depth > 6) return text;

  return text.split(INLINE_TOKEN_REGEX).map((part, i) => {
    if (!part) return null;
    const key = `${keyPrefix}-${i}`;

    // Wiki Link [[Title]]
    if (part.startsWith('[[') && part.endsWith(']]')) {
      const wikiTitle = part.slice(2, -2).trim();
      const existingNote = options.notes.find((n) => n.title.toLowerCase() === wikiTitle.toLowerCase());

      return (
        <button
          key={key}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (existingNote) options.onSelectNote(existingNote.id, existingNote.subjectId);
            else options.onCreateNoteWithTitle(wikiTitle);
          }}
          className={`inline-flex items-center space-x-1 px-2 py-0.5 mx-0.5 rounded-md text-xs transition-colors cursor-pointer align-baseline ${
            existingNote
              ? 'bg-theme-accent/20 hover:bg-theme-accent/30 text-theme-accent border border-theme-accent/40 font-medium'
              : 'bg-theme-card hover:bg-theme-hover text-theme-muted hover:text-theme-text border border-dashed border-white/[0.15]'
          }`}
          title={options.t(existingNote ? 'note.openWikiLink' : 'note.createWikiLink', { title: wikiTitle })}
        >
          {existingNote ? <FileText size={12} className="shrink-0" /> : <Plus size={12} className="shrink-0" />}
          <span>{wikiTitle}</span>
        </button>
      );
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={key} className="px-1.5 py-0.5 mx-0.5 rounded bg-theme-column font-mono text-xs text-theme-accent border border-white/[0.05]">
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={key} className="font-semibold text-theme-text">{parseInlineRichText(part.slice(2, -2), options, `${key}-b`, depth + 1)}</strong>;
    }

    if (part.startsWith('~~') && part.endsWith('~~')) {
      return <del key={key} className="line-through opacity-75">{parseInlineRichText(part.slice(2, -2), options, `${key}-del`, depth + 1)}</del>;
    }

    if (part.startsWith('<u>') && part.endsWith('</u>')) {
      return <u key={key} className="underline underline-offset-2 decoration-theme-accent/60">{parseInlineRichText(part.slice(3, -4), options, `${key}-u`, depth + 1)}</u>;
    }

    const colorMatch = part.match(/^\[color=([^\]]+)\]([\s\S]*?)\[\/color\]$/);
    if (colorMatch) {
      return <span key={key} style={{ color: colorMatch[1] }}>{parseInlineRichText(colorMatch[2], options, `${key}-c`, depth + 1)}</span>;
    }

    const bgMatch = part.match(/^\[bg=([^\]]+)\]([\s\S]*?)\[\/bg\]$/);
    if (bgMatch) {
      const color = bgMatch[1];
      const bg = color.startsWith('#') && color.length === 7 ? `${color}33` : 'rgba(255, 201, 95, 0.25)';
      return (
        <mark key={key} style={{ backgroundColor: bg, borderBottom: `2px solid ${color}`, padding: '0 3px', borderRadius: '4px', color: 'inherit' }}>
          {parseInlineRichText(bgMatch[2], options, `${key}-bg`, depth + 1)}
        </mark>
      );
    }

    const sizeMatch = part.match(/^\[size=([^\]]+)\]([\s\S]*?)\[\/size\]$/);
    if (sizeMatch) {
      return <span key={key} className={SIZE_MAP[sizeMatch[1]] || 'text-base'}>{parseInlineRichText(sizeMatch[2], options, `${key}-sz`, depth + 1)}</span>;
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={key} className="italic text-theme-muted">{parseInlineRichText(part.slice(1, -1), options, `${key}-em`, depth + 1)}</em>;
    }

    const cleanedPart = part.replace(/\[\/?(?:color|bg|size)(?:=[^\]]+)?\]/gi, '').replace(/<\/?u>/gi, '');
    return renderTextWithHighlights(cleanedPart, key, options);
  });
}
