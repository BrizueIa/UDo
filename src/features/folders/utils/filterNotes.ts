import { NoteItem, ViewFilter } from '../../../shared/types';
import { normalizeDiacritics } from '../../../shared/utils/diacritics';

interface FilterOptions {
  notes: NoteItem[];
  filter: ViewFilter;
  searchQuery?: string;
  activeTagFilter?: string | null;
}

export function filterAndSortFolderNotes({
  notes,
  filter,
  searchQuery = '',
  activeTagFilter,
}: FilterOptions): NoteItem[] {
  const query = normalizeDiacritics(searchQuery.trim());
  const normActiveTag = activeTagFilter ? normalizeDiacritics(activeTagFilter) : null;
  const rawQuery = searchQuery.trim().toLowerCase();
  const extCandidate = rawQuery.startsWith('.') ? rawQuery.slice(1) : rawQuery;

  return notes
    .filter((n) => {
      // Status pill filter
      if (filter === 'pending' && n.isCompleted) return false;
      if (filter === 'completed' && !n.isCompleted) return false;

      // Active transversal tag filter (diacritic-insensitive)
      if (
        normActiveTag &&
        !n.tags.some((tag) => normalizeDiacritics(tag) === normActiveTag)
      ) {
        return false;
      }

      // Scoped search query filter (diacritic-insensitive)
      if (query) {
        if (rawQuery === '.canvas' || rawQuery === 'canvas' || rawQuery === '.sketch') {
          return (n.sketches && n.sketches.length > 0) ?? false;
        }

        if (rawQuery === '.audio' || rawQuery === 'audio') {
          return n.attachments?.some(
            (a) => a.kind === 'audio' || ['mp3', 'wav', 'webm', 'm4a', 'ogg'].includes(a.extension?.toLowerCase())
          ) ?? false;
        }

        if (rawQuery.startsWith('.') && extCandidate.length >= 2) {
          return n.attachments?.some(
            (a) =>
              a.extension?.toLowerCase() === extCandidate ||
              a.name?.toLowerCase().endsWith(`.${extCandidate}`)
          ) ?? false;
        }

        const matchTitle = normalizeDiacritics(n.title).includes(query);
        const matchContent = normalizeDiacritics(n.content).includes(query);
        const matchTags = n.tags.some((tag) => normalizeDiacritics(tag).includes(query));
        const matchAttachments = n.attachments?.some((a) =>
          normalizeDiacritics(a.name || '').includes(query) ||
          normalizeDiacritics(a.extension || '').includes(query)
        );
        const matchSketches = n.sketches?.some((s) =>
          normalizeDiacritics(s.title || '').includes(query)
        );

        if (!matchTitle && !matchContent && !matchTags && !matchAttachments && !matchSketches) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return Number(b.isPinned) - Number(a.isPinned);
      if (typeof a.order === 'number' && typeof b.order === 'number') {
        return a.order - b.order;
      }
      return 0;
    });
}
