import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Bot, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import AdminAuroraConsumo from "./AdminAuroraConsumo";

interface AiSetting {
  id: string; action_key: string; label: string;
  mode: "automatico" | "revisar" | "desativado";
}
interface Pricing {
  id: string; slug: string; name: string; description: string | null;
  pricing_json: Array<{ label: string; price_cents: number }>;
  notes: string | null; active: boolean; display_order: number | null;
}

const modeLabel: Record<string, string> = {
  automatico: "Automático",
  revisar: "Preparar para revisão",
  desativado: "Desativado",
};

const AdminAurora = () => {
  const [settings, setSettings] = useState<AiSetting[]>([]);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    const [s, p] = await Promise.all([
      supabase.from("ai_settings").select("id,action_key,label,mode").order("label"),
      supabase.from("procedures_pricing").select("id,slug,name,description,pricing_json,notes,active,display_order").order("display_order"),
    ]);
    setSettings((s.data as AiSetting[]) ?? []);
    setPricing((p.data as unknown as Pricing[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const updateMode = async (row: AiSetting, mode: AiSetting["mode"]) => {
    const prev = row.mode;
    setSettings((cur) => cur.map((r) => r.id === row.id ? { ...r, mode } : r));
    const { error } = await supabase.from("ai_settings").update({
      mode, updated_by: (await supabase.auth.getUser()).data.user?.id ?? null,
    }).eq("id", row.id);
    if (error) {
      setSettings((cur) => cur.map((r) => r.id === row.id ? { ...r, mode: prev } : r));
      toast.error("Falha ao salvar"); return;
    }
    await supabase.from("audit_log").insert({
      action: "ai_settings.mode_changed",
      entity_type: "ai_settings", entity_id: row.id,
      details: { action_key: row.action_key, from: prev, to: mode },
      actor_user_id: (await supabase.auth.getUser()).data.user?.id ?? null,
    });
    toast.success("Salvo");
  };

  const savePricing = async (row: Pricing) => {
    setSavingId(row.id);
    const { error } = await supabase.from("procedures_pricing").update({
      name: row.name,
      description: row.description,
      pricing_json: row.pricing_json as unknown as any,
      notes: row.notes,
      active: row.active,
    }).eq("id", row.id);
    setSavingId(null);
    if (error) { toast.error("Falha ao salvar"); return; }
    await supabase.from("audit_log").insert({
      action: "pricing.updated", entity_type: "procedures_pricing", entity_id: row.id,
      actor_user_id: (await supabase.auth.getUser()).data.user?.id ?? null,
    });
    toast.success("Procedimento atualizado");
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Bot className="w-7 h-7 text-primary" /> Aurora — Inteligência Artificial
        </h1>
        <p className="text-muted-foreground mt-1">
          Persona, modos de operação e base oficial de preços consultada pela Aurora.
        </p>
      </header>

      <Tabs defaultValue="modes">
        <TabsList>
          <TabsTrigger value="modes">Modos de operação</TabsTrigger>
          <TabsTrigger value="pricing">Base oficial de preços</TabsTrigger>
          <TabsTrigger value="persona">Persona</TabsTrigger>
        </TabsList>

        <TabsContent value="modes" className="space-y-3 mt-6">
          <p className="text-sm text-muted-foreground">
            Cada ação da Aurora pode operar em três modos. Alterações são registradas na auditoria.
          </p>
          {settings.map((s) => (
            <Card key={s.id} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.action_key}</p>
              </div>
              <Select value={s.mode} onValueChange={(v) => updateMode(s, v as AiSetting["mode"])}>
                <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["automatico", "revisar", "desativado"] as const).map((m) => (
                    <SelectItem key={m} value={m}>{modeLabel[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4 mt-6">
          <p className="text-sm text-muted-foreground">
            A Aurora consulta esta base ao responder o cliente. Ela nunca inventa preços.
          </p>
          {pricing.map((row) => (
            <Card key={row.id} className="p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Input
                  value={row.name}
                  onChange={(e) => setPricing((cur) => cur.map((r) => r.id === row.id ? { ...r, name: e.target.value } : r))}
                  className="text-base font-semibold max-w-md"
                />
                <div className="flex items-center gap-2">
                  <Badge variant={row.active ? "default" : "secondary"}>{row.active ? "Ativo" : "Inativo"}</Badge>
                  <Button size="sm" onClick={() => savePricing(row)} disabled={savingId === row.id}>
                    {savingId === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {row.pricing_json.map((tier, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_140px_40px] gap-2 items-center">
                    <Input
                      value={tier.label}
                      onChange={(e) => setPricing((cur) => cur.map((r) => r.id === row.id ? {
                        ...r, pricing_json: r.pricing_json.map((t, i) => i === idx ? { ...t, label: e.target.value } : t),
                      } : r))}
                    />
                    <Input
                      type="number"
                      value={(tier.price_cents / 100).toFixed(2)}
                      onChange={(e) => setPricing((cur) => cur.map((r) => r.id === row.id ? {
                        ...r, pricing_json: r.pricing_json.map((t, i) => i === idx ? { ...t, price_cents: Math.round(Number(e.target.value) * 100) } : t),
                      } : r))}
                    />
                    <Button variant="ghost" size="sm" onClick={() => setPricing((cur) => cur.map((r) => r.id === row.id ? {
                      ...r, pricing_json: r.pricing_json.filter((_, i) => i !== idx),
                    } : r))}>×</Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setPricing((cur) => cur.map((r) => r.id === row.id ? {
                  ...r, pricing_json: [...r.pricing_json, { label: "Nova opção", price_cents: 0 }],
                } : r))}>+ opção</Button>
              </div>
              <Textarea
                placeholder="Observações internas (ex.: protocolo definido após avaliação)"
                value={row.notes ?? ""}
                onChange={(e) => setPricing((cur) => cur.map((r) => r.id === row.id ? { ...r, notes: e.target.value } : r))}
                rows={2}
              />
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="persona" className="mt-6">
          <Card className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-semibold">Como a Aurora se apresenta</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              A Aurora é acolhedora, profissional, natural e objetiva. Nunca se apresenta como Sirlei; sempre se identifica
              como assistente virtual. Não diagnostica, não prescreve, não promete resultados e não inventa preços nem
              horários. Em situações sensíveis (gravidez, pós-operatório, alergias, dor intensa, reclamações, dúvidas clínicas)
              a conversa é transferida automaticamente para a Sirlei.
            </p>
            <div className="p-4 rounded-md bg-muted/40 text-sm italic">
              "Olá, eu sou a Aurora, assistente virtual da Aura Clinic. Posso ajudar você a conhecer nossos procedimentos,
              tirar dúvidas ou encontrar um horário. Como posso ajudar hoje?"
            </div>
            <p className="text-xs text-muted-foreground">
              O prompt completo da Aurora é montado no backend (API intermediária + Gemini) a partir desta persona,
              da base oficial de preços acima e do histórico da conversa. Nenhuma chave de IA fica exposta no navegador.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAurora;
