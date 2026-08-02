import {StrictMode, type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import {ClerkProvider} from '@clerk/clerk-react';
import {BrowserRouter} from 'react-router-dom';
import App from './App.tsx';
import {ThemeProvider} from './context/ThemeContext';
import {RootErrorBoundary} from './components/RootErrorBoundary';
import './index.css';
import {installChunkReloadHandler} from './lib/chunkReload';

// Recover automatically when a redeploy leaves this tab pointing at old,
// now-missing chunk hashes (stale-chunk-after-deploy). Must run before render.
installChunkReloadHandler();

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// A build cannot ship without this (see the requireClientEnv plugin in
// vite.config.ts). Kept as a guard for `vite dev`, which deliberately does
// not enforce it, and thrown INSIDE the tree so RootErrorBoundary can render
// a real message — throwing at module scope produced a blank page.
function ClerkGate({children}: {children: ReactNode}) {
  if (!CLERK_PUBLISHABLE_KEY) {
    throw new Error(
      'Missing VITE_CLERK_PUBLISHABLE_KEY. Set it in .env (local) or in the ' +
        'Vercel project environment variables, then restart.'
    );
  }
  return <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>{children}</ClerkProvider>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Outermost on purpose: it has to survive a failure in ClerkProvider
        itself, which is the most likely thing to reject bad config. */}
    <RootErrorBoundary>
      <ClerkGate>
        <ThemeProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ThemeProvider>
      </ClerkGate>
    </RootErrorBoundary>
  </StrictMode>,
);