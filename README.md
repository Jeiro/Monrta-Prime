# Moneta Prime

A trading / investment platform web app: user dashboard, investment plans with maturity payouts, copy trading, crypto deposit/withdrawal, portfolio trading, airdrop claims, KYC, support tickets, notifications, and a full admin console.

## Tech stack

- **Frontend:** React + TypeScript + Vite, Tailwind CSS, React Router.
- **Auth:** [Clerk](https://clerk.com) (sign-up / sign-in / email verification / password reset). No prebuilt Clerk UI — custom forms via Clerk hooks.
- **Database + Storage:** [Supabase](https://supabase.com) (Postgres with Row-Level Security, `security definer` RPCs for anything touching balance, and Supabase Storage for deposit proofs / wallet QR codes). Clerk is configured as a Supabase third-party auth provider; the client attaches the Clerk session token to Supabase requests.
- **Transactional email:** [Resend](https://resend.com), via a server-side `/api/send-email` endpoint.
- **Server:** a small Express server (`server.ts`) that serves the Vite app and hosts the API routes (`/api/send-email`, `/api/markets`). Also deployable to Vercel (`api/*.ts` are Vercel-style handlers).

> The project was migrated off Firebase (Auth + Firestore + Storage) onto Clerk + Supabase. `MIGRATION_NOTES.md` is the authoritative record of that migration, the schema/RPC files, and every bug found and fixed — **read it before making database or auth changes.**

## Prerequisites

- Node.js 18+
- A Clerk application, a Supabase project, and a Resend account (with a verified sender domain).

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment.** Copy `.env.example` to `.env` and fill in the values:
   ```bash
   cp .env.example .env
   ```
   Required to run at all:
   - `VITE_CLERK_PUBLISHABLE_KEY` — Clerk publishable key (`pk_test_…` / `pk_live_…`).
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — Supabase project URL + anon key.

   Required for email to send (server-side):
   - `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (must be a **verified** sender — the API refuses to send otherwise).

   See `.env.example` for the full annotated list. **Never commit `.env`** (it's gitignored) and **never** put the Supabase `service_role` key or any private key in it.

3. **Set up the database.** Run the SQL migration files against your Supabase project (SQL editor), **in the order listed in `MIGRATION_NOTES.md`** (section "All the RPC SQL files … in the order they were run"). The `.sql` files in this repo root create the tables, RLS policies, storage buckets, and the `security definer` RPCs.
   > Note: a few early files (core `users` schema + `is_admin()`, the deposit/withdrawal/investment/portfolio RPCs, and the balance-protection trigger) were not preserved in the repo during the migration — `MIGRATION_NOTES.md` tracks which are present vs. need reconstruction, and the hook files in `src/hooks/data/` show exactly what each RPC is called with.

4. **Configure Clerk ↔ Supabase.** In Supabase, add Clerk as a third-party auth provider so the Clerk session JWT (`sub` = user id) is accepted by RLS policies (which key off `auth.jwt() ->> 'sub'`).

## Run locally

```bash
npm run dev
```
Serves the app at `http://localhost:5173`.

For local development you can set `VITE_LOCAL_DEV=true` (and optionally `VITE_USE_MOCK_DATA=true`); leave both `false` for production. When `VITE_LOCAL_DEV=true`, transactional email is stubbed and never actually sent.

## Build

```bash
npm run build   # vite build + esbuild-bundled server (dist/)
npm run lint    # tsc --noEmit (typecheck)
```

## Project structure

```
src/lib/supabase.ts            Supabase client (memoized on Clerk session) + storage helpers
src/hooks/useCurrentUser.ts    Identity/role hook (Clerk + Supabase) — routing guards use this
src/hooks/data/                One hook per feature (traders, transactions, investments, …):
                               the Supabase reads/writes, with no business logic
src/context/AppProviders.tsx   Composes every domain provider, rendered once in App.tsx
src/context/domains/           One context per domain — see below
src/pages/ , src/components/   UI
api/send-email.ts              Server-side Resend handler
server.ts                      Express server (dev + prod) + /api routes
*.sql                          Supabase schema / RLS / RPC migrations (see MIGRATION_NOTES.md)
```

### State: the domain contexts

State lives in `src/context/domains/`, one context per domain. Each mostly
wraps the matching hook in `src/hooks/data/` and adds the business logic —
validation, notifications, audit logging, transactional email — around it. A
component imports only the domains it uses, so it only re-renders when those
change.

| Context | Owns | Wraps |
|---|---|---|
| `SessionContext` | the `user` object, `authReady`, the Supabase client, the pending-debit reservation helpers | `useCurrentUser` |
| `AuditLogContext` | `handleLog` + the log array | — |
| `SiteSettingsContext` | `siteContent`, `appSettings` | `useSiteSettings` |
| `AdminUsersContext` | users directory, admin balance/status handlers | `useUsersDirectory` |
| `WalletContext` | deposit/withdraw, deposit wallets, approval queues, wallet feedback | `useTransactions`, `useDepositWallets`, `useWalletFeedback` |
| `NotificationsContext` | in-app notifications + transactional email dispatch | `useNotifications` |
| `MarketsContext` | live crypto/stock prices | — (polls `/api/markets`) |
| `InvestmentPlansContext` | plan catalog, active investments | `useInvestmentPlans`, `useActiveInvestments` |
| `TradersContext` | trader catalog, copy trading | `useTraders`, `useCopyTrades` |
| `TradingContext` | spot buy/sell, holdings, live marks | `usePortfolio` |
| `AirdropsContext` | campaigns + claims | `useAirdrops`, `useAirdropClaims` |
| `KycContext` | submission + admin review | `useKyc` |
| `SupportContext` | tickets, user and help-desk sides | `useSupportTickets` |
| `AnnouncementsContext` | platform bulletins | `useAnnouncements` |

`AppProviders.tsx` nests these in dependency order, and that order is
load-bearing: a provider may only read contexts mounted above it. The comment
at the top of that file explains why each one sits where it does. Two domains
(`AdminUsersContext`, `WalletContext`) export a low-level data provider
separately from their handler provider, because their raw data is needed by
domains that themselves sit below the handlers.

## Before going to production

- Switch Clerk from **development** to **production** keys.
- Set `VITE_LOCAL_DEV`, `VITE_USE_MOCK_DATA`, `VITE_MAINTENANCE_MODE` to `false` in the production environment.
- Ensure `RESEND_FROM_EMAIL` is a verified domain sender and `MONETA_PRIME_ALLOWED_ORIGINS` lists your real origin(s).
