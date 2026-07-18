import { Worker } from "bullmq";
import IORedis from "ioredis";
import pkg from "pg";
import { request } from "undici";
import crypto from "node:crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";

const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const connection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.0-flash" });

const {
  WAHA_BASE_URL, WAHA_API_KEY,
  LOVABLE_WEBHOOK_URL, WEBHOOK_SIGNING_SECRET,
  LOVABLE_API_URL, LOVABLE_API_TOKEN,
} = process.env;

const SYSTEM_PROMPT = `
Você é Aurora, atendente virtual da Aura Clinic TGA em Araguaína/TO.
Objetivo: acolher, tirar dúvidas sobre procedimentos estéticos, informar preços
oficiais e agendar avaliação com a Sirlei ou profissionais parceiras.

Regras inegociáveis:
- Nunca invente preços, horários, disponibilidade ou promoções.
- Sempre confira o preço na tabela oficial fornecida no contexto.
- Nunca faça diagnóstico médico. Casos clínicos: encaminhe para avaliação presencial.
- Tom acolhedor, elegante, profissional. Frases curtas. Português BR.
- Se pedirem algo fora do escopo (financeiro, jurídico, etc.), transfira para Sirlei.
- Ao agendar, colete: nome, telefone (se diferente), procedimento de interesse e melhores dias.
`;

async function loadPricing() {
  if (!LOVABLE_API_URL || !LOVABLE_API_TOKEN) return [];
  try {
    const r = await request(`${LOVABLE_API_URL}/rest/v1/procedures_pricing?select=name,price_cents,duration_min,notes&active=eq.true`, {
      headers: { apikey: LOVABLE_API_TOKEN, Authorization: `Bearer ${LOVABLE_API_TOKEN}` },
    });
    return await r.body.json();
  } catch { return []; }
}

async function loadHistory(conversationId) {
  const { rows } = await pool.query(
    `SELECT direction, author, body FROM messages
     WHERE conversation_id=$1 ORDER BY sent_at DESC LIMIT 20`, [conversationId]);
  return rows.reverse();
}

async function sendWaha(phone, text) {
  const res = await request(`${WAHA_BASE_URL}/api/sendText`, {
    method: "POST",
    headers: { "X-Api-Key": WAHA_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ chatId: `${phone}@c.us`, text, session: "default" }),
  });
  const data = await res.body.json().catch(() => ({}));
  return { status: res.statusCode, data };
}

async function pushLovable(payload) {
  if (!LOVABLE_WEBHOOK_URL) return;
  const raw = JSON.stringify(payload);
  const sig = crypto.createHmac("sha256", WEBHOOK_SIGNING_SECRET).update(raw).digest("hex");
  await request(LOVABLE_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-aura-signature": sig },
    body: raw,
  }).catch(() => {});
}

new Worker("reply-job", async (job) => {
  const { conversationId, hint, forceDraft } = job.data;

  const { rows: cRows } = await pool.query(
    `SELECT c.ai_enabled, c.assigned_to, k.phone, k.name
     FROM conversations c JOIN contacts k ON k.id=c.contact_id WHERE c.id=$1`, [conversationId]);
  const conv = cRows[0];
  if (!conv) return;
  if (!forceDraft && (!conv.ai_enabled || conv.assigned_to !== "aurora")) return;

  const [pricing, history] = await Promise.all([loadPricing(), loadHistory(conversationId)]);

  const context = [
    { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
    { role: "model", parts: [{ text: "Entendido. Sou Aurora, à disposição." }] },
    { role: "user", parts: [{ text: `TABELA OFICIAL DE PREÇOS (fonte de verdade):\n${JSON.stringify(pricing, null, 2)}` }] },
    { role: "model", parts: [{ text: "Ok, usarei apenas esta tabela." }] },
    ...history.map(m => ({
      role: m.direction === "in" ? "user" : "model",
      parts: [{ text: m.body || "" }],
    })),
  ];

  if (hint) context.push({ role: "user", parts: [{ text: `[Instrução interna da Sirlei]: ${hint}` }] });

  const chat = model.startChat({ history: context.slice(0, -1) });
  const res = await chat.sendMessage(context.at(-1).parts[0].text);
  const answer = res.response.text().trim();

  if (forceDraft) {
    // Rascunho: só envia pro painel, não pro WhatsApp
    await pushLovable({
      event: "message.in", external_id: `draft-${Date.now()}`, phone: conv.phone,
      direction: "in", body: `[Rascunho Aurora]\n${answer}`, msg_type: "draft",
      ts: new Date().toISOString(),
    });
    return;
  }

  const send = await sendWaha(conv.phone, answer);
  const extId = send.data?.id?._serialized ?? send.data?.id ?? crypto.randomUUID();

  await pool.query(
    `INSERT INTO messages(conversation_id, external_id, direction, author, body, sent_at)
     VALUES($1,$2,'out','aurora',$3,now())`,
    [conversationId, extId, answer]);

  await pushLovable({
    event: "message.out", external_id: extId, phone: conv.phone,
    direction: "out", body: answer, author: "aurora", ts: new Date().toISOString(),
  });
}, { connection, concurrency: 3 });

console.log("worker up");
