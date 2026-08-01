import React from "react";
import { AuditLogProvider } from "./domains/AuditLogContext";
import { SessionProvider } from "./domains/SessionContext";
import { AppProvider } from "./AppContext";

/**
 * Composes every domain provider in dependency order and is rendered once,
 * at the top of the tree, in `App.tsx`.
 *
 * Ordering rule: a provider may only read contexts declared ABOVE it here.
 * The nesting below is therefore not cosmetic — it encodes which domain
 * depends on which. Roughly:
 *
 *   AuditLog    — no dependencies at all (write-only logger + local array)
 *   Session     — identity + the shared `user` object; everything else reads it
 *   …domains…   — each owns one slice, and calls `setUser` for its own field
 *
 * The `children` element is created here, once, so a re-render inside any one
 * provider does not cascade into the providers nested below it — that
 * isolation is the whole point of the split.
 */
export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuditLogProvider>
    <SessionProvider>
      <AppProvider>
        {children}
      </AppProvider>
    </SessionProvider>
  </AuditLogProvider>
);
