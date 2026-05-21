import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initializeLocalDatabase } from './db/localDb';
import './styles/index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element was not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

void initializeLocalDatabase().catch((error: unknown) => {
  window.dispatchEvent(
    new CustomEvent('ihatepdf:db-error', {
      detail: error instanceof Error ? error.message : 'Unable to initialize local storage.',
    }),
  );
});
