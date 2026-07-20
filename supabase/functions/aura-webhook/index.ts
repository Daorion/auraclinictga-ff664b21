// Aura webhook — receives WAHA events directly and processes them here.
// WAHA config: URL = https://<this-function>?secret=<AURA_WEBHOOK_SECRET>
// Events subscribed: "message" (inbound only) and "session.status".
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-webhook-hmac",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const WAHA_URL = Deno.env.get("WAHA_URL") ?? "";
const WAHA_API_KEY = Deno.env.get("WAHA_API_KEY") ?? "";
const WAHA_SESSION = Deno.env.get("WAHA_SESSION") ?? "default";
const WEBHOOK_SECRET = Deno.env.get("AURA_WEBHOOK_SECRET") ?? "";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";

const HUMAN_PAUSE_HOURS = 3;

function normalizePhone(from: string): string {
  // WAHA format: "5511999999999@c.us" → "5511999999999"
  return from.replace(/@c\.us$/i, "").replace(/@s\.whatsapp\.net$/i, "").replace(/\D/g, "");
}

async function fetchProfilePicture(chatId: string): Promise<string | null> {
  if (!WAHA_URL || !WAHA_API_KEY) return null;
  try {
    const r = await fetch(
      `${WAHA_URL}/api/contacts/profile-picture?session=${encodeURIComponent(WAHA_SESSION)}&contactId=${encodeURIComponent(chatId)}`,
      { headers: { "X-Api-Key": WAHA_API_KEY } },
    );
    if (!r.ok) return null;
    const data = await r.json().catch(() => ({}));
    return data?.profilePictureURL ?? data?.url ?? null;
  } catch { return null; }
}

async function fetchWahaContact(chatId: string): Promise<{ savedName: string | null; pushName: string | null }> {
  if (!WAHA_URL || !WAHA_API_KEY) return { savedName: null, pushName: null };
  try {
    const r = await fetch(
      `${WAHA_URL}/api/contacts?session=${encodeURIComponent(WAHA_SESSION)}&contactId=${encodeURIComponent(chatId)}`,
      { headers: { "X-Api-Key": WAHA_API_KEY } },
    );
    if (!r.ok) return { savedName: null, pushName: null };
    const data = await r.json().catch(() => null) as any;
    // WAHA returns either the contact object or an array; `name` = phonebook saved name, `pushname` = user-set profile name
    const c = Array.isArray(data) ? data[0] : data;
    return {
      savedName: c?.name ?? c?.formattedName ?? null,
      pushName: c?.pushname ?? c?.pushName ?? null,
    };
  } catch { return { savedName: null, pushName: null }; }
}

// ===== Áudio: baixa da WAHA e transcreve com Gemini (aceita OGG/Opus direto) =====
const MAX_AUDIO_SECONDS = 240; // 4 min
const MAX_AUDIO_BYTES = 15 * 1024 * 1024; // 15 MB

// Rewrite WAHA-internal localhost URLs (http://localhost:3000/...) to the
// public WAHA_URL so the edge function can actually reach the file.
function normalizeWahaMediaUrl(url: string): string {
  if (!url) return url;
  if (!WAHA_URL) return url;
  try {
    const u = new URL(url);
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1" || u.hostname === "waha") {
      const base = WAHA_URL.replace(/\/+$/, "");
      return `${base}${u.pathname}${u.search}`;
    }
  } catch { /* not a URL */ }
  return url;
}

