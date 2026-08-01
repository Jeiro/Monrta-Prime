import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

/**
 * Theme state.
 *
 * The initial value is NOT computed here — the inline script in index.html
 * has already resolved it and stamped `data-theme` on <html> before first
 * paint. This provider reads that back so React and the DOM start in
 * agreement; recomputing it would risk a mismatch and a visible flash.
 *
 * "system" is a real, persisted third state rather than the absence of a
 * choice: a user who never touches the toggle should keep following their
 * OS when it flips at sunset, and a user who explicitly picked dark should
 * not have it flip out from under them.
 */

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "mp-theme";

interface ThemeContextValue {
  /** What the user chose. May be "system". */
  preference: ThemePreference;
  /** What is actually on screen. Never "system". */
  theme: ResolvedTheme;
  setPreference: (next: ThemePreference) => void;
  /** Flips between light and dark, resolving "system" to its opposite. */
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const prefersLight = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches;

function readStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* Storage blocked (private mode, embedded webview) — follow the OS. */
  }
  return "system";
}

function resolve(preference: ThemePreference): ResolvedTheme {
  if (preference === "system") return prefersLight() ? "light" : "dark";
  return preference;
}

/** Keeps the address-bar / status-bar colour in step with the surface. */
function syncMetaThemeColor(theme: ResolvedTheme) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "light" ? "#F7F8FA" : "#0A0B0E");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference);
  const [theme, setTheme] = useState<ResolvedTheme>(() => resolve(readStoredPreference()));

  // Apply to the DOM. The inline bootstrap already did this for the first
  // paint, so on mount this is a no-op write — it only does real work on
  // subsequent changes.
  useEffect(() => {
    const next = resolve(preference);
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    syncMetaThemeColor(next);
  }, [preference]);

  // Follow the OS live, but only while the user is actually on "system".
  useEffect(() => {
    if (preference !== "system") return;
    const query = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      const next: ResolvedTheme = query.matches ? "light" : "dark";
      setTheme(next);
      document.documentElement.setAttribute("data-theme", next);
      syncMetaThemeColor(next);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    try {
      // "system" is stored as absence, so a user who returns to system
      // tracking keeps tracking it on their next visit.
      if (next === "system") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* Non-fatal: the theme still applies for this session. */
    }
  }, []);

  const toggle = useCallback(() => {
    setPreference(resolve(preference) === "dark" ? "light" : "dark");
  }, [preference, setPreference]);

  return (
    <ThemeContext.Provider value={{ preference, theme, setPreference, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
