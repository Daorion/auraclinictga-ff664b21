import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Activity, TrendingUp, AlertCircle } from "lucide-react";

interface UsageRow {
  id: string;
  function_name: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  created_at: string;
}

// Preços aproximados (USD por 1M tokens) — apenas para estimativa.
// Fonte: preços públicos dos modelos usados pela Aurora.
const PRICING_USD_PER_M: Record<string, { in: number; out: number }> = {
  "google/gemini-2.5-flash": { in: 0.075, out: 0.30 },
  "google/gemini-3.6-flash": { in: 0.075, out: 0.30 },
  "google/gemini-1.5-flash": { in: 0.075, out: 0.30 },
  "openai/gpt-4o-transcribe": { in: 2.50, out: 10.00 },
  "openai/gpt-4o-mini-transcribe": { in: 0.15, out: 0.60 },
};

// Limite mensal de referência (ajuste conforme o plano)
const MONTHLY_TOKEN_BUDGET = 20_000_000; // 20M tokens/mês como alvo saudável
const MONTHLY_USD_BUDGET = 15; // ~US$15/mês em IA

function costUsd(row: UsageRow): number {
  const p = PRICING_USD_PER_M[row.model];
  if (!p) return 0;
  return (row.prompt_tokens / 1_000_000) * p.in + (row.completion_tokens / 1_000_000) * p.out;
}

function fmtInt(n: number) { return n.toLocaleString("pt-BR"); }
function fmtUsd(n: number) { return `US$ ${n.toFixed(n < 1 ? 4 : 2)}`; }

