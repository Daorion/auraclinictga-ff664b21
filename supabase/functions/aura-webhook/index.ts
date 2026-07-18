// Aura webhook — receives WAHA events directly and processes them here.
// WAHA config: URL = https://<this-function>?secret=<AURA_WEBHOOK_SECRET>
// Events subscribed: "message" (inbound only) and "session.status".
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-webhook-hmac",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const WAHA_URL = Deno.env.get("WAHA_URL") ?? "";
const WAHA_API_KEY = Deno.env.get("WAHA_API_KEY") ?? "";
const WAHA_SESSION = Deno.env.get("WAHA_SESSION") ?? "default";
const WEBHOOK_SECRET = Deno.env.get("AURA_WEBHOOK_SECRET") ?? "";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";

const HUMAN_PAUSE_HOURS = 3;

function normalizePhone(from: string): string {
  // WAHA format: "5511999999999@c.us" → "5511999999999"
  return from.replace(/@c\.us$/i, "").replace(/@s\.whatsapp\.net$/i, "").replace(/\D/g, "");
}

async function fetchProfilePicture(chatId: string): Promise<string | null> {
  if (!WAHA_URL || !WAHA_API_KEY) return null;
  try {
    const r = await fetch(
      `${WAHA_URL}/api/${encodeURIComponent(WAHA_SESSION)}/contacts/profile-picture?contactId=${encodeURIComponent(chatId)}`,
      { headers: { "X-Api-Key": WAHA_API_KEY } },
    );
    if (!r.ok) return null;
    const data = await r.json().catch(() => ({}));
    return data?.profilePictureURL ?? data?.url ?? null;
  } catch { return null; }
}

