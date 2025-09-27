export interface Servico {
  titulo: string;
  descricao: string;
  preco?: string;
}

export interface SecaoServicos {
  categoria: string;
  servicos: Servico[];
}

export interface ProfissionalData {
  id: string;
  nome: string;
  especialidade: string;
  descricao: string;
  destaque: boolean;
  bio: string;
  experiencia: string;
  secaoServicos: SecaoServicos[];
  contato?: {
    whatsapp?: string;
    telefone?: string;
  };
}

export const profissionaisData: ProfissionalData[] = [
  {
    id: 'sirlei',
    nome: 'Sirlei',
    especialidade: 'Massoterapia e Tratamentos Estéticos',
    descricao: 'Especialista em massagens relaxantes, terapêuticas e estéticas. Oferece uma ampla gama de tratamentos para bem-estar e beleza.',
    destaque: true,
    bio: 'Profissional com mais de 10 anos de experiência em massoterapia e estética. Especializada em técnicas de relaxamento e tratamentos estéticos avançados.',
    experiencia: '10+ anos de experiência',
    secaoServicos: [
      {
        categoria: 'Massagens Relaxantes',
        servicos: [
          {
            titulo: 'Massagem Relaxante Clássica',
            descricao: 'Massagem suave e relaxante para alívio do estresse e tensões musculares do dia a dia.'
          },
          {
            titulo: 'Massagem com Pedras Quentes',
            descricao: 'Terapia relaxante que utiliza pedras vulcânicas aquecidas para promover relaxamento profundo.'
          },
          {
            titulo: 'Massagem Aromaterapêutica',
            descricao: 'Combinação de massagem relaxante com óleos essenciais terapêuticos.'
          }
        ]
      },
      {
        categoria: 'Tratamentos Faciais',
        servicos: [
          {
            titulo: 'Limpeza de Pele Profunda',
            descricao: 'Remoção de impurezas, cravos e oleosidade excessiva para uma pele mais saudável.'
          },
          {
            titulo: 'Hidratação Facial',
            descricao: 'Tratamento intensivo para restaurar a hidratação e luminosidade da pele.'
          },
          {
            titulo: 'Peeling Químico',
            descricao: 'Renovação celular através de ácidos específicos para cada tipo de pele.'
          }
        ]
      },
      {
        categoria: 'Tratamentos Corporais',
        servicos: [
          {
            titulo: 'Massagem Modeladora',
            descricao: 'Técnica específica para redução de medidas e modelagem corporal.'
          },
          {
            titulo: 'Drenagem Linfática',
            descricao: 'Massagem terapêutica para estimular o sistema linfático e reduzir inchaços.'
          },
          {
            titulo: 'Esfoliação Corporal',
            descricao: 'Renovação da pele através de esfoliação seguida de hidratação intensiva.'
          }
        ]
      }
    ],
    contato: {
      whatsapp: '5511999999999'
    }
  },
  {
    id: 'simone',
    nome: 'Simone',
    especialidade: 'Nail Designer',
    descricao: 'Unhas em gel, alongamento e banho em gel com técnicas modernas e produtos de qualidade.',
    destaque: false,
    bio: 'Nail designer especializada em técnicas avançadas de manicure e pedicure, com foco em unhas em gel e nail art.',
    experiencia: '8+ anos de experiência',
    secaoServicos: [
      {
        categoria: 'Unhas em Gel',
        servicos: [
          {
            titulo: 'Unhas em Gel Tradicionais',
            descricao: 'Aplicação de gel para fortalecimento e brilho natural das unhas.'
          },
          {
            titulo: 'Alongamento de Unhas',
            descricao: 'Extensão das unhas naturais com técnicas de gel ou acrílico.'
          },
          {
            titulo: 'Nail Art',
            descricao: 'Decoração artística personalizada para suas unhas.'
          }
        ]
      }
    ]
  },
  {
    id: 'dediane',
    nome: 'Dra. Dediane',
    especialidade: 'Harmonização Facial',
    descricao: 'Harmonização facial, botox, microagulhamento e preenchimentos com técnicas avançadas.',
    destaque: false,
    bio: 'Médica especializada em harmonização facial e procedimentos estéticos minimamente invasivos.',
    experiencia: '12+ anos de experiência',
    secaoServicos: [
      {
        categoria: 'Harmonização Facial',
        servicos: [
          {
            titulo: 'Aplicação de Botox',
            descricao: 'Tratamento para redução de rugas de expressão e linhas finas.'
          },
          {
            titulo: 'Preenchimento com Ácido Hialurônico',
            descricao: 'Restauração de volume e contorno facial natural.'
          },
          {
            titulo: 'Microagulhamento',
            descricao: 'Estimulação do colágeno para renovação e rejuvenescimento da pele.'
          }
        ]
      }
    ]
  },
  {
    id: 'cleia',
    nome: 'Cleia',
    especialidade: 'Terapias e Estética',
    descricao: 'Massagens relaxantes, pedras quentes, modeladora turbinada, microderme e bandagem.',
    destaque: false,
    bio: 'Terapeuta especializada em tratamentos corporais e faciais com técnicas diversificadas.',
    experiencia: '7+ anos de experiência',
    secaoServicos: [
      {
        categoria: 'Massagens Terapêuticas',
        servicos: [
          {
            titulo: 'Massagem com Pedras Quentes',
            descricao: 'Terapia de relaxamento profundo com pedras vulcânicas aquecidas.'
          },
          {
            titulo: 'Massagem Modeladora Turbinada',
            descricao: 'Técnica intensiva para modelagem corporal e redução de medidas.'
          }
        ]
      },
      {
        categoria: 'Tratamentos Estéticos',
        servicos: [
          {
            titulo: 'Microdermoabrasão',
            descricao: 'Renovação celular através de esfoliação controlada da pele.'
          },
          {
            titulo: 'Bandagem Corporal',
            descricao: 'Tratamento para firmeza e tonificação da pele.'
          }
        ]
      }
    ]
  },
  {
    id: 'luana',
    nome: 'Luana',
    especialidade: 'Tratamentos Faciais',
    descricao: 'Microagulhamento, botox, enzimas e eletroterapia para rejuvenescimento facial.',
    destaque: false,
    bio: 'Esteticista especializada em tratamentos faciais avançados e rejuvenescimento.',
    experiencia: '6+ anos de experiência',
    secaoServicos: [
      {
        categoria: 'Tratamentos de Rejuvenescimento',
        servicos: [
          {
            titulo: 'Microagulhamento Facial',
            descricao: 'Estimulação do colágeno para renovação celular e melhoria da textura da pele.'
          },
          {
            titulo: 'Terapia com Enzimas',
            descricao: 'Tratamento enzimático para renovação e luminosidade da pele.'
          },
          {
            titulo: 'Eletroterapia Facial',
            descricao: 'Uso de correntes específicas para tonificação e rejuvenescimento facial.'
          }
        ]
      }
    ]
  },
  {
    id: 'nadja',
    nome: 'Nadja',
    especialidade: 'Design de Sobrancelhas',
    descricao: 'Micropigmentação, design de sobrancelhas, brow lamination e epilação egípcia.',
    destaque: false,
    bio: 'Designer de sobrancelhas especializada em técnicas modernas de micropigmentação e design.',
    experiencia: '5+ anos de experiência',
    secaoServicos: [
      {
        categoria: 'Design de Sobrancelhas',
        servicos: [
          {
            titulo: 'Henna',
            descricao: 'Coloração natural das sobrancelhas com henna.',
            preco: 'R$ 35'
          },
          {
            titulo: 'Design sem Henna',
            descricao: 'Modelagem e design das sobrancelhas.',
            preco: 'R$ 50'
          },
          {
            titulo: 'Design com Henna',
            descricao: 'Design completo com aplicação de henna.',
            preco: 'R$ 60'
          },
          {
            titulo: 'Brow Lamination',
            descricao: 'Técnica para disciplinar e dar volume às sobrancelhas.',
            preco: 'R$ 120'
          },
          {
            titulo: 'Micropigmentação',
            descricao: 'Técnica semi-permanente para preenchimento das sobrancelhas.',
            preco: 'R$ 200'
          }
        ]
      }
    ]
  },
  {
    id: 'rayka',
    nome: 'Rayka',
    especialidade: 'Extensão de Cílios',
    descricao: 'Extensão de cílios em diversos volumes para um olhar mais marcante e natural.',
    destaque: false,
    bio: 'Especialista em extensão de cílios com técnicas que garantem naturalidade e durabilidade.',
    experiencia: '4+ anos de experiência',
    secaoServicos: [
      {
        categoria: 'Extensão de Cílios',
        servicos: [
          {
            titulo: 'Volume Clássico',
            descricao: 'Aplicação fio a fio para um resultado natural e elegante.'
          },
          {
            titulo: 'Volume Russo',
            descricao: 'Técnica que cria volume intenso com múltiplos fios ultra-finos.'
          },
          {
            titulo: 'Híbrido',
            descricao: 'Combinação das técnicas clássica e volume para resultado personalizado.'
          }
        ]
      }
    ]
  },
  {
    id: 'geisiane',
    nome: 'Dra. Geisiane',
    especialidade: 'Tratamentos Corporais',
    descricao: 'Massagem MAF, limpeza de pele e tratamentos específicos para gordura e flacidez.',
    destaque: false,
    bio: 'Fisioterapeuta especializada em tratamentos corporais estéticos e funcionais.',
    experiencia: '9+ anos de experiência',
    secaoServicos: [
      {
        categoria: 'Tratamentos Corporais Avançados',
        servicos: [
          {
            titulo: 'Massagem MAF',
            descricao: 'Massagem Anti-Flacidez para tonificação e firmeza da pele.'
          },
          {
            titulo: 'Tratamento para Gordura Localizada',
            descricao: 'Protocolos específicos para redução de gordura localizada.'
          },
          {
            titulo: 'Tratamento Anti-Flacidez',
            descricao: 'Técnicas avançadas para firmeza e elasticidade da pele.'
          }
        ]
      }
    ]
  },
  {
    id: 'vanessa',
    nome: 'Dra. Vanessa',
    especialidade: 'Harmonização',
    descricao: 'Harmonização facial e corporal com técnicas modernas e seguras.',
    destaque: false,
    bio: 'Médica especializada em harmonização estética facial e corporal.',
    experiencia: '11+ anos de experiência',
    secaoServicos: [
      {
        categoria: 'Harmonização Estética',
        servicos: [
          {
            titulo: 'Harmonização Facial',
            descricao: 'Procedimentos para equilibrio e simetria facial.'
          },
          {
            titulo: 'Harmonização Corporal',
            descricao: 'Tratamentos para contorno e proporção corporal.'
          },
          {
            titulo: 'Procedimentos Minimamente Invasivos',
            descricao: 'Técnicas avançadas com recovery rápido.'
          }
        ]
      }
    ]
  }
];

export const getProfissionalById = (id: string): ProfissionalData | undefined => {
  return profissionaisData.find(prof => prof.id === id);
};

export const getProfissionaisBasicos = () => {
  return profissionaisData.map(prof => ({
    id: prof.id,
    nome: prof.nome,
    especialidade: prof.especialidade,
    descricao: prof.descricao,
    destaque: prof.destaque
  }));
};