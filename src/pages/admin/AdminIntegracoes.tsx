import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";

interface WahaStatus {
  ok: boolean;
  configured: boolean;
  reachable?: boolean;
  authorized?: boolean;
  http_status?: number;
  status?: string;
  session?: string;
  url?: string;
  push_name?: string | null;
  phone?: string | null;
  latency_ms?: number;
  error?: string;
  reason?: string;
}

const AdminIntegracoes = () => {
  const [status, setStatus] = useState<WahaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    const { data, error } = await supabase.functions.invoke("waha-status", { method: "GET" as any });
    setRefreshing(false);
    setLoading(false);
    if (error) {
      toast.error("Falha ao consultar WAHA");
      setStatus({ ok: false, configured: true, reachable: false, error: error.message });
      return;
    }
    setStatus(data as WahaStatus);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, []);

  const renderBadge = () => {
    if (!status) return <Badge variant="outline">…</Badge>;
    if (!status.configured) return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Não configurado</Badge>;
    if (!status.reachable) return <Badge variant="destructive" className="gap-1"><WifiOff className="w-3 h-3" /> Offline</Badge>;
    if (!status.authorized) return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> API Key inválida</Badge>;
    if (status.status === "WORKING") return <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600 text-white"><CheckCircle2 className="w-3 h-3" /> Conectado</Badge>;
    if (status.status === "STARTING" || status.status === "SCAN_QR_CODE") return <Badge className="gap-1 bg-amber-500 hover:bg-amber-500 text-white"><AlertTriangle className="w-3 h-3" /> {status.status}</Badge>;
    return <Badge variant="secondary" className="gap-1"><Wifi className="w-3 h-3" /> {status.status ?? "?"}</Badge>;
  };

  const healthy = status?.ok && status?.status === "WORKING";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Integrações</h1>
        <p className="text-muted-foreground mt-1">Conexão do WhatsApp (WAHA) e diagnóstico</p>
      </header>

      <Card className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold flex items-center gap-2">WhatsApp {renderBadge()}</h2>
            {loading ? (
              <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Verificando…</p>
            ) : status?.ok ? (
              <p className="text-sm text-muted-foreground">
                {status.push_name && <>Perfil: <span className="font-medium text-foreground">{status.push_name}</span> · </>}
                {status.phone && <>Número: <span className="font-medium text-foreground">{status.phone}</span> · </>}
                Sessão: <code className="text-xs">{status.session}</code> · Latência: {status.latency_ms}ms
              </p>
            ) : (
              <p className="text-sm text-destructive">
                {status?.error ?? status?.reason ?? "Sem conexão"}
                {status?.http_status ? ` (HTTP ${status.http_status})` : ""}
              </p>
            )}
          </div>
          <Button variant="outline" onClick={load} disabled={refreshing}>
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
            Atualizar
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 text-xs pt-2 border-t">
          <div className="flex justify-between"><span className="text-muted-foreground">Configurado</span><span>{status?.configured ? "✅" : "❌"}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Acessível</span><span>{status?.reachable ? "✅" : "❌"}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">API Key OK</span><span>{status?.authorized ? "✅" : "❌"}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Sessão WORKING</span><span>{healthy ? "✅" : "❌"}</span></div>
        </div>

        {status?.url && (
          <p className="text-xs text-muted-foreground pt-2 border-t">
            Endpoint: <code>{status.url}</code>
          </p>
        )}
      </Card>

      <Card className="p-4 bg-muted/30 text-sm text-muted-foreground">
        <p><strong className="text-foreground">Como funciona:</strong> este painel consulta diretamente o servidor WAHA a cada 20 segundos. Se algo estiver ❌, o problema está no container/API key — não no Lovable.</p>
      </Card>
    </div>
  );
};

export default AdminIntegracoes;
