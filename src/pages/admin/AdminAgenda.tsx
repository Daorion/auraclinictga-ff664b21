import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfDay, endOfDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Loader2, Plus, ChevronLeft, ChevronRight, Calendar as CalIcon,
  Clock, User as UserIcon, Trash2, Pencil,
} from "lucide-react";

interface Appt {
  id: string;
  client_id: string;
  professional_id: string;
  service_id: string | null;
  service_name: string;
  room_id: string | null;
  start_at: string;
  end_at: string;
  status: string;
  price_cents: number;
  notes: string | null;
  client?: { name: string; phone: string | null } | null;
  professional?: { name: string } | null;
  room?: { name: string } | null;
}

interface Opt { id: string; name: string; }
interface ServiceOpt extends Opt { duration: string | null; }

const STATUSES = [
  { v: "agendado", label: "Agendado", tone: "secondary" },
  { v: "confirmado", label: "Confirmado", tone: "default" },
  { v: "realizado", label: "Realizado", tone: "default" },
  { v: "faltou", label: "Faltou", tone: "destructive" },
  { v: "cancelado", label: "Cancelado", tone: "outline" },
] as const;

const statusVariant = (s: string): "default" | "secondary" | "destructive" | "outline" => {
  const f = STATUSES.find((x) => x.v === s);
  return (f?.tone as never) ?? "secondary";
};

const parseDurationToMinutes = (d: string | null): number => {
  if (!d) return 60;
  const m = d.match(/(\d+)\s*(h|hora|min|m)?/i);
  if (!m) return 60;
  const n = parseInt(m[1], 10);
  if (/h|hora/i.test(m[2] ?? "")) return n * 60;
  return n;
};

const emptyForm = {
  client_id: "",
  professional_id: "",
  service_id: "",
  service_name: "",
  room_id: "",
  date: format(new Date(), "yyyy-MM-dd"),
  start_time: "09:00",
  duration_min: 60,
  status: "agendado",
  price_reais: "",
  notes: "",
};

