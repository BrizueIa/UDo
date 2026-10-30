import React from 'react';
import { SubjectItem, FolderItem } from '../../../shared/types';
import { ChevronDown, Folder as FolderIcon, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  subjects: SubjectItem[];
  projectFolders: FolderItem[];
  currentSubject?: SubjectItem;
  currentFolder?: FolderItem;
  activeSubjectId: string;
  activeFolderId: string;
  showSubjectMenu: boolean;
  showFolderMenu: boolean;
  subjectMenuRef: React.RefObject<HTMLDivElement>;
  folderMenuRef: React.RefObject<HTMLDivElement>;
  onToggleSubjectMenu: () => void;
  onToggleFolderMenu: () => void;
  onSelectSubject: (id: string) => void;
  onSelectFolder: (id: string) => void;
}

export const FloatingWidgetSelectors: React.FC<Props> = ({
  subjects,
  projectFolders,
  currentSubject,
  currentFolder,
  activeSubjectId,
  activeFolderId,
  showSubjectMenu,
  showFolderMenu,
  subjectMenuRef,
  folderMenuRef,
  onToggleSubjectMenu,
  onToggleFolderMenu,
  onSelectSubject,
  onSelectFolder,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center space-x-1.5 flex-1 min-w-0">
      {/* Project Dropdown */}
      <div className="relative shrink-0" ref={subjectMenuRef}>
        <button
          type="button"
          onClick={onToggleSubjectMenu}
          className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-theme-card border border-white/[0.06] hover:bg-theme-hover text-theme-text transition-colors cursor-pointer text-[11px]"
          title={t('widget.chooseProject')}
        >
          <span
            className="w-2 h-2 rounded-[3px] shrink-0"
            style={{ backgroundColor: currentSubject?.color || '#3b82f6' }}
          />
          <span className="truncate max-w-[85px] font-medium">{currentSubject?.name}</span>
          <ChevronDown size={10} className="text-theme-muted" />
        </button>

        {showSubjectMenu && (
          <div className="absolute top-full left-0 mt-1 w-40 bg-theme-card border border-white/[0.08] rounded-xl shadow-2xl py-1 z-40 max-h-40 overflow-y-auto">
            {subjects.filter((s) => !s.isPrivate).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectSubject(s.id)}
                className={`w-full text-left px-2.5 py-1 text-[11px] flex items-center justify-between hover:bg-theme-hover transition-colors ${
                  s.id === activeSubjectId ? 'text-theme-accent font-semibold' : 'text-theme-text'
                }`}
              >
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="w-2 h-2 rounded-[3px] shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="truncate">{s.name}</span>
                </div>
                {s.id === activeSubjectId && <Check size={11} />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Folder Dropdown */}
      <div className="relative flex-1 min-w-0" ref={folderMenuRef}>
        <button
          type="button"
          onClick={onToggleFolderMenu}
          className="w-full flex items-center space-x-1 px-2 py-0.5 rounded-md bg-theme-card border border-white/[0.06] hover:bg-theme-hover text-theme-text transition-colors cursor-pointer text-[11px]"
          title={t('widget.chooseFolder')}
        >
          <FolderIcon size={11} className="text-amber-400 shrink-0" />
          <span className="truncate flex-1 text-left">
            {currentFolder
              ? currentFolder.name
              : projectFolders.length === 0
              ? t('widget.noFolders')
              : t('widget.chooseFolder')}
          </span>
          <ChevronDown size={10} className="text-theme-muted shrink-0" />
        </button>

        {showFolderMenu && (
          <div className="absolute top-full left-0 mt-1 w-44 bg-theme-card border border-white/[0.08] rounded-xl shadow-2xl py-1 z-40 max-h-40 overflow-y-auto">
            {projectFolders.length === 0 ? (
              <div className="px-2.5 py-2 text-[11px] text-theme-muted text-center">
                {t('folders.empty')}
              </div>
            ) : (
              projectFolders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onSelectFolder(f.id)}
                  className={`w-full text-left px-2.5 py-1 text-[11px] flex items-center justify-between hover:bg-theme-hover transition-colors ${
                    f.id === activeFolderId ? 'text-theme-accent font-semibold' : 'text-theme-text'
                  }`}
                >
                  <span className="truncate">{f.name}</span>
                  {f.id === activeFolderId && <Check size={11} />}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
