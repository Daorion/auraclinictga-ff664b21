// aurora-trainer — chat da administradora com a Aurora.
// Salva histórico em aurora_trainer_messages, expõe ferramentas para criar
// diretivas (instruções/promoções) e propor campanhas de prospecção.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";

const SIRLEI_PROFESSIONAL_ID = "2b583d7c-b30f-4df6-840f-7ede47ea891e";
const TZ_OFFSET = "-03:00"; // Araguaína/TO

const SYSTEM_PROMPT = `Você é a Aurora, assistente pessoal e secretária da Sirlei (dona da Aura Clinic). Este canal é o chat interno dela — você age como uma funcionária de confiança:
- Cuida da agenda da Sirlei (consulta, cria, reagenda e cancela horários dela).
- Registra promoções, ordens e correções de persona que devem valer no WhatsApp com clientes.
- Propõe campanhas de prospecção (sempre com aprovação humana antes de qualquer disparo).
- Ajuda a Sirlei a lembrar de coisas, tirar dúvidas do dia e organizar o atendimento.

Como agir aqui:
- Trate a Sirlei com respeito, calor humano e naturalidade. Pode ser direta, técnica e objetiva.
- Para QUALQUER ação de agenda, sempre confirme com ela o resumo (cliente, serviço, dia, hora) antes de chamar a ferramenta, exceto quando ela já der todos os dados de forma clara.
- Padrão de profissional na agenda: SIRLEI. Só use outra profissional se ela pedir explicitamente pelo nome/slug.
- Ao consultar disponibilidade ou criar horário, use fuso Araguaína/TO (UTC-03:00). Se ela disser "amanhã 14h", converta para ISO com offset -03:00.
- Para clientes, tente primeiro \`buscar_cliente\` pelo nome/telefone. Se não achar, pergunte se pode cadastrar novo (ou use \`criar_cliente\`).
- SEMPRE que ela descrever uma promoção, regra, informação nova ou correção que valha para o WhatsApp dos clientes, chame \`salvar_diretiva\`.
- Prospecção ("mande promoção X pros inativos"): NUNCA dispare. Use \`buscar_clientes_inativos\`, mostre resumo, monte mensagem e chame \`criar_campanha\` (draft).
- Nunca invente clientes, telefones ou horários. Só use dados reais das ferramentas.
- Responda em português BR, tom profissional e acolhedor. Confirme sempre o que foi feito citando cliente, dia/hora e id curto.
- Hoje é ${new Date().toISOString()} (UTC).`;

const tools = [
  {
    type: "function",
    function: {
      name: "salvar_diretiva",
      description: "Registra uma diretriz permanente que a Aurora deve seguir ao responder clientes no WhatsApp (promoção, correção de persona, informação nova, etc.).",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título curto (ex.: 'Promoção Setembro Botox')." },
          content: { type: "string", description: "Instrução completa como a Aurora deve aplicá-la ao falar com clientes." },
          kind: { type: "string", enum: ["instrucao", "promocao", "persona", "conhecimento"] },
          ends_at: { type: "string", description: "ISO 8601 opcional — data em que a diretriz expira (ex.: fim de promoção)." },
        },
        required: ["title", "content", "kind"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listar_diretivas",
      description: "Lista as diretivas ativas atualmente.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "desativar_diretiva",
      description: "Desativa uma diretriz pelo id.",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "buscar_clientes_inativos",
      description: "Retorna clientes cadastrados que não têm agendamento realizado há X dias. Use para propor campanhas de reativação.",
      parameters: {
        type: "object",
        properties: {
          dias_sem_agendar: { type: "number", description: "Ex.: 90, 180, 365." },
          limite: { type: "number", description: "Máximo de clientes a retornar (padrão 50)." },
        },
        required: ["dias_sem_agendar"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "criar_campanha",
      description: "Cria uma campanha de prospecção em modo DRAFT (nenhuma mensagem é enviada até a administradora aprovar caso a caso no painel).",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          goal: { type: "string", description: "Objetivo curto da campanha." },
          message_template: { type: "string", description: "Mensagem base. Use {{nome}} para primeiro nome." },
          client_ids: { type: "array", items: { type: "string" }, description: "IDs dos clientes a incluir." },
        },
        required: ["name", "message_template", "client_ids"],
      },
    },
  },
];

