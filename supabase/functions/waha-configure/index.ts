// Configure WAHA session webhooks to point at aura-webhook.
// GET  → returns current session config (diagnostic)
// POST → PUTs webhooks + config into the session (idempotent)
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const WAHA_URL = Deno.env.get("WAHA_URL") ?? "";
const WAHA_API_KEY = Deno.env.get("WAHA_API_KEY") ?? "";
const WAHA_SESSION = Deno.env.get("WAHA_SESSION") ?? "default";
const WEBHOOK_SECRET = Deno.env.get("AURA_WEBHOOK_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b, null, 2), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function webhookUrl() {
  // https://<ref>.supabase.co/functions/v1/aura-webhook?secret=...
  return `${SUPABASE_URL}/functions/v1/aura-webhook?secret=${encodeURIComponent(WEBHOOK_SECRET)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!WAHA_URL || !WAHA_API_KEY) return json({ error: "waha_not_configured" }, 500);
  const headers = { "Content-Type": "application/json", "X-Api-Key": WAHA_API_KEY };

  // GET → current config
  if (req.method === "GET") {
    const r = await fetch(`${WAHA_URL}/api/sessions/${encodeURIComponent(WAHA_SESSION)}`, { headers });
    const data = await r.json().catch(() => ({}));
    return json({ status: r.status, session: data, expected_webhook: webhookUrl() });
  }

  // POST → configure
  const url = webhookUrl();
  const body = {
    name: WAHA_SESSION,
    config: {
      webhooks: [
        {
          url,
          events: ["message", "message.any", "session.status"],
          hmac: null,
          retries: { policy: "linear", delaySeconds: 2, attempts: 3 },
          customHeaders: null,
        },
      ],
    },
  };

  // Try PUT (update) first; if 404, POST (create)
  let r = await fetch(`${WAHA_URL}/api/sessions/${encodeURIComponent(WAHA_SESSION)}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });
  let data = await r.json().catch(() => ({}));

  if (r.status === 404) {
    r = await fetch(`${WAHA_URL}/api/sessions`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    data = await r.json().catch(() => ({}));
  }

  return json({ status: r.status, ok: r.ok, webhook_url: url, response: data });
});
