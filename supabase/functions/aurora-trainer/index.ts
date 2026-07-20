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
const TZ_OFFSET = "-04:00"; // Tangará da Serra/MT

const SYSTEM_PROMPT = `Você é a Aurora, assistente pessoal e secretária da Sirlei (dona da Aura Clinic). Este canal é o chat interno dela — você age como uma funcionária de confiança:
- Cuida da agenda da Sirlei (consulta, cria, reagenda e cancela horários dela).
- Registra promoções, ordens e correções de persona que devem valer no WhatsApp com clientes.
- Propõe campanhas de prospecção (sempre com aprovação humana antes de qualquer disparo).
- Ajuda a Sirlei a lembrar de coisas, tirar dúvidas do dia e organizar o atendimento.

Como agir aqui:
- Trate a Sirlei com respeito, calor humano e naturalidade. Pode ser direta, técnica e objetiva.
- Para QUALQUER ação de agenda, sempre confirme com ela o resumo (cliente, serviço, dia, hora) antes de chamar a ferramenta, exceto quando ela já der todos os dados de forma clara.
- Padrão de profissional na agenda: SIRLEI. Só use outra profissional se ela pedir explicitamente pelo nome/slug.
- Ao consultar disponibilidade ou criar horário, use fuso Tangará da Serra/MT (UTC-04:00). Se ela disser "amanhã 14h", converta para ISO com offset -04:00.
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
  {
    type: "function",
    function: {
      name: "buscar_cliente",
      description: "Busca clientes pelo nome ou telefone (parcial). Use antes de criar agendamento.",
      parameters: {
        type: "object",
        properties: { termo: { type: "string" } },
        required: ["termo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "criar_cliente",
      description: "Cadastra um novo cliente rapidamente.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          phone: { type: "string", description: "WhatsApp com DDD, ex.: 63999999999" },
          notes: { type: "string" },
        },
        required: ["name", "phone"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listar_agenda",
      description: "Lista agendamentos da Sirlei (ou outra profissional) em um intervalo de datas.",
      parameters: {
        type: "object",
        properties: {
          data_inicio: { type: "string", description: "ISO 8601 com offset (-04:00). Ex.: 2026-07-19T00:00:00-04:00" },
          data_fim: { type: "string", description: "ISO 8601 com offset (-04:00)." },
          professional_slug: { type: "string", description: "Opcional. Padrão: sirlei." },
        },
        required: ["data_inicio", "data_fim"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "verificar_disponibilidade",
      description: "Verifica horários livres em um dia para a profissional (padrão Sirlei), considerando duração desejada.",
      parameters: {
        type: "object",
        properties: {
          data: { type: "string", description: "Dia (YYYY-MM-DD)." },
          duracao_min: { type: "number", description: "Duração em minutos (padrão 60)." },
          professional_slug: { type: "string" },
          hora_inicio: { type: "string", description: "HH:MM local, padrão 08:00" },
          hora_fim: { type: "string", description: "HH:MM local, padrão 19:00" },
        },
        required: ["data"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "criar_agendamento",
      description: "Cria um agendamento na agenda da profissional (padrão Sirlei). Requer client_id (use buscar_cliente/criar_cliente antes).",
      parameters: {
        type: "object",
        properties: {
          client_id: { type: "string" },
          service_name: { type: "string" },
          start_at: { type: "string", description: "ISO 8601 com offset -04:00." },
          duracao_min: { type: "number", description: "Padrão 60." },
          professional_slug: { type: "string" },
          notes: { type: "string" },
          price_cents: { type: "number" },
        },
        required: ["client_id", "service_name", "start_at"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "reagendar_agendamento",
      description: "Move um agendamento existente para um novo horário.",
      parameters: {
        type: "object",
        properties: {
          appointment_id: { type: "string" },
          novo_start_at: { type: "string", description: "ISO 8601 com offset -04:00." },
          nova_duracao_min: { type: "number" },
        },
        required: ["appointment_id", "novo_start_at"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cancelar_agendamento",
      description: "Cancela um agendamento (status = cancelado).",
      parameters: {
        type: "object",
        properties: {
          appointment_id: { type: "string" },
          motivo: { type: "string" },
        },
        required: ["appointment_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listar_servicos",
      description: "Lista serviços cadastrados. Filtros opcionais por texto (nome/categoria) e por profissional.",
      parameters: {
        type: "object",
        properties: {
          termo: { type: "string" },
          professional_slug: { type: "string" },
          incluir_inativos: { type: "boolean" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "criar_servico",
      description: "Cadastra um novo serviço no catálogo (aparece no site e no atendimento da Aurora).",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          category: { type: "string" },
          professional_slug: { type: "string" },
          professional_name: { type: "string" },
          duration: { type: "string", description: "Ex.: '60 min'" },
          duration_minutes: { type: "number" },
          price_cents: { type: "number", description: "Preço em centavos (opcional; 0 para não exibir)." },
          image_url: { type: "string" },
          active: { type: "boolean" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "atualizar_servico",
      description: "Atualiza campos de um serviço existente (nome, preço, duração, ativo, etc.).",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          category: { type: "string" },
          professional_slug: { type: "string" },
          professional_name: { type: "string" },
          duration: { type: "string" },
          duration_minutes: { type: "number" },
          price_cents: { type: "number" },
          image_url: { type: "string" },
          active: { type: "boolean" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listar_profissionais",
      description: "Lista profissionais da clínica (equipe).",
      parameters: {
        type: "object",
        properties: { incluir_inativos: { type: "boolean" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "atualizar_profissional",
      description: "Atualiza dados de uma profissional (bio, título, comissão, ativa, foto, whatsapp).",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          slug: { type: "string", description: "Alternativa ao id." },
          name: { type: "string" },
          title: { type: "string" },
          bio: { type: "string" },
          photo_url: { type: "string" },
          whatsapp_phone: { type: "string" },
          email: { type: "string" },
          commission_percent: { type: "number" },
          active: { type: "boolean" },
          display_order: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "atualizar_cliente",
      description: "Atualiza dados cadastrais de um cliente (telefone, email, tags, notas, ativo, etc.).",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          phone: { type: "string" },
          whatsapp_phone: { type: "string" },
          email: { type: "string" },
          birth_date: { type: "string", description: "YYYY-MM-DD" },
          cpf: { type: "string" },
          address: { type: "string" },
          city: { type: "string" },
          state: { type: "string" },
          notes: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          active: { type: "boolean" },
        },
        required: ["id"],
      },
    },
  },
];

async function resolveProfessionalId(admin: any, slug?: string): Promise<string> {
  if (!slug) return SIRLEI_PROFESSIONAL_ID;
  const { data } = await admin.from("professionals").select("id").eq("slug", slug).maybeSingle();
  return data?.id ?? SIRLEI_PROFESSIONAL_ID;
}


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
    if (name === "buscar_cliente") {
      const termo = String(args.termo ?? "").trim();
      if (!termo) return { error: "termo_vazio" };
      const digits = termo.replace(/\D/g, "");
      let q = admin.from("clients").select("id, name, phone, whatsapp_phone, email").eq("active", true).limit(20);
      if (digits.length >= 4) {
        q = q.or(`phone.ilike.%${digits}%,whatsapp_phone.ilike.%${digits}%`);
      } else {
        q = q.ilike("name", `%${termo}%`);
      }
      const { data } = await q;
      return { total: data?.length ?? 0, clientes: data ?? [] };
    }
    if (name === "criar_cliente") {
      const { data, error } = await admin.from("clients").insert({
        name: args.name, whatsapp_phone: args.phone, phone: args.phone,
        notes: args.notes ?? null, active: true, created_by: userId,
      }).select("id, name, whatsapp_phone").single();
      if (error) return { error: error.message };
      return { ok: true, cliente: data };
    }
    if (name === "listar_agenda") {
      const profId = await resolveProfessionalId(admin, args.professional_slug);
      const { data, error } = await admin.from("appointments")
        .select("id, start_at, end_at, status, service_name, notes, price_cents, client_id, clients(name, whatsapp_phone)")
        .eq("professional_id", profId)
        .gte("start_at", args.data_inicio)
        .lte("start_at", args.data_fim)
        .order("start_at", { ascending: true });
      if (error) return { error: error.message };
      return {
        total: data?.length ?? 0,
        agendamentos: (data ?? []).map((a: any) => ({
          id: a.id, start_at: a.start_at, end_at: a.end_at, status: a.status,
          service: a.service_name, cliente: a.clients?.name, telefone: a.clients?.whatsapp_phone,
          notas: a.notes,
        })),
      };
    }
    if (name === "verificar_disponibilidade") {
      const profId = await resolveProfessionalId(admin, args.professional_slug);
      const dur = Math.max(15, Number(args.duracao_min) || 60);
      const dia = String(args.data);
      const hIni = String(args.hora_inicio ?? "08:00");
      const hFim = String(args.hora_fim ?? "19:00");
      const inicio = new Date(`${dia}T${hIni}:00${TZ_OFFSET}`);
      const fim = new Date(`${dia}T${hFim}:00${TZ_OFFSET}`);
      const { data: ocupados } = await admin.from("appointments")
        .select("start_at, end_at, status")
        .eq("professional_id", profId)
        .gte("start_at", inicio.toISOString())
        .lte("start_at", fim.toISOString())
        .not("status", "in", "(cancelado,faltou)");
      const busy = (ocupados ?? []).map((o: any) => ({ s: new Date(o.start_at).getTime(), e: new Date(o.end_at).getTime() }));
      const slots: string[] = [];
      const step = 30 * 60 * 1000;
      const durMs = dur * 60 * 1000;
      for (let t = inicio.getTime(); t + durMs <= fim.getTime(); t += step) {
        const conflict = busy.some((b) => t < b.e && t + durMs > b.s);
        if (!conflict) slots.push(new Date(t).toISOString());
      }
      return { data: dia, duracao_min: dur, livres: slots, ocupados: busy.length };
    }
    if (name === "criar_agendamento") {
      const profId = await resolveProfessionalId(admin, args.professional_slug);
      const dur = Math.max(15, Number(args.duracao_min) || 60);
      const start = new Date(args.start_at);
      const end = new Date(start.getTime() + dur * 60 * 1000);
      const { data, error } = await admin.from("appointments").insert({
        client_id: args.client_id, professional_id: profId,
        service_name: args.service_name, start_at: start.toISOString(), end_at: end.toISOString(),
        status: "confirmado", notes: args.notes ?? null,
        price_cents: args.price_cents ?? 0, created_by: userId,
      }).select("id, start_at, end_at, service_name, status").single();
      if (error) return { error: error.message };
      return { ok: true, agendamento: data };
    }
    if (name === "reagendar_agendamento") {
      const { data: cur } = await admin.from("appointments").select("start_at, end_at").eq("id", args.appointment_id).maybeSingle();
      if (!cur) return { error: "agendamento_nao_encontrado" };
      const dur = args.nova_duracao_min
        ? Number(args.nova_duracao_min) * 60 * 1000
        : new Date(cur.end_at).getTime() - new Date(cur.start_at).getTime();
      const start = new Date(args.novo_start_at);
      const end = new Date(start.getTime() + dur);
      const { data, error } = await admin.from("appointments")
        .update({ start_at: start.toISOString(), end_at: end.toISOString() })
        .eq("id", args.appointment_id)
        .select("id, start_at, end_at, service_name").single();
      if (error) return { error: error.message };
      return { ok: true, agendamento: data };
    }
    if (name === "cancelar_agendamento") {
      const patch: any = { status: "cancelado" };
      if (args.motivo) patch.notes = `[Cancelado] ${args.motivo}`;
      const { data, error } = await admin.from("appointments")
        .update(patch).eq("id", args.appointment_id)
        .select("id, status").single();
      if (error) return { error: error.message };
      return { ok: true, agendamento: data };
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
