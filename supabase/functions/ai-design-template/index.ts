import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: roleData } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { vibe, count = 4 } = await req.json().catch(() => ({}));
    const variants = Math.max(1, Math.min(8, Number(count) || 4));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const systemPrompt = `Você é diretor(a) de arte de luxo da Aura Clinic — clínica estética premium em Tangará da Serra. A marca usa Marsala (#58101b) como cor-âncora, mas você pode propor variações sofisticadas. Crie ${variants} variações de design tokens DISTINTAS entre si, todas elegantes, editoriais, dignas de revista de luxo (Vogue, Harper's Bazaar). Cada variação precisa ter personalidade visual própria. Use somente fontes seguras: 'Cormorant Garamond' (display) e 'Inter' (body). Mantenha contraste alto e legibilidade impecável.`;

    const userPrompt = `Gere ${variants} variações de design tokens. Vibe sugerida: ${vibe || "livre, surpreenda"}. Cada variação deve ter:
- name: nome poético em português (ex: "Mármore Rosado", "Onyx & Champagne")
- bg: cor de fundo principal (hex)
- bgAccent: cor de painel/contraste (hex)
- ink: cor de texto sobre bg (hex)
- inkSoft: ink com 60-70% opacidade (hex8 com alpha)
- paper: cor de texto sobre bgAccent (hex)
- paperSoft: paper com alpha (hex8)
- accent: cor vibrante de destaque (hex)
- shapeStyle: 'organic' | 'sharp' | 'arch' | 'circle'
- vibe: 'editorial' | 'magazine' | 'minimal' | 'dramatic'
- radius: number 0-32

REGRAS CRÍTICAS:
- bg e ink devem ter contraste WCAG AA mínimo
- bgAccent e paper devem ter contraste WCAG AA mínimo
- accent deve destacar contra AMBOS bg e bgAccent
- Variações devem ser CLARAMENTE diferentes entre si (não repita paletas)
- Sempre usar Cormorant para display e Inter para body`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_design_variants",
              description: "Retorna variações de design tokens",
              parameters: {
                type: "object",
                properties: {
                  variants: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        bg: { type: "string" },
                        bgAccent: { type: "string" },
                        ink: { type: "string" },
                        inkSoft: { type: "string" },
                        paper: { type: "string" },
                        paperSoft: { type: "string" },
                        accent: { type: "string" },
                        shapeStyle: { type: "string", enum: ["organic", "sharp", "arch", "circle"] },
                        vibe: { type: "string", enum: ["editorial", "magazine", "minimal", "dramatic"] },
                        radius: { type: "number" },
                      },
                      required: ["name", "bg", "bgAccent", "ink", "inkSoft", "paper", "paperSoft", "accent", "shapeStyle", "vibe", "radius"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["variants"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_design_variants" } },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("AI gateway error:", resp.status, errText);
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Limite atingido. Aguarde alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos esgotados. Adicione créditos no workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Falha na IA");
    }

    const data = await resp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("Resposta IA inválida");
    const parsed = JSON.parse(args);

    // Acrescenta as fontes fixas e tipografia esperada pelo cliente
    const enriched = (parsed.variants || []).map((v: Record<string, unknown>) => ({
      ...v,
      displayFont: "'Cormorant Garamond', Georgia, serif",
      bodyFont: "'Inter', system-ui, sans-serif",
    }));

    return new Response(JSON.stringify({ variants: enriched }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-design-template error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
