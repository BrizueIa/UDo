import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import { ContextMenuProvider } from './shared/ui/context-menu';
import './shared/styles/index.css';
import './shared/locales/i18n';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ContextMenuProvider>
        <App />
      </ContextMenuProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
