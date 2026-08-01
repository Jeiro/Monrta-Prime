import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useUser as useClerkUserProfile, useAuth as useClerkAuthState } from "@clerk/clerk-react";
import type { UserState } from "../../types";
import { createLoggedOutUser, createSignedOutUser, isAdminEmail, USE_MOCK_DATA } from "../../services";
import { useSupabaseClient, ensureUserRow } from "../../lib/supabase";
import { useCurrentUser, type CurrentUserProfile } from "../../hooks/useCurrentUser";

const localDev = import.meta.env.VITE_LOCAL_DEV === "true";

export type BalanceReservation = "reserved" | "duplicate" | "insufficient";

interface SessionContextType {
  /** One authenticated Supabase client shared by every domain provider. */
  supabase: SupabaseClient;
  user: UserState;
  setUser: React.Dispatch<React.SetStateAction<UserState>>;
  authReady: boolean;
  currentSupabaseUserId: string | null;
  currentUserProfile: CurrentUserProfile | null;
  refetchCurrentUserProfile: () => Promise<void>;
  currentUserIsLoggedIn: boolean;
  currentUserIsAdmin: boolean;
  tryReserveBalanceDebit: (actionKey: string, amount: number) => BalanceReservation;
  releaseBalanceDebit: (actionKey: string, amount: number) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

/**
 * Session — the signed-in user's identity plus the `user` state object that
 * the rest of the dashboard hangs off.
 *
 * Note on ownership: `useCurrentUser` is the source of truth for "who is
 * signed in and are they an admin" (routing guards use it directly). The
 * larger `UserState` object below — balance, portfolio, activeInvestments,
 * copyTrades, transactions, tickets, kyc — is a separate thing, and it lives
 * here. Each of those fields is written by an overlay effect inside the
 * domain provider that owns the underlying Supabase data, all of which call
 * `setUser` from this context.
 */
export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const supabase = useSupabaseClient();

  // Clerk identity — the profile-loader effect below needs it, and it's also
  // the source of currentSupabaseUserId.
  const { user: clerkUser, isLoaded: clerkLoaded } = useClerkUserProfile();
  const { isSignedIn: clerkIsSignedIn } = useClerkAuthState();
  const currentSupabaseUserId = clerkUser?.id ?? null;

  // Supabase-derived identity. Not the old Firebase `user.isLoggedIn` /
  // `user.isAdmin`, which are stale now that auth runs through Clerk.
  const {
    isLoggedIn: currentUserIsLoggedIn,
    isAdmin: currentUserIsAdmin,
    profile: currentUserProfile,
    refetchProfile: refetchCurrentUserProfile
  } = useCurrentUser();

  // Global user session state
  const [user, setUser] = useState<UserState>(() => {
    const saved = localStorage.getItem("orbitrio_user");
    if (saved) {
      try {
        const u = JSON.parse(saved);
        // Default role setup
        if (u.isLoggedIn && isAdminEmail(u.email)) {
          u.role = "admin";
          u.isAdmin = true;
        } else if (u.isLoggedIn && !u.role) {
          u.role = "user";
        }
        // Force migration of old active investment ids
        if (u.activeInvestments) {
          u.activeInvestments = u.activeInvestments.map((inv: any) => {
            if (inv.planId === "plan-starter") {
              return { ...inv, planId: "plan-bronze", name: "Bronze Plan" };
            }
            if (inv.planId === "plan-professional") {
              return { ...inv, planId: "plan-gold", name: "Gold Plan" };
            }
            if (inv.planId === "plan-vip") {
              return { ...inv, planId: "plan-diamond", name: "Diamond Plan" };
            }
            return inv;
          });
        }
        u.copyTrades = Array.isArray(u.copyTrades) ? u.copyTrades : [];
        u.readAnnouncementIds = Array.isArray(u.readAnnouncementIds) ? u.readAnnouncementIds : [];
        delete u.recoveryPhrase;
        return u;
      } catch (e) {}
    }
    return createLoggedOutUser();
  });
  const [authReady, setAuthReady] = useState(USE_MOCK_DATA || localDev);

  const pendingBalanceDebitsRef = useRef(0);
  const pendingActionKeysRef = useRef<Set<string>>(new Set());

  const tryReserveBalanceDebit = (actionKey: string, amount: number): BalanceReservation => {
    const debitAmount = +amount.toFixed(2);
    if (pendingActionKeysRef.current.has(actionKey)) return "duplicate";
    const availableBalance = +(user.balance - pendingBalanceDebitsRef.current).toFixed(2);
    if (availableBalance < debitAmount) return "insufficient";
    pendingActionKeysRef.current.add(actionKey);
    pendingBalanceDebitsRef.current = +(pendingBalanceDebitsRef.current + debitAmount).toFixed(2);
    return "reserved";
  };

  const releaseBalanceDebit = (actionKey: string, amount: number) => {
    globalThis.setTimeout(() => {
      pendingActionKeysRef.current.delete(actionKey);
      pendingBalanceDebitsRef.current = Math.max(0, +(pendingBalanceDebitsRef.current - amount).toFixed(2));
    }, 750);
  };

