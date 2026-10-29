import React from 'react';
import { MarqueeRect } from '../hooks/useMultiSelection';

interface Props {
  rect: MarqueeRect | null;
}

export const MarqueeSelectionBox: React.FC<Props> = ({ rect }) => {
  if (!rect) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
      }}
      className="bg-theme-accent/15 border border-theme-accent/40 rounded-lg pointer-events-none z-50 transition-none"
    />
  );
};
