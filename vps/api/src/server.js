import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
import pkg from "pg";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { request } from "undici";
import crypto from "node:crypto";

const { Pool } = pkg;
const app = Fastify({ logger: true });
await app.register(rateLimit, { max: 300, timeWindow: "1 minute" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const redis = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
const replyQueue = new Queue("reply-job", { connection: redis });

const {
  API_TOKEN, WEBHOOK_SIGNING_SECRET, INTERNAL_WAHA_HOOK_TOKEN,
  WAHA_BASE_URL, WAHA_API_KEY, LOVABLE_WEBHOOK_URL,
} = process.env;

// --- Helpers ---
function requireAdmin(req, reply) {
  const h = req.headers.authorization ?? "";
  if (h !== `Bearer ${API_TOKEN}`) { reply.code(401).send({ error: "unauthorized" }); return false; }
  return true;
}

async function waha(path, method = "GET", body) {
  const res = await request(`${WAHA_BASE_URL}${path}`, {
    method,
    headers: { "X-Api-Key": WAHA_API_KEY, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.body.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.statusCode, data };
}

async function pushToLovable(payload) {
  if (!LOVABLE_WEBHOOK_URL) return;
  const raw = JSON.stringify(payload);
  const sig = crypto.createHmac("sha256", WEBHOOK_SIGNING_SECRET).update(raw).digest("hex");
  try {
    await request(LOVABLE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-aura-signature": sig },
      body: raw,
    });
  } catch (e) { app.log.error({ e }, "lovable webhook failed"); }
}

async function upsertContact(phone, name) {
  const { rows } = await pool.query(
    `INSERT INTO contacts(phone, name, last_seen_at) VALUES($1,$2,now())
     ON CONFLICT (phone) DO UPDATE SET name=COALESCE(EXCLUDED.name, contacts.name), last_seen_at=now()
     RETURNING id`, [phone, name ?? null]);
  return rows[0].id;
}

async function openConversation(contactId) {
  const { rows } = await pool.query(
    `INSERT INTO conversations(contact_id, status, last_message_at) VALUES($1,'open',now())
     ON CONFLICT (contact_id, status) DO UPDATE SET last_message_at=now()
     RETURNING id, ai_enabled, assigned_to`, [contactId]);
  return rows[0];
}

// --- Health ---
app.get("/health", async () => ({ ok: true }));

// --- WAHA webhook (interno) ---
app.post("/waha/events", async (req, reply) => {
  if (req.headers["x-webhook-token"] !== INTERNAL_WAHA_HOOK_TOKEN
      && req.headers["x-api-key"] !== WAHA_API_KEY) {
    // WAHA envia com X-Api-Key; aceitamos ambos por segurança
    return reply.code(401).send({ error: "unauthorized" });
  }
  const evt = req.body;
  app.log.info({ event: evt?.event }, "waha event");

  // Session status
  if (evt.event === "session.status") {
    await pool.query(
      `INSERT INTO whatsapp_sessions(session_name,status,phone_number,last_status_at)
       VALUES($1,$2,$3,now())
       ON CONFLICT (session_name) DO UPDATE SET status=EXCLUDED.status, phone_number=EXCLUDED.phone_number, last_status_at=now()`,
      [evt.session ?? "default", evt.payload?.status ?? "unknown", evt.payload?.me?.id ?? null]);
    await pushToLovable({
      event: "session.status",
      session_name: evt.session ?? "default",
      status: evt.payload?.status ?? "unknown",
      phone_number: evt.payload?.me?.id ?? null,
    });
    return { ok: true };
  }

  // Message inbound
  if (evt.event === "message") {
    const p = evt.payload;
    if (p.fromMe) return { ok: true }; // ecos de saída são tratados abaixo
    const phone = (p.from ?? "").replace("@c.us","");
    const contactId = await upsertContact(phone, p._data?.notifyName);
    const conv = await openConversation(contactId);

    const { rows } = await pool.query(
      `INSERT INTO messages(conversation_id, external_id, direction, author, body, media_url, msg_type, sent_at, metadata)
       VALUES($1,$2,'in','contact',$3,$4,$5,to_timestamp($6),$7)
       ON CONFLICT (external_id) DO NOTHING
       RETURNING id`,
      [conv.id, p.id, p.body ?? "", p.mediaUrl ?? null, p.type ?? "text", (p.timestamp ?? Date.now()/1000), p]);

    await pushToLovable({
      event: "message.in", external_id: p.id, phone,
      contact_name: p._data?.notifyName, direction: "in",
      body: p.body ?? "", media_url: p.mediaUrl ?? null, msg_type: p.type ?? "text",
      ts: new Date().toISOString(),
    });

    // Enfileira resposta da Aurora se conversa permitir
    if (rows[0] && conv.ai_enabled && conv.assigned_to === "aurora") {
      await replyQueue.add("reply", { conversationId: conv.id, phone }, {
        removeOnComplete: true, attempts: 2, backoff: { type: "exponential", delay: 3000 },
      });
    }
    return { ok: true };
  }

  // ACKs
  if (evt.event === "message.ack") {
    await pool.query(`UPDATE messages SET status=$1 WHERE external_id=$2`, [evt.payload?.ack ?? "read", evt.payload?.id]);
    await pushToLovable({ event: "message.ack", external_id: evt.payload?.id, status: String(evt.payload?.ack ?? "read") });
    return { ok: true };
  }

  return { ok: true };
});

// --- API pública (chamada pelo Lovable via aura-proxy) ---
app.get("/api/conversations", async (req, reply) => {
  if (!requireAdmin(req, reply)) return;
  const { rows } = await pool.query(
    `SELECT c.id, c.status, c.ai_enabled, c.assigned_to, c.last_message_at,
            k.phone, k.name
     FROM conversations c JOIN contacts k ON k.id = c.contact_id
     ORDER BY c.last_message_at DESC NULLS LAST LIMIT 200`);
  return { data: rows };
});

app.patch("/api/conversations/:id", async (req, reply) => {
  if (!requireAdmin(req, reply)) return;
  const { ai_enabled, assigned_to, status } = req.body ?? {};
  await pool.query(
    `UPDATE conversations SET
       ai_enabled = COALESCE($2, ai_enabled),
       assigned_to = COALESCE($3, assigned_to),
       status = COALESCE($4, status)
     WHERE id=$1`,
    [req.params.id, ai_enabled ?? null, assigned_to ?? null, status ?? null]);
  return { ok: true };
});

app.post("/api/messages", async (req, reply) => {
  if (!requireAdmin(req, reply)) return;
  const { conversation_id, body, author = "sirlei" } = req.body ?? {};
  const { rows } = await pool.query(
    `SELECT k.phone FROM conversations c JOIN contacts k ON k.id=c.contact_id WHERE c.id=$1`, [conversation_id]);
  if (!rows[0]) return reply.code(404).send({ error: "conversation_not_found" });
  const phone = rows[0].phone;

  const SESSION = process.env.WAHA_SESSION_NAME || "default";
  const sendRes = await waha("/api/sendText", "POST", {
    chatId: `${phone}@c.us`, text: body, session: SESSION,
  });
  if (sendRes.status >= 300) return reply.code(502).send({ error: "waha_send_failed", details: sendRes.data });

  const extId = sendRes.data?.id?._serialized ?? sendRes.data?.id ?? crypto.randomUUID();
  await pool.query(
    `INSERT INTO messages(conversation_id, external_id, direction, author, body, sent_at)
     VALUES($1,$2,'out',$3,$4,now())`,
    [conversation_id, extId, author, body]);

  await pushToLovable({
    event: "message.out", external_id: extId, phone,
    direction: "out", body, author, ts: new Date().toISOString(),
  });
  return { ok: true, external_id: extId };
});

app.post("/api/ai/reply", async (req, reply) => {
  if (!requireAdmin(req, reply)) return;
  const { conversation_id, hint } = req.body ?? {};
  await replyQueue.add("reply", { conversationId: conversation_id, hint, forceDraft: true });
  return { ok: true, queued: true };
});

// --- WhatsApp session control ---
const SESSION_NAME = process.env.WAHA_SESSION_NAME || "default";

app.get("/api/whatsapp/status", async (req, reply) => {
  if (!requireAdmin(req, reply)) return;
  const r = await waha(`/api/sessions/${SESSION_NAME}`);
  return { data: r.data };
});

app.post("/api/whatsapp/start", async (req, reply) => {
  if (!requireAdmin(req, reply)) return;
  const r = await waha("/api/sessions/start", "POST", { name: SESSION_NAME });
  return { data: r.data };
});

app.get("/api/whatsapp/qr", async (req, reply) => {
  if (!requireAdmin(req, reply)) return;
  const r = await waha(`/api/sessions/${SESSION_NAME}/auth/qr?format=image`);
  const qr = typeof r.data === "string" ? r.data : (r.data?.data ?? r.data?.qr ?? null);
  return { data: { qr } };
});

app.listen({ host: "0.0.0.0", port: Number(process.env.PORT || 3000) });
