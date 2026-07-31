-- ============================================================================
-- Moneta Prime — CORE SCHEMA
-- ============================================================================
-- Several existing files in this repo (support_ticket_functions.sql,
-- airdrop_claim_functions.sql, storage_buckets.sql, admin_balance_functions.sql)
-- say they "assume `users` and `is_admin()` already exist from the core schema
-- migration". That migration was never committed — it only ever existed inside
-- the original Supabase project's dashboard. This file reconstructs it.
--
-- Column names and types are derived from how the app actually reads and
-- writes each table (src/hooks/data/*.ts do the snake_case <-> camelCase
-- mapping) and from the RPCs in the other .sql files.
--
-- Identity model: auth is Clerk, not Supabase Auth. The Clerk session JWT is
-- handed to PostgREST, so the caller's id is auth.jwt()->>'sub' — a TEXT
-- value, which is why every user id column here is text rather than uuid.
--
-- Run this FIRST, before any other .sql file in this repo.
-- ============================================================================

-- ── users ───────────────────────────────────────────────────────────────────
-- id matches the Clerk user id. Created by ensureUserRow()/createUserProfile()
-- in src/lib/supabase.ts on first sign-in.
create table if not exists users (
  id                    text primary key,
  email                 text not null default '',
  name                  text not null default '',
  username              text,
  first_name            text,
  last_name             text,
  gender                text,
  phone                 text,
  account_type          text default 'Bronze',
  country               text,
  currency              text default 'USD',
  balance               numeric not null default 0 check (balance >= 0),
  portfolio_value       numeric not null default 0,
  status                text not null default 'active' check (status in ('active','suspended','banned')),
  role                  text not null default 'user' check (role in ('admin','user')),
  connected_wallet_name text,
  referral_count        integer not null default 0,
  points                integer not null default 0,
  registration_date     timestamptz not null default now()
);

create index if not exists users_email_idx on users(email);
create index if not exists users_role_idx  on users(role);

-- is_admin() must come AFTER users: it is a `language sql` function, whose
-- body Postgres parses and validates at CREATE time. Defining it first fails
-- with `relation "public.users" does not exist`.
-- ── is_admin() ──────────────────────────────────────────────────────────────
-- Referenced by policies in investment_plan_functions.sql, airdrop_claim_
-- functions.sql, notification_functions.sql, support_ticket_functions.sql and
-- storage_buckets.sql, and by the guard in admin_balance_functions.sql.
-- SECURITY DEFINER so it can read users.role without the caller needing a
-- select policy on that row, and so it cannot recurse into users' own RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'admin' from public.users where id = auth.jwt()->>'sub'),
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;




alter table users enable row level security;

drop policy if exists "users_select_own_or_admin" on users;
create policy "users_select_own_or_admin" on users
  for select using (id = auth.jwt()->>'sub' or public.is_admin());

-- Insert is the sign-in upsert: a user may only create their own row.
drop policy if exists "users_insert_own" on users;
create policy "users_insert_own" on users
  for insert with check (id = auth.jwt()->>'sub');

-- NOTE: balance/role/status are deliberately NOT protected by this policy —
-- Postgres RLS cannot restrict *which columns* an update touches. Every
-- balance mutation goes through a SECURITY DEFINER RPC instead
-- (admin_update_user_balance, approve_deposit_transaction, ...). If a client
-- ever writes users.balance directly, that is a privilege-escalation bug.
drop policy if exists "users_update_own_or_admin" on users;
create policy "users_update_own_or_admin" on users
  for update using (id = auth.jwt()->>'sub' or public.is_admin());

drop policy if exists "users_delete_admin" on users;
create policy "users_delete_admin" on users
  for delete using (public.is_admin());


-- ── transactions ────────────────────────────────────────────────────────────
create table if not exists transactions (
  id                    text primary key,
  user_id               text not null references users(id) on delete cascade,
  user_email            text,
  user_name             text,
  type                  text not null check (type in ('deposit','withdrawal','investment','payout','adjustment')),
  amount                numeric not null,
  currency              text default 'USD',
  status                text not null default 'pending' check (status in ('completed','pending','failed','rejected','approved')),
  asset                 text default '',
  related_reference_id  text,
  occurred_at           timestamptz not null default now(),
  address               text,
  tx_hash               text,
  proof_file            text,
  notes                 text,
  destination_tag       text,
  bank_details          jsonb,
  paypal_email          text
);

create index if not exists transactions_user_id_idx     on transactions(user_id);
create index if not exists transactions_status_idx      on transactions(status);
create index if not exists transactions_occurred_at_idx on transactions(occurred_at desc);

alter table transactions enable row level security;

drop policy if exists "transactions_select_own_or_admin" on transactions;
create policy "transactions_select_own_or_admin" on transactions
  for select using (user_id = auth.jwt()->>'sub' or public.is_admin());

-- No insert/update/delete policies on purpose. Every write goes through a
-- SECURITY DEFINER RPC (create_withdrawal_transaction, approve_deposit_
-- transaction, ...) so amounts and statuses can't be forged client-side.
drop policy if exists "transactions_admin_write" on transactions;
create policy "transactions_admin_write" on transactions
  for all using (public.is_admin()) with check (public.is_admin());


-- ── active_investments ──────────────────────────────────────────────────────
create table if not exists active_investments (
  id                     text primary key,
  user_id                text not null references users(id) on delete cascade,
  plan_id                text,
  name                   text not null default '',
  amount                 numeric not null check (amount > 0),
  start_date             timestamptz not null default now(),
  end_date               timestamptz,
  roi_percent            numeric,
  expected_profit        numeric,
  total_return           numeric,
  remaining_days         integer,
  accumulated_profit     numeric not null default 0,
  status                 text not null default 'Running',
  progress               numeric not null default 0,
  daily_roi_percent      numeric,
  completed_at           timestamptz,
  payout_transaction_id  text
);

create index if not exists active_investments_user_id_idx on active_investments(user_id);
create index if not exists active_investments_status_idx  on active_investments(status);

alter table active_investments enable row level security;

drop policy if exists "active_investments_select_own_or_admin" on active_investments;
create policy "active_investments_select_own_or_admin" on active_investments
  for select using (user_id = auth.jwt()->>'sub' or public.is_admin());

drop policy if exists "active_investments_admin_write" on active_investments;
create policy "active_investments_admin_write" on active_investments
  for all using (public.is_admin()) with check (public.is_admin());


-- ── copy_trades ─────────────────────────────────────────────────────────────
create table if not exists copy_trades (
  id                     text primary key,
  user_id                text not null references users(id) on delete cascade,
  trader_id              text,
  trader_name            text not null default '',
  amount_invested        numeric not null check (amount_invested > 0),
  roi_percent            numeric not null default 0,
  expected_profit        numeric not null default 0,
  total_return           numeric not null default 0,
  start_timestamp        timestamptz not null default now(),
  end_timestamp          timestamptz,
  remaining_days         integer,
  status                 text not null default 'Running' check (status in ('Running','Completed','Cancelled')),
  payout_completed       boolean not null default false,
  progress               numeric not null default 0,
  completed_at           timestamptz,
  payout_transaction_id  text,
  -- The hook orders by created_at, not start_timestamp
  -- (src/hooks/data/useCopyTrades.ts).
  created_at             timestamptz not null default now()
);

create index if not exists copy_trades_user_id_idx on copy_trades(user_id);
create index if not exists copy_trades_status_idx  on copy_trades(status);

alter table copy_trades enable row level security;

drop policy if exists "copy_trades_select_own_or_admin" on copy_trades;
create policy "copy_trades_select_own_or_admin" on copy_trades
  for select using (user_id = auth.jwt()->>'sub' or public.is_admin());

drop policy if exists "copy_trades_admin_write" on copy_trades;
create policy "copy_trades_admin_write" on copy_trades
  for all using (public.is_admin()) with check (public.is_admin());


-- ── portfolio_assets ────────────────────────────────────────────────────────
-- One row per (user, symbol); buy_asset/sell_asset RPCs maintain it.
create table if not exists portfolio_assets (
  user_id        text not null references users(id) on delete cascade,
  symbol         text not null,
  name           text not null default '',
  amount         numeric not null default 0 check (amount >= 0),
  avg_buy_price  numeric not null default 0,
  current_price  numeric not null default 0,
  type           text not null default 'crypto' check (type in ('crypto','stock')),
  primary key (user_id, symbol)
);

alter table portfolio_assets enable row level security;

drop policy if exists "portfolio_assets_select_own_or_admin" on portfolio_assets;
create policy "portfolio_assets_select_own_or_admin" on portfolio_assets
  for select using (user_id = auth.jwt()->>'sub' or public.is_admin());

drop policy if exists "portfolio_assets_admin_write" on portfolio_assets;
create policy "portfolio_assets_admin_write" on portfolio_assets
  for all using (public.is_admin()) with check (public.is_admin());


-- ── traders (copy-trading catalog) ──────────────────────────────────────────
create table if not exists traders (
  id                       text primary key,
  name                     text not null,
  avatar                   text default '',
  active                   boolean not null default true,
  featured                 boolean not null default false,
  country                  text,
  trading_style            text,
  markets                  text,
  min_copy_amount          numeric default 0,
  max_copy_amount          numeric,
  biography                text,
  display_order            integer not null default 0,
  roi                      numeric not null default 0,
  win_rate                 numeric not null default 0,
  followers                integer not null default 0,
  max_followers            integer not null default 0,
  assets_under_management  text default '',
  risk_score               integer not null default 1,
  profit_days              integer not null default 0,
  chart_data               jsonb not null default '[]'::jsonb
);

alter table traders enable row level security;

-- Public read: the copy-trading page is visible signed-out.
drop policy if exists "traders_select" on traders;
create policy "traders_select" on traders for select using (true);

drop policy if exists "traders_admin_write" on traders;
create policy "traders_admin_write" on traders
  for all using (public.is_admin()) with check (public.is_admin());


-- ── airdrops ────────────────────────────────────────────────────────────────
-- Must exist before airdrop_claim_functions.sql (airdrop_claims references it).
create table if not exists airdrops (
  id             text primary key,
  title          text not null,
  token          text not null,
  reward_amount  text not null default '',
  status         text not null default 'active',
  enabled        boolean not null default true,
  claim_limit    integer,
  start_date     timestamptz,
  end_date       timestamptz,
  eligibility    text,
  description    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table airdrops enable row level security;

drop policy if exists "airdrops_select" on airdrops;
create policy "airdrops_select" on airdrops for select using (true);

drop policy if exists "airdrops_admin_write" on airdrops;
create policy "airdrops_admin_write" on airdrops
  for all using (public.is_admin()) with check (public.is_admin());


-- ── announcements ───────────────────────────────────────────────────────────
create table if not exists announcements (
  id              text primary key,
  title           text not null,
  content         text not null default '',
  date            timestamptz not null default now(),
  pinned          boolean not null default false,
  enabled         boolean not null default true,
  priority        text not null default 'Normal' check (priority in ('Normal','Important','Critical')),
  publish_date    timestamptz,
  expiry_date     timestamptz,
  scheduled_date  timestamptz,
  updated_at      timestamptz not null default now()
);

alter table announcements enable row level security;

drop policy if exists "announcements_select" on announcements;
create policy "announcements_select" on announcements for select using (true);

drop policy if exists "announcements_admin_write" on announcements;
create policy "announcements_admin_write" on announcements
  for all using (public.is_admin()) with check (public.is_admin());


-- ── user_read_announcements ─────────────────────────────────────────────────
-- Upserted with onConflict "user_id,announcement_id" (src/context/AppContext.tsx),
-- so that pair needs to be the conflict target.
create table if not exists user_read_announcements (
  user_id          text not null references users(id) on delete cascade,
  announcement_id  text not null references announcements(id) on delete cascade,
  read_at          timestamptz not null default now(),
  primary key (user_id, announcement_id)
);

alter table user_read_announcements enable row level security;

drop policy if exists "user_read_announcements_own" on user_read_announcements;
create policy "user_read_announcements_own" on user_read_announcements
  for all using (user_id = auth.jwt()->>'sub' or public.is_admin())
  with check (user_id = auth.jwt()->>'sub');


-- ── kyc_submissions ─────────────────────────────────────────────────────────
-- Read with .eq("user_id", ...).maybeSingle() — one submission per user.
create table if not exists kyc_submissions (
  user_id                   text primary key references users(id) on delete cascade,
  id_type                   text,
  document_type             text,
  id_number                 text,
  dob                       text,
  address                   text,
  city                      text,
  country                   text,
  front_image               text,
  back_image                text,
  proof_of_address_image    text,
  submission_date           timestamptz not null default now(),
  status                    text not null default 'pending' check (status in ('unverified','pending','approved','rejected')),
  admin_notes               text,
  rejection_reason          text,
  reviewed_at               timestamptz
);

create index if not exists kyc_submissions_status_idx on kyc_submissions(status);

alter table kyc_submissions enable row level security;

drop policy if exists "kyc_submissions_select_own_or_admin" on kyc_submissions;
create policy "kyc_submissions_select_own_or_admin" on kyc_submissions
  for select using (user_id = auth.jwt()->>'sub' or public.is_admin());

drop policy if exists "kyc_submissions_insert_own" on kyc_submissions;
create policy "kyc_submissions_insert_own" on kyc_submissions
  for insert with check (user_id = auth.jwt()->>'sub');

-- A user may resubmit their own KYC; only an admin can change the verdict.
drop policy if exists "kyc_submissions_update_own_or_admin" on kyc_submissions;
create policy "kyc_submissions_update_own_or_admin" on kyc_submissions
  for update using (user_id = auth.jwt()->>'sub' or public.is_admin());


-- ── deposit_wallets ─────────────────────────────────────────────────────────
create table if not exists deposit_wallets (
  id                    text primary key,
  coin_name             text not null,
  network               text not null default '',
  wallet_address        text not null,
  qr_code_url           text default '',
  minimum_deposit       numeric not null default 0,
  enabled               boolean not null default true,
  display_order         integer not null default 0,
  deposit_instructions  text default ''
);

alter table deposit_wallets enable row level security;

-- Signed-in users need these to deposit; the addresses are meant to be shown.
drop policy if exists "deposit_wallets_select" on deposit_wallets;
create policy "deposit_wallets_select" on deposit_wallets for select using (true);

drop policy if exists "deposit_wallets_admin_write" on deposit_wallets;
create policy "deposit_wallets_admin_write" on deposit_wallets
  for all using (public.is_admin()) with check (public.is_admin());


-- ── wallet_feedback ─────────────────────────────────────────────────────────
create table if not exists wallet_feedback (
  id           text primary key,
  -- The hook inserts user_id and, for non-admins, filters on it
  -- (src/hooks/data/useWalletFeedback.ts) — not just the email.
  user_id      text references users(id) on delete cascade,
  user_email   text not null default '',
  user_name    text not null default '',
  wallet       text not null default '',
  reason       text default '',
  would_use    boolean not null default false,
  status       text not null default 'new' check (status in ('new','reviewed')),
  admin_notes  text,
  created_at   timestamptz not null default now()
);

create index if not exists wallet_feedback_user_id_idx on wallet_feedback(user_id);

alter table wallet_feedback enable row level security;

drop policy if exists "wallet_feedback_insert_own" on wallet_feedback;
create policy "wallet_feedback_insert_own" on wallet_feedback
  for insert with check (user_id = auth.jwt()->>'sub');

-- Users read their own submissions; admins read all. An admin-only select
-- policy would have made the user's own list silently return zero rows.
drop policy if exists "wallet_feedback_select_own_or_admin" on wallet_feedback;
create policy "wallet_feedback_select_own_or_admin" on wallet_feedback
  for select using (user_id = auth.jwt()->>'sub' or public.is_admin());

drop policy if exists "wallet_feedback_admin_write" on wallet_feedback;
create policy "wallet_feedback_admin_write" on wallet_feedback
  for all using (public.is_admin()) with check (public.is_admin());


-- ── app_settings / site_content ─────────────────────────────────────────────
-- Singleton key/value rows. The app upserts { key, value } with
-- onConflict "key" (src/hooks/data/useSiteSettings.ts): key 'business' for
-- app_settings, key 'texts' for site_content.
create table if not exists app_settings (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table app_settings enable row level security;

drop policy if exists "app_settings_select" on app_settings;
create policy "app_settings_select" on app_settings for select using (true);

drop policy if exists "app_settings_admin_write" on app_settings;
create policy "app_settings_admin_write" on app_settings
  for all using (public.is_admin()) with check (public.is_admin());

create table if not exists site_content (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table site_content enable row level security;

drop policy if exists "site_content_select" on site_content;
create policy "site_content_select" on site_content for select using (true);

drop policy if exists "site_content_admin_write" on site_content;
create policy "site_content_admin_write" on site_content
  for all using (public.is_admin()) with check (public.is_admin());
