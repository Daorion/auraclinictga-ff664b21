// aurora-analisar-conversa
// Analisa a conversa WhatsApp de um contato (ou de todos com atividade recente)
// e grava insights (estágio do funil, interesse, objeções, próxima ação, score,
// resumo) em public.contact_insights.
//
// Modos:
//   { contact_id: "..." }             -> analisa um contato específico
//   { since_minutes: 60, limit: 50 }  -> analisa contatos com mensagem nova desde X min
//   { all: true, limit: 200 }         -> força reanálise dos mais recentes
// Auth: aceita bearer admin JWT ou service role (para cron).
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.6-flash";

const SYSTEM = `Você é uma analista sênior de relacionamento de uma clínica de estética (Aura Clinic, Tangará da Serra/MT). Sua função: ler a conversa de WhatsApp entre a clínica (Aurora/Sirlei) e uma cliente e produzir uma análise CURTA, honesta e acionável para a Sirlei (dona). Foque em: onde a cliente está no funil, o que ela quer, o que trava a decisão e o próximo passo que a Sirlei deveria dar. Nada de enrolação, nada de "talvez".

Retorne SOMENTE um JSON válido com este formato exato:
{
  "stage": "curiosa" | "interessada" | "negociando" | "pronta_fechar" | "agendada" | "fria" | "cliente_fiel" | "sem_contexto",
  "interest": "descrição em 1 linha do serviço/tema principal que ela quer",
  "objections": ["objecao curta 1", "objecao curta 2"],
  "next_action": "ação concreta e específica que a Sirlei deve tomar (1 frase)",
  "opportunity_score": 0-100,
  "summary": "resumo executivo de no máximo 2 linhas, direto ao ponto",
  "alerts": ["alerta 1 se houver algo urgente/problemático"]
}

Regras:
- "opportunity_score" alto (>70) só se ela demonstrou intenção clara de agendar/comprar recentemente.
- "alerts" só aparece se: cliente esperando resposta há muito tempo, Aurora respondeu algo errado, cliente demonstrou insatisfação, oportunidade quente esfriando, informação sensível pedida.
- "next_action" deve ser algo que a Sirlei consegue FAZER hoje (mandar antes/depois, ligar, oferecer horário X, mandar orçamento, pedir desculpas etc.).
- Se a conversa está muito vazia ou sem contexto útil, use stage="sem_contexto", score=0, summary curto explicando.
- Nunca invente serviços, preços ou datas que não estão na conversa.
- Português BR.`;

