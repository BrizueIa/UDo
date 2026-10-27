import React from 'react';
import { CheckSquare, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  content: string;
  viewMode: 'preview' | 'edit';
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onChangeContent: (newContent: string) => void;
  onToggleCheckbox: (lineIndex: number) => void;
}

export const MarkdownSheetPreview: React.FC<Props> = ({
  content,
  viewMode,
  textareaRef,
  onChangeContent,
  onToggleCheckbox,
}) => {
  const { t } = useTranslation();

  const renderInlineMarkdown = (text: string): React.ReactNode => {
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 rounded bg-theme-column font-mono text-xs text-theme-accent border border-white/[0.05]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-theme-text">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={i} className="italic text-theme-muted">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  const contentLines = content.split('\n');
  const hasCheckboxes = contentLines.some((l) => /^\s*[-*]\s+\[[ xX]\]/.test(l));

  if (viewMode === 'preview') {
    return (
      <div className="min-h-[350px] p-5 rounded-2xl bg-theme-card/30 border border-white/[0.05] space-y-2 text-sm text-theme-text leading-relaxed select-text shadow-xs">
        {content.trim() ? (
          contentLines.map((line, idx) => {
            // Task Checkbox match (- [ ] or - [x])
            const checkMatch = line.match(/^(\s*[-*]\s+)\[([ xX])\]\s*(.*)$/);
            if (checkMatch) {
              const isChecked = checkMatch[2].toLowerCase() === 'x';
              const text = checkMatch[3];

              return (
                <div
                  key={idx}
                  onClick={() => onToggleCheckbox(idx)}
                  className={`flex items-start space-x-2.5 py-1 px-2 rounded-lg cursor-pointer transition-colors group ${
                    isChecked
                      ? 'bg-emerald-500/10 text-theme-muted'
                      : 'hover:bg-theme-hover/60 text-theme-text'
                  }`}
                >
                  <button
                    type="button"
                    className="mt-0.5 shrink-0 text-theme-muted group-hover:text-theme-accent transition-colors"
                  >
                    {isChecked ? (
                      <CheckSquare size={16} className="text-emerald-400 fill-emerald-400/20" />
                    ) : (
                      <Square size={16} className="text-theme-muted" />
                    )}
                  </button>
                  <span className={`text-sm ${isChecked ? 'line-through opacity-70' : ''}`}>
                    {renderInlineMarkdown(text)}
                  </span>
                </div>
              );
            }

            // Headings (#, ##, ###)
            if (line.startsWith('# ')) {
              return (
                <h1 key={idx} className="text-2xl font-bold text-theme-text pt-2 pb-1 border-b border-white/[0.05]">
                  {line.slice(2)}
                </h1>
              );
            }
            if (line.startsWith('## ')) {
              return (
                <h2 key={idx} className="text-xl font-semibold text-theme-text pt-2 pb-0.5">
                  {line.slice(3)}
                </h2>
              );
            }
            if (line.startsWith('### ')) {
              return (
                <h3 key={idx} className="text-base font-semibold text-theme-text pt-1">
                  {line.slice(4)}
                </h3>
              );
            }

            // Bullet Lists (- or *)
            if (/^\s*[-*]\s+/.test(line)) {
              return (
                <li key={idx} className="list-disc list-inside text-sm text-theme-text/90 ml-2">
                  {renderInlineMarkdown(line.replace(/^\s*[-*]\s+/, ''))}
                </li>
              );
            }

            // Empty line
            if (!line.trim()) {
              return <div key={idx} className="h-2" />;
            }

            // Regular paragraph
            return (
              <p key={idx} className="text-sm text-theme-text/90 leading-relaxed">
                {renderInlineMarkdown(line)}
              </p>
            );
          })
        ) : (
          <p className="text-xs text-theme-muted italic">
            {t('note.markdownPlaceholder')}
          </p>
        )}
      </div>
    );
  }

  // Edit Mode: Textarea + Quick Checklists Block
  return (
    <div className="space-y-3">
      {hasCheckboxes && (
        <div className="p-3 bg-theme-card/60 border border-white/[0.06] rounded-xl space-y-1.5 shadow-xs">
          <div className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">
            {t('note.interactiveChecklists')}
          </div>
          <div className="space-y-1">
            {contentLines.map((line, idx) => {
              const checkMatch = line.match(/^(\s*[-*]\s+)\[([ xX])\]\s*(.*)$/);
              if (!checkMatch) return null;
              const isChecked = checkMatch[2].toLowerCase() === 'x';
              const taskText = checkMatch[3];

              return (
                <div
                  key={idx}
                  onClick={() => onToggleCheckbox(idx)}
                  className="flex items-center space-x-2 py-0.5 px-1.5 rounded-lg hover:bg-theme-hover cursor-pointer text-xs group"
                >
                  <button type="button" className="text-theme-muted group-hover:text-theme-accent">
                    {isChecked ? (
                      <CheckSquare size={14} className="text-emerald-400 fill-emerald-400/20" />
                    ) : (
                      <Square size={14} className="text-theme-muted" />
                    )}
                  </button>
                  <span className={isChecked ? 'line-through text-theme-muted' : 'text-theme-text'}>
                    {taskText || t('note.newTask')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onChangeContent(e.target.value)}
        placeholder={t('note.markdownPlaceholder')}
        className="w-full min-h-[350px] bg-theme-card/30 focus:bg-theme-card/50 text-theme-text p-4 rounded-xl outline-none font-mono text-xs leading-relaxed resize-y border border-white/[0.05] focus:border-theme-accent/50 transition-all shadow-inner"
      />
    </div>
  );
};
