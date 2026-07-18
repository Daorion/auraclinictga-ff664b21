// aurora-campaign-send — envia UM alvo aprovado da campanha via WAHA.
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

function normalizePhone(p: string): string {
  return p.replace(/\D/g, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const auth = req.headers.get("Authorization") ?? "";
  const jwt = auth.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "unauthenticated" }, 401);
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: userData } = await admin.auth.getUser(jwt);
  const user = userData?.user;
  if (!user) return json({ error: "invalid_token" }, 401);
  const { data: roleRow } = await admin.from("user_roles")
    .select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
  if (!roleRow) return json({ error: "forbidden" }, 403);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const targetId = body?.target_id;
  const overrideMessage = body?.message as string | undefined;
  if (!targetId) return json({ error: "missing_target_id" }, 400);

  const { data: target } = await admin.from("aurora_campaign_targets")
    .select("id, campaign_id, client_id, contact_name, phone, suggested_message, status")
    .eq("id", targetId).maybeSingle();
  if (!target) return json({ error: "target_not_found" }, 404);
  if (target.status === "sent") return json({ error: "already_sent" }, 400);
  const text = (overrideMessage ?? target.suggested_message ?? "").trim();
  if (!text) return json({ error: "empty_message" }, 400);
  if (!target.phone) return json({ error: "no_phone" }, 400);

  const phone = normalizePhone(target.phone);
  const chatId = `${phone}@c.us`;

  let sentId: string | null = null;
  let sendError: string | null = null;
  try {
    const r = await fetch(`${WAHA_URL}/api/sendText`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": WAHA_API_KEY },
      body: JSON.stringify({ session: WAHA_SESSION, chatId, text }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) sendError = `waha_${r.status}: ${JSON.stringify(d)}`;
    else sentId = d?.id?._serialized ?? d?.id ?? null;
  } catch (e) { sendError = String(e); }

  // Find/create contact + conversation to log the outbound message so it aparece em Atendimentos
  let contactId: string | null = null;
  const { data: existing } = await admin.from("contacts").select("id").eq("phone", phone).maybeSingle();
  if (existing) contactId = existing.id;
  else {
    const { data: created } = await admin.from("contacts").insert({
      phone, name: target.contact_name, origin: "aurora_campaign",
    }).select("id").maybeSingle();
    contactId = created?.id ?? null;
  }
  let convId: string | null = null;
  if (contactId) {
    const { data: conv } = await admin.from("conversations").select("id")
      .eq("contact_id", contactId).order("last_message_at", { ascending: false }).limit(1).maybeSingle();
    if (conv) convId = conv.id;
    else {
      const { data: newConv } = await admin.from("conversations")
        .insert({ contact_id: contactId, channel: "whatsapp", status: "open" })
        .select("id").maybeSingle();
      convId = newConv?.id ?? null;
    }
    if (convId) {
      await admin.from("messages").insert({
        conversation_id: convId, contact_id: contactId, channel: "whatsapp",
        direction: "out", body: text, external_id: sentId, msg_type: "text",
        author: "human", author_user_id: user.id,
        status: sendError ? "failed" : "sent", error: sendError,
        sent_at: new Date().toISOString(),
      });
      await admin.from("conversations").update({
        last_message_at: new Date().toISOString(),
        last_message_preview: text.slice(0, 140),
      }).eq("id", convId);
    }
  }

  await admin.from("aurora_campaign_targets").update({
    status: sendError ? "failed" : "sent",
    reason: sendError,
    sent_at: sendError ? null : new Date().toISOString(),
    external_id: sentId,
    suggested_message: text,
  }).eq("id", targetId);

  await admin.from("audit_log").insert({
    action: sendError ? "aurora_campaign.target_failed" : "aurora_campaign.target_sent",
    entity_type: "aurora_campaign_target", entity_id: targetId,
    details: { campaign_id: target.campaign_id, phone },
    actor_user_id: user.id,
  });

  return json({ ok: !sendError, error: sendError, external_id: sentId });
});
