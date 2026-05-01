import { useState, useEffect, useRef } from 'react';
import { profissionaisData } from '@/data/profissionais';
import auraLogo from '@/assets/aura-logo.png';

const useNoIndex = (title: string) => {
  useEffect(() => {
    const prev = document.title;
    document.title = title;
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => {
      document.title = prev;
      document.head.removeChild(meta);
    };
  }, [title]);
};

const DURATION = 10000;          // tempo total de cada slide (ms)
const TRANSITION_DURATION = 1800; // crossfade (ms)

const Servicos = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [nextSlide, setNextSlide] = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);
  const slideStartRef = useRef<number>(Date.now());

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

  // Preload all images once to avoid pop-in during crossfade
  useEffect(() => {
    slides.forEach(s => {
      const img = new Image();
      img.src = s.imagem;
    });
  }, []);

  // Single RAF loop drives both progress bar and Ken Burns (continuous, no jump)
  useEffect(() => {
    slideStartRef.current = Date.now();
    setProgress(0);
    const frame = () => {
      const p = Math.min((Date.now() - slideStartRef.current) / DURATION, 1);
      setProgress(p);
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [currentSlide]);

  // Auto advance with crossfade
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = (currentSlide + 1) % slides.length;
      setNextSlide(next);
      // start crossfade on next frame so the incoming layer mounts at opacity 0
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setTransitioning(true));
      });

      const swap = setTimeout(() => {
        setCurrentSlide(next);
        setNextSlide(null);
        setTransitioning(false);
      }, TRANSITION_DURATION);

      return () => clearTimeout(swap);
    }, DURATION);
    return () => clearTimeout(timer);
  }, [currentSlide, slides.length]);

  const current = slides[currentSlide];
  const upcoming = nextSlide !== null ? slides[nextSlide] : null;

  return (
    <div
      className="h-screen w-screen overflow-hidden relative"
      style={{ background: 'linear-gradient(160deg, hsl(36 40% 94%), hsl(34 35% 90%), hsl(32 38% 92%))' }}
    >
      {/* ── Current slide ── */}
      <div
        className="absolute inset-0 flex"
        style={{
          opacity: transitioning ? 0 : 1,
          transition: `opacity ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          willChange: 'opacity',
        }}
      >
        <SlideContent slide={current} progress={progress} entering={!transitioning} />
      </div>

      {/* ── Next slide (crossfade in) ── */}
      {upcoming && (
        <div
          className="absolute inset-0 flex"
          style={{
            opacity: transitioning ? 1 : 0,
            transition: `opacity ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            willChange: 'opacity',
          }}
        >
          {/* incoming slide: text starts visible (entering=true), Ken Burns from 0 */}
          <SlideContent slide={upcoming} progress={0} entering={true} />
        </div>
      )}

      {/* ── Top bar (always visible) ── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-12 pt-8">
        <img src={auraLogo} alt="Aura Clinic" className="h-8" style={{ opacity: 0.95 }} />
        <div className="flex items-center gap-1.5">
          {slides.map((_, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-full"
              style={{
                width: i === currentSlide ? 36 : 6,
                height: 3,
                background: 'hsl(351 86% 14% / 0.15)',
                transition: 'width 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              {i === currentSlide && (
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'hsl(351 86% 14% / 0.6)',
                    transform: `scaleX(${progress})`,
                    transformOrigin: 'left',
                    willChange: 'transform',
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom ── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-12 pb-6">
        <p className="text-[9px] tracking-[0.3em] uppercase font-medium" style={{ color: 'hsl(351 86% 14% / 0.35)' }}>
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
  entering,
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
  entering: boolean;
}) => {
  // Ken Burns: smooth zoom from 1.02 → 1.10 over the slide duration
  const kenBurnsScale = 1.02 + progress * 0.08;

  return (
    <>
      {/* Left info */}
      <div className="w-[50%] h-full flex flex-col justify-center px-14">
        <div
          style={{
            opacity: entering ? 1 : 0,
            transform: entering ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.2s, transform 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.2s',
          }}
        >
          <p className="text-[10px] font-semibold tracking-[0.3em] uppercase mb-5" style={{ color: 'hsl(28 55% 42%)' }}>
            {slide.especialidade}
          </p>

          <h1
            className="text-[clamp(3rem,5vw,4.5rem)] font-bold leading-[0.9] tracking-[-0.03em] mb-4"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'hsl(351 86% 14%)' }}
          >
            {slide.nome}
          </h1>

          <p className="text-[11px] font-medium tracking-[0.15em] uppercase mb-8" style={{ color: 'hsl(351 86% 14% / 0.45)' }}>
            {slide.experiencia} · {slide.totalServicos} procedimentos
          </p>

          <p
            className="text-[13.5px] leading-[1.8] mb-10 max-w-[420px]"
            style={{ color: 'hsl(351 30% 22% / 0.78)' }}
          >
            {slide.bio}
          </p>

          <div className="w-8 h-[1px] mb-7" style={{ background: 'hsl(351 86% 14% / 0.2)' }} />

          <p className="text-[9px] font-semibold tracking-[0.3em] uppercase mb-4" style={{ color: 'hsl(351 86% 14% / 0.5)' }}>
            Principais serviços
          </p>

          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            {slide.destaques.map((titulo, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-1 h-1 rounded-full" style={{ background: 'hsl(28 55% 42%)' }} />
                <p className="text-[11.5px] font-medium" style={{ color: 'hsl(351 40% 22% / 0.85)' }}>{titulo}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mt-8">
            {slide.categorias.map((cat, i) => (
              <span
                key={i}
                className="text-[8px] tracking-[0.15em] uppercase font-medium px-3 py-1 rounded-full"
                style={{ color: 'hsl(351 86% 14% / 0.55)', border: '1px solid hsl(351 86% 14% / 0.15)' }}
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right photo with Ken Burns */}
      <div className="w-[50%] h-full p-5">
        <div className="w-full h-full rounded-[32px] overflow-hidden bg-[hsl(34_35%_88%)]">
          <img
            src={slide.imagem}
            alt={slide.nome}
            className="w-full h-full object-cover"
            style={{
              transform: `scale(${kenBurnsScale})`,
              transformOrigin: 'center center',
              willChange: 'transform',
            }}
            draggable={false}
          />
        </div>
      </div>
    </>
  );
};

export default Servicos;
