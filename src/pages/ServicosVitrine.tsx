import { useEffect, useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { profissionaisData } from '@/data/profissionais';
import auraLogo from '@/assets/aura-logo.png';

/**
 * Segunda página de serviços (TV / vitrine) — animação totalmente diferente:
 * - Mosaico vertical de cards rolando em colunas com velocidades distintas (marquee infinito).
 * - Painel lateral com a profissional "em foco", trocando suavemente.
 * - Mesma paleta cream + marsala + acento dourado/terracota.
 */

const FOCUS_INTERVAL = 7000; // troca da profissional em foco

const ServicosVitrine = () => {
  const [focusIdx, setFocusIdx] = useState(0);
  const [fade, setFade] = useState(true);

  // Lista plana de todos os serviços (com referência à profissional)
  const todosServicos = profissionaisData.flatMap((prof) =>
    prof.secaoServicos.flatMap((sec) =>
      sec.servicos.map((sv) => ({
        titulo: sv.titulo,
        categoria: sec.categoria,
        profissional: prof.nome,
        especialidade: prof.especialidade,
      }))
    )
  );

  // Divide em 3 colunas, duplicando para loop contínuo
  const colunas: typeof todosServicos[] = [[], [], []];
  todosServicos.forEach((s, i) => colunas[i % 3].push(s));
  const colunasDup = colunas.map((c) => [...c, ...c, ...c]);

  // Preload das imagens
  useEffect(() => {
    profissionaisData.forEach((p) => {
      const img = new Image();
      img.src = p.imagem;
    });
  }, []);

  // Rotação da profissional em foco
  useEffect(() => {
    const t = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setFocusIdx((i) => (i + 1) % profissionaisData.length);
        setFade(true);
      }, 600);
    }, FOCUS_INTERVAL);
    return () => clearInterval(t);
  }, []);

  const focus = profissionaisData[focusIdx];

  return (
    <>
      <Helmet>
        <title>Vitrine de Serviços — Aura Clinic</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <style>{`
        @keyframes auraScrollUp {
          0%   { transform: translateY(0); }
          100% { transform: translateY(-33.333%); }
        }
        @keyframes auraScrollDown {
          0%   { transform: translateY(-33.333%); }
          100% { transform: translateY(0); }
        }
        .col-up   { animation: auraScrollUp   55s linear infinite; }
        .col-down { animation: auraScrollDown 70s linear infinite; }
        .col-up-fast { animation: auraScrollUp 42s linear infinite; }
      `}</style>

      <div
        className="h-screen w-screen overflow-hidden relative"
        style={{
          background:
            'linear-gradient(160deg, hsl(36 40% 94%), hsl(34 35% 90%), hsl(32 38% 92%))',
        }}
      >
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-12 pt-8">
          <img src={auraLogo} alt="Aura Clinic" className="h-8" style={{ opacity: 0.95 }} />
          <p
            className="text-[10px] tracking-[0.35em] uppercase font-semibold"
            style={{ color: 'hsl(351 86% 14% / 0.5)' }}
          >
            Vitrine · Serviços
          </p>
        </div>

        <div className="h-full w-full flex">
          {/* ─── Painel esquerdo: profissional em foco ─── */}
          <div className="w-[42%] h-full flex flex-col justify-center px-14 relative z-20">
            <div
              style={{
                opacity: fade ? 1 : 0,
                transform: fade ? 'translateX(0)' : 'translateX(-24px)',
                transition: 'opacity 0.6s ease, transform 0.6s ease',
              }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0"
                  style={{ border: '2px solid hsl(28 55% 42% / 0.5)' }}
                >
                  <img
                    src={focus.imagem}
                    alt={focus.nome}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p
                    className="text-[9px] font-semibold tracking-[0.3em] uppercase mb-1"
                    style={{ color: 'hsl(28 55% 42%)' }}
                  >
                    {focus.especialidade}
                  </p>
                  <h2
                    className="text-[2.2rem] leading-[0.95] tracking-[-0.02em]"
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      color: 'hsl(351 86% 14%)',
                      fontWeight: 600,
                    }}
                  >
                    {focus.nome}
                  </h2>
                </div>
              </div>

              <div
                className="w-10 h-[1px] mb-5"
                style={{ background: 'hsl(351 86% 14% / 0.25)' }}
              />

              <p
                className="text-[12.5px] leading-[1.75] mb-6 max-w-[380px]"
                style={{ color: 'hsl(351 30% 22% / 0.78)' }}
              >
                {focus.bio}
              </p>

              <div className="flex flex-wrap gap-2">
                {focus.secaoServicos.map((s, i) => (
                  <span
                    key={i}
                    className="text-[8px] tracking-[0.18em] uppercase font-semibold px-3 py-1.5 rounded-full"
                    style={{
                      color: 'hsl(351 86% 14% / 0.7)',
                      background: 'hsl(36 40% 88%)',
                      border: '1px solid hsl(351 86% 14% / 0.12)',
                    }}
                  >
                    {s.categoria}
                  </span>
                ))}
              </div>
            </div>

            {/* Indicadores */}
            <div className="absolute bottom-12 left-14 flex gap-2">
              {profissionaisData.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-500"
                  style={{
                    width: i === focusIdx ? 28 : 6,
                    height: 4,
                    background:
                      i === focusIdx
                        ? 'hsl(28 55% 42%)'
                        : 'hsl(351 86% 14% / 0.18)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* ─── Painel direito: marquee de serviços em 3 colunas ─── */}
          <div className="w-[58%] h-full relative overflow-hidden">
            {/* Fades superior e inferior */}
            <div
              className="absolute top-0 left-0 right-0 h-32 z-10 pointer-events-none"
              style={{
                background:
                  'linear-gradient(to bottom, hsl(34 35% 90%) 0%, transparent 100%)',
              }}
            />
            <div
              className="absolute bottom-0 left-0 right-0 h-32 z-10 pointer-events-none"
              style={{
                background:
                  'linear-gradient(to top, hsl(32 38% 92%) 0%, transparent 100%)',
              }}
            />

            <div className="h-full w-full grid grid-cols-3 gap-4 px-6 py-4">
              {colunasDup.map((col, idx) => (
                <div key={idx} className="overflow-hidden">
                  <div
                    className={
                      idx === 0 ? 'col-up' : idx === 1 ? 'col-down' : 'col-up-fast'
                    }
                  >
                    {col.map((s, i) => (
                      <ServiceCard key={i} {...s} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-20 px-12 pb-5 flex justify-between items-center">
          <p
            className="text-[9px] tracking-[0.3em] uppercase font-medium"
            style={{ color: 'hsl(351 86% 14% / 0.35)' }}
          >
            Aura Clinic · Tangará da Serra
          </p>
          <p
            className="text-[9px] tracking-[0.3em] uppercase font-medium"
            style={{ color: 'hsl(351 86% 14% / 0.35)' }}
          >
            Agende pelo WhatsApp
          </p>
        </div>
      </div>
    </>
  );
};

const ServiceCard = ({
  titulo,
  categoria,
  profissional,
}: {
  titulo: string;
  categoria: string;
  profissional: string;
}) => (
  <div
    className="mb-4 rounded-2xl px-5 py-4"
    style={{
      background: 'hsl(36 45% 96% / 0.85)',
      border: '1px solid hsl(351 86% 14% / 0.08)',
      backdropFilter: 'blur(6px)',
      boxShadow: '0 1px 2px hsl(351 86% 14% / 0.04)',
    }}
  >
    <p
      className="text-[8px] font-semibold tracking-[0.25em] uppercase mb-2"
      style={{ color: 'hsl(28 55% 42%)' }}
    >
      {categoria}
    </p>
    <p
      className="text-[14px] leading-[1.3] mb-2"
      style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        color: 'hsl(351 86% 14%)',
        fontWeight: 600,
      }}
    >
      {titulo}
    </p>
    <p
      className="text-[9px] tracking-[0.12em] uppercase font-medium"
      style={{ color: 'hsl(351 86% 14% / 0.45)' }}
    >
      com {profissional}
    </p>
  </div>
);

export default ServicosVitrine;
