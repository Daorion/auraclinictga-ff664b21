import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FORMAT_DIMENSIONS: Record<string, string> = {
  story: "vertical 9:16 portrait composition",
  post: "square 1:1 composition",
  carousel: "square 1:1 composition (slide of a carousel)",
  flyer: "vertical A4 portrait composition",
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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData.user) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { serviceId, serviceName, serviceDescription, format, customPrompt, slideIndex, existingBackgroundUrl } = await req.json();

    if (!serviceName || !format || !FORMAT_DIMENSIONS[format]) {
      return new Response(JSON.stringify({ error: "Parâmetros inválidos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    let backgroundUrl = "";
    let imagePrompt = "";

    if (existingBackgroundUrl) {
      // Pular IA — usar imagem cadastrada do procedimento como fundo direto
      backgroundUrl = existingBackgroundUrl;
      imagePrompt = "Imagem do procedimento cadastrada manualmente";
    } else {
      // 1. Gerar imagem de fundo via IA (sem texto — texto será sobreposto pelo editor)
      imagePrompt = customPrompt || `Luxurious aesthetic spa/clinic background for "${serviceName}". ${serviceDescription || ""}. Style: elegant, premium, marsala (#58101b) and gold accents, soft lighting, blurred bokeh, marble or silk textures, sophisticated minimalism. ${FORMAT_DIMENSIONS[format]}. NO TEXT, NO LOGOS, NO PEOPLE FACES — only ambient background suitable for overlaying text on top. Professional editorial quality.`;

      const imageResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: imagePrompt }],
          modalities: ["image", "text"],
        }),
      });

      if (!imageResp.ok) {
        const errText = await imageResp.text();
        console.error("Image gen error:", imageResp.status, errText);
        if (imageResp.status === 429) {
          return new Response(JSON.stringify({ error: "Limite de uso atingido. Tente novamente em alguns minutos." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (imageResp.status === 402) {
          return new Response(JSON.stringify({ error: "Créditos esgotados. Adicione créditos no workspace Lovable." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error("Falha ao gerar imagem");
      }

      const imageData = await imageResp.json();
      const base64Url = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!base64Url) throw new Error("Imagem não retornada pela IA");

      // 2. Upload para storage
      const base64 = base64Url.split(",")[1];
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const fileName = `${format}/${Date.now()}-${crypto.randomUUID()}.png`;

      const { error: uploadErr } = await supabase.storage
        .from("artworks")
        .upload(fileName, bytes, { contentType: "image/png", upsert: false });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("artworks").getPublicUrl(fileName);
      backgroundUrl = urlData.publicUrl;
    }

    // 3. Gerar legenda + hashtags
    const captionResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Você é copywriter da Aura Clinic TGA, clínica estética premium em Marsala. Escreva legendas envolventes para Instagram em português brasileiro, com tom luxuoso, acolhedor e profissional. Sempre termine com CTA convidando para agendar pelo WhatsApp. NÃO mencione preços.",
          },
          {
            role: "user",
            content: `Crie uma legenda para Instagram sobre o serviço "${serviceName}". ${serviceDescription ? `Descrição: ${serviceDescription}.` : ""} Formato: ${format}. Retorne JSON com { "caption": "...", "hashtags": "#tag1 #tag2 ..." } — 5 a 8 hashtags relevantes.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_caption",
              description: "Retorna legenda e hashtags para Instagram",
              parameters: {
                type: "object",
                properties: {
                  caption: { type: "string", description: "Legenda do post (3-6 linhas, com emojis sutis e CTA)" },
                  hashtags: { type: "string", description: "Hashtags separadas por espaço, todas começando com #" },
                },
                required: ["caption", "hashtags"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_caption" } },
      }),
    });

    let caption = "";
    let hashtags = "";
    if (captionResp.ok) {
      const capData = await captionResp.json();
      const args = capData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (args) {
        try {
          const parsed = JSON.parse(args);
          caption = parsed.caption || "";
          hashtags = parsed.hashtags || "";
        } catch (e) {
          console.error("Parse caption error:", e);
        }
      }
    }

    return new Response(
      JSON.stringify({
        backgroundUrl,
        caption,
        hashtags,
        prompt: imagePrompt,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-artwork error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
