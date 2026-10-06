import { createClient } from "npm:@supabase/supabase-js@2.117.2";

const allowedOrigins = new Set([
  "https://helioconde.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
]);

function corsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
  if (origin && allowedOrigins.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}
function responseHeaders(origin: string | null) {
  return {
    ...corsHeaders(origin),
    "Content-Type": "application/json",
    "Cache-Control": "no-store, max-age=0",
    "Pragma": "no-cache",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  };
}
function json(status: number, body: Record<string, unknown>, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: responseHeaders(origin) });
}
function todayInSaoPaulo() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find(part => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
function isExpired(validUntil: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(validUntil) && validUntil < todayInSaoPaulo();
}
async function hashText(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}
function getSecretKey() {
  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (secretKeys) {
    try {
      const parsed: unknown = JSON.parse(secretKeys);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const key = (parsed as Record<string, unknown>).default;
        if (typeof key === "string" && key) return key;
      }
    } catch {}
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin");
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (request.method !== "POST") return json(405, { error: "Método não permitido." }, origin);
  if (origin && !allowedOrigins.has(origin)) return json(403, { error: "Origem não permitida." }, origin);

  let input: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return json(400, { error: "Pedido inválido." }, origin);
    input = parsed as Record<string, unknown>;
  } catch {
    return json(400, { error: "Pedido inválido." }, origin);
  }

  const proposalId = typeof input.proposalId === "string" ? input.proposalId.trim() : "";
  const token = typeof input.token === "string" ? input.token.trim() : "";
  if (!/^[0-9a-f-]{36}$/i.test(proposalId) || !/^[A-Za-z0-9_-]{32}$/.test(token)) {
    return json(400, { error: "Link inválido." }, origin);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const key = getSecretKey();
  if (!url || !key) return json(503, { error: "Serviço indisponível." }, origin);
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data, error } = await client
    .from("docpronto_proposals")
    .select("id,proposal_number,business_name,client_name,total,status,proposal_data,created_at,responded_at,share_token_hash")
    .eq("id", proposalId)
    .eq("share_token_hash", await hashText(token))
    .maybeSingle();

  if (error) return json(503, { error: "Não foi possível abrir a proposta." }, origin);
  if (!data) return json(404, { error: "Proposta indisponível." }, origin);

  const p = data.proposal_data && typeof data.proposal_data === "object" ? data.proposal_data : {};
  const validUntil = typeof p.validUntil === "string" ? p.validUntil : "";
  return json(200, {
    id: data.id,
    number: data.proposal_number,
    business: data.business_name,
    client: data.client_name,
    total: Number(data.total),
    status: data.status,
    createdAt: data.created_at,
    respondedAt: data.responded_at,
    items: Array.isArray(p.items) ? p.items : [],
    deadline: typeof p.deadline === "string" ? p.deadline : "",
    terms: typeof p.terms === "string" ? p.terms : "",
    businessPhone: typeof p.businessPhone === "string" ? p.businessPhone : "",
    validUntil,
    expired: Boolean(validUntil && isExpired(validUntil)),
  }, origin);
});
