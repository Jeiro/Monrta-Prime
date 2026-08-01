import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {ClerkProvider} from '@clerk/clerk-react';
import {BrowserRouter} from 'react-router-dom';
import App from './App.tsx';
import {ThemeProvider} from './context/ThemeContext';
import './index.css';
import {installChunkReloadHandler} from './lib/chunkReload';

// Recover automatically when a redeploy leaves this tab pointing at old,
// now-missing chunk hashes (stale-chunk-after-deploy). Must run before render.
installChunkReloadHandler();

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <ThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </ClerkProvider>
  </StrictMode>,
);