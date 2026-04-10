import { useState, useEffect } from 'react';
import { profissionaisData } from '@/data/profissionais';
import auraLogo from '@/assets/aura-logo-new.png';

interface Slide {
  profissionalNome: string;
  profissionalEspecialidade: string;
  profissionalImagem: string;
  profissionalExperiencia: string;
  categoria: string;
  servicos: string[];
}

const Servicos = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [show, setShow] = useState(true);

  const slides: Slide[] = profissionaisData.flatMap(prof =>
    prof.secaoServicos.map(secao => ({
      profissionalNome: prof.nome,
      profissionalEspecialidade: prof.especialidade,
      profissionalImagem: prof.imagem,
      profissionalExperiencia: prof.experiencia,
      categoria: secao.categoria,
      servicos: secao.servicos.slice(0, 6).map(s => s.titulo),
    }))
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setCurrentSlide(prev => (prev + 1) % slides.length);
        setShow(true);
      }, 600);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[currentSlide];

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#FAFAF8] flex flex-col" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Top bar with logo */}
      <div className="flex items-center justify-between px-10 py-5 flex-shrink-0">
        <img src={auraLogo} alt="Aura Clinic" className="h-10 opacity-80" />
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#58101b] animate-pulse" />
          <span className="text-[11px] tracking-[0.25em] uppercase text-[#58101b]/40 font-medium">
            Tangará da Serra — MT
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex px-10 pb-8 gap-8 min-h-0">
        {/* Left side - Info */}
        <div 
          className="w-[50%] flex flex-col justify-center pr-4"
          style={{
            opacity: show ? 1 : 0,
            transform: show ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {/* Professional */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-[#58101b]/10">
              <img src={slide.profissionalImagem} alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-[#58101b] font-semibold text-base tracking-tight">{slide.profissionalNome}</p>
              <p className="text-[#58101b]/40 text-[10px] tracking-[0.15em] uppercase font-medium">{slide.profissionalExperiencia}</p>
            </div>
          </div>

          {/* Category */}
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-[#CCB8A6] mb-2">
            {slide.profissionalEspecialidade}
          </p>
          <h1 
            className="text-[clamp(2rem,4.5vw,3.5rem)] font-bold text-[#58101b] leading-[1.1] mb-8 tracking-tight"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            {slide.categoria}
          </h1>

          {/* Services */}
          <div className="space-y-2.5">
            {slide.servicos.map((titulo, i) => (
              <div 
                key={i} 
                className="flex items-center gap-3"
                style={{
                  opacity: show ? 1 : 0,
                  transform: show ? 'translateX(0)' : 'translateX(-15px)',
                  transition: `all 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${i * 80}ms`,
                }}
              >
                <div className="w-6 h-[1px] bg-[#58101b]/20 flex-shrink-0" />
                <p className="text-[#2a2a2a] text-sm font-medium tracking-tight">{titulo}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right side - Photo */}
        <div className="w-[50%] flex items-center justify-center">
          <div 
            className="w-full h-full rounded-3xl overflow-hidden"
            style={{
              opacity: show ? 1 : 0,
              transform: show ? 'scale(1)' : 'scale(0.95)',
              transition: 'all 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <img
              src={slide.profissionalImagem}
              alt={slide.profissionalNome}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Bottom progress */}
      <div className="px-10 pb-6 flex items-center gap-4 flex-shrink-0">
        <div className="flex-1 h-[2px] bg-[#58101b]/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#58101b]/30 rounded-full"
            style={{
              width: `${((currentSlide + 1) / slides.length) * 100}%`,
              transition: 'width 0.6s ease',
            }}
          />
        </div>
        <span className="text-[10px] text-[#58101b]/30 tracking-[0.15em] font-medium tabular-nums">
          {String(currentSlide + 1).padStart(2, '0')}/{String(slides.length).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
};

export default Servicos;
