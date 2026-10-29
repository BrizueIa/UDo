import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { ContextMenuItem, ContextMenuContext } from './useContextMenu';

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
}

export const ContextMenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menu, setMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    items: [],
  });
  const [activeSubmenuId, setActiveSubmenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeContextMenu = useCallback(() => {
    setMenu((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
    setActiveSubmenuId(null);
  }, []);

  const openContextMenu = useCallback((e: React.MouseEvent, items: ContextMenuItem[]) => {
    e.preventDefault();
    e.stopPropagation();

    if (!items || items.length === 0) return;

    // Viewport clamping
    const menuWidth = 220;
    const menuHeight = items.length * 36 + 16;
    const padding = 12;

    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth - padding) {
      x = Math.max(padding, window.innerWidth - menuWidth - padding);
    }
    if (y + menuHeight > window.innerHeight - padding) {
      y = Math.max(padding, window.innerHeight - menuHeight - padding);
    }

    setMenu({
      isOpen: true,
      x,
      y,
      items,
    });
    setActiveSubmenuId(null);
  }, []);

  // Global listener: prevent native browser context menu on entire app
  useEffect(() => {
    const handleGlobalContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    window.addEventListener('contextmenu', handleGlobalContextMenu);
    return () => window.removeEventListener('contextmenu', handleGlobalContextMenu);
  }, []);

  // Close context menu on click outside, scroll, resize, escape
  useEffect(() => {
    if (!menu.isOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeContextMenu();
    };

    const handleScrollOrResize = () => closeContextMenu();

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [menu.isOpen, closeContextMenu]);

  return (
    <ContextMenuContext.Provider value={{ openContextMenu, closeContextMenu }}>
      {children}

      <AnimatePresence>
        {menu.isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            style={{
              position: 'fixed',
              left: `${menu.x}px`,
              top: `${menu.y}px`,
              zIndex: 9999,
            }}
            className="w-56 bg-theme-card/95 backdrop-blur-md border border-theme-border rounded-xl shadow-2xl py-1.5 select-none text-xs"
          >
            {menu.items.map((item) => {
              if (item.separator) {
                return <div key={item.id} className="my-1 border-t border-theme-border/60" />;
              }

              const hasSubmenu = item.submenu && item.submenu.length > 0;
              const isSubmenuOpen = activeSubmenuId === item.id;

              return (
                <div
                  key={item.id}
                  className="relative px-1"
                  onMouseEnter={() => hasSubmenu && setActiveSubmenuId(item.id)}
                >
                  <button
                    type="button"
                    disabled={item.disabled}
                    onClick={() => {
                      if (!hasSubmenu && item.onClick) {
                        item.onClick();
                        closeContextMenu();
                      }
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                      item.disabled
                        ? 'opacity-40 cursor-not-allowed'
                        : item.danger
                        ? 'text-rose-400 hover:bg-rose-500/15'
                        : 'text-theme-text hover:bg-theme-hover'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      {item.icon && (
                        <span className="flex-shrink-0 text-theme-muted group-hover:text-theme-text">
                          {item.icon}
                        </span>
                      )}
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center space-x-1 ml-2">
                      {item.shortcut && (
                        <span className="text-[10px] text-theme-muted opacity-80">
                          {item.shortcut}
                        </span>
                      )}
                      {hasSubmenu && <ChevronRight size={13} className="text-theme-muted" />}
                    </div>
                  </button>

                  {/* Submenu flyout */}
                  {hasSubmenu && isSubmenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="absolute left-full top-0 ml-1 w-48 bg-theme-card/95 backdrop-blur-md border border-theme-border rounded-xl shadow-2xl py-1.5 z-50 text-xs"
                    >
                      {item.submenu!.map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => {
                            if (sub.onClick) {
                              sub.onClick();
                              closeContextMenu();
                            }
                          }}
                          className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-left text-theme-text hover:bg-theme-hover truncate transition-colors"
                        >
                          {sub.icon && <span className="flex-shrink-0 text-theme-muted">{sub.icon}</span>}
                          <span className="truncate">{sub.label}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </ContextMenuContext.Provider>
  );
};