  // Persist the local user cache so a refresh has something to show
  // before the profile-loader effect below re-fetches from Supabase.
  useEffect(() => {
    localStorage.setItem("orbitrio_user", JSON.stringify(user));
  }, [user]);

  // Loads the signed-in user's profile. Identity/status/role/KYC/read-announcements
  // come from Supabase (Clerk drives sign-in state). balance, transactions,
  // activeInvestments, copyTrades, portfolio, and tickets start at zero/empty
  // here and are filled in a moment later by each field's own sync effect
  // (which now live in the domain provider that owns that data) once their
  // respective Supabase-backed hook finishes fetching.
  useEffect(() => {
    if (!clerkLoaded) return;

    if (!clerkIsSignedIn || !clerkUser) {
      setUser(createSignedOutUser());
      setAuthReady(true);
      return;
    }

    let cancelled = false;
    (async () => {
      const email = clerkUser.primaryEmailAddress?.emailAddress || "";

      await ensureUserRow(supabase, clerkUser);

      const [{ data: profileRow }, { data: kycRow }, { data: readRows }] = await Promise.all([
        supabase.from("users").select("*").eq("id", clerkUser.id).maybeSingle(),
        supabase.from("kyc_submissions").select("*").eq("user_id", clerkUser.id).maybeSingle(),
        supabase.from("user_read_announcements").select("announcement_id").eq("user_id", clerkUser.id)
      ]);

      if (cancelled) return;

      // Functional MERGE, not a full replace. This effect owns the identity /
      // profile fields (email, name, role, status, kyc, …). The money/data
      // fields — balance, portfolioValue, activeInvestments, copyTrades,
      // portfolio, transactions, tickets — are owned by their own
      // Supabase-backed overlay effects in the domain providers. Hard-resetting
      // them to 0/[] here (as this used to) races with those overlays: if an
      // overlay had already applied real data, this reset clobbered it, and the
      // overlay wouldn't re-fire (its hook data reference hadn't changed),
      // stranding the dashboard at $0. So we spread `prev` and only set profile
      // fields, letting the overlays remain the single source of truth for the
      // data fields. `balance` is seeded from the freshly-fetched profileRow
      // (and kept live afterward by the balance overlay below).
      setUser(prev => ({
        ...prev,
        isLoggedIn: true,
        email,
        name: profileRow?.name || email.split("@")[0].toUpperCase(),
        balance: typeof profileRow?.balance === "number" ? profileRow.balance : prev.balance,
        status: profileRow?.status || "active",
        role: profileRow?.role === "admin" ? "admin" : "user",
        isAdmin: profileRow?.role === "admin",
        username: profileRow?.username || email.split("@")[0],
        firstName: profileRow?.first_name || "Trader",
        lastName: profileRow?.last_name || "",
        gender: profileRow?.gender || "Male",
        phone: profileRow?.phone || "",
        accountType: profileRow?.account_type || "Bronze",
        country: profileRow?.country || "United States",
        currency: profileRow?.currency || "USD",
        connectedWalletName: profileRow?.connected_wallet_name || "",
        referralCount: profileRow?.referral_count || 0,
        points: profileRow?.points || 0,
        kyc: kycRow ? {
          idType: kycRow.id_type,
          documentType: kycRow.document_type,
          idNumber: kycRow.id_number,
          dob: kycRow.dob,
          address: kycRow.address,
          city: kycRow.city,
          country: kycRow.country,
          frontImage: kycRow.front_image,
          backImage: kycRow.back_image,
          proofOfAddressImage: kycRow.proof_of_address_image,
          submissionDate: kycRow.submission_date,
          status: kycRow.status,
          adminNotes: kycRow.admin_notes,
          rejectionReason: kycRow.rejection_reason,
          reviewedAt: kycRow.reviewed_at
        } : prev.kyc,
        readAnnouncementIds: (readRows || []).map((r: any) => r.announcement_id)
      }));
      setAuthReady(true);
    })();

    return () => { cancelled = true; };
  }, [clerkLoaded, clerkIsSignedIn, clerkUser?.id]);

  // Keep the displayed balance in sync with Supabase — without this,
  // user.balance only ever reflects whatever it was at login (a one-time
  // snapshot), and would silently go stale after every deposit,
  // withdrawal, or investment even though the database itself is correct.
  useEffect(() => {
    if (currentUserProfile) {
      setUser(prev => prev.isLoggedIn ? { ...prev, balance: currentUserProfile.balance } : prev);
    }
  }, [currentUserProfile?.balance, user.isLoggedIn]);

  return (
    <SessionContext.Provider value={{
      supabase,
      user,
      setUser,
      authReady,
      currentSupabaseUserId,
      currentUserProfile,
      refetchCurrentUserProfile,
      currentUserIsLoggedIn,
      currentUserIsAdmin,
      tryReserveBalanceDebit,
      releaseBalanceDebit
    }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used inside a SessionProvider");
  }
  return context;
};
