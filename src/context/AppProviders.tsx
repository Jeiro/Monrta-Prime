import React from "react";
import { AuditLogProvider } from "./domains/AuditLogContext";
import { SessionProvider } from "./domains/SessionContext";
import { SiteSettingsProvider } from "./domains/SiteSettingsContext";
import { AdminUsersDataProvider, AdminUsersProvider } from "./domains/AdminUsersContext";
import { WalletDataProvider, WalletProvider } from "./domains/WalletContext";
import { NotificationsProvider } from "./domains/NotificationsContext";
import { MarketsProvider } from "./domains/MarketsContext";
import { InvestmentPlansProvider } from "./domains/InvestmentPlansContext";
import { TradersProvider } from "./domains/TradersContext";
import { TradingProvider } from "./domains/TradingContext";
import { AirdropsProvider } from "./domains/AirdropsContext";
import { KycProvider } from "./domains/KycContext";
import { SupportProvider } from "./domains/SupportContext";
import { AnnouncementsProvider } from "./domains/AnnouncementsContext";

/**
 * Composes every domain provider in dependency order and is rendered once, at
 * the top of the tree, in `App.tsx`.
 *
 * Ordering rule: a provider may only read contexts declared ABOVE it here.
 * The nesting is therefore not cosmetic — it encodes which domain depends on
 * which:
 *
 *   AuditLog        no dependencies (write-only logger + local array)
 *   Session         identity + the shared `user` object; everything reads it
 *   SiteSettings    supplies the email sender identity to Notifications
 *   AdminUsersData  the users directory — notifyAdmins, the transaction
 *                   recipient fallback, the KYC reviewer and the announcement
 *                   fan-out all read it, so the raw data sits below them and
 *                   the admin handlers sit above
 *   WalletData      the transaction ledger — the admin balance editor and the
 *                   airdrop approval flow both refresh it, same reasoning
 *   Notifications   in-app notifications + transactional email; every domain
 *                   below raises them
 *   Markets         self-contained price feed
 *   Wallet          deposit/withdraw, the approval queues, and the shared
 *                   insufficient-balance modal that investments, copy trading
 *                   and trading all open
 *   AdminUsers      the admin balance/status handlers
 *   InvestmentPlans plans + active investments
 *   Traders         trader catalog + copy trading
 *   Trading         spot buy/sell; its live-mark effect reads Markets and plans
 *   Airdrops        campaigns + claims
 *   Kyc, Support, Announcements — leaves, nothing depends on them
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
              <MarketsProvider>
                <WalletProvider>
                  <AdminUsersProvider>
                    <InvestmentPlansProvider>
                      <TradersProvider>
                        <TradingProvider>
                          <AirdropsProvider>
                            <KycProvider>
                              <SupportProvider>
                                <AnnouncementsProvider>
                                  {children}
                                </AnnouncementsProvider>
                              </SupportProvider>
                            </KycProvider>
                          </AirdropsProvider>
                        </TradingProvider>
                      </TradersProvider>
                    </InvestmentPlansProvider>
                  </AdminUsersProvider>
                </WalletProvider>
              </MarketsProvider>
            </NotificationsProvider>
          </WalletDataProvider>
        </AdminUsersDataProvider>
      </SiteSettingsProvider>
    </SessionProvider>
  </AuditLogProvider>
);