const AdminAuroraConsumo = () => {
  const [rows, setRows] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 30 * 24 * 3600_000).toISOString();
      const { data } = await supabase
        .from("ai_usage_log")
        .select("id, function_name, model, prompt_tokens, completion_tokens, total_tokens, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(2000);
      setRows((data as UsageRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 3600_000;
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const startMonth = new Date(); startMonth.setDate(1); startMonth.setHours(0, 0, 0, 0);

    const bucket = (from: number, rows: UsageRow[]) =>
      rows.filter(r => new Date(r.created_at).getTime() >= from);

    const today = bucket(startOfDay.getTime(), rows);
    const week = bucket(now - 7 * dayMs, rows);
    const month = bucket(startMonth.getTime(), rows);

    const sum = (rs: UsageRow[]) => rs.reduce((acc, r) => {
      acc.tokens += r.total_tokens || 0;
      acc.calls += 1;
      acc.usd += costUsd(r);
      return acc;
    }, { tokens: 0, calls: 0, usd: 0 });

    // Por função (mês)
    const byFn = new Map<string, { tokens: number; calls: number; usd: number }>();
    for (const r of month) {
      const cur = byFn.get(r.function_name) ?? { tokens: 0, calls: 0, usd: 0 };
      cur.tokens += r.total_tokens || 0;
      cur.calls += 1;
      cur.usd += costUsd(r);
      byFn.set(r.function_name, cur);
    }

    // Por modelo (mês)
    const byModel = new Map<string, { tokens: number; calls: number; usd: number }>();
    for (const r of month) {
      const cur = byModel.get(r.model) ?? { tokens: 0, calls: 0, usd: 0 };
      cur.tokens += r.total_tokens || 0;
      cur.calls += 1;
      cur.usd += costUsd(r);
      byModel.set(r.model, cur);
    }

    // Últimos 7 dias — série diária
    const daily: { label: string; tokens: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const t = rows
        .filter(r => {
          const ts = new Date(r.created_at).getTime();
          return ts >= d.getTime() && ts < next.getTime();
        })
        .reduce((a, r) => a + (r.total_tokens || 0), 0);
      daily.push({
        label: d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" }),
        tokens: t,
      });
    }
    const maxDaily = Math.max(1, ...daily.map(d => d.tokens));

    return {
      today: sum(today),
      week: sum(week),
      month: sum(month),
      byFn: Array.from(byFn.entries()).sort((a, b) => b[1].tokens - a[1].tokens),
      byModel: Array.from(byModel.entries()).sort((a, b) => b[1].tokens - a[1].tokens),
      daily, maxDaily,
    };
  }, [rows]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const monthTokenPct = Math.min(100, (stats.month.tokens / MONTHLY_TOKEN_BUDGET) * 100);
  const monthUsdPct = Math.min(100, (stats.month.usd / MONTHLY_USD_BUDGET) * 100);
  const overBudget = monthTokenPct > 100 || monthUsdPct > 100;
  const nearBudget = monthTokenPct > 80 || monthUsdPct > 80;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title: "Hoje", data: stats.today, icon: Activity },
          { title: "Últimos 7 dias", data: stats.week, icon: TrendingUp },
          { title: "Este mês", data: stats.month, icon: TrendingUp },
        ].map((b) => (
          <Card key={b.title} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{b.title}</p>
              <b.icon className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold mt-2">{fmtInt(b.data.tokens)} <span className="text-sm font-normal text-muted-foreground">tokens</span></p>
            <p className="text-xs text-muted-foreground mt-1">
              {fmtInt(b.data.calls)} chamadas · <span className="text-foreground/80">{fmtUsd(b.data.usd)}</span> estimado
            </p>
          </Card>
        ))}
      </div>

      {/* Orçamento mensal */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Orçamento mensal</h3>
          {overBudget ? (
            <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" /> Acima do alvo</Badge>
          ) : nearBudget ? (
            <Badge className="gap-1 bg-amber-500 text-white hover:bg-amber-500"><AlertCircle className="w-3 h-3" /> Perto do alvo</Badge>
          ) : (
            <Badge variant="secondary">Dentro do alvo</Badge>
          )}
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Tokens</span>
            <span>{fmtInt(stats.month.tokens)} / {fmtInt(MONTHLY_TOKEN_BUDGET)}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className={`h-full ${monthTokenPct > 100 ? "bg-destructive" : monthTokenPct > 80 ? "bg-amber-500" : "bg-primary"}`} style={{ width: `${Math.min(100, monthTokenPct)}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Custo estimado (USD)</span>
            <span>{fmtUsd(stats.month.usd)} / {fmtUsd(MONTHLY_USD_BUDGET)}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className={`h-full ${monthUsdPct > 100 ? "bg-destructive" : monthUsdPct > 80 ? "bg-amber-500" : "bg-primary"}`} style={{ width: `${Math.min(100, monthUsdPct)}%` }} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Alvos ajustáveis no código (`MONTHLY_TOKEN_BUDGET`, `MONTHLY_USD_BUDGET`). O custo em USD é uma estimativa
          baseada nos preços públicos dos modelos. O consumo real em créditos aparece em Workspace → Plans & credits.
        </p>
      </Card>

      {/* Série diária */}
      <Card className="p-5">
        <h3 className="font-semibold mb-4">Consumo diário — últimos 7 dias</h3>
        <div className="flex items-end gap-2 h-40">
          {stats.daily.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-primary/20 rounded-t relative flex items-end" style={{ height: "100%" }}>
                <div className="w-full bg-primary rounded-t" style={{ height: `${(d.tokens / stats.maxDaily) * 100}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground">{d.label}</span>
              <span className="text-[10px] font-medium">{d.tokens >= 1000 ? `${(d.tokens/1000).toFixed(1)}k` : d.tokens}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Por função e por modelo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-semibold mb-3">Por função (mês)</h3>
          <div className="space-y-2">
            {stats.byFn.length === 0 && <p className="text-sm text-muted-foreground">Sem dados ainda.</p>}
            {stats.byFn.map(([fn, v]) => (
              <div key={fn} className="flex justify-between text-sm border-b border-border/40 pb-2 last:border-0">
                <span className="font-mono text-xs">{fn}</span>
                <span className="text-muted-foreground">{fmtInt(v.tokens)} tk · {v.calls}× · {fmtUsd(v.usd)}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold mb-3">Por modelo (mês)</h3>
          <div className="space-y-2">
            {stats.byModel.length === 0 && <p className="text-sm text-muted-foreground">Sem dados ainda.</p>}
            {stats.byModel.map(([m, v]) => (
              <div key={m} className="flex justify-between text-sm border-b border-border/40 pb-2 last:border-0">
                <span className="font-mono text-xs">{m}</span>
                <span className="text-muted-foreground">{fmtInt(v.tokens)} tk · {v.calls}× · {fmtUsd(v.usd)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Últimas chamadas */}
      <Card className="p-5">
        <h3 className="font-semibold mb-3">Últimas 30 chamadas</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground border-b">
              <tr>
                <th className="text-left py-2 pr-2">Quando</th>
                <th className="text-left py-2 pr-2">Função</th>
                <th className="text-left py-2 pr-2">Modelo</th>
                <th className="text-right py-2 pr-2">In</th>
                <th className="text-right py-2 pr-2">Out</th>
                <th className="text-right py-2 pr-2">Total</th>
                <th className="text-right py-2">Custo</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 30).map((r) => (
                <tr key={r.id} className="border-b border-border/40">
                  <td className="py-2 pr-2 whitespace-nowrap">{new Date(r.created_at).toLocaleString("pt-BR")}</td>
                  <td className="py-2 pr-2 font-mono text-xs">{r.function_name}</td>
                  <td className="py-2 pr-2 font-mono text-xs">{r.model}</td>
                  <td className="py-2 pr-2 text-right">{fmtInt(r.prompt_tokens)}</td>
                  <td className="py-2 pr-2 text-right">{fmtInt(r.completion_tokens)}</td>
                  <td className="py-2 pr-2 text-right font-medium">{fmtInt(r.total_tokens)}</td>
                  <td className="py-2 text-right text-muted-foreground">{fmtUsd(costUsd(r))}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">Nenhuma chamada registrada ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminAuroraConsumo;
