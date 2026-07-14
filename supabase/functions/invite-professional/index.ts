// Convida uma profissional: cria/reutiliza usuário no Auth, atribui papel 'profissional'
// e vincula ao registro em public.professionals via user_id.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verifica o solicitante (deve ser admin)
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes.user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: { ...corsHeaders, "content-type": "application/json" } });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleCheck } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userRes.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Apenas admins podem convidar" }), { status: 403, headers: { ...corsHeaders, "content-type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const { professional_id, email, password } = body as { professional_id?: string; email?: string; password?: string };
    if (!professional_id || !email || !password || password.length < 6) {
      return new Response(JSON.stringify({ error: "Dados inválidos (email, senha ≥ 6, professional_id)" }), { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } });
    }

    // Cria (ou reaproveita) usuário no Auth
    let userId: string | null = null;
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (created.error) {
      // Se já existe, tenta localizar
      const list = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const found = list.data?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (!found) {
        return new Response(JSON.stringify({ error: created.error.message }), { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } });
      }
      userId = found.id;
      // Atualiza a senha
      await admin.auth.admin.updateUserById(userId, { password });
    } else {
      userId = created.data.user!.id;
    }

    // Atribui role profissional
    await admin.from("user_roles").upsert({ user_id: userId, role: "profissional" }, { onConflict: "user_id,role" });

    // Vincula profissional
    const { error: linkErr } = await admin
      .from("professionals")
      .update({ user_id: userId, email })
      .eq("id", professional_id);
    if (linkErr) {
      return new Response(JSON.stringify({ error: linkErr.message }), { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: true, user_id: userId }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } });
  }
});
