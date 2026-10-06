alter table public.docpronto_clients
  add column if not exists name_key text
  generated always as (lower(trim(name))) stored;

create unique index if not exists docpronto_clients_user_name_key_uq
  on public.docpronto_clients (user_id, name_key);

revoke all privileges on table public.docpronto_clients from public, anon, authenticated;
grant select, insert, update, delete on table public.docpronto_clients to authenticated;
