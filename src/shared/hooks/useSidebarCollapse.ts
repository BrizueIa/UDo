import { useState, useCallback } from 'react';

export function useSidebarCollapse() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('udo:sidebar-collapsed') === 'true';
  });

  const [isFoldersCollapsed, setIsFoldersCollapsed] = useState(() => {
    return localStorage.getItem('udo:folders-collapsed') === 'true';
  });

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('udo:sidebar-collapsed', String(next));
      return next;
    });
  }, []);

  const toggleFolders = useCallback(() => {
    setIsFoldersCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('udo:folders-collapsed', String(next));
      return next;
    });
  }, []);

  return {
    isSidebarCollapsed,
    isFoldersCollapsed,
    toggleSidebar,
    toggleFolders,
  };
}
