import { useMemo } from 'react';
import { FolderItem, NoteItem, ViewFilter } from '../types';
import { ColumnIndex } from './useKeyboardShortcuts';
import { normalizeDiacritics } from '../utils/diacritics';

export type TreeNode =
  | { type: 'folder'; id: string }
  | { type: 'note'; id: string; folderId: string };

interface UseTreeNavigationProps {
  activeColumn: ColumnIndex;
  subjects: Array<{ id: string }>;
  selectedSubjectId: string;
  currentSubjectFolders: FolderItem[];
  notes: NoteItem[];
  searchQuery: string;
  filter: ViewFilter;
  activeTagFilter: string | null;
  selectedFolderId: string;
  selectedNoteId: string;
  setSelectedSubjectId: (id: string) => void;
  setSelectedFolderId: (id: string) => void;
  setSelectedNoteId: (id: string) => void;
  handleToggleFolderExpand: (id: string) => void;
  setActiveColumn: (col: ColumnIndex) => void;
}

export function useTreeNavigation({
  activeColumn,
  subjects,
  selectedSubjectId,
  currentSubjectFolders,
  notes,
  searchQuery,
  filter,
  activeTagFilter,
  selectedFolderId,
  selectedNoteId,
  setSelectedSubjectId,
  setSelectedFolderId,
  setSelectedNoteId,
  handleToggleFolderExpand,
  setActiveColumn,
}: UseTreeNavigationProps) {
  // Navigable tree items in Column 2 (folders and visible notes)
  const treeNodes = useMemo(() => {
    const nodes: TreeNode[] = [];
    const normQuery = normalizeDiacritics(searchQuery.trim());
    const normActiveTag = activeTagFilter ? normalizeDiacritics(activeTagFilter) : null;

    currentSubjectFolders.forEach((folder) => {
      nodes.push({ type: 'folder', id: folder.id });

      if (folder.isExpanded) {
        const folderNotes = notes.filter((n) => n.folderId === folder.id);
        const visibleNotes = folderNotes
          .filter((n) => {
            if (filter === 'pending' && n.isCompleted) return false;
            if (filter === 'completed' && !n.isCompleted) return false;
            if (
              normActiveTag &&
              !n.tags.some((tag) => normalizeDiacritics(tag) === normActiveTag)
            ) {
              return false;
            }
            if (normQuery) {
              const matchTitle = normalizeDiacritics(n.title).includes(normQuery);
              const matchContent = normalizeDiacritics(n.content).includes(normQuery);
              const matchTags = n.tags.some((tag) =>
                normalizeDiacritics(tag).includes(normQuery)
              );
              if (!matchTitle && !matchContent && !matchTags) return false;
            }
            return true;
          })
          .sort((a, b) => Number(b.isPinned) - Number(a.isPinned));

        visibleNotes.forEach((n) => {
          nodes.push({ type: 'note', id: n.id, folderId: folder.id });
        });
      }
    });

    return nodes;
  }, [currentSubjectFolders, notes, searchQuery, filter, activeTagFilter]);

  // Keyboard vertical navigation (j/k or ArrowDown/ArrowUp)
  const handleVerticalNavigate = (direction: 'up' | 'down') => {
    if (activeColumn === 1) {
      const curIdx = subjects.findIndex((s) => s.id === selectedSubjectId);
      const nextIdx =
        direction === 'down'
          ? Math.min(subjects.length - 1, curIdx + 1)
          : Math.max(0, curIdx - 1);
      if (subjects[nextIdx]) {
        setSelectedSubjectId(subjects[nextIdx].id);
      }
    } else if (activeColumn === 2) {
      if (treeNodes.length === 0) return;

      let curIdx = -1;
      if (selectedNoteId) {
        curIdx = treeNodes.findIndex((n) => n.type === 'note' && n.id === selectedNoteId);
      }
      if (curIdx === -1 && selectedFolderId) {
        curIdx = treeNodes.findIndex((n) => n.type === 'folder' && n.id === selectedFolderId);
      }

      const nextIdx =
        curIdx === -1
          ? 0
          : direction === 'down'
          ? Math.min(treeNodes.length - 1, curIdx + 1)
          : Math.max(0, curIdx - 1);

      const target = treeNodes[nextIdx];
      if (target.type === 'folder') {
        setSelectedFolderId(target.id);
        setSelectedNoteId('');
      } else {
        setSelectedNoteId(target.id);
        setSelectedFolderId(target.folderId);
      }
    }
  };

  // Horizontal Tree Navigation (ArrowRight = Expand, ArrowLeft = Collapse/Parent)
  const handleHorizontalNavigate = (direction: 'left' | 'right') => {
    if (activeColumn === 2 && selectedFolderId) {
      const folder = currentSubjectFolders.find((f) => f.id === selectedFolderId);
      if (direction === 'right' && folder && !folder.isExpanded) {
        handleToggleFolderExpand(folder.id);
      } else if (direction === 'left') {
        if (selectedNoteId) {
          setSelectedNoteId('');
        } else if (folder && folder.isExpanded) {
          handleToggleFolderExpand(folder.id);
        }
      }
    }
  };

  // Enter Key on Tree Item
  const handleEnterTreeItem = () => {
    if (activeColumn === 2) {
      if (selectedNoteId) {
        setActiveColumn(3);
      } else if (selectedFolderId) {
        handleToggleFolderExpand(selectedFolderId);
      }
    }
  };

  return {
    treeNodes,
    handleVerticalNavigate,
    handleHorizontalNavigate,
    handleEnterTreeItem,
  };
}
