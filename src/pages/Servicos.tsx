import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import { profissionaisData } from '@/data/profissionais';
import { ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Slide {
  profissionalNome: string;
  profissionalEspecialidade: string;
  profissionalImagem: string;
  profissionalId: string;
  categoria: string;
  servicos: { titulo: string; descricao: string }[];
}

const Servicos = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Build slides: one per category per professional
  const slides: Slide[] = profissionaisData.flatMap(prof =>
    prof.secaoServicos.map(secao => ({
      profissionalNome: prof.nome,
      profissionalEspecialidade: prof.especialidade,
      profissionalImagem: prof.imagem,
      profissionalId: prof.id,
      categoria: secao.categoria,
      servicos: secao.servicos.slice(0, 4).map(s => ({ titulo: s.titulo, descricao: s.descricao })),
    }))
  );

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 400);
  }, [isTransitioning]);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % slides.length);
  }, [currentSlide, slides.length, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
  }, [currentSlide, slides.length, goToSlide]);

  // Auto-advance
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [nextSlide, isPaused]);

  const slide = slides[currentSlide];

  // Group slides by professional for the nav dots
  const profNames = [...new Set(slides.map(s => s.profissionalNome))];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-20">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-10">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-3">Nossos Serviços</p>
            <h1 className="text-4xl md:text-5xl font-semibold text-primary">
              Tudo o que Oferecemos
            </h1>
          </div>

          {/* 16:9 Showcase */}
          <div 
            className="relative w-full max-w-5xl mx-auto"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-primary shadow-elegant">
              {/* Background Image */}
              <div 
                className={`absolute inset-0 transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
              >
                <img
                  src={slide.profissionalImagem}
                  alt={slide.profissionalNome}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />
              </div>

              {/* Content */}
              <div 
                className={`relative z-10 flex flex-col justify-center h-full p-6 sm:p-10 md:p-14 transition-all duration-500 ${
                  isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
                }`}
              >
                <div className="max-w-[55%]">
                  {/* Professional info */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden ring-2 ring-white/30 flex-shrink-0">
                      <img src={slide.profissionalImagem} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm sm:text-base">{slide.profissionalNome}</p>
                      <p className="text-white/50 text-[10px] sm:text-xs tracking-wider uppercase">{slide.profissionalEspecialidade}</p>
                    </div>
                  </div>

                  {/* Category */}
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-5 leading-tight">
                    {slide.categoria}
                  </h2>

                  {/* Services list */}
                  <div className="space-y-2 mb-6">
                    {slide.servicos.map((servico, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-secondary mt-2 flex-shrink-0" />
                        <div>
                          <p className="text-white/90 text-xs sm:text-sm font-medium">{servico.titulo}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="flex gap-3">
                    <Link
                      to={`/profissional/${slide.profissionalId}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-xs font-medium hover:bg-white/20 transition-colors"
                    >
                      Ver todos os serviços
                    </Link>
                    <a
                      href="https://wa.me/5565996480484"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-xs font-medium hover:bg-white/20 transition-colors"
                    >
                      <MessageCircle size={12} />
                      Agendar
                    </a>
                  </div>
                </div>
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <ChevronRight size={16} />
              </button>

              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 z-20 h-0.5 bg-white/10">
                <div 
                  className="h-full bg-secondary transition-all"
                  style={{
                    width: `${((currentSlide + 1) / slides.length) * 100}%`,
                    transition: 'width 0.5s ease'
                  }}
                />
              </div>
            </div>

            {/* Slide counter */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-muted-foreground">
                {currentSlide + 1} / {slides.length}
              </p>
              
              {/* Professional quick nav */}
              <div className="flex gap-2">
                {profNames.map((name, i) => {
                  const isActive = slide.profissionalNome === name;
                  return (
                    <button
                      key={name}
                      onClick={() => {
                        const idx = slides.findIndex(s => s.profissionalNome === name);
                        if (idx >= 0) goToSlide(idx);
                      }}
                      className={`text-xs px-3 py-1 rounded-full transition-colors ${
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

          {/* All professionals grid below */}
          <div className="mt-20">
            <div className="text-center mb-10">
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-3">Profissionais</p>
              <h2 className="text-3xl font-semibold text-primary">Conheça Nossa Equipe</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-4xl mx-auto">
              {profissionaisData.map((prof) => (
                <Link
                  key={prof.id}
                  to={`/profissional/${prof.id}`}
                  className="group text-center"
                >
                  <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-muted">
                    <img
                      src={prof.imagem}
                      alt={prof.nome}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
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
