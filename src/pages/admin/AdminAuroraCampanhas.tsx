import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, CheckCircle2, XCircle, Megaphone, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface Campaign {
  id: string; name: string; goal: string | null; message_template: string;
  status: string; created_at: string;
}
interface Target {
  id: string; campaign_id: string; client_id: string | null;
  contact_name: string | null; phone: string | null;
  suggested_message: string; status: string; reason: string | null;
  sent_at: string | null;
}

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    pending: "bg-muted text-muted-foreground",
    approved: "bg-primary/20 text-primary",
    sent: "bg-emerald-500/20 text-emerald-700",
    skipped: "bg-muted text-muted-foreground",
    failed: "bg-red-500/20 text-red-700",
  };
  return map[s] ?? "bg-muted";
};

const AdminAuroraCampanhas = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [targetsByCampaign, setTargetsByCampaign] = useState<Record<string, Target[]>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, string>>({});

  const load = async () => {
    const { data: camps } = await supabase.from("aurora_campaigns")
      .select("id, name, goal, message_template, status, created_at")
      .order("created_at", { ascending: false }).limit(50);
    setCampaigns((camps as Campaign[]) ?? []);
    const ids = (camps ?? []).map((c: any) => c.id);
    if (ids.length) {
      const { data: tgs } = await supabase.from("aurora_campaign_targets")
        .select("id, campaign_id, client_id, contact_name, phone, suggested_message, status, reason, sent_at")
        .in("campaign_id", ids);
      const grouped: Record<string, Target[]> = {};
      for (const t of (tgs as Target[]) ?? []) {
        (grouped[t.campaign_id] ||= []).push(t);
      }
      setTargetsByCampaign(grouped);
      // Auto-open drafts
      const openMap: Record<string, boolean> = {};
      for (const c of (camps ?? []) as Campaign[]) {
        if (c.status === "draft" || c.status === "approved") openMap[c.id] = true;
      }
      setOpen(openMap);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const sendOne = async (t: Target) => {
    setSendingId(t.id);
    const msg = editing[t.id] ?? t.suggested_message;
    const { data, error } = await supabase.functions.invoke("aurora-campaign-send", {
      body: { target_id: t.id, message: msg },
    });
    setSendingId(null);
    if (error || (data as any)?.error) {
      toast.error("Falha: " + (error?.message ?? (data as any)?.error));
      await load();
      return;
    }
    toast.success("Enviada para " + (t.contact_name ?? t.phone));
    await load();
  };

  const skipOne = async (t: Target) => {
    await supabase.from("aurora_campaign_targets").update({ status: "skipped" }).eq("id", t.id);
    await load();
  };

  const cancelCampaign = async (c: Campaign) => {
    if (!confirm("Cancelar a campanha inteira? Alvos ainda não enviados ficam bloqueados.")) return;
    await supabase.from("aurora_campaigns").update({ status: "cancelled" }).eq("id", c.id);
    await supabase.from("aurora_campaign_targets").update({ status: "skipped" })
      .eq("campaign_id", c.id).eq("status", "pending");
    await load();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Megaphone className="w-7 h-7 text-primary" /> Campanhas da Aurora
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          A Aurora propõe campanhas de prospecção no chat de treinamento. Nada é disparado sem sua aprovação
          individual por cliente aqui embaixo.
        </p>
      </header>

      {campaigns.length === 0 && (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          Nenhuma campanha ainda. Vá em <b>Chat com a Aurora</b> e diga por exemplo:
          <em className="block mt-2">"Levante clientes que não voltam há 6 meses e prepara uma promoção de limpeza de pele por R$ 120."</em>
        </Card>
      )}

      {campaigns.map((c) => {
        const targets = targetsByCampaign[c.id] ?? [];
        const pending = targets.filter((t) => t.status === "pending").length;
        const sent = targets.filter((t) => t.status === "sent").length;
        const isOpen = open[c.id];
        return (
          <Card key={c.id} className="p-5 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <button className="flex items-center gap-2 text-left" onClick={() => setOpen((o) => ({ ...o, [c.id]: !o[c.id] }))}>
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <div>
                  <h2 className="font-semibold text-lg">{c.name}</h2>
                  {c.goal && <p className="text-xs text-muted-foreground">{c.goal}</p>}
                </div>
              </button>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{c.status}</Badge>
                <Badge variant="secondary">{targets.length} alvos</Badge>
                {pending > 0 && <Badge className="bg-amber-500/20 text-amber-700">{pending} pendentes</Badge>}
                {sent > 0 && <Badge className="bg-emerald-500/20 text-emerald-700">{sent} enviadas</Badge>}
                {c.status !== "cancelled" && c.status !== "done" && (
                  <Button variant="ghost" size="sm" onClick={() => cancelCampaign(c)}>Cancelar campanha</Button>
                )}
              </div>
            </div>

            {isOpen && (
              <>
                <div className="bg-muted/40 rounded-md p-3 text-xs">
                  <p className="font-semibold text-muted-foreground mb-1">Mensagem base:</p>
                  <p className="whitespace-pre-wrap">{c.message_template}</p>
                </div>
                <div className="space-y-2">
                  {targets.map((t) => (
                    <div key={t.id} className="border border-border/50 rounded-md p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="text-sm">
                          <span className="font-medium">{t.contact_name ?? "sem nome"}</span>
                          <span className="text-muted-foreground ml-2">{t.phone}</span>
                        </div>
                        <Badge className={statusBadge(t.status)}>{t.status}</Badge>
                      </div>
                      <Textarea
                        rows={3}
                        defaultValue={t.suggested_message}
                        disabled={t.status === "sent" || sendingId === t.id}
                        onChange={(e) => setEditing((cur) => ({ ...cur, [t.id]: e.target.value }))}
                        className="text-sm"
                      />
                      {t.reason && <p className="text-xs text-red-600">{t.reason}</p>}
                      {t.status !== "sent" && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => sendOne(t)} disabled={sendingId === t.id}>
                            {sendingId === t.id
                              ? <Loader2 className="w-4 h-4 animate-spin mr-1" />
                              : <Send className="w-4 h-4 mr-1" />}
                            Aprovar e enviar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => skipOne(t)} disabled={sendingId === t.id}>
                            <XCircle className="w-4 h-4 mr-1" /> Pular
                          </Button>
                        </div>
                      )}
                      {t.status === "sent" && t.sent_at && (
                        <p className="text-xs text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Enviada em {new Date(t.sent_at).toLocaleString("pt-BR")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default AdminAuroraCampanhas;
