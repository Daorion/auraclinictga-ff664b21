import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import { profissionaisData } from '@/data/profissionais';
import { ChevronLeft, ChevronRight, MessageCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Slide {
  profissionalNome: string;
  profissionalEspecialidade: string;
  profissionalImagem: string;
  profissionalId: string;
  profissionalExperiencia: string;
  categoria: string;
  servicos: { titulo: string }[];
}

const Servicos = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const slides: Slide[] = profissionaisData.flatMap(prof =>
    prof.secaoServicos.map(secao => ({
      profissionalNome: prof.nome,
      profissionalEspecialidade: prof.especialidade,
      profissionalImagem: prof.imagem,
      profissionalId: prof.id,
      profissionalExperiencia: prof.experiencia,
      categoria: secao.categoria,
      servicos: secao.servicos.slice(0, 5).map(s => ({ titulo: s.titulo })),
    }))
  );

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 350);
  }, [isTransitioning]);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % slides.length);
  }, [currentSlide, slides.length, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
  }, [currentSlide, slides.length, goToSlide]);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide, isPaused]);

  const slide = slides[currentSlide];
  const profNames = [...new Set(slides.map(s => s.profissionalNome))];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-3">Nossos Serviços</p>
            <h1 className="text-4xl md:text-5xl font-semibold text-primary">
              Tudo o que Oferecemos
            </h1>
          </div>

          {/* 16:9 Showcase - Split Layout */}
          <div
            className="relative w-full max-w-5xl mx-auto"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-card border border-border/60 shadow-elegant">
              <div className={`flex h-full transition-all duration-500 ${isTransitioning ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'}`}>
                
                {/* Left - Info */}
                <div className="w-[55%] h-full flex flex-col justify-center p-6 sm:p-8 md:p-12">
                  {/* Professional badge */}
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden ring-1 ring-border flex-shrink-0">
                      <img src={slide.profissionalImagem} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-foreground font-semibold text-xs sm:text-sm leading-tight">{slide.profissionalNome}</p>
                      <p className="text-muted-foreground text-[9px] sm:text-[10px] tracking-wider uppercase">{slide.profissionalExperiencia}</p>
                    </div>
                  </div>

                  {/* Category title */}
                  <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-primary/50 mb-1">{slide.profissionalEspecialidade}</p>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-primary mb-5 leading-tight">
                    {slide.categoria}
                  </h2>

                  {/* Services list */}
                  <div className="space-y-1.5 mb-6">
                    {slide.servicos.map((servico, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary/30 flex-shrink-0" />
                        <p className="text-muted-foreground text-[11px] sm:text-xs">{servico.titulo}</p>
                      </div>
                    ))}
                  </div>

                  {/* CTAs */}
                  <div className="flex gap-2.5">
                    <Link
                      to={`/profissional/${slide.profissionalId}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-[10px] sm:text-xs font-medium hover:bg-primary/90 transition-colors"
                    >
                      Ver serviços
                      <ArrowRight size={10} />
                    </Link>
                    <a
                      href="https://wa.me/5565996480484"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border text-foreground text-[10px] sm:text-xs font-medium hover:bg-muted transition-colors"
                    >
                      <MessageCircle size={10} />
                      Agendar
                    </a>
                  </div>
                </div>

                {/* Right - Photo */}
                <div className="w-[45%] h-full p-3 sm:p-4">
                  <div className="w-full h-full rounded-xl overflow-hidden bg-muted">
                    <img
                      src={slide.profissionalImagem}
                      alt={slide.profissionalNome}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Nav arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-background/80 border border-border/50 flex items-center justify-center text-foreground hover:bg-muted transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-background/80 border border-border/50 flex items-center justify-center text-foreground hover:bg-muted transition-colors"
              >
                <ChevronRight size={14} />
              </button>

              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 z-20 h-[2px] bg-border/30">
                <div
                  className="h-full bg-primary/60 transition-all"
                  style={{ width: `${((currentSlide + 1) / slides.length) * 100}%`, transition: 'width 0.5s ease' }}
                />
              </div>
            </div>

            {/* Bottom controls */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-[10px] text-muted-foreground tracking-wider">
                {String(currentSlide + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
              </p>

              <div className="flex gap-1.5 flex-wrap justify-end">
                {profNames.map((name) => {
                  const isActive = slide.profissionalNome === name;
                  return (
                    <button
                      key={name}
                      onClick={() => {
                        const idx = slides.findIndex(s => s.profissionalNome === name);
                        if (idx >= 0) goToSlide(idx);
                      }}
                      className={`text-[10px] px-2.5 py-1 rounded-full transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Professionals grid */}
          <div className="mt-20">
            <div className="text-center mb-10">
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-3">Profissionais</p>
              <h2 className="text-3xl font-semibold text-primary">Conheça Nossa Equipe</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-4xl mx-auto">
              {profissionaisData.map((prof) => (
                <Link key={prof.id} to={`/profissional/${prof.id}`} className="group text-center">
                  <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-muted">
                    <img src={prof.imagem} alt={prof.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{prof.nome}</p>
                  <p className="text-[10px] text-muted-foreground tracking-wider uppercase mt-0.5">{prof.especialidade}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Servicos;
