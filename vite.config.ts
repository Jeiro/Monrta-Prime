import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';

/**
 * Variables the client bundle cannot function without.
 *
 * Each is read at module scope in the app — main.tsx for Clerk,
 * lib/supabase.ts for Supabase — where a missing value throws during the
 * very first import. In a browser that means a blank white page with the
 * real reason buried in the console, which is the exact failure this list
 * exists to convert into a build error instead.
 */
const REQUIRED_CLIENT_ENV: {name: string; why: string}[] = [
  {name: 'VITE_SUPABASE_URL', why: 'Supabase project URL — every data hook reads through it.'},
  {name: 'VITE_SUPABASE_ANON_KEY', why: 'Supabase anon key — required to construct the client.'},
  {name: 'VITE_CLERK_PUBLISHABLE_KEY', why: 'Clerk publishable key — ClerkProvider throws without it.'},
];

/**
 * Fails the build when a required VITE_* variable is missing or blank.
 *
 * Deliberately build-time rather than runtime. On Vercel a missing variable
 * otherwise produces a deploy that "succeeds" and then serves a blank page,
 * which leaves whoever is debugging with nothing to go on. Failing here puts
 * the variable name in the build log — the one place someone is already
 * looking.
 *
 * `apply: 'build'` on purpose: the dev server stays usable with a partial
 * env, so the public marketing pages can be worked on without a full Clerk
 * setup.
 */
function requireClientEnv(mode: string): Plugin {
  return {
    name: 'moneta-require-client-env',
    apply: 'build',
    config() {
      // loadEnv reads .env files the way Vite itself does; process.env is
      // overlaid on top so CI/Vercel-injected variables count too.
      const fileEnv = loadEnv(mode, process.cwd(), 'VITE_');
      const missing = REQUIRED_CLIENT_ENV.filter(({name}) => {
        const value = process.env[name] ?? fileEnv[name];
        return typeof value !== 'string' || value.trim() === '';
      });

      if (missing.length === 0) return;

      const detail = missing.map(({name, why}) => `  - ${name}\n      ${why}`).join('\n');
      throw new Error(
        `\n\nBuild aborted: ${missing.length} required environment variable(s) missing or empty.\n\n` +
          `${detail}\n\n` +
          `Set these in the Vercel project (Settings -> Environment Variables) for the\n` +
          `environment being deployed, or in a local .env file, then rebuild.\n` +
          `A build without them produces a blank page at runtime rather than an error.\n`
      );
    },
  };
}

export default defineConfig(({mode}) => {
  return {
    plugins: [requireClientEnv(mode), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
