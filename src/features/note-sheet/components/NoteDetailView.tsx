import React, { useState } from 'react';
import { NoteItem, LinkItem, SketchItem } from '../../../shared/types';
import {
  Clock,
  Tag,
  Link as LinkIcon,
  ExternalLink,
  CheckSquare,
  Image as ImageIcon,
  Timer,
  Plus,
  Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

interface Props {
  note: NoteItem;
  folderName: string;
  onUpdateNote: (note: NoteItem) => void;
  onDeleteNote: (id: string) => void;
  onOpenSketchAnnotator: (sketch: SketchItem) => void;
  onOpenWhiteboard: () => void;
}

export const NoteDetailView: React.FC<Props> = ({
  note,
  folderName,
  onUpdateNote,
  onDeleteNote,
  onOpenSketchAnnotator,
  onOpenWhiteboard,
}) => {
  const { t } = useTranslation();
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateNote({
      ...note,
      title: e.target.value,
      updatedAt: t('note.justNow'),
    });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateNote({
      ...note,
      content: e.target.value,
      updatedAt: t('note.justNow'),
    });
  };

  const handleToggleComplete = () => {
    onUpdateNote({
      ...note,
      isCompleted: !note.isCompleted,
      updatedAt: t('note.justNow'),
    });
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
    });
    setNewLinkTitle('');
    setNewLinkUrl('');
    setShowLinkInput(false);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      if (!note.tags.includes(newTagInput.trim())) {
        onUpdateNote({
          ...note,
          tags: [...note.tags, newTagInput.trim()],
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
    });
  };

  return (
    <div className="flex-1 bg-theme-base flex flex-col h-full overflow-y-auto">
      {/* Top Action Ribbon matching reference image */}
      <div className="flex items-center justify-between px-8 py-3.5 border-b border-theme-border/60 bg-theme-base/80 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          {/* Tachar como lista button */}
          <button
            onClick={handleToggleComplete}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              note.isCompleted
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-theme-card hover:bg-theme-hover text-theme-text border border-theme-border'
            }`}
          >
            <CheckSquare size={13} />
            <span>{t('note.toggleComplete')}</span>
          </button>

          {/* Folder Indicator Pill */}
          <span className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs bg-theme-card/60 text-theme-muted border border-theme-border">
            <span>📁</span>
            <span>{folderName}</span>
          </span>

          {/* Añadir Link button */}
          <button
            onClick={() => setShowLinkInput(!showLinkInput)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-theme-card hover:bg-theme-hover text-theme-text border border-theme-border transition-colors"
          >
            <LinkIcon size={13} className="text-theme-accent" />
            <span>{t('note.addLink')}</span>
          </button>
        </div>

        {/* Delete button */}
        <button
          onClick={() => onDeleteNote(note.id)}
          className="p-1.5 rounded-md text-theme-muted hover:text-red-400 hover:bg-theme-hover transition-colors"
          title="Delete note"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl w-full mx-auto px-10 py-6 space-y-6">
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
                {t('note.modified')}: {note.updatedAt}
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
          </div>
        </div>

        {/* Add Link Form Modal/Inline */}
        {showLinkInput && (
          <form
            onSubmit={handleAddLink}
            className="p-3 rounded-lg bg-theme-card border border-theme-border flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder="Title (e.g. Modelos en Printables)"
              value={newLinkTitle}
              onChange={(e) => setNewLinkTitle(e.target.value)}
              className="flex-1 bg-theme-column px-3 py-1.5 rounded text-xs outline-none border border-theme-border text-theme-text"
              required
            />
            <input
              type="text"
              placeholder="URL (e.g. https://...)"
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              className="flex-1 bg-theme-column px-3 py-1.5 rounded text-xs outline-none border border-theme-border text-theme-text"
              required
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded text-xs font-semibold bg-theme-accent text-white hover:bg-theme-accent-hover transition-colors"
            >
              Add
            </button>
          </form>
        )}

        {/* Section: Enlaces y Presupuestos Guardados */}
        {note.links.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-theme-muted flex items-center space-x-1.5">
              <LinkIcon size={13} className="text-theme-accent" />
              <span>{t('note.savedLinks')}</span>
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {note.links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-theme-card hover:bg-theme-hover border border-theme-border/80 text-xs font-medium text-theme-text transition-all shadow-sm group"
                >
                  <span>{link.title}</span>
                  <ExternalLink
                    size={13}
                    className="text-theme-muted group-hover:text-theme-accent transition-colors"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Section: Imágenes y Bocetos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-theme-muted flex items-center space-x-1.5">
              <ImageIcon size={13} className="text-pink-400" />
              <span>
                {t('note.sketches')} ({note.sketches.length})
              </span>
            </h3>

            <button
              onClick={onOpenWhiteboard}
              className="flex items-center space-x-1 text-xs text-theme-accent hover:underline font-medium"
            >
              <Plus size={12} />
              <span>{t('note.addSketch')}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            {note.sketches.map((sketch) => (
              <motion.div
                key={sketch.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => onOpenSketchAnnotator(sketch)}
                className="w-24 h-24 rounded-xl overflow-hidden border border-theme-border/80 bg-theme-card cursor-pointer shadow-md hover:border-theme-accent/60 transition-all flex items-center justify-center p-1.5 group relative"
              >
                <img
                  src={sketch.dataUrl}
                  alt={sketch.title}
                  className="w-full h-full object-contain rounded-lg"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-medium">
                  Annotate
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Section: CONTENIDO DE LA HOJA (Markdown body) */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-semibold tracking-wider text-theme-muted uppercase">
            {t('note.sheetContent')}
          </h3>
          <textarea
            value={note.content}
            onChange={handleContentChange}
            placeholder={t('note.markdownPlaceholder')}
            rows={14}
            className="w-full bg-theme-card/50 hover:bg-theme-card/80 focus:bg-theme-card rounded-xl p-4 text-sm font-mono text-theme-text leading-relaxed outline-none border border-theme-border focus:border-theme-accent/60 transition-all resize-y shadow-inner"
          />
        </div>
      </div>
    </div>
  );
};
