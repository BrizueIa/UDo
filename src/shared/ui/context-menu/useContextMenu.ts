import React, { createContext, useContext } from 'react';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  shortcut?: string;
  separator?: boolean;
  onClick?: () => void;
  submenu?: ContextMenuItem[];
}

export interface ContextMenuContextType {
  openContextMenu: (e: React.MouseEvent, items: ContextMenuItem[]) => void;
  closeContextMenu: () => void;
}

export const ContextMenuContext = createContext<ContextMenuContextType>({
  openContextMenu: () => {},
  closeContextMenu: () => {},
});

export const useContextMenu = () => useContext(ContextMenuContext);
