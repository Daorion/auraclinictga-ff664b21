// Definições de templates de arte (estrutura/layout).
// O DESIGN (cores, fontes, formas) é controlado por DesignTokens — pode vir
// de presets ou ser gerado pela IA via edge function ai-design-template.

export type TemplateId =
  | 'editorial-split'   // 1080x1350 — foto à esquerda, conteúdo à direita
  | 'bold-statement'    // 1080x1350 — título massivo sobre foto com overlay
  | 'minimal-serif'     // 1080x1080 — sem foto principal, só tipografia editorial
  | 'magazine-cover'    // 1080x1350 — capa de revista, foto cobertura + tarja
  | 'story-vertical'    // 1080x1920 — story Instagram
  | 'highlight-circle'; // 1080x1080 — destaque grande circular ao lado do conteúdo

export interface TemplateMeta {
  id: TemplateId;
  name: string;
  description: string;
  size: { w: number; h: number };
  ratio: '4:5' | '1:1' | '9:16';
  needsPhoto: boolean;
}

export const templates: TemplateMeta[] = [
  {
    id: 'editorial-split',
    name: 'Editorial Split',
    description: 'Foto à esquerda, manifesto editorial à direita',
    size: { w: 1080, h: 1350 },
    ratio: '4:5',
    needsPhoto: true,
  },
  {
    id: 'bold-statement',
    name: 'Bold Statement',
    description: 'Título massivo sobre foto com overlay dramático',
    size: { w: 1080, h: 1350 },
    ratio: '4:5',
    needsPhoto: true,
  },
  {
    id: 'minimal-serif',
    name: 'Minimal Serif',
    description: 'Pura tipografia editorial, sem distrações',
    size: { w: 1080, h: 1080 },
    ratio: '1:1',
    needsPhoto: false,
  },
  {
    id: 'magazine-cover',
    name: 'Magazine Cover',
    description: 'Capa de revista de luxo com tarja de chamada',
    size: { w: 1080, h: 1350 },
    ratio: '4:5',
    needsPhoto: true,
  },
  {
    id: 'story-vertical',
    name: 'Story 9:16',
    description: 'Stories verticais para Instagram',
    size: { w: 1080, h: 1920 },
    ratio: '9:16',
    needsPhoto: true,
  },
  {
    id: 'highlight-circle',
    name: 'Highlight Circle',
    description: 'Destaque circular gigante ao lado do conteúdo',
    size: { w: 1080, h: 1080 },
    ratio: '1:1',
    needsPhoto: true,
  },
];

// ─────────────────────────────────────────────────────────────────────
// Design tokens — gerados pela IA ou escolhidos via preset.
// Todos os campos são CSS values diretos (cores hex, números px, etc).
// ─────────────────────────────────────────────────────────────────────
export interface DesignTokens {
  name: string;
  // Paleta
  bg: string;          // fundo principal
  bgAccent: string;    // fundo secundário/painel
  ink: string;         // texto principal sobre bg claro
  inkSoft: string;     // texto secundário
  paper: string;       // texto sobre bg escuro
  paperSoft: string;   // texto secundário sobre bg escuro
  accent: string;      // cor de destaque (badges, highlights)
  // Tipografia
  displayFont: string; // títulos
  bodyFont: string;    // corpo
  // Estilo
  radius: number;      // border radius base (px)
  shapeStyle: 'organic' | 'sharp' | 'arch' | 'circle'; // forma das fotos / blocos
  vibe: 'editorial' | 'magazine' | 'minimal' | 'dramatic';
}

// ─────────────────────────────────────────────────────────────────────
// Template variants — variações cosméticas leves aplicadas sobre os
// templates base (titleScale, marcador, foco da foto, alinhamento).
// IA gera novos com a mesma UX dos design tokens.
// ─────────────────────────────────────────────────────────────────────
export interface TemplateVariant {
  name: string;
  baseTemplateId: TemplateId;
  titleScale: number;            // 0.85 - 1.25
  bulletStyle: 'dot' | 'square' | 'bar' | 'arrow';
  photoFocus: 'face' | 'center' | 'wide'; // controla object-position
  align: 'left' | 'center';
  overlayIntensity: 'soft' | 'medium' | 'strong'; // só nos templates com foto cobertura
}

export const defaultVariantFor = (id: TemplateId): TemplateVariant => ({
  name: 'Padrão da Casa',
  baseTemplateId: id,
  titleScale: 1,
  bulletStyle: 'dot',
  photoFocus: 'face',
  align: 'left',
  overlayIntensity: 'medium',
});

export const designPresets: DesignTokens[] = [
  {
    name: 'Marsala Clássico',
    bg: '#f7f1ea',
    bgAccent: '#58101b',
    ink: '#2a0810',
    inkSoft: '#58101bcc',
    paper: '#f7f1ea',
    paperSoft: '#f7f1eacc',
    accent: '#c9a14a',
    displayFont: "'Cormorant Garamond', Georgia, serif",
    bodyFont: "'Inter', system-ui, sans-serif",
    radius: 24,
    shapeStyle: 'organic',
    vibe: 'editorial',
  },
  {
    name: 'Marfim & Ouro',
    bg: '#ede5d6',
    bgAccent: '#1a0a0e',
    ink: '#1a0a0e',
    inkSoft: '#1a0a0e99',
    paper: '#ede5d6',
    paperSoft: '#ede5d6b3',
    accent: '#b8893a',
    displayFont: "'Cormorant Garamond', Georgia, serif",
    bodyFont: "'Inter', system-ui, sans-serif",
    radius: 4,
    shapeStyle: 'sharp',
    vibe: 'magazine',
  },
  {
    name: 'Onyx Profundo',
    bg: '#0e0608',
    bgAccent: '#58101b',
    ink: '#f5ece0',
    inkSoft: '#f5ece0aa',
    paper: '#f5ece0',
    paperSoft: '#f5ece0aa',
    accent: '#d4a857',
    displayFont: "'Cormorant Garamond', Georgia, serif",
    bodyFont: "'Inter', system-ui, sans-serif",
    radius: 0,
    shapeStyle: 'sharp',
    vibe: 'dramatic',
  },
  {
    name: 'Pêssego Sereno',
    bg: '#f9e8db',
    bgAccent: '#7d2231',
    ink: '#3a0d14',
    inkSoft: '#3a0d1499',
    paper: '#f9e8db',
    paperSoft: '#f9e8dbcc',
    accent: '#e07b56',
    displayFont: "'Cormorant Garamond', Georgia, serif",
    bodyFont: "'Inter', system-ui, sans-serif",
    radius: 999,
    shapeStyle: 'circle',
    vibe: 'minimal',
  },
  {
    name: 'Champagne Arch',
    bg: '#efe6d4',
    bgAccent: '#3a0d14',
    ink: '#3a0d14',
    inkSoft: '#3a0d1499',
    paper: '#efe6d4',
    paperSoft: '#efe6d4cc',
    accent: '#a07a3a',
    displayFont: "'Cormorant Garamond', Georgia, serif",
    bodyFont: "'Inter', system-ui, sans-serif",
    radius: 0,
    shapeStyle: 'arch',
    vibe: 'editorial',
  },
];