async function downloadWahaMedia(payload: any): Promise<{ bytes: Uint8Array; mime: string } | null> {
  const mime = String(payload?.media?.mimetype ?? payload?._data?.mimetype ?? "audio/ogg").split(";")[0].trim() || "audio/ogg";
  const rawUrl = payload?.media?.url ?? payload?._data?.mediaUrl ?? null;
  const directUrl = rawUrl ? normalizeWahaMediaUrl(String(rawUrl)) : null;
  const tryFetch = async (url: string, withKey: boolean) => {
    const headers: Record<string, string> = {};
    if (withKey && WAHA_API_KEY) headers["X-Api-Key"] = WAHA_API_KEY;
    const r = await fetch(url, { headers });
    if (!r.ok) throw new Error(`http_${r.status}`);
    const buf = new Uint8Array(await r.arrayBuffer());
    return buf;
  };
  if (directUrl) {
    console.log("[audio] fetching media url:", directUrl.slice(0, 120));
    try {
      // WAHA files endpoint requires the API key when auth is on.
      const bytes = await tryFetch(directUrl, true);
      if (bytes.byteLength > MAX_AUDIO_BYTES) { console.warn("[audio] too large:", bytes.byteLength); return null; }
      return { bytes, mime };
    } catch (e) { console.warn("[audio] direct url failed:", String(e)); }
    // Retry via query-param API key (WAHA accepts ?apikey= for /api/files/*)
    if (WAHA_API_KEY) {
      try {
        const sep = directUrl.includes("?") ? "&" : "?";
        const bytes = await tryFetch(`${directUrl}${sep}apikey=${encodeURIComponent(WAHA_API_KEY)}`, false);
        if (bytes.byteLength > MAX_AUDIO_BYTES) return null;
        return { bytes, mime };
      } catch (e) { console.warn("[audio] direct url (apikey qs) failed:", String(e)); }
    }
  }
  return null;
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

async function transcribeAudio(bytes: Uint8Array, mime: string): Promise<string | null> {
  if (!LOVABLE_API_KEY) { console.warn("[transcribe] no LOVABLE_API_KEY"); return null; }
  const audioMime = (mime || "audio/ogg").toLowerCase();
  // WhatsApp sends OGG/Opus. gpt-4o-transcribe rejects raw ogg, so we relabel
  // the same Opus bytes as WebM (both containers wrap Opus) — the model decodes it fine.
  const ext = audioMime.includes("mp4") || audioMime.includes("m4a") ? "m4a"
    : audioMime.includes("mpeg") || audioMime.includes("mp3") ? "mp3"
    : audioMime.includes("wav") ? "wav"
    : "webm";
  const uploadMime = ext === "m4a" ? "audio/mp4"
    : ext === "mp3" ? "audio/mpeg"
    : ext === "wav" ? "audio/wav"
    : "audio/webm";
  console.log("[transcribe] input mime:", audioMime, "→ upload as", uploadMime, "size:", bytes.byteLength);

  const tryOnce = async (model: string) => {
    const form = new FormData();
    form.append("model", model);
    form.append("file", new Blob([bytes], { type: uploadMime }), `audio.${ext}`);
    const r = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: form,
    });
    if (!r.ok) {
      const err = await r.text().catch(() => "");
      console.warn("[transcribe]", model, "status", r.status, err.slice(0, 300));
      return null;
    }
    const data = await r.json().catch(() => null) as any;
    const text = String(data?.text ?? "").trim();
    console.log("[transcribe]", model, "text:", text.slice(0, 120));
    return text || null;
  };

  try {
    // Primary: dedicated STT endpoint.
    let text = await tryOnce("openai/gpt-4o-transcribe");
    if (!text) text = await tryOnce("openai/gpt-4o-mini-transcribe");
    if (!text) {
      // Fallback: Gemini via chat completions with base64 audio.
      const b64 = bytesToBase64(bytes);
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "Transcreva o áudio EXATAMENTE em pt-BR. Retorne só a transcrição literal. Se inaudível, responda [inaudível]." },
            { role: "user", content: [
              { type: "text", text: "Transcreva:" },
              { type: "input_audio", input_audio: { data: b64, format: ext === "webm" ? "webm" : ext } },
            ]},
          ],
        }),
      });
      if (r.ok) {
        const data = await r.json().catch(() => null) as any;
        text = String(data?.choices?.[0]?.message?.content ?? "").trim();
        console.log("[transcribe] gemini fallback text:", text.slice(0, 120));
      } else {
        console.warn("[transcribe] gemini fallback status", r.status, (await r.text().catch(() => "")).slice(0, 300));
      }
    }
    if (!text || text === "[inaudível]") return null;
    return text;
  } catch (e) {
    console.warn("[transcribe] error:", String(e));
    return null;
  }
}
async function sendWhatsApp(destination: string, text: string): Promise<{ id?: string; error?: string }> {
  if (!WAHA_URL || !WAHA_API_KEY) return { error: "waha_not_configured" };
  const chatId = destination.includes("@") ? destination : `${destination}@c.us`;
  try {
    const r = await fetch(`${WAHA_URL}/api/sendText`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": WAHA_API_KEY },
      body: JSON.stringify({ session: WAHA_SESSION, chatId, text }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return { error: `waha_${r.status}: ${JSON.stringify(data)}` };
    return { id: data?.id?._serialized ?? data?.id ?? null };
  } catch (e) {
    return { error: String(e) };
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function typing(destination: string, on: boolean) {
  if (!WAHA_URL || !WAHA_API_KEY) return;
  const chatId = destination.includes("@") ? destination : `${destination}@c.us`;
  try {
    await fetch(`${WAHA_URL}/api/${on ? "startTyping" : "stopTyping"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": WAHA_API_KEY },
      body: JSON.stringify({ session: WAHA_SESSION, chatId }),
    });
  } catch { /* best effort */ }
}

// Quebra a resposta em 1–3 pedaços "humanos" por parágrafo/frase.
// Heurística p/ detectar chatbots/autorespondedores de outras empresas.
// Se casar, pausamos a Aurora nessa conversa pra evitar loop de IA vs IA.
function looksLikeAutoresponder(text: string | null | undefined): boolean {
  if (!text) return false;
  const t = text.toLowerCase();
  const patterns = [
    /\*?1\*?\s*[\.\)-]\s*(vendas|financeiro|suporte|atendimento|falar)/i,
    /\bperd[aã]o[, ]+n[aã]o compreendi\b/i,
    /\batendimento encerrado\b/i,
    /\bseja bem-?vindo\b.*\bescolha uma\b/is,
    /\bdigite \*?\d\*?\s*(para|pra)\b/i,
    /\bmenu (principal|de op[cç][oõ]es)\b/i,
    /\bresposta autom[aá]tica\b/i,
    /^\*[^*]{2,60}\*\s*\n/, // "*Nome - Empresa*\n..." típico de bot corporativo
  ];
  return patterns.some((r) => r.test(t) || r.test(text));
}

function splitReply(text: string): string[] {
  const clean = text.trim();
  if (!clean) return [];
  // 1) parágrafos separados por linha em branco
  let parts = clean.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  // 2) se ainda é um bloco só, tenta quebrar por frase quando for longo
  if (parts.length === 1 && clean.length > 180) {
    const sentences = clean.match(/[^.!?\n]+[.!?]+(?:\s|$)|[^.!?\n]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? [clean];
    parts = [];
    let buf = "";
    for (const s of sentences) {
      if ((buf + " " + s).trim().length > 160 && buf) { parts.push(buf.trim()); buf = s; }
      else { buf = (buf ? buf + " " : "") + s; }
    }
    if (buf.trim()) parts.push(buf.trim());
  }
  // Máximo 3 chunks pra não parecer robô esparramando texto
  if (parts.length > 3) {
    const head = parts.slice(0, 2);
    const tail = parts.slice(2).join("\n\n");
    parts = [...head, tail];
  }
  return parts;
}



async function buildSystemPrompt(
  admin: any,
  contactName: string | null,
  clientInfo: any | null,
  recentAppointments: any[] | null,
): Promise<string> {
  const { data: settings } = await admin
    .from("ai_settings")
    .select("action_key, config")
    .eq("action_key", "whatsapp_agent")
    .maybeSingle();

  const persona = settings?.config?.system_prompt ?? `Você é a Aurora, atendente virtual da Aura Clinic (clínica de estética em Palmas-TO).
Tom acolhedor, elegante, profissional. Respostas curtas (2-4 frases), naturais no WhatsApp.
Nunca invente preços. Se perguntarem valores, ofereça agendar avaliação presencial gratuita.
OBJETIVO PRINCIPAL: conduzir toda conversa para AGENDAR UMA AVALIAÇÃO (modo avaliação).
Fluxo ideal: 1) cumprimente pelo nome, 2) entenda o interesse, 3) explique brevemente o procedimento, 4) proponha 2 opções de dia/horário para avaliação presencial, 5) confirme e peça nome completo + WhatsApp.
Se pedirem para falar com humano, diga que vai encaminhar para uma atendente.`;

  const guardrails = `

=== REGRAS ABSOLUTAS (NUNCA quebre) ===
- Você é APENAS a Aurora, atendente. NUNCA escreva no lugar da cliente, NUNCA continue nem complete a fala dela.
- Mensagens que começam com "🎤 " são a TRANSCRIÇÃO do áudio que a cliente enviou — trate como se ela tivesse escrito aquele texto e responda normalmente ao conteúdo. NUNCA peça para ela "descrever por texto" nesse caso.
- Somente quando o histórico mostrar literalmente "[áudio]", "[mídia]" ou "[imagem]" (sem transcrição): você NÃO tem acesso ao conteúdo — reconheça que recebeu e peça gentilmente que descreva por texto. NUNCA invente o que estava na mídia.
- NUNCA use gírias ("amiga", "bicha", "mano"). Mantenha tom profissional-acolhedor.
- NUNCA fale sobre assuntos fora da clínica (compras, festas, roupas, vida pessoal). Se a cliente puxar assunto assim, reconduza gentilmente ao motivo do contato com a Aura Clinic.
- Responda SEMPRE em UMA única mensagem coesa, curta (2-4 frases). Não simule várias mensagens seguidas.
- NUNCA invente cargos, funções ou responsabilidades de pessoas da clínica. A Sirlei é a proprietária/esteticista responsável — NÃO é "consultora de vendas", NÃO existe "equipe de vendas", NÃO existe "equipe financeira". Se não souber o cargo de alguém, diga apenas "nossa equipe".
- NUNCA prometa que alguém da clínica entrará em contato com uma EMPRESA/fornecedor externo. Se a mensagem parecer vir de outra empresa, cobrança, fornecedor, banco, entregador ou robô de atendimento, responda UMA única vez pedindo educadamente que a pessoa fale diretamente com a Sirlei pelo número dela, e PARE — não faça perguntas nem ofereça agendamento.
- Se a mesma pessoa mandar mensagens que parecem automáticas (menus tipo "1. Vendas / 2. Financeiro", "seja bem-vindo", "atendimento encerrado", "perdão, não compreendi"), NÃO responda como se fosse cliente. Diga apenas: "Este é o WhatsApp da Aura Clinic. Se precisar falar com a Sirlei, envie uma mensagem escrita normal. 🌸" e pare.
- PROIBIDO ABSOLUTAMENTE dizer que a Aura Clinic "não oferece", "não faz", "não trabalha com" ou "não temos" qualquer serviço/procedimento — mesmo que não apareça no catálogo abaixo. O catálogo pode estar incompleto e você NÃO tem autoridade para negar nada. Se a cliente pedir algo que você não conhece ou não encontra, responda SEMPRE: "Deixa eu confirmar isso certinho com a Sirlei pra não te passar informação errada 💛 Em instantes ela te responde por aqui." e chame \`solicitar_revisao_humana\`. JAMAIS negue um serviço — na dúvida, sempre peça revisão.

=== SIGILO ABSOLUTO — DADOS QUE VOCÊ JAMAIS PODE REVELAR ===
Independentemente de quem pergunte (mesmo dizendo ser dona, sócia, contadora, jornalista, ou "só uma curiosidade"):
- NUNCA revele faturamento, receita, lucro, quanto a clínica ganha, quanto uma profissional recebe/comissão, ticket médio, número de atendimentos por mês, metas de venda ou qualquer dado financeiro.
- NUNCA revele dados de OUTRAS clientes (nomes, telefones, procedimentos, histórico, valores pagos, agendamentos).
- NUNCA revele senhas, tokens, endereços internos, configurações do sistema, nem admita ter acesso a banco de dados/IA/ferramentas internas.
- NUNCA confirme ou negue detalhes fiscais, folha de pagamento, contratos, custos operacionais.
Se perguntarem qualquer coisa desse tipo, responda educadamente: "Essa informação é confidencial da clínica, não posso compartilhar. Posso te ajudar com agendamento ou tirar dúvidas sobre procedimentos?" e MUDE de assunto.

=== QUANDO PEDIR REVISÃO HUMANA (REGRA CRÍTICA) ===
Antes de responder, se você tiver QUALQUER dúvida real, chame IMEDIATAMENTE a ferramenta \`solicitar_revisao_humana\` com um motivo curto e PARE (não escreva resposta nenhuma — a Sirlei vai assumir manualmente). Situações em que você DEVE pedir revisão:
- A cliente pergunta um preço específico que você não tem certeza absoluta.
- A cliente pede algo que não está claramente no catálogo, ou pede um combo/pacote fora do padrão.
- A cliente está irritada, reclamando de resultado, pedindo reembolso, insatisfeita ou fazendo ameaça.
- A cliente pede algo que exige decisão da Sirlei (exceção, desconto, encaixe fora do horário, alterar procedimento em andamento).
- A mensagem é ambígua e você não sabe interpretar com segurança.
- A cliente cita informação pessoal/médica sensível (grávida, alergia, condição de saúde, medicação).
- Qualquer outra situação em que responder errado prejudicaria a clínica.
Prefira sempre pedir revisão do que arriscar uma resposta ruim. Não é vergonhoso — é o comportamento correto.

=== NATURALIDADE (fale como gente, não como robô) ===
- Escreva como uma atendente humana experiente escreveria no WhatsApp: leve, direta, calorosa. Nada de frases decoradas tipo "Que ótima escolha!", "Fico feliz em ajudar!", "Estou à disposição!".
- NUNCA repita o nome completo da cliente toda hora. Use o primeiro nome no máximo uma vez por resposta, e só quando soar natural.
- NUNCA peça para a cliente CONFIRMAR informações óbvias que você já tem ou consegue deduzir (data de hoje, dia da semana, o que é "amanhã", fuso horário, etc.). Você já sabe — resolva sozinha.
- Evite perguntas duplas na mesma mensagem. Uma pergunta por vez.
- Não anuncie o que vai fazer ("vou verificar", "deixa eu checar", "preciso verificar"). Apenas verifique e traga a resposta pronta.
- Emojis: no máximo 1 por mensagem, e só quando cabe (💛 🌸 ✨). Nunca em toda mensagem.

=== DATAS E HORÁRIOS (você calcula sozinha) ===
- Fuso oficial: America/Cuiaba (UTC-4). As datas de hoje/amanhã já estão injetadas abaixo — USE-AS diretamente.
- Quando a cliente disser "amanhã", "hoje", "sexta que vem", "depois de amanhã", "próxima segunda", VOCÊ calcula a data (YYYY-MM-DD) e chama \`verificar_horarios\` na mesma hora. É PROIBIDO pedir para ela confirmar "qual é a data de amanhã" ou "que dia é hoje" — isso soa robótico e quebra a confiança.
- Se faltar só o período do dia (manhã/tarde/noite), aí sim pergunte — mas nunca a data.

=== AGENDAMENTO (você pode pré-agendar sozinha) ===
Você tem 3 ferramentas para agendar:
1. \`listar_servicos\` — quando precisar do id de um serviço.
2. \`verificar_horarios\` — SEMPRE que a cliente citar um dia/período. Passe service_id e a data (YYYY-MM-DD) que VOCÊ calculou. NUNCA responda sobre disponibilidade sem chamar essa ferramenta antes.
3. \`criar_pre_agendamento\` — SÓ depois que a cliente CONFIRMAR ("pode marcar", "confirmo", "fecha esse"). Requer service_id + start_at (ISO com fuso -04:00) e o nome dela.

Fluxo:
- Entenda o procedimento → se precisar, \`listar_servicos\`.
- Ela cita um dia → você calcula a data → \`verificar_horarios\` → ofereça 2-3 horários reais em uma frase curta.
- Ela escolhe e confirma → \`criar_pre_agendamento\`.
- Avise que é PRÉ-AGENDAMENTO e a Sirlei confirma em breve. Nunca prometa que já está 100% garantido.
- Se faltar o nome completo, peça antes de criar.`;

  // Datas úteis já calculadas no fuso da clínica — evita a IA errar ou pedir confirmação.
  const tz = "America/Cuiaba";
  const now = new Date();
  const fmtDate = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const fmtHuman = (d: Date) => new Intl.DateTimeFormat("pt-BR", { timeZone: tz, weekday: "long", day: "2-digit", month: "long" }).format(d);
  const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
  const dayAfter = new Date(now.getTime() + 48 * 3600 * 1000);
  const dateContext = `\n\n=== CONTEXTO TEMPORAL (fuso America/Cuiaba, UTC-4) ===\n- HOJE: ${fmtDate(now)} (${fmtHuman(now)})\n- AMANHÃ: ${fmtDate(tomorrow)} (${fmtHuman(tomorrow)})\n- DEPOIS DE AMANHÃ: ${fmtDate(dayAfter)} (${fmtHuman(dayAfter)})\nUse essas datas diretamente ao chamar \`verificar_horarios\`. NUNCA pergunte à cliente qual é a data.`;



  // ---- Catálogo REAL de serviços ativos (para NUNCA inventar que a clínica não oferece algo) ----
  const { data: activeServices } = await admin
    .from("services")
    .select("name, category")
    .eq("active", true)
    .order("category", { ascending: true });

  let servicesText = "";
  if (activeServices && activeServices.length) {
    const byCat = new Map<string, string[]>();
    for (const s of activeServices as any[]) {
      const cat = s.category ?? "Outros";
      if (!byCat.has(cat)) byCat.set(cat, []);
      byCat.get(cat)!.push(s.name);
    }
    servicesText = "\n\n=== CATÁLOGO COMPLETO DE SERVIÇOS DA AURA CLINIC (fonte da verdade) ===\n" +
      Array.from(byCat.entries()).map(([cat, list]) => `• ${cat}: ${list.join(", ")}`).join("\n") +
      "\n\nREGRA DE OURO: se um serviço aparece nesta lista, a clínica OFERECE. Se NÃO aparece, isso NÃO significa que a clínica não faz — o catálogo pode estar incompleto. NUNCA, em hipótese alguma, diga 'não oferecemos', 'não fazemos' ou 'não temos'. Sempre peça pra cliente aguardar a Sirlei confirmar e chame `solicitar_revisao_humana`. Design/modelagem de sobrancelhas, henna, micropigmentação, massagens (relaxante, modeladora, drenagem, pedras quentes, etc.), depilação a laser, botox, preenchimento, unhas e muito mais estão disponíveis.";
  }

  const { data: procs } = await admin
    .from("procedures_pricing")
    .select("name, description, pricing_json, notes")
    .eq("active", true)
    .order("display_order", { ascending: true })
    .limit(50);

  let procText = "";
  if (procs && procs.length) {
    procText = "\n\nProcedimentos com detalhes internos:\n" + procs.map((p: any) => {
      const price = p.pricing_json ? ` — ${JSON.stringify(p.pricing_json)}` : "";
      return `- ${p.name}${p.description ? `: ${p.description}` : ""}${price}${p.notes ? ` (${p.notes})` : ""}`;
    }).join("\n");
  }

  // ---- Quem é essa pessoa? ----
  let personText = "";
  if (clientInfo) {
    const parts: string[] = [];
    parts.push(`Nome cadastrado: ${clientInfo.name}`);
    if (clientInfo.birth_date) parts.push(`Nascimento: ${clientInfo.birth_date}`);
    if (clientInfo.tags?.length) parts.push(`Tags: ${clientInfo.tags.join(", ")}`);
    if (clientInfo.notes) parts.push(`Observações da clínica: ${clientInfo.notes}`);
    if (recentAppointments && recentAppointments.length) {
      const list = recentAppointments.slice(0, 5).map((a: any) =>
        `- ${new Date(a.start_at).toLocaleDateString("pt-BR")} • ${a.service_name} (${a.status})`
      ).join("\n");
      parts.push(`Últimos atendimentos:\n${list}`);
    }
    personText = "\n\n=== Cliente identificada ===\n" + parts.join("\n") +
      "\nUse o primeiro nome de forma natural. Trate como cliente conhecida.";
  } else if (contactName) {
    personText = `\n\n=== Contato novo ===\nNome no WhatsApp: ${contactName}. Ainda não é cliente cadastrada — colha nome completo educadamente na primeira oportunidade.`;
  } else {
    personText = `\n\n=== Contato novo ===\nAinda não temos o nome. Pergunte com gentileza como pode chamá-la.`;
  }

  // Diretivas ativas configuradas pela admin via chat de treinamento da Aurora
  const nowIso = new Date().toISOString();
  const { data: directives } = await admin
    .from("aurora_directives")
    .select("title, kind, content, ends_at")
    .eq("active", true)
    .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
    .limit(30);
  let directivesText = "";
  if (directives && directives.length) {
    directivesText = "\n\n=== DIRETIVAS ATIVAS (siga sempre — configuradas pela administradora) ===\n" +
      directives.map((d: any) =>
        `• [${d.kind}] ${d.title}${d.ends_at ? ` (vigente até ${d.ends_at})` : ""}: ${d.content}`
      ).join("\n");
  }

  return persona + guardrails + servicesText + procText + personText + directivesText;
}

async function generateAiReply(
  admin: any,
  convId: string,
  contactPhone: string,
  contactName: string | null,
  userMessage: string,
): Promise<string | null> {
  if (!LOVABLE_API_KEY) return null;

  // Fetch last 10 messages for context
  const { data: history } = await admin
    .from("messages")
    .select("direction, body, author, created_at")
    .eq("conversation_id", convId)
    .order("sent_at", { ascending: false })
    .limit(10);

  const chronologicalHistory = (history ?? []).reverse();
  const latestInbound = [...chronologicalHistory]
    .reverse()
    .find((m: any) => m.direction === "in" && String(m.body ?? "").trim());
  const latestInboundBody = String(latestInbound?.body ?? "").trim();

  const historyMsgs = chronologicalHistory.map((m: any) => {
    let body = String(m.body ?? "").trim();
    if (m.direction === "in") {
      // Marca mídia/áudio de forma inequívoca para o modelo NÃO tentar adivinhar o conteúdo
      const isLatestInbound = latestInbound && m.created_at === latestInbound.created_at;
      if (body === "[áudio]" || body === "[audio]") {
        body = isLatestInbound
          ? "(MENSAGEM ATUAL: a cliente enviou um áudio sem transcrição. Peça para reenviar ou descrever por texto.)"
          : "(Mensagem antiga: áudio sem transcrição. Ignore esta pendência antiga e NÃO peça texto sobre ela agora.)";
      } else if (body === "[mídia]" || body === "[midia]" || body === "[imagem]") {
        body = isLatestInbound
          ? "(MENSAGEM ATUAL: a cliente enviou mídia/imagem sem conteúdo acessível. Peça descrição por texto.)"
          : "(Mensagem antiga: mídia sem conteúdo acessível. Ignore esta pendência antiga agora.)";
      } else if (body.startsWith("🎤 ")) {
        body = `Transcrição de áudio da cliente: ${body.replace(/^🎤\s*/, "")}`;
      }
    }
    return { role: m.direction === "in" ? "user" : "assistant", content: body };
  }).filter((m: any) => m.content);

  // Look up client by phone

  let clientInfo: any = null;
  let recentAppts: any[] = [];
  if (contactPhone) {
    const { data: client } = await admin
      .from("clients")
      .select("id, name, birth_date, tags, notes")
      .or(`whatsapp_phone.eq.${contactPhone},phone.eq.${contactPhone}`)
      .eq("active", true)
      .maybeSingle();
    if (client) {
      clientInfo = client;
      const { data: appts } = await admin
        .from("appointments")
        .select("start_at, service_name, status")
        .eq("client_id", client.id)
        .order("start_at", { ascending: false })
        .limit(5);
      recentAppts = appts ?? [];
    }
  }

  const system = await buildSystemPrompt(admin, contactName, clientInfo, recentAppts);
  const messages: any[] = [
    { role: "system", content: system },
    ...historyMsgs,
    {
      role: "system",
      content: latestInboundBody
        ? `FOCO OBRIGATÓRIO: responda somente à mensagem MAIS RECENTE da cliente. Se ela começa com "🎤", isso é transcrição válida de áudio e deve ser respondida como texto normal. Ignore pedidos antigos sobre áudios/mídias sem transcrição. Mensagem mais recente: "${latestInboundBody.slice(0, 600)}"`
        : "FOCO OBRIGATÓRIO: responda somente à mensagem mais recente da cliente e ignore pendências antigas.",
    },
  ];
  if (userMessage && userMessage.trim()) {
    messages.push({ role: "user", content: userMessage });
  }

  // ===== Tool-calling loop (Aurora agenda pelo próprio WhatsApp) =====
  const tools = [
    {
      type: "function",
      function: {
        name: "listar_servicos",
        description: "Lista serviços ativos da clínica (id, nome, categoria, duração, profissional responsável). Use quando a cliente pedir opções ou você precisar do id para agendar.",
        parameters: { type: "object", properties: {}, additionalProperties: false },
      },
    },
    {
      type: "function",
      function: {
        name: "verificar_horarios",
        description: "Retorna horários disponíveis (slots de 1h, seg-sáb 9h-19h, fuso America/Cuiaba -04:00) para um serviço em uma data. Não retorna dados de outros clientes, apenas se o slot está livre ou ocupado.",
        parameters: {
          type: "object",
          properties: {
            service_id: { type: "string", description: "UUID do serviço (obtido em listar_servicos)" },
            data: { type: "string", description: "Data no formato YYYY-MM-DD" },
          },
          required: ["service_id", "data"],
          additionalProperties: false,
        },
      },
    },
    {
      type: "function",
      function: {
        name: "criar_pre_agendamento",
        description: "Cria um pré-agendamento (status=pendente) para revisão da equipe. Só chame depois que a cliente confirmar expressamente o horário e você tiver o nome dela.",
        parameters: {
          type: "object",
          properties: {
            service_id: { type: "string" },
            start_at: { type: "string", description: "Data-hora ISO com fuso -04:00, ex: 2026-01-15T14:00:00-04:00" },
            client_name: { type: "string", description: "Nome completo da cliente" },
            observacoes: { type: "string", description: "Anotações relevantes (opcional)" },
          },
          required: ["service_id", "start_at", "client_name"],
          additionalProperties: false,
        },
      },
    },
    {

      type: "function",
      function: {
        name: "solicitar_revisao_humana",
        description: "Use quando tiver QUALQUER dúvida real antes de responder a cliente: preço específico incerto, pedido fora do catálogo, cliente irritada/reclamação, decisão que exige a Sirlei, mensagem ambígua, informação médica sensível, ou qualquer risco de errar. Marca a conversa como aguardando revisão da Sirlei e NÃO envia nenhuma mensagem no WhatsApp. Sempre prefira pedir revisão a arriscar uma resposta errada.",
        parameters: {
          type: "object",
          properties: {
            motivo: { type: "string", description: "Motivo curto (1 frase) explicando por que precisa de revisão humana. Ex: 'cliente pediu preço específico do botox', 'cliente irritada com resultado anterior', 'pedido de encaixe fora do horário'." },
          },
          required: ["motivo"],
          additionalProperties: false,
        },
      },
    },
  ];


  const callGateway = async (msgs: any[]) => {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: msgs, tools }),
    });
    if (!r.ok) { console.error("ai_gateway_error", r.status, await r.text()); return null; }
    return await r.json();
  };

  try {
    for (let iter = 0; iter < 4; iter++) {
      const data = await callGateway(messages);
      if (!data) return null;
      const msg = data?.choices?.[0]?.message;
      if (!msg) return null;
      const toolCalls = msg.tool_calls;
      if (!toolCalls || toolCalls.length === 0) {
        return msg.content ?? null;
      }
      // Push assistant tool_calls message
      messages.push(msg);
      for (const tc of toolCalls) {
        const name = tc.function?.name;
        let args: any = {};
        try { args = JSON.parse(tc.function?.arguments ?? "{}"); } catch { args = {}; }

        // Intercept: quando a Aurora pede revisão humana, marcamos a conversa e abortamos o envio.
        if (name === "solicitar_revisao_humana") {
          const motivo = String(args?.motivo ?? "").slice(0, 500) || "Aurora sinalizou dúvida sem detalhar o motivo.";
          console.log("aurora_review_requested", { convId, motivo });
          await admin.from("conversations").update({
            needs_review: true,
            review_reason: motivo,
            review_requested_at: new Date().toISOString(),
            human_takeover_until: new Date(Date.now() + 24 * 3600_000).toISOString(),
            assigned_to: "sirlei",
          }).eq("id", convId);
          const firstName = (contactName ?? "").trim().split(/\s+/)[0];
          const saudacao = firstName ? `${firstName}, ` : "";
          return `${saudacao}deixa eu confirmar isso certinho com a Sirlei pra não te passar informação errada 💛 Em instantes ela mesma te responde por aqui, tá bom?`;

        }

        const result = await executeAuroraTool(admin, contactPhone, contactName, clientInfo, name, args);
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }

    }
    console.warn("ai_tool_loop_maxed");
    return null;
  } catch (e) {
    console.error("ai_call_failed", e);
    return null;
  }
}

