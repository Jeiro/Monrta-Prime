import React from "react";
import { AuditLogProvider } from "./domains/AuditLogContext";
import { SessionProvider } from "./domains/SessionContext";
import { SiteSettingsProvider } from "./domains/SiteSettingsContext";
import { AdminUsersDataProvider, AdminUsersProvider } from "./domains/AdminUsersContext";
import { WalletDataProvider, WalletProvider } from "./domains/WalletContext";
import { NotificationsProvider } from "./domains/NotificationsContext";
import { AppProvider } from "./AppContext";

/**
 * Composes every domain provider in dependency order and is rendered once,
 * at the top of the tree, in `App.tsx`.
 *
 * Ordering rule: a provider may only read contexts declared ABOVE it here.
 * The nesting is therefore not cosmetic — it encodes which domain depends on
 * which:
 *
 *   AuditLog        no dependencies (write-only logger + local array)
 *   Session         identity + the shared `user` object; everything reads it
 *   SiteSettings    supplies the email sender identity to Notifications
 *   AdminUsersData  the users directory — notifyAdmins and the transaction
 *                   recipient fallback both need it, so the raw data sits
 *                   below them and the admin handlers sit above
 *   WalletData      the transaction ledger — the admin balance editor and the
 *                   airdrop approval flow both refresh it, same reasoning
 *   Notifications   in-app notifications + transactional email; every domain
 *                   below raises them
 *   Wallet          deposit/withdraw + the approval queues
 *   AdminUsers      the admin balance/status handlers
 *
 * The `children` element is created here, once, so a re-render inside any one
 * provider does not cascade into the providers nested below it — that
 * isolation is the whole point of the split.
 */
export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuditLogProvider>
    <SessionProvider>
      <SiteSettingsProvider>
        <AdminUsersDataProvider>
          <WalletDataProvider>
            <NotificationsProvider>
              <WalletProvider>
                <AdminUsersProvider>
                  <AppProvider>
                    {children}
                  </AppProvider>
                </AdminUsersProvider>
              </WalletProvider>
            </NotificationsProvider>
          </WalletDataProvider>
        </AdminUsersDataProvider>
      </SiteSettingsProvider>
    </SessionProvider>
  </AuditLogProvider>
);
