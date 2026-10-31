import { useState, useCallback, useEffect, useRef } from 'react';

export const SIDEBAR_BREAKPOINT = 1024;
export const FOLDERS_BREAKPOINT = 720;

export function useSidebarCollapse() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < SIDEBAR_BREAKPOINT) {
      return true;
    }
    return localStorage.getItem('udo:sidebar-collapsed') === 'true';
  });

  const [isFoldersCollapsed, setIsFoldersCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < FOLDERS_BREAKPOINT) {
      return true;
    }
    return localStorage.getItem('udo:folders-collapsed') === 'true';
  });

  const prevWidthRef = useRef(typeof window !== 'undefined' ? window.innerWidth : 1280);

  useEffect(() => {
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      const prevWidth = prevWidthRef.current;

      // Crossing Sidebar Breakpoint (1024px)
      if (prevWidth >= SIDEBAR_BREAKPOINT && currentWidth < SIDEBAR_BREAKPOINT) {
        setIsSidebarCollapsed(true);
      } else if (prevWidth < SIDEBAR_BREAKPOINT && currentWidth >= SIDEBAR_BREAKPOINT) {
        const savedCollapsed = localStorage.getItem('udo:sidebar-collapsed') === 'true';
        if (!savedCollapsed) {
          setIsSidebarCollapsed(false);
        }
      }

      // Crossing Folders Breakpoint (720px)
      if (prevWidth >= FOLDERS_BREAKPOINT && currentWidth < FOLDERS_BREAKPOINT) {
        setIsFoldersCollapsed(true);
      } else if (prevWidth < FOLDERS_BREAKPOINT && currentWidth >= FOLDERS_BREAKPOINT) {
        const savedFoldersCollapsed = localStorage.getItem('udo:folders-collapsed') === 'true';
        if (!savedFoldersCollapsed) {
          setIsFoldersCollapsed(false);
        }
      }

      prevWidthRef.current = currentWidth;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        if (window.innerWidth >= SIDEBAR_BREAKPOINT) {
          localStorage.setItem('udo:sidebar-collapsed', String(next));
        } else if (window.innerWidth < FOLDERS_BREAKPOINT && !next) {
          // If on a very narrow screen and expanding sidebar, collapse folders to avoid squeezing
          setIsFoldersCollapsed(true);
        }
      }
      return next;
    });
  }, []);

  const toggleFolders = useCallback(() => {
    setIsFoldersCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        if (window.innerWidth >= FOLDERS_BREAKPOINT) {
          localStorage.setItem('udo:folders-collapsed', String(next));
        } else if (window.innerWidth < FOLDERS_BREAKPOINT && !next) {
          // If on a very narrow screen and expanding folders, collapse sidebar to avoid squeezing
          setIsSidebarCollapsed(true);
        }
      }
      return next;
    });
  }, []);

  return {
    isSidebarCollapsed,
    isFoldersCollapsed,
    setIsSidebarCollapsed,
    setIsFoldersCollapsed,
    toggleSidebar,
    toggleFolders,
  };
}
