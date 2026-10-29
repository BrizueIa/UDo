import { useState } from 'react';
import { SketchItem } from '../shared/types';

export function useAppModalState() {
  const [isSearchPaletteOpen, setIsSearchPaletteOpen] = useState(false);
  const [searchPaletteInitialQuery, setSearchPaletteInitialQuery] = useState('');
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
  const [activeSketch, setActiveSketch] = useState<SketchItem | null>(null);

  const handleEscapeModals = () => {
    if (isTrashModalOpen) setIsTrashModalOpen(false);
    else if (isQuickAddOpen) setIsQuickAddOpen(false);
    else if (isTimerModalOpen) setIsTimerModalOpen(false);
    else if (isSearchPaletteOpen) setIsSearchPaletteOpen(false);
    else if (isShortcutsModalOpen) setIsShortcutsModalOpen(false);
    else if (activeSketch) setActiveSketch(null);
    else return false;
    return true;
  };

  return {
    isSearchPaletteOpen,
    setIsSearchPaletteOpen,
    searchPaletteInitialQuery,
    setSearchPaletteInitialQuery,
    isShortcutsModalOpen,
    setIsShortcutsModalOpen,
    isQuickAddOpen,
    setIsQuickAddOpen,
    isTimerModalOpen,
    setIsTimerModalOpen,
    isTrashModalOpen,
    setIsTrashModalOpen,
    activeSketch,
    setActiveSketch,
    handleEscapeModals,
  };
}
