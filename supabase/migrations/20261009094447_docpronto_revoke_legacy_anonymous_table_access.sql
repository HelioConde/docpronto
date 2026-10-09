-- Applied to shared Supabase project pizzaria-db on 2026-10-09.
-- Existing RLS already restricts access by owner. Legacy tables inadvertently
-- retained direct anonymous CRUD privileges, even though the app's public
-- proposal workflow is handled only by restricted server-side Edge Functions.
-- Preserve authenticated owner and service_role access.
REVOKE ALL PRIVILEGES ON TABLE public.docpronto_documents, public.docpronto_items FROM anon;