async function analyzeContact(admin: any, contactId: string): Promise<any> {
  const { data: contact } = await admin.from("contacts")
    .select("id, name, push_name, phone, wa_id, aurora_blocked, notes")
    .eq("id", contactId).maybeSingle();
  if (!contact) return { contact_id: contactId, skipped: "not_found" };

  const { data: convs } = await admin.from("conversations")
    .select("id, status, human_takeover_until, needs_review, review_reason, assigned_to, ai_enabled, last_message_at")
    .eq("contact_id", contactId).order("last_message_at", { ascending: false }).limit(3);
  const convIds = (convs ?? []).map((c: any) => c.id);
  if (!convIds.length) return { contact_id: contactId, skipped: "no_conversation" };

  const { data: msgs } = await admin.from("messages")
    .select("direction, body, author, created_at")
    .in("conversation_id", convIds)
    .order("created_at", { ascending: false })
    .limit(60);
  const ordered = (msgs ?? []).slice().reverse();
  if (ordered.length < 2) return { contact_id: contactId, skipped: "too_short" };

  const transcript = ordered.map((m: any) => {
    const who = m.direction === "inbound"
      ? "CLIENTE"
      : (m.author === "aurora" ? "AURORA" : "SIRLEI");
    const t = new Date(m.created_at).toISOString().slice(0, 16).replace("T", " ");
    return `[${t}] ${who}: ${(m.body || "").slice(0, 600)}`;
  }).join("\n");

  const conv = convs![0];
  const nowMs = Date.now();
  const takeoverActive = conv.human_takeover_until && new Date(conv.human_takeover_until).getTime() > nowMs;
  const situacao = [
    contact.aurora_blocked ? "Aurora BLOQUEADA para esta pessoa" : null,
    conv.needs_review ? `Marcada para revisão humana: ${conv.review_reason ?? ""}` : null,
    takeoverActive ? "Sirlei está no modo humano (Aurora pausada)" : null,
    conv.ai_enabled === false ? "Aurora desabilitada nesta conversa" : null,
  ].filter(Boolean).join(" | ") || "Fluxo normal";

  const userMsg = `Contato: ${contact.name || contact.push_name || contact.phone}
Telefone: ${contact.phone || contact.wa_id || "-"}
Situação atual: ${situacao}
Última interação: ${conv.last_message_at}

=== Transcrição (mais antiga → mais recente) ===
${transcript}
=== fim ===`;

  const resp = await fetch(AI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userMsg },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    return { contact_id: contactId, error: `ai_${resp.status}`, details: err.slice(0, 300) };
  }
  const data = await resp.json();
  const raw = data?.choices?.[0]?.message?.content ?? "{}";
  let parsed: any;
  try { parsed = JSON.parse(raw); } catch { return { contact_id: contactId, error: "parse_failed", raw }; }

  const record = {
    contact_id: contactId,
    stage: String(parsed.stage ?? "sem_contexto").slice(0, 40),
    interest: parsed.interest ? String(parsed.interest).slice(0, 300) : null,
    objections: Array.isArray(parsed.objections) ? parsed.objections.slice(0, 6).map((x: any) => String(x).slice(0, 120)) : [],
    next_action: parsed.next_action ? String(parsed.next_action).slice(0, 400) : null,
    opportunity_score: Math.min(100, Math.max(0, Math.round(Number(parsed.opportunity_score) || 0))),
    summary: parsed.summary ? String(parsed.summary).slice(0, 600) : null,
    alerts: Array.isArray(parsed.alerts) ? parsed.alerts.slice(0, 6).map((x: any) => String(x).slice(0, 200)) : [],
    last_message_at: conv.last_message_at,
    last_analyzed_at: new Date().toISOString(),
    message_count_at_analysis: ordered.length,
    raw: parsed,
  };

  const { error: upErr } = await admin.from("contact_insights").upsert(record, { onConflict: "contact_id" });
  if (upErr) return { contact_id: contactId, error: upErr.message };
  return { contact_id: contactId, ok: true, stage: record.stage, score: record.opportunity_score };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, SERVICE_ROLE);

  // Auth: admin user JWT, service role bearer, ou cron secret header
  const auth = req.headers.get("Authorization") ?? "";
  const jwt = auth.replace(/^Bearer\s+/i, "");
  const cronHeader = req.headers.get("X-Cron-Secret") ?? "";
  const CRON_SECRET = Deno.env.get("AURORA_CRON_SECRET") ?? "";
  let isTrusted = jwt === SERVICE_ROLE || (!!CRON_SECRET && cronHeader === CRON_SECRET);
  if (!isTrusted) {
    if (!jwt) return json({ error: "unauthenticated" }, 401);
    const { data: userData } = await admin.auth.getUser(jwt);
    const user = userData?.user;
    if (!user) return json({ error: "invalid_token" }, 401);
    const { data: roleRow } = await admin.from("user_roles")
      .select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return json({ error: "forbidden" }, 403);
  }

  let body: any = {};
  try { body = await req.json(); } catch { /* ok */ }

  // Modo 1: contato específico
  if (body.contact_id) {
    const r = await analyzeContact(admin, String(body.contact_id));
    return json(r);
  }

  // Modo 2/3: batch — contatos com mensagem nova desde X min (ou todos recentes)
  const limit = Math.min(200, Number(body.limit ?? 40));
  const sinceMin = Number(body.since_minutes ?? (body.all ? 0 : 60));
  const cutoff = sinceMin > 0
    ? new Date(Date.now() - sinceMin * 60_000).toISOString()
    : new Date(Date.now() - 30 * 86400_000).toISOString();

  const { data: convs } = await admin.from("conversations")
    .select("contact_id, last_message_at")
    .gte("last_message_at", cutoff)
    .order("last_message_at", { ascending: false })
    .limit(500);

  const seen = new Set<string>();
  const targets: string[] = [];
  for (const c of convs ?? []) {
    if (!c.contact_id || seen.has(c.contact_id)) continue;
    seen.add(c.contact_id);
    targets.push(c.contact_id);
    if (targets.length >= limit) break;
  }

  // Pula os que já foram analisados após a última msg (a não ser force)
  let toRun = targets;
  if (!body.force) {
    const { data: existing } = await admin.from("contact_insights")
      .select("contact_id, last_message_at, last_analyzed_at")
      .in("contact_id", targets);
    const map = new Map<string, any>((existing ?? []).map((r: any) => [r.contact_id, r]));
    toRun = targets.filter((id) => {
      const conv = (convs ?? []).find((c: any) => c.contact_id === id);
      const ex = map.get(id);
      if (!ex) return true;
      return new Date(ex.last_analyzed_at).getTime() < new Date(conv?.last_message_at ?? 0).getTime();
    });
  }

  const results: any[] = [];
  for (const id of toRun) {
    try {
      const r = await analyzeContact(admin, id);
      results.push(r);
    } catch (e) {
      results.push({ contact_id: id, error: String(e) });
    }
    await new Promise((r) => setTimeout(r, 300)); // spacing leve
  }
  return json({ ok: true, considered: targets.length, analyzed: results.length, results });
});
