alter table public.docpronto_proposals
  add column if not exists share_token_hash text,
  add column if not exists responded_at timestamptz;

alter table public.docpronto_proposals
  drop constraint if exists docpronto_proposals_share_token_hash_check;

alter table public.docpronto_proposals
  add constraint docpronto_proposals_share_token_hash_check
  check (share_token_hash is null or share_token_hash ~ '^[0-9a-f]{64}$');

create index if not exists docpronto_proposals_share_token_idx
  on public.docpronto_proposals (id, share_token_hash)
  where share_token_hash is not null;
