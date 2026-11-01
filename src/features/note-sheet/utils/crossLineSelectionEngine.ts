import type { RichFormatAction } from '../components/RichTextToolbar.tsx';
import { normalizeStoredRichText } from './richTextHtmlCodec.ts';

export interface CrossLineTextRange {
  anchorLine: number;
  anchorOffset: number;
  focusLine: number;
  focusOffset: number;
  startLine: number;
  startOffset: number;
  endLine: number;
  endOffset: number;
}

export interface LinePrefixSplit {
  prefix: string;
  body: string;
  isEmbed: boolean;
  isTask: boolean;
  isChecked: boolean;
  isHeading: boolean;
  isBullet: boolean;
}

export interface CharStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  color?: string;
  bg?: string;
  size?: string;
  wiki?: string;
}

export interface RichChar {
  char: string;
  style: CharStyle;
}

const EMBED_LINE_REGEX = /^\[embed:(sketch|attachment|link):([^\]]+)\]$/i;

/**
 * Normalizes anchor and focus coordinates into document-ordered start and end coordinates.
 */
export function createCrossLineRange(
  anchorLine: number,
  anchorOffset: number,
  focusLine: number,
  focusOffset: number
): CrossLineTextRange {
  const safeAnchorLine = Math.max(0, anchorLine);
  const safeAnchorOffset = Math.max(0, anchorOffset);
  const safeFocusLine = Math.max(0, focusLine);
  const safeFocusOffset = Math.max(0, focusOffset);

  const isForward =
    safeAnchorLine < safeFocusLine ||
    (safeAnchorLine === safeFocusLine && safeAnchorOffset <= safeFocusOffset);

  return {
    anchorLine: safeAnchorLine,
    anchorOffset: safeAnchorOffset,
    focusLine: safeFocusLine,
    focusOffset: safeFocusOffset,
    startLine: isForward ? safeAnchorLine : safeFocusLine,
    startOffset: isForward ? safeAnchorOffset : safeFocusOffset,
    endLine: isForward ? safeFocusLine : safeAnchorLine,
    endOffset: isForward ? safeFocusOffset : safeAnchorOffset,
  };
}

/**
 * Separates a raw note line into its structural markdown prefix (task, heading, bullet) and its rich-text body.
 */
