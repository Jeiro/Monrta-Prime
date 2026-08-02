import {createClient, type SupabaseClient} from '@supabase/supabase-js';
import {useSession} from '@clerk/clerk-react';
import {useMemo} from 'react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Validated lazily, NOT at module scope.
 *
 * ES module bodies run during the import graph, before `createRoot().render()`
 * — so a throw up here happens before RootErrorBoundary is mounted and there
 * is nothing to catch it. The result is a blank white page. Called from the
 * hook instead, the same failure throws during render and the boundary shows
 * a real message.
 *
 * A build cannot ship with these missing (see requireClientEnv in
 * vite.config.ts); this is the guard for `vite dev` and for values that are
 * present but wrong.
 */
function assertSupabaseEnv(): {url: string; anonKey: string} {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Missing Supabase configuration. Set VITE_SUPABASE_URL and ' +
        'VITE_SUPABASE_ANON_KEY in .env (local) or in the Vercel project ' +
        'environment variables, then restart.'
    );
  }
  return {url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY};
}

// Hook: gives you a Supabase client that's authenticated as the
// currently signed-in Clerk user. Use this inside components/hooks.
//
// IMPORTANT: memoized on session?.id (a stable primitive), not recreated
// on every render. Every data hook in this app depends on `supabase` in
// useEffect/useCallback dependency arrays — an unmemoized client here
// causes those to see a "new" value every render, which re-runs the
// effect, calls setState, triggers a re-render, and repeats forever
// (React's "Maximum update depth exceeded").
export function useSupabaseClient() {
  const {session} = useSession();
  const {url, anonKey} = assertSupabaseEnv();

  return useMemo(
    () =>
      createClient(url, anonKey, {
        async accessToken() {
          return (await session?.getToken()) ?? null;
        },
      }),
    [session?.id, url, anonKey]
  );
}

// Plain client for contexts with no signed-in user (public pages, reading
// public data like plans/traders before login).
//
// A function rather than a module-scope constant: createClient throws on a
// malformed URL, and at module scope that throw lands before React mounts,
// which is a blank page instead of an error screen. Memoized so callers
// still share one instance.
let publicClient: SupabaseClient | null = null;
export function getSupabasePublic(): SupabaseClient {
  if (!publicClient) {
    const {url, anonKey} = assertSupabaseEnv();
    publicClient = createClient(url, anonKey);
  }
  return publicClient;
}

// For use IMMEDIATELY after setActive() (e.g. right after sign-up or a
// password reset completes). The React-hook-based client above is tied to
// the session value from whatever render created it — calling it right
// after activating a brand-new session can race ahead of React's
// re-render, sending the request out unauthenticated. This reads the
// token straight from Clerk's live singleton instead, sidestepping that.
export function createFreshAuthedClient() {
  const {url, anonKey} = assertSupabaseEnv();
  return createClient(url, anonKey, {
    async accessToken() {
      return (await (window as any).Clerk?.session?.getToken()) ?? null;
    },
  });
}

// Ensures a Clerk user has a matching row in the Supabase `users` table.
// Runs on sign-in; safe to call repeatedly (upsert, ignores duplicates).
export async function ensureUserRow(
  supabase: SupabaseClient,
  clerkUser: {
    id: string;
    primaryEmailAddress?: {emailAddress: string} | null;
    fullName?: string | null;
  }
) {
  const {error} = await supabase
    .from('users')
    .upsert(
      {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress ?? '',
        name: clerkUser.fullName ?? '',
      },
      {onConflict: 'id', ignoreDuplicates: true}
    );

  if (error) console.error('ensureUserRow error:', error);
}

// Writes the FULL profile once, right after a successful registration —
// this is the authoritative creation moment, so unlike ensureUserRow it
// overwrites rather than ignoring duplicates.
export interface NewUserProfile {
  id: string;
  email: string;
  name: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  phone?: string;
  accountType?: string;
  country?: string;
  currency?: string;
}

export async function createUserProfile(supabase: SupabaseClient, profile: NewUserProfile) {
  const {error} = await supabase.from('users').upsert(
    {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      username: profile.username ?? null,
      first_name: profile.firstName ?? null,
      last_name: profile.lastName ?? null,
      gender: profile.gender ?? null,
      phone: profile.phone ?? null,
      account_type: profile.accountType ?? 'Bronze',
      country: profile.country ?? null,
      currency: profile.currency ?? 'USD',
    },
    {onConflict: 'id'}
  );

  if (error) console.error('createUserProfile error:', error);
  return {error};
}

// Uploads a user's deposit proof-of-payment file into the private
// `deposit-proofs` bucket, under a folder named after their own Clerk
// user id (storage policies key off that first path segment to restrict
// reads/writes to the owner or an admin). Returns the object path — not a
// public URL, since the bucket is private and nothing in the UI renders
// this as an <img>/<a> today; it's just stored as evidence on the
// transaction record.
export async function uploadDepositProof(supabase: SupabaseClient, userId: string, file: File): Promise<string> {
  const path = `${userId}/${Date.now()}_${file.name}`;
  const {error} = await supabase.storage.from('deposit-proofs').upload(path, file, {upsert: false});
  if (error) throw error;
  return path;
}

// Uploads a deposit-wallet QR code image into the public
// `deposit-wallet-qr` bucket (admin-write only via storage policy) and
// returns its public URL — this one IS rendered directly in <img> tags
// for any depositing user, so it must be publicly fetchable.
export async function uploadDepositWalletQrCode(supabase: SupabaseClient, walletId: string, file: File): Promise<string> {
  const path = `${walletId}_${Date.now()}_${file.name}`;
  const {error} = await supabase.storage.from('deposit-wallet-qr').upload(path, file, {upsert: false});
  if (error) throw error;
  const {data} = supabase.storage.from('deposit-wallet-qr').getPublicUrl(path);
  return data.publicUrl;
}