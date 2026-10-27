import React, { useState, useRef } from 'react';
import { NoteItem, LinkItem, SketchItem, FolderItem } from '../../../shared/types';
import { formatRelativeTime } from '../../../shared/utils/formatTime';
import { NoteActionRibbon } from './NoteActionRibbon';
import { NoteAttachmentsDrawer } from './NoteAttachmentsDrawer';
import { MarkdownSheetPreview } from './MarkdownSheetPreview';
import {
  Clock,
  Tag,
  Link as LinkIcon,
  Image as ImageIcon,
  Timer,
  Plus,
  Eye,
  Edit3,
  ListTodo,
  Paperclip,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  note: NoteItem;
  folderName: string;
  folders: FolderItem[];
  onUpdateNote: (note: NoteItem) => void;
  onDeleteNote: (id: string) => void;
  onOpenSketchAnnotator: (sketch: SketchItem) => void;
  onOpenWhiteboard: () => void;
}

export const NoteDetailView: React.FC<Props> = ({
  note,
  folderName,
  folders,
  onUpdateNote,
  onDeleteNote,
  onOpenSketchAnnotator,
  onOpenWhiteboard,
}) => {
  const { t, i18n } = useTranslation();

  // Inputs state
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [isMediaDrawerOpen, setIsMediaDrawerOpen] = useState(true);

  // View Mode: 'preview' (Interactive checkboxes/markdown) vs 'edit' (Markdown source)
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');

  // Textarea Ref for cursor preservation
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateNote({
      ...note,
      title: e.target.value,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleContentChange = (newContent: string) => {
    onUpdateNote({
      ...note,
      content: newContent,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleToggleComplete = () => {
    onUpdateNote({
      ...note,
      isCompleted: !note.isCompleted,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleTogglePin = () => {
    onUpdateNote({
      ...note,
      isPinned: !note.isPinned,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSelectFolder = (newFolderId: string) => {
    onUpdateNote({
      ...note,
      folderId: newFolderId,
      updatedAt: new Date().toISOString(),
    });
  };

  // Insert a task checkbox without needing markdown knowledge
  const handleInsertTask = () => {
    const taskPrefix = '- [ ] ';
    let newContent = '';

    if (viewMode === 'edit' && textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = note.content.substring(0, start);
      const after = note.content.substring(end);
      const needsNewline = before.length > 0 && !before.endsWith('\n');
      newContent = `${before}${needsNewline ? '\n' : ''}${taskPrefix}${after}`;
    } else {
      const needsNewline = note.content.length > 0 && !note.content.endsWith('\n');
      newContent = `${note.content}${needsNewline ? '\n' : ''}${taskPrefix}${t('note.newTask')}`;
    }

    onUpdateNote({
      ...note,
      content: newContent,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleToggleCheckbox = (targetLineIdx: number) => {
    const lines = note.content.split('\n');
    const targetLine = lines[targetLineIdx];
    if (targetLine === undefined) return;

    const match = targetLine.match(/^(\s*[-*]\s+\[)( |x|X)(\])(.*)$/);
    if (match) {
      const isCurrentlyChecked = match[2].toLowerCase() === 'x';
      const newChar = isCurrentlyChecked ? ' ' : 'x';
      lines[targetLineIdx] = `${match[1]}${newChar}${match[3]}${match[4]}`;
      onUpdateNote({
        ...note,
        content: lines.join('\n'),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkTitle || !newLinkUrl) return;
    const newLink: LinkItem = {
      id: `link-${Date.now()}`,
      title: newLinkTitle,
      url: newLinkUrl.startsWith('http') ? newLinkUrl : `https://${newLinkUrl}`,
    };
    onUpdateNote({
      ...note,
      links: [...note.links, newLink],
      updatedAt: new Date().toISOString(),
    });
    setNewLinkTitle('');
    setNewLinkUrl('');
    setShowLinkInput(false);
  };

  const handleRemoveLink = (linkId: string) => {
    onUpdateNote({
      ...note,
      links: note.links.filter((l) => l.id !== linkId),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleRemoveSketch = (sketchId: string) => {
    onUpdateNote({
      ...note,
      sketches: note.sketches.filter((s) => s.id !== sketchId),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      if (!note.tags.includes(newTagInput.trim())) {
        onUpdateNote({
          ...note,
          tags: [...note.tags, newTagInput.trim()],
          updatedAt: new Date().toISOString(),
        });
      }
      setNewTagInput('');
      setShowTagInput(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateNote({
      ...note,
      tags: note.tags.filter((t) => t !== tagToRemove),
      updatedAt: new Date().toISOString(),
    });
  };

  const totalMediaCount = note.links.length + note.sketches.length;

  return (
    <div className="flex-1 bg-theme-base flex flex-col h-full overflow-y-auto">
      {/* Top Action Ribbon Component */}
      <NoteActionRibbon
        note={note}
        folderName={folderName}
        folders={folders}
        onToggleComplete={handleToggleComplete}
        onTogglePin={handleTogglePin}
        onSelectFolder={handleSelectFolder}
        onDeleteNote={onDeleteNote}
      />

      {/* Main Content Area */}
      <div className="max-w-4xl w-full mx-auto px-10 py-6 space-y-5">
        {/* Title & Metadata */}
        <div className="space-y-3">
          <input
            type="text"
            value={note.title}
            onChange={handleTitleChange}
            placeholder={t('note.titlePlaceholder')}
            className={`w-full text-3xl font-bold bg-transparent outline-none border-b border-transparent focus:border-theme-accent/50 pb-1 transition-colors ${
              note.isCompleted ? 'line-through text-theme-muted opacity-80' : 'text-theme-text'
            }`}
          />

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-theme-muted">
            <span className="flex items-center space-x-1.5">
              <Clock size={13} />
              <span>
                {t('note.modified')}: {formatRelativeTime(note.updatedAt, i18n.language)}
              </span>
            </span>

            {/* Tags */}
            <div className="flex items-center space-x-1.5">
              <Tag size={13} className="text-theme-muted" />
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  onClick={() => handleRemoveTag(tag)}
                  className="px-2 py-0.5 rounded-md bg-theme-card text-theme-text hover:bg-red-500/20 hover:text-red-400 cursor-pointer transition-colors"
                  title="Click to remove"
                >
                  #{tag}
                </span>
              ))}

              {showTagInput ? (
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  onBlur={() => setShowTagInput(false)}
                  placeholder={t('note.tagPlaceholder')}
                  autoFocus
                  className="bg-theme-card px-2 py-0.5 rounded text-xs outline-none border border-theme-accent text-theme-text"
                />
              ) : (
                <button
                  onClick={() => setShowTagInput(true)}
                  className="p-0.5 rounded text-theme-muted hover:text-theme-text"
                >
                  <Plus size={13} />
                </button>
              )}
            </div>

            {/* Focus Sprint Badge */}
            {note.focusMinutes && (
              <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-theme-accent/15 text-theme-accent border border-theme-accent/30 font-mono">
                <Timer size={12} />
                <span>{note.focusMinutes} min</span>
              </span>
            )}

            {/* Minimalist Attachments Pill */}
            {totalMediaCount > 0 && (
              <button
                type="button"
                onClick={() => setIsMediaDrawerOpen(!isMediaDrawerOpen)}
                className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs transition-all ${
                  isMediaDrawerOpen
                    ? 'bg-theme-accent/20 text-theme-accent border border-theme-accent/30 font-medium'
                    : 'bg-theme-card hover:bg-theme-hover text-theme-muted hover:text-theme-text border border-white/[0.06]'
                }`}
                title={isMediaDrawerOpen ? t('note.hideMedia') : t('note.showMedia')}
              >
                <Paperclip size={11} className={isMediaDrawerOpen ? 'text-theme-accent' : 'text-theme-muted'} />
                <span>
                  {totalMediaCount} {totalMediaCount === 1 ? 'adjunto' : 'adjuntos'}
                </span>
                <span className="text-[9px] opacity-70">
                  {isMediaDrawerOpen ? '▲' : '▼'}
                </span>
              </button>
            )}
          </div>

          {/* Attachments Drawer Component */}
          <NoteAttachmentsDrawer
            links={note.links}
            sketches={note.sketches}
            isOpen={isMediaDrawerOpen}
            showLinkInput={showLinkInput}
            newLinkTitle={newLinkTitle}
            newLinkUrl={newLinkUrl}
            onSetNewLinkTitle={setNewLinkTitle}
            onSetNewLinkUrl={setNewLinkUrl}
            onAddLink={handleAddLink}
            onCloseLinkInput={() => setShowLinkInput(false)}
            onRemoveLink={handleRemoveLink}
            onRemoveSketch={handleRemoveSketch}
            onOpenSketchAnnotator={onOpenSketchAnnotator}
          />
        </div>

        {/* Section: CONTENIDO DE LA HOJA (Quick Actions Toolbar + Markdown/Interactive View) */}
        <div className="space-y-2.5 pt-1">
          {/* Action Toolbar above content */}
          <div className="flex items-center justify-between border-b border-theme-border/40 pb-2">
            {/* Quick Insertion Tools for users who don't know markdown */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleInsertTask}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-theme-card hover:bg-theme-hover border border-white/[0.06] text-xs font-semibold text-theme-text transition-colors shadow-xs"
                title="Insert task checkbox (- [ ])"
              >
                <ListTodo size={14} className="text-emerald-400" />
                <span>+ {t('note.addTask')}</span>
              </button>

              <button
                type="button"
                onClick={onOpenWhiteboard}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-theme-card hover:bg-theme-hover border border-white/[0.06] text-xs font-semibold text-theme-text transition-colors shadow-xs"
                title="Create a canvas sketch"
              >
                <ImageIcon size={13} className="text-pink-400" />
                <span>+ {t('note.addSketch')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMediaDrawerOpen(true);
                  setShowLinkInput(true);
                }}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-theme-card hover:bg-theme-hover border border-white/[0.06] text-xs font-semibold text-theme-text transition-colors shadow-xs"
                title={t('note.addLink')}
              >
                <LinkIcon size={13} className="text-blue-400" />
                <span>+ {t('note.addLink')}</span>
              </button>
            </div>

            {/* Toggle View Mode: Interactive Preview vs Source Editor */}
            <div className="flex items-center bg-theme-column/80 p-0.5 rounded-lg border border-white/[0.05] text-xs">
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'preview'
                    ? 'bg-theme-accent text-white shadow-sm font-semibold'
                    : 'text-theme-muted hover:text-theme-text'
                }`}
              >
                <Eye size={12} />
                <span>{t('note.interactive')}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('edit')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'edit'
                    ? 'bg-theme-accent text-white shadow-sm font-semibold'
                    : 'text-theme-muted hover:text-theme-text'
                }`}
              >
                <Edit3 size={12} />
                <span>{t('note.markdown')}</span>
              </button>
            </div>
          </div>

          {/* Markdown / Interactive Sheet Preview Component */}
          <MarkdownSheetPreview
            content={note.content}
            viewMode={viewMode}
            textareaRef={textareaRef}
            onChangeContent={handleContentChange}
            onToggleCheckbox={handleToggleCheckbox}
          />
        </div>
      </div>
    </div>
  );
};