async function executeTool(admin: any, userId: string, name: string, args: any): Promise<any> {
  try {
    if (name === "salvar_diretiva") {
      const { data, error } = await admin.from("aurora_directives").insert({
        title: args.title, content: args.content, kind: args.kind ?? "instrucao",
        ends_at: args.ends_at ?? null, created_by: userId, active: true,
      }).select("id, title, kind, ends_at").single();
      if (error) return { error: error.message };
      return { ok: true, directive: data };
    }
    if (name === "listar_diretivas") {
      const { data } = await admin.from("aurora_directives")
        .select("id, title, kind, content, ends_at, active")
        .eq("active", true).order("created_at", { ascending: false }).limit(50);
      return { directives: data ?? [] };
    }
    if (name === "desativar_diretiva") {
      const { error } = await admin.from("aurora_directives").update({ active: false }).eq("id", args.id);
      if (error) return { error: error.message };
      return { ok: true };
    }
    if (name === "buscar_clientes_inativos") {
      const dias = Math.max(1, Number(args.dias_sem_agendar) || 90);
      const limite = Math.min(200, Number(args.limite) || 50);
      const cutoff = new Date(Date.now() - dias * 86400 * 1000).toISOString();
      const { data: recentes } = await admin
        .from("appointments")
        .select("client_id")
        .eq("status", "realizado")
        .gte("start_at", cutoff);
      const excluir = new Set((recentes ?? []).map((r: any) => r.client_id));
      const { data: clientes } = await admin
        .from("clients")
        .select("id, name, phone, whatsapp_phone")
        .eq("active", true)
        .limit(500);
      const inativos = (clientes ?? [])
        .filter((c: any) => (c.phone || c.whatsapp_phone) && !excluir.has(c.id))
        .slice(0, limite);
      return {
        total: inativos.length,
        clientes: inativos.map((c: any) => ({
          id: c.id, name: c.name, phone: c.whatsapp_phone || c.phone,
        })),
      };
    }
    if (name === "criar_campanha") {
      const { data: campaign, error } = await admin.from("aurora_campaigns").insert({
        name: args.name, goal: args.goal ?? null,
        message_template: args.message_template, status: "draft", created_by: userId,
      }).select("id, name").single();
      if (error) return { error: error.message };
      const ids: string[] = Array.isArray(args.client_ids) ? args.client_ids : [];
      if (ids.length) {
        const { data: clients } = await admin.from("clients").select("id, name, phone, whatsapp_phone").in("id", ids);
        const rows = (clients ?? []).map((c: any) => ({ ...c, phone: c.whatsapp_phone || c.phone })).filter((c: any) => c.phone).map((c: any) => {
          const firstName = String(c.name ?? "").split(" ")[0] || "";
          const msg = String(args.message_template).replaceAll("{{nome}}", firstName);
          return {
            campaign_id: campaign.id, client_id: c.id, contact_name: c.name,
            phone: c.phone, suggested_message: msg, status: "pending",
          };
        });
        if (rows.length) await admin.from("aurora_campaign_targets").insert(rows);
        return { ok: true, campaign_id: campaign.id, name: campaign.name, targets: rows.length };
      }
      return { ok: true, campaign_id: campaign.id, name: campaign.name, targets: 0 };
    }
    return { error: `unknown_tool_${name}` };
  } catch (e) {
    return { error: String(e) };
  }
}

async function loadDirectivesContext(admin: any): Promise<string> {
  const { data } = await admin.from("aurora_directives")
    .select("title, kind, content, ends_at").eq("active", true).limit(30);
  if (!data?.length) return "\n\nNenhuma diretiva ativa registrada ainda.";
  return "\n\n=== Diretivas ativas (contexto) ===\n" + data.map((d: any) =>
    `[${d.kind}] ${d.title}${d.ends_at ? ` (até ${d.ends_at})` : ""}: ${d.content}`
  ).join("\n");
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
  const userMessage = String(body?.message ?? "").trim();
  if (!userMessage) return json({ error: "empty_message" }, 400);

  // Save user message
  await admin.from("aurora_trainer_messages").insert({
    role: "user", content: userMessage, user_id: user.id,
  });

  // Load recent history
  const { data: history } = await admin.from("aurora_trainer_messages")
    .select("role, content, parts").order("created_at", { ascending: false }).limit(30);
  const historyAsc = (history ?? []).reverse();

  const directivesCtx = await loadDirectivesContext(admin);

  const messages: any[] = [
    { role: "system", content: SYSTEM_PROMPT + directivesCtx },
    ...historyAsc.map((m: any) => {
      if (m.role === "assistant" && m.parts?.tool_calls) {
        return { role: "assistant", content: m.content || "", tool_calls: m.parts.tool_calls };
      }
      if (m.role === "tool" && m.parts?.tool_call_id) {
        return { role: "tool", content: m.content, tool_call_id: m.parts.tool_call_id };
      }
      return { role: m.role, content: m.content };
    }),
  ];

  // Tool loop (max 5 iterations)
  let finalText = "";
  for (let i = 0; i < 5; i++) {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages, tools, tool_choice: "auto",
      }),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      return json({ error: "ai_error", status: resp.status, detail: errText }, 500);
    }
    const data = await resp.json();
    const choice = data.choices?.[0]?.message;
    if (!choice) return json({ error: "no_choice" }, 500);

    const toolCalls = choice.tool_calls;
    if (toolCalls?.length) {
      // Save assistant tool_call step
      await admin.from("aurora_trainer_messages").insert({
        role: "assistant", content: choice.content ?? "",
        parts: { tool_calls: toolCalls }, user_id: null,
      });
      messages.push({ role: "assistant", content: choice.content ?? "", tool_calls: toolCalls });
      for (const tc of toolCalls) {
        let args: any = {};
        try { args = JSON.parse(tc.function.arguments || "{}"); } catch {}
        const result = await executeTool(admin, user.id, tc.function.name, args);
        const resultStr = JSON.stringify(result);
        await admin.from("aurora_trainer_messages").insert({
          role: "tool", content: resultStr,
          parts: { tool_call_id: tc.id, tool_name: tc.function.name },
        });
        messages.push({ role: "tool", content: resultStr, tool_call_id: tc.id });
      }
      continue;
    }
    finalText = choice.content ?? "";
    break;
  }

  await admin.from("aurora_trainer_messages").insert({
    role: "assistant", content: finalText,
  });

  return json({ ok: true, reply: finalText });
});
