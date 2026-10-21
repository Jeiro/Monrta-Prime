import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('gift-card migration and real approval RPCs protect evidence and credit only once', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role authenticated; create role anon;
      create schema auth; create schema storage;
      create function auth.jwt() returns jsonb language sql stable as
        $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
      create function storage.foldername(name text) returns text[] language sql immutable as
        $$ select string_to_array(name,'/') $$;
      create table public.users(id text primary key,email text,name text,role text,balance numeric default 0);
      create function public.is_admin() returns boolean language sql stable security definer set search_path='' as
        $$ select exists(select 1 from public.users where id=auth.jwt()->>'sub' and role='admin') $$;
      create table public.transactions(id text primary key,user_id text,type text,amount numeric,currency text,status text,notes text);
      alter table public.transactions enable row level security;
      create policy own_read on public.transactions for select to authenticated using(user_id=auth.jwt()->>'sub' or public.is_admin());
      create policy admin_write on public.transactions for all to authenticated using(public.is_admin()) with check(public.is_admin());
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(bucket_id text,name text,primary key(bucket_id,name));
      alter table storage.objects enable row level security;
      grant usage on schema auth,storage,public to authenticated;
      grant select,insert,update,delete on public.transactions,storage.objects to authenticated;
      grant select on public.users to authenticated;
    `);
    const migration=await readFile(new URL('../gift_card_deposits.sql',import.meta.url),'utf8');
    await db.exec(migration); await db.exec(migration);
    const rpc=await readFile(new URL('../transaction_functions.sql',import.meta.url),'utf8');
    await db.exec(rpc.slice(0,rpc.indexOf('-- User requests a withdrawal')));
    await db.exec(await readFile(new URL('./gift-card-database.sql',import.meta.url),'utf8'));
    assert.equal((await db.query('select * from public.users')).rows.length,0,'Fixture rolled back');
  } finally {await db.close();}
});
