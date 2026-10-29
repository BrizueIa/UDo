import { NoteItem, ViewFilter } from '../../../shared/types';
import { normalizeDiacritics } from '../../../shared/utils/diacritics';
import {
  CAD_EXTENSIONS,
  IMAGE_EXTENSIONS,
  DOC_EXTENSIONS,
  SHEET_EXTENSIONS,
  CODE_EXTENSIONS,
  ARCHIVE_EXTENSIONS,
  AUDIO_EXTENSIONS,
} from '../../../shared/utils/fileAttachments';

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
            (a) => a.kind === 'audio' || AUDIO_EXTENSIONS.has(a.extension?.toLowerCase() || '')
          ) ?? false;
        }

        if (rawQuery === '.img' || rawQuery === '.image' || rawQuery === 'image') {
          return n.attachments?.some((a) => IMAGE_EXTENSIONS.has(a.extension?.toLowerCase() || '')) ?? false;
        }

        if (rawQuery === '.3d' || rawQuery === '.cad' || rawQuery === '3d') {
          return n.attachments?.some((a) => CAD_EXTENSIONS.has(a.extension?.toLowerCase() || '')) ?? false;
        }

        if (rawQuery === '.doc' || rawQuery === '.document' || rawQuery === 'doc') {
          return n.attachments?.some((a) => DOC_EXTENSIONS.has(a.extension?.toLowerCase() || '')) ?? false;
        }

        if (rawQuery === '.sheet' || rawQuery === 'sheet') {
          return n.attachments?.some((a) => SHEET_EXTENSIONS.has(a.extension?.toLowerCase() || '')) ?? false;
        }

        if (rawQuery === '.code' || rawQuery === 'code') {
          return n.attachments?.some((a) => CODE_EXTENSIONS.has(a.extension?.toLowerCase() || '')) ?? false;
        }

        if (rawQuery === '.archive' || rawQuery === '.zip' || rawQuery === 'archive') {
          return n.attachments?.some((a) => ARCHIVE_EXTENSIONS.has(a.extension?.toLowerCase() || '')) ?? false;
        }

        if (rawQuery.startsWith('.') && extCandidate.length >= 1) {
          return n.attachments?.some(
            (a) =>
              a.extension?.toLowerCase() === extCandidate ||
              a.name?.toLowerCase().endsWith(`.${extCandidate}`)
          ) ?? false;
        }

        const tokens = query.split(/\s+/).filter(Boolean);
        const titleNorm = normalizeDiacritics(n.title);
        const contentNorm = normalizeDiacritics(n.content);
        const tagsNorm = n.tags.map((t) => normalizeDiacritics(t)).join(' ');
        const sketchesNorm = (n.sketches || []).map((s) => normalizeDiacritics(s.title || '')).join(' ');
        const attachmentsNorm = (n.attachments || []).map((a) => `${normalizeDiacritics(a.name || '')} ${normalizeDiacritics(a.extension || '')}`).join(' ');

        const searchable = `${titleNorm} ${contentNorm} ${tagsNorm} ${sketchesNorm} ${attachmentsNorm}`;
        if (!tokens.every((token) => searchable.includes(token))) {
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
