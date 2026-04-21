import Header from '@/components/Header';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getProfissionaisBasicos } from '@/data/profissionais';
import teamPhoto from '@/assets/profissionais.jpg';

const blobs = ['blob-1', 'blob-2', 'blob-3', 'blob-4', 'blob-5', 'blob-6'];

const Profissionais = () => {
  const profissionais = getProfissionaisBasicos();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-32">
        {/* HERO */}
        <section className="relative py-24 mb-20 overflow-hidden bg-gradient-elegant">
          <div className="absolute top-20 right-10 w-72 h-72 bg-gold/10 blob-1 hidden lg:block" />
          <div className="absolute bottom-10 left-10 w-56 h-56 bg-primary/5 blob-3 hidden lg:block" />

          <div className="container mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-12 gap-12 items-center max-w-7xl mx-auto">
              <div className="lg:col-span-7 order-2 lg:order-1 animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <span className="h-px w-10 bg-gold" />
                  <p className="text-[10px] font-semibold tracking-[0.45em] uppercase text-muted-foreground">
                    Nossa Equipe
                  </p>
                </div>
                <h1 className="font-display text-6xl md:text-7xl lg:text-[7rem] uppercase text-primary leading-[0.88] mb-8">
                  Mãos que
                  <br />
                  <span className="text-gold">cuidam</span>
                  <br />
                  <span className="font-italic-serif normal-case text-primary/85">de você</span>
                </h1>
                <p className="text-base md:text-lg text-muted-foreground font-light leading-relaxed max-w-xl">
                  Uma equipe multidisciplinar de especialistas, unidas pela mesma paixão:
                  cuidar da sua beleza com técnica, arte e dedicação.
                </p>
                <div className="flex items-center gap-10 mt-12 pt-10 border-t border-border/40 max-w-xl">
                  <div>
                    <p className="font-display text-5xl text-primary leading-none">
                      {profissionais.length}
                      <span className="text-gold">+</span>
                    </p>
                    <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mt-3">
                      Especialistas
                    </p>
                  </div>
                  <div>
                    <p className="font-display text-5xl text-primary leading-none">
                      10<span className="text-gold">+</span>
                    </p>
                    <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mt-3">
                      Anos de mercado
                    </p>
                  </div>
                  <div>
                    <p className="font-display text-5xl text-primary leading-none">
                      5K<span className="text-gold">+</span>
                    </p>
                    <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mt-3">
                      Clientes
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 order-1 lg:order-2 relative">
                <div className="relative max-w-md mx-auto">
                  <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-gold blob-2 -z-10" />
                  <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-primary/10 blob-4 -z-10" />
                  <div className="relative aspect-[4/5] overflow-hidden blob-1 shadow-elegant">
                    <img
                      src={teamPhoto}
                      alt="Equipe Aura Clinic"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-4 left-8 bg-background border border-border/50 px-6 py-4 rounded-full flex items-center gap-3 shadow-elegant">
                    <Sparkles className="w-4 h-4 text-gold" />
                    <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-primary">
                      Cuidado Premium
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* GRID */}
        <section className="container mx-auto px-6">
          <div className="text-center mb-20">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="h-px w-10 bg-gold" />
              <p className="text-[10px] font-semibold tracking-[0.45em] uppercase text-muted-foreground">
                Conheça
              </p>
              <span className="h-px w-10 bg-gold" />
            </div>
            <h2 className="font-display text-5xl md:text-7xl uppercase text-primary leading-[0.9]">
              Nossas <span className="text-gold">profissionais</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-20 max-w-6xl mx-auto">
            {profissionais.map((profissional, index) => {
              const blob = blobs[index % blobs.length];
              return (
                <Link
                  key={index}
                  to={`/profissional/${profissional.id}`}
                  className="group block"
                >
                  {/* Imagem orgânica */}
                  <div className="relative mb-8">
                    <div
                      className={`absolute -top-4 -right-4 w-24 h-24 bg-gold/20 ${blobs[(index + 2) % blobs.length]} -z-10 transition-transform duration-700 group-hover:scale-110`}
                    />
                    <div
                      className={`absolute -bottom-4 -left-4 w-28 h-28 bg-primary/10 ${blobs[(index + 4) % blobs.length]} -z-10 transition-transform duration-700 group-hover:scale-110`}
                    />
                    <div
                      className={`relative aspect-[4/5] overflow-hidden ${blob} blob-shape shadow-elegant`}
                    >
                      <img
                        src={profissional.imagem}
                        alt={profissional.nome}
                        className="w-full h-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                      {profissional.destaque && (
                        <div className="absolute top-6 left-6">
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold text-gold-foreground text-[9px] font-bold tracking-[0.25em] uppercase rounded-full shadow-lg">
                            <Sparkles size={10} />
                            Destaque
                          </span>
                        </div>
                      )}

                      <div className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-gold flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-500 shadow-elegant">
                        <ArrowUpRight size={18} className="text-gold-foreground" />
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="text-center px-2">
                    <p className="text-[10px] font-bold tracking-[0.35em] uppercase text-gold mb-3">
                      0{index + 1} · {profissional.especialidade}
                    </p>
                    <h3 className="font-display text-2xl md:text-[1.65rem] uppercase text-primary leading-tight transition-colors duration-500 group-hover:text-gold">
                      {profissional.nome}
                    </h3>
                    <div className="flex items-center justify-center mt-5">
                      <div className="h-px w-10 bg-primary/30 group-hover:w-24 group-hover:bg-gold transition-all duration-500" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Profissionais;
