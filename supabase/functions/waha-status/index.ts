// Direct WAHA status probe for the admin UI.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const WAHA_URL = Deno.env.get("WAHA_URL") ?? "";
const WAHA_API_KEY = Deno.env.get("WAHA_API_KEY") ?? "";
const WAHA_SESSION = Deno.env.get("WAHA_SESSION") ?? "default";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const started = Date.now();

  if (!WAHA_URL || !WAHA_API_KEY) {
    return json({ ok: false, configured: false, reason: "waha_not_configured" });
  }

  try {
    const r = await fetch(`${WAHA_URL}/api/sessions/${encodeURIComponent(WAHA_SESSION)}`, {
      headers: { "X-Api-Key": WAHA_API_KEY },
    });
    const text = await r.text();
    let body: any = null;
    try { body = JSON.parse(text); } catch { body = text; }

    if (!r.ok) {
      return json({
        ok: false, configured: true, reachable: true,
        authorized: r.status !== 401 && r.status !== 403,
        http_status: r.status, session: WAHA_SESSION, url: WAHA_URL,
        error: typeof body === "object" ? body?.message ?? "http_error" : "http_error",
        latency_ms: Date.now() - started,
      });
    }

    return json({
      ok: true, configured: true, reachable: true, authorized: true,
      http_status: 200, session: WAHA_SESSION, url: WAHA_URL,
      status: body?.status ?? "UNKNOWN",
      me: body?.me ?? null,
      push_name: body?.me?.pushName ?? null,
      phone: body?.me?.id ? String(body.me.id).replace(/@c\.us$/, "") : null,
      latency_ms: Date.now() - started,
    });
  } catch (e) {
    return json({
      ok: false, configured: true, reachable: false, authorized: false,
      session: WAHA_SESSION, url: WAHA_URL,
      error: String(e), latency_ms: Date.now() - started,
    });
  }
});
