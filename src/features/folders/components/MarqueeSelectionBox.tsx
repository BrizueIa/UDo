import React from 'react';
import { MarqueeRect } from '../hooks/useMultiSelection';

interface Props {
  rect: MarqueeRect | null;
}

export const MarqueeSelectionBox: React.FC<Props> = ({ rect }) => {
  if (!rect || rect.width <= 2 || rect.height <= 2) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        backgroundColor: 'rgba(91, 87, 247, 0.15)',
        borderColor: 'rgba(91, 87, 247, 0.45)',
      }}
      className="border rounded-lg pointer-events-none z-50 transition-none"
    />
  );
};
