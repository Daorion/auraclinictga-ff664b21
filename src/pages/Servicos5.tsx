import { useEffect, useMemo, useState } from 'react';
import { profissionaisData } from '@/data/profissionais';
import auraLogo from '@/assets/aura-logo.png';

/**
 * Quinta variação — "Mosaico Vertical Paralaxe"
 * - Fundo: 5 colunas verticais com fotos das profissionais deslizando em
 *   direções alternadas (paralaxe contínua, estilo awwwards/Apple).
 * - Profissional ativa: nome em "máscara recortada" sobre tira fotográfica
 *   horizontal que entra com efeito reveal vertical (curtain).
 * - Contador de serviços com count-up animado a cada troca.
 * - Lista de serviços principais aparece com stagger lateral.
 * - Sem ticker de texto, sem 3D-flip, sem wipe diagonal — conceito novo.
 */

const SLIDE_MS = 7500;
const REVEAL_MS = 1100;

const Servicos5 = () => {
  const [idx, setIdx] = useState(0);
  const [reveal, setReveal] = useState(true);

  // SEO noindex
  useEffect(() => {
    const prev = document.title;
    document.title = 'Serviços · Mosaico — Aura Clinic';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => {
      document.title = prev;
      document.head.removeChild(meta);
    };
  }, []);

  // Preload
  useEffect(() => {
    profissionaisData.forEach((p) => {
      const img = new Image();
      img.src = p.imagem;
    });
  }, []);

  // Auto-advance com curtain reveal
  useEffect(() => {
    const t = setTimeout(() => {
      setReveal(false);
      const swap = setTimeout(() => {
        setIdx((i) => (i + 1) % profissionaisData.length);
        setReveal(true);
      }, 600);
      return () => clearTimeout(swap);
    }, SLIDE_MS);
    return () => clearTimeout(t);
  }, [idx]);

  const current = profissionaisData[idx];
  const todosServicos = current.secaoServicos.flatMap((s) => s.servicos);
  const totalServicos = todosServicos.length;

  // Distribui imagens nas 5 colunas (loop)
  const columns = useMemo(() => {
    const imgs = profissionaisData.map((p) => p.imagem);
    return Array.from({ length: 5 }, (_, col) => {
      // cada coluna recebe sequência rotacionada para variar
      const seq = [...imgs.slice(col), ...imgs.slice(0, col), ...imgs];
      return seq;
    });
  }, []);

  const animKey = `m5-${idx}`;

  return (
    <div
      className="h-screen w-screen overflow-hidden relative"
      style={{
        background:
          'radial-gradient(ellipse at 30% 20%, hsl(36 50% 95%), hsl(34 35% 88%) 70%)',
      }}
    >
      <style>{`
        @keyframes auraColUp {
          0%   { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes auraColDown {
          0%   { transform: translateY(-50%); }
          100% { transform: translateY(0); }
        }
        @keyframes auraCurtainOpen {
          0%   { clip-path: inset(50% 0 50% 0); }
          100% { clip-path: inset(0 0 0 0); }
        }
        @keyframes auraMaskSlide {
          0%   { background-position: 200% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes auraSlideLeft {
          0%   { opacity: 0; transform: translateX(-30px); filter: blur(6px); }
          100% { opacity: 1; transform: translateX(0); filter: blur(0); }
        }
        @keyframes auraCountPop {
          0%   { opacity: 0; transform: translateY(20px) scale(0.92); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes auraDotPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.6); opacity: 0.5; }
        }

        .aura-col-up   { animation: auraColUp   38s linear infinite; }
        .aura-col-down { animation: auraColDown 46s linear infinite; }
        .aura-col-up-2 { animation: auraColUp   54s linear infinite; }

        .aura-curtain {
          clip-path: inset(50% 0 50% 0);
          animation: auraCurtainOpen ${REVEAL_MS}ms cubic-bezier(0.77, 0, 0.18, 1) forwards;
        }

        .aura-slide-left {
          opacity: 0;
          animation: auraSlideLeft 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .aura-count-pop {
          opacity: 0;
          animation: auraCountPop 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .aura-dot-pulse {
          animation: auraDotPulse 2s ease-in-out infinite;
        }

        /* Texto recortado mostrando foto */
        .aura-cutout-text {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-weight: 700;
          letter-spacing: -0.04em;
          line-height: 0.85;
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
          background-size: cover;
          background-position: center;
        }
      `}</style>

      {/* === FUNDO: mosaico de 5 colunas paralaxe === */}
      <div className="absolute inset-0 z-0 flex gap-1.5 px-1.5 opacity-[0.55]">
        {columns.map((seq, c) => {
          const animClass =
            c % 3 === 0 ? 'aura-col-up' : c % 3 === 1 ? 'aura-col-down' : 'aura-col-up-2';
          return (
            <div key={c} className="flex-1 h-full overflow-hidden relative">
              <div className={`absolute inset-x-0 top-0 ${animClass} flex flex-col gap-1.5`}>
                {seq.map((src, i) => (
                  <div
                    key={i}
                    className="w-full overflow-hidden"
                    style={{ aspectRatio: '3 / 4' }}
                  >
                    <img
                      src={src}
                      alt=""
                      draggable={false}
                      className="w-full h-full object-cover"
                      style={{ filter: 'grayscale(0.15) contrast(1.02)' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Vinheta creme sobreposta para legibilidade */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, hsl(36 45% 94% / 0.55) 0%, hsl(34 35% 88% / 0.92) 60%, hsl(34 38% 86% / 0.98) 100%)',
        }}
      />

      {/* === CONTEÚDO === */}
      <div className="absolute inset-0 z-20 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-12 pt-8">
          <img src={auraLogo} alt="Aura Clinic" className="h-8" style={{ opacity: 0.95 }} />
          <div className="flex items-center gap-3">
            <span
              className="aura-dot-pulse w-1.5 h-1.5 rounded-full"
              style={{ background: 'hsl(28 55% 42%)' }}
            />
            <p
              className="text-[10px] tracking-[0.4em] uppercase font-semibold"
              style={{ color: 'hsl(351 86% 14% / 0.6)' }}
            >
              Mosaico · Coleção 05
            </p>
          </div>
        </div>

        {/* Centro */}
        <div className="flex-1 flex flex-col justify-center px-14">
          {/* Tira fotográfica horizontal com curtain reveal */}
          {reveal && (
            <div
              key={`band-${animKey}`}
              className="aura-curtain w-full max-w-[78%] mx-auto mb-10 overflow-hidden rounded-sm"
              style={{
                aspectRatio: '16 / 7',
                boxShadow: '0 30px 80px hsl(351 86% 14% / 0.18)',
              }}
            >
              <img
                src={current.imagem}
                alt={current.nome}
                draggable={false}
                className="w-full h-full object-cover"
                style={{ objectPosition: 'center 18%' }}
              />
            </div>
          )}

          {/* Especialidade */}
          <p
            key={`spec-${animKey}`}
            className="aura-slide-left text-center text-[11px] font-semibold tracking-[0.45em] uppercase mb-4"
            style={{ color: 'hsl(28 55% 42%)', animationDelay: '0.15s' }}
          >
            {current.especialidade}
          </p>

          {/* Nome — texto recortado revelando a foto */}
          <h1
            key={`name-${animKey}`}
            className="aura-cutout-text text-center mx-auto"
            style={{
              fontSize: 'clamp(3.5rem, 8vw, 8rem)',
              backgroundImage: `url(${current.imagem})`,
              backgroundPosition: 'center 20%',
              backgroundSize: 'cover',
              animation: `auraMaskSlide 1.4s cubic-bezier(0.22, 1, 0.36, 1) forwards`,
              maxWidth: '90%',
            }}
          >
            {current.nome}
          </h1>

          {/* Linha info: experiência + contador + serviços destaque */}
          <div className="flex items-end justify-center gap-12 mt-10 max-w-[900px] mx-auto">
            {/* Experiência */}
            <div
              key={`exp-${animKey}`}
              className="aura-slide-left text-left"
              style={{ animationDelay: '0.45s' }}
            >
              <p
                className="text-[9px] font-semibold tracking-[0.3em] uppercase mb-1.5"
                style={{ color: 'hsl(351 86% 14% / 0.5)' }}
              >
                Experiência
              </p>
              <p
                className="text-[14px]"
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  color: 'hsl(351 86% 14%)',
                  fontWeight: 600,
                }}
              >
                {current.experiencia}
              </p>
            </div>

            {/* Divisor vertical */}
            <div className="w-px h-14" style={{ background: 'hsl(351 86% 14% / 0.2)' }} />

            {/* Contador de serviços */}
            <div
              key={`count-${animKey}`}
              className="aura-count-pop text-center"
              style={{ animationDelay: '0.3s' }}
            >
              <p
                className="leading-none"
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: '3.5rem',
                  fontWeight: 700,
                  color: 'hsl(351 86% 14%)',
                }}
              >
                {String(totalServicos).padStart(2, '0')}
              </p>
              <p
                className="text-[9px] font-semibold tracking-[0.3em] uppercase mt-1"
                style={{ color: 'hsl(28 55% 42%)' }}
              >
                Serviços
              </p>
            </div>

            <div className="w-px h-14" style={{ background: 'hsl(351 86% 14% / 0.2)' }} />

            {/* Destaque (3 primeiros serviços) */}
            <div className="text-left max-w-[280px]">
              <p
                className="text-[9px] font-semibold tracking-[0.3em] uppercase mb-2"
                style={{ color: 'hsl(351 86% 14% / 0.5)' }}
              >
                Em destaque
              </p>
              <ul className="space-y-1">
                {todosServicos.slice(0, 3).map((s, i) => (
                  <li
                    key={i}
                    className="aura-slide-left flex items-center gap-2"
                    style={{ animationDelay: `${0.55 + i * 0.1}s` }}
                  >
                    <span
                      className="w-1 h-1 rounded-full flex-shrink-0"
                      style={{ background: 'hsl(28 55% 42%)' }}
                    />
                    <span
                      className="text-[12px]"
                      style={{ color: 'hsl(351 30% 22% / 0.9)', fontWeight: 500 }}
                    >
                      {s.titulo}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-12 pb-7">
          <div className="flex items-center gap-3">
            {profissionaisData.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-500"
                style={{
                  width: i === idx ? 32 : 6,
                  height: 4,
                  background:
                    i === idx ? 'hsl(28 55% 42%)' : 'hsl(351 86% 14% / 0.18)',
                }}
              />
            ))}
          </div>
          <p
            className="text-[9px] tracking-[0.3em] uppercase font-medium"
            style={{ color: 'hsl(351 86% 14% / 0.45)' }}
          >
            Aura Clinic · Tangará da Serra
          </p>
        </div>
      </div>
    </div>
  );
};

export default Servicos5;
