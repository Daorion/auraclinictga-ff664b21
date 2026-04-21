import Header from '@/components/Header';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getProfissionaisBasicos } from '@/data/profissionais';
import teamPhoto from '@/assets/profissionais.jpg';

const Profissionais = () => {
  const profissionais = getProfissionaisBasicos();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-32">
        {/* Hero */}
        <section className="relative py-20 mb-16 overflow-hidden bg-gradient-elegant">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <div className="order-2 lg:order-1 animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <span className="h-px w-10 bg-primary/40" />
                  <p className="text-[10px] font-medium tracking-[0.4em] uppercase text-muted-foreground">Nossa Equipe</p>
                </div>
                <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-light text-primary mb-6 leading-[0.95] tracking-tight">
                  Mãos que
                  <span className="block italic font-normal">cuidam de você</span>
                </h1>
                <p className="text-base md:text-lg text-muted-foreground font-light leading-relaxed max-w-md">
                  Uma equipe de especialistas dedicadas à sua beleza e bem-estar.
                  Cada profissional, uma trajetória de excelência.
                </p>
                <div className="flex items-center gap-8 mt-10 pt-8 border-t border-border/40 max-w-md">
                  <div>
                    <p className="font-serif text-4xl font-light text-primary">{profissionais.length}+</p>
                    <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mt-1">Especialistas</p>
                  </div>
                  <div>
                    <p className="font-serif text-4xl font-light text-primary italic">10+</p>
                    <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mt-1">Anos de mercado</p>
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2 relative">
                <div className="relative overflow-hidden aspect-[4/5] max-w-md mx-auto">
                  <img
                    src={teamPhoto}
                    alt="Equipe Aura Clinic"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 ring-1 ring-inset ring-primary/10" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-24 h-24 border border-primary/20 -z-0 hidden lg:block" />
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-secondary/30 -z-0 hidden lg:block" />
              </div>
            </div>
          </div>
        </section>

        {/* Grid de profissionais */}
        <section className="container mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[10px] font-medium tracking-[0.4em] uppercase text-muted-foreground mb-4">— Conheça —</p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-primary tracking-tight">
              Nossas <span className="italic">profissionais</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14 max-w-6xl mx-auto">
            {profissionais.map((profissional, index) => (
              <Link
                key={index}
                to={`/profissional/${profissional.id}`}
                className="group block"
              >
                {/* Imagem */}
                <div className="relative aspect-[3/4] overflow-hidden bg-muted mb-5">
                  <img
                    src={profissional.imagem}
                    alt={profissional.nome}
                    className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  {profissional.destaque && (
                    <div className="absolute top-4 left-4">
                      <span className="inline-block px-3 py-1.5 bg-background/90 backdrop-blur-sm text-[9px] font-medium tracking-[0.25em] uppercase text-primary">
                        Destaque
                      </span>
                    </div>
                  )}

                  {/* CTA hover */}
                  <div className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-background flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                    <ArrowUpRight size={16} className="text-primary" />
                  </div>
                </div>

                {/* Info */}
                <div className="px-1">
                  <p className="text-[10px] font-medium tracking-[0.3em] uppercase text-muted-foreground mb-2">
                    0{index + 1} — {profissional.especialidade}
                  </p>
                  <h3 className="font-serif text-2xl md:text-[1.75rem] font-light text-primary leading-tight tracking-tight group-hover:italic transition-all duration-500">
                    {profissional.nome}
                  </h3>
                  <div className="h-px w-8 bg-primary/30 mt-4 group-hover:w-20 group-hover:bg-primary transition-all duration-500" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Profissionais;
