import { useCallback } from 'react';
import { NoteItem } from '../../../shared/types';
import { playTaskCompleteSound } from '../../../shared/utils/soundEffects';
import { useTranslation } from 'react-i18next';

interface Props {
  note: NoteItem;
  localContent: string;
  viewMode: 'preview' | 'edit';
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onContentChange: (content: string) => void;
  onUpdateNote: (note: NoteItem) => void;
}

export function useNoteTaskActions({
  note,
  localContent,
  viewMode,
  textareaRef,
  onContentChange,
  onUpdateNote,
}: Props) {
  const { t } = useTranslation();

  const handleInsertTask = useCallback(() => {
    const taskPrefix = '- [ ] ';
    let newContent = '';

    if (viewMode === 'edit' && textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = localContent.substring(0, start);
      const after = localContent.substring(end);
      const needsNewline = before.length > 0 && !before.endsWith('\n');
      newContent = `${before}${needsNewline ? '\n' : ''}${taskPrefix}${after}`;
    } else {
      const needsNewline = localContent.length > 0 && !localContent.endsWith('\n');
      newContent = `${localContent}${needsNewline ? '\n' : ''}${taskPrefix}${t('note.newTask')}`;
    }

    onContentChange(newContent);
    onUpdateNote({ ...note, content: newContent, updatedAt: new Date().toISOString() });
  }, [viewMode, textareaRef, localContent, onContentChange, onUpdateNote, note, t]);

  const handleToggleCheckbox = useCallback(
    (targetLineIdx: number) => {
      const lines = localContent.split('\n');
      const targetLine = lines[targetLineIdx];
      if (targetLine === undefined) return;

      const match = targetLine.match(/^(\s*[-*]\s+\[)( |x|X)(\])(.*)$/);
      if (match) {
        const isCurrentlyChecked = match[2].toLowerCase() === 'x';
        const newChar = isCurrentlyChecked ? ' ' : 'x';
        if (!isCurrentlyChecked) playTaskCompleteSound();
        lines[targetLineIdx] = `${match[1]}${newChar}${match[3]}${match[4]}`;
        const updatedText = lines.join('\n');
        onContentChange(updatedText);
        onUpdateNote({ ...note, content: updatedText, updatedAt: new Date().toISOString() });
      }
    },
    [localContent, onContentChange, onUpdateNote, note]
  );

  return {
    handleInsertTask,
    handleToggleCheckbox,
  };
}
