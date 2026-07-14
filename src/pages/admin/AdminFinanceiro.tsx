import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Check, Trash2, TrendingUp, TrendingDown, Wallet, Percent } from "lucide-react";

type Kind = "receita" | "despesa";
interface Entry {
  id: string;
  kind: Kind;
  source: string;
  description: string;
  amount_cents: number;
  status: string;
  due_at: string | null;
  paid_at: string | null;
  payment_method_id: string | null;
  category_id: string | null;
  professional_id: string | null;
  appointment_id: string | null;
  category?: { name: string } | null;
  payment_method?: { name: string } | null;
  professional?: { name: string } | null;
}
interface Commission {
  id: string;
  professional_id: string;
  amount_cents: number;
  base_amount_cents: number;
  percent: number;
  status: string;
  paid_at: string | null;
  created_at: string;
  appointment_id: string | null;
  professional?: { name: string } | null;
}
interface Opt { id: string; name: string; kind?: string; }

const money = (c: number) => `R$ ${(c / 100).toFixed(2).replace(".", ",")}`;

const emptyExp = {
  description: "",
  amount_reais: "",
  due_at: format(new Date(), "yyyy-MM-dd"),
  category_id: "",
  payment_method_id: "",
  notes: "",
};

const AdminFinanceiro = () => {
  const [month, setMonth] = useState<Date>(startOfMonth(new Date()));
  const [entries, setEntries] = useState<Entry[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [categories, setCategories] = useState<Opt[]>([]);
  const [methods, setMethods] = useState<Opt[]>([]);
  const [loading, setLoading] = useState(true);

  const [openExp, setOpenExp] = useState(false);
  const [expForm, setExpForm] = useState(emptyExp);
  const [submitting, setSubmitting] = useState(false);

  const loadRefs = async () => {
    const [c, m] = await Promise.all([
      supabase.from("finance_categories").select("id,name,kind").eq("active", true).order("name"),
      supabase.from("payment_methods").select("id,name").eq("active", true).order("name"),
    ]);
    setCategories((c.data as Opt[]) ?? []);
    setMethods((m.data as Opt[]) ?? []);
  };

  const load = async () => {
    setLoading(true);
    const from = startOfMonth(month).toISOString();
    const to = endOfMonth(month).toISOString();
    const [e, k] = await Promise.all([
      supabase.from("finance_entries")
        .select(`id, kind, source, description, amount_cents, status, due_at, paid_at,
                 payment_method_id, category_id, professional_id, appointment_id,
                 category:finance_categories(name),
                 payment_method:payment_methods(name),
                 professional:professionals(name)`)
        .gte("created_at", from).lte("created_at", to)
        .order("created_at", { ascending: false }),
      supabase.from("commissions")
        .select(`id, professional_id, amount_cents, base_amount_cents, percent, status, paid_at, created_at, appointment_id,
                 professional:professionals(name)`)
        .gte("created_at", from).lte("created_at", to)
        .order("created_at", { ascending: false }),
    ]);
    setEntries((e.data as unknown as Entry[]) ?? []);
    setCommissions((k.data as unknown as Commission[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { loadRefs(); }, []);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [month]);

  const kpis = useMemo(() => {
    const receitaPaga = entries.filter((e) => e.kind === "receita" && e.status === "pago").reduce((s, e) => s + e.amount_cents, 0);
    const receitaPend = entries.filter((e) => e.kind === "receita" && e.status !== "pago").reduce((s, e) => s + e.amount_cents, 0);
    const despesaPaga = entries.filter((e) => e.kind === "despesa" && e.status === "pago").reduce((s, e) => s + e.amount_cents, 0);
    const despesaPend = entries.filter((e) => e.kind === "despesa" && e.status !== "pago").reduce((s, e) => s + e.amount_cents, 0);
    return { receitaPaga, receitaPend, despesaPaga, despesaPend, saldo: receitaPaga - despesaPaga };
  }, [entries]);

  const markPaid = async (e: Entry) => {
    const { error } = await supabase.from("finance_entries")
      .update({ status: "pago", paid_at: new Date().toISOString() }).eq("id", e.id);
    if (error) return toast.error(error.message);
    toast.success("Marcado como pago");
    load();
  };
  const removeEntry = async (e: Entry) => {
    if (!confirm("Excluir este lançamento?")) return;
    const { error } = await supabase.from("finance_entries").delete().eq("id", e.id);
    if (error) return toast.error(error.message);
    toast.success("Removido");
    load();
  };
  const payCommission = async (c: Commission) => {
    const { error } = await supabase.from("commissions")
      .update({ status: "pago", paid_at: new Date().toISOString() }).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Comissão paga");
    load();
  };

  const submitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Math.round((parseFloat(expForm.amount_reais || "0") || 0) * 100);
    if (!expForm.description.trim() || amount <= 0) {
      toast.error("Descrição e valor são obrigatórios");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("finance_entries").insert({
      kind: "despesa",
      source: "manual",
      description: expForm.description.trim(),
      amount_cents: amount,
      status: "pendente",
      due_at: expForm.due_at || null,
      category_id: expForm.category_id || null,
      payment_method_id: expForm.payment_method_id || null,
    } as never);
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Despesa lançada");
    setOpenExp(false);
    setExpForm(emptyExp);
    load();
  };

  const receber = entries.filter((e) => e.kind === "receita");
  const pagar = entries.filter((e) => e.kind === "despesa");
  const expenseCategories = categories.filter((c) => c.kind === "despesa" || !c.kind);

  const kpiCards = [
    { label: "Receita paga", value: money(kpis.receitaPaga), Icon: TrendingUp, tone: "text-emerald-600" },
    { label: "A receber", value: money(kpis.receitaPend), Icon: Wallet, tone: "text-primary" },
    { label: "Despesas pagas", value: money(kpis.despesaPaga), Icon: TrendingDown, tone: "text-destructive" },
    { label: "Saldo do mês", value: money(kpis.saldo), Icon: Percent, tone: kpis.saldo >= 0 ? "text-emerald-600" : "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground mt-1 capitalize">
            {format(month, "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="month"
            className="w-auto"
            value={format(month, "yyyy-MM")}
            onChange={(e) => e.target.value && setMonth(startOfMonth(new Date(`${e.target.value}-01T00:00:00`)))}
          />
          <Button onClick={() => setOpenExp(true)}><Plus className="w-4 h-4 mr-2" />Nova despesa</Button>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map(({ label, value, Icon, tone }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">{label}</p>
              <Icon className={`w-4 h-4 ${tone}`} />
            </div>
            <p className={`text-xl font-bold ${tone}`}>{value}</p>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <Tabs defaultValue="receber">
          <TabsList>
            <TabsTrigger value="receber">A receber ({receber.length})</TabsTrigger>
            <TabsTrigger value="pagar">A pagar ({pagar.length})</TabsTrigger>
            <TabsTrigger value="comissoes">Comissões ({commissions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="receber" className="space-y-2 mt-4">
            {receber.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground text-sm">Nenhuma receita neste mês.</Card>
            ) : receber.map((e) => (
              <EntryRow key={e.id} e={e} methods={methods} onPay={markPaid} onDelete={removeEntry} onReload={load} />
            ))}
          </TabsContent>

          <TabsContent value="pagar" className="space-y-2 mt-4">
            {pagar.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground text-sm">Nenhuma despesa neste mês.</Card>
            ) : pagar.map((e) => (
              <EntryRow key={e.id} e={e} methods={methods} onPay={markPaid} onDelete={removeEntry} onReload={load} />
            ))}
          </TabsContent>

          <TabsContent value="comissoes" className="space-y-2 mt-4">
            {commissions.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground text-sm">Nenhuma comissão gerada neste mês.</Card>
            ) : commissions.map((c) => (
              <Card key={c.id} className="p-4 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{c.professional?.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    Base {money(c.base_amount_cents)} × {Number(c.percent)}% • {format(parseISO(c.created_at), "dd/MM")}
                  </p>
                </div>
                <p className="font-bold text-lg">{money(c.amount_cents)}</p>
                <Badge variant={c.status === "pago" ? "outline" : "secondary"} className="capitalize">{c.status}</Badge>
                {c.status !== "pago" && (
                  <Button size="sm" variant="outline" onClick={() => payCommission(c)}>
                    <Check className="w-3 h-3 mr-1" /> Pagar
                  </Button>
                )}
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={openExp} onOpenChange={setOpenExp}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova despesa</DialogTitle></DialogHeader>
          <form onSubmit={submitExpense} className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Descrição *</Label>
              <Input value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Valor (R$) *</Label>
              <Input type="number" step="0.01" min={0} value={expForm.amount_reais}
                onChange={(e) => setExpForm({ ...expForm, amount_reais: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Vencimento</Label>
              <Input type="date" value={expForm.due_at} onChange={(e) => setExpForm({ ...expForm, due_at: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={expForm.category_id || "none"} onValueChange={(v) => setExpForm({ ...expForm, category_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Sem categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {expenseCategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Forma de pagamento</Label>
              <Select value={expForm.payment_method_id || "none"} onValueChange={(v) => setExpForm({ ...expForm, payment_method_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {methods.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="ghost" onClick={() => setOpenExp(false)}>Cancelar</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lançar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface RowProps {
  e: Entry;
  methods: Opt[];
  onPay: (e: Entry) => void;
  onDelete: (e: Entry) => void;
  onReload: () => void;
}
const EntryRow = ({ e, methods, onPay, onDelete, onReload }: RowProps) => {
  const [payingMethod, setPayingMethod] = useState<string | null>(null);
  const changeMethod = async (v: string) => {
    setPayingMethod(v);
    const { error } = await supabase.from("finance_entries").update({ payment_method_id: v }).eq("id", e.id);
    if (error) toast.error(error.message);
    else onReload();
  };
  return (
    <Card className="p-4 flex items-center gap-4 flex-wrap">
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{e.description}</p>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
          {e.category?.name && <span>{e.category.name}</span>}
          {e.professional?.name && <><span>•</span><span>{e.professional.name}</span></>}
          {e.due_at && <><span>•</span><span>venc. {format(parseISO(e.due_at), "dd/MM")}</span></>}
          {e.source === "appointment" && <Badge variant="outline" className="text-[10px]">auto</Badge>}
        </p>
      </div>
      <Select value={payingMethod ?? e.payment_method_id ?? "none"} onValueChange={changeMethod}>
        <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Forma" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="none">—</SelectItem>
          {methods.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <p className={`font-bold text-lg ${e.kind === "receita" ? "text-emerald-600" : "text-destructive"}`}>
        {e.kind === "receita" ? "+" : "−"} {money(e.amount_cents)}
      </p>
      <Badge variant={e.status === "pago" ? "outline" : "secondary"} className="capitalize">{e.status}</Badge>
      {e.status !== "pago" && (
        <Button size="sm" variant="outline" onClick={() => onPay(e)}>
          <Check className="w-3 h-3 mr-1" />{e.kind === "receita" ? "Recebi" : "Paguei"}
        </Button>
      )}
      <Button size="icon" variant="ghost" onClick={() => onDelete(e)}>
        <Trash2 className="w-4 h-4 text-destructive" />
      </Button>
    </Card>
  );
};

export default AdminFinanceiro;
