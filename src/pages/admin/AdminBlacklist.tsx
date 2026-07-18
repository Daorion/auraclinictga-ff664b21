import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Bot, ShieldOff, Search, Users } from "lucide-react";
import { toast } from "sonner";

interface Contact {
  id: string;
  phone: string;
  name: string | null;
  push_name: string | null;
  profile_picture_url: string | null;
  aurora_blocked: boolean;
  last_seen_at: string | null;
  client_id: string | null;
  client_name?: string | null;
}

const AdminBlacklist = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"todos" | "bloqueados" | "liberados">("todos");
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contacts")
      .select("id,phone,name,push_name,profile_picture_url,aurora_blocked,last_seen_at,client_id")
      .order("last_seen_at", { ascending: false, nullsFirst: false })
      .limit(500);
    if (error) { toast.error("Falha ao carregar contatos"); setLoading(false); return; }
    const rows = (data ?? []) as Contact[];

    // Enrich with linked client name
    const clientIds = Array.from(new Set(rows.map((c) => c.client_id).filter(Boolean))) as string[];
    const clientNameById: Record<string, string> = {};
    if (clientIds.length) {
      const { data: cls } = await supabase.from("clients").select("id,name").in("id", clientIds);
      (cls ?? []).forEach((c: any) => { clientNameById[c.id] = c.name; });
    }
    const enriched = rows.map((c) => ({
      ...c,
      client_name: c.client_id ? clientNameById[c.client_id] ?? null : null,
    }));
    setContacts(enriched);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = async (c: Contact, next: boolean) => {
    setSaving((s) => ({ ...s, [c.id]: true }));
    const { error } = await supabase
      .from("contacts")
      .update({ aurora_blocked: next })
      .eq("id", c.id);
    setSaving((s) => ({ ...s, [c.id]: false }));
    if (error) { toast.error("Não foi possível atualizar"); return; }
    setContacts((prev) => prev.map((x) => x.id === c.id ? { ...x, aurora_blocked: next } : x));
    await supabase.from("audit_log").insert({
      action: next ? "contact.aurora_blocked" : "contact.aurora_unblocked",
      entity_type: "contact",
      entity_id: c.id,
      actor_user_id: (await supabase.auth.getUser()).data.user?.id ?? null,
    });
    toast.success(next ? "Aurora bloqueada para este contato" : "Aurora liberada");
  };

  const filtered = useMemo(() => {
    let list = contacts;
    if (filter === "bloqueados") list = list.filter((c) => c.aurora_blocked);
    else if (filter === "liberados") list = list.filter((c) => !c.aurora_blocked);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((c) =>
        c.phone.toLowerCase().includes(q) ||
        c.name?.toLowerCase().includes(q) ||
        c.push_name?.toLowerCase().includes(q) ||
        c.client_name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [contacts, filter, search]);

  const blockedCount = contacts.filter((c) => c.aurora_blocked).length;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Blacklist da Aurora</h1>
        <p className="text-muted-foreground mt-1">
          Escolha quais contatos <strong>nunca</strong> devem receber respostas automáticas da Aurora.
          Você continua vendo e respondendo manualmente as mensagens normalmente.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 flex items-center gap-3">
          <Users className="w-5 h-5 text-muted-foreground" />
          <div><p className="text-xs text-muted-foreground">Total de contatos</p><p className="text-xl font-semibold">{contacts.length}</p></div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <ShieldOff className="w-5 h-5 text-destructive" />
          <div><p className="text-xs text-muted-foreground">Aurora bloqueada</p><p className="text-xl font-semibold">{blockedCount}</p></div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <Bot className="w-5 h-5 text-primary" />
          <div><p className="text-xs text-muted-foreground">Aurora liberada</p><p className="text-xl font-semibold">{contacts.length - blockedCount}</p></div>
        </Card>
      </div>

      <Card className="p-3 flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, telefone…" className="pl-9" />
        </div>
        <div className="flex gap-1">
          {(["todos", "bloqueados", "liberados"] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="capitalize">
              {f}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-sm text-muted-foreground text-center">Nenhum contato encontrado.</p>
        ) : (
          <ul className="divide-y">
            {filtered.map((c) => {
              const displayName = c.client_name ?? c.name ?? c.push_name ?? `+${c.phone}`;
              return (
                <li key={c.id} className="p-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                  {c.profile_picture_url ? (
                    <img src={c.profile_picture_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground shrink-0">
                      {displayName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{displayName}</span>
                      {c.client_name && <Badge variant="outline" className="text-[10px] py-0 h-4">Cliente CRM</Badge>}
                      {c.aurora_blocked && (
                        <Badge className="text-[10px] py-0 h-4 gap-1 bg-destructive/90 hover:bg-destructive text-white border-0">
                          <ShieldOff className="w-3 h-3" /> Aurora bloqueada
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      +{c.phone}
                      {c.push_name && c.push_name !== displayName && <> · WhatsApp: {c.push_name}</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {c.aurora_blocked ? "Bloqueada" : "Aurora ativa"}
                    </span>
                    <Switch
                      checked={c.aurora_blocked}
                      disabled={!!saving[c.id]}
                      onCheckedChange={(v) => toggle(c, v)}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <p className="text-xs text-muted-foreground">
        Dica: mesmo com a Aurora bloqueada, as mensagens continuam chegando em <strong>Atendimentos</strong> para você responder à mão.
      </p>
    </div>
  );
};

export default AdminBlacklist;
