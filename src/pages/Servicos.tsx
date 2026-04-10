import { useState, useEffect } from 'react';
import { profissionaisData } from '@/data/profissionais';
import auraLogo from '@/assets/aura-logo.png';

const Servicos = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [show, setShow] = useState(true);
  const [progress, setProgress] = useState(0);

  const DURATION = 10000; // 10 seconds per slide

  const slides = profissionaisData.map(prof => ({
    nome: prof.nome,
    especialidade: prof.especialidade,
    experiencia: prof.experiencia,
    imagem: prof.imagem,
    bio: prof.bio,
    descricao: prof.descricao,
    totalServicos: prof.secaoServicos.reduce((acc, s) => acc + s.servicos.length, 0),
    categorias: prof.secaoServicos.map(s => s.categoria),
    destaques: prof.secaoServicos.flatMap(s => s.servicos.map(sv => sv.titulo)).slice(0, 6),
  }));

  // Progress animation
  useEffect(() => {
    setProgress(0);
    const start = Date.now();
    const frame = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / DURATION, 1);
      setProgress(p);
      if (p < 1) requestAnimationFrame(frame);
    };
    const raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [currentSlide]);

  // Auto advance
  useEffect(() => {
    const timer = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setCurrentSlide(prev => (prev + 1) % slides.length);
        setShow(true);
      }, 800);
    }, DURATION);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[currentSlide];

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#FDFCFA] relative flex">

      {/* Left content */}
      <div className="w-[52%] h-full flex flex-col">
        
        {/* Top bar */}
        <div className="flex items-center justify-between px-12 pt-10 pb-6">
          <img src={auraLogo} alt="Aura Clinic" className="h-9" />
          <div className="flex items-center gap-2">
            {slides.map((_, i) => (
              <div key={i} className="relative h-[3px] rounded-full overflow-hidden bg-[#58101b]/[0.08]"
                style={{ width: i === currentSlide ? '40px' : '6px', transition: 'width 0.6s cubic-bezier(0.22, 1, 0.36, 1)' }}>
                {i === currentSlide && (
                  <div className="absolute inset-0 rounded-full bg-[#58101b]/50 origin-left"
                    style={{ transform: `scaleX(${progress})`, transition: 'none' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center px-12">
          <div style={{
            opacity: show ? 1 : 0,
            transform: show ? 'translateY(0)' : 'translateY(24px)',
            transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
          }}>
            {/* Specialty tag */}
            <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-[#CCB8A6] mb-4">
              {slide.especialidade}
            </p>

            {/* Name */}
            <h1
              className="text-[clamp(2.8rem,5.5vw,5rem)] font-bold text-[#58101b] leading-[0.92] tracking-[-0.03em] mb-3"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {slide.nome}
            </h1>

            {/* Experience */}
            <p className="text-[11px] text-[#58101b]/35 font-medium tracking-[0.12em] uppercase mb-6">
              {slide.experiencia} · {slide.totalServicos} procedimentos
            </p>

            {/* Bio */}
            <p className="text-[13px] text-[#4a4a4a] leading-[1.7] mb-8 max-w-[440px]" style={{
              opacity: show ? 1 : 0,
              transform: show ? 'translateY(0)' : 'translateY(12px)',
              transition: 'all 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.15s',
            }}>
              {slide.bio}
            </p>

            {/* Divider */}
            <div className="w-10 h-[1.5px] bg-[#58101b]/15 mb-6" />

            {/* Services */}
            <p className="text-[9px] font-semibold tracking-[0.25em] uppercase text-[#58101b]/30 mb-3">
              Principais serviços
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              {slide.destaques.map((titulo, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5"
                  style={{
                    opacity: show ? 1 : 0,
                    transform: show ? 'translateX(0)' : 'translateX(-12px)',
                    transition: `all 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${250 + i * 80}ms`,
                  }}
                >
                  <div className="w-[3px] h-[3px] rounded-full bg-[#CCB8A6]" />
                  <p className="text-[11px] text-[#3a3a3a] font-medium">{titulo}</p>
                </div>
              ))}
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2 mt-6" style={{
              opacity: show ? 1 : 0,
              transition: 'opacity 0.6s ease 0.5s',
            }}>
              {slide.categorias.map((cat, i) => (
                <span key={i} className="text-[9px] tracking-[0.1em] uppercase text-[#58101b]/25 font-medium px-2.5 py-1 rounded-full border border-[#58101b]/[0.07]">
                  {cat}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="px-12 pb-8">
          <p className="text-[9px] text-[#58101b]/20 tracking-[0.25em] uppercase font-medium">
            Aura Clinic · Tangará da Serra
          </p>
        </div>
      </div>

      {/* Right - Photo */}
      <div className="w-[48%] h-full py-6 pr-6">
        <div
          className="w-full h-full rounded-[40px] overflow-hidden"
          style={{
            opacity: show ? 1 : 0,
            transform: show ? 'scale(1)' : 'scale(0.96)',
            transition: 'all 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.05s',
          }}
        >
          <img
            src={slide.imagem}
            alt={slide.nome}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default Servicos;
