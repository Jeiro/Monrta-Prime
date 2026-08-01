import { useEffect, useState, useCallback, useSyncExternalStore } from "react";
import { useUser as useClerkUser, useAuth as useClerkAuth } from "@clerk/clerk-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useSupabaseClient } from "../lib/supabase";

export interface CurrentUserProfile {
  id: string;
  email: string;
  name: string | null;
  role: "user" | "admin";
  status: string;
  balance: number;
}

/**
 * Single source of truth for "who is signed in and are they an admin" —
 * backed entirely by Clerk (identity) + Supabase (role), no Firebase.
 * Use this for access-gating (routing guards). It does NOT replace the
 * `user` object in SessionContext, which carries the dashboard data
 * (balance, portfolio, transactions, …); `profile`/`refetchProfile` here
 * are the live read-through used where freshness matters on its own —
 * e.g. the balance check during a deposit/withdrawal.
 *
 * The profile lives in a module-level store rather than in each caller's
 * useState. Five components call this hook, and per-instance state meant
 * five independent fetches of the same row on every page load — and, worse,
 * every one of them started at { profile: null, loading: true }. A late
 * consumer therefore reported isAdmin === false for a moment even though the
 * role was already known, which is what made the admin page flash "Access
 * Denied" before rendering. One store, one fetch, one answer.
 */

type State = { userId: string | null; profile: CurrentUserProfile | null; loading: boolean };

let state: State = { userId: null, profile: null, loading: true };
const subscribers = new Set<() => void>();
let inFlight: Promise<void> | null = null;

const emit = () => subscribers.forEach(fn => fn());

const setState = (next: Partial<State>) => {
  state = { ...state, ...next };
  emit();
};

const subscribe = (fn: () => void) => {
  subscribers.add(fn);
  return () => { subscribers.delete(fn); };
};

const getSnapshot = () => state;

async function fetchProfile(supabase: SupabaseClient, userId: string, retries: number): Promise<void> {
  // Retry a few times: right after a fresh sign-in this fetch races
  // ensureUserRow (which creates the row on first login) and the Clerk token
  // becoming attachable. A single un-retried miss left the profile empty
  // until the user manually refreshed.
  for (let attempt = 0; attempt < retries; attempt++) {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, name, role, status, balance")
      .eq("id", userId)
      .maybeSingle();

    // A newer user took over while we were awaiting — drop this result.
    if (state.userId !== userId) return;

    if (data) {
      setState({ profile: data as CurrentUserProfile, loading: false });
      return;
    }
    if (error) {
      console.warn(`useCurrentUser: profile fetch attempt ${attempt + 1} failed`, error);
    }
    if (attempt < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
      if (state.userId !== userId) return;
    }
  }

  console.error("useCurrentUser: failed to load profile after retries");
  setState({ profile: null, loading: false });
}

function load(supabase: SupabaseClient, userId: string, retries = 5): Promise<void> {
  // Dedupe: concurrent consumers mounting in the same tick share one request.
  if (inFlight && state.userId === userId) return inFlight;
  if (state.userId !== userId) {
    state = { userId, profile: null, loading: true };
    emit();
  }
  inFlight = fetchProfile(supabase, userId, retries).finally(() => { inFlight = null; });
  return inFlight;
}

export function useCurrentUser() {
  const { isSignedIn, isLoaded: clerkLoaded } = useClerkAuth();
  const { user: clerkUser } = useClerkUser();
  const supabase = useSupabaseClient();
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (!clerkLoaded) return;

    if (!isSignedIn || !clerkUser) {
      if (state.userId !== null || state.profile !== null || state.loading) {
        state = { userId: null, profile: null, loading: false };
        emit();
      }
      return;
    }

    // Already resolved for this user — don't refetch on every mount.
    if (state.userId === clerkUser.id && !state.loading) return;

    void load(supabase, clerkUser.id);
  }, [isSignedIn, clerkUser?.id, clerkLoaded, supabase]);

  const refetchProfile = useCallback(async () => {
    if (!clerkUser) return;
    inFlight = null;
    setState({ loading: true });
    await load(supabase, clerkUser.id);
  }, [clerkUser?.id, supabase]);

  const profile = snap.userId && clerkUser && snap.userId === clerkUser.id ? snap.profile : null;

  return {
    isLoggedIn: !!isSignedIn,
    isReady: clerkLoaded && !snap.loading,
    role: profile?.role ?? "user",
    isAdmin: profile?.role === "admin",
    profile,
    refetchProfile,
  };
}
