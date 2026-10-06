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
Supabase Auth, cloud proposal persistence, local import and printable/PDF output are connected. Proposal records include commercial status (draft/sent/approved/rejected), owner-only RLS and local fallback. Authenticated owners can generate a one-time public client link: only a SHA-256 hash is stored, public Edge Functions expose a sanitized proposal view, and the client can approve or reject without an account. Reusable client records are now connected: authenticated users automatically keep a private client list and can reuse contact data in new proposals. Next steps are proposal branding, plan limits and notification/reminder flows.

## QA gates
Money precision, totals/discounts, reload persistence, print layout, long customer names, empty line items, mobile forms and cross-account isolation are mandatory.
