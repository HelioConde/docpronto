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
1. Add Supabase Auth.
2. Move browser-only history into the database.
3. Persist clients, proposals and line items.
4. Generate printable/PDF output client-side or through a safe backend worker.
5. Add plan limits and branding options.

## QA gates
Money precision, totals/discounts, reload persistence, print layout, long customer names, empty line items, mobile forms and cross-account isolation are mandatory.
