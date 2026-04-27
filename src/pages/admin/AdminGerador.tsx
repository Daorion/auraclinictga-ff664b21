import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Download, Save, ArrowLeft, Image as ImageIcon, Square, Smartphone, FileText, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Format = "story" | "post" | "carousel" | "flyer";
type Step = "select" | "generating" | "editor";

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
}

const FORMATS: { value: Format; label: string; icon: any; size: string; w: number; h: number }[] = [
  { value: "story", label: "Story Instagram", icon: Smartphone, size: "1080×1920", w: 1080, h: 1920 },
  { value: "post", label: "Post Feed", icon: Square, size: "1080×1080", w: 1080, h: 1080 },
  { value: "carousel", label: "Carrossel", icon: Layers, size: "1080×1080", w: 1080, h: 1080 },
  { value: "flyer", label: "Flyer A4", icon: FileText, size: "A4 Vertical", w: 1240, h: 1754 },
];

const FONT_OPTIONS = [
  { value: "'Cormorant Garamond', serif", label: "Cormorant (Elegante)" },
  { value: "'Playfair Display', serif", label: "Playfair (Editorial)" },
  { value: "'Inter', sans-serif", label: "Inter (Moderno)" },
  { value: "'Archivo Black', sans-serif", label: "Archivo (Forte)" },
];

