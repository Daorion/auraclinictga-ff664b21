import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Loader2, ShieldAlert } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditRow {
  id: string; action: string; entity_type: string | null; entity_id: string | null;
  actor_email: string | null; details: any; created_at: string;
}

const AdminAuditoria = () => {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("audit_log")
        .select("id,action,entity_type,entity_id,actor_email,details,created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      setRows((data as AuditRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-7 h-7 text-primary" /> Auditoria
        </h1>
        <p className="text-muted-foreground mt-1">Últimas ações no painel administrativo</p>
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground text-sm">Nenhuma ação registrada ainda.</Card>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <Card key={r.id} className="p-3 text-sm flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium truncate">{r.action}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {r.entity_type ?? "—"} {r.actor_email ? `• ${r.actor_email}` : ""}
                </p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: ptBR })}
              </span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminAuditoria;
