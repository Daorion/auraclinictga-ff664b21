// Aurora Safety Net — pg_cron a cada 2 min.
// Encontra conversas em que a última mensagem foi INBOUND, tem 90s+ sem resposta,
// AI habilitada, sem takeover ativo, contato não bloqueado — e re-dispara a
// geração de resposta via aura-webhook (modo _safety_resume). Zero custo de IA
// aqui: só SELECT no banco. A IA só é chamada se realmente houver mensagem órfã.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("AURA_WEBHOOK_SECRET") ?? "";
const CRON_SECRET = Deno.env.get("AURORA_CRON_SECRET") ?? "";

const MIN_AGE_MS = 90_000;        // só considera inbounds com 90s+ (evita corrida com debounce vivo)
const MAX_AGE_MS = 30 * 60_000;   // ignora >30min (provavelmente já perdido/humano vai tratar)
const MAX_PER_RUN = 5;            // trava de segurança pra não estourar em picos

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Auth: aceita pg_cron via header x-cron-secret OU chamada manual com service role.
  const cronHeader = req.headers.get("x-cron-secret") ?? "";
  const authHeader = req.headers.get("authorization") ?? "";
  const ok = (CRON_SECRET && cronHeader === CRON_SECRET) || authHeader.includes(SERVICE_KEY);
  if (!ok) return json({ error: "unauthorized" }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const now = Date.now();
  const cutoffOld = new Date(now - MIN_AGE_MS).toISOString();
  const cutoffTooOld = new Date(now - MAX_AGE_MS).toISOString();

  // Busca conversas candidatas: última msg inbound, sem outbound depois,
  // AI ativa, sem takeover, contato não bloqueado.
  const { data: convs, error } = await admin
    .from("conversations")
    .select("id, contact_id, ai_enabled, human_takeover_until, last_message_at, contacts:contact_id(aurora_blocked)")
    .eq("ai_enabled", true)
    .gte("last_message_at", cutoffTooOld)
    .lte("last_message_at", cutoffOld)
    .order("last_message_at", { ascending: false })
    .limit(50);

  if (error) return json({ error: "query_failed", detail: error.message }, 500);

  const resumed: string[] = [];
  const skipped: Record<string, number> = {};

  for (const c of convs ?? []) {
    if (resumed.length >= MAX_PER_RUN) break;
    if (c.human_takeover_until && new Date(c.human_takeover_until) > new Date()) { skipped.takeover = (skipped.takeover ?? 0) + 1; continue; }
    if ((c.contacts as any)?.aurora_blocked) { skipped.blocked = (skipped.blocked ?? 0) + 1; continue; }

    // Última mensagem da conversa precisa ser INBOUND (direction='in').
    const { data: last } = await admin
      .from("messages")
      .select("direction, author, created_at")
      .eq("conversation_id", c.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!last) { skipped.no_msg = (skipped.no_msg ?? 0) + 1; continue; }
    if (last.direction !== "in") { skipped.not_inbound = (skipped.not_inbound ?? 0) + 1; continue; }

    // Chama o aura-webhook em modo resume.
    try {
      const r = await fetch(
        `${SUPABASE_URL}/functions/v1/aura-webhook?secret=${encodeURIComponent(WEBHOOK_SECRET)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: "_safety_resume", conversation_id: c.id }),
        },
      );
      const out = await r.json().catch(() => ({}));
      if (r.ok && (out as any).resumed) resumed.push(c.id);
      else skipped.webhook_no_op = (skipped.webhook_no_op ?? 0) + 1;
    } catch {
      skipped.webhook_error = (skipped.webhook_error ?? 0) + 1;
    }
  }

  return json({ ok: true, resumed_count: resumed.length, resumed, skipped, scanned: (convs ?? []).length });
});
