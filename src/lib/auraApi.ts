// Single service layer for the intermediate VPS API.
// Components MUST NOT call supabase.functions.invoke directly for Aura features.
// This keeps request shape and error handling consistent, and lets us swap the
// underlying transport (Edge Function today, direct HTTPS later) in one place.
import { supabase } from "@/integrations/supabase/client";

export type AuraProxyResult<T = unknown> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string; message?: string; data?: unknown };

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

  // Messages
  sendMessage: (body: { conversation_id: string; body: string; author?: "sirlei" | "aurora" }) =>
    call({ path: "/api/messages", method: "POST", body }),

  // AI
  prepareReply: (body: { conversation_id: string; hint?: string }) =>
    call({ path: "/api/ai/reply", method: "POST", body }),

  // WhatsApp
  whatsappStatus: () => call({ path: "/api/whatsapp/status" }),
  whatsappStart: () => call({ path: "/api/whatsapp/start", method: "POST" }),
  whatsappQr: () => call({ path: "/api/whatsapp/qr" }),
};

export function isNotConfigured(r: AuraProxyResult): boolean {
  return !r.ok && r.error === "not_configured";
}
