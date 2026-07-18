// Sync WAHA chats + recent messages into the local inbox.
// Called from the Admin panel via a "Atualizar" button.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const WAHA_URL = Deno.env.get("WAHA_URL") ?? "";
const WAHA_API_KEY = Deno.env.get("WAHA_API_KEY") ?? "";
const WAHA_SESSION = Deno.env.get("WAHA_SESSION") ?? "default";

function normalizePhone(from: string): string {
  const base = String(from).split("@")[0] ?? "";
  return base.replace(/\D/g, "");
}

async function wahaGet(path: string): Promise<any> {
  const r = await fetch(`${WAHA_URL}${path}`, { headers: { "X-Api-Key": WAHA_API_KEY } });
  if (!r.ok) throw new Error(`waha_${r.status}: ${await r.text().catch(() => "")}`);
  return r.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!WAHA_URL || !WAHA_API_KEY) return json({ error: "waha_not_configured" }, 500);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const body = await req.json().catch(() => ({}));
  const chatLimit = Math.min(Number(body?.chats ?? 30), 100);
  const msgLimit = Math.min(Number(body?.messages ?? 30), 100);

  let chats: any[] = [];
  try {
    chats = await wahaGet(`/api/${encodeURIComponent(WAHA_SESSION)}/chats/overview?limit=${chatLimit}`);
  } catch {
    try {
      chats = await wahaGet(`/api/${encodeURIComponent(WAHA_SESSION)}/chats?limit=${chatLimit}`);
    } catch (e) {
      return json({ error: "chats_failed", details: String(e) }, 502);
    }
  }

  const stats = { chats: 0, contacts: 0, conversations: 0, messages: 0, skipped: 0 };

  for (const chat of chats ?? []) {
    const chatId: string = chat?.id?._serialized ?? chat?.id ?? "";
    const idLow = chatId.toLowerCase();
    if (!chatId || idLow.endsWith("@g.us") || idLow.endsWith("@broadcast") ||
        idLow.endsWith("@newsletter") || idLow === "status@broadcast") {
      stats.skipped++; continue;
    }

    const pushName: string | null = chat?.name ?? chat?.pushname ?? chat?.formattedTitle ?? null;
    const last = chat?.lastMessage ?? chat?.lastMessage?._data ?? null;

    // Derive phone: chatId (@c.us), else pushName if it looks like a phone,
    // else lastMessage.from/to (@c.us side), else the @lid user id.
    let phone = normalizePhone(chatId);
    if ((!phone || phone.length < 8) && pushName) {
      const p = pushName.replace(/\D/g, "");
      if (p.length >= 8) phone = p;
    }
    if ((!phone || phone.length < 8) && last) {
      const from = String(last?.from?._serialized ?? last?.from ?? "");
      const to = String(last?.to?._serialized ?? last?.to ?? "");
      const cand = [from, to].find((s) => s.endsWith("@c.us"));
      if (cand) phone = normalizePhone(cand);
    }
    if (!phone || phone.length < 8) { stats.skipped++; continue; }

    stats.chats++;

    // Profile pic (best-effort)
    let picUrl: string | null = null;
    try {
      const pic = await wahaGet(`/api/${encodeURIComponent(WAHA_SESSION)}/contacts/profile-picture?contactId=${encodeURIComponent(chatId)}`);
      picUrl = pic?.profilePictureURL ?? pic?.url ?? null;
    } catch { /* ignore */ }

    const { data: contact } = await admin.from("contacts").upsert({
      phone, wa_id: chatId, name: pushName, push_name: pushName,
      profile_picture_url: picUrl, origin: "whatsapp",
      last_seen_at: new Date().toISOString(),
    }, { onConflict: "phone" }).select("id").single();
    if (!contact) continue;
    stats.contacts++;

    // Ensure open conversation
    let convId: string;
    const { data: openConv } = await admin.from("conversations")
      .select("id").eq("contact_id", contact.id).eq("status", "open").maybeSingle();
    if (openConv) convId = openConv.id;
    else {
      const { data: newConv } = await admin.from("conversations")
        .insert({ contact_id: contact.id, channel: "whatsapp", ai_enabled: true, external_session: WAHA_SESSION })
        .select("id").single();
      if (!newConv) continue;
      convId = newConv.id;
      stats.conversations++;
    }

    // Fetch recent messages
    let msgs: any[] = [];
    try {
      msgs = await wahaGet(`/api/${encodeURIComponent(WAHA_SESSION)}/chats/${encodeURIComponent(chatId)}/messages?limit=${msgLimit}&downloadMedia=false`);
    } catch { continue; }

    for (const m of msgs ?? []) {
      const mType = String(m?.type ?? m?._data?.type ?? "");
      if (mType.includes("notification") || mType === "protocol" || mType === "e2e_notification" || mType === "gp2") continue;
      const externalId = m?.id?._serialized ?? m?.id ?? null;
      if (!externalId) continue;

      const { data: exists } = await admin.from("messages").select("id").eq("external_id", externalId).maybeSingle();
      if (exists) continue;

      const fromMe = m?.fromMe === true;
      const text = String(m?.body ?? m?.text ?? "").trim();
      const hasMedia = m?.hasMedia === true;
      const ts = m?.timestamp ? new Date(Number(m.timestamp) * 1000).toISOString() : new Date().toISOString();

      await admin.from("messages").insert({
        conversation_id: convId,
        contact_id: contact.id,
        channel: "whatsapp",
        direction: fromMe ? "out" : "in",
        body: hasMedia && !text ? "[mídia]" : text,
        external_id: externalId,
        msg_type: m?.type ?? "text",
        author: fromMe ? "sirlei" : "contact",
        status: fromMe ? "sent" : "delivered",
        sent_at: ts,
        metadata: { synced: true, raw: m },
      });
      stats.messages++;
    }

    // Update conversation preview from last synced message
    const tail = (msgs ?? [])[msgs.length - 1];
    if (tail) {
      const preview = String(tail?.body ?? tail?.text ?? "[mídia]").slice(0, 140);
      const lastTs = tail?.timestamp ? new Date(Number(tail.timestamp) * 1000).toISOString() : new Date().toISOString();
      await admin.from("conversations").update({
        last_message_at: lastTs, last_message_preview: preview,
      }).eq("id", convId);
    }
  }

  return json({ ok: true, stats });
});
