import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { auraApi, isNotConfigured } from "@/lib/auraApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, Send, Sparkles, UserCheck, Bot, MessageCircle, AlertTriangle } from "lucide-react";
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
}
interface Contact { id: string; phone: string; name: string | null; }
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
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    const { data: convs } = await supabase
      .from("conversations")
      .select("id,contact_id,stage,assigned_to,ai_enabled,human_takeover_until,interest,unread_count,last_message_at,last_message_preview,status,internal_notes")
      .eq("status", "open")
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(200);
    const list = (convs ?? []) as Conversation[];
    setConversations(list);
    const ids = list.map((c) => c.contact_id);
    if (ids.length) {
      const { data: contacts } = await supabase
        .from("contacts").select("id,phone,name").in("id", ids);
      const map: Record<string, Contact> = {};
      (contacts ?? []).forEach((c) => { map[c.id] = c as Contact; });
      setContactsById(map);
    }
    setLoading(false);
  };

  const loadMessages = async (convId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("id,conversation_id,direction,body,author,status,is_draft,error,created_at")
      .eq("conversation_id", convId)
      .order("created_at");
    setMessages((data ?? []) as Message[]);
    await supabase.from("conversations").update({ unread_count: 0 }).eq("id", convId);
  };

  useEffect(() => { loadConversations(); }, []);

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

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Atendimentos</h1>
        <p className="text-muted-foreground mt-1">Caixa de entrada em tempo real do WhatsApp da clínica</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-220px)] min-h-[540px]">
        <Card className="flex flex-col overflow-hidden">
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
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{ct?.name ?? ct?.phone ?? "—"}</span>
                      {c.unread_count > 0 && <Badge className="shrink-0">{c.unread_count}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{c.last_message_preview ?? "…"}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Badge variant="outline" className="text-[10px] py-0 h-4">{stageLabel[c.stage] ?? c.stage}</Badge>
                      <Badge variant={c.assigned_to === "sirlei" ? "default" : "secondary"} className="text-[10px] py-0 h-4 gap-1">
                        {c.assigned_to === "sirlei" ? <UserCheck className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                        {c.assigned_to === "sirlei" ? "Sirlei" : "Aurora"}
                      </Badge>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        <Card className="flex flex-col overflow-hidden">
          {!active ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <MessageCircle className="w-8 h-8" />
              <p className="text-sm">Selecione uma conversa</p>
            </div>
          ) : (
            <>
              <div className="p-3 border-b flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{activeContact?.name ?? activeContact?.phone}</p>
                  <p className="text-xs text-muted-foreground truncate">{activeContact?.phone}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {(() => {
                    const takeover = active.human_takeover_until && new Date(active.human_takeover_until) > new Date();
                    const aiOn = active.ai_enabled && !takeover;
                    return aiOn ? (
                      <Button size="sm" variant="outline" onClick={() => handleToggleAi(false)}>
                        <UserCheck className="w-4 h-4 mr-1" /> Pausar IA / Assumir
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => handleToggleAi(true)}>
                        <Bot className="w-4 h-4 mr-1" /> Reativar IA
                      </Button>
                    );
                  })()}
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-2 bg-muted/20">
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma mensagem ainda.</p>
                ) : messages.map((m) => (
                  <div key={m.id} className={`flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                      m.direction === "out"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border"
                    } ${m.is_draft ? "opacity-70 border-dashed" : ""}`}>
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      <div className="text-[10px] opacity-70 mt-1 flex items-center gap-1">
                        {m.author === "aurora" && <Bot className="w-3 h-3" />}
                        {m.author === "sirlei" && <UserCheck className="w-3 h-3" />}
                        {formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: ptBR })}
                        {m.status && <span>• {m.status}</span>}
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
    </div>
  );
};

export default AdminAtendimentos;
