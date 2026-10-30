import React from 'react';
import { SketchItem, SketchWrapMode } from '../../../../shared/types';
import { Move, AlignLeft, AlignRight, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  sketch: SketchItem;
  wrapMode: SketchWrapMode;
  onSelectWrapMode: (mode: SketchWrapMode) => void;
}

export const SketchWrapPopover: React.FC<Props> = ({
  wrapMode,
  onSelectWrapMode,
}) => {
  const { t } = useTranslation();

  const modes: { id: SketchWrapMode; label: string; icon: React.ReactNode }[] = [
    { id: 'square-left', label: t('note.wrapSquareLeft'), icon: <AlignLeft size={12} /> },
    { id: 'square-right', label: t('note.wrapSquareRight'), icon: <AlignRight size={12} /> },
    { id: 'inline', label: t('note.wrapInline'), icon: <Layers size={12} /> },
    { id: 'behind', label: t('note.wrapBehind'), icon: <Layers size={12} /> },
    { id: 'front', label: t('note.wrapFront'), icon: <Move size={12} /> },
  ];

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute top-10 right-2 z-40 w-44 rounded-xl bg-theme-card border border-theme-border shadow-2xl p-1.5 space-y-1 text-[11px]"
    >
      {modes.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onSelectWrapMode(m.id)}
          className={`w-full flex items-center space-x-2 px-2 py-1 rounded-lg transition-colors cursor-pointer ${
            wrapMode === m.id
              ? 'bg-theme-accent/20 text-theme-accent font-semibold'
              : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover'
          }`}
        >
          {m.icon}
          <span>{m.label}</span>
        </button>
      ))}
    </div>
  );
};
