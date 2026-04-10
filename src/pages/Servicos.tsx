import { useState, useEffect, useRef } from 'react';
import { profissionaisData } from '@/data/profissionais';
import auraLogo from '@/assets/aura-logo.png';

const Servicos = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [nextSlide, setNextSlide] = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);

  const DURATION = 10000;
  const TRANSITION_DURATION = 1500;

  const slides = profissionaisData.map(prof => ({
    nome: prof.nome,
    especialidade: prof.especialidade,
    experiencia: prof.experiencia,
    imagem: prof.imagem,
    bio: prof.bio,
    totalServicos: prof.secaoServicos.reduce((acc, s) => acc + s.servicos.length, 0),
    categorias: prof.secaoServicos.map(s => s.categoria),
    destaques: prof.secaoServicos.flatMap(s => s.servicos.map(sv => sv.titulo)).slice(0, 6),
  }));

  // Progress bar
  useEffect(() => {
    if (transitioning) return;
    setProgress(0);
    const start = Date.now();
    const frame = () => {
      const p = Math.min((Date.now() - start) / DURATION, 1);
      setProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [currentSlide, transitioning]);

  // Auto advance with crossfade
  useEffect(() => {
    const timer = setInterval(() => {
      const next = (currentSlide + 1) % slides.length;
      setNextSlide(next);
      setTransitioning(true);

      setTimeout(() => {
        setCurrentSlide(next);
        setNextSlide(null);
        setTransitioning(false);
      }, TRANSITION_DURATION);
    }, DURATION);
    return () => clearInterval(timer);
  }, [currentSlide, slides.length]);

  const current = slides[currentSlide];
  const upcoming = nextSlide !== null ? slides[nextSlide] : null;

  return (
    <div className="h-screen w-screen overflow-hidden relative" style={{ background: 'linear-gradient(160deg, hsl(351 86% 14%), hsl(351 70% 20%), hsl(351 86% 16%))' }}>

      {/* ── Current slide ── */}
      <div
        className="absolute inset-0 flex"
        style={{
          opacity: transitioning ? 0 : 1,
          transition: `opacity ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        }}
      >
        <SlideContent slide={current} progress={progress} visible={!transitioning} />
      </div>

      {/* ── Next slide (crossfade in) ── */}
      {upcoming && (
        <div
          className="absolute inset-0 flex"
          style={{
            opacity: transitioning ? 1 : 0,
            transition: `opacity ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          }}
        >
          <SlideContent slide={upcoming} progress={0} visible={transitioning} />
        </div>
      )}

      {/* ── Top bar (always visible) ── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-12 pt-8">
        <img src={auraLogo} alt="Aura Clinic" className="h-8 opacity-70" style={{ filter: 'brightness(10)' }} />
        <div className="flex items-center gap-1.5">
          {slides.map((_, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-full"
              style={{
                width: i === currentSlide ? 36 : 6,
                height: 3,
                background: 'rgba(255, 255, 255, 0.15)',
                transition: 'width 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              {i === currentSlide && (
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'rgba(255, 255, 255, 0.5)',
                    transform: `scaleX(${progress})`,
                    transformOrigin: 'left',
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom ── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-12 pb-6">
        <p className="text-[9px] text-white/20 tracking-[0.3em] uppercase font-medium">
          Aura Clinic · Tangará da Serra
        </p>
      </div>
    </div>
  );
};

/* ── Slide content component ── */
const SlideContent = ({
  slide,
  progress,
  visible,
}: {
  slide: {
    nome: string;
    especialidade: string;
    experiencia: string;
    imagem: string;
    bio: string;
    totalServicos: number;
    categorias: string[];
    destaques: string[];
  };
  progress: number;
  visible: boolean;
}) => {
  // Ken Burns: slow zoom from 1.0 → 1.08 over the slide duration
  const kenBurnsScale = 1 + progress * 0.08;

  return (
    <>
      {/* Left info */}
      <div className="w-[50%] h-full flex flex-col justify-center px-14">
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.2s',
          }}
        >
          <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-[#CCB8A6] mb-5">
            {slide.especialidade}
          </p>

          <h1
            className="text-[clamp(3rem,5vw,4.5rem)] font-bold text-white leading-[0.9] tracking-[-0.03em] mb-4"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            {slide.nome}
          </h1>

          <p className="text-[11px] text-white/40 font-medium tracking-[0.15em] uppercase mb-8">
            {slide.experiencia} · {slide.totalServicos} procedimentos
          </p>

          <p
            className="text-[13.5px] text-white/60 leading-[1.8] mb-10 max-w-[420px]"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(16px)',
              transition: 'all 1s cubic-bezier(0.22, 1, 0.36, 1) 0.5s',
            }}
          >
            {slide.bio}
          </p>

          <div className="w-8 h-[1px] bg-[#58101b]/10 mb-7" />

          <p className="text-[9px] font-semibold tracking-[0.3em] uppercase text-[#58101b]/25 mb-4">
            Principais serviços
          </p>

          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            {slide.destaques.map((titulo, i) => (
              <div
                key={i}
                className="flex items-center gap-3"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateX(0)' : 'translateX(-16px)',
                  transition: `all 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${600 + i * 100}ms`,
                }}
              >
                <div className="w-1 h-1 rounded-full bg-[#CCB8A6]" />
                <p className="text-[11.5px] text-[#444] font-medium">{titulo}</p>
              </div>
            ))}
          </div>

          <div
            className="flex flex-wrap gap-2 mt-8"
            style={{
              opacity: visible ? 1 : 0,
              transition: 'opacity 1s ease 1s',
            }}
          >
            {slide.categorias.map((cat, i) => (
              <span
                key={i}
                className="text-[8px] tracking-[0.15em] uppercase text-[#58101b]/20 font-medium px-3 py-1 rounded-full border border-[#58101b]/[0.06]"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right photo with Ken Burns */}
      <div className="w-[50%] h-full p-5">
        <div
          className="w-full h-full rounded-[32px] overflow-hidden"
          style={{
            opacity: visible ? 1 : 0,
            transition: `opacity 1.4s cubic-bezier(0.4, 0, 0.2, 1) 0.1s`,
          }}
        >
          <img
            src={slide.imagem}
            alt={slide.nome}
            className="w-full h-full object-cover"
            style={{
              transform: `scale(${kenBurnsScale})`,
              transition: 'none',
            }}
          />
        </div>
      </div>
    </>
  );
};

export default Servicos;
