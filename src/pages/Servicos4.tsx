import { useEffect, useState, useRef } from 'react';
import { profissionaisData } from '@/data/profissionais';
import auraLogo from '@/assets/aura-logo.png';

/**
 * Quarta variação — "Galeria Bento Magazine"
 * - Layout estático tipo bento grid (sem trocar de "slide").
 * - Tile principal grande com foto da profissional em foco; ao trocar, faz
 *   crossfade + leve "card flip" 3D.
 * - Tiles secundários: serviços em destaque (com hover lift), citação editorial,
 *   contagem de procedimentos animada, mosaico de mini-fotos das outras profissionais
 *   clicáveis para focar instantaneamente.
 * - Barra inferior com ticker horizontal único e discreto.
 */

const AUTO_MS = 8000;

const Servicos4 = () => {
  const [focusIdx, setFocusIdx] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const timerRef = useRef<number | null>(null);

  // SEO noindex
  useEffect(() => {
    const prev = document.title;
    document.title = 'Serviços · Galeria — Aura Clinic';
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

  const goTo = (i: number) => {
    if (i === focusIdx) return;
    setFlipping(true);
    setTimeout(() => {
      setFocusIdx(i);
      setFlipping(false);
    }, 450);
  };

  // Auto rotation
  useEffect(() => {
    timerRef.current = window.setTimeout(() => {
      goTo((focusIdx + 1) % profissionaisData.length);
    }, AUTO_MS);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [focusIdx]);

  const focus = profissionaisData[focusIdx];
  const destaques = focus.secaoServicos.flatMap((s) =>
    s.servicos.map((sv) => ({ titulo: sv.titulo, categoria: s.categoria }))
  );
  const totalProc = destaques.length;
  const tickerItems = profissionaisData.flatMap((p) =>
    p.secaoServicos.flatMap((s) => s.servicos.map((sv) => sv.titulo))
  );
  const tickerLoop = [...tickerItems, ...tickerItems];

  return (
    <div
      className="h-screen w-screen overflow-hidden relative"
      style={{
        background:
          'linear-gradient(160deg, hsl(36 40% 94%), hsl(34 35% 90%), hsl(32 38% 92%))',
      }}
    >
      <style>{`
        @keyframes auraTileIn {
          0%   { opacity: 0; transform: translateY(14px) scale(0.985); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes auraCount {
          0%   { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes auraTickerSlide {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .aura-tile { animation: auraTileIn 0.7s cubic-bezier(0.22,1,0.36,1) both; }
        .aura-count { animation: auraCount 0.6s ease-out both; }
        .aura-ticker { animation: auraTickerSlide 90s linear infinite; }

        /* Card flip container */
        .aura-flip {
          perspective: 1400px;
        }
        .aura-flip-inner {
          transition: transform 0.45s cubic-bezier(0.83, 0, 0.17, 1);
          transform-style: preserve-3d;
        }
        .aura-flip-inner.is-flipping {
          transform: rotateY(90deg);
        }

        .aura-hover-lift {
          transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s ease;
        }
        .aura-hover-lift:hover {
          transform: translateY(-3px);
          box-shadow: 0 16px 40px hsl(351 86% 14% / 0.12);
        }
      `}</style>

      {/* ── Top bar ── */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-10 pt-6">
        <img src={auraLogo} alt="Aura Clinic" className="h-7" style={{ opacity: 0.95 }} />
        <p
          className="text-[10px] tracking-[0.4em] uppercase font-semibold"
          style={{ color: 'hsl(351 86% 14% / 0.55)' }}
        >
          Galeria · Serviços
        </p>
        <p
          className="text-[10px] tracking-[0.3em] uppercase font-medium"
          style={{ color: 'hsl(351 86% 14% / 0.4)' }}
        >
          Aura Clinic · Tangará
        </p>
      </div>

      {/* ── Bento grid ── */}
      <div
        className="absolute inset-0 grid gap-3 px-6 pt-16 pb-12"
        style={{
          gridTemplateColumns: 'repeat(12, 1fr)',
          gridTemplateRows: 'repeat(8, 1fr)',
        }}
      >
        {/* Tile 1: Foto principal (grande) */}
        <div
          className="aura-flip rounded-[28px] overflow-hidden relative"
          style={{
            gridColumn: 'span 5',
            gridRow: 'span 6',
            background: 'hsl(34 35% 88%)',
            boxShadow: '0 20px 60px hsl(351 86% 14% / 0.15)',
          }}
        >
          <div
            className={`aura-flip-inner w-full h-full ${flipping ? 'is-flipping' : ''}`}
          >
            <img
              key={focus.imagem}
              src={focus.imagem}
              alt={focus.nome}
              className="w-full h-full object-cover"
              draggable={false}
            />
            {/* Gradient bottom + nome sobreposto */}
            <div
              className="absolute inset-x-0 bottom-0 p-6"
              style={{
                background:
                  'linear-gradient(to top, hsl(351 86% 14% / 0.85) 0%, transparent 100%)',
              }}
            >
              <p
                className="text-[10px] font-semibold tracking-[0.3em] uppercase mb-2"
                style={{ color: 'hsl(28 55% 65%)' }}
              >
                {focus.especialidade}
              </p>
              <h2
                className="leading-[0.92] tracking-[-0.02em]"
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  color: 'hsl(36 40% 96%)',
                  fontWeight: 600,
                  fontSize: 'clamp(2rem, 3vw, 3rem)',
                }}
              >
                {focus.nome}
              </h2>
              <p
                className="text-[10px] tracking-[0.2em] uppercase font-medium mt-2"
                style={{ color: 'hsl(36 40% 96% / 0.7)' }}
              >
                {focus.experiencia}
              </p>
            </div>
          </div>
        </div>

        {/* Tile 2: Bio editorial */}
        <div
          key={`bio-${focusIdx}`}
          className="aura-tile rounded-[28px] p-7 flex flex-col justify-between"
          style={{
            gridColumn: 'span 4',
            gridRow: 'span 3',
            background: 'hsl(36 45% 96% / 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid hsl(351 86% 14% / 0.08)',
          }}
        >
          <p
            className="text-[10px] font-semibold tracking-[0.3em] uppercase"
            style={{ color: 'hsl(28 55% 42%)' }}
          >
            Sobre
          </p>
          <p
            className="text-[13px] leading-[1.65] my-3 line-clamp-5"
            style={{ color: 'hsl(351 30% 22% / 0.85)' }}
          >
            {focus.bio}
          </p>
          <div
            className="w-8 h-[1px]"
            style={{ background: 'hsl(351 86% 14% / 0.25)' }}
          />
        </div>

        {/* Tile 3: Total procedimentos (grande número) */}
        <div
          key={`count-${focusIdx}`}
          className="aura-count rounded-[28px] p-6 flex flex-col justify-center items-center text-center"
          style={{
            gridColumn: 'span 3',
            gridRow: 'span 3',
            background:
              'linear-gradient(135deg, hsl(351 86% 14%), hsl(351 70% 22%))',
            color: 'hsl(36 45% 96%)',
            boxShadow: '0 12px 30px hsl(351 86% 14% / 0.25)',
          }}
        >
          <p
            className="text-[9px] font-semibold tracking-[0.3em] uppercase mb-3"
            style={{ color: 'hsl(28 55% 75%)' }}
          >
            Procedimentos
          </p>
          <p
            className="leading-none tracking-[-0.04em]"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontWeight: 700,
              fontSize: 'clamp(4rem, 6vw, 6rem)',
            }}
          >
            {totalProc}
          </p>
          <p
            className="text-[10px] tracking-[0.25em] uppercase font-medium mt-3"
            style={{ color: 'hsl(36 45% 96% / 0.7)' }}
          >
            Disponíveis
          </p>
        </div>

        {/* Tile 4: Categorias / Serviços em destaque */}
        <div
          key={`serv-${focusIdx}`}
          className="aura-tile rounded-[28px] p-7 overflow-hidden"
          style={{
            gridColumn: 'span 7',
            gridRow: 'span 3',
            background: 'hsl(36 45% 96% / 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid hsl(351 86% 14% / 0.08)',
            animationDelay: '0.1s',
          }}
        >
          <p
            className="text-[10px] font-semibold tracking-[0.3em] uppercase mb-4"
            style={{ color: 'hsl(28 55% 42%)' }}
          >
            Serviços em destaque
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {destaques.slice(0, 9).map((d, i) => (
              <div
                key={i}
                className="aura-hover-lift rounded-xl px-3.5 py-2.5"
                style={{
                  background: 'hsl(36 40% 92%)',
                  border: '1px solid hsl(351 86% 14% / 0.06)',
                }}
              >
                <p
                  className="text-[7px] font-semibold tracking-[0.2em] uppercase mb-1"
                  style={{ color: 'hsl(28 55% 42% / 0.85)' }}
                >
                  {d.categoria}
                </p>
                <p
                  className="text-[12px] leading-[1.25]"
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    color: 'hsl(351 86% 14%)',
                    fontWeight: 600,
                  }}
                >
                  {d.titulo}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Tile 5: Citação editorial */}
        <div
          className="aura-tile rounded-[28px] p-6 flex flex-col justify-center"
          style={{
            gridColumn: 'span 5',
            gridRow: 'span 2',
            background: 'hsl(36 45% 94% / 0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px dashed hsl(351 86% 14% / 0.18)',
            animationDelay: '0.15s',
          }}
        >
          <p
            className="text-[10px] font-semibold tracking-[0.3em] uppercase mb-3"
            style={{ color: 'hsl(28 55% 42%)' }}
          >
            Aura Clinic
          </p>
          <p
            className="leading-[1.15] tracking-[-0.01em]"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              color: 'hsl(351 86% 14%)',
              fontWeight: 500,
              fontSize: 'clamp(1.1rem, 1.6vw, 1.6rem)',
              fontStyle: 'italic',
            }}
          >
            "Beleza autêntica nasce do cuidado feito com presença."
          </p>
        </div>

        {/* Tile 6: Mosaico de equipe (clicável) */}
        <div
          className="aura-tile rounded-[28px] p-5 flex flex-col"
          style={{
            gridColumn: 'span 7',
            gridRow: 'span 2',
            background: 'hsl(36 45% 96% / 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid hsl(351 86% 14% / 0.08)',
            animationDelay: '0.2s',
          }}
        >
          <p
            className="text-[10px] font-semibold tracking-[0.3em] uppercase mb-3"
            style={{ color: 'hsl(28 55% 42%)' }}
          >
            Equipe
          </p>
          <div className="flex-1 flex items-center gap-2.5 overflow-x-auto">
            {profissionaisData.map((p, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="flex-shrink-0 flex items-center gap-2.5 rounded-2xl pl-1.5 pr-4 py-1.5 transition-all"
                style={{
                  background:
                    i === focusIdx ? 'hsl(351 86% 14%)' : 'hsl(36 40% 92%)',
                  color:
                    i === focusIdx
                      ? 'hsl(36 45% 96%)'
                      : 'hsl(351 86% 14% / 0.85)',
                  border:
                    i === focusIdx
                      ? '1px solid hsl(351 86% 14%)'
                      : '1px solid hsl(351 86% 14% / 0.08)',
                }}
              >
                <div
                  className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0"
                  style={{
                    border:
                      i === focusIdx
                        ? '2px solid hsl(28 55% 65%)'
                        : '1px solid hsl(351 86% 14% / 0.1)',
                  }}
                >
                  <img
                    src={p.imagem}
                    alt={p.nome}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left">
                  <p
                    className="text-[11px] leading-tight whitespace-nowrap"
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontWeight: 600,
                    }}
                  >
                    {p.nome.split(' ').slice(0, 2).join(' ')}
                  </p>
                  <p
                    className="text-[8px] tracking-[0.2em] uppercase font-medium opacity-70 whitespace-nowrap"
                  >
                    {p.especialidade}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Ticker inferior (faixa única) ── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-9 overflow-hidden flex items-center"
        style={{
          background: 'hsl(351 86% 14%)',
          color: 'hsl(36 45% 96%)',
        }}
      >
        <div className="aura-ticker flex gap-10 whitespace-nowrap" style={{ width: '200%' }}>
          {tickerLoop.map((t, i) => (
            <span
              key={i}
              className="text-[10px] tracking-[0.3em] uppercase font-medium flex items-center gap-10"
            >
              {t}
              <span style={{ color: 'hsl(28 55% 65%)' }}>◆</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Servicos4;
