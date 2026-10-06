alter table public.docpronto_proposals
  add column if not exists status text not null default 'draft';

alter table public.docpronto_proposals
  drop constraint if exists docpronto_proposals_status_check;

alter table public.docpronto_proposals
  add constraint docpronto_proposals_status_check
  check (status in ('draft', 'sent', 'approved', 'rejected'));

create index if not exists docpronto_proposals_owner_status_updated_idx
  on public.docpronto_proposals (owner_id, status, updated_at desc);
