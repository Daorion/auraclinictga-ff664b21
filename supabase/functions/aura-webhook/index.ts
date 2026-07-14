// Aura webhook — receives events from the intermediate VPS API (which itself talks to WAHA).
// Public endpoint validated by HMAC signature; never trusts raw client input from browsers.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-aura-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function verifySignature(secret: string, raw: string, sigHex: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const macBuf = await crypto.subtle.sign("HMAC", key, enc.encode(raw));
  const macHex = Array.from(new Uint8Array(macBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  if (macHex.length !== sigHex.length) return false;
  let diff = 0;
  for (let i = 0; i < macHex.length; i++) diff |= macHex.charCodeAt(i) ^ sigHex.charCodeAt(i);
  return diff === 0;
}

interface Payload {
  event: "message.in" | "message.out" | "message.ack" | "session.status";
  external_id?: string;
  phone?: string;
  contact_name?: string;
  direction?: "in" | "out";
  body?: string;
  media_url?: string;
  msg_type?: string;
  status?: string;
  session_name?: string;
  phone_number?: string;
  ts?: string;
  metadata?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const secret = Deno.env.get("WAHA_WEBHOOK_SECRET");
  if (!secret) return json({ error: "not_configured" }, 501);

  const raw = await req.text();
  const sig = req.headers.get("x-aura-signature") ?? "";
  if (!sig || !(await verifySignature(secret, raw, sig))) {
    return json({ error: "invalid_signature" }, 401);
  }

  let p: Payload;
  try { p = JSON.parse(raw) as Payload; } catch { return json({ error: "invalid_json" }, 400); }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Session status event
  if (p.event === "session.status") {
    await admin.from("whatsapp_sessions").upsert(
      {
        session_name: p.session_name ?? "default",
        status: p.status ?? "unknown",
        phone_number: p.phone_number ?? null,
        last_status_at: new Date().toISOString(),
      },
      { onConflict: "session_name" },
    );
    return json({ ok: true });
  }

  // Message events
  if (!p.phone) return json({ error: "missing_phone" }, 400);

  // Upsert contact
  const { data: contact, error: contactErr } = await admin
    .from("contacts")
    .upsert(
      {
        phone: p.phone,
        name: p.contact_name ?? null,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "phone" },
    )
    .select("id")
    .single();
  if (contactErr || !contact) return json({ error: "contact_upsert_failed", details: contactErr }, 500);

  // Find or create conversation
  let convId: string | null = null;
  const { data: convRow } = await admin
    .from("conversations")
    .select("id, unread_count")
    .eq("contact_id", contact.id)
    .eq("status", "open")
    .maybeSingle();
  if (convRow) {
    convId = convRow.id;
  } else {
    const { data: newConv } = await admin
      .from("conversations")
      .insert({ contact_id: contact.id, channel: "whatsapp" })
      .select("id")
      .single();
    convId = newConv?.id ?? null;
  }
  if (!convId) return json({ error: "conversation_failed" }, 500);

  // Idempotent insert of message
  if (p.event === "message.in" || p.event === "message.out") {
    const direction = p.direction ?? (p.event === "message.in" ? "in" : "out");
    const insertPayload: Record<string, unknown> = {
      conversation_id: convId,
      contact_id: contact.id,
      channel: "whatsapp",
      direction,
      body: p.body ?? "",
      media_url: p.media_url ?? null,
      external_id: p.external_id ?? null,
      msg_type: p.msg_type ?? "text",
      author: direction === "in" ? "contact" : "aurora",
      status: "delivered",
      sent_at: p.ts ?? new Date().toISOString(),
      metadata: p.metadata ?? {},
    };

    const { error: insertErr } = await admin.from("messages").insert(insertPayload);
    // duplicate → ignore silently (idempotency)
    if (insertErr && !String(insertErr.message).includes("duplicate")) {
      return json({ error: "message_insert_failed", details: insertErr }, 500);
    }

    // Update conversation snapshot
    const patch: Record<string, unknown> = {
      last_message_at: new Date().toISOString(),
      last_message_preview: (p.body ?? "").slice(0, 140),
    };
    if (direction === "in") {
      patch.unread_count = (convRow?.unread_count ?? 0) + 1;
    }
    await admin.from("conversations").update(patch).eq("id", convId);
  }

  // ACK
  if (p.event === "message.ack" && p.external_id) {
    await admin
      .from("messages")
      .update({ status: p.status ?? "read" })
      .eq("external_id", p.external_id);
  }

  return json({ ok: true });
});
