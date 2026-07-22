// Apaga arquivos do bucket whatsapp-media com mais de 3 dias.
// Chamado pelo pg_cron diariamente com header X-Cron-Secret.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-cron-secret, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), {
  status: s, headers: { ...corsHeaders, "Content-Type": "application/json" },
});

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const CRON_SECRET = Deno.env.get("AURORA_CRON_SECRET") ?? "";
const BUCKET = "whatsapp-media";
const MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000; // 3 dias

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = req.headers.get("Authorization") ?? "";
  const jwt = auth.replace(/^Bearer\s+/i, "");
  const cronHeader = req.headers.get("X-Cron-Secret") ?? "";
  const trusted = jwt === SERVICE_ROLE || (!!CRON_SECRET && cronHeader === CRON_SECRET);
  if (!trusted) return json({ error: "unauthorized" }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const cutoff = Date.now() - MAX_AGE_MS;
  const toDelete: string[] = [];

  // Lista pastas de nível 1 (contact_id)
  const { data: folders, error: fErr } = await admin.storage.from(BUCKET)
    .list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });
  if (fErr) return json({ error: "list_root_failed", details: fErr.message }, 500);

  for (const folder of folders ?? []) {
    if (!folder.name || folder.id !== null) continue; // pastas têm id null
    const { data: files } = await admin.storage.from(BUCKET)
      .list(folder.name, { limit: 1000, sortBy: { column: "created_at", order: "asc" } });
    for (const f of files ?? []) {
      const createdAt = f.created_at ? new Date(f.created_at).getTime() : Date.now();
      if (createdAt < cutoff) toDelete.push(`${folder.name}/${f.name}`);
    }
  }

  let deleted = 0;
  const chunk = 100;
  for (let i = 0; i < toDelete.length; i += chunk) {
    const slice = toDelete.slice(i, i + chunk);
    const { error: rmErr } = await admin.storage.from(BUCKET).remove(slice);
    if (rmErr) { console.warn("[cleanup] remove error:", rmErr.message); continue; }
    deleted += slice.length;
  }

  console.log(`[cleanup] deleted ${deleted}/${toDelete.length} files older than 3 days`);
  return json({ ok: true, scanned_folders: folders?.length ?? 0, deleted, expired: toDelete.length });
});