const AdminGerador = () => {
  const [step, setStep] = useState<Step>("select");
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [format, setFormat] = useState<Format>("post");
  const [customPrompt, setCustomPrompt] = useState("");

  const [bgUrl, setBgUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");

  // Editor state
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [titleFont, setTitleFont] = useState(FONT_OPTIONS[0].value);
  const [titleColor, setTitleColor] = useState("#ffffff");
  const [titleSize, setTitleSize] = useState(96);
  const [overlayOpacity, setOverlayOpacity] = useState(0.45);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("center");
  const [textPosition, setTextPosition] = useState<"top" | "middle" | "bottom">("bottom");

  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    supabase
      .from("services")
      .select("id, name, description, category, image_url")
      .eq("active", true)
      .order("display_order")
      .then(({ data }) => setServices(data || []));
  }, []);

  const handleGenerate = async () => {
    if (!selectedService) return;
    setStep("generating");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-artwork`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionData.session?.access_token}`,
          },
          body: JSON.stringify({
            serviceId: selectedService.id,
            serviceName: selectedService.name,
            serviceDescription: selectedService.description,
            format,
            customPrompt: customPrompt || undefined,
            existingBackgroundUrl: selectedService.image_url || undefined,
          }),
        },
      );

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Erro na geração");

      setBgUrl(data.backgroundUrl);
      setCaption(data.caption || "");
      setHashtags(data.hashtags || "");
      setAiPrompt(data.prompt || "");
      setTitle(selectedService.name.toUpperCase());
      setSubtitle(selectedService.category || "Aura Clinic TGA");
      setStep("editor");
      toast.success("Arte gerada! Ajuste os detalhes ao lado.");
    } catch (e: any) {
      toast.error(e.message || "Falha ao gerar");
      setStep("select");
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !bgUrl) return;
    const fmt = FORMATS.find((f) => f.value === format)!;
    canvas.width = fmt.w;
    canvas.height = fmt.h;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Cover fit
      const ratio = Math.max(canvas.width / img.width, canvas.height / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);

      // Dark overlay
      ctx.fillStyle = `rgba(10,5,8,${overlayOpacity})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Marsala accent bar
      ctx.fillStyle = "#c9a84c";
      const barX = textAlign === "center" ? canvas.width / 2 - 60 : textAlign === "left" ? 80 : canvas.width - 140;
      const barY = textPosition === "top" ? 200 : textPosition === "middle" ? canvas.height / 2 - 80 : canvas.height - 380;
      ctx.fillRect(barX, barY, 120, 4);

      // Title
      ctx.fillStyle = titleColor;
      ctx.font = `700 ${titleSize}px ${titleFont}`;
      ctx.textAlign = textAlign;
      const tx = textAlign === "center" ? canvas.width / 2 : textAlign === "left" ? 80 : canvas.width - 80;
      const ty = textPosition === "top" ? 280 : textPosition === "middle" ? canvas.height / 2 : canvas.height - 280;
      wrapText(ctx, title, tx, ty, canvas.width - 160, titleSize * 1.1);

      // Subtitle
      ctx.font = `400 ${Math.round(titleSize * 0.32)}px 'Inter', sans-serif`;
      ctx.fillStyle = "#e8d9b8";
      ctx.fillText(subtitle, tx, ty + titleSize * 1.4);

      // Brand
      ctx.font = `500 ${Math.round(titleSize * 0.26)}px 'Inter', sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.textAlign = "center";
      ctx.fillText("AURA CLINIC TGA", canvas.width / 2, canvas.height - 80);
    };
    img.src = bgUrl;
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
    const words = text.split(" ");
    let line = "";
    const lines: string[] = [];
    for (const w of words) {
      const test = line + w + " ";
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line.trim());
        line = w + " ";
      } else line = test;
    }
    lines.push(line.trim());
    const startY = y - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
  };

  useEffect(() => {
    if (step === "editor") drawCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, bgUrl, title, subtitle, titleFont, titleColor, titleSize, overlayOpacity, textAlign, textPosition]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedService?.name || "arte"}-${format}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  const handleSaveToHistory = async () => {
    setSaving(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setSaving(false);
        return;
      }
      const fileName = `final/${Date.now()}-${crypto.randomUUID()}.png`;
      const { error: upErr } = await supabase.storage
        .from("artworks")
        .upload(fileName, blob, { contentType: "image/png" });
      if (upErr) {
        toast.error("Erro ao salvar: " + upErr.message);
        setSaving(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("artworks").getPublicUrl(fileName);

      const { error: dbErr } = await supabase.from("generated_artworks").insert({
        service_id: selectedService?.id,
        service_name: selectedService?.name || "Sem nome",
        format,
        background_url: bgUrl,
        final_url: urlData.publicUrl,
        caption,
        hashtags,
        ai_prompt: aiPrompt,
        overlay_data: { title, subtitle, titleFont, titleColor, titleSize, overlayOpacity, textAlign, textPosition },
      });
      if (dbErr) toast.error("Erro ao salvar histórico: " + dbErr.message);
      else toast.success("Arte salva no histórico!");
      setSaving(false);
    }, "image/png");
  };

  const reset = () => {
    setStep("select");
    setSelectedService(null);
    setBgUrl("");
    setCaption("");
    setHashtags("");
    setCustomPrompt("");
  };

  if (step === "generating") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-9 h-9 text-primary animate-pulse" />
          </div>
          <Loader2 className="absolute inset-0 m-auto w-20 h-20 animate-spin text-primary/30" />
        </div>
        <h2 className="text-2xl font-bold mt-6">Criando sua arte com IA…</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          Gerando fundo personalizado e legenda para <strong>{selectedService?.name}</strong>. Isso leva ~15s.
        </p>
      </div>
    );
  }

  if (step === "editor") {
    return (
      <div className="space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={reset}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Nova arte
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{selectedService?.name}</h1>
              <p className="text-sm text-muted-foreground">{FORMATS.find((f) => f.value === format)?.label}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveToHistory} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar no histórico
            </Button>
            <Button onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" /> Baixar PNG
            </Button>
          </div>
        </header>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          {/* Preview */}
          <Card className="p-4 bg-muted/30 flex items-center justify-center min-h-[500px]">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-[70vh] object-contain shadow-2xl rounded"
              style={{ aspectRatio: `${FORMATS.find((f) => f.value === format)!.w} / ${FORMATS.find((f) => f.value === format)!.h}` }}
            />
          </Card>

          {/* Controls */}
          <div className="space-y-5">
            <Card className="p-4 space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Texto</h3>
              <div>
                <Label className="text-xs">Título principal</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Subtítulo</Label>
                <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Fonte do título</Label>
                <select
                  value={titleFont}
                  onChange={(e) => setTitleFont(e.target.value)}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Cor</Label>
                  <Input type="color" value={titleColor} onChange={(e) => setTitleColor(e.target.value)} className="mt-1 h-10 p-1" />
                </div>
                <div>
                  <Label className="text-xs">Tamanho ({titleSize}px)</Label>
                  <input type="range" min={48} max={180} value={titleSize} onChange={(e) => setTitleSize(+e.target.value)} className="mt-3 w-full" />
                </div>
              </div>
            </Card>

            <Card className="p-4 space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Composição</h3>
              <div>
                <Label className="text-xs">Alinhamento</Label>
                <div className="flex gap-2 mt-1">
                  {(["left", "center", "right"] as const).map((a) => (
                    <Button key={a} size="sm" variant={textAlign === a ? "default" : "outline"} onClick={() => setTextAlign(a)} className="flex-1 capitalize">{a === "left" ? "Esq" : a === "center" ? "Centro" : "Dir"}</Button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs">Posição vertical</Label>
                <div className="flex gap-2 mt-1">
                  {(["top", "middle", "bottom"] as const).map((p) => (
                    <Button key={p} size="sm" variant={textPosition === p ? "default" : "outline"} onClick={() => setTextPosition(p)} className="flex-1">{p === "top" ? "Topo" : p === "middle" ? "Meio" : "Base"}</Button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs">Escurecimento do fundo ({Math.round(overlayOpacity * 100)}%)</Label>
                <input type="range" min={0} max={0.85} step={0.05} value={overlayOpacity} onChange={(e) => setOverlayOpacity(+e.target.value)} className="mt-2 w-full" />
              </div>
            </Card>

            <Card className="p-4 space-y-3">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Legenda gerada</h3>
              <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={5} className="text-sm" />
              <Textarea value={hashtags} onChange={(e) => setHashtags(e.target.value)} rows={2} className="text-sm font-mono" />
              <Button size="sm" variant="outline" className="w-full" onClick={() => { navigator.clipboard.writeText(`${caption}\n\n${hashtags}`); toast.success("Legenda copiada!"); }}>
                Copiar legenda + hashtags
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Step: select
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Sparkles className="w-7 h-7 text-primary" /> Gerador de Artes
        </h1>
        <p className="text-muted-foreground mt-1">IA gera o fundo, você ajusta o texto. Pronto em segundos.</p>
      </header>

      <Card className="p-6 space-y-5">
        <div>
          <Label className="text-sm font-semibold">1. Escolha o serviço</Label>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedService(s)}
                className={`text-left p-3 rounded-lg border transition-colors relative ${selectedService?.id === s.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}
              >
                <div className="flex items-start gap-2">
                  {s.image_url && (
                    <img src={s.image_url} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{s.name}</p>
                    {s.category && <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.category}</p>}
                    {s.image_url ? (
                      <span className="text-[10px] text-primary uppercase tracking-wider">Imagem própria</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Fundo por IA</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
            {services.length === 0 && (
              <p className="col-span-full text-sm text-muted-foreground py-6 text-center">
                Nenhum serviço cadastrado. Vá em <strong>Serviços</strong> para adicionar.
              </p>
            )}
          </div>
        </div>

        <div>
          <Label className="text-sm font-semibold">2. Escolha o formato</Label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
            {FORMATS.map((f) => {
              const Icon = f.icon;
              return (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  className={`p-4 rounded-lg border text-left transition-colors ${format === f.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}
                >
                  <Icon className="w-5 h-5 text-primary mb-2" />
                  <p className="font-medium text-sm">{f.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.size}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Label className="text-sm font-semibold">3. Direção criativa (opcional)</Label>
          <Textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Ex.: tons mais quentes, ambiente com flores, estética minimalista japonesa..."
            rows={3}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">Deixe em branco para usar a estética padrão Aura Clinic (Marsala + Dourado).</p>
        </div>

        <Button onClick={handleGenerate} disabled={!selectedService} size="lg" className="w-full">
          <Sparkles className="w-4 h-4 mr-2" /> Gerar arte com IA
        </Button>
      </Card>
    </div>
  );
};

export default AdminGerador;
