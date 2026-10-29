import React from 'react';
import { NoteItem, SubjectItem, FolderItem } from '../shared/types';
import { FocusTimerState } from '../shared/hooks/useFocusTimer';
import { FloatingWidget } from '../features/floating-widget/components/FloatingWidget';
import { useTranslation } from 'react-i18next';

interface Props {
  notes: NoteItem[];
  subjects: SubjectItem[];
  folders: FolderItem[];
  selectedSubjectId: string;
  selectedFolderId: string;
  timer: FocusTimerState;
  onSelectSubject: (id: string) => void;
  onSelectFolder: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onAddFolder: (name: string, subjectId: string) => FolderItem | null;
  onCreateNewNote: (folderId: string, title?: string, subjectId?: string) => void;
  onOpenNoteInFullApp: (noteId: string, subjectId: string, folderId: string) => void;
  onRestoreFullApp: () => void;
}

export const AppWidgetView: React.FC<Props> = ({
  notes,
  subjects,
  folders,
  selectedSubjectId,
  selectedFolderId,
  timer,
  onSelectSubject,
  onSelectFolder,
  onToggleComplete,
  onAddFolder,
  onCreateNewNote,
  onOpenNoteInFullApp,
  onRestoreFullApp,
}) => {
  const { t } = useTranslation();

  return (
    <div className="h-screen w-screen bg-transparent text-theme-text font-sans antialiased overflow-hidden flex flex-col">
      <FloatingWidget
        notes={notes}
        subjects={subjects}
        folders={folders}
        selectedSubjectId={selectedSubjectId}
        selectedFolderId={selectedFolderId}
        timer={timer}
        onSelectSubject={onSelectSubject}
        onSelectFolder={onSelectFolder}
        onToggleComplete={onToggleComplete}
        onQuickAddNote={(title, folderId, subjectId) => {
          const targetSubjId = subjectId || selectedSubjectId;
          let targetFolderId = folderId;
          if (!targetFolderId) {
            const existing = folders.find((f) => f.subjectId === targetSubjId);
            targetFolderId = existing
              ? existing.id
              : onAddFolder(t('folders.addFolder'), targetSubjId)?.id || '';
          }
          onCreateNewNote(targetFolderId, title, targetSubjId);
          if (targetSubjId) onSelectSubject(targetSubjId);
          if (targetFolderId) onSelectFolder(targetFolderId);
        }}
        onOpenNoteInFullApp={onOpenNoteInFullApp}
        onRestoreFullApp={onRestoreFullApp}
      />
    </div>
  );
};
