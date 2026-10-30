const SIZE_CLASS_MAP: Record<string, string> = {
  sm: 'text-xs',
  base: 'text-sm',
  lg: 'text-lg font-medium',
  xl: 'text-xl font-semibold',
  '2xl': 'text-2xl font-bold',
};

const INLINE_TOKEN_REGEX =
  /(\[\[[^\]]+\]\]|`[^`]+`|\*\*[\s\S]*?\*\*|~~[\s\S]*?~~|<u>[\s\S]*?<\/u>|\[color=[^\]]+\][\s\S]*?\[\/color\]|\[bg=[^\]]+\][\s\S]*?\[\/bg\]|\[size=(?:sm|base|lg|xl|2xl|\d+(?:px)?)\][\s\S]*?\[\/size\]|\*[^*]+\*)/g;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Converts stored rich text markup ([color=...], [bg=...], [size=...], **, *, <u>, ~~, `, [[Wiki]])
 * into clean visual HTML spans so that raw brackets/tags are NEVER displayed in editors.
 */
export function storedToVisualHtml(raw: string, depth = 0): string {
  if (!raw) return '';
  if (depth > 6) return escapeHtml(raw);

  // Strip stray unclosed tags so raw markup never leaks visually
  const cleaned =
    depth === 0
      ? raw
          .replace(/\[\/?(?:color|bg|size)(?:=[^\]]+)?\](?![\s\S]*\[\/(?:color|bg|size)\])/gi, (m) => {
            // Only strip if it wasn't matched as a balanced pair below
            return m;
          })
      : raw;

  const parts = cleaned.split(INLINE_TOKEN_REGEX);
  const rendered = parts
    .map((part) => {
      if (!part) return '';

      if (part.startsWith('[[') && part.endsWith(']]')) {
        const wikiTitle = escapeHtml(part.slice(2, -2).trim());
        return `<span data-wiki="${wikiTitle}" class="inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded bg-theme-accent/20 text-theme-accent border border-theme-accent/40 text-xs font-medium">${wikiTitle}</span>`;
      }

      if (part.startsWith('`') && part.endsWith('`')) {
        return `<code class="px-1 py-0.5 mx-0.5 rounded bg-theme-column font-mono text-xs text-theme-accent border border-white/[0.05]">${escapeHtml(
          part.slice(1, -1)
        )}</code>`;
      }

      if (part.startsWith('**') && part.endsWith('**')) {
        return `<strong class="font-bold">${storedToVisualHtml(part.slice(2, -2), depth + 1)}</strong>`;
      }

      if (part.startsWith('~~') && part.endsWith('~~')) {
        return `<del class="line-through opacity-80">${storedToVisualHtml(part.slice(2, -2), depth + 1)}</del>`;
      }

      if (part.startsWith('<u>') && part.endsWith('</u>')) {
        return `<u class="underline underline-offset-2">${storedToVisualHtml(part.slice(3, -4), depth + 1)}</u>`;
      }

      const colorMatch = part.match(/^\[color=([^\]]+)\]([\s\S]*?)\[\/color\]$/i);
      if (colorMatch) {
        const hex = escapeHtml(colorMatch[1].trim());
        return `<span data-rt-color="${hex}" style="color:${hex}">${storedToVisualHtml(
          colorMatch[2],
          depth + 1
        )}</span>`;
      }

      const bgMatch = part.match(/^\[bg=([^\]]+)\]([\s\S]*?)\[\/bg\]$/i);
      if (bgMatch) {
        const hex = escapeHtml(bgMatch[1].trim());
        const bgRgba = hex.startsWith('#') && hex.length === 7 ? `${hex}38` : 'rgba(255, 201, 95, 0.28)';
        return `<mark data-rt-bg="${hex}" style="background-color:${bgRgba};border-bottom:2px solid ${hex};padding:0 3px;border-radius:4px;color:inherit">${storedToVisualHtml(
          bgMatch[2],
          depth + 1
        )}</mark>`;
      }

      const sizeMatch = part.match(/^\[size=([^\]]+)\]([\s\S]*?)\[\/size\]$/i);
      if (sizeMatch) {
        const sz = escapeHtml(sizeMatch[1].trim());
        const numPx = Number(sz.replace(/px$/i, ''));
        if (!isNaN(numPx) && numPx >= 8 && numPx <= 96) {
          return `<span data-rt-size="${numPx}" style="font-size:${numPx}px;line-height:1.35">${storedToVisualHtml(
            sizeMatch[2],
            depth + 1
          )}</span>`;
        }
        const cls = SIZE_CLASS_MAP[sz] || 'text-base';
        return `<span data-rt-size="${sz}" class="${cls}">${storedToVisualHtml(
          sizeMatch[2],
          depth + 1
        )}</span>`;
      }

      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return `<em class="italic">${storedToVisualHtml(part.slice(1, -1), depth + 1)}</em>`;
      }

      // Clean any orphan raw tags in plain text segment
      const withoutOrphans = part
        .replace(/\[\/?(?:color|bg|size)(?:=[^\]]+)?\]/gi, '')
        .replace(/<\/?u>/gi, '');
      return escapeHtml(withoutOrphans);
    })
    .join('');

  return rendered;
}

