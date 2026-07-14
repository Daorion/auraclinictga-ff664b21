import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, ChevronRight, ShieldCheck } from "lucide-react";

interface Prof {
  id: string;
  slug: string;
  name: string;
  title: string | null;
  photo_url: string | null;
  active: boolean;
  display_order: number | null;
  user_id: string | null;
  commission_percent: number | null;
}

const AdminProfissionais = () => {
  const [list, setList] = useState<Prof[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("professionals")
      .select("id,slug,name,title,photo_url,active,display_order,user_id,commission_percent")
      .order("display_order", { ascending: true, nullsFirst: false })
      .order("name");
    setList((data as Prof[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profissionais</h1>
          <p className="text-muted-foreground mt-1">Equipe da clínica, comissões e acesso ao painel</p>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-3">
          {list.map((p) => (
            <Link key={p.id} to={`/admin/profissionais/${p.id}`}>
              <Card className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                <div className="w-14 h-14 rounded-full bg-muted overflow-hidden shrink-0">
                  {p.photo_url && <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{p.name}</h3>
                    {!p.active && <Badge variant="secondary">Inativa</Badge>}
                    {p.user_id && (
                      <Badge variant="outline" className="gap-1">
                        <ShieldCheck className="w-3 h-3" /> acesso
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {p.title}{p.commission_percent ? ` • comissão ${Number(p.commission_percent)}%` : ""}
                  </p>
                </div>
                {!p.user_id && (
                  <Badge variant="outline" className="gap-1 mr-2">
                    <UserPlus className="w-3 h-3" /> convidar
                  </Badge>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminProfissionais;
