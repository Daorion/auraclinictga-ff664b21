import { useEffect, useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Shuffle, Download, Sparkles, Loader2, RefreshCw, Image as ImageIcon, User, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ArteCanvas } from '@/components/arte/ArteCanvas';
import { arteBlocksCurados, ArteBlock, serviceToBlock, ServiceLite } from '@/lib/arteContent';
import { templates, designPresets, DesignTokens, TemplateMeta } from '@/lib/arteTemplates';
import { profissionaisData } from '@/data/profissionais';

const PREVIEW_MAX_W = 540;
const PREVIEW_MAX_H = 720;
const WHATSAPP = '(65) 99696-6685';
const INSTAGRAM = 'auraclinictga';

interface PhotoOption {
  id: string;
  label: string;
  url: string;
  kind: 'professional' | 'service';
}

const AdminEstudio = () => {
  const [templateIdx, setTemplateIdx] = useState(0);
  const [block, setBlock] = useState<ArteBlock>(arteBlocksCurados[0]);
  const [tokens, setTokens] = useState<DesignTokens>(designPresets[0]);
  const [aiVariants, setAiVariants] = useState<DesignTokens[]>([]);
  const [aiBusy, setAiBusy] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [services, setServices] = useState<ServiceLite[]>([]);
  const [photoIdx, setPhotoIdx] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);

  const template = templates[templateIdx];

  // Carrega serviços
  useEffect(() => {
    supabase
      .from('services')
      .select('id, name, description, professional_name, category, image_url')
      .eq('active', true)
      .order('display_order', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
          return;
        }
        setServices((data as ServiceLite[]) || []);
      });
  }, []);

  // Lista de fotos: profissionais + serviços com imagem
  const photoOptions: PhotoOption[] = useMemo(() => {
    const pros: PhotoOption[] = profissionaisData.map((p) => ({
      id: `pro-${p.id}`,
      label: p.nome,
      url: p.imagem,
      kind: 'professional',
    }));
    const svc: PhotoOption[] = services
      .filter((s) => !!s.image_url)
      .map((s) => ({
        id: `svc-${s.id}`,
        label: s.name,
        url: s.image_url!,
        kind: 'service',
      }));
    return [...pros, ...svc];
  }, [services]);

  const photo = photoOptions[photoIdx] || photoOptions[0];

  // Lista combinada de blocos: curados + serviços
  const allBlocks: ArteBlock[] = useMemo(
    () => [...arteBlocksCurados, ...services.map(serviceToBlock)],
    [services],
  );

  // Escala de preview
  const scale = useMemo(
    () => Math.min(PREVIEW_MAX_W / template.size.w, PREVIEW_MAX_H / template.size.h),
    [template],
  );

  const shuffle = () => {
    setTemplateIdx(Math.floor(Math.random() * templates.length));
    setBlock(allBlocks[Math.floor(Math.random() * allBlocks.length)]);
    const allTokens = [...designPresets, ...aiVariants];
    setTokens(allTokens[Math.floor(Math.random() * allTokens.length)]);
    if (photoOptions.length) setPhotoIdx(Math.floor(Math.random() * photoOptions.length));
  };

  const generateAiVariants = async () => {
    setAiBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-design-template', {
        body: { count: 4, vibe: 'editorial luxuoso' },
      });
      if (error) throw error;
      if (data?.variants?.length) {
        setAiVariants(data.variants);
        setTokens(data.variants[0]);
        toast.success(`${data.variants.length} novas variações de design geradas`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Falha ao gerar';
      toast.error(msg);
    } finally {
      setAiBusy(false);
    }
  };

  const download = async () => {
    if (!canvasRef.current) return;
    setDownloadBusy(true);
    try {
      const dataUrl = await toPng(canvasRef.current, {
        pixelRatio: 1,
        cacheBust: true,
        width: template.size.w,
        height: template.size.h,
        style: { transform: 'none' },
      });
      const link = document.createElement('a');
      link.download = `aura-${template.id}-${block.id}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Arte exportada em alta resolução');
    } catch (e) {
      console.error(e);
      toast.error('Falha ao exportar. Verifique se a imagem permite CORS.');
    } finally {
      setDownloadBusy(false);
    }
  };

  useEffect(() => {
    if ('fonts' in document) (document as Document & { fonts: { ready: Promise<unknown> } }).fonts.ready;
  }, []);

  const allTokens = [...designPresets, ...aiVariants];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Aura Clinic</p>
          <h1 className="text-3xl font-bold mt-1">Estúdio de Artes</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Combine templates editoriais, paletas (presets ou geradas por IA) e fotos da clínica. Exporte PNG em
            altíssima resolução pronto para Instagram.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={shuffle} className="gap-2">
            <Shuffle className="w-4 h-4" /> Randomizar
          </Button>
          <Button onClick={download} disabled={downloadBusy} className="gap-2">
            {downloadBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloadBusy ? 'Gerando...' : 'Baixar PNG'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        {/* Painel de controle */}
        <aside className="space-y-6">
          {/* Templates */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">Template</p>
            <div className="space-y-2">
              {templates.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => setTemplateIdx(i)}
                  className={`w-full text-left rounded-xl border p-3 transition ${
                    i === templateIdx
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{t.name}</span>
                    <span className={`text-[10px] uppercase tracking-wider ${i === templateIdx ? 'opacity-80' : 'opacity-60'}`}>
                      {t.ratio}
                    </span>
                  </div>
                  <p className={`text-xs mt-1 ${i === templateIdx ? 'opacity-90' : 'opacity-60'}`}>{t.description}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Design (paletas) */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                <Palette className="w-3 h-3 inline mr-1" /> Design
              </p>
              <Button size="sm" variant="ghost" onClick={generateAiVariants} disabled={aiBusy} className="h-7 gap-1.5 text-xs">
                {aiBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                IA
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {allTokens.map((dt, i) => {
                const active = tokens.name === dt.name;
                return (
                  <button
                    key={`${dt.name}-${i}`}
                    onClick={() => setTokens(dt)}
                    className={`rounded-xl border p-2 transition text-left ${
                      active ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex gap-1 mb-2 h-8 rounded overflow-hidden">
                      <div style={{ background: dt.bg }} className="flex-1" />
                      <div style={{ background: dt.bgAccent }} className="flex-1" />
                      <div style={{ background: dt.accent }} className="flex-1" />
                    </div>
                    <p className="text-[11px] font-medium truncate">{dt.name}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Conteúdo */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">Conteúdo</p>
            <Tabs defaultValue="curated">
              <TabsList className="grid grid-cols-2 w-full h-8">
                <TabsTrigger value="curated" className="text-xs">Curados</TabsTrigger>
                <TabsTrigger value="services" className="text-xs">Serviços</TabsTrigger>
              </TabsList>
              <TabsContent value="curated" className="mt-2">
                <ScrollArea className="h-[260px] pr-2">
                  <div className="space-y-1.5">
                    {arteBlocksCurados.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => setBlock(b)}
                        className={`w-full text-left rounded-lg border p-2.5 transition ${
                          b.id === block.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                        }`}
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{b.eyebrow}</p>
                        <p className="text-xs font-medium mt-0.5 line-clamp-1">{b.title.replace(/\*/g, '')}</p>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="services" className="mt-2">
                <ScrollArea className="h-[260px] pr-2">
                  <div className="space-y-1.5">
                    {services.length === 0 && (
                      <p className="text-xs text-muted-foreground p-2">Nenhum serviço cadastrado</p>
                    )}
                    {services.map((s) => {
                      const sb = serviceToBlock(s);
                      return (
                        <button
                          key={s.id}
                          onClick={() => setBlock(sb)}
                          className={`w-full text-left rounded-lg border p-2.5 transition ${
                            sb.id === block.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                          }`}
                        >
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {s.category || 'Serviço'}
                          </p>
                          <p className="text-xs font-medium mt-0.5 line-clamp-1">{s.name}</p>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </section>

          {/* Foto */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">Foto</p>
            <ScrollArea className="h-[200px] pr-2">
              <div className="grid grid-cols-3 gap-2">
                {photoOptions.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => setPhotoIdx(i)}
                    title={p.label}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${
                      i === photoIdx ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                    <div className="absolute top-1 left-1">
                      {p.kind === 'professional' ? (
                        <User className="w-3 h-3 text-white drop-shadow" />
                      ) : (
                        <ImageIcon className="w-3 h-3 text-white drop-shadow" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </section>
        </aside>

        {/* Preview */}
        <section className="flex flex-col items-center">
          <div className="mb-3 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <span>{template.name}</span>
            <span>·</span>
            <span>{template.size.w} × {template.size.h}</span>
            <span>·</span>
            <span>{tokens.name}</span>
          </div>
          <div
            className="relative rounded-3xl bg-card shadow-2xl ring-1 ring-border/50 overflow-hidden"
            style={{ width: template.size.w * scale, height: template.size.h * scale }}
          >
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                width: template.size.w,
                height: template.size.h,
              }}
            >
              <ArteCanvas
                ref={canvasRef}
                template={template}
                tokens={tokens}
                block={block}
                photoUrl={photo?.url}
                photoLabel={photo?.label}
                whatsapp={WHATSAPP}
                instagram={INSTAGRAM}
              />
            </div>
          </div>
          <p className="mt-4 max-w-md text-center text-xs text-muted-foreground">
            Use <strong>Randomizar</strong> para combinações novas, gere paletas com a <strong>IA</strong> e clique em
            <strong> Baixar PNG</strong> para exportar em alta resolução.
          </p>
        </section>
      </div>
    </div>
  );
};

export default AdminEstudio;