// ============= Aurora tool executor =============
async function executeAuroraTool(
  admin: any,
  contactPhone: string,
  contactName: string | null,
  clientInfo: any | null,
  name: string,
  args: any,
): Promise<any> {
  try {
    if (name === "listar_servicos") {
      const { data: rows } = await admin
        .from("services")
        .select("id, name, category, duration, professional_name")
        .eq("active", true)
        .order("display_order", { ascending: true })
        .limit(60);
      return { ok: true, servicos: rows ?? [] };
    }

    if (name === "verificar_horarios") {
      const serviceId = String(args.service_id ?? "");
      const dateStr = String(args.data ?? "");
      if (!serviceId || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return { ok: false, erro: "Parâmetros inválidos. Passe service_id e data YYYY-MM-DD." };
      }
      const { data: svc } = await admin.from("services").select("id, name, professional_slug, duration_minutes").eq("id", serviceId).maybeSingle();
      if (!svc) return { ok: false, erro: "Serviço não encontrado." };
      // Resolve profissional pela slug
      let professionalId: string | null = null;
      if (svc.professional_slug) {
        const { data: pro } = await admin.from("professionals").select("id").eq("slug", svc.professional_slug).eq("active", true).maybeSingle();
        professionalId = pro?.id ?? null;
      }
      // Domingo (0) fechado
      const [y, m, d] = dateStr.split("-").map(Number);
      const localDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      const dow = localDate.getUTCDay();
      if (dow === 0) return { ok: true, data: dateStr, horarios: [], mensagem: "Domingo a clínica não abre." };

      // Buscar ocupações do dia (todas as pros; se temos professionalId, filtramos)
      const dayStart = `${dateStr}T00:00:00-04:00`;
      const dayEnd = `${dateStr}T23:59:59-04:00`;
      let q = admin.from("appointments")
        .select("start_at, end_at, professional_id, status")
        .gte("start_at", dayStart).lte("start_at", dayEnd)
        .not("status", "in", "(cancelado,faltou)");
      if (professionalId) q = q.eq("professional_id", professionalId);
      const { data: busy } = await q;

      const slots: string[] = [];
      const durationMin = Number(svc.duration_minutes ?? 60) || 60;
      for (let hour = 9; hour + Math.ceil(durationMin / 60) <= 19; hour++) {
        const hh = String(hour).padStart(2, "0");
        const slotStart = new Date(`${dateStr}T${hh}:00:00-04:00`).getTime();
        const slotEnd = slotStart + durationMin * 60_000;
        const conflict = (busy ?? []).some((b: any) => {
          const bs = new Date(b.start_at).getTime();
          const be = new Date(b.end_at).getTime();
          return bs < slotEnd && be > slotStart;
        });
        if (!conflict) slots.push(`${hh}:00`);
      }
      return { ok: true, data: dateStr, servico: svc.name, horarios_livres: slots };
    }

    if (name === "criar_pre_agendamento") {
      const serviceId = String(args.service_id ?? "");
      const startAtStr = String(args.start_at ?? "");
      const clientName = String(args.client_name ?? "").trim();
      const notes = args.observacoes ? String(args.observacoes).slice(0, 500) : null;
      if (!serviceId || !startAtStr || !clientName) return { ok: false, erro: "Faltam dados (service_id, start_at, client_name)." };

      const { data: svc } = await admin.from("services").select("id, name, professional_slug, duration_minutes, price_cents").eq("id", serviceId).eq("active", true).maybeSingle();
      if (!svc) return { ok: false, erro: "Serviço não encontrado ou inativo." };

      let professionalId: string | null = null;
      if (svc.professional_slug) {
        const { data: pro } = await admin.from("professionals").select("id, commission_percent").eq("slug", svc.professional_slug).eq("active", true).maybeSingle();
        professionalId = pro?.id ?? null;
      }
      if (!professionalId) return { ok: false, erro: "Sem profissional disponível para este serviço." };

      const startAt = new Date(startAtStr);
      if (isNaN(startAt.getTime())) return { ok: false, erro: "start_at inválido (use ISO com fuso -04:00)." };
      const durationMin = Number(svc.duration_minutes ?? 60) || 60;
      const endAt = new Date(startAt.getTime() + durationMin * 60_000);

      // Find or create client
      let clientId = clientInfo?.id ?? null;
      if (!clientId && contactPhone) {
        const { data: existing } = await admin.from("clients")
          .select("id").or(`whatsapp_phone.eq.${contactPhone},phone.eq.${contactPhone}`).maybeSingle();
        clientId = existing?.id ?? null;
      }
      if (!clientId) {
        const { data: inserted, error: cErr } = await admin.from("clients").insert({
          name: clientName, whatsapp_phone: contactPhone, phone: contactPhone, active: true,
          notes: "Cadastro criado automaticamente pela Aurora via WhatsApp.",
        }).select("id").maybeSingle();
        if (cErr) return { ok: false, erro: "Falha ao cadastrar cliente." };
        clientId = inserted?.id ?? null;
      } else if (clientName && (!clientInfo || clientInfo.name !== clientName)) {
        // Atualiza nome se veio diferente/mais completo
        await admin.from("clients").update({ name: clientName }).eq("id", clientId).is("name", null);
      }

      const { data: appt, error } = await admin.from("appointments").insert({
        client_id: clientId,
        professional_id: professionalId,
        service_id: svc.id,
        service_name: svc.name,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        status: "pendente",
        price_cents: svc.price_cents ?? 0,
        notes: notes ? `[Aurora] ${notes}` : "[Aurora] Pré-agendamento via WhatsApp",
      }).select("id, start_at").maybeSingle();

      if (error) {
        if (String(error.message || "").toLowerCase().includes("conflito")) {
          return { ok: false, erro: "Esse horário acabou de ser ocupado. Peça outra opção com verificar_horarios." };
        }
        console.error("aurora_create_appt_error", error);
        return { ok: false, erro: "Não consegui registrar agora, tente daqui a pouco." };
      }

      const fmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeStyle: "short", timeZone: "America/Cuiaba" }).format(startAt);
      return { ok: true, id: appt?.id, status: "pendente", quando: fmt, mensagem: "Pré-agendamento criado. Avise a cliente que a equipe confirma em seguida." };
    }

    return { ok: false, erro: `Ferramenta desconhecida: ${name}` };
  } catch (e) {
    console.error("aurora_tool_error", name, e);
    return { ok: false, erro: "Erro interno ao executar a ação." };
  }
}

