import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { toPng } from 'html-to-image';
import {
  Shuffle, Download, Loader2, RefreshCw, Image as ImageIcon, User, Palette, Star, Trash2, Plus, Layout, Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ArteCanvas } from '@/components/arte/ArteCanvas';
import { arteBlocksCurados, ArteBlock, serviceToBlock, ServiceLite } from '@/lib/arteContent';
import { templates, designPresets, DesignTokens, TemplateVariant, defaultVariantFor, TemplateId } from '@/lib/arteTemplates';
import { profissionaisData } from '@/data/profissionais';

const PREVIEW_MAX_W = 540;
const PREVIEW_MAX_H = 720;
const WHATSAPP = '(65) 99696-6685';
const INSTAGRAM = 'auraclinictga';
const HISTORY_KEEP = 12;

interface PhotoOption {
  id: string; label: string; url: string; kind: 'professional' | 'service';
}
interface SavedRow<T> {
  id: string; name: string; tokens: T; is_favorite: boolean; created_at: string; kind: 'design' | 'template';
}

const AdminEstudio = () => {
  const [templateIdx, setTemplateIdx] = useState(0);
  const [variant, setVariant] = useState<TemplateVariant>(defaultVariantFor(templates[0].id));
  const [block, setBlock] = useState<ArteBlock>(arteBlocksCurados[0]);
  const [tokens, setTokens] = useState<DesignTokens>(designPresets[0]);
  const [savedDesigns, setSavedDesigns] = useState<SavedRow<DesignTokens>[]>([]);
  const [savedTemplates, setSavedTemplates] = useState<SavedRow<TemplateVariant>[]>([]);
  const [aiDesignBusy, setAiDesignBusy] = useState(false);
  const [aiTemplateBusy, setAiTemplateBusy] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [services, setServices] = useState<ServiceLite[]>([]);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const template = templates[templateIdx];

  useEffect(() => {
    supabase
      .from('services')
      .select('id, name, description, professional_name, category, image_url')
      .eq('active', true)
      .order('display_order', { ascending: true })
      .then(({ data }) => setServices((data as ServiceLite[]) || []));
  }, []);

  const loadSaved = useCallback(async () => {
    const { data, error } = await supabase
      .from('saved_design_tokens')
      .select('id, name, tokens, is_favorite, created_at, kind')
      .order('is_favorite', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) { console.error(error); return; }
    const rows = (data as unknown as SavedRow<unknown>[]) || [];
    setSavedDesigns(rows.filter((r) => r.kind === 'design') as SavedRow<DesignTokens>[]);
    setSavedTemplates(rows.filter((r) => r.kind === 'template') as SavedRow<TemplateVariant>[]);
  }, []);

  useEffect(() => { loadSaved(); }, [loadSaved]);

  const photoOptions: PhotoOption[] = useMemo(() => {
    const pros: PhotoOption[] = profissionaisData.map((p) => ({
      id: `pro-${p.id}`, label: p.nome, url: p.imagem, kind: 'professional',
    }));
    const svc: PhotoOption[] = services.filter((s) => !!s.image_url).map((s) => ({
      id: `svc-${s.id}`, label: s.name, url: s.image_url!, kind: 'service',
    }));
    return [...pros, ...svc];
  }, [services]);
  const photo = photoOptions[photoIdx] || photoOptions[0];

  const allBlocks: ArteBlock[] = useMemo(
    () => [...arteBlocksCurados, ...services.map(serviceToBlock)], [services],
  );

  const scale = useMemo(
    () => Math.min(PREVIEW_MAX_W / template.size.w, PREVIEW_MAX_H / template.size.h),
    [template],
  );

  const applyTemplateBaseChange = (nextTemplateId: TemplateId) => {
    const nextIdx = templates.findIndex((t) => t.id === nextTemplateId);
    if (nextIdx >= 0) setTemplateIdx(nextIdx);
  };

  const selectVariant = (vRow: SavedRow<TemplateVariant> | { tokens: TemplateVariant }) => {
    const v = vRow.tokens;
    setVariant(v);
    applyTemplateBaseChange(v.baseTemplateId);
  };

  const shuffle = () => {
    const t = Math.floor(Math.random() * templates.length);
    setTemplateIdx(t);
    setVariant(defaultVariantFor(templates[t].id));
    setBlock(allBlocks[Math.floor(Math.random() * allBlocks.length)]);
    const allTokens = [...savedDesigns.map((s) => s.tokens), ...designPresets];
    setTokens(allTokens[Math.floor(Math.random() * allTokens.length)]);
    if (photoOptions.length) setPhotoIdx(Math.floor(Math.random() * photoOptions.length));
  };

  // ─── geração genérica ────────────────────────────────────────
  const generateBatch = async <T,>(opts: {
    fn: 'ai-design-template' | 'ai-template-variant';
    kind: 'design' | 'template';
    busy: (b: boolean) => void;
    onFirst?: (t: T) => void;
    label: string;
  }) => {
    opts.busy(true);
    try {
      const { data, error } = await supabase.functions.invoke(opts.fn, {
        body: { count: 6, vibe: 'editorial luxuoso, varie ao máximo' },
      });
      if (error) throw error;
      const variants: T[] = data?.variants || [];
      if (!variants.length) throw new Error('Nenhuma variação gerada');

      const rows = variants.map((v) => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        name: ((v as any).name as string) || 'Sem nome',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tokens: v as any,
        is_favorite: false,
        kind: opts.kind,
      }));
      const { data: inserted, error: insErr } = await supabase
        .from('saved_design_tokens')
        .insert(rows)
        .select('id, name, tokens, is_favorite, created_at, kind');
      if (insErr) throw insErr;

      // Poda só do mesmo kind
      const { data: nonFav } = await supabase
        .from('saved_design_tokens')
        .select('id')
        .eq('is_favorite', false)
        .eq('kind', opts.kind)
        .order('created_at', { ascending: false });
      if (nonFav && nonFav.length > HISTORY_KEEP) {
        const toDelete = nonFav.slice(HISTORY_KEEP).map((r) => r.id);
        await supabase.from('saved_design_tokens').delete().in('id', toDelete);
      }

      await loadSaved();
      if (inserted?.[0] && opts.onFirst) {
        opts.onFirst((inserted[0] as unknown as SavedRow<T>).tokens);
      }
      toast.success(`${variants.length} ${opts.label} gerados`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Falha ao gerar');
    } finally {
      opts.busy(false);
    }
  };

  const generateDesigns = () => generateBatch<DesignTokens>({
    fn: 'ai-design-template', kind: 'design', busy: setAiDesignBusy,
    label: 'estilos',
    onFirst: (t) => setTokens(t),
  });

  const generateTemplates = () => generateBatch<TemplateVariant>({
    fn: 'ai-template-variant', kind: 'template', busy: setAiTemplateBusy,
    label: 'templates',
    onFirst: (v) => { setVariant(v); applyTemplateBaseChange(v.baseTemplateId); },
  });

  const toggleFavorite = async (row: { id: string; is_favorite: boolean }) => {
    const { error } = await supabase
      .from('saved_design_tokens').update({ is_favorite: !row.is_favorite }).eq('id', row.id);
    if (error) return toast.error('Falha ao favoritar');
    toast.success(row.is_favorite ? 'Removido dos favoritos' : 'Favoritado');
    loadSaved();
  };

  const deleteSaved = async (row: { id: string }) => {
    const { error } = await supabase.from('saved_design_tokens').delete().eq('id', row.id);
    if (error) return toast.error('Falha ao excluir');
    loadSaved();
  };

  const download = async () => {
    if (!canvasRef.current) return;
    setDownloadBusy(true);
    try {
      const dataUrl = await toPng(canvasRef.current, {
        pixelRatio: 1, cacheBust: true,
        width: template.size.w, height: template.size.h,
        style: { transform: 'none' },
      });
      const link = document.createElement('a');
      link.download = `aura-${template.id}-${block.id}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Arte exportada em alta resolução');
    } catch (e) {
      console.error(e); toast.error('Falha ao exportar.');
    } finally {
      setDownloadBusy(false);
    }
  };

  // ─── cards ───────────────────────────────────────────────────
  const designFavs = savedDesigns.filter((s) => s.is_favorite);
  const designHistory = savedDesigns.filter((s) => !s.is_favorite);
  const templateFavs = savedTemplates.filter((s) => s.is_favorite);
  const templateHistory = savedTemplates.filter((s) => !s.is_favorite);

  const renderTokenCard = (dt: DesignTokens, row?: SavedRow<DesignTokens>) => {
    const active = tokens.name === dt.name;
    return (
      <div
        key={`${dt.name}-${row?.id || 'preset'}`}
        className={`group relative rounded-xl border p-2 transition ${
          active ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
        }`}
      >
        <button onClick={() => setTokens(dt)} className="w-full text-left">
          <div className="flex gap-1 mb-2 h-8 rounded overflow-hidden">
            <div style={{ background: dt.bg }} className="flex-1" />
            <div style={{ background: dt.bgAccent }} className="flex-1" />
            <div style={{ background: dt.accent }} className="flex-1" />
          </div>
          <p className="text-[11px] font-medium truncate pr-10">{dt.name}</p>
        </button>
        {row && (
          <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
            <button onClick={(e) => { e.stopPropagation(); toggleFavorite(row); }}
              className="p-1 rounded bg-background/80 hover:bg-background"
              title={row.is_favorite ? 'Desfavoritar' : 'Favoritar'}>
              <Star className={`w-3 h-3 ${row.is_favorite ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); deleteSaved(row); }}
              className="p-1 rounded bg-background/80 hover:bg-destructive hover:text-destructive-foreground" title="Excluir">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
        {row?.is_favorite && (
          <Star className="absolute top-1 right-1 w-3 h-3 fill-yellow-500 text-yellow-500 group-hover:opacity-0 transition" />
        )}
      </div>
    );
  };

  const renderTemplateCard = (
    v: TemplateVariant,
    opts: { row?: SavedRow<TemplateVariant>; isHouse?: boolean },
  ) => {
    const active = variant.name === v.name && variant.baseTemplateId === v.baseTemplateId;
    const baseT = templates.find((t) => t.id === v.baseTemplateId);
    return (
      <div
        key={`${v.name}-${opts.row?.id || 'house'}-${v.baseTemplateId}`}
        className={`group relative rounded-xl border p-2.5 transition ${
          active ? 'border-primary ring-2 ring-primary/30 bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
      >
        <button onClick={() => selectVariant({ tokens: v })} className="w-full text-left">
          <div className="flex items-start justify-between gap-2 mb-1">
            <Layout className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{baseT?.ratio}</span>
          </div>
          <p className="text-[11px] font-medium truncate pr-6">{v.name}</p>
          <p className="text-[10px] text-muted-foreground truncate">{baseT?.name}</p>
        </button>
        {opts.row && (
          <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
            <button onClick={(e) => { e.stopPropagation(); toggleFavorite(opts.row!); }}
              className="p-1 rounded bg-background/80 hover:bg-background"
              title={opts.row.is_favorite ? 'Desfavoritar' : 'Favoritar'}>
              <Star className={`w-3 h-3 ${opts.row.is_favorite ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); deleteSaved(opts.row!); }}
              className="p-1 rounded bg-background/80 hover:bg-destructive hover:text-destructive-foreground" title="Excluir">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
        {opts.row?.is_favorite && (
          <Star className="absolute top-1 right-1 w-3 h-3 fill-yellow-500 text-yellow-500 group-hover:opacity-0 transition" />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Aura Clinic</p>
          <h1 className="text-3xl font-bold mt-1">Estúdio de Artes</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Templates e estilos de cor — ambos com presets <strong>Padrão da Casa</strong> (Marsala oficial)
            e <strong>Tendências</strong> geradas por IA, com favoritos e histórico rotativo (últimos {HISTORY_KEEP}).
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

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <aside className="space-y-6">
          {/* ───────── TEMPLATES ───────── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                <Layout className="w-3 h-3 inline mr-1" /> Templates
              </p>
              <Button size="sm" onClick={generateTemplates} disabled={aiTemplateBusy} className="h-7 gap-1.5 text-xs">
                {aiTemplateBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                Gerar 6 com IA
              </Button>
            </div>

            <Tabs defaultValue="all">
              <TabsList className="grid grid-cols-3 w-full h-8">
                <TabsTrigger value="all" className="text-xs">Tudo</TabsTrigger>
                <TabsTrigger value="fav" className="text-xs gap-1">
                  <Star className="w-3 h-3" />{templateFavs.length}
                </TabsTrigger>
                <TabsTrigger value="history" className="text-xs">Histórico</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-2">
                <ScrollArea className="h-[280px] pr-2">
                  <p className="text-[10px] uppercase tracking-wider text-primary mb-1.5 mt-1 flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Padrão da Casa
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {templates.map((t) => renderTemplateCard(defaultVariantFor(t.id), { isHouse: true }))}
                  </div>
                  {templateFavs.length > 0 && (
                    <>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Tendências favoritas</p>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {templateFavs.map((s) => renderTemplateCard(s.tokens, { row: s }))}
                      </div>
                    </>
                  )}
                  {templateHistory.length > 0 && (
                    <>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Tendências — histórico</p>
                      <div className="grid grid-cols-2 gap-2">
                        {templateHistory.map((s) => renderTemplateCard(s.tokens, { row: s }))}
                      </div>
                    </>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="fav" className="mt-2">
                <ScrollArea className="h-[280px] pr-2">
                  {templateFavs.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2">Nenhum template favoritado ainda.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {templateFavs.map((s) => renderTemplateCard(s.tokens, { row: s }))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="history" className="mt-2">
                <ScrollArea className="h-[280px] pr-2">
                  {templateHistory.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2">Histórico vazio. Clique em "Gerar 6 com IA".</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {templateHistory.map((s) => renderTemplateCard(s.tokens, { row: s }))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </section>

          {/* ───────── ESTILOS (DESIGN TOKENS) ───────── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                <Palette className="w-3 h-3 inline mr-1" /> Estilos de cor
              </p>
              <Button size="sm" onClick={generateDesigns} disabled={aiDesignBusy} className="h-7 gap-1.5 text-xs">
                {aiDesignBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                Gerar 6 com IA
              </Button>
            </div>

            <Tabs defaultValue="all">
              <TabsList className="grid grid-cols-3 w-full h-8">
                <TabsTrigger value="all" className="text-xs">Tudo</TabsTrigger>
                <TabsTrigger value="fav" className="text-xs gap-1">
                  <Star className="w-3 h-3" />{designFavs.length}
                </TabsTrigger>
                <TabsTrigger value="history" className="text-xs">Histórico</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-2">
                <ScrollArea className="h-[280px] pr-2">
                  <p className="text-[10px] uppercase tracking-wider text-primary mb-1.5 mt-1 flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Padrão da Casa (Marsala)
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {designPresets.map((dt) => renderTokenCard(dt))}
                  </div>
                  {designFavs.length > 0 && (
                    <>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Tendências favoritas</p>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {designFavs.map((s) => renderTokenCard(s.tokens, s))}
                      </div>
                    </>
                  )}
                  {designHistory.length > 0 && (
                    <>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Tendências — histórico</p>
                      <div className="grid grid-cols-2 gap-2">
                        {designHistory.map((s) => renderTokenCard(s.tokens, s))}
                      </div>
                    </>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="fav" className="mt-2">
                <ScrollArea className="h-[280px] pr-2">
                  {designFavs.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2">Nenhum estilo favoritado.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {designFavs.map((s) => renderTokenCard(s.tokens, s))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="history" className="mt-2">
                <ScrollArea className="h-[280px] pr-2">
                  {designHistory.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2">Histórico vazio. Clique em "Gerar 6 com IA".</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {designHistory.map((s) => renderTokenCard(s.tokens, s))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </section>
        </aside>

        <section className="space-y-5">
          <div className="flex flex-col items-center">
            <div className="mb-3 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <span>{template.name}</span><span>·</span>
              <span>{template.size.w} × {template.size.h}</span><span>·</span>
              <span>{tokens.name}</span><span>·</span>
              <span>{variant.name}</span>
            </div>
            <div
              className="relative rounded-3xl bg-card shadow-2xl ring-1 ring-border/50 overflow-hidden"
              style={{ width: template.size.w * scale, height: template.size.h * scale }}
            >
              <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: template.size.w, height: template.size.h }}>
                <ArteCanvas
                  ref={canvasRef}
                  template={template}
                  tokens={tokens}
                  block={block}
                  variant={variant}
                  photoUrl={photo?.url}
                  photoLabel={photo?.label}
                  whatsapp={WHATSAPP}
                  instagram={INSTAGRAM}
                />
              </div>
            </div>
          </div>

          {/* Conteúdo + Foto lado a lado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-border/60 bg-card/40 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">Conteúdo</p>
              <Tabs defaultValue="services">
                <TabsList className="grid grid-cols-2 w-full h-8">
                  <TabsTrigger value="services" className="text-xs">Serviços</TabsTrigger>
                  <TabsTrigger value="curated" className="text-xs">Curados</TabsTrigger>
                </TabsList>
                <TabsContent value="services" className="mt-2">
                  <ScrollArea className="h-[260px] pr-2">
                    <div className="space-y-1.5">
                      {services.length === 0 && (
                        <p className="text-xs text-muted-foreground p-2">Nenhum serviço cadastrado</p>
                      )}
                      {serviceGroups.map((group) => {
                        const isOpen = expandedGroup === group.key;
                        const isMulti = group.items.length > 1;
                        const groupActive = group.items.some((s) => `svc-${s.id}` === block.id);
                        const firstWithImg = group.items.find((s) => s.image_url);
                        return (
                          <div key={group.key} className="space-y-1">
                            <button
                              onClick={() => {
                                if (isMulti) {
                                  setExpandedGroup(isOpen ? null : group.key);
                                } else {
                                  const s = group.items[0];
                                  setBlock(serviceToBlock(s));
                                  const idx = photoOptions.findIndex((p) => p.id === `svc-${s.id}`);
                                  if (idx >= 0) setPhotoIdx(idx);
                                }
                              }}
                              className={`w-full text-left rounded-lg border p-2.5 transition flex items-center gap-2.5 ${
                                groupActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                              }`}
                            >
                              {firstWithImg?.image_url ? (
                                <img src={firstWithImg.image_url} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                              ) : (
                                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                                  <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                  {group.items[0].category || 'Serviço'}
                                </p>
                                <p className="text-xs font-medium mt-0.5 truncate">{group.name}</p>
                                {isMulti && (
                                  <p className="text-[9px] text-primary mt-0.5">
                                    {group.items.length} profissionais — clique para escolher
                                  </p>
                                )}
                              </div>
                              {isMulti && (
                                <span className="text-[10px] font-medium text-primary shrink-0">
                                  {isOpen ? '▾' : '▸'}
                                </span>
                              )}
                            </button>
                            {isMulti && isOpen && (
                              <div className="ml-4 pl-3 border-l-2 border-primary/20 space-y-1">
                                {group.items.map((s) => {
                                  const sb = serviceToBlock(s);
                                  const matchingPhoto = s.image_url
                                    ? photoOptions.findIndex((p) => p.id === `svc-${s.id}`)
                                    : -1;
                                  return (
                                    <button
                                      key={s.id}
                                      onClick={() => {
                                        setBlock(sb);
                                        if (matchingPhoto >= 0) setPhotoIdx(matchingPhoto);
                                      }}
                                      className={`w-full text-left rounded-lg border p-2 transition flex items-center gap-2 ${
                                        sb.id === block.id ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/40'
                                      }`}
                                    >
                                      {s.image_url ? (
                                        <img src={s.image_url} alt="" className="w-7 h-7 rounded object-cover shrink-0" />
                                      ) : (
                                        <div className="w-7 h-7 rounded bg-muted flex items-center justify-center shrink-0">
                                          <User className="w-3 h-3 text-muted-foreground" />
                                        </div>
                                      )}
                                      <p className="text-[11px] flex-1 truncate">
                                        {s.professional_name || 'Profissional'}
                                      </p>
                                      {matchingPhoto >= 0 && (
                                        <span className="text-[9px] text-primary uppercase tracking-wider shrink-0">foto</span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </TabsContent>
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
              </Tabs>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">Foto</p>
              <Tabs defaultValue="all">
                <TabsList className="grid grid-cols-3 w-full h-8">
                  <TabsTrigger value="all" className="text-xs">Tudo</TabsTrigger>
                  <TabsTrigger value="pro" className="text-xs gap-1"><User className="w-3 h-3" />Profissionais</TabsTrigger>
                  <TabsTrigger value="svc" className="text-xs gap-1"><ImageIcon className="w-3 h-3" />Serviços</TabsTrigger>
                </TabsList>
                {(['all', 'pro', 'svc'] as const).map((tab) => {
                  const filtered = photoOptions
                    .map((p, i) => ({ p, i }))
                    .filter(({ p }) =>
                      tab === 'all' ? true : tab === 'pro' ? p.kind === 'professional' : p.kind === 'service',
                    );
                  return (
                    <TabsContent key={tab} value={tab} className="mt-2">
                      <ScrollArea className="h-[260px] pr-2">
                        {filtered.length === 0 ? (
                          <p className="text-xs text-muted-foreground p-2">Nenhuma foto disponível</p>
                        ) : (
                          <div className="grid grid-cols-3 gap-2">
                            {filtered.map(({ p, i }) => (
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
                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-1 py-1">
                                  <p className="text-[9px] text-white font-medium truncate leading-tight">{p.label}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminEstudio;
