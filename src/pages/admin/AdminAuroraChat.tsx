import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Bot, User as UserIcon, Wrench, Trash2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface TrainerMsg {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  parts: any;
  created_at: string;
}

interface Directive {
  id: string; title: string; kind: string; content: string;
  ends_at: string | null; active: boolean;
}

const kindLabel: Record<string, string> = {
  promocao: "Promoção", instrucao: "Instrução",
  persona: "Persona", conhecimento: "Conhecimento",
};

const AdminAuroraChat = () => {
  const [messages, setMessages] = useState<TrainerMsg[]>([]);
  const [directives, setDirectives] = useState<Directive[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const load = async () => {
    const [msg, dir] = await Promise.all([
      supabase.from("aurora_trainer_messages")
        .select("id, role, content, parts, created_at")
        .order("created_at", { ascending: true }).limit(200),
      supabase.from("aurora_directives")
        .select("id, title, kind, content, ends_at, active")
        .eq("active", true).order("created_at", { ascending: false }),
    ]);
    setMessages((msg.data as TrainerMsg[]) ?? []);
    setDirectives((dir.data as Directive[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { inputRef.current?.focus(); }, [loading, sending]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: 9e9, behavior: "smooth" }); }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    // Optimistic
    setMessages((cur) => [...cur, {
      id: "tmp-" + Date.now(), role: "user", content: text, parts: null,
      created_at: new Date().toISOString(),
    }]);
    const { data, error } = await supabase.functions.invoke("aurora-trainer", {
      body: { message: text },
    });
    setSending(false);
    if (error || (data as any)?.error) {
      toast.error("Falha ao falar com a Aurora: " + (error?.message ?? (data as any)?.error));
    }
    await load();
  };

  const deactivate = async (id: string) => {
    const { error } = await supabase.from("aurora_directives").update({ active: false }).eq("id", id);
    if (error) return toast.error("Falha ao desativar");
    setDirectives((cur) => cur.filter((d) => d.id !== id));
    toast.success("Diretiva desativada");
  };

  const clearHistory = async () => {
    if (!confirm("Apagar todo o histórico deste chat? (as diretivas e campanhas continuam salvas)")) return;
    await supabase.from("aurora_trainer_messages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    setMessages([]);
    toast.success("Histórico limpo");
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const visibleMessages = messages.filter((m) => m.role === "user" || m.role === "assistant" || m.role === "tool");

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="w-7 h-7 text-primary" /> Chat com a Aurora
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Converse, treine, cadastre promoções ou peça para preparar campanhas de prospecção.
            Nenhuma mensagem é disparada para clientes sem sua aprovação individual em <Link className="underline" to="/admin/aurora/campanhas">Campanhas</Link>.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={clearHistory}>
          <Trash2 className="w-4 h-4 mr-1" /> Limpar histórico
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <Card className="flex flex-col h-[70vh]">
          <div ref={scrollRef} className="flex-1 overflow-auto p-5 space-y-4">
            {visibleMessages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-16">
                <MessageSquare className="w-10 h-10 mx-auto opacity-40 mb-3" />
                Diga oi, ensine algo, cadastre uma promoção ou peça uma campanha.
              </div>
            )}
            {visibleMessages.map((m) => {
              if (m.role === "tool") {
                const name = m.parts?.tool_name ?? "ferramenta";
                let preview = m.content;
                try { preview = JSON.stringify(JSON.parse(m.content), null, 2); } catch {}
                return (
                  <details key={m.id} className="text-xs bg-muted/40 rounded-md p-2 border border-border/50">
                    <summary className="cursor-pointer flex items-center gap-2 text-muted-foreground">
                      <Wrench className="w-3 h-3" /> {name}
                    </summary>
                    <pre className="mt-2 overflow-auto max-h-60 whitespace-pre-wrap">{preview}</pre>
                  </details>
                );
              }
              const isUser = m.role === "user";
              return (
                <div key={m.id} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[75%] ${isUser
                    ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2"
                    : "text-foreground"}`}>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content || (m.parts?.tool_calls ? "..." : "")}</p>
                  </div>
                  {isUser && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}
            {sending && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="text-muted-foreground text-sm italic flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> Aurora está pensando...
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-border/50 p-3 flex gap-2 items-end">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              placeholder="Ex.: A partir de hoje até 30/12 temos promoção de botox por 850,00. Cadastra isso pra você mencionar."
              rows={2}
              disabled={sending}
              className="resize-none"
            />
            <Button onClick={send} disabled={sending || !input.trim()} size="icon" className="h-10 w-10 flex-shrink-0">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </Card>

        <Card className="p-4 h-[70vh] overflow-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">Diretivas ativas</h2>
            <Badge variant="secondary">{directives.length}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            A Aurora consulta esta lista em toda conversa com clientes.
          </p>
          <div className="space-y-2">
            {directives.length === 0 && (
              <p className="text-xs text-muted-foreground italic">Nenhuma diretiva ativa ainda.</p>
            )}
            {directives.map((d) => (
              <div key={d.id} className="border border-border/50 rounded-md p-3 text-xs space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant="outline" className="mb-1">{kindLabel[d.kind] ?? d.kind}</Badge>
                    <p className="font-semibold">{d.title}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => deactivate(d.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-muted-foreground whitespace-pre-wrap">{d.content}</p>
                {d.ends_at && (
                  <p className="text-[10px] text-muted-foreground">Até {new Date(d.ends_at).toLocaleDateString("pt-BR")}</p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border/50">
            <Link to="/admin/aurora/campanhas" className="text-xs text-primary hover:underline">
              → Ver campanhas aguardando aprovação
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminAuroraChat;
