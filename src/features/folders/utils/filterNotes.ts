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
        const matchTitle = normalizeDiacritics(n.title).includes(query);
        const matchContent = normalizeDiacritics(n.content).includes(query);
        const matchTags = n.tags.some((tag) => normalizeDiacritics(tag).includes(query));
        if (!matchTitle && !matchContent && !matchTags) return false;
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
