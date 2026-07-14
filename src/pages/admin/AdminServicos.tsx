import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string | null;
  professional_slug: string | null;
  professional_name: string | null;
  category: string | null;
  duration: string | null;
  duration_minutes: number | null;
  price_cents: number | null;
  active: boolean;
}

interface Prof { id: string; slug: string; name: string; title: string | null; }

const serviceSchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(120),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  professional_slug: z.string().min(1, "Selecione uma profissional"),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  duration: z.string().trim().max(40).optional().or(z.literal("")),
});

const empty = {
  name: "",
  description: "",
  professional_slug: "",
  category: "",
  duration: "",
  duration_minutes: 60,
  price_reais: "",
  active: true,
};

const brl = (cents?: number | null) =>
  typeof cents === "number" ? (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "";

const AdminServicos = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [profs, setProfs] = useState<Prof[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: svc, error }, { data: pr }] = await Promise.all([
      supabase.from("services").select("*").order("created_at", { ascending: false }),
      supabase.from("professionals").select("id,slug,name,title").order("display_order").order("name"),
    ]);
    if (error) toast.error("Erro ao carregar serviços");
    else setServices(svc as Service[]);
    setProfs((pr as Prof[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({
      name: s.name,
      description: s.description ?? "",
      professional_slug: s.professional_slug ?? "",
      category: s.category ?? "",
      duration: s.duration ?? "",
      duration_minutes: s.duration_minutes ?? 60,
      price_reais: s.price_cents != null ? (s.price_cents / 100).toFixed(2) : "",
      active: s.active,
    });
    setOpen(true);
  };

  const save = async () => {
    const parsed = serviceSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    const prof = profs.find((p) => p.slug === form.professional_slug);
    setSaving(true);
    const priceNum = form.price_reais ? Math.round(Number(form.price_reais.replace(",", ".")) * 100) : null;
    const payload = {
      name: parsed.data.name,
      description: parsed.data.description || null,
      professional_slug: parsed.data.professional_slug,
      professional_name: prof?.name ?? null,
      category: parsed.data.category || null,
      duration: parsed.data.duration || null,
      duration_minutes: form.duration_minutes || null,
      price_cents: priceNum,
      active: form.active,
    };
    const op = editing
      ? supabase.from("services").update(payload).eq("id", editing.id)
      : supabase.from("services").insert(payload);
    const { error } = await op;
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar");
      return;
    }
    toast.success(editing ? "Serviço atualizado" : "Serviço criado");
    setOpen(false);
    load();
  };

  const toggleActive = async (s: Service) => {
    const { error } = await supabase
      .from("services")
      .update({ active: !s.active })
      .eq("id", s.id);
    if (error) toast.error("Erro ao atualizar");
    else load();
  };

  const remove = async (s: Service) => {
    if (!confirm(`Remover "${s.name}"?`)) return;
    const { error } = await supabase.from("services").delete().eq("id", s.id);
    if (error) toast.error("Erro ao remover");
    else { toast.success("Removido"); load(); }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Serviços</h1>
          <p className="text-muted-foreground mt-1">Cardápio editável — preços visíveis apenas no painel</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Novo serviço</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar serviço" : "Novo serviço"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do serviço *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Profissional *</Label>
                <Select
                  value={form.professional_slug}
                  onValueChange={(v) => setForm({ ...form, professional_slug: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {profs.map((p) => (
                      <SelectItem key={p.id} value={p.slug}>
                        {p.name} <span className="text-muted-foreground">— {p.title}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Input
                    placeholder="Ex: Massagem, Estética..."
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rótulo de duração</Label>
                  <Input
                    placeholder="Ex: 60 min"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duração (minutos)</Label>
                  <Input
                    type="number"
                    min={5}
                    step={5}
                    value={form.duration_minutes}
                    onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço (R$)</Label>
                  <Input
                    inputMode="decimal"
                    placeholder="150,00"
                    value={form.price_reais}
                    onChange={(e) => setForm({ ...form, price_reais: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="active">Ativo</Label>
                <Switch
                  id="active"
                  checked={form.active}
                  onCheckedChange={(v) => setForm({ ...form, active: v })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : services.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Nenhum serviço cadastrado ainda.</p>
          <Button className="mt-4" onClick={openNew}><Plus className="w-4 h-4 mr-2" />Adicionar primeiro serviço</Button>
        </Card>
      ) : (
        <div className="grid gap-3">
          {services.map((s) => (
            <Card key={s.id} className="p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold truncate">{s.name}</h3>
                  {!s.active && <Badge variant="secondary">Inativo</Badge>}
                  {s.category && <Badge variant="outline">{s.category}</Badge>}
                  {s.price_cents != null && <Badge>{brl(s.price_cents)}</Badge>}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {s.professional_name}
                  {s.duration_minutes ? ` • ${s.duration_minutes} min` : s.duration ? ` • ${s.duration}` : ""}
                </p>
                {s.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Switch checked={s.active} onCheckedChange={() => toggleActive(s)} />
                <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => remove(s)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminServicos;
