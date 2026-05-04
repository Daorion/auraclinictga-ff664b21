import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { toPng } from 'html-to-image';
import {
  Shuffle, Download, Sparkles, Loader2, RefreshCw, Image as ImageIcon, User, Palette, Star, Trash2, Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ArteCanvas } from '@/components/arte/ArteCanvas';
import { arteBlocksCurados, ArteBlock, serviceToBlock, ServiceLite } from '@/lib/arteContent';
import { templates, designPresets, DesignTokens } from '@/lib/arteTemplates';
import { profissionaisData } from '@/data/profissionais';

const PREVIEW_MAX_W = 540;
const PREVIEW_MAX_H = 720;
const WHATSAPP = '(65) 99696-6685';
const INSTAGRAM = 'auraclinictga';
const HISTORY_KEEP = 12; // máximo de não-favoritos mantidos no histórico

interface PhotoOption {
  id: string;
  label: string;
  url: string;
  kind: 'professional' | 'service';
}

interface SavedDesignRow {
  id: string;
  name: string;
  tokens: DesignTokens;
  is_favorite: boolean;
  created_at: string;
}

const AdminEstudio = () => {
  const [templateIdx, setTemplateIdx] = useState(0);
  const [block, setBlock] = useState<ArteBlock>(arteBlocksCurados[0]);
  const [tokens, setTokens] = useState<DesignTokens>(designPresets[0]);
  const [saved, setSaved] = useState<SavedDesignRow[]>([]);
  const [aiBusy, setAiBusy] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [services, setServices] = useState<ServiceLite[]>([]);
  const [photoIdx, setPhotoIdx] = useState(0);
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
      .select('id, name, tokens, is_favorite, created_at')
      .order('is_favorite', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      return;
    }
    setSaved((data as unknown as SavedDesignRow[]) || []);
  }, []);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

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

  const allTokens: DesignTokens[] = useMemo(
    () => [...saved.map((s) => s.tokens), ...designPresets],
    [saved],
  );

  const scale = useMemo(
    () => Math.min(PREVIEW_MAX_W / template.size.w, PREVIEW_MAX_H / template.size.h),
    [template],
  );

  const shuffle = () => {
    setTemplateIdx(Math.floor(Math.random() * templates.length));
    setBlock(allBlocks[Math.floor(Math.random() * allBlocks.length)]);
    setTokens(allTokens[Math.floor(Math.random() * allTokens.length)]);
    if (photoOptions.length) setPhotoIdx(Math.floor(Math.random() * photoOptions.length));
  };

  // Gera novos estilos via IA, salva no banco e roda a poda do histórico (mantém favoritos)
  const generateMore = async (count = 6) => {
    setAiBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-design-template', {
        body: { count, vibe: 'editorial luxuoso, varie o máximo possível' },
      });
      if (error) throw error;
      const variants: DesignTokens[] = data?.variants || [];
      if (!variants.length) throw new Error('Nenhuma variação gerada');

      const rows = variants.map((v) => ({
        name: v.name || 'Sem nome',
        tokens: v as unknown as Record<string, unknown>,
        is_favorite: false,
      }));
      const { data: inserted, error: insErr } = await supabase
        .from('saved_design_tokens')
        .insert(rows)
        .select('id, name, tokens, is_favorite, created_at');
      if (insErr) throw insErr;

      // Poda: deleta não-favoritos antigos além de HISTORY_KEEP
      const { data: nonFav } = await supabase
        .from('saved_design_tokens')
        .select('id')
        .eq('is_favorite', false)
        .order('created_at', { ascending: false });
      if (nonFav && nonFav.length > HISTORY_KEEP) {
        const toDelete = nonFav.slice(HISTORY_KEEP).map((r) => r.id);
        await supabase.from('saved_design_tokens').delete().in('id', toDelete);
      }

      await loadSaved();
      if (inserted?.[0]) setTokens((inserted[0] as unknown as SavedDesignRow).tokens);
      toast.success(`${variants.length} novos estilos gerados`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Falha ao gerar';
      toast.error(msg);
    } finally {
      setAiBusy(false);
    }
  };

  const toggleFavorite = async (row: SavedDesignRow) => {
    const { error } = await supabase
      .from('saved_design_tokens')
      .update({ is_favorite: !row.is_favorite })
      .eq('id', row.id);
    if (error) return toast.error('Falha ao favoritar');
    toast.success(row.is_favorite ? 'Removido dos favoritos' : 'Favoritado — ficará salvo');
    loadSaved();
  };

  const deleteSaved = async (row: SavedDesignRow) => {
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
      console.error(e);
      toast.error('Falha ao exportar.');
    } finally {
      setDownloadBusy(false);
    }
  };

  const favorites = saved.filter((s) => s.is_favorite);
  const history = saved.filter((s) => !s.is_favorite);

  const renderTokenCard = (dt: DesignTokens, opts: { row?: SavedDesignRow; isPreset?: boolean }) => {
    const active = tokens.name === dt.name;
    const row = opts.row;
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
            <button
              onClick={(e) => { e.stopPropagation(); toggleFavorite(row); }}
              className="p-1 rounded bg-background/80 hover:bg-background"
              title={row.is_favorite ? 'Desfavoritar' : 'Favoritar'}
            >
              <Star
                className={`w-3 h-3 ${row.is_favorite ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`}
              />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteSaved(row); }}
              className="p-1 rounded bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
              title="Excluir"
            >
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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Aura Clinic</p>
          <h1 className="text-3xl font-bold mt-1">Estúdio de Artes</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Gere novos estilos com IA, favorite os que você ama (ficam salvos para sempre) e mantenha um histórico
            rotativo dos últimos {HISTORY_KEEP} para revisitar.
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

          {/* Design tokens */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                <Palette className="w-3 h-3 inline mr-1" /> Estilos
              </p>
              <Button
                size="sm" onClick={() => generateMore(6)} disabled={aiBusy}
                className="h-7 gap-1.5 text-xs"
              >
                {aiBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                Gerar 6 com IA
              </Button>
            </div>

            <Tabs defaultValue="all">
              <TabsList className="grid grid-cols-3 w-full h-8">
                <TabsTrigger value="all" className="text-xs">Tudo</TabsTrigger>
                <TabsTrigger value="fav" className="text-xs gap-1">
                  <Star className="w-3 h-3" />{favorites.length}
                </TabsTrigger>
                <TabsTrigger value="history" className="text-xs">Histórico</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-2">
                <ScrollArea className="h-[280px] pr-2">
                  {favorites.length > 0 && (
                    <>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 mt-1">Favoritos</p>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {favorites.map((s) => renderTokenCard(s.tokens, { row: s }))}
                      </div>
                    </>
                  )}
                  {history.length > 0 && (
                    <>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Histórico recente</p>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {history.map((s) => renderTokenCard(s.tokens, { row: s }))}
                      </div>
                    </>
                  )}
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Presets da casa</p>
                  <div className="grid grid-cols-2 gap-2">
                    {designPresets.map((dt) => renderTokenCard(dt, { isPreset: true }))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="fav" className="mt-2">
                <ScrollArea className="h-[280px] pr-2">
                  {favorites.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2">
                      Nenhum favorito ainda. Passe o mouse num estilo e clique na ⭐ para salvar para sempre.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {favorites.map((s) => renderTokenCard(s.tokens, { row: s }))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="history" className="mt-2">
                <ScrollArea className="h-[280px] pr-2">
                  {history.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2">
                      Histórico vazio. Clique em "Gerar 6 com IA" para começar.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {history.map((s) => renderTokenCard(s.tokens, { row: s }))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
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
                <ScrollArea className="h-[220px] pr-2">
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
                <ScrollArea className="h-[220px] pr-2">
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
            <span>{template.name}</span><span>·</span>
            <span>{template.size.w} × {template.size.h}</span><span>·</span>
            <span>{tokens.name}</span>
          </div>
          <div
            className="relative rounded-3xl bg-card shadow-2xl ring-1 ring-border/50 overflow-hidden"
            style={{ width: template.size.w * scale, height: template.size.h * scale }}
          >
            <div
              style={{
                transform: `scale(${scale})`, transformOrigin: 'top left',
                width: template.size.w, height: template.size.h,
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
            Clique em <strong>Gerar 6 com IA</strong> para novos estilos. Use a ⭐ para fixar os favoritos —
            o resto entra no histórico rotativo (últimos {HISTORY_KEEP}).
          </p>
        </section>
      </div>
    </div>
  );
};

export default AdminEstudio;
