/**
 * Diacritic-insensitive text utilities for resilient searching and highlighting.
 * Handles Spanish accents and other Latin diacritical marks (e.g. "Cálculo" ↔ "calculo").
 */

/**
 * Normalizes a string by stripping diacritical marks and converting to lowercase.
 */
export function normalizeDiacritics(str: string): string {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/**
 * Builds a RegExp matching a query where every vowel or diacritic-bearing character
 * matches all its accented/unaccented variants in both uppercase and lowercase.
 *
 * Example: "calculo" produces a regex matching "Cálculo", "calculo", "cálculo", etc.
 */
export function buildDiacriticRegex(query: string, flags: string = 'gi'): RegExp {
  const trimmed = query.trim();
  if (!trimmed) {
    return /(?:)/;
  }

  const charMap: Record<string, string> = {
    a: '[aáàâäãåAÁÀÂÄÃÅ]',
    e: '[eéèêëEÉÈÊË]',
    i: '[iíìîïIÍÌÎÏ]',
    o: '[oóòôöõOÓÒÔÖÕ]',
    u: '[uúùûüUÚÙÛÜ]',
    c: '[cçCÇ]',
    n: '[nñNÑ]',
    á: '[aáàâäãåAÁÀÂÄÃÅ]',
    é: '[eéèêëEÉÈÊË]',
    í: '[iíìîïIÍÌÎÏ]',
    ó: '[oóòôöõOÓÒÔÖÕ]',
    ú: '[uúùûüUÚÙÛÜ]',
    ñ: '[nñNÑ]',
  };

  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = escaped
    .split('')
    .map((ch) => {
      const lower = ch.toLowerCase();
      return charMap[lower] || ch;
    })
    .join('');

  return new RegExp(`(${pattern})`, flags);
}

/**
 * Counts the number of diacritic-insensitive matches of query inside content.
 */
export function countDiacriticMatches(content: string, query: string): number {
  if (!content || !query.trim()) return 0;
  try {
    const regex = buildDiacriticRegex(query, 'gi');
    const matches = content.match(regex);
    return matches ? matches.length : 0;
  } catch {
    return 0;
  }
}
