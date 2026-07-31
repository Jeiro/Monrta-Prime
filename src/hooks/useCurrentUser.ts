import { useEffect, useState, useCallback } from "react";
import { useUser as useClerkUser, useAuth as useClerkAuth } from "@clerk/clerk-react";
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
 * Use this for access-gating (routing guards). It does NOT replace
 * AppContext's `user` object for dashboard data (balance, portfolio,
 * etc.) — that migration is happening feature-by-feature in AppContext
 * itself; `profile`/`refetchProfile` here are used for the pieces that
 * have already moved (e.g. live balance checks during a deposit/withdrawal).
 */
export function useCurrentUser() {
  const { isSignedIn, isLoaded: clerkLoaded } = useClerkAuth();
  const { user: clerkUser } = useClerkUser();
  const supabase = useSupabaseClient();

  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const refetchProfile = useCallback(async () => {
    if (!clerkUser) return;

    setProfileLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("id, email, name, role, status, balance")
      .eq("id", clerkUser.id)
      .single();

    if (error) {
      console.error("useCurrentUser: failed to load profile", error);
      setProfile(null);
    } else {
      setProfile(data as CurrentUserProfile);
    }
    setProfileLoading(false);
  }, [clerkUser?.id, supabase]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!clerkLoaded) return;

      if (!isSignedIn || !clerkUser) {
        if (!cancelled) {
          setProfile(null);
          setProfileLoading(false);
        }
        return;
      }

      setProfileLoading(true);

      // Retry a few times: right after a fresh sign-in this fetch races
      // ensureUserRow (which creates the row on first login) and the Clerk
      // token becoming attachable. A single un-retried miss here left the
      // profile (balance, role) empty until the user manually refreshed.
      for (let attempt = 0; attempt < 5; attempt++) {
        const { data, error } = await supabase
          .from("users")
          .select("id, email, name, role, status, balance")
          .eq("id", clerkUser.id)
          .maybeSingle();

        if (cancelled) return;

        if (data) {
          setProfile(data as CurrentUserProfile);
          setProfileLoading(false);
          return;
        }
        if (error) {
          console.warn(`useCurrentUser: profile fetch attempt ${attempt + 1} failed`, error);
        }
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
        if (cancelled) return;
      }

      console.error("useCurrentUser: failed to load profile after retries");
      setProfile(null);
      setProfileLoading(false);
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, clerkUser?.id, clerkLoaded]);

  return {
    isLoggedIn: !!isSignedIn,
    isReady: clerkLoaded && !profileLoading,
    role: profile?.role ?? "user",
    isAdmin: profile?.role === "admin",
    profile,
    refetchProfile,
  };
}