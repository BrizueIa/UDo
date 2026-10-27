import React from 'react';
import { LinkItem, SketchItem } from '../../../shared/types';
import { Link as LinkIcon, ExternalLink, Image as ImageIcon, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  links: LinkItem[];
  sketches: SketchItem[];
  isOpen: boolean;
  showLinkInput: boolean;
  newLinkTitle: string;
  newLinkUrl: string;
  onSetNewLinkTitle: (val: string) => void;
  onSetNewLinkUrl: (val: string) => void;
  onAddLink: (e: React.FormEvent) => void;
  onCloseLinkInput: () => void;
  onRemoveLink: (id: string) => void;
  onRemoveSketch: (id: string) => void;
  onOpenSketchAnnotator: (sketch: SketchItem) => void;
}

export const NoteAttachmentsDrawer: React.FC<Props> = ({
  links,
  sketches,
  isOpen,
  showLinkInput,
  newLinkTitle,
  newLinkUrl,
  onSetNewLinkTitle,
  onSetNewLinkUrl,
  onAddLink,
  onCloseLinkInput,
  onRemoveLink,
  onRemoveSketch,
  onOpenSketchAnnotator,
}) => {
  const { t } = useTranslation();

  const getDomain = (url: string) => {
    try {
      const u = new URL(url.startsWith('http') ? url : `https://${url}`);
      return u.hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  };

  const totalMediaCount = links.length + sketches.length;

  return (
    <div className="space-y-3">
      {/* Rectangular Cards for Attachments (Considerable size, soft subtle borders) */}
      <AnimatePresence>
        {isOpen && totalMediaCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-3.5 pt-1 pb-1"
          >
            {/* Canvas / Sketches Cards */}
            {sketches.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium text-theme-muted flex items-center space-x-1.5">
                  <ImageIcon size={12} className="text-pink-400" />
                  <span>
                    {t('note.sketches')} ({sketches.length})
                  </span>
                </div>

                <div className="flex flex-wrap gap-3">
                  {sketches.map((sketch) => (
                    <div
                      key={sketch.id}
                      onClick={() => onOpenSketchAnnotator(sketch)}
                      className="group relative w-44 rounded-xl bg-theme-card/60 hover:bg-theme-card border border-white/[0.06] hover:border-white/[0.14] overflow-hidden cursor-pointer transition-all shadow-xs hover:shadow-md flex flex-col"
                    >
                      {/* Image Preview Container (Generous size so drawing is clearly visible) */}
                      <div className="w-full h-24 bg-[#14151f] flex items-center justify-center p-2 relative overflow-hidden">
                        <img
                          src={sketch.dataUrl}
                          alt={sketch.title}
                          className="max-h-full max-w-full object-contain rounded transition-transform duration-200 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-medium">
                          {t('note.annotate')}
                        </div>
                      </div>

                      {/* Footer with Title and Delete Button */}
                      <div className="px-2.5 py-1.5 flex items-center justify-between border-t border-white/[0.04] bg-theme-card/90">
                        <span className="text-xs font-medium text-theme-text truncate" title={sketch.title}>
                          {sketch.title || 'Boceto'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveSketch(sketch.id);
                          }}
                          className="text-theme-muted hover:text-red-400 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-all ml-1 shrink-0"
                          title={t('note.deleteSketch')}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Links Cards */}
            {links.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium text-theme-muted flex items-center space-x-1.5">
                  <LinkIcon size={12} className="text-blue-400" />
                  <span>
                    {t('note.savedLinks')} ({links.length})
                  </span>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {links.map((link) => {
                    const domain = getDomain(link.url);
                    return (
                      <div
                        key={link.id}
                        className="group relative flex items-center space-x-2.5 px-3 py-2 rounded-xl bg-theme-card/60 hover:bg-theme-card border border-white/[0.06] hover:border-white/[0.14] transition-all shadow-xs hover:shadow-md w-64"
                      >
                        <div className="w-8 h-8 rounded-lg bg-theme-column/80 border border-white/[0.04] flex items-center justify-center shrink-0 text-blue-400">
                          <LinkIcon size={14} />
                        </div>

                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 min-w-0"
                        >
                          <div className="text-xs font-medium text-theme-text truncate group-hover:text-theme-accent transition-colors">
                            {link.title}
                          </div>
                          <div className="text-[10px] text-theme-muted truncate flex items-center space-x-1 mt-0.5">
                            <span>{domain}</span>
                            <ExternalLink size={9} className="opacity-60 shrink-0" />
                          </div>
                        </a>

                        <button
                          type="button"
                          onClick={() => onRemoveLink(link.id)}
                          className="text-theme-muted hover:text-red-400 p-1 rounded opacity-0 group-hover:opacity-100 transition-all shrink-0"
                          title={t('note.deleteLink')}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Add Link Inline Input */}
      <AnimatePresence>
        {showLinkInput && (
          <motion.form
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            onSubmit={onAddLink}
            className="flex items-center space-x-2 py-1 px-2.5 rounded-lg bg-theme-column border border-theme-accent/40 text-xs w-full max-w-md shadow-sm"
          >
            <LinkIcon size={12} className="text-theme-accent shrink-0" />
            <input
              type="text"
              placeholder={t('note.linkTitle')}
              value={newLinkTitle}
              onChange={(e) => onSetNewLinkTitle(e.target.value)}
              className="bg-theme-card px-2 py-0.5 rounded outline-none border border-white/[0.06] text-theme-text text-xs flex-1"
              autoFocus
              required
            />
            <input
              type="text"
              placeholder={t('note.linkUrl')}
              value={newLinkUrl}
              onChange={(e) => onSetNewLinkUrl(e.target.value)}
              className="bg-theme-card px-2 py-0.5 rounded outline-none border border-white/[0.06] text-theme-text text-xs flex-1"
              required
            />
            <button
              type="submit"
              className="px-2.5 py-0.5 rounded bg-theme-accent text-white font-medium hover:bg-theme-accent-hover text-xs transition-colors shadow-xs"
            >
              {t('note.save')}
            </button>
            <button
              type="button"
              onClick={onCloseLinkInput}
              className="p-0.5 text-theme-muted hover:text-theme-text"
            >
              <X size={12} />
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};