export function splitLinePrefix(rawLine: string): LinePrefixSplit {
  const line = rawLine ?? '';
  if (EMBED_LINE_REGEX.test(line.trim())) {
    return {
      prefix: '',
      body: line,
      isEmbed: true,
      isTask: false,
      isChecked: false,
      isHeading: false,
      isBullet: false,
    };
  }

  const taskMatch = line.match(/^(\s*[-*]\s+)\[([ xX])\]\s*(.*)$/);
  if (taskMatch) {
    return {
      prefix: `${taskMatch[1]}[${taskMatch[2]}] `,
      body: taskMatch[3],
      isEmbed: false,
      isTask: true,
      isChecked: taskMatch[2].toLowerCase() === 'x',
      isHeading: false,
      isBullet: false,
    };
  }

  const h1Match = line.match(/^#\s+(.*)$/);
  if (h1Match) {
    return {
      prefix: '# ',
      body: h1Match[1],
      isEmbed: false,
      isTask: false,
      isChecked: false,
      isHeading: true,
      isBullet: false,
    };
  }

  const h2Match = line.match(/^##\s+(.*)$/);
  if (h2Match) {
    return {
      prefix: '## ',
      body: h2Match[1],
      isEmbed: false,
      isTask: false,
      isChecked: false,
      isHeading: true,
      isBullet: false,
    };
  }

  const h3Match = line.match(/^###\s+(.*)$/);
  if (h3Match) {
    return {
      prefix: '### ',
      body: h3Match[1],
      isEmbed: false,
      isTask: false,
      isChecked: false,
      isHeading: true,
      isBullet: false,
    };
  }

  const bulletMatch = line.match(/^(\s*[-*]\s+)(.*)$/);
  if (bulletMatch) {
    return {
      prefix: bulletMatch[1],
      body: bulletMatch[2],
      isEmbed: false,
      isTask: false,
      isChecked: false,
      isHeading: false,
      isBullet: true,
    };
  }

  return {
    prefix: '',
    body: line,
    isEmbed: false,
    isTask: false,
    isChecked: false,
    isHeading: false,
    isBullet: false,
  };
}

/**
 * Parses a stored rich-text body string into an array of visible characters with their active styles.
 */
export function parseStoredToRichChars(
  raw: string,
  inheritedStyle: CharStyle = {},
  depth = 0
): RichChar[] {
  if (!raw) return [];
  if (depth > 6) {
    return Array.from(raw).map((char) => ({ char, style: { ...inheritedStyle } }));
  }

  const result: RichChar[] = [];
  const tokenRegex =
    /(\[\[[^\]]+\]\]|`[^`]+`|\*\*[\s\S]*?\*\*|~~[\s\S]*?~~|<u>[\s\S]*?<\/u>|\[color=[^\]]+\][\s\S]*?\[\/color\]|\[bg=[^\]]+\][\s\S]*?\[\/bg\]|\[size=(?:sm|base|lg|xl|2xl|\d+(?:px)?)\][\s\S]*?\[\/size\]|\*[^*]+\*)/g;

  const parts = raw.split(tokenRegex);

  for (const part of parts) {
    if (!part) continue;

    if (part.startsWith('[[') && part.endsWith(']]')) {
      const wikiTitle = part.slice(2, -2).trim();
      for (const ch of Array.from(wikiTitle)) {
        result.push({ char: ch, style: { ...inheritedStyle, wiki: wikiTitle } });
      }
      continue;
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      const inner = part.slice(1, -1);
      for (const ch of Array.from(inner)) {
        result.push({ char: ch, style: { ...inheritedStyle, code: true } });
      }
      continue;
    }

    if (part.startsWith('**') && part.endsWith('**')) {
      result.push(
        ...parseStoredToRichChars(part.slice(2, -2), { ...inheritedStyle, bold: true }, depth + 1)
      );
      continue;
    }

    if (part.startsWith('~~') && part.endsWith('~~')) {
      result.push(
        ...parseStoredToRichChars(
          part.slice(2, -2),
          { ...inheritedStyle, strikethrough: true },
          depth + 1
        )
      );
      continue;
    }

    if (part.startsWith('<u>') && part.endsWith('</u>')) {
      result.push(
        ...parseStoredToRichChars(
          part.slice(3, -4),
          { ...inheritedStyle, underline: true },
          depth + 1
        )
      );
      continue;
    }

    const colorMatch = part.match(/^\[color=([^\]]+)\]([\s\S]*?)\[\/color\]$/i);
    if (colorMatch) {
      result.push(
        ...parseStoredToRichChars(
          colorMatch[2],
          { ...inheritedStyle, color: colorMatch[1].trim() },
          depth + 1
        )
      );
      continue;
    }

    const bgMatch = part.match(/^\[bg=([^\]]+)\]([\s\S]*?)\[\/bg\]$/i);
    if (bgMatch) {
      result.push(
        ...parseStoredToRichChars(
          bgMatch[2],
          { ...inheritedStyle, bg: bgMatch[1].trim() },
          depth + 1
        )
      );
      continue;
    }

    const sizeMatch = part.match(/^\[size=([^\]]+)\]([\s\S]*?)\[\/size\]$/i);
    if (sizeMatch) {
      result.push(
        ...parseStoredToRichChars(
          sizeMatch[2],
          { ...inheritedStyle, size: sizeMatch[1].trim() },
          depth + 1
        )
      );
      continue;
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      result.push(
        ...parseStoredToRichChars(part.slice(1, -1), { ...inheritedStyle, italic: true }, depth + 1)
      );
      continue;
    }

    const cleanPlain = part
      .replace(/\[\/?(?:color|bg|size)(?:=[^\]]+)?\]/gi, '')
      .replace(/<\/?u>/gi, '');

    for (const ch of Array.from(cleanPlain)) {
      result.push({ char: ch, style: { ...inheritedStyle } });
    }
  }

  return result;
}

function stylesEqual(a: CharStyle, b: CharStyle): boolean {
  return (
    Boolean(a.bold) === Boolean(b.bold) &&
    Boolean(a.italic) === Boolean(b.italic) &&
    Boolean(a.underline) === Boolean(b.underline) &&
    Boolean(a.strikethrough) === Boolean(b.strikethrough) &&
    Boolean(a.code) === Boolean(b.code) &&
    (a.color || undefined) === (b.color || undefined) &&
    (a.bg || undefined) === (b.bg || undefined) &&
    (a.size || undefined) === (b.size || undefined) &&
    (a.wiki || undefined) === (b.wiki || undefined)
  );
}

function wrapSegmentWithStyle(text: string, style: CharStyle): string {
  if (!text) return '';
  if (style.wiki) {
    return `[[${ text }]]`;
  }
  if (style.code) {
    return `\`${text}\``;
  }

  let out = text;
  if (style.bold) out = `**${out}**`;
  if (style.italic) out = `*${out}*`;
  if (style.underline) out = `<u>${out}</u>`;
  if (style.strikethrough) out = `~~${out}~~`;
  if (style.size && style.size !== 'base') out = `[size=${style.size}]${out}[/size]`;
  if (style.bg) out = `[bg=${style.bg}]${out}[/bg]`;
  if (style.color) out = `[color=${style.color}]${out}[/color]`;
  return out;
}

/**
 * Serializes an array of RichChar back into UDo's stored rich-text syntax, grouping contiguous runs.
 */
export function serializeRichCharsToStored(chars: RichChar[]): string {
  if (!chars || chars.length === 0) return '';

  let result = '';
  let runText = chars[0].char;
  let runStyle = chars[0].style;

  for (let i = 1; i < chars.length; i++) {
    const c = chars[i];
    if (stylesEqual(c.style, runStyle)) {
      runText += c.char;
    } else {
      result += wrapSegmentWithStyle(runText, runStyle);
      runText = c.char;
      runStyle = c.style;
    }
  }
  result += wrapSegmentWithStyle(runText, runStyle);

  return normalizeStoredRichText(result);
}

/**
 * Returns the visible plain-text length of a raw line's body (excluding prefix and rich-text tags).
 */
export function getVisibleLineLength(rawLine: string): number {
  const { body, isEmbed } = splitLinePrefix(rawLine);
  if (isEmbed) return 0;
  return parseStoredToRichChars(body).length;
}

/**
 * Slices a stored rich-text body string by visible character offsets [startOffset, endOffset)
 * while preserving and properly closing/reopening any active rich-text tags.
 */
export function sliceStoredByVisualOffsets(
  bodyStored: string,
  startOffset: number,
  endOffset?: number
): string {
  const chars = parseStoredToRichChars(bodyStored);
  const s = Math.max(0, Math.min(startOffset, chars.length));
  const e = endOffset === undefined ? chars.length : Math.max(s, Math.min(endOffset, chars.length));
  return serializeRichCharsToStored(chars.slice(s, e));
}

/**
 * Splits a stored rich-text body string at a single visible character offset.
 */
export function splitStoredAtVisualOffset(
  bodyStored: string,
  offset: number
): { before: string; after: string } {
  const chars = parseStoredToRichChars(bodyStored);
  const clamped = Math.max(0, Math.min(offset, chars.length));
  return {
    before: serializeRichCharsToStored(chars.slice(0, clamped)),
    after: serializeRichCharsToStored(chars.slice(clamped)),
  };
}

/**
 * Computes the [start, end) visible character slice for a specific line inside a CrossLineTextRange.
 * Returns undefined if the line is not part of the range or if the slice is empty.
 */
export function getLineSelectionSlice(
  lineIndex: number,
  lineVisibleLength: number,
  range: CrossLineTextRange | null
): { start: number; end: number } | undefined {
  if (!range) return undefined;
  if (lineIndex < range.startLine || lineIndex > range.endLine) return undefined;

  const start = lineIndex === range.startLine ? Math.min(range.startOffset, lineVisibleLength) : 0;
  const end =
    lineIndex === range.endLine
      ? Math.min(range.endOffset, lineVisibleLength)
      : lineVisibleLength;

  if (end < start) return undefined;
  return { start, end };
}

/**
 * Applies a RichFormatAction only to the exact character subrange specified by `range` across multiple lines.
 * Unselected characters at the beginning of `startLine` and at the end of `endLine` remain completely untouched.
 */
export function applyFormatToCrossLineRange(
  lines: string[],
  range: CrossLineTextRange,
  action: RichFormatAction
): { lines: string[]; range: CrossLineTextRange } {
  const nextLines = [...lines];
  const startLine = Math.max(0, Math.min(range.startLine, nextLines.length - 1));
  const endLine = Math.max(startLine, Math.min(range.endLine, nextLines.length - 1));

  // Collect all selected non-whitespace characters across the range to determine toggle state
  const selectedSampleChars: RichChar[] = [];
  for (let i = startLine; i <= endLine; i++) {
    const { body, isEmbed } = splitLinePrefix(nextLines[i]);
    if (isEmbed) continue;
    const chars = parseStoredToRichChars(body);
    const localStart = i === startLine ? Math.max(0, Math.min(range.startOffset, chars.length)) : 0;
    const localEnd =
      i === endLine ? Math.max(localStart, Math.min(range.endOffset, chars.length)) : chars.length;

    for (let k = localStart; k < localEnd; k++) {
      if (chars[k].char.trim().length > 0) {
        selectedSampleChars.push(chars[k]);
      }
    }
  }

  const allBold =
    selectedSampleChars.length > 0 && selectedSampleChars.every((c) => Boolean(c.style.bold));
  const allItalic =
    selectedSampleChars.length > 0 && selectedSampleChars.every((c) => Boolean(c.style.italic));
  const allUnderline =
    selectedSampleChars.length > 0 && selectedSampleChars.every((c) => Boolean(c.style.underline));
  const allStrike =
    selectedSampleChars.length > 0 &&
    selectedSampleChars.every((c) => Boolean(c.style.strikethrough));

  for (let i = startLine; i <= endLine; i++) {
    const { prefix, body, isEmbed } = splitLinePrefix(nextLines[i]);
    if (isEmbed) continue;

    const chars = parseStoredToRichChars(body);
    if (chars.length === 0) continue;

    const localStart = i === startLine ? Math.max(0, Math.min(range.startOffset, chars.length)) : 0;
    const localEnd =
      i === endLine ? Math.max(localStart, Math.min(range.endOffset, chars.length)) : chars.length;

    if (localEnd <= localStart) continue;

    for (let k = localStart; k < localEnd; k++) {
      const st: CharStyle = { ...chars[k].style };
      switch (action.type) {
        case 'bold':
          st.bold = !allBold;
          break;
        case 'italic':
          st.italic = !allItalic;
          break;
        case 'underline':
          st.underline = !allUnderline;
          break;
        case 'strikethrough':
          st.strikethrough = !allStrike;
          break;
        case 'color':
          st.color = action.hex || undefined;
          break;
        case 'bg':
          st.bg = action.hex || undefined;
          break;
        case 'size':
          st.size = action.size && action.size !== 'base' ? action.size : undefined;
          break;
        case 'clear':
          delete st.bold;
          delete st.italic;
          delete st.underline;
          delete st.strikethrough;
          delete st.code;
          delete st.color;
          delete st.bg;
          delete st.size;
          break;
      }
      chars[k] = { char: chars[k].char, style: st };
    }

    const updatedBody = serializeRichCharsToStored(chars);
    nextLines[i] = `${prefix}${updatedBody}`;
  }

  return { lines: nextLines, range };
}

/**
 * Deletes the selected character subrange across lines (or replaces it with `replacementText`),
 * merging the unselected prefix of `startLine` with the unselected suffix of `endLine`.
 */
export function deleteOrReplaceCrossLineRange(
  lines: string[],
  range: CrossLineTextRange,
  replacementText = ''
): { lines: string[]; cursorLine: number; cursorOffset: number } {
  if (lines.length === 0) {
    return { lines: [replacementText], cursorLine: 0, cursorOffset: replacementText.length };
  }

  const startLine = Math.max(0, Math.min(range.startLine, lines.length - 1));
  const endLine = Math.max(startLine, Math.min(range.endLine, lines.length - 1));

  const startSplit = splitLinePrefix(lines[startLine]);
  const endSplit = splitLinePrefix(lines[endLine]);

  const startChars = startSplit.isEmbed ? [] : parseStoredToRichChars(startSplit.body);
  const endChars = endSplit.isEmbed ? [] : parseStoredToRichChars(endSplit.body);

  const clampedStartOffset = Math.max(0, Math.min(range.startOffset, startChars.length));
  const clampedEndOffset = Math.max(0, Math.min(range.endOffset, endChars.length));

  const beforeChars = startChars.slice(0, clampedStartOffset);
  const afterChars = endChars.slice(clampedEndOffset);

  const beforeStored = serializeRichCharsToStored(beforeChars);
  const afterStored = serializeRichCharsToStored(afterChars);

  const normalizedReplacement = replacementText.replace(/\r\n?/g, '\n');
  const repLines = normalizedReplacement.split('\n');

  const nextLines = [...lines];

  if (repLines.length === 1) {
    const mergedBody = normalizeStoredRichText(`${beforeStored}${repLines[0]}${afterStored}`);
    const mergedFull = `${startSplit.prefix}${mergedBody}`;
    nextLines.splice(startLine, endLine - startLine + 1, mergedFull);
    return {
      lines: nextLines,
      cursorLine: startLine,
      cursorOffset: beforeChars.length + Array.from(repLines[0]).length,
    };
  }

  const firstLineFull = `${startSplit.prefix}${normalizeStoredRichText(`${beforeStored}${repLines[0]}`)}`;
  const middleLines = repLines.slice(1, -1);
  const lastRepLine = repLines[repLines.length - 1];
  const lastLineFull = normalizeStoredRichText(`${lastRepLine}${afterStored}`);

  nextLines.splice(startLine, endLine - startLine + 1, firstLineFull, ...middleLines, lastLineFull);

  return {
    lines: nextLines,
    cursorLine: startLine + repLines.length - 1,
    cursorOffset: Array.from(lastRepLine).length,
  };
}

/**
 * Extracts the exact plain text within `range` across multiple lines (for Copy / Cut operations).
 */
export function extractPlainTextFromCrossLineRange(
  lines: string[],
  range: CrossLineTextRange
): string {
  if (lines.length === 0) return '';
  const startLine = Math.max(0, Math.min(range.startLine, lines.length - 1));
  const endLine = Math.max(startLine, Math.min(range.endLine, lines.length - 1));

  const extractedLines: string[] = [];

  for (let i = startLine; i <= endLine; i++) {
    const { body, isEmbed } = splitLinePrefix(lines[i]);
    if (isEmbed) continue;
    const chars = parseStoredToRichChars(body);
    const localStart = i === startLine ? Math.max(0, Math.min(range.startOffset, chars.length)) : 0;
    const localEnd =
      i === endLine ? Math.max(localStart, Math.min(range.endOffset, chars.length)) : chars.length;

    const segmentText = chars
      .slice(localStart, localEnd)
      .map((c) => c.char)
      .join('');
    extractedLines.push(segmentText);
  }

  return extractedLines.join('\n');
}

function findNextWordOffset(text: string, fromOffset: number): number {
  const chars = Array.from(text);
  let i = Math.max(0, Math.min(fromOffset, chars.length));
  // Skip any initial whitespace/punctuation, then consume word characters
  while (i < chars.length && /\s/.test(chars[i])) i++;
  if (i < chars.length && /[^\w\u00C0-\u024F\s]/.test(chars[i])) {
    while (i < chars.length && /[^\w\u00C0-\u024F\s]/.test(chars[i])) i++;
    return i;
  }
  while (i < chars.length && /[\w\u00C0-\u024F]/.test(chars[i])) i++;
  return i;
}

function findPrevWordOffset(text: string, fromOffset: number): number {
  const chars = Array.from(text);
  let i = Math.max(0, Math.min(fromOffset, chars.length));
  while (i > 0 && /\s/.test(chars[i - 1])) i--;
  if (i > 0 && /[^\w\u00C0-\u024F\s]/.test(chars[i - 1])) {
    while (i > 0 && /[^\w\u00C0-\u024F\s]/.test(chars[i - 1])) i--;
    return i;
  }
  while (i > 0 && /[\w\u00C0-\u024F]/.test(chars[i - 1])) i--;
  return i;
}

function getLinePlainText(rawLine: string): string {
  const { body, isEmbed } = splitLinePrefix(rawLine);
  if (isEmbed) return '';
  return parseStoredToRichChars(body)
    .map((c) => c.char)
    .join('');
}

/**
 * Extends or shrinks a CrossLineTextRange via keyboard navigation (Shift + Arrows, with optional Ctrl/Cmd word jump).
 */
export function extendCrossLineRangeByKey(
  lines: string[],
  currentRange: CrossLineTextRange,
  dir: 'left' | 'right' | 'up' | 'down',
  byWord = false
): CrossLineTextRange {
  if (lines.length === 0) return currentRange;

  const { anchorLine, anchorOffset } = currentRange;
  let { focusLine, focusOffset } = currentRange;
  focusLine = Math.max(0, Math.min(focusLine, lines.length - 1));
  const currentText = getLinePlainText(lines[focusLine]);
  const currentLen = Array.from(currentText).length;
  focusOffset = Math.max(0, Math.min(focusOffset, currentLen));

  if (dir === 'right') {
    if (focusOffset < currentLen) {
      focusOffset = byWord ? findNextWordOffset(currentText, focusOffset) : focusOffset + 1;
    } else {
      let step = focusLine + 1;
      while (step < lines.length && splitLinePrefix(lines[step]).isEmbed) {
        step++;
      }
      if (step < lines.length) {
        focusLine = step;
        const nextText = getLinePlainText(lines[step]);
        const nextLen = Array.from(nextText).length;
        focusOffset = byWord
          ? findNextWordOffset(nextText, 0)
          : Math.min(1, nextLen);
      }
    }
  } else if (dir === 'left') {
    if (focusOffset > 0) {
      focusOffset = byWord ? findPrevWordOffset(currentText, focusOffset) : focusOffset - 1;
    } else {
      let step = focusLine - 1;
      while (step >= 0 && splitLinePrefix(lines[step]).isEmbed) {
        step--;
      }
      if (step >= 0) {
        focusLine = step;
        const prevText = getLinePlainText(lines[step]);
        const prevLen = Array.from(prevText).length;
        focusOffset = byWord
          ? findPrevWordOffset(prevText, prevLen)
          : Math.max(0, prevLen - 1);
      }
    }
  } else if (dir === 'down') {
    let step = focusLine + 1;
    while (step < lines.length && splitLinePrefix(lines[step]).isEmbed) {
      step++;
    }
    if (step < lines.length) {
      focusLine = step;
      const nextText = getLinePlainText(lines[step]);
      const nextLen = Array.from(nextText).length;
      // If starting at offset 0 of anchorLine and pressing Shift+Down, select at least full anchorLine or matching column
      if (currentRange.focusLine === anchorLine && anchorOffset === 0 && focusOffset === 0) {
        focusOffset = nextLen > 0 ? Math.min(anchorOffset, nextLen) : 0;
        if (focusOffset === 0 && currentLen > 0) {
          focusOffset = 0;
        }
      } else {
        focusOffset = Math.min(focusOffset, nextLen);
      }
    } else {
      focusOffset = currentLen;
    }
  } else if (dir === 'up') {
    let step = focusLine - 1;
    while (step >= 0 && splitLinePrefix(lines[step]).isEmbed) {
      step--;
    }
    if (step >= 0) {
      focusLine = step;
      const prevText = getLinePlainText(lines[step]);
      const prevLen = Array.from(prevText).length;
      focusOffset = Math.min(focusOffset, prevLen);
    } else {
      focusOffset = 0;
    }
  }

  return createCrossLineRange(anchorLine, anchorOffset, focusLine, focusOffset);
}

