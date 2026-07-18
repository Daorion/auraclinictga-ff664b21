// waha-send — authenticated endpoint for panel to send a WhatsApp message.
// Inserts the outbound message, calls WAHA, and puts AI on pause (human takeover) for the conversation.
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
const HUMAN_PAUSE_HOURS = 3;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  // Verify caller is authenticated admin
  const auth = req.headers.get("Authorization") ?? "";
  const jwt = auth.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "unauthenticated" }, 401);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData?.user) return json({ error: "invalid_token" }, 401);
  const userId = userData.user.id;

  const { data: roleRow } = await admin
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!roleRow) return json({ error: "forbidden" }, 403);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const { conversation_id, text, pause_ai } = body ?? {};
  if (!conversation_id || !text) return json({ error: "missing_fields" }, 400);

  const { data: conv, error: convErr } = await admin
    .from("conversations")
    .select("id, contact_id, contacts(phone, wa_id)")
    .eq("id", conversation_id)
    .maybeSingle();
  if (convErr || !conv) return json({ error: "conversation_not_found" }, 404);
  const phone = (conv as any).contacts?.phone;
  const waId = (conv as any).contacts?.wa_id as string | null;
  if (!phone && !waId) return json({ error: "no_phone" }, 400);

  // Send via WAHA — prefer raw wa_id (handles @lid hosted accounts). Fallback to phone@c.us.
  const chatId = waId && waId.includes("@") ? waId : `${phone}@c.us`;
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

  // Save message
  await admin.from("messages").insert({
    conversation_id,
    contact_id: conv.contact_id,
    channel: "whatsapp",
    direction: "out",
    body: text,
    external_id: sentId,
    msg_type: "text",
    author: "human",
    author_user_id: userId,
    status: sendError ? "failed" : "sent",
    error: sendError,
    sent_at: new Date().toISOString(),
  });

  // Update conversation snapshot + pause AI
  const patch: Record<string, unknown> = {
    last_message_at: new Date().toISOString(),
    last_message_preview: text.slice(0, 140),
    unread_count: 0,
  };
  if (pause_ai !== false) {
    const until = new Date(Date.now() + HUMAN_PAUSE_HOURS * 3600 * 1000).toISOString();
    patch.human_takeover_until = until;
  }
  await admin.from("conversations").update(patch).eq("id", conversation_id);

  return json({ ok: true, error: sendError, external_id: sentId });
});
