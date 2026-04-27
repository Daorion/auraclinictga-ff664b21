import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Upload, ImageIcon, Trash2, Check, X, Wand2 } from "lucide-react";

interface Service {
  id: string;
  name: string;
  category: string | null;
  professional_name: string | null;
  image_url: string | null;
}

interface PendingFile {
  id: string;
  file: File;
  previewUrl: string;
  serviceId: string | null; // associação manual
  guessed: boolean;
  status: "idle" | "uploading" | "done" | "error";
  error?: string;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const guessService = (fileName: string, services: Service[]): string | null => {
  const base = norm(fileName.replace(/\.[^.]+$/, ""));
  if (!base) return null;
  // 1. Match exato por nome normalizado
  const exact = services.find((s) => norm(s.name) === base);
  if (exact) return exact.id;
  // 2. Nome do serviço contido no arquivo (mais longo primeiro)
  const sorted = [...services].sort((a, b) => b.name.length - a.name.length);
  for (const s of sorted) {
    const n = norm(s.name);
    if (n && (base.includes(n) || n.includes(base))) return s.id;
  }
  return null;
};

const AdminImagens = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<"all" | "with" | "without">("all");
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("services")
      .select("id, name, category, professional_name, image_url")
      .order("name");
    if (error) toast.error("Erro ao carregar serviços");
    else setServices((data as Service[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const items: PendingFile[] = arr.map((file) => {
      const guessId = guessService(file.name, services);
      return {
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        serviceId: guessId,
        guessed: !!guessId,
        status: "idle",
      };
    });
    setPending((prev) => [...prev, ...items]);
    const matched = items.filter((i) => i.serviceId).length;
    toast.success(`${items.length} imagem(ns) adicionada(s)${matched ? ` — ${matched} associada(s) automaticamente` : ""}`);
  };

  const removePending = (id: string) => {
    setPending((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const updateAssoc = (id: string, serviceId: string) => {
    setPending((prev) =>
      prev.map((p) => (p.id === id ? { ...p, serviceId, guessed: false } : p))
    );
  };

  const uploadOne = async (item: PendingFile): Promise<boolean> => {
    if (!item.serviceId) return false;
    const ext = item.file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `services/${item.serviceId}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("service-images")
      .upload(path, item.file, { contentType: item.file.type, upsert: true });
    if (upErr) {
      setPending((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, status: "error", error: upErr.message } : p))
      );
      return false;
    }
    const { data: urlData } = supabase.storage.from("service-images").getPublicUrl(path);
    const { error: dbErr } = await supabase
      .from("services")
      .update({ image_url: urlData.publicUrl })
      .eq("id", item.serviceId);
    if (dbErr) {
      setPending((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, status: "error", error: dbErr.message } : p))
      );
      return false;
    }
    setPending((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, status: "done" } : p))
    );
    return true;
  };

  const uploadAll = async () => {
    const ready = pending.filter((p) => p.serviceId && p.status !== "done");
    if (ready.length === 0) {
      toast.error("Nenhuma imagem associada para enviar");
      return;
    }
    setUploading(true);
    let ok = 0;
    for (const item of ready) {
      setPending((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, status: "uploading" } : p))
      );
      const success = await uploadOne(item);
      if (success) ok++;
    }
    setUploading(false);
    toast.success(`${ok}/${ready.length} imagem(ns) enviada(s) com sucesso`);
    await load();
  };

  const clearDone = () => {
    setPending((prev) => {
      prev.filter((p) => p.status === "done").forEach((p) => URL.revokeObjectURL(p.previewUrl));
      return prev.filter((p) => p.status !== "done");
    });
  };

  const removeImage = async (s: Service) => {
    if (!s.image_url) return;
    if (!confirm(`Remover imagem de "${s.name}"?`)) return;
    // Tentar deletar do storage (best-effort)
    const url = s.image_url;
    const idx = url.indexOf("/service-images/");
    if (idx >= 0) {
      const path = url.slice(idx + "/service-images/".length);
      await supabase.storage.from("service-images").remove([path]);
    }
    const { error } = await supabase
      .from("services")
      .update({ image_url: null })
      .eq("id", s.id);
    if (error) toast.error("Erro ao remover");
    else {
      toast.success("Imagem removida");
      load();
    }
  };

  const stats = useMemo(() => {
    const total = services.length;
    const withImg = services.filter((s) => s.image_url).length;
    return { total, withImg, without: total - withImg };
  }, [services]);

  const filteredServices = useMemo(() => {
    if (filter === "with") return services.filter((s) => s.image_url);
    if (filter === "without") return services.filter((s) => !s.image_url);
    return services;
  }, [services, filter]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <ImageIcon className="w-7 h-7 text-primary" /> Imagens dos Procedimentos
        </h1>
        <p className="text-muted-foreground mt-1">
          Suba as imagens de fundo de cada procedimento. O gerador usará essas imagens automaticamente como base da arte.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
          <p className="text-2xl font-bold mt-1">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Com imagem</p>
          <p className="text-2xl font-bold mt-1 text-primary">{stats.withImg}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Sem imagem</p>
          <p className="text-2xl font-bold mt-1 text-destructive">{stats.without}</p>
        </Card>
      </div>

      {/* Upload Zone */}
      <Card
        className="p-8 border-dashed border-2 cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.classList.add("border-primary");
        }}
        onDragLeave={(e) => e.currentTarget.classList.remove("border-primary")}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove("border-primary");
          handleFiles(e.dataTransfer.files);
        }}
      >
        <div className="text-center">
          <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
          <p className="mt-3 font-medium">Clique ou arraste imagens aqui</p>
          <p className="text-sm text-muted-foreground mt-1">
            Dica: nomeie o arquivo com o nome do procedimento (ex.: <em>botox.jpg</em>) para associação automática.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </Card>

      {/* Pending */}
      {pending.length > 0 && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Imagens pendentes ({pending.length})</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearDone} disabled={uploading}>
                Limpar enviadas
              </Button>
              <Button size="sm" onClick={uploadAll} disabled={uploading}>
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Enviar todas
              </Button>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {pending.map((p) => (
              <div key={p.id} className="flex gap-3 p-3 rounded-lg border bg-muted/30">
                <img
                  src={p.previewUrl}
                  alt=""
                  className="w-20 h-20 object-cover rounded shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start gap-2">
                    <p className="text-xs text-muted-foreground truncate flex-1" title={p.file.name}>
                      {p.file.name}
                    </p>
                    {p.status === "done" && (
                      <Badge className="bg-primary/15 text-primary border-primary/20">
                        <Check className="w-3 h-3 mr-1" /> Enviado
                      </Badge>
                    )}
                    {p.status === "uploading" && (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    )}
                    {p.status === "error" && (
                      <Badge variant="destructive" title={p.error}>
                        Erro
                      </Badge>
                    )}
                  </div>
                  <Select
                    value={p.serviceId ?? ""}
                    onValueChange={(v) => updateAssoc(p.id, v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Associar a um serviço…" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                          {s.image_url && (
                            <span className="text-muted-foreground"> (substituir)</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center justify-between">
                    {p.guessed && p.serviceId && (
                      <span className="text-[10px] text-primary inline-flex items-center gap-1">
                        <Wand2 className="w-3 h-3" /> Sugerido pelo nome
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 ml-auto text-destructive"
                      onClick={() => removePending(p.id)}
                      disabled={uploading}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Lista de serviços */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h3 className="font-semibold">Serviços cadastrados</h3>
          <div className="flex gap-1">
            {(["all", "with", "without"] as const).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "default" : "outline"}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "Todos" : f === "with" ? "Com imagem" : "Sem imagem"}
              </Button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredServices.map((s) => (
              <div key={s.id} className="rounded-lg border overflow-hidden bg-card">
                <div className="aspect-video bg-muted relative">
                  {s.image_url ? (
                    <img
                      src={s.image_url}
                      alt={s.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      Sem imagem
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {s.professional_name}
                  </p>
                  {s.image_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 w-full text-destructive h-7 text-xs"
                      onClick={() => removeImage(s)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Remover imagem
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminImagens;