async function sendWhatsApp(destination: string, text: string): Promise<{ id?: string; error?: string }> {
  if (!WAHA_URL || !WAHA_API_KEY) return { error: "waha_not_configured" };
  const chatId = destination.includes("@") ? destination : `${destination}@c.us`;
  try {
    const r = await fetch(`${WAHA_URL}/api/sendText`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": WAHA_API_KEY },
      body: JSON.stringify({ session: WAHA_SESSION, chatId, text }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return { error: `waha_${r.status}: ${JSON.stringify(data)}` };
    return { id: data?.id?._serialized ?? data?.id ?? null };
  } catch (e) {
    return { error: String(e) };
  }
}

async function buildSystemPrompt(
  admin: any,
  contactName: string | null,
  clientInfo: any | null,
  recentAppointments: any[] | null,
): Promise<string> {
  const { data: settings } = await admin
    .from("ai_settings")
    .select("action_key, config")
    .eq("action_key", "whatsapp_agent")
    .maybeSingle();

  const persona = settings?.config?.system_prompt ?? `Você é a Aurora, atendente virtual da Aura Clinic (clínica de estética em Palmas-TO).
Tom acolhedor, elegante, profissional. Respostas curtas (2-4 frases), naturais no WhatsApp.
Nunca invente preços. Se perguntarem valores, ofereça agendar avaliação presencial gratuita.
OBJETIVO PRINCIPAL: conduzir toda conversa para AGENDAR UMA AVALIAÇÃO (modo avaliação).
Fluxo ideal: 1) cumprimente pelo nome, 2) entenda o interesse, 3) explique brevemente o procedimento, 4) proponha 2 opções de dia/horário para avaliação presencial, 5) confirme e peça nome completo + WhatsApp.
Se pedirem para falar com humano, diga que vai encaminhar para uma atendente.`;

  const { data: procs } = await admin
    .from("procedures_pricing")
    .select("name, description, pricing_json, notes")
    .eq("active", true)
    .order("display_order", { ascending: true })
    .limit(50);

  let procText = "";
  if (procs && procs.length) {
    procText = "\n\nProcedimentos disponíveis:\n" + procs.map((p: any) => {
      const price = p.pricing_json ? ` — ${JSON.stringify(p.pricing_json)}` : "";
      return `- ${p.name}${p.description ? `: ${p.description}` : ""}${price}${p.notes ? ` (${p.notes})` : ""}`;
    }).join("\n");
  }

  // ---- Quem é essa pessoa? ----
  let personText = "";
  if (clientInfo) {
    const parts: string[] = [];
    parts.push(`Nome cadastrado: ${clientInfo.name}`);
    if (clientInfo.birth_date) parts.push(`Nascimento: ${clientInfo.birth_date}`);
    if (clientInfo.tags?.length) parts.push(`Tags: ${clientInfo.tags.join(", ")}`);
    if (clientInfo.notes) parts.push(`Observações da clínica: ${clientInfo.notes}`);
    if (recentAppointments && recentAppointments.length) {
      const list = recentAppointments.slice(0, 5).map((a: any) =>
        `- ${new Date(a.start_at).toLocaleDateString("pt-BR")} • ${a.service_name} (${a.status})`
      ).join("\n");
      parts.push(`Últimos atendimentos:\n${list}`);
    }
    personText = "\n\n=== Cliente identificada ===\n" + parts.join("\n") +
      "\nUse o primeiro nome de forma natural. Trate como cliente conhecida.";
  } else if (contactName) {
    personText = `\n\n=== Contato novo ===\nNome no WhatsApp: ${contactName}. Ainda não é cliente cadastrada — colha nome completo educadamente na primeira oportunidade.`;
  } else {
    personText = `\n\n=== Contato novo ===\nAinda não temos o nome. Pergunte com gentileza como pode chamá-la.`;
  }

  return persona + procText + personText;
}

async function generateAiReply(
  admin: any,
  convId: string,
  contactPhone: string,
  contactName: string | null,
  userMessage: string,
): Promise<string | null> {
  if (!LOVABLE_API_KEY) return null;

  // Fetch last 10 messages for context
  const { data: history } = await admin
    .from("messages")
    .select("direction, body, author")
    .eq("conversation_id", convId)
    .order("sent_at", { ascending: false })
    .limit(10);

  const historyMsgs = (history ?? []).reverse().map((m: any) => ({
    role: m.direction === "in" ? "user" : "assistant",
    content: m.body ?? "",
  })).filter((m: any) => m.content);

  // Look up client by phone

  let clientInfo: any = null;
  let recentAppts: any[] = [];
  if (contactPhone) {
    const { data: client } = await admin
      .from("clients")
      .select("id, name, birth_date, tags, notes")
      .or(`whatsapp_phone.eq.${contactPhone},phone.eq.${contactPhone}`)
      .eq("active", true)
      .maybeSingle();
    if (client) {
      clientInfo = client;
      const { data: appts } = await admin
        .from("appointments")
        .select("start_at, service_name, status")
        .eq("client_id", client.id)
        .order("start_at", { ascending: false })
        .limit(5);
      recentAppts = appts ?? [];
    }
  }

  const system = await buildSystemPrompt(admin, contactName, clientInfo, recentAppts);
  const messages = [
    { role: "system", content: system },
    ...historyMsgs,
    { role: "user", content: userMessage },
  ];

  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });
    if (!r.ok) {
      console.error("ai_gateway_error", r.status, await r.text());
      return null;
    }
    const data = await r.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch (e) {
    console.error("ai_call_failed", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  // Auth via ?secret= query param
  const url = new URL(req.url);
  const providedSecret = url.searchParams.get("secret") ?? "";
  if (!WEBHOOK_SECRET || providedSecret !== WEBHOOK_SECRET) {
    return json({ error: "invalid_secret" }, 401);
  }

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const event = body?.event ?? "";
  const session = body?.session ?? WAHA_SESSION;
  const payload = body?.payload ?? body?.data ?? body;

  // ===== session.status =====
  if (event === "session.status" || event === "session.state") {
    await admin.from("whatsapp_sessions").upsert(
      {
        session_name: session,
        status: payload?.status ?? payload?.state ?? "unknown",
        last_status_at: new Date().toISOString(),
      },
      { onConflict: "session_name" },
    );
    return json({ ok: true });
  }

  // ===== message.ack (delivery / read receipts) =====
  if (event === "message.ack" || event === "message.reaction") {
    const extId = payload?.id?._serialized ?? payload?.id ?? null;
    const ackNum = Number(payload?.ack ?? -99);
    const ackName = String(payload?.ackName ?? "").toUpperCase();
    // WEBJS ack: -1 ERROR, 0 PENDING, 1 SERVER(sent ✓), 2 DEVICE(delivered ✓✓), 3 READ(✓✓ azul), 4 PLAYED
    let status: string | null = null;
    if (ackName === "READ" || ackName === "PLAYED" || ackNum >= 3) status = "read";
    else if (ackName === "DEVICE" || ackNum === 2) status = "delivered";
    else if (ackName === "SERVER" || ackNum === 1) status = "sent";
    else if (ackNum === -1) status = "failed";
    if (extId && status) {
      await admin.from("messages").update({ status }).eq("external_id", extId);
    }
    return json({ ok: true, ack: status, external_id: extId });
  }

  // ===== message events =====
  // WAHA "message" fires on INBOUND only. "message.any" includes fromMe.
  if (event !== "message" && event !== "message.any") {
    return json({ ok: true, ignored: event });
  }



  const fromMe = payload?.fromMe === true;

  const rawFrom = String(payload?.from ?? payload?.chatId ?? "");
  const msgType = String(payload?.type ?? payload?._data?.type ?? "");

  // ⚠️ Never respond to WhatsApp groups, broadcasts, newsletters or status.
  const lowered = rawFrom.toLowerCase();
  if (lowered.endsWith("@g.us") || lowered.endsWith("@broadcast") || lowered.endsWith("@newsletter") || lowered === "status@broadcast") {
    return json({ ok: true, ignored: "group_or_broadcast", from: rawFrom });
  }

  // ⚠️ Ignore WhatsApp system notifications (business account changes, e2e updates, etc.)
  if (msgType && (msgType.includes("notification") || msgType === "protocol" || msgType === "e2e_notification" || msgType === "gp2")) {
    return json({ ok: true, ignored: "system_notification", type: msgType });
  }

  const phone = normalizePhone(rawFrom);
  if (!phone || phone.length < 8) return json({ ok: true, ignored: "invalid_phone", from: rawFrom });

  const contactName = payload?._data?.notifyName ?? payload?.notifyName ?? payload?.pushName ?? payload?._data?.pushName ?? null;
  const messageBody = String(payload?.body ?? payload?.text ?? "").trim();
  const externalId = payload?.id?._serialized ?? payload?.id ?? null;
  const hasMedia = payload?.hasMedia === true;
  const isAudio = msgType === "audio" || msgType === "ptt" || payload?._data?.isPtt === true;
  const storedBody = messageBody || (isAudio ? "[áudio]" : (hasMedia ? "[mídia]" : ""));
  const aiInput = messageBody || (isAudio
    ? "A pessoa enviou um áudio no WhatsApp. Responda de forma acolhedora, diga que recebeu o áudio e conduza para entender o interesse/agendar avaliação, sem fingir que ouviu o conteúdo."
    : "");

  // Fetch profile picture (best-effort, non-blocking failure)
  const chatIdFull = rawFrom.includes("@") ? rawFrom : `${phone}@c.us`;
  const profilePic = await fetchProfilePicture(chatIdFull);

  // Upsert contact
  const { data: contact, error: contactErr } = await admin
    .from("contacts")
    .upsert(
      {
        phone,
        wa_id: rawFrom,
        name: contactName,
        push_name: contactName,
        profile_picture_url: profilePic,
        last_seen_at: new Date().toISOString(),
        origin: "whatsapp",
      },
      { onConflict: "phone" },
    )
    .select("id, name")
    .single();
  if (contactErr || !contact) return json({ error: "contact_failed", details: contactErr }, 500);

  // Find or create open conversation
  let convId: string;
  let convAiEnabled = true;
  let convTakeoverUntil: string | null = null;
  let convUnread = 0;

  const { data: convRow } = await admin
    .from("conversations")
    .select("id, ai_enabled, human_takeover_until, unread_count")
    .eq("contact_id", contact.id)
    .eq("status", "open")
    .maybeSingle();

  if (convRow) {
    convId = convRow.id;
    convAiEnabled = convRow.ai_enabled ?? true;
    convTakeoverUntil = convRow.human_takeover_until;
    convUnread = convRow.unread_count ?? 0;
  } else {
    const { data: newConv, error: newErr } = await admin
      .from("conversations")
      .insert({ contact_id: contact.id, channel: "whatsapp", ai_enabled: true, external_session: session })
      .select("id")
      .single();
    if (newErr || !newConv) return json({ error: "conv_failed", details: newErr }, 500);
    convId = newConv.id;
  }

  // Save inbound message (idempotent via external_id)
  if (externalId) {
    const { data: existing } = await admin
      .from("messages")
      .select("id")
      .eq("external_id", externalId)
      .maybeSingle();
    if (existing) return json({ ok: true, deduped: true });
  }

  await admin.from("messages").insert({
    conversation_id: convId,
    contact_id: contact.id,
    channel: "whatsapp",
    direction: "in",
    body: storedBody,
    external_id: externalId,
    msg_type: payload?.type ?? "text",
    author: "contact",
    status: "delivered",
    sent_at: new Date().toISOString(),
    metadata: { waha_event: event, raw: payload },
  });

  await admin.from("conversations").update({
    last_message_at: new Date().toISOString(),
    last_message_preview: (storedBody || "[mensagem]").slice(0, 140),
    unread_count: convUnread + 1,
  }).eq("id", convId);

  // Decide: should AI reply?
  const takeoverActive = convTakeoverUntil && new Date(convTakeoverUntil) > new Date();
  if (!convAiEnabled || takeoverActive || !aiInput) {
    return json({ ok: true, ai_skipped: takeoverActive ? "human_takeover" : (!convAiEnabled ? "ai_disabled" : "empty_body") });
  }

  // Call AI
  const reply = await generateAiReply(admin, convId, phone, contact.name ?? contactName, aiInput);
  if (!reply) return json({ ok: true, ai_no_reply: true });

  // Send via WAHA
  const sent = await sendWhatsApp(rawFrom, reply);

  // Save outbound message
  await admin.from("messages").insert({
    conversation_id: convId,
    contact_id: contact.id,
    channel: "whatsapp",
    direction: "out",
    body: reply,
    external_id: sent.id ?? null,
    msg_type: "text",
    author: "aurora",
    status: sent.error ? "failed" : "sent",
    error: sent.error ?? null,
    sent_at: new Date().toISOString(),
  });

  await admin.from("conversations").update({
    last_message_at: new Date().toISOString(),
    last_message_preview: reply.slice(0, 140),
  }).eq("id", convId);

  return json({ ok: true, replied: !sent.error, error: sent.error ?? null });
});
