import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  CalendarCheck,
  CircleDollarSign,
  Clock,
  Users,
  TrendingUp,
  AlertCircle,
  Sparkles,
  ScrollText,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const brl = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const startOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
};
const endOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
};
const startOfDay = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};
const endOfDay = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
};

const COLORS = ["hsl(var(--primary))", "#CCB8A6", "#D1C7BD", "#8B5E3C", "#59101C"];

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    todayAppointments: 0,
    todayRealized: 0,
    monthRevenue: 0,
    monthPending: 0,
    monthExpenses: 0,
    activeClients: 0,
    services: 0,
    professionals: 0,
  });
  const [revenueByDay, setRevenueByDay] = useState<{ day: string; total: number }[]>([]);
  const [topServices, setTopServices] = useState<{ name: string; value: number }[]>([]);
  const [topPros, setTopPros] = useState<{ name: string; value: number }[]>([]);
  const [nextAppts, setNextAppts] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const monthStart = startOfMonth();
      const monthEnd = endOfMonth();
      const dayStart = startOfDay();
      const dayEnd = endOfDay();

      const [
        todayAll,
        monthRevenueQ,
        monthPendingQ,
        monthExpensesQ,
        clientsQ,
        servicesQ,
        prosQ,
        monthApptsQ,
        upcomingQ,
      ] = await Promise.all([
        supabase
          .from("appointments")
          .select("id,status,price_cents,start_at,service_name,professional_id,client_id")
          .gte("start_at", dayStart)
          .lte("start_at", dayEnd),
        supabase
          .from("finance_entries")
          .select("amount_cents")
          .eq("kind", "receita")
          .eq("status", "pago")
          .gte("paid_at", monthStart)
          .lt("paid_at", monthEnd),
        supabase
          .from("finance_entries")
          .select("amount_cents")
          .eq("kind", "receita")
          .eq("status", "pendente")
          .gte("created_at", monthStart)
          .lt("created_at", monthEnd),
        supabase
          .from("finance_entries")
          .select("amount_cents")
          .eq("kind", "despesa")
          .gte("created_at", monthStart)
          .lt("created_at", monthEnd),
        supabase.from("clients").select("*", { count: "exact", head: true }),
        supabase.from("services").select("*", { count: "exact", head: true }),
        supabase.from("professionals").select("*", { count: "exact", head: true }).eq("active", true),
        supabase
          .from("appointments")
          .select("start_at,status,price_cents,service_name,professional_id")
          .gte("start_at", monthStart)
          .lt("start_at", monthEnd),
        supabase
          .from("appointments")
          .select("id,start_at,service_name,status,client_id,professional_id,clients(name),professionals(name)")
          .gte("start_at", new Date().toISOString())
          .in("status", ["agendado", "confirmado"])
          .order("start_at", { ascending: true })
          .limit(6),
      ]);

      const todayList = todayAll.data ?? [];
      const revenue = (monthRevenueQ.data ?? []).reduce((s, r: any) => s + (r.amount_cents ?? 0), 0);
      const pending = (monthPendingQ.data ?? []).reduce((s, r: any) => s + (r.amount_cents ?? 0), 0);
      const expenses = (monthExpensesQ.data ?? []).reduce((s, r: any) => s + (r.amount_cents ?? 0), 0);

      // Build revenue-by-day for current month from realized appointments
      const monthAppts = (monthApptsQ.data ?? []).filter((a: any) => a.status === "realizado");
      const byDay = new Map<string, number>();
      monthAppts.forEach((a: any) => {
        const d = new Date(a.start_at);
        const key = String(d.getDate()).padStart(2, "0");
        byDay.set(key, (byDay.get(key) ?? 0) + (a.price_cents ?? 0));
      });
      const daysInMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        0
      ).getDate();
      const revSeries = Array.from({ length: daysInMonth }, (_, i) => {
        const key = String(i + 1).padStart(2, "0");
        return { day: key, total: Math.round((byDay.get(key) ?? 0) / 100) };
      });

      // Top services (by count this month)
      const svcMap = new Map<string, number>();
      monthAppts.forEach((a: any) => {
        svcMap.set(a.service_name, (svcMap.get(a.service_name) ?? 0) + 1);
      });
      const topSvc = Array.from(svcMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      // Top professionals (by revenue realized)
      const proIds = Array.from(new Set(monthAppts.map((a: any) => a.professional_id))).filter(Boolean);
      let proNames: Record<string, string> = {};
      if (proIds.length) {
        const { data: prosData } = await supabase
          .from("professionals")
          .select("id,name")
          .in("id", proIds as string[]);
        (prosData ?? []).forEach((p: any) => (proNames[p.id] = p.name));
      }
      const proMap = new Map<string, number>();
      monthAppts.forEach((a: any) => {
        const name = proNames[a.professional_id] ?? "—";
        proMap.set(name, (proMap.get(name) ?? 0) + (a.price_cents ?? 0));
      });
      const topP = Array.from(proMap.entries())
        .map(([name, value]) => ({ name, value: Math.round(value / 100) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      setKpis({
        todayAppointments: todayList.length,
        todayRealized: todayList.filter((a: any) => a.status === "realizado").length,
        monthRevenue: revenue,
        monthPending: pending,
        monthExpenses: expenses,
        activeClients: clientsQ.count ?? 0,
        services: servicesQ.count ?? 0,
        professionals: prosQ.count ?? 0,
      });
      setRevenueByDay(revSeries);
      setTopServices(topSvc);
      setTopPros(topP);
      setNextAppts(upcomingQ.data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const balance = useMemo(
    () => kpis.monthRevenue - kpis.monthExpenses,
    [kpis.monthRevenue, kpis.monthExpenses]
  );

  const monthLabel = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const kpiCards = [
    {
      label: "Atendimentos hoje",
      value: kpis.todayAppointments,
      hint: `${kpis.todayRealized} realizados`,
      icon: CalendarCheck,
      to: "/admin/agenda",
    },
    {
      label: "Faturamento do mês",
      value: brl(kpis.monthRevenue),
      hint: `Saldo ${brl(balance)}`,
      icon: CircleDollarSign,
      to: "/admin/financeiro",
    },
    {
      label: "A receber",
      value: brl(kpis.monthPending),
      hint: "Contas pendentes",
      icon: Clock,
      to: "/admin/financeiro",
    },
    {
      label: "Despesas do mês",
      value: brl(kpis.monthExpenses),
      hint: "Saídas registradas",
      icon: TrendingUp,
      to: "/admin/financeiro",
    },
    {
      label: "Clientes cadastradas",
      value: kpis.activeClients,
      hint: "Base ativa",
      icon: Users,
      to: "/admin/clientes",
    },
    {
      label: "Profissionais",
      value: kpis.professionals,
      hint: `${kpis.services} serviços`,
      icon: Sparkles,
      to: "/admin/profissionais",
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1 capitalize">
          Visão geral · {monthLabel}
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando indicadores…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpiCards.map(({ label, value, hint, icon: Icon, to }) => (
              <Link key={label} to={to}>
                <Card className="p-6 hover:shadow-lg transition-shadow h-full">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-2xl font-bold tracking-tight">{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{hint}</p>
                </Card>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Faturamento realizado por dia</h2>
                <span className="text-xs text-muted-foreground">valores em R$</span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(v: number) =>
                        v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                      }
                      labelFormatter={(l) => `Dia ${l}`}
                    />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="font-semibold mb-4">Serviços mais realizados</h2>
              {topServices.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem atendimentos realizados no mês.</p>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topServices}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={45}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {topServices.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-6">
              <h2 className="font-semibold mb-4">Top profissionais (faturamento)</h2>
              {topPros.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem dados no mês.</p>
              ) : (
                <ul className="space-y-3">
                  {topPros.map((p, i) => {
                    const max = topPros[0].value || 1;
                    const pct = (p.value / max) * 100;
                    return (
                      <li key={p.name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{i + 1}. {p.name}</span>
                          <span className="text-muted-foreground">
                            {(p.value).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </span>
                        </div>
                        <div className="h-2 rounded bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Próximos atendimentos</h2>
                <Link to="/admin/agenda" className="text-xs text-primary hover:underline">
                  Ver agenda
                </Link>
              </div>
              {nextAppts.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4" />
                  Nenhum agendamento futuro.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {nextAppts.map((a: any) => {
                    const d = new Date(a.start_at);
                    return (
                      <li key={a.id} className="py-3 flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium">{a.clients?.name ?? "Cliente"}</p>
                          <p className="text-xs text-muted-foreground">
                            {a.service_name} · {a.professionals?.name ?? "—"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {d.toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-primary" /> Atalhos
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <Link to="/admin/agenda" className="p-3 rounded-lg border hover:bg-muted transition">Nova consulta</Link>
              <Link to="/admin/clientes" className="p-3 rounded-lg border hover:bg-muted transition">Cadastrar cliente</Link>
              <Link to="/admin/financeiro" className="p-3 rounded-lg border hover:bg-muted transition">Lançar despesa</Link>
              <Link to="/admin/estudio" className="p-3 rounded-lg border hover:bg-muted transition">Gerar arte</Link>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
