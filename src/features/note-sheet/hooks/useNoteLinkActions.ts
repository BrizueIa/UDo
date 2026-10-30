import { useState, useCallback } from 'react';
import { NoteItem, LinkItem } from '../../../shared/types';

interface Props {
  note: NoteItem;
  onUpdateNote: (note: NoteItem) => void;
  onInsertEmbedToken?: (token: string) => string;
}

export function useNoteLinkActions({ note, onUpdateNote, onInsertEmbedToken }: Props) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const handleAddLink = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newLinkTitle || !newLinkUrl) return;
      const newLink: LinkItem = {
        id: `link-${Date.now()}`,
        title: newLinkTitle,
        url: newLinkUrl.startsWith('http') ? newLinkUrl : `https://${newLinkUrl}`,
      };
      const nextContent = onInsertEmbedToken
        ? onInsertEmbedToken(`[embed:link:${newLink.id}]`)
        : note.content;
      onUpdateNote({
        ...note,
        content: nextContent,
        links: [...note.links, newLink],
        updatedAt: new Date().toISOString(),
      });
      setNewLinkTitle('');
      setNewLinkUrl('');
      setShowLinkInput(false);
    },
    [note, onUpdateNote, onInsertEmbedToken, newLinkTitle, newLinkUrl]
  );

  const handleRemoveLink = useCallback(
    (linkId: string) => {
      const nextContent = (note.content || '')
        .split('\n')
        .filter((l) => l.trim() !== `[embed:link:${linkId}]`)
        .join('\n');
      onUpdateNote({
        ...note,
        content: nextContent,
        links: note.links.filter((l) => l.id !== linkId),
        updatedAt: new Date().toISOString(),
      });
    },
    [note, onUpdateNote]
  );

  return {
    showLinkInput,
    setShowLinkInput,
    newLinkTitle,
    setNewLinkTitle,
    newLinkUrl,
    setNewLinkUrl,
    handleAddLink,
    handleRemoveLink,
  };
}
