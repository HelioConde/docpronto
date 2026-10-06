create table public.docpronto_proposals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  proposal_number text not null,
  business_name text not null,
  client_name text not null,
  total numeric(12, 2) not null default 0 check (total >= 0),
  proposal_data jsonb not null check (jsonb_typeof(proposal_data) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index docpronto_proposals_owner_created_idx
  on public.docpronto_proposals (owner_id, created_at desc);

alter table public.docpronto_proposals enable row level security;

revoke all on table public.docpronto_proposals from anon;
grant select, insert, update, delete on table public.docpronto_proposals to authenticated;

create policy "DocPronto users read their proposals"
  on public.docpronto_proposals for select to authenticated
  using ((select auth.uid()) = owner_id);

create policy "DocPronto users create their proposals"
  on public.docpronto_proposals for insert to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "DocPronto users update their proposals"
  on public.docpronto_proposals for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "DocPronto users delete their proposals"
  on public.docpronto_proposals for delete to authenticated
  using ((select auth.uid()) = owner_id);