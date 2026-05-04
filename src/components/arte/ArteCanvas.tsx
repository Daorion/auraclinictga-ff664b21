import { forwardRef, CSSProperties } from 'react';
import { ArteBlock, renderTitle } from '@/lib/arteContent';
import { TemplateId, TemplateMeta, DesignTokens, TemplateVariant, defaultVariantFor } from '@/lib/arteTemplates';
import auraLogo from '@/assets/aura-logo.png';

interface Props {
  template: TemplateMeta;
  tokens: DesignTokens;
  block: ArteBlock;
  photoUrl?: string;
  photoLabel?: string;
  whatsapp?: string;
  instagram?: string;
  variant?: TemplateVariant;
}

const photoObjectPosition = (focus: TemplateVariant['photoFocus']) => {
  switch (focus) {
    case 'face': return 'center 18%';
    case 'wide': return 'center center';
    default: return 'center 30%';
  }
};

const Title = ({ text, style }: { text: string; style?: CSSProperties }) => (
  <h1 style={style}>
    {renderTitle(text).map((p) =>
      p.italic ? (
        <em key={p.key} style={{ fontStyle: 'italic', fontWeight: 500, opacity: 0.95 }}>
          {p.text}
        </em>
      ) : (
        <span key={p.key}>{p.text}</span>
      ),
    )}
  </h1>
);

const shapeClipPath = (style: DesignTokens['shapeStyle']): CSSProperties => {
  switch (style) {
    case 'circle':
      return { borderRadius: '50%' };
    case 'arch':
      return { borderRadius: '50% 50% 8px 8px / 35% 35% 8px 8px' };
    case 'organic':
      return { borderRadius: '32px' };
    default:
      return { borderRadius: '0' };
  }
};