const AdminAgenda = () => {
  const [date, setDate] = useState<Date>(startOfDay(new Date()));
  const [profFilter, setProfFilter] = useState<string>("all");
  const [appts, setAppts] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);

  const [clients, setClients] = useState<Opt[]>([]);
  const [professionals, setProfessionals] = useState<Opt[]>([]);
  const [services, setServices] = useState<ServiceOpt[]>([]);
  const [rooms, setRooms] = useState<Opt[]>([]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Appt | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const loadRefs = async () => {
    const [c, p, s, r] = await Promise.all([
      supabase.from("clients").select("id,name").eq("active", true).order("name"),
      supabase.from("professionals").select("id,name").eq("active", true).order("display_order").order("name"),
      supabase.from("services").select("id,name,duration").eq("active", true).order("name"),
      supabase.from("rooms").select("id,name").eq("active", true).order("display_order"),
    ]);
    setClients((c.data as Opt[]) ?? []);
    setProfessionals((p.data as Opt[]) ?? []);
    setServices((s.data as ServiceOpt[]) ?? []);
    setRooms((r.data as Opt[]) ?? []);
  };

  const loadAppts = async () => {
    setLoading(true);
    let q = supabase
      .from("appointments")
      .select(`
        id, client_id, professional_id, service_id, service_name, room_id,
        start_at, end_at, status, price_cents, notes,
        client:clients(name, phone),
        professional:professionals(name),
        room:rooms(name)
      `)
      .gte("start_at", startOfDay(date).toISOString())
      .lte("start_at", endOfDay(date).toISOString())
      .order("start_at");
    if (profFilter !== "all") q = q.eq("professional_id", profFilter);
    const { data, error } = await q;
    if (error) toast.error("Erro ao carregar agenda");
    setAppts((data as unknown as Appt[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { loadRefs(); }, []);
  useEffect(() => { loadAppts(); /* eslint-disable-next-line */ }, [date, profFilter]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, date: format(date, "yyyy-MM-dd") });
    setOpen(true);
  };

  const openEdit = (a: Appt) => {
    setEditing(a);
    const start = parseISO(a.start_at);
    const end = parseISO(a.end_at);
    const dur = Math.max(15, Math.round((end.getTime() - start.getTime()) / 60000));
    setForm({
      client_id: a.client_id,
      professional_id: a.professional_id,
      service_id: a.service_id ?? "",
      service_name: a.service_name,
      room_id: a.room_id ?? "",
      date: format(start, "yyyy-MM-dd"),
      start_time: format(start, "HH:mm"),
      duration_min: dur,
      status: a.status,
      price_reais: (a.price_cents / 100).toFixed(2),
      notes: a.notes ?? "",
    });
    setOpen(true);
  };

  const onPickService = (id: string) => {
    const svc = services.find((s) => s.id === id);
    if (!svc) return;
    setForm((f) => ({
      ...f,
      service_id: id,
      service_name: svc.name,
      duration_min: parseDurationToMinutes(svc.duration),
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_id || !form.professional_id || !form.service_name.trim()) {
      toast.error("Cliente, profissional e serviço são obrigatórios");
      return;
    }
    setSubmitting(true);
    const start = new Date(`${form.date}T${form.start_time}:00`);
    const end = new Date(start.getTime() + form.duration_min * 60000);
    const priceCents = Math.round((parseFloat(form.price_reais || "0") || 0) * 100);
    const payload = {
      client_id: form.client_id,
      professional_id: form.professional_id,
      service_id: form.service_id || null,
      service_name: form.service_name.trim(),
      room_id: form.room_id || null,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      status: form.status,
      price_cents: priceCents,
      notes: form.notes.trim() || null,
    };
    const { error } = editing
      ? await supabase.from("appointments").update(payload).eq("id", editing.id)
      : await supabase.from("appointments").insert(payload as never);
    setSubmitting(false);
    if (error) {
      toast.error(error.message.includes("Conflito") ? "Conflito de horário para esta profissional" : error.message);
      return;
    }
    toast.success(editing ? "Atendimento atualizado" : "Atendimento agendado");
    setOpen(false);
    loadAppts();
  };

  const setStatus = async (a: Appt, status: string) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", a.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Status atualizado");
    loadAppts();
  };

  const remove = async (a: Appt) => {
    if (!confirm("Excluir este atendimento?")) return;
    const { error } = await supabase.from("appointments").delete().eq("id", a.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Atendimento removido");
    loadAppts();
  };

  const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  const totals = useMemo(() => {
    const done = appts.filter((a) => a.status === "realizado");
    return {
      total: appts.length,
      realizados: done.length,
      faturado: done.reduce((s, a) => s + a.price_cents, 0),
    };
  }, [appts]);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground mt-1 capitalize">
            {format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Novo atendimento</Button>
      </header>

      <Card className="p-3 flex items-center gap-2 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => setDate(addDays(date, -1))}><ChevronLeft className="w-4 h-4" /></Button>
        <Input
          type="date"
          className="w-auto"
          value={format(date, "yyyy-MM-dd")}
          onChange={(e) => e.target.value && setDate(startOfDay(new Date(`${e.target.value}T00:00:00`)))}
        />
        <Button variant="ghost" size="icon" onClick={() => setDate(addDays(date, 1))}><ChevronRight className="w-4 h-4" /></Button>
        {!isToday && (
          <Button variant="outline" size="sm" onClick={() => setDate(startOfDay(new Date()))}>Hoje</Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Profissional:</Label>
          <Select value={profFilter} onValueChange={setProfFilter}>
            <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {professionals.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-4"><p className="text-xs text-muted-foreground">Atendimentos</p><p className="text-2xl font-bold mt-1">{totals.total}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Realizados</p><p className="text-2xl font-bold mt-1">{totals.realizados}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Faturado (realizados)</p><p className="text-2xl font-bold mt-1">R$ {(totals.faturado / 100).toFixed(2)}</p></Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : appts.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <CalIcon className="w-8 h-8 mx-auto mb-3 opacity-40" />
          Nenhum atendimento neste dia.
        </Card>
      ) : (
        <div className="space-y-2">
          {appts.map((a) => (
            <Card key={a.id} className="p-4 flex items-start gap-4">
              <div className="flex flex-col items-center justify-center min-w-16 py-1 px-2 rounded-md bg-primary/10 text-primary">
                <span className="text-lg font-bold leading-none">{format(parseISO(a.start_at), "HH:mm")}</span>
                <span className="text-[10px] uppercase tracking-wider mt-1 opacity-70">
                  {Math.round((parseISO(a.end_at).getTime() - parseISO(a.start_at).getTime()) / 60000)} min
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold truncate">{a.service_name}</p>
                  <Badge variant={statusVariant(a.status)} className="capitalize">{a.status}</Badge>
                  {a.price_cents > 0 && <Badge variant="outline">R$ {(a.price_cents / 100).toFixed(2)}</Badge>}
                </div>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                  <UserIcon className="w-3 h-3" />{a.client?.name ?? "—"}
                  <span className="mx-1">•</span>
                  {a.professional?.name ?? "—"}
                  {a.room?.name && (<><span className="mx-1">•</span>{a.room.name}</>)}
                </p>
                {a.notes && <p className="text-xs text-muted-foreground mt-1.5 italic">"{a.notes}"</p>}
              </div>
              <div className="flex items-center gap-1">
                <Select value={a.status} onValueChange={(v) => setStatus(a, v)}>
                  <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => remove(a)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar atendimento" : "Novo atendimento"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <Label>Cliente *</Label>
              <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Profissional *</Label>
              <Select value={form.professional_id} onValueChange={(v) => setForm({ ...form, professional_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {professionals.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sala</Label>
              <Select value={form.room_id || "none"} onValueChange={(v) => setForm({ ...form, room_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Sem sala" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem sala</SelectItem>
                  {rooms.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Serviço *</Label>
              <Select value={form.service_id} onValueChange={onPickService}>
                <SelectTrigger><SelectValue placeholder="Selecione um serviço do catálogo" /></SelectTrigger>
                <SelectContent>
                  {services.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                className="mt-2"
                placeholder="Ou digite um nome livre"
                value={form.service_name}
                onChange={(e) => setForm({ ...form, service_name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Data *</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Início *</Label>
                <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Duração (min)</Label>
                <Input type="number" min={15} step={5} value={form.duration_min}
                  onChange={(e) => setForm({ ...form, duration_min: parseInt(e.target.value || "60", 10) })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" min={0} value={form.price_reais}
                onChange={(e) => setForm({ ...form, price_reais: e.target.value })} placeholder="0,00" />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Observações</Label>
              <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <DialogFooter className="md:col-span-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editing ? "Salvar" : "Agendar")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAgenda;
