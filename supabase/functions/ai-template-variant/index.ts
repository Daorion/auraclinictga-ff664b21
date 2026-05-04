import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEMPLATE_IDS = ["editorial-split", "bold-statement", "minimal-serif", "magazine-cover", "story-vertical", "highlight-circle"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: roleData } = await admin
      .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { count = 6 } = await req.json().catch(() => ({}));
    const variants = Math.max(1, Math.min(8, Number(count) || 6));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const systemPrompt = `Você é diretor(a) de arte da Aura Clinic. Gere ${variants} variações COSMÉTICAS de templates de arte. Cada variação aplica ajustes leves sobre um template base existente. Mantenha sofisticação editorial.`;

    const userPrompt = `Gere ${variants} variações distintas. Para cada uma escolha:
- name: nome curto e poético em português (ex: "Editorial Compacto", "Capa Dramática")
- baseTemplateId: um de ${TEMPLATE_IDS.join(", ")}
- titleScale: número entre 0.85 e 1.25
- bulletStyle: 'dot' | 'square' | 'bar' | 'arrow'
- photoFocus: 'face' | 'center' | 'wide'
- align: 'left' | 'center'
- overlayIntensity: 'soft' | 'medium' | 'strong'

Varie ao máximo entre as variações. Distribua entre templates base diferentes.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_template_variants",
            description: "Retorna variações de template",
            parameters: {
              type: "object",
              properties: {
                variants: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      baseTemplateId: { type: "string", enum: TEMPLATE_IDS },
                      titleScale: { type: "number" },
                      bulletStyle: { type: "string", enum: ["dot", "square", "bar", "arrow"] },
                      photoFocus: { type: "string", enum: ["face", "center", "wide"] },
                      align: { type: "string", enum: ["left", "center"] },
                      overlayIntensity: { type: "string", enum: ["soft", "medium", "strong"] },
                    },
                    required: ["name", "baseTemplateId", "titleScale", "bulletStyle", "photoFocus", "align", "overlayIntensity"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["variants"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_template_variants" } },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("AI gateway error:", resp.status, errText);
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Limite atingido. Aguarde alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Falha na IA");
    }

    const data = await resp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("Resposta IA inválida");
    const parsed = JSON.parse(args);

    // sanitiza
    const cleaned = (parsed.variants || []).map((v: Record<string, unknown>) => ({
      name: String(v.name || "Variação"),
      baseTemplateId: TEMPLATE_IDS.includes(String(v.baseTemplateId)) ? v.baseTemplateId : TEMPLATE_IDS[0],
      titleScale: Math.max(0.85, Math.min(1.25, Number(v.titleScale) || 1)),
      bulletStyle: ["dot", "square", "bar", "arrow"].includes(String(v.bulletStyle)) ? v.bulletStyle : "dot",
      photoFocus: ["face", "center", "wide"].includes(String(v.photoFocus)) ? v.photoFocus : "face",
      align: ["left", "center"].includes(String(v.align)) ? v.align : "left",
      overlayIntensity: ["soft", "medium", "strong"].includes(String(v.overlayIntensity)) ? v.overlayIntensity : "medium",
    }));

    return new Response(JSON.stringify({ variants: cleaned }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-template-variant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
