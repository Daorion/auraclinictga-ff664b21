// Aura proxy — the ONLY bridge between the admin panel and the intermediate VPS API.
// The frontend never talks to WAHA or Gemini directly. All secrets live here.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface ProxyPayload {
  path: string; // e.g. "/api/conversations"
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  // --- Auth: admin only ---
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
  if (claimsErr || !claimsData?.claims?.sub) return json({ error: "unauthorized" }, 401);
  const userId = claimsData.claims.sub;

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!roleRow) return json({ error: "forbidden" }, 403);

  // --- Config guard ---
  const apiUrl = Deno.env.get("AURA_API_URL");
  const apiToken = Deno.env.get("AURA_API_TOKEN");
  if (!apiUrl || !apiToken) {
    return json(
      {
        error: "not_configured",
        message:
          "AURA_API_URL / AURA_API_TOKEN não configurados. Configure os segredos no backend antes de usar a integração.",
      },
      501,
    );
  }

  // --- Parse payload ---
  let payload: ProxyPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  if (!payload?.path || !payload.path.startsWith("/")) {
    return json({ error: "invalid_path" }, 400);
  }

  const method = (payload.method ?? "GET").toUpperCase();
  const url = new URL(apiUrl.replace(/\/$/, "") + payload.path);
  if (payload.query) {
    for (const [k, v] of Object.entries(payload.query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }

  // --- Forward ---
  try {
    const upstream = await fetch(url.toString(), {
      method,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
        "X-Aura-Actor": userId,
      },
      body: ["GET", "HEAD"].includes(method) ? undefined : JSON.stringify(payload.body ?? {}),
    });
    const text = await upstream.text();
    let data: unknown = text;
    try { data = JSON.parse(text); } catch { /* raw */ }
    return json({ ok: upstream.ok, status: upstream.status, data }, upstream.ok ? 200 : 502);
  } catch (err) {
    return json({ error: "upstream_unreachable", message: String((err as Error).message) }, 502);
  }
});
