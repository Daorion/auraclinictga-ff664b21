// Single service layer for the intermediate VPS API.
// Components MUST NOT call supabase.functions.invoke directly for Aura features.
// This keeps request shape and error handling consistent, and lets us swap the
// underlying transport (Edge Function today, direct HTTPS later) in one place.
import { supabase } from "@/integrations/supabase/client";

export interface AuraProxyResult<T = unknown> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  message?: string;
}

interface CallOptions {
  path: string;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

async function call<T = unknown>(opts: CallOptions): Promise<AuraProxyResult<T>> {
  const { data, error } = await supabase.functions.invoke("aura-proxy", { body: opts });
  if (error) {
    return { ok: false, status: 0, error: "network_error", message: error.message };
  }
  const payload = data as any;
  if (payload?.error) {
    return {
      ok: false,
      status: payload.status ?? 500,
      error: payload.error,
      message: payload.message,
      data: payload.data,
    };
  }
  return { ok: true, status: payload.status ?? 200, data: payload.data as T };
}

export const auraApi = {
  raw: call,

  health: () => call({ path: "/health" }),

  // Conversations
  listConversations: (params?: { stage?: string; assignee?: string; q?: string }) =>
    call({ path: "/api/conversations", query: params }),
  updateConversation: (id: string, body: Record<string, unknown>) =>
    call({ path: `/api/conversations/${id}`, method: "PATCH", body }),

  // Messages — sends via WhatsApp (WAHA) directly from Lovable edge function.
  sendMessage: async (body: { conversation_id: string; body: string; author?: "sirlei" | "aurora" }) => {
    const { data, error } = await supabase.functions.invoke("waha-send", {
      body: { conversation_id: body.conversation_id, text: body.body, pause_ai: true },
    });
    if (error) return { ok: false, status: 0, error: "network_error", message: error.message } as AuraProxyResult;
    if ((data as any)?.error) return { ok: false, status: 500, error: (data as any).error, message: (data as any).error } as AuraProxyResult;
    return { ok: true, status: 200, data } as AuraProxyResult;
  },

  // AI
  prepareReply: (body: { conversation_id: string; hint?: string }) =>
    call({ path: "/api/ai/reply", method: "POST", body }),

  // WhatsApp
  whatsappStatus: () => call({ path: "/api/whatsapp/status" }),
  whatsappStart: () => call({ path: "/api/whatsapp/start", method: "POST" }),
  whatsappQr: () => call({ path: "/api/whatsapp/qr" }),
};

export function isNotConfigured(r: AuraProxyResult): boolean {
  return r.ok === false && r.error === "not_configured";
}
