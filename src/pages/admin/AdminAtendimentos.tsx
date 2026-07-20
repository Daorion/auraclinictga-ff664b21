import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { auraApi, isNotConfigured } from "@/lib/auraApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, Send, Sparkles, UserCheck, Bot, MessageCircle, AlertTriangle, RefreshCw, Check, CheckCheck, Clock, XCircle, ArrowLeft, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Conversation {
  id: string;
  contact_id: string;
  stage: string;
  assigned_to: "aurora" | "sirlei";
  ai_enabled: boolean;
  human_takeover_until: string | null;
  interest: string | null;
  unread_count: number;
  last_message_at: string | null;
  last_message_preview: string | null;
  status: string;
  internal_notes: string | null;
  needs_review: boolean;
  review_reason: string | null;
  review_requested_at: string | null;
}

interface Contact { id: string; phone: string; name: string | null; push_name?: string | null; profile_picture_url?: string | null; client_id?: string | null; client_name?: string | null; aurora_blocked?: boolean | null; }
interface Message {
  id: string;
  conversation_id: string;
  direction: "in" | "out";
  body: string;
  author: string;
  status: string | null;
  is_draft: boolean;
  error: string | null;
  created_at: string;
}

const stageLabel: Record<string, string> = {
  novo_contato: "Novo",
  em_qualificacao: "Qualificação",
  interessado: "Interessado",
  aguardando_resposta: "Aguardando",
  solicitou_horario: "Quer horário",
  agendado: "Agendado",
  confirmado: "Confirmado",
  em_atendimento: "Em atendimento",
  cliente_recorrente: "Recorrente",
  encerrado: "Encerrado",
};

