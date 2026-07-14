import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { auraApi, isNotConfigured } from "@/lib/auraApi";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, QrCode, AlertTriangle, CheckCircle2, PowerOff } from "lucide-react";
import { toast } from "sonner";

interface SessionRow {
  session_name: string;
  status: string;
  phone_number: string | null;
  last_status_at: string;
  last_error: string | null;
}

const AdminIntegracoes = () => {
  const [session, setSession] = useState<SessionRow | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);

  const loadLocal = async () => {
    const { data } = await supabase
      .from("whatsapp_sessions")
      .select("session_name,status,phone_number,last_status_at,last_error")
      .eq("session_name", "default")
      .maybeSingle();
    setSession(data as SessionRow | null);
  };

  const refreshRemote = async () => {
    const res = await auraApi.whatsappStatus();
    if (isNotConfigured(res)) { setNotConfigured(true); return; }
    if (res.ok) {
      // API is expected to update the DB via webhook; also reflect immediately
      await loadLocal();
    }
  };

  useEffect(() => {
    (async () => {
      await loadLocal();
      await refreshRemote();
      setLoading(false);
    })();
    const ch = supabase
      .channel("aura-wa")
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_sessions" }, () => loadLocal())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const handleStart = async () => {
    setBusy(true);
    const res = await auraApi.whatsappStart();
    setBusy(false);
    if (isNotConfigured(res)) { setNotConfigured(true); return; }
    if (!res.ok) { toast.error(res.message ?? "Falha ao iniciar sessão"); return; }
    toast.success("Sessão iniciada. Aguarde o QR Code.");
    fetchQr();
  };

  const fetchQr = async () => {
    setBusy(true);
    const res = await auraApi.whatsappQr();
    setBusy(false);
    if (isNotConfigured(res)) { setNotConfigured(true); return; }
    if (!res.ok) { toast.error(res.message ?? "Falha ao buscar QR"); return; }
    const dataUrl = (res.data as any)?.qr ?? null;
    setQr(dataUrl);
  };

  const statusBadge = () => {
    const s = session?.status ?? "unknown";
    if (s === "connected" || s === "WORKING") return <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600"><CheckCircle2 className="w-3 h-3" /> Conectado</Badge>;
    if (s === "disconnected") return <Badge variant="secondary" className="gap-1"><PowerOff className="w-3 h-3" /> Desconectado</Badge>;
    return <Badge variant="outline">{s}</Badge>;
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Integrações</h1>
        <p className="text-muted-foreground mt-1">Conexão do WhatsApp e serviços externos</p>
      </header>

      {notConfigured && (
        <Card className="p-4 border-amber-500/40 bg-amber-500/5 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">API intermediária não configurada</p>
            <p className="text-muted-foreground">
              Configure <code>AURA_API_URL</code> e <code>AURA_API_TOKEN</code> nos segredos do backend para habilitar o WhatsApp.
              Nenhum dado simulado é exibido aqui.
            </p>
          </div>
        </Card>
      )}

      <Card className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">WhatsApp {statusBadge()}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {session?.phone_number ? `Número conectado: ${session.phone_number}` : "Nenhum número conectado ainda."}
            </p>
            {session?.last_error && (
              <p className="text-sm text-destructive mt-1">Último erro: {session.last_error}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={refreshRemote} disabled={loading || busy}>
              <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
            </Button>
            <Button onClick={handleStart} disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <QrCode className="w-4 h-4 mr-1" />}
              Iniciar / reiniciar sessão
            </Button>
          </div>
        </div>

        {qr && (
          <div className="flex flex-col items-center gap-3 pt-4 border-t">
            <p className="text-sm text-muted-foreground">Escaneie o QR Code no WhatsApp da Sirlei</p>
            <img src={qr} alt="QR Code WhatsApp" className="w-64 h-64 border rounded-md bg-white p-2" />
            <Button size="sm" variant="ghost" onClick={fetchQr}>
              <RefreshCw className="w-3 h-3 mr-1" /> Atualizar QR
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminIntegracoes;
