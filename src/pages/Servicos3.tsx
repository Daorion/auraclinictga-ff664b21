import { useEffect, useState } from 'react';
import { profissionaisData } from '@/data/profissionais';
import auraLogo from '@/assets/aura-logo.png';

/**
 * Terceira variação — "Editorial Cinemático"
 * - Foto da profissional em tela cheia com overlay creme.
 * - Transição entre profissionais via clip-path wipe diagonal.
 * - Nome em tipografia gigante com reveal por palavras (split-text).
 * - Serviços flutuam em "tickers" diagonais opostos no fundo.
 * - Cartão glassmorphism com bio + serviços principais.
 */

const SLIDE_MS = 9000;
const WIPE_MS = 1400;

const Servicos3 = () => {
  const [idx, setIdx] = useState(0);
  const [wiping, setWiping] = useState(false);

  // SEO noindex
  useEffect(() => {
    const prev = document.title;
    document.title = 'Serviços · Cinema — Aura Clinic';
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

  // Auto advance com wipe
  useEffect(() => {
    const t = setTimeout(() => {
      setWiping(true);
      const swap = setTimeout(() => {
        setIdx((i) => (i + 1) % profissionaisData.length);
        setWiping(false);
      }, WIPE_MS);
      return () => clearTimeout(swap);
    }, SLIDE_MS);
    return () => clearTimeout(t);
  }, [idx]);

  const current = profissionaisData[idx];
  const next = profissionaisData[(idx + 1) % profissionaisData.length];
  const todosTitulos = current.secaoServicos.flatMap((s) =>
    s.servicos.map((sv) => sv.titulo)
  );
  const tickerA = [...todosTitulos, ...todosTitulos];
  const tickerB = [...todosTitulos.slice().reverse(), ...todosTitulos];

  // key para reanimar reveal a cada slide
  const animKey = `slide-${idx}`;

  return (
    <div
      className="h-screen w-screen overflow-hidden relative"
      style={{
        background:
          'linear-gradient(160deg, hsl(36 40% 94%), hsl(34 35% 90%), hsl(32 38% 92%))',
      }}
    >
      <style>{`
        @keyframes auraWordRise {
          0%   { opacity: 0; transform: translateY(40px) rotate(2deg); filter: blur(8px); }
          100% { opacity: 1; transform: translateY(0)   rotate(0);     filter: blur(0); }
        }
        @keyframes auraFadeUp {
          0%   { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes auraTickerLeft {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes auraTickerRight {
          0%   { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        @keyframes auraKenBurns {
          0%   { transform: scale(1.04) translate(0, 0); }
          100% { transform: scale(1.14) translate(-1.2%, -1%); }
        }
        .aura-word {
          display: inline-block;
          opacity: 0;
          animation: auraWordRise 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .aura-fade-up {
          opacity: 0;
          animation: auraFadeUp 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .aura-ticker-left  { animation: auraTickerLeft  60s linear infinite; }
        .aura-ticker-right { animation: auraTickerRight 75s linear infinite; }
        .aura-kenburns     { animation: auraKenBurns ${SLIDE_MS + WIPE_MS}ms linear forwards; }

        /* Wipe diagonal */
        .aura-wipe-out {
          clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
          transition: clip-path ${WIPE_MS}ms cubic-bezier(0.83, 0, 0.17, 1);
        }
        .aura-wipe-out.is-wiping {
          clip-path: polygon(100% 0, 100% 0, 100% 100%, 100% 100%);
        }
        .aura-wipe-in {
          clip-path: polygon(0 0, 0 0, 0 100%, 0 100%);
          transition: clip-path ${WIPE_MS}ms cubic-bezier(0.83, 0, 0.17, 1);
        }
        .aura-wipe-in.is-wiping {
          clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
        }
      `}</style>

      {/* Camada de imagem em tela cheia (atual) */}
      <div className={`absolute inset-0 aura-wipe-out ${wiping ? 'is-wiping' : ''}`}>
        <PhotoLayer prof={current} animKey={animKey} />
      </div>

      {/* Camada de imagem em tela cheia (próxima) — entra via wipe */}
      <div className={`absolute inset-0 aura-wipe-in ${wiping ? 'is-wiping' : ''}`}>
        <PhotoLayer prof={next} animKey={`next-${animKey}`} />
      </div>

      {/* Conteúdo principal */}
      <div className="absolute inset-0 z-20 flex flex-col">
        {/* Top */}
        <div className="flex items-center justify-between px-12 pt-8">
          <img src={auraLogo} alt="Aura Clinic" className="h-8" style={{ opacity: 0.95 }} />
          <p
            className="text-[10px] tracking-[0.35em] uppercase font-semibold"
            style={{ color: 'hsl(351 86% 14% / 0.55)' }}
          >
            Coleção · Serviços
          </p>
        </div>

        {/* Centro: nome cinemático */}
        <div className="flex-1 flex flex-col justify-center px-14">
          <p
            key={`spec-${animKey}`}
            className="aura-fade-up text-[11px] font-semibold tracking-[0.4em] uppercase mb-6"
            style={{ color: 'hsl(28 55% 42%)', animationDelay: '0.1s' }}
          >
            {current.especialidade} — {current.experiencia}
          </p>

          <h1
            key={`name-${animKey}`}
            className="leading-[0.85] tracking-[-0.04em] mb-8 max-w-[90%]"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              color: 'hsl(351 86% 14%)',
              fontWeight: 700,
              fontSize: 'clamp(4rem, 9vw, 9rem)',
            }}
          >
            {current.nome.split(' ').map((word, i) => (
              <span
                key={i}
                className="aura-word"
                style={{
                  marginRight: '0.25em',
                  animationDelay: `${0.25 + i * 0.12}s`,
                }}
              >
                {word}
              </span>
            ))}
          </h1>

          {/* Cartão glassmorphism com bio + serviços */}
          <div
            key={`card-${animKey}`}
            className="aura-fade-up max-w-[640px] rounded-3xl p-7"
            style={{
              animationDelay: '0.7s',
              background: 'hsl(36 45% 96% / 0.72)',
              backdropFilter: 'blur(14px)',
              border: '1px solid hsl(351 86% 14% / 0.10)',
              boxShadow: '0 12px 40px hsl(351 86% 14% / 0.08)',
            }}
          >
            <p
              className="text-[13px] leading-[1.7] mb-5"
              style={{ color: 'hsl(351 30% 22% / 0.85)' }}
            >
              {current.bio}
            </p>

            <div
              className="w-8 h-[1px] mb-5"
              style={{ background: 'hsl(351 86% 14% / 0.25)' }}
            />

            <p
              className="text-[9px] font-semibold tracking-[0.3em] uppercase mb-3"
              style={{ color: 'hsl(351 86% 14% / 0.55)' }}
            >
              Em destaque
            </p>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {todosTitulos.slice(0, 6).map((t, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div
                    className="w-1 h-1 rounded-full"
                    style={{ background: 'hsl(28 55% 42%)' }}
                  />
                  <p
                    className="text-[11.5px] font-medium"
                    style={{ color: 'hsl(351 40% 22% / 0.85)' }}
                  >
                    {t}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
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
            style={{ color: 'hsl(351 86% 14% / 0.4)' }}
          >
            Aura Clinic · Tangará da Serra
          </p>
        </div>
      </div>
    </div>
  );
};

const PhotoLayer = ({
  prof,
  animKey,
}: {
  prof: (typeof profissionaisData)[number];
  animKey: string;
}) => (
  <div className="absolute inset-0 overflow-hidden">
    {/* Foto à direita, ocupando ~55% */}
    <div
      key={animKey}
      className="absolute right-0 top-0 h-full overflow-hidden"
      style={{ width: '55%' }}
    >
      <img
        src={prof.imagem}
        alt={prof.nome}
        className="w-full h-full object-cover aura-kenburns"
        draggable={false}
        style={{ transformOrigin: 'center center' }}
      />
      {/* Fade da imagem para o creme */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to right, hsl(34 35% 90%) 0%, hsl(34 35% 90% / 0.4) 30%, transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, hsl(32 38% 92% / 0.7) 0%, transparent 40%)',
        }}
      />
    </div>
  </div>
);

export default Servicos3;