const AdminAtendimentos = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contactsById, setContactsById] = useState<Record<string, Contact>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    const { data: convs } = await supabase
      .from("conversations")
      .select("id,contact_id,stage,assigned_to,ai_enabled,human_takeover_until,interest,unread_count,last_message_at,last_message_preview,status,internal_notes,needs_review,review_reason,review_requested_at")
      .eq("status", "open")
      .order("needs_review", { ascending: false })
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(200);

    const list = (convs ?? []) as Conversation[];
    setConversations(list);
    const ids = list.map((c) => c.contact_id);
    if (ids.length) {
      const { data: contacts } = await supabase
        .from("contacts").select("id,phone,name,push_name,profile_picture_url,client_id,aurora_blocked").in("id", ids);
      const rows = (contacts ?? []) as Contact[];

      // Fetch linked clients (by client_id first, then by matching last 10 digits of phone)
      const clientIds = Array.from(new Set(rows.map((c) => c.client_id).filter(Boolean))) as string[];
      const clientsById: Record<string, string> = {};
      if (clientIds.length) {
        const { data: cls } = await supabase.from("clients").select("id,name").in("id", clientIds);
        (cls ?? []).forEach((cl: any) => { clientsById[cl.id] = cl.name; });
      }
      const unlinkedPhones = rows.filter((c) => !c.client_id).map((c) => c.phone.slice(-10)).filter((p) => p.length >= 8);
      const clientsByLast10: Record<string, { id: string; name: string }> = {};
      if (unlinkedPhones.length) {
        const { data: cls2 } = await supabase.from("clients").select("id,name,phone");
        (cls2 ?? []).forEach((cl: any) => {
          const last10 = String(cl.phone ?? "").replace(/\D/g, "").slice(-10);
          if (last10.length >= 8) clientsByLast10[last10] = { id: cl.id, name: cl.name };
        });
      }

      const map: Record<string, Contact> = {};
      rows.forEach((c) => {
        let clientName: string | null = null;
        if (c.client_id && clientsById[c.client_id]) clientName = clientsById[c.client_id];
        else {
          const match = clientsByLast10[c.phone.slice(-10)];
          if (match) clientName = match.name;
        }
        map[c.id] = { ...c, client_name: clientName };
      });
      setContactsById(map);
    }
    setLoading(false);
  };

  const loadMessages = async (convId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("id,conversation_id,direction,body,author,status,is_draft,error,created_at")
      .eq("conversation_id", convId)
      .order("sent_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });
    setMessages((data ?? []) as Message[]);
    await supabase.from("conversations").update({ unread_count: 0 }).eq("id", convId);
  };

  useEffect(() => { loadConversations(); }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      loadConversations();
      if (activeId) loadMessages(activeId);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [activeId]);

  useEffect(() => {
    const ch = supabase
      .channel("aura-inbox")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => loadConversations())
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, (payload: any) => {
        const row = payload.new as Message | undefined;
        if (row && row.conversation_id === activeId) loadMessages(activeId);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeId]);

  useEffect(() => {
    if (activeId) loadMessages(activeId);
    else setMessages([]);
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const active = useMemo(() => conversations.find((c) => c.id === activeId) ?? null, [conversations, activeId]);
  const activeContact = active ? contactsById[active.contact_id] : null;

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.trim().toLowerCase();
    return conversations.filter((c) => {
      const ct = contactsById[c.contact_id];
      return ct?.phone.toLowerCase().includes(q) || ct?.name?.toLowerCase().includes(q) || c.last_message_preview?.toLowerCase().includes(q);
    });
  }, [conversations, contactsById, search]);

  const handleSend = async () => {
    if (!active || !reply.trim()) return;
    setSending(true);
    const res = await auraApi.sendMessage({ conversation_id: active.id, body: reply.trim(), author: "sirlei" });
    setSending(false);
    if (isNotConfigured(res)) {
      setApiUnavailable(true);
      toast.error("API intermediária ainda não está configurada. A mensagem não foi enviada ao WhatsApp.");
      return;
    }
    if (!res.ok) { toast.error(res.message ?? "Falha ao enviar"); return; }
    setReply("");
    toast.success("Mensagem enviada");
  };

  const handlePrepare = async () => {
    if (!active) return;
    setPreparing(true);
    const res = await auraApi.prepareReply({ conversation_id: active.id });
    setPreparing(false);
    if (isNotConfigured(res)) {
      setApiUnavailable(true);
      toast.error("Aurora ainda não pode gerar respostas: API intermediária não configurada.");
      return;
    }
    if (!res.ok) { toast.error(res.message ?? "Falha na IA"); return; }
    const suggestion = (res.data as any)?.reply ?? "";
    if (suggestion) setReply(suggestion);
  };

  const handleToggleAi = async (enable: boolean) => {
    if (!active) return;
    const patch = enable
      ? { ai_enabled: true, assigned_to: "aurora" as const, human_takeover_until: null }
      : { ai_enabled: false, assigned_to: "sirlei" as const };
    await supabase.from("conversations").update(patch).eq("id", active.id);
    await supabase.from("audit_log").insert({
      action: enable ? "conversation.ai_resumed" : "conversation.ai_paused",
      entity_type: "conversation",
      entity_id: active.id,
      actor_user_id: (await supabase.auth.getUser()).data.user?.id ?? null,
    });
    toast.success(enable ? "IA reativada nesta conversa." : "IA pausada. Você assumiu.");
    loadConversations();
  };

  const [syncing, setSyncing] = useState(false);
  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("waha-sync", { body: { chats: 30, messages: 30 } });
      if (error) throw error;
      const s = (data as any)?.stats;
      toast.success(`Sincronizado: ${s?.chats ?? 0} chats, ${s?.messages ?? 0} mensagens novas.`);
      await loadConversations();
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao sincronizar com WAHA");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Atendimentos</h1>
          <p className="text-muted-foreground mt-1 text-sm">Caixa de entrada em tempo real do WhatsApp da clínica</p>
        </div>
        <Button onClick={handleSync} disabled={syncing} variant="outline" size="sm" className="sm:size-default self-start sm:self-auto">
          {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          <span className="hidden xs:inline">Atualizar do WhatsApp</span>
          <span className="xs:hidden">Atualizar</span>
        </Button>
      </header>

      {apiUnavailable && (
        <Card className="p-4 border-amber-500/40 bg-amber-500/5 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">API intermediária não configurada</p>
            <p className="text-muted-foreground">
              As mensagens que já chegaram no banco são exibidas, mas o envio para o WhatsApp e a Aurora só funcionam
              quando <code>AURA_API_URL</code> e <code>AURA_API_TOKEN</code> estiverem definidos no backend.
            </p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-180px)] lg:h-[calc(100vh-220px)] min-h-[540px]">
        <Card className={`flex-col overflow-hidden ${activeId ? "hidden lg:flex" : "flex"}`}>

          <div className="p-3 border-b">
            <Input placeholder="Buscar conversa…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">
                Nenhuma conversa ainda. Quando uma mensagem chegar pelo WhatsApp, ela aparecerá aqui.
              </p>
            ) : (
              filtered.map((c) => {
                const ct = contactsById[c.contact_id];
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className={`w-full text-left p-3 border-b hover:bg-muted/40 transition-colors ${activeId === c.id ? "bg-muted/60" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      {ct?.profile_picture_url ? (
                        <img
                          src={ct.profile_picture_url}
                          alt=""
                          onClick={(e) => { e.stopPropagation(); setLightboxUrl(ct.profile_picture_url!); }}
                          className="w-10 h-10 rounded-full object-cover shrink-0 cursor-zoom-in hover:ring-2 hover:ring-primary/50 transition"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground shrink-0">
                          {(ct?.push_name ?? ct?.name ?? ct?.phone ?? "?").slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium truncate">{ct?.client_name ?? ct?.name ?? ct?.push_name ?? ct?.phone ?? "—"}</span>
                          {c.unread_count > 0 && <Badge className="shrink-0">{c.unread_count}</Badge>}
                        </div>
                        {ct?.push_name && ct.push_name !== (ct.client_name ?? ct.name) && (
                          <p className="text-[11px] text-muted-foreground truncate">WhatsApp: {ct.push_name}</p>
                        )}
                        {ct?.phone && <p className="text-[11px] text-muted-foreground truncate">+{ct.phone}</p>}
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{c.last_message_preview ?? "…"}</p>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <Badge variant="outline" className="text-[10px] py-0 h-4">{stageLabel[c.stage] ?? c.stage}</Badge>
                          {c.needs_review && (
                            <Badge className="text-[10px] py-0 h-4 gap-1 bg-amber-500 hover:bg-amber-500 text-white border-0 animate-pulse">
                              <HelpCircle className="w-3 h-3" /> Aurora pediu revisão
                            </Badge>
                          )}
                          {(() => {

                            const takeover = c.human_takeover_until && new Date(c.human_takeover_until) > new Date();
                            if (ct?.aurora_blocked) {
                              return (
                                <Badge className="text-[10px] py-0 h-4 gap-1 bg-rose-600/90 hover:bg-rose-600 text-white border-0">
                                  <XCircle className="w-3 h-3" /> Aurora bloqueada
                                </Badge>
                              );
                            }
                            if (takeover) {
                              return (
                                <Badge className="text-[10px] py-0 h-4 gap-1 bg-amber-500/90 hover:bg-amber-500 text-white border-0">
                                  <UserCheck className="w-3 h-3" /> Sirlei assumiu
                                </Badge>
                              );
                            }
                            return (
                              <Badge variant={c.assigned_to === "sirlei" ? "default" : "secondary"} className="text-[10px] py-0 h-4 gap-1">
                                {c.assigned_to === "sirlei" ? <UserCheck className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                                {c.assigned_to === "sirlei" ? "Sirlei" : "Aurora"}
                              </Badge>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        <Card className={`flex-col overflow-hidden ${activeId ? "flex" : "hidden lg:flex"}`}>
          {!active ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <MessageCircle className="w-8 h-8" />
              <p className="text-sm">Selecione uma conversa</p>
            </div>
          ) : (
            <>
              <div className="p-2 sm:p-3 border-b flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 lg:hidden"
                    onClick={() => setActiveId(null)}
                    aria-label="Voltar"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  {activeContact?.profile_picture_url ? (
                    <img
                      src={activeContact.profile_picture_url}
                      alt=""
                      onClick={() => setLightboxUrl(activeContact.profile_picture_url!)}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shrink-0 cursor-zoom-in hover:ring-2 hover:ring-primary/50 transition"
                    />
                  ) : (
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground shrink-0">
                      {(activeContact?.push_name ?? activeContact?.name ?? activeContact?.phone ?? "?").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate text-sm sm:text-base">{activeContact?.client_name ?? activeContact?.name ?? activeContact?.push_name ?? activeContact?.phone}</p>
                    <div className="text-[11px] sm:text-xs text-muted-foreground truncate flex items-center gap-2 flex-wrap">
                      {activeContact?.push_name && activeContact.push_name !== (activeContact.client_name ?? activeContact.name) && (
                        <span className="truncate">WhatsApp: <strong className="text-foreground/80">{activeContact.push_name}</strong></span>
                      )}
                      {activeContact?.phone && <span>+{activeContact.phone}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {(() => {
                    const takeover = active.human_takeover_until && new Date(active.human_takeover_until) > new Date();
                    const aiOn = active.ai_enabled && !takeover;
                    return aiOn ? (
                      <Button size="sm" variant="outline" onClick={() => handleToggleAi(false)} className="px-2 sm:px-3">
                        <UserCheck className="w-4 h-4 sm:mr-1" />
                        <span className="hidden sm:inline">Pausar IA / Assumir</span>
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => handleToggleAi(true)} className="px-2 sm:px-3">
                        <Bot className="w-4 h-4 sm:mr-1" />
                        <span className="hidden sm:inline">Reativar IA</span>
                      </Button>
                    );
                  })()}
                </div>
              </div>


              {active.needs_review && (
                <div className="px-4 py-2 bg-amber-500/15 border-b border-amber-500/40 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
                  <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p><strong>Aurora pediu sua orientação antes de responder.</strong> Nenhuma mensagem foi enviada no WhatsApp.</p>
                    {active.review_reason && (
                      <p className="mt-0.5 italic opacity-90">Motivo: "{active.review_reason}"</p>
                    )}
                    <p className="mt-0.5 opacity-75">Responda manualmente abaixo — o alerta some quando você enviar.</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs shrink-0"
                    onClick={async () => {
                      await supabase.from("conversations").update({
                        needs_review: false,
                        review_reason: null,
                        review_requested_at: null,
                      }).eq("id", active.id);
                      toast.success("Alerta descartado.");
                      loadConversations();
                    }}
                  >
                    Descartar
                  </Button>
                </div>
              )}


              {(() => {
                const takeover = active.human_takeover_until && new Date(active.human_takeover_until) > new Date();
                if (activeContact?.aurora_blocked) {
                  return (
                    <div className="px-4 py-2 bg-rose-600/10 border-b border-rose-600/30 flex items-center gap-2 text-xs text-rose-900 dark:text-rose-200">
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span className="flex-1">
                        <strong>Aurora bloqueada</strong> — esta conversa está na blacklist. Você responde manualmente.
                      </span>
                      <Button size="sm" variant="outline" className="h-7 text-xs border-rose-600/40 hover:bg-rose-600/10" onClick={() => window.open(`/admin/blacklist`, "_blank")}>
                        Ver blacklist
                      </Button>
                    </div>
                  );
                }
                if (!takeover) return null;
                return (
                  <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
                    <UserCheck className="w-4 h-4 shrink-0" />
                    <span className="flex-1">
                      <strong>Sirlei está respondendo</strong> — Aurora pausada (você respondeu fora do sistema).
                      Retomada automática {formatDistanceToNow(new Date(active.human_takeover_until!), { addSuffix: true, locale: ptBR })}.
                    </span>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleToggleAi(true)}>
                      <Bot className="w-3 h-3 mr-1" /> Reativar Aurora agora
                    </Button>
                  </div>
                );
              })()}

              <div ref={scrollRef} className="flex-1 overflow-auto p-3 sm:p-4 space-y-2 bg-muted/20">
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma mensagem ainda.</p>
                ) : messages.map((m) => (
                  <div key={m.id} className={`flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] sm:max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                      m.direction === "out"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border"
                    } ${m.is_draft ? "opacity-70 border-dashed" : ""}`}>

                      <p className="whitespace-pre-wrap">{m.body}</p>
                      <div className="text-[10px] opacity-70 mt-1 flex items-center gap-1">
                        {m.author === "aurora" && <Bot className="w-3 h-3" />}
                        {m.author === "sirlei" && <UserCheck className="w-3 h-3" />}
                        {formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: ptBR })}
                        {m.direction === "out" && (
                          m.status === "read" ? <CheckCheck className="w-3.5 h-3.5 text-sky-300" aria-label="lida" /> :
                          m.status === "delivered" ? <CheckCheck className="w-3.5 h-3.5" aria-label="entregue" /> :
                          m.status === "sent" ? <Check className="w-3.5 h-3.5" aria-label="enviada" /> :
                          m.status === "failed" ? <XCircle className="w-3.5 h-3.5 text-destructive" aria-label="falhou" /> :
                          <Clock className="w-3 h-3" aria-label="pendente" />
                        )}
                        {m.is_draft && <span>• rascunho</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 border-t space-y-2">
                <Textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Escreva uma resposta…"
                  rows={2}
                  className="resize-none"
                />
                <div className="flex items-center justify-between gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrepare} disabled={preparing}>
                    {preparing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
                    Aurora sugerir
                  </Button>
                  <Button size="sm" onClick={handleSend} disabled={sending || !reply.trim()}>
                    {sending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
                    Enviar
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 cursor-zoom-out"
        >
          <img src={lightboxUrl} alt="Foto de perfil" className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl object-contain" />
        </div>
      )}
    </div>
  );

};

export default AdminAtendimentos;
