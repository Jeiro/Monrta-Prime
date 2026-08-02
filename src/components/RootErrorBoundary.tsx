import React from "react";

/**
 * Last-resort error screen.
 *
 * The build-time guard in vite.config.ts stops a deploy that is MISSING a
 * required key. This covers the other half: keys that are present but wrong
 * — a typo, a key from a different project, a rotated/expired one. Those
 * fail at render, not at build, and without a boundary React unmounts the
 * whole tree and leaves a blank white page with the real reason only in the
 * console.
 *
 * Deliberately dependency-free. It cannot use the ui/ primitives, the theme
 * context or the router, because the thing that just failed may be exactly
 * what those depend on. Colours come from the design tokens with literal
 * fallbacks, so it still renders legibly even if the stylesheet never
 * loaded.
 */

interface State {
  error: Error | null;
}

const CONFIG_HINTS = [
  "publishable key",
  "publishablekey",
  "clerk",
  "supabase",
  "@clerk",
  "invalid api key",
  "jwt",
];

function looksLikeConfigFailure(error: Error): boolean {
  const haystack = `${error.name} ${error.message}`.toLowerCase();
  return CONFIG_HINTS.some(hint => haystack.includes(hint));
}

export class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Keep the full detail in the console for whoever is debugging; the
    // rendered screen stays short and non-technical.
    console.error("Application failed to start:", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const isConfig = looksLikeConfigFailure(error);

    return (
      <div
        role="alert"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          background: "var(--mp-ground, #0A0B0E)",
          color: "var(--mp-ink, #E8EAEE)",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <div style={{ maxWidth: "34rem", width: "100%" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>
            {isConfig ? "Authentication failed to initialize" : "Something went wrong"}
          </h1>

          <p
            style={{
              marginTop: "0.75rem",
              lineHeight: 1.6,
              fontSize: "0.875rem",
              color: "var(--mp-muted, #98A0AD)",
            }}
          >
            {isConfig
              ? "The app could not start because a service it depends on rejected its configuration. This usually means an API key is set but incorrect — wrong project, typo, or rotated since the last deploy."
              : "The app hit an unexpected error while starting up."}
          </p>

          <pre
            style={{
              marginTop: "1rem",
              padding: "0.75rem 0.875rem",
              borderRadius: "0.5rem",
              border: "1px solid var(--mp-line, #24282F)",
              background: "var(--mp-surface, #131518)",
              color: "var(--mp-muted, #98A0AD)",
              fontSize: "0.75rem",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              overflowX: "auto",
            }}
          >
            {error.message || String(error)}
          </pre>

          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: "1.25rem",
              padding: "0.625rem 1.25rem",
              borderRadius: "0.5rem",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.875rem",
              background: "var(--mp-accent, #6AA5FF)",
              color: "var(--mp-ground, #0A0B0E)",
            }}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
