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
  const decision = input.decision === "approved" || input.decision === "rejected" ? input.decision : "";
  const acceptedBy = decision === "approved" && typeof input.acceptedBy === "string"
    ? input.acceptedBy.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 100)
    : "";
  if (!/^[0-9a-f-]{36}$/i.test(proposalId) || !/^[A-Za-z0-9_-]{32}$/.test(token) || !decision) {
    return json(400, { error: "Resposta inválida." }, origin);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const key = getSecretKey();
  if (!url || !key) return json(503, { error: "Serviço indisponível." }, origin);
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const tokenHash = await hashText(token);

  const { data: current, error: readError } = await client
    .from("docpronto_proposals")
    .select("id,status,proposal_data")
    .eq("id", proposalId)
    .eq("share_token_hash", tokenHash)
    .maybeSingle();
  if (readError) return json(503, { error: "Não foi possível responder agora." }, origin);
  if (!current) return json(404, { error: "Proposta indisponível." }, origin);
  if (current.status !== "sent") return json(409, { error: "Esta proposta já recebeu uma resposta ou foi alterada." }, origin);

  const validUntil = typeof current.proposal_data?.validUntil === "string" ? current.proposal_data.validUntil : "";
  if (validUntil && isExpired(validUntil)) {
    return json(410, { error: "Esta proposta expirou." }, origin);
  }

  const proposalData = current.proposal_data && typeof current.proposal_data === "object"
    ? current.proposal_data
    : {};
  const allowedStatuses = new Set(["draft", "sent", "approved", "rejected"]);
  const existingHistory = Array.isArray(proposalData.statusHistory)
    ? proposalData.statusHistory
      .filter((entry: unknown) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
        const item = entry as Record<string, unknown>;
        return typeof item.status === "string"
          && allowedStatuses.has(item.status)
          && Number.isFinite(Number(item.at));
      })
      .map((entry: Record<string, unknown>) => ({
        status: String(entry.status),
        at: Number(entry.at),
        source: entry.source === "client" ? "client" : "owner",
      }))
      .slice(-19)
    : [];

  const respondedAt = new Date();
  const statusHistory = [
    ...existingHistory,
    { status: decision, at: respondedAt.getTime(), source: "client" },
  ].slice(-20);
  const updatedProposalData = {
    ...proposalData,
    status: decision,
    respondedAt: respondedAt.getTime(),
    acceptedBy,
    statusHistory,
  };

  const { data, error } = await client
    .from("docpronto_proposals")
    .update({
      status: decision,
      responded_at: respondedAt.toISOString(),
      proposal_data: updatedProposalData,
      updated_at: respondedAt.toISOString(),
    })
    .eq("id", proposalId)
    .eq("share_token_hash", tokenHash)
    .eq("status", "sent")
    .select("id,status,responded_at")
    .maybeSingle();

  if (error) return json(503, { error: "Não foi possível salvar a resposta." }, origin);
  if (!data) return json(409, { error: "A proposta foi alterada antes da sua resposta." }, origin);
  return json(200, { status: data.status, respondedAt: data.responded_at, acceptedBy }, origin);
});
