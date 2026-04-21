import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Download, Trash2, Copy, Loader2, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Artwork {
  id: string;
  service_name: string;
  format: string;
  background_url: string;
  final_url: string | null;
  caption: string | null;
  hashtags: string | null;
  created_at: string;
}

const FORMAT_LABEL: Record<string, string> = {
  story: "Story",
  post: "Post",
  carousel: "Carrossel",
  flyer: "Flyer A4",
};

const AdminHistorico = () => {
  const [items, setItems] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("generated_artworks")
      .select("id, service_name, format, background_url, final_url, caption, hashtags, created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar: " + error.message);
    else setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta arte?")) return;
    const { error } = await supabase.from("generated_artworks").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Arte excluída");
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const handleDownload = async (url: string, name: string, format: string) => {
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${name}-${format}.png`;
      a.click();
    } catch (e) {
      toast.error("Falha no download");
    }
  };

  const copyCaption = (a: Artwork) => {
    navigator.clipboard.writeText(`${a.caption || ""}\n\n${a.hashtags || ""}`);
    toast.success("Legenda copiada!");
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <History className="w-7 h-7 text-primary" /> Histórico
        </h1>
        <p className="text-muted-foreground mt-1">Todas as artes geradas. Baixe, copie a legenda ou exclua.</p>
      </header>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="w-14 h-14 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
            <ImageIcon className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Nenhuma arte ainda</h2>
          <p className="text-muted-foreground mt-2">Vá em <strong>Gerador de Artes</strong> para criar sua primeira.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((a) => {
            const url = a.final_url || a.background_url;
            return (
              <Card key={a.id} className="overflow-hidden group">
                <div className="aspect-square bg-muted relative overflow-hidden">
                  <img src={url} alt={a.service_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  <span className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider bg-background/90 backdrop-blur px-2 py-1 rounded">
                    {FORMAT_LABEL[a.format] || a.format}
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="font-semibold text-sm truncate">{a.service_name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDownload(url, a.service_name, a.format)}>
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                    {a.caption && (
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => copyCaption(a)}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="flex-1 text-destructive hover:text-destructive" onClick={() => handleDelete(a.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminHistorico;
