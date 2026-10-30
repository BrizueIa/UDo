import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import { ContextMenuProvider } from './shared/ui/context-menu';
import './shared/styles/index.css';
import './shared/locales/i18n';

// Prevent WebKitGTK / Wayland black rectangle selection rendering glitch on Linux
if (typeof document !== 'undefined') {
  document.addEventListener('selectstart', (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const isInput =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      !!target.closest('[contenteditable="true"]') ||
      !!target.closest('.selectable-text') ||
      !!target.closest('.note-sheet-content');

    if (!isInput) {
      e.preventDefault();
    }
  });

  document.addEventListener('mousedown', (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const isInput =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      !!target.closest('[contenteditable="true"]') ||
      !!target.closest('.selectable-text') ||
      !!target.closest('.note-sheet-content');

    if (!isInput) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
        sel.removeAllRanges();
      }
    }
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ContextMenuProvider>
        <App />
      </ContextMenuProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
