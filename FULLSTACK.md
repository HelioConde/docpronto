# Fullstack architecture

## Backend
Uses the shared Supabase project `pizzaria-db`.

Tables:
- `docpronto_clients`
- `docpronto_documents`
- `docpronto_items`
- `product_subscriptions`

All document and client data is owner-scoped with RLS.

## Production path
Supabase Auth, cloud proposal persistence, local import and printable/PDF output are already connected. Proposal records now include a commercial status (draft/sent/approved/rejected), with owner-only RLS and local fallback. The next production steps are reusable client records, proposal branding, plan limits and a client-facing acceptance flow.

## QA gates
Money precision, totals/discounts, reload persistence, print layout, long customer names, empty line items, mobile forms and cross-account isolation are mandatory.
