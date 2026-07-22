import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getProfissionaisBasicos } from '@/data/profissionais';

interface ProfissionalListagem {
  id: string;      // slug (usado na rota /profissional/:id)
  nome: string;
  especialidade: string;
  descricao: string;
  destaque: boolean;
  imagem: string;
}

const Profissionais = () => {
  const [profissionais, setProfissionais] = useState<ProfissionalListagem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data, error } = await supabase
        .from('professionals')
        .select('slug, name, title, bio, photo_url, active, display_order')
        .eq('active', true)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });
      if (cancel) return;
      if (error || !data || data.length === 0) {
        // Fallback para o arquivo estático em caso de falha
        setProfissionais(getProfissionaisBasicos() as ProfissionalListagem[]);
      } else {
        const fallback = getProfissionaisBasicos();
        setProfissionais(
          data.map((p: any) => {
            const staticMatch = fallback.find((s) => s.id === p.slug);
            return {
              id: p.slug,
              nome: p.name,
              especialidade: p.title ?? staticMatch?.especialidade ?? '',
              descricao: p.bio ?? staticMatch?.descricao ?? '',
              destaque: !!staticMatch?.destaque,
              imagem: p.photo_url || staticMatch?.imagem || '/placeholder.svg',
            };
          }),
        );
      }
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-32">
        {/* HERO — editorial centralizado, sem imagem */}
        <section className="border-b border-border/60">
          <div className="container mx-auto px-6 py-24 md:py-32">
            <div className="max-w-4xl mx-auto text-center">
              <p className="font-sans-display text-[10px] text-muted-foreground mb-8">
                — Equipe Aura Clinic
              </p>
              <h1 className="font-display text-5xl md:text-7xl lg:text-[6rem] text-primary leading-[1.02] tracking-tight mb-10">
                Especialistas dedicadas
                <br />
                <span className="font-italic-serif text-primary/80">à sua confiança.</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground font-light leading-[1.85] max-w-2xl mx-auto">
                Uma equipe multidisciplinar formada por profissionais certificadas,
                unidas por um único compromisso: oferecer o cuidado mais ético, técnico
                e refinado para cada cliente.
              </p>

              <div className="grid grid-cols-3 gap-8 mt-20 pt-12 border-t border-border/60 max-w-2xl mx-auto">
                <div>
                  <p className="font-display text-4xl md:text-5xl text-primary leading-none">
                    {profissionais.length.toString().padStart(2, '0')}
                  </p>
                  <p className="font-sans-display text-[9px] text-muted-foreground mt-3">
                    Especialistas
                  </p>
                </div>
                <div>
                  <p className="font-display text-4xl md:text-5xl text-primary leading-none">10+</p>
                  <p className="font-sans-display text-[9px] text-muted-foreground mt-3">
                    Anos de mercado
                  </p>
                </div>
                <div>
                  <p className="font-display text-4xl md:text-5xl text-primary leading-none">5K+</p>
                  <p className="font-sans-display text-[9px] text-muted-foreground mt-3">
                    Clientes atendidos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* GRID profissionais — formato editorial */}
        <section className="container mx-auto px-6 py-24 md:py-32">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between flex-wrap gap-6 mb-16 md:mb-20 pb-8 border-b border-border/60">
              <div>
                <p className="font-sans-display text-[10px] text-muted-foreground mb-4">
                  — Corpo clínico
                </p>
                <h2 className="font-display text-4xl md:text-6xl text-primary leading-[1.05] tracking-tight">
                  Conheça nossas <span className="font-italic-serif">profissionais</span>
                </h2>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs font-light leading-relaxed">
                Selecione uma profissional para conhecer sua trajetória, especialidades
                e procedimentos.
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-24">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
                {profissionais.map((profissional, index) => (
                  <Link
                    key={profissional.id}
                    to={`/profissional/${profissional.id}`}
                    className="group block"
                  >
                    <div className="portrait-frame aspect-[3/4] mb-6">
                      <img
                        src={profissional.imagem}
                        alt={profissional.nome}
                        className="w-full h-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                      {profissional.destaque && (
                        <div className="absolute top-4 left-4 z-10">
                          <span className="font-sans-display text-[9px] text-primary-foreground bg-primary/90 backdrop-blur-sm px-3 py-1.5">
                            Destaque
                          </span>
                        </div>
                      )}

                      <div className="absolute bottom-4 right-4 z-10 w-10 h-10 border border-primary-foreground/40 bg-primary/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                        <ArrowUpRight size={16} className="text-primary-foreground" />
                      </div>
                    </div>

                    <div>
                      <p className="font-sans-display text-[9px] text-muted-foreground mb-3">
                        {(index + 1).toString().padStart(2, '0')} · {profissional.especialidade}
                      </p>
                      <h3 className="font-display text-2xl md:text-[1.75rem] text-primary leading-tight transition-colors duration-500 group-hover:text-primary/70">
                        {profissional.nome}
                      </h3>
                      <div className="mt-5 flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase text-muted-foreground/70 group-hover:text-primary transition-colors duration-500">
                        <span>Ver perfil</span>
                        <span className="h-px w-8 bg-current transition-all duration-500 group-hover:w-14" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Profissionais;