function rgbToHex(rgb: string): string {
  if (!rgb) return '';
  if (rgb.startsWith('#')) return rgb;
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return rgb;
  const r = Number(m[1]).toString(16).padStart(2, '0');
  const g = Number(m[2]).toString(16).padStart(2, '0');
  const b = Number(m[3]).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

/**
 * Serializes a contentEditable DOM tree back into stored rich text tokens
 * compatible with SQLite FTS5 and existing UDo note format.
 */
export function visualHtmlToStored(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent || '').replace(/\u00A0/g, ' ');
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  if (tag === 'br') return '';

  const wiki = el.getAttribute('data-wiki');
  if (wiki) {
    return `[[${wiki}]]`;
  }

  let inner = '';
  el.childNodes.forEach((child) => {
    inner += visualHtmlToStored(child);
  });

  if (!inner) return '';

  if (tag === 'code') return `\`${inner}\``;
  if (tag === 'strong' || tag === 'b' || el.style.fontWeight === 'bold' || Number(el.style.fontWeight) >= 600) {
    inner = `**${inner}**`;
  }
  if (tag === 'em' || tag === 'i' || el.style.fontStyle === 'italic') {
    inner = `*${inner}*`;
  }
  if (tag === 'u' || el.style.textDecoration?.includes('underline')) {
    inner = `<u>${inner}</u>`;
  }
  if (tag === 'del' || tag === 's' || tag === 'strike' || el.style.textDecoration?.includes('line-through')) {
    inner = `~~${inner}~~`;
  }

  const rtSize = el.getAttribute('data-rt-size');
  if (rtSize && rtSize !== 'base') {
    inner = `[size=${rtSize}]${inner}[/size]`;
  }

  const rtBg = el.getAttribute('data-rt-bg');
  if (rtBg) {
    inner = `[bg=${rtBg}]${inner}[/bg]`;
  }

  const rtColor = el.getAttribute('data-rt-color') || (tag === 'font' ? el.getAttribute('color') : null) || (el.style.color ? rgbToHex(el.style.color) : null);
  if (rtColor) {
    inner = `[color=${rtColor}]${inner}[/color]`;
  }

  return inner;
}

/**
 * Strips all rich text tokens for plain text search or previews.
 */
export function storedToPlainText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\[embed:[^\]]+\]/gi, '')
    .replace(/\[\/?(?:color|bg|size)(?:=[^\]]+)?\]/gi, '')
    .replace(/<\/?u>/gi, '')
    .replace(/~~/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/\[\[([^\]]+)\]\]/g, '$1');
}
