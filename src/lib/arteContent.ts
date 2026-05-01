// Conteúdos curados para o Estúdio de Artes da Aura Clinic.
// Eyebrow + título + subtítulo + bullets + CTA + highlight (número/palavra).
// Suporta itálico no título usando *asteriscos*.

export interface ArteBlock {
  id: string;
  eyebrow: string;
  title: string; // usa *trecho* para itálico
  subtitle: string;
  bullets: string[];
  cta: string;
  highlight: string;
  highlightLabel: string;
}

export const arteBlocksCurados: ArteBlock[] = [
  {
    id: 'pele-luxo',
    eyebrow: 'Skincare premium',
    title: 'Pele que *respira* luxo',
    subtitle:
      'Protocolos faciais sob medida que devolvem viço, firmeza e luminosidade — em rituais pensados para a sua rotina.',
    bullets: ['Limpeza profunda', 'Ácidos personalizados', 'Hidratação intensiva'],
    cta: 'Agende sua avaliação',
    highlight: '01',
    highlightLabel: 'Ritual facial premium',
  },
  {
    id: 'detox',
    eyebrow: 'Detox facial',
    title: 'Renove a *energia* do seu rosto',
    subtitle:
      'Tratamentos detox que limpam, oxigenam e revitalizam a pele, eliminando a sobrecarga do dia a dia.',
    bullets: ['Pele oxigenada', 'Poros minimizados', 'Brilho natural'],
    cta: 'Reserve seu horário',
    highlight: '7d',
    highlightLabel: 'Resultados visíveis',
  },
  {
    id: 'corpo',
    eyebrow: 'Corpo & contorno',
    title: 'Modele com *delicadeza*',
    subtitle:
      'Tecnologias e manuais combinados para definir contornos, suavizar gordura localizada e devolver leveza ao corpo.',
    bullets: ['Drenagem linfática', 'Radiofrequência', 'Massagem modeladora'],
    cta: 'Conheça o protocolo',
    highlight: '10x',
    highlightLabel: 'Sessões progressivas',
  },
  {
    id: 'relax',
    eyebrow: 'Bem-estar',
    title: 'Pause. *Respire.* Renove.',
    subtitle:
      'Massagens terapêuticas e rituais sensoriais que dissolvem o estresse e religam corpo, mente e respiração.',
    bullets: ['Pedras quentes', 'Aromaterapia', 'Toque ayurvédico'],
    cta: 'Presenteie-se',
    highlight: '60’',
    highlightLabel: 'De puro descanso',
  },
  {
    id: 'noiva',
    eyebrow: 'Beleza nupcial',
    title: 'Sua melhor versão *no grande dia*',
    subtitle:
      'Cronogramas estéticos personalizados para que sua pele esteja luminosa, firme e radiante na data mais esperada.',
    bullets: ['Cronograma facial', 'Body bridal', 'Protocolo SOS'],
    cta: 'Monte seu plano noiva',
    highlight: '90d',
    highlightLabel: 'Antes do altar',
  },
  {
    id: 'masc',
    eyebrow: 'Aura Men',
    title: 'Cuidado masculino *sem rodeios*',
    subtitle:
      'Tratamentos diretos, eficientes e discretos para o homem que entende beleza como autocuidado.',
    bullets: ['Skincare express', 'Barba & contorno', 'Anti-fadiga'],
    cta: 'Agende sua sessão',
    highlight: '30’',
    highlightLabel: 'Express premium',
  },
  {
    id: 'rejuv',
    eyebrow: 'Rejuvenescimento',
    title: 'O *tempo* a seu favor',
    subtitle:
      'Protocolos avançados de rejuvenescimento facial que estimulam colágeno, suavizam linhas e devolvem firmeza.',
    bullets: ['Bioestimuladores', 'Microagulhamento', 'Lifting facial'],
    cta: 'Agende uma avaliação',
    highlight: '+',
    highlightLabel: 'Colágeno e firmeza',
  },
  {
    id: 'capilar',
    eyebrow: 'Saúde capilar',
    title: 'Cabelos *vivos* da raiz à ponta',
    subtitle:
      'Tratamentos capilares profundos que fortalecem o couro cabeludo, controlam queda e devolvem brilho.',
    bullets: ['Anti-queda', 'Cronograma capilar', 'Hidratação intensa'],
    cta: 'Reserve seu horário',
    highlight: '03',
    highlightLabel: 'Etapas restauradoras',
  },
  {
    id: 'glow',
    eyebrow: 'Glow instantâneo',
    title: 'Brilho *imediato* para qualquer ocasião',
    subtitle:
      'Protocolos express que entregam pele iluminada e descansada em uma única sessão.',
    bullets: ['Limpeza & peeling', 'Máscara LED', 'Hidratação selante'],
    cta: 'Agende seu glow',
    highlight: '45’',
    highlightLabel: 'Pele radiante',
  },
  {
    id: 'pos-festa',
    eyebrow: 'Pós-festa',
    title: 'Recupere-se com *elegância*',
    subtitle:
      'Drenagem, oxigenação e nutrição para recompor pele e corpo depois daquele evento marcante.',
    bullets: ['Drenagem facial', 'Sérum reparador', 'Cronograma SOS'],
    cta: 'Reserve sua recuperação',
    highlight: '24h',
    highlightLabel: 'Resposta imediata',
  },
];

export interface ServiceLite {
  id: string;
  name: string;
  description?: string | null;
  professional_name?: string | null;
  category?: string | null;
  image_url?: string | null;
}

// Converte um serviço cadastrado em um ArteBlock
export const serviceToBlock = (s: ServiceLite): ArteBlock => {
  const desc = (s.description || '').trim();
  const subtitle =
    desc.length > 0
      ? desc.length > 180
        ? desc.slice(0, 177).trimEnd() + '…'
        : desc
      : 'Tratamento exclusivo Aura Clinic, conduzido com técnica refinada e cuidado integral.';
  return {
    id: `svc-${s.id}`,
    eyebrow: s.category || s.professional_name || 'Aura Clinic',
    title: s.name,
    subtitle,
    bullets: ['Atendimento personalizado', 'Profissional especialista', 'Ambiente acolhedor'],
    cta: 'Agende pelo WhatsApp',
    highlight: '★',
    highlightLabel: 'Experiência premium',
  };
};

// Helper para parsear *itálico* dentro do título
export const renderTitle = (text: string) => {
  const parts: { text: string; italic: boolean; key: string }[] = [];
  const regex = /\*([^*]+)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), italic: false, key: `t${i++}` });
    }
    parts.push({ text: match[1], italic: true, key: `t${i++}` });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), italic: false, key: `t${i++}` });
  }
  return parts;
};