export const ArteCanvas = forwardRef<HTMLDivElement, Props>(
  ({ template, tokens, block, photoUrl, photoLabel, whatsapp, instagram }, ref) => {
    const baseStyle: CSSProperties = {
      width: template.size.w,
      height: template.size.h,
      fontFamily: tokens.bodyFont,
      position: 'relative',
      overflow: 'hidden',
      background: tokens.bg,
      color: tokens.ink,
    };

    const photoShape = shapeClipPath(tokens.shapeStyle);

    // ─────────── EDITORIAL SPLIT ───────────
    if (template.id === 'editorial-split') {
      return (
        <div ref={ref} style={baseStyle}>
          <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            <div style={{ padding: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: tokens.bg }}>
              {photoUrl && (
                <div style={{ width: '100%', aspectRatio: '4/5', overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,.18)', ...photoShape }}>
                  <img src={photoUrl} alt="" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }} />
                </div>
              )}
            </div>
            <div style={{ padding: 60, background: tokens.bgAccent, color: tokens.paper, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 14, letterSpacing: '0.35em', textTransform: 'uppercase', color: tokens.accent, fontWeight: 600 }}>
                  {block.eyebrow}
                </p>
                <Title
                  text={block.title}
                  style={{
                    fontFamily: tokens.displayFont,
                    fontSize: 64,
                    lineHeight: 1.02,
                    letterSpacing: '-0.02em',
                    fontWeight: 700,
                    marginTop: 28,
                    color: tokens.paper,
                  }}
                />
                <p style={{ marginTop: 28, fontSize: 18, lineHeight: 1.55, color: tokens.paperSoft }}>{block.subtitle}</p>
              </div>
              <div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {block.bullets.map((b) => (
                    <li key={b} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 17, color: tokens.paper }}>
                      <span style={{ width: 8, height: 8, background: tokens.accent, borderRadius: 999, flexShrink: 0 }} />
                      {b}
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop: 36, paddingTop: 24, borderTop: `1px solid ${tokens.paperSoft}` }}>
                  <p style={{ fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: tokens.paperSoft }}>{block.cta}</p>
                  {whatsapp && <p style={{ marginTop: 6, fontFamily: tokens.displayFont, fontSize: 26, fontWeight: 700, color: tokens.paper }}>{whatsapp}</p>}
                  {instagram && <p style={{ marginTop: 4, fontSize: 13, color: tokens.paperSoft }}>@{instagram}</p>}
                </div>
              </div>
            </div>
          </div>
          <img src={auraLogo} alt="" style={{ position: 'absolute', top: 36, left: 60, height: 36, opacity: 0.9 }} />
        </div>
      );
    }

    // ─────────── BOLD STATEMENT ───────────
    if (template.id === 'bold-statement') {
      return (
        <div ref={ref} style={{ ...baseStyle, background: tokens.bgAccent, color: tokens.paper }}>
          {photoUrl && (
            <>
              <img src={photoUrl} alt="" crossOrigin="anonymous" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }} />
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${tokens.bgAccent}cc 0%, ${tokens.bgAccent}66 40%, ${tokens.bgAccent} 100%)` }} />
            </>
          )}
          <div style={{ position: 'relative', height: '100%', padding: 80, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <img src={auraLogo} alt="" style={{ height: 40, filter: 'brightness(0) invert(1)', opacity: 0.92 }} />
              <span style={{ fontSize: 13, letterSpacing: '0.35em', textTransform: 'uppercase', color: tokens.accent, fontWeight: 600 }}>
                {block.eyebrow}
              </span>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <Title
                text={block.title}
                style={{
                  fontFamily: tokens.displayFont,
                  fontSize: 120,
                  lineHeight: 0.92,
                  letterSpacing: '-0.03em',
                  fontWeight: 700,
                  color: tokens.paper,
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 40 }}>
              <p style={{ flex: 1, maxWidth: 480, fontSize: 19, lineHeight: 1.55, color: tokens.paperSoft }}>{block.subtitle}</p>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: tokens.paperSoft }}>{block.cta}</p>
                {whatsapp && <p style={{ marginTop: 6, fontFamily: tokens.displayFont, fontSize: 32, fontWeight: 700, color: tokens.paper }}>{whatsapp}</p>}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ─────────── MINIMAL SERIF ───────────
    if (template.id === 'minimal-serif') {
      return (
        <div ref={ref} style={{ ...baseStyle, padding: 80, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <img src={auraLogo} alt="" style={{ height: 36 }} />
            <span style={{ fontSize: 12, letterSpacing: '0.4em', textTransform: 'uppercase', color: tokens.inkSoft, fontWeight: 600 }}>
              {block.eyebrow}
            </span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 820 }}>
            <Title
              text={block.title}
              style={{
                fontFamily: tokens.displayFont,
                fontSize: 92,
                lineHeight: 0.95,
                letterSpacing: '-0.025em',
                fontWeight: 700,
                color: tokens.ink,
              }}
            />
            <p style={{ marginTop: 36, fontSize: 22, lineHeight: 1.55, color: tokens.inkSoft, maxWidth: 640 }}>{block.subtitle}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, paddingTop: 32, borderTop: `1px solid ${tokens.inkSoft}33` }}>
            {block.bullets.map((b) => (
              <div key={b}>
                <div style={{ height: 2, width: 40, background: tokens.accent, marginBottom: 12 }} />
                <p style={{ fontSize: 16, color: tokens.ink, fontWeight: 500, lineHeight: 1.4 }}>{b}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: tokens.inkSoft }}>{block.cta}</p>
              {whatsapp && <p style={{ marginTop: 4, fontFamily: tokens.displayFont, fontSize: 28, fontWeight: 700, color: tokens.ink }}>{whatsapp}</p>}
            </div>
            {instagram && <p style={{ fontSize: 14, color: tokens.inkSoft }}>@{instagram}</p>}
          </div>
        </div>
      );
    }

    // ─────────── MAGAZINE COVER ───────────
    if (template.id === 'magazine-cover') {
      return (
        <div ref={ref} style={baseStyle}>
          {photoUrl && (
            <img src={photoUrl} alt="" crossOrigin="anonymous" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${tokens.bgAccent}33 0%, transparent 30%, ${tokens.bgAccent}ee 100%)` }} />

          {/* Mast head */}
          <div style={{ position: 'absolute', top: 50, left: 60, right: 60, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: tokens.paper }}>
            <p style={{ fontFamily: tokens.displayFont, fontSize: 42, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>AURA</p>
            <p style={{ fontSize: 12, letterSpacing: '0.4em', textTransform: 'uppercase', fontWeight: 600 }}>Edição Premium</p>
          </div>

          {/* Tarja chamada */}
          <div style={{ position: 'absolute', top: 240, left: 0, padding: '14px 60px 14px 60px', background: tokens.accent, color: tokens.bgAccent }}>
            <p style={{ fontSize: 14, letterSpacing: '0.3em', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>{block.eyebrow}</p>
          </div>

          {/* Conteúdo inferior */}
          <div style={{ position: 'absolute', bottom: 60, left: 60, right: 60, color: tokens.paper }}>
            <Title
              text={block.title}
              style={{
                fontFamily: tokens.displayFont,
                fontSize: 80,
                lineHeight: 0.95,
                letterSpacing: '-0.025em',
                fontWeight: 700,
                color: tokens.paper,
              }}
            />
            <p style={{ marginTop: 24, fontSize: 18, lineHeight: 1.5, maxWidth: 700, color: tokens.paperSoft }}>{block.subtitle}</p>
            <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <p style={{ fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: tokens.paperSoft }}>{block.cta}</p>
                {whatsapp && <p style={{ marginTop: 4, fontFamily: tokens.displayFont, fontSize: 28, fontWeight: 700 }}>{whatsapp}</p>}
              </div>
              {photoLabel && <p style={{ fontSize: 13, color: tokens.paperSoft, fontStyle: 'italic' }}>com {photoLabel}</p>}
            </div>
          </div>
        </div>
      );
    }

    // ─────────── STORY VERTICAL 9:16 ───────────
    if (template.id === 'story-vertical') {
      return (
        <div ref={ref} style={{ ...baseStyle, background: tokens.bgAccent, color: tokens.paper }}>
          {photoUrl && (
            <>
              <img src={photoUrl} alt="" crossOrigin="anonymous" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${tokens.bgAccent}40 0%, ${tokens.bgAccent}99 60%, ${tokens.bgAccent} 100%)` }} />
            </>
          )}
          <div style={{ position: 'relative', height: '100%', padding: 80, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <img src={auraLogo} alt="" style={{ height: 50, filter: 'brightness(0) invert(1)', opacity: 0.92 }} />
              <span style={{ fontSize: 14, letterSpacing: '0.35em', textTransform: 'uppercase', color: tokens.accent, fontWeight: 600 }}>
                {block.eyebrow}
              </span>
            </div>
            <div style={{ flex: 1 }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
                <span style={{ fontFamily: tokens.displayFont, fontSize: 130, fontWeight: 800, lineHeight: 1, color: tokens.accent }}>{block.highlight}</span>
                <span style={{ fontSize: 18, color: tokens.paperSoft, maxWidth: 220, lineHeight: 1.3 }}>{block.highlightLabel}</span>
              </div>
              <Title
                text={block.title}
                style={{
                  fontFamily: tokens.displayFont,
                  fontSize: 88,
                  lineHeight: 0.95,
                  letterSpacing: '-0.025em',
                  fontWeight: 700,
                  color: tokens.paper,
                }}
              />
              <p style={{ marginTop: 28, fontSize: 24, lineHeight: 1.5, color: tokens.paperSoft, maxWidth: 820 }}>{block.subtitle}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '36px 0 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {block.bullets.map((b) => (
                  <li key={b} style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 22, color: tokens.paper, fontWeight: 500 }}>
                    <span style={{ width: 10, height: 10, background: tokens.accent, borderRadius: 999 }} />
                    {b}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 56, paddingTop: 32, borderTop: `1px solid ${tokens.paperSoft}55`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <p style={{ fontSize: 14, letterSpacing: '0.3em', textTransform: 'uppercase', color: tokens.paperSoft }}>{block.cta}</p>
                  {whatsapp && <p style={{ marginTop: 8, fontFamily: tokens.displayFont, fontSize: 44, fontWeight: 700 }}>{whatsapp}</p>}
                </div>
                {instagram && <p style={{ fontSize: 18, color: tokens.paperSoft }}>@{instagram}</p>}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ─────────── HIGHLIGHT CIRCLE ───────────
    return (
      <div ref={ref} style={baseStyle}>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1.1fr 1fr', alignItems: 'center', padding: 60, gap: 40 }}>
          <div style={{ position: 'relative', aspectRatio: '1/1', maxWidth: '100%' }}>
            <div style={{ position: 'absolute', inset: 0, background: tokens.bgAccent, ...photoShape, overflow: 'hidden' }}>
              {photoUrl && (
                <img src={photoUrl} alt="" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }} />
              )}
            </div>
            <div style={{ position: 'absolute', bottom: -12, right: -12, padding: '14px 22px', background: tokens.accent, color: tokens.bgAccent, fontFamily: tokens.displayFont, fontSize: 56, fontWeight: 800, lineHeight: 1, ...(tokens.shapeStyle === 'circle' ? { borderRadius: '50%', width: 130, height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center' } : { borderRadius: 8 }) }}>
              {block.highlight}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 13, letterSpacing: '0.35em', textTransform: 'uppercase', color: tokens.accent, fontWeight: 700 }}>
              {block.eyebrow}
            </p>
            <Title
              text={block.title}
              style={{
                fontFamily: tokens.displayFont,
                fontSize: 64,
                lineHeight: 0.98,
                letterSpacing: '-0.025em',
                fontWeight: 700,
                color: tokens.ink,
                marginTop: 16,
              }}
            />
            <p style={{ marginTop: 24, fontSize: 17, lineHeight: 1.55, color: tokens.inkSoft }}>{block.subtitle}</p>
            <div style={{ marginTop: 32, paddingTop: 20, borderTop: `1px solid ${tokens.inkSoft}44` }}>
              <p style={{ fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: tokens.inkSoft }}>{block.cta}</p>
              {whatsapp && <p style={{ marginTop: 6, fontFamily: tokens.displayFont, fontSize: 26, fontWeight: 700, color: tokens.ink }}>{whatsapp}</p>}
            </div>
          </div>
        </div>
        <img src={auraLogo} alt="" style={{ position: 'absolute', top: 32, left: 60, height: 32, opacity: 0.85 }} />
      </div>
    );
  },
);

ArteCanvas.displayName = 'ArteCanvas';