const DEBOUNCE_MS = 8_000; // aguarda a pessoa terminar de mandar as msgs
const TYPING_CPS = 45;     // ~45 caracteres por segundo "digitados"
const TYPING_MIN_MS = 1200;
const TYPING_MAX_MS = 4500;
const CHUNK_GAP_MS = 700;

async function scheduleReply(
  admin: any,
  convId: string,
  rawFrom: string,
  phone: string,
  contactId: string,
  contactName: string | null,
  arrivedAt: string,
  myToken: string,
) {
  // 1) Debounce — se chegar msg nova (que gera novo token), aborta essa execução
  await sleep(DEBOUNCE_MS);

  // 2) Re-checa estado + token. Só o ÚLTIMO agendamento pode responder.
  const { data: conv } = await admin
    .from("conversations")
    .select("ai_enabled, human_takeover_until, pending_reply_token")
    .eq("id", convId)
    .maybeSingle();
  if (!conv) return;
  if (conv.pending_reply_token !== myToken) {
    console.log("debounce_superseded", { convId, myToken, current: conv.pending_reply_token });
    return;
  }
  if (conv.ai_enabled === false) return;
  if (conv.human_takeover_until && new Date(conv.human_takeover_until) > new Date()) return;
  const { data: ctBlk } = await admin.from("contacts").select("aurora_blocked").eq("id", contactId).maybeSingle();
  if (ctBlk?.aurora_blocked) { console.log("aurora_blocked_contact", { contactId }); return; }

  // 3) Gera resposta com base em TODO o histórico acumulado
  const reply = await generateAiReply(admin, convId, phone, contactName, "");
  if (!reply) return;

  // 4) Marca como enviado ANTES de disparar (limpa o token) para evitar corrida.
  //    Se um novo inbound chegou entre a checagem e agora, ele já reescreveu o token
  //    e essa comparação abaixo protege.
  const { data: claim } = await admin
    .from("conversations")
    .update({ pending_reply_token: null })
    .eq("id", convId)
    .eq("pending_reply_token", myToken)
    .select("id")
    .maybeSingle();
  if (!claim) {
    console.log("claim_lost", { convId, myToken });
    return;
  }

  // 5) Quebra em chunks e envia com "digitando…" entre eles
  const chunks = splitReply(reply);
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const typingMs = Math.min(TYPING_MAX_MS, Math.max(TYPING_MIN_MS, Math.round((chunk.length / TYPING_CPS) * 1000)));
    await typing(rawFrom, true);
    await sleep(typingMs);
    await typing(rawFrom, false);

    const sent = await sendWhatsApp(rawFrom, chunk);
    await admin.from("messages").insert({
      conversation_id: convId,
      contact_id: contactId,
      channel: "whatsapp",
      direction: "out",
      body: chunk,
      external_id: sent.id ?? null,
      msg_type: "text",
      author: "aurora",
      status: sent.error ? "failed" : "sent",
      error: sent.error ?? null,
      sent_at: new Date().toISOString(),
    });
    await admin.from("conversations").update({
      last_message_at: new Date().toISOString(),
      last_message_preview: chunk.slice(0, 140),
    }).eq("id", convId);

    if (i < chunks.length - 1) await sleep(CHUNK_GAP_MS);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  // Auth via ?secret= query param
  const url = new URL(req.url);
  const providedSecret = url.searchParams.get("secret") ?? "";
  if (!WEBHOOK_SECRET || providedSecret !== WEBHOOK_SECRET) {
    return json({ error: "invalid_secret" }, 401);
  }

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const event = body?.event ?? "";
  const session = body?.session ?? WAHA_SESSION;
  const payload = body?.payload ?? body?.data ?? body;

  // ===== session.status =====
  if (event === "session.status" || event === "session.state") {
    await admin.from("whatsapp_sessions").upsert(
      {
        session_name: session,
        status: payload?.status ?? payload?.state ?? "unknown",
        last_status_at: new Date().toISOString(),
      },
      { onConflict: "session_name" },
    );
    return json({ ok: true });
  }

  // ===== message.ack (delivery / read receipts) =====
  if (event === "message.ack" || event === "message.reaction") {
    const extId = payload?.id?._serialized ?? payload?.id ?? null;
    const ackNum = Number(payload?.ack ?? -99);
    const ackName = String(payload?.ackName ?? "").toUpperCase();
    // WEBJS ack: -1 ERROR, 0 PENDING, 1 SERVER(sent ✓), 2 DEVICE(delivered ✓✓), 3 READ(✓✓ azul), 4 PLAYED
    let status: string | null = null;
    if (ackName === "READ" || ackName === "PLAYED" || ackNum >= 3) status = "read";
    else if (ackName === "DEVICE" || ackNum === 2) status = "delivered";
    else if (ackName === "SERVER" || ackNum === 1) status = "sent";
    else if (ackNum === -1) status = "failed";
    if (extId && status) {
      await admin.from("messages").update({ status }).eq("external_id", extId);
    }
    return json({ ok: true, ack: status, external_id: extId });
  }

  // ===== message events =====
  // Só processamos "message.any" (cobre inbound + fromMe). "message" é duplicata.
  if (event === "message") return json({ ok: true, ignored: "duplicate_of_message.any" });
  if (event !== "message.any") {
    return json({ ok: true, ignored: event });
  }



  const fromMe = payload?.fromMe === true;

  const rawFrom = String(
    fromMe
      ? (payload?.to ?? payload?.chatId ?? payload?._data?.to ?? "")
      : (payload?.from ?? payload?.chatId ?? "")
  );
  const msgType = String(payload?.type ?? payload?._data?.type ?? "");



  // ⚠️ Never respond to WhatsApp groups, broadcasts, newsletters or status.
  const lowered = rawFrom.toLowerCase();
  if (lowered.endsWith("@g.us") || lowered.endsWith("@broadcast") || lowered.endsWith("@newsletter") || lowered === "status@broadcast") {
    return json({ ok: true, ignored: "group_or_broadcast", from: rawFrom });
  }

  // ⚠️ Ignore WhatsApp system notifications (business account changes, e2e updates, etc.)
  if (msgType && (msgType.includes("notification") || msgType === "protocol" || msgType === "e2e_notification" || msgType === "gp2")) {
    return json({ ok: true, ignored: "system_notification", type: msgType });
  }

  const phone = normalizePhone(rawFrom);
  if (!phone || phone.length < 8) return json({ ok: true, ignored: "invalid_phone", from: rawFrom });

  // ⚠️ Contatos @lid (novos IDs do WhatsApp) têm bug conhecido no whatsapp-web.js:
  // o notifyName do payload frequentemente vem contaminado com o nome de outro chat
  // aberto recentemente. Nesses casos ignoramos o notifyName e confiamos APENAS no
  // pushname autoritativo vindo do endpoint /contacts da WAHA.
  const isLid = rawFrom.toLowerCase().includes("@lid");
  const rawNotifyName = payload?._data?.notifyName ?? payload?.notifyName ?? payload?.pushName ?? payload?._data?.pushName ?? null;
  const notifyName = isLid ? null : rawNotifyName;
  const messageBody = String(payload?.body ?? payload?.text ?? "").trim();
  const externalId = payload?.id?._serialized ?? payload?.id ?? null;
  const hasMedia = payload?.hasMedia === true;
  const isAudio = msgType === "audio" || msgType === "ptt" || payload?._data?.isPtt === true;
  const audioSeconds = Number(payload?.duration ?? payload?._data?.duration ?? 0);

  // Tenta transcrever áudio (até 4 min). Se conseguir, o body vira "🎤 <transcrição>".
  let transcript: string | null = null;
  if (isAudio && !fromMe) {
    console.log("[audio] detected — type:", msgType, "duration:", audioSeconds, "hasMedia:", hasMedia);
    if (audioSeconds && audioSeconds > MAX_AUDIO_SECONDS) {
      console.log("[audio] skipping — too long:", audioSeconds, "s");
    } else {
      const media = await downloadWahaMedia(payload);
      if (!media) {
        console.warn("[audio] download failed — no media bytes");
      } else {
        console.log("[audio] downloaded", media.bytes.byteLength, "bytes,", media.mime);
        transcript = await transcribeAudio(media.bytes, media.mime);
        console.log("[audio] transcript:", transcript ? `${transcript.slice(0, 80)}...` : "(none)");
      }
    }
  }

  const storedBody = messageBody
    || (transcript ? `🎤 ${transcript}` : (isAudio ? "[áudio]" : (hasMedia ? "[mídia]" : "")));
  const aiInput = messageBody
    || (transcript ? transcript
        : isAudio
          ? (audioSeconds > MAX_AUDIO_SECONDS
              ? "A pessoa enviou um áudio longo (mais de 4 minutos). Peça gentilmente para ela resumir por texto o que precisa, para você poder ajudar melhor."
              : "A pessoa enviou um áudio no WhatsApp, mas não foi possível compreender o conteúdo. Peça de forma acolhedora que ela reenvie ou descreva por texto.")
          : "");

  // Fetch profile picture + saved phonebook name (best-effort)
  const chatIdFull = rawFrom.includes("@") ? rawFrom : `${phone}@c.us`;
  const [profilePic, wahaContact] = await Promise.all([
    fetchProfilePicture(chatIdFull),
    fetchWahaContact(chatIdFull),
  ]);
  // Prefer the phonebook name saved on the device; fall back to notifyName (só se NÃO for @lid)
  const contactName = wahaContact.savedName ?? notifyName;
  // push_name = nome de perfil autoritativo do WA. Para @lid, só confia no /contacts.
  const contactPushName = wahaContact.pushName ?? notifyName;

  // Try to link with an existing client by phone (match last 10 digits — handles @lid IDs and +55 variants)
  const last10 = phone.slice(-10);
  let linkedClientId: string | null = null;
  let linkedClientName: string | null = null;
  if (last10.length >= 8) {
    const { data: clientMatch } = await admin
      .from("clients")
      .select("id, name, phone")
      .ilike("phone", `%${last10}`)
      .limit(1)
      .maybeSingle();
    if (clientMatch) {
      linkedClientId = clientMatch.id;
      linkedClientName = clientMatch.name;
    }
  }

  // Look up existing contact so we NEVER overwrite the CRM name with WhatsApp push name
  const { data: existingContact } = await admin
    .from("contacts")
    .select("id, name, client_id")
    .eq("phone", phone)
    .maybeSingle();

  let contact: { id: string; name: string | null } | null = null;
  if (existingContact) {
    const patch: Record<string, unknown> = {
      wa_id: rawFrom,
      push_name: contactPushName,
      profile_picture_url: profilePic,
      last_seen_at: new Date().toISOString(),
    };
    // Only fill `name` if it was never set manually
    if (!existingContact.name && (linkedClientName || contactName)) {
      patch.name = linkedClientName ?? contactName;
    }
    if (!existingContact.client_id && linkedClientId) patch.client_id = linkedClientId;
    const { data: updated, error: updErr } = await admin
      .from("contacts").update(patch).eq("id", existingContact.id).select("id, name").single();
    if (updErr || !updated) return json({ error: "contact_update_failed", details: updErr }, 500);
    contact = updated;
  } else {
    const { data: inserted, error: insErr } = await admin
      .from("contacts")
      .insert({
        phone,
        wa_id: rawFrom,
        name: linkedClientName ?? contactName,
        push_name: contactPushName,
        profile_picture_url: profilePic,
        last_seen_at: new Date().toISOString(),
        origin: "whatsapp",
        client_id: linkedClientId,
      })
      .select("id, name")
      .single();
    if (insErr || !inserted) return json({ error: "contact_failed", details: insErr }, 500);
    contact = inserted;
  }

  // Find or create open conversation
  let convId: string;
  let convAiEnabled = true;
  let convTakeoverUntil: string | null = null;
  let convUnread = 0;

  const { data: convRow } = await admin
    .from("conversations")
    .select("id, ai_enabled, human_takeover_until, unread_count")
    .eq("contact_id", contact.id)
    .eq("status", "open")
    .maybeSingle();

  if (convRow) {
    convId = convRow.id;
    convAiEnabled = convRow.ai_enabled ?? true;
    convTakeoverUntil = convRow.human_takeover_until;
    convUnread = convRow.unread_count ?? 0;
  } else {
    const { data: newConv, error: newErr } = await admin
      .from("conversations")
      .insert({ contact_id: contact.id, channel: "whatsapp", ai_enabled: true, external_session: session })
      .select("id")
      .single();
    if (newErr || !newConv) return json({ error: "conv_failed", details: newErr }, 500);
    convId = newConv.id;
  }

  // Save message (idempotent via external_id). If fromMe and we already logged it
  // (system-sent via waha-send), just ignore. If fromMe and NEW → user replied from
  // their own phone → save as human message and pause the AI.
  if (externalId) {
    const { data: existing } = await admin
      .from("messages")
      .select("id")
      .eq("external_id", externalId)
      .maybeSingle();
    if (existing) return json({ ok: true, deduped: true });
  }

  const arrivedAt = new Date().toISOString();
  await admin.from("messages").insert({
    conversation_id: convId,
    contact_id: contact.id,
    channel: "whatsapp",
    direction: fromMe ? "out" : "in",
    body: storedBody,
    external_id: externalId,
    msg_type: payload?.type ?? "text",
    author: fromMe ? "human" : "contact",
    status: fromMe ? "sent" : "delivered",
    sent_at: arrivedAt,
    metadata: { waha_event: event, from_phone: fromMe, raw: payload },
  });

  const convUpdate: any = {
    last_message_at: arrivedAt,
    last_message_preview: (storedBody || "[mensagem]").slice(0, 140),
  };
  if (fromMe) {
    // Humano assumiu direto pelo celular → pausa a Aurora por HUMAN_PAUSE_HOURS
    convUpdate.human_takeover_until = new Date(Date.now() + HUMAN_PAUSE_HOURS * 3600_000).toISOString();
    convUpdate.unread_count = 0;
  } else {
    convUpdate.unread_count = convUnread + 1;
  }
  await admin.from("conversations").update(convUpdate).eq("id", convId);

  if (fromMe) {
    return json({ ok: true, human_takeover: true, hours: HUMAN_PAUSE_HOURS });
  }

  // Decide: should AI reply?
  const takeoverActive = convTakeoverUntil && new Date(convTakeoverUntil) > new Date();
  if ((contact as any).aurora_blocked) {
    return json({ ok: true, ai_skipped: "contact_blacklisted" });
  }
  if (!convAiEnabled || takeoverActive) {
    return json({ ok: true, ai_skipped: takeoverActive ? "human_takeover" : "ai_disabled" });
  }

  // 🛑 Detecta bots/autorespondedores de outras empresas p/ evitar loop de IA vs IA.
  if (looksLikeAutoresponder(storedBody)) {
    // Pausa a Aurora por 24h nessa conversa e sinaliza pra Sirlei revisar.
    await admin.from("conversations")
      .update({ human_takeover_until: new Date(Date.now() + 24 * 3600_000).toISOString() })
      .eq("id", convId);
    return json({ ok: true, ai_skipped: "autoresponder_detected" });
  }


  // Lock por conversa: cada inbound gera um novo token; só o último vence.
  const replyToken = crypto.randomUUID();
  await admin.from("conversations")
    .update({ pending_reply_token: replyToken })
    .eq("id", convId);

  // Debounce + resposta particionada em background — responde SÓ depois de
  // DEBOUNCE_MS sem novas mensagens, e simula digitação humana entre chunks.
  // @ts-ignore — EdgeRuntime é global no Supabase Edge Runtime
  EdgeRuntime.waitUntil(
    scheduleReply(admin, convId, rawFrom, phone, contact.id, contact.name ?? contactName, arrivedAt, replyToken),
  );

  return json({ ok: true, scheduled: true, debounce_ms: DEBOUNCE_MS, token: replyToken });
});
