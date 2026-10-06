/* Somente chave publishable: nunca coloque service_role ou secret keys no navegador. */
window.DOC_PRONTO_SUPABASE = {
  url: "https://bnlvvsjgpywpbfhwdcan.supabase.co",
  publishableKey: "sb_publishable_8q954VgGB7IUEgwWYA55-Q_MUyDd17c"
};
if (window.supabase?.createClient && window.DOC_PRONTO_SUPABASE?.url && window.DOC_PRONTO_SUPABASE?.publishableKey) {
  window.DOC_PRONTO_SUPABASE.client = window.supabase.createClient(
    window.DOC_PRONTO_SUPABASE.url,
    window.DOC_PRONTO_SUPABASE.publishableKey,
    { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
  );
}