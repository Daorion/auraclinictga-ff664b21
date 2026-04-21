import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ScrollText, Sparkles, Users } from "lucide-react";
import { profissionaisData } from "@/data/profissionais";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ services: 0, artworks: 0 });

  useEffect(() => {
    const load = async () => {
      const { count } = await supabase.from("services").select("*", { count: "exact", head: true });
      setStats((s) => ({ ...s, services: count ?? 0 }));
    };
    load();
  }, []);

  const cards = [
    { label: "Serviços cadastrados", value: stats.services, icon: ScrollText },
    { label: "Profissionais ativas", value: profissionaisData.length, icon: Users },
    { label: "Artes geradas", value: stats.artworks, icon: Sparkles },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral da clínica</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">{value}</p>
          </Card>
        ))}
      </div>
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-2">Próximos passos</h2>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
          <li>Cadastre os serviços de cada profissional em <strong>Serviços</strong></li>
          <li>O <strong>Gerador de Artes com IA</strong> chega na próxima fase</li>
        </ul>
      </Card>
    </div>
  );
};

export default AdminDashboard;
