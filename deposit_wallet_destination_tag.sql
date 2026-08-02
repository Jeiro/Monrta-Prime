-- Adds a destination tag to deposit wallets.
--
-- Some coins — XRP most commonly, also XLM, EOS, ATOM and others — share one
-- custodial address across every user, and attribute an incoming payment by a
-- destination tag / memo sent alongside it. Without a tag on the record there
-- was no way for an admin to publish a real one, so the deposit screen could
-- only tell the user to contact support. A deposit sent to a shared XRP
-- address with no tag (or a wrong one) is not automatically creditable.
--
-- Deliberately nullable, defaulting to ''. Most coins do not use a tag and
-- must stay blank: the deposit UI keys off "is this empty?" to decide between
-- showing the real tag and falling back to the contact-support message. A
-- non-empty default would defeat that and republish the exact class of bug
-- this fixes — a tag shown to users that belongs to nobody.
--
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- ORDERING: this must be applied BEFORE the app code that reads/writes
-- `destination_tag` is deployed. The admin wallet form upserts the full row,
-- so against a database without this column every deposit-wallet save fails
-- with PGRST204 (column not found in schema cache).

alter table deposit_wallets
  add column if not exists destination_tag text default '';

-- PostgREST caches the schema; without this the new column stays invisible to
-- the API until the next restart.
notify pgrst, 'reload schema';
