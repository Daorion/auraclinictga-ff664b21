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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function typing(destination: string, on: boolean) {
  if (!WAHA_URL || !WAHA_API_KEY) return;
  const chatId = destination.includes("@") ? destination : `${destination}@c.us`;
  try {
    await fetch(`${WAHA_URL}/api/${on ? "startTyping" : "stopTyping"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": WAHA_API_KEY },
      body: JSON.stringify({ session: WAHA_SESSION, chatId }),
    });
  } catch { /* best effort */ }
}

// Quebra a resposta em 1–3 pedaços "humanos" por parágrafo/frase.
function splitReply(text: string): string[] {
  const clean = text.trim();
  if (!clean) return [];
  // 1) parágrafos separados por linha em branco
  let parts = clean.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  // 2) se ainda é um bloco só, tenta quebrar por frase quando for longo
  if (parts.length === 1 && clean.length > 180) {
    const sentences = clean.match(/[^.!?\n]+[.!?]+(?:\s|$)|[^.!?\n]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? [clean];
    parts = [];
    let buf = "";
    for (const s of sentences) {
      if ((buf + " " + s).trim().length > 160 && buf) { parts.push(buf.trim()); buf = s; }
      else { buf = (buf ? buf + " " : "") + s; }
    }
    if (buf.trim()) parts.push(buf.trim());
  }
  // Máximo 3 chunks pra não parecer robô esparramando texto
  if (parts.length > 3) {
    const head = parts.slice(0, 2);
    const tail = parts.slice(2).join("\n\n");
    parts = [...head, tail];
  }
  return parts;
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
  const messages: any[] = [
    { role: "system", content: system },
    ...historyMsgs,
  ];
  if (userMessage && userMessage.trim()) {
    messages.push({ role: "user", content: userMessage });
  }

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

const DEBOUNCE_MS = 8_000; // aguarda a pessoa terminar de mandar as msgs
const TYPING_CPS = 45;     // ~45 caracteres por segundo "digitados"
const TYPING_MIN_MS = 1200;
const TYPING_MAX_MS = 4500;
const CHUNK_GAP_MS = 700;

async function scheduleReply(
  admin: any,
  convId: string,
  rawFrom: string,
  phone: string,
  contactId: string,
  contactName: string | null,
  arrivedAt: string,
) {
  // 1) Debounce — se chegar msg nova, aborta essa execução
  await sleep(DEBOUNCE_MS);

  const { data: newer } = await admin
    .from("messages")
    .select("id, sent_at")
    .eq("conversation_id", convId)
    .eq("direction", "in")
    .gt("sent_at", arrivedAt)
    .limit(1);
  if (newer && newer.length > 0) {
    console.log("debounce_aborted", { convId, arrivedAt });
    return;
  }

  // 2) Re-checa estado da conversa (pode ter sido pausada nesses 8s)
  const { data: conv } = await admin
    .from("conversations")
    .select("ai_enabled, human_takeover_until")
    .eq("id", convId)
    .maybeSingle();
  if (!conv) return;
  if (conv.ai_enabled === false) return;
  if (conv.human_takeover_until && new Date(conv.human_takeover_until) > new Date()) return;

  // 3) Gera resposta com base em TODO o histórico acumulado
  const reply = await generateAiReply(admin, convId, phone, contactName, "");
  if (!reply) return;

  // 4) Quebra em chunks e envia com "digitando…" entre eles
  const chunks = splitReply(reply);
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const typingMs = Math.min(TYPING_MAX_MS, Math.max(TYPING_MIN_MS, Math.round((chunk.length / TYPING_CPS) * 1000)));
    await typing(rawFrom, true);
    await sleep(typingMs);
    await typing(rawFrom, false);

    const sent = await sendWhatsApp(rawFrom, chunk);
    await admin.from("messages").insert({
      conversation_id: convId,
      contact_id: contactId,
      channel: "whatsapp",
      direction: "out",
      body: chunk,
      external_id: sent.id ?? null,
      msg_type: "text",
      author: "aurora",
      status: sent.error ? "failed" : "sent",
      error: sent.error ?? null,
      sent_at: new Date().toISOString(),
    });
    await admin.from("conversations").update({
      last_message_at: new Date().toISOString(),
      last_message_preview: chunk.slice(0, 140),
    }).eq("id", convId);

    if (i < chunks.length - 1) await sleep(CHUNK_GAP_MS);
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
  // Só processamos "message.any" (cobre inbound + fromMe). "message" é duplicata.
  if (event === "message") return json({ ok: true, ignored: "duplicate_of_message.any" });
  if (event !== "message.any") {
    return json({ ok: true, ignored: event });
  }



  const fromMe = payload?.fromMe === true;

  const rawFrom = String(
    fromMe
      ? (payload?.to ?? payload?.chatId ?? payload?._data?.to ?? "")
      : (payload?.from ?? payload?.chatId ?? "")
  );
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

  // Try to link with an existing client by phone (match last 10 digits — handles @lid IDs and +55 variants)
  const last10 = phone.slice(-10);
  let linkedClientId: string | null = null;
  let linkedClientName: string | null = null;
  if (last10.length >= 8) {
    const { data: clientMatch } = await admin
      .from("clients")
      .select("id, name, phone")
      .ilike("phone", `%${last10}`)
      .limit(1)
      .maybeSingle();
    if (clientMatch) {
      linkedClientId = clientMatch.id;
      linkedClientName = clientMatch.name;
    }
  }

  // Look up existing contact so we NEVER overwrite the CRM name with WhatsApp push name
  const { data: existingContact } = await admin
    .from("contacts")
    .select("id, name, client_id")
    .eq("phone", phone)
    .maybeSingle();

  let contact: { id: string; name: string | null } | null = null;
  if (existingContact) {
    const patch: Record<string, unknown> = {
      wa_id: rawFrom,
      push_name: contactName,
      profile_picture_url: profilePic,
      last_seen_at: new Date().toISOString(),
    };
    // Only fill `name` if it was never set manually
    if (!existingContact.name && (linkedClientName || contactName)) {
      patch.name = linkedClientName ?? contactName;
    }
    if (!existingContact.client_id && linkedClientId) patch.client_id = linkedClientId;
    const { data: updated, error: updErr } = await admin
      .from("contacts").update(patch).eq("id", existingContact.id).select("id, name").single();
    if (updErr || !updated) return json({ error: "contact_update_failed", details: updErr }, 500);
    contact = updated;
  } else {
    const { data: inserted, error: insErr } = await admin
      .from("contacts")
      .insert({
        phone,
        wa_id: rawFrom,
        name: linkedClientName ?? contactName,
        push_name: contactName,
        profile_picture_url: profilePic,
        last_seen_at: new Date().toISOString(),
        origin: "whatsapp",
        client_id: linkedClientId,
      })
      .select("id, name")
      .single();
    if (insErr || !inserted) return json({ error: "contact_failed", details: insErr }, 500);
    contact = inserted;
  }

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

  // Save message (idempotent via external_id). If fromMe and we already logged it
  // (system-sent via waha-send), just ignore. If fromMe and NEW → user replied from
  // their own phone → save as human message and pause the AI.
  if (externalId) {
    const { data: existing } = await admin
      .from("messages")
      .select("id")
      .eq("external_id", externalId)
      .maybeSingle();
    if (existing) return json({ ok: true, deduped: true });
  }

  const arrivedAt = new Date().toISOString();
  await admin.from("messages").insert({
    conversation_id: convId,
    contact_id: contact.id,
    channel: "whatsapp",
    direction: fromMe ? "out" : "in",
    body: storedBody,
    external_id: externalId,
    msg_type: payload?.type ?? "text",
    author: fromMe ? "human" : "contact",
    status: fromMe ? "sent" : "delivered",
    sent_at: arrivedAt,
    metadata: { waha_event: event, from_phone: fromMe, raw: payload },
  });

  const convUpdate: any = {
    last_message_at: arrivedAt,
    last_message_preview: (storedBody || "[mensagem]").slice(0, 140),
  };
  if (fromMe) {
    // Humano assumiu direto pelo celular → pausa a Aurora por HUMAN_PAUSE_HOURS
    convUpdate.human_takeover_until = new Date(Date.now() + HUMAN_PAUSE_HOURS * 3600_000).toISOString();
    convUpdate.unread_count = 0;
  } else {
    convUpdate.unread_count = convUnread + 1;
  }
  await admin.from("conversations").update(convUpdate).eq("id", convId);

  if (fromMe) {
    return json({ ok: true, human_takeover: true, hours: HUMAN_PAUSE_HOURS });
  }

  // Decide: should AI reply?
  const takeoverActive = convTakeoverUntil && new Date(convTakeoverUntil) > new Date();
  if (!convAiEnabled || takeoverActive || !aiInput) {
    return json({ ok: true, ai_skipped: takeoverActive ? "human_takeover" : (!convAiEnabled ? "ai_disabled" : "empty_body") });
  }

  // Debounce + resposta particionada em background — responde SÓ depois de
  // DEBOUNCE_MS sem novas mensagens, e simula digitação humana entre chunks.
  // @ts-ignore — EdgeRuntime é global no Supabase Edge Runtime
  EdgeRuntime.waitUntil(
    scheduleReply(admin, convId, rawFrom, phone, contact.id, contact.name ?? contactName, arrivedAt),
  );

  return json({ ok: true, scheduled: true, debounce_ms: DEBOUNCE_MS });
});
