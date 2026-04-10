import { useState, useEffect } from 'react';
import { profissionaisData } from '@/data/profissionais';
import auraLogo from '@/assets/aura-logo-new.png';

const Servicos = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [show, setShow] = useState(true);

  const slides = profissionaisData.map(prof => ({
    nome: prof.nome,
    especialidade: prof.especialidade,
    experiencia: prof.experiencia,
    imagem: prof.imagem,
    bio: prof.bio,
    totalServicos: prof.secaoServicos.reduce((acc, s) => acc + s.servicos.length, 0),
    categorias: prof.secaoServicos.map(s => s.categoria),
    destaques: prof.secaoServicos.flatMap(s => s.servicos.map(sv => sv.titulo)).slice(0, 5),
  }));

  useEffect(() => {
    const timer = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setCurrentSlide(prev => (prev + 1) % slides.length);
        setShow(true);
      }, 700);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[currentSlide];

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#FAF9F7] relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-[45%] h-full bg-[#58101b] rounded-l-[60px]" />
      <div className="absolute top-8 left-8 right-8 bottom-8 pointer-events-none z-30">
        <div className="w-full h-full rounded-[32px] border border-[#58101b]/[0.06]" />
      </div>

      {/* Logo */}
      <div className="absolute top-10 left-12 z-20">
        <img src={auraLogo} alt="Aura Clinic" className="h-8 opacity-70" />
      </div>

      {/* Slide counter */}
      <div className="absolute top-10 right-12 z-20 flex items-center gap-3">
        {slides.map((_, i) => (
          <div
            key={i}
            className="h-[3px] rounded-full transition-all duration-500"
            style={{
              width: i === currentSlide ? '32px' : '8px',
              backgroundColor: i === currentSlide ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex h-full">
        {/* Left - Content */}
        <div className="w-[55%] h-full flex flex-col justify-center pl-12 pr-16">
          <div
            style={{
              opacity: show ? 1 : 0,
              transform: show ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            {/* Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#58101b]/[0.06] mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-[#58101b]" />
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#58101b]/70">
                {slide.especialidade}
              </span>
            </div>

            {/* Name */}
            <h1
              className="text-[clamp(3rem,6vw,5.5rem)] font-bold text-[#58101b] leading-[0.95] mb-4 tracking-[-0.03em]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {slide.nome}
            </h1>

            {/* Experience badge */}
            <p className="text-[#58101b]/40 text-xs font-medium tracking-[0.15em] uppercase mb-6">
              {slide.experiencia} · {slide.totalServicos} serviços
            </p>

            {/* Divider */}
            <div className="w-12 h-[2px] bg-[#CCB8A6] mb-6" />

            {/* Services preview */}
            <div className="space-y-2">
              {slide.destaques.map((titulo, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3"
                  style={{
                    opacity: show ? 1 : 0,
                    transform: show ? 'translateX(0)' : 'translateX(-20px)',
                    transition: `all 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${150 + i * 100}ms`,
                  }}
                >
                  <span className="text-[10px] text-[#CCB8A6] font-semibold tabular-nums w-4">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="w-3 h-[1px] bg-[#58101b]/15" />
                  <p className="text-[#2a2a2a] text-[13px] font-medium">{titulo}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right - Photo */}
        <div className="w-[45%] h-full flex items-center justify-center pr-10 py-10">
          <div
            className="relative w-full h-full"
            style={{
              opacity: show ? 1 : 0,
              transform: show ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(15px)',
              transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.1s',
            }}
          >
            <div className="absolute inset-4 rounded-[28px] overflow-hidden shadow-2xl">
              <img
                src={slide.imagem}
                alt={slide.nome}
                className="w-full h-full object-cover"
              />
              {/* Bottom gradient overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-white/90 text-xs font-medium tracking-[0.1em] uppercase">
                  {slide.categorias.join(' · ')}
                </p>
              </div>
            </div>
            {/* Decorative frame offset */}
            <div className="absolute inset-0 rounded-[28px] border border-white/20 translate-x-2 translate-y-2" />
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="absolute bottom-8 left-12 z-20">
        <p className="text-[10px] text-[#58101b]/25 tracking-[0.2em] uppercase font-medium">
          Aura Clinic · Tangará da Serra — MT
        </p>
      </div>
    </div>
  );
};

export default Servicos;
