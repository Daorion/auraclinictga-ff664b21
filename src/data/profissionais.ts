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
  imagem: string;
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
    imagem: '/src/assets/sirlei.jpg',
    secaoServicos: [
      {
        categoria: 'Massagens Relaxantes',
        servicos: [
          {
            titulo: 'Massagem Relaxante Tradicional',
            descricao: 'Uma experiência para desligar o mundo e reconectar com você. A massagem relaxante tradicional utiliza movimentos suaves e contínuos que aliviam tensões, reduzem o estresse e promovem bem-estar imediato. Ideal para quem busca momentos de paz em meio à rotina.'
          },
          {
            titulo: 'Massagem com Pedras Quentes',
            descricao: 'Aliando o toque das mãos ao calor das pedras vulcânicas, essa técnica promove relaxamento profundo, melhora a circulação e reduz dores musculares. Uma verdadeira terapia que aquece o corpo e acalma a mente.'
          },
          {
            titulo: 'Escalda-pés com Manobras Relaxantes',
            descricao: 'Um cuidado especial que começa pelos pés. Banho morno com ervas e sais relaxantes, seguido de manobras manuais que aliviam o cansaço, melhoram a circulação e proporcionam leveza ao corpo inteiro.'
          }
        ]
      },
      {
        categoria: 'Massagens Terapêuticas',
        servicos: [
          {
            titulo: 'Liberação Miofascial',
            descricao: 'Indicado para quem sofre com dores crônicas e tensões musculares profundas. A técnica atua nas fáscias (tecidos que envolvem os músculos), liberando pontos de tensão e melhorando a mobilidade com efeitos duradouros.'
          },
          {
            titulo: 'Drenagem Linfática Manual',
            descricao: 'Movimentos suaves, lentos e rítmicos que ativam o sistema linfático, combatendo inchaços, retenção de líquidos e toxinas. Ideal para quem busca leveza, definição e bem-estar corporal.'
          },
          {
            titulo: 'Massagem Pré-operatória',
            descricao: 'Prepara o corpo para cirurgias, ativando a circulação e reduzindo edemas. É um cuidado essencial para otimizar a recuperação e favorecer melhores resultados no pós-operatório.'
          },
          {
            titulo: 'Massagem Pós-operatória',
            descricao: 'Com técnicas específicas e toques controlados, essa massagem acelera a recuperação, reduz edemas e hematomas, e promove conforto no período de cicatrização. Um suporte profissional essencial no processo de cura.'
          },
          {
            titulo: 'Aplicação de Bandagem Elástica (Tape)',
            descricao: 'As bandagens terapêuticas auxiliam na redução de dores, melhora postural, suporte muscular e drenagem de líquidos. São aplicadas estrategicamente conforme a necessidade individual, com resultados visíveis já nas primeiras aplicações.'
          }
        ]
      },
      {
        categoria: 'Massagens Estéticas',
        servicos: [
          {
            titulo: 'Drenagem Modeladora',
            descricao: 'A união da drenagem linfática com toques mais firmes que modelam o corpo. Estimula a eliminação de líquidos e ativa a circulação, ajudando na definição corporal com conforto.'
          },
          {
            titulo: 'Dreno Modeladora',
            descricao: 'Técnica que une a drenagem profunda com movimentos intensos e ritmados, focando em reduzir medidas, melhorar o contorno corporal e estimular o metabolismo de forma natural.'
          },
          {
            titulo: 'Massagem Modeladora',
            descricao: 'Movimentos intensos e firmes que agem diretamente na gordura localizada e celulite. Ideal para quem busca definição corporal, melhora da textura da pele e sensação de leveza.'
          },
          {
            titulo: 'Massagem Turbinada',
            descricao: 'A versão intensa da modeladora. Utiliza acessórios e movimentos potentes que ativam a circulação, quebram gordura localizada e promovem resultados visíveis em poucas sessões.'
          },
          {
            titulo: 'Massagem Circulatória',
            descricao: 'Técnica focada em melhorar a circulação sanguínea, trazendo alívio para pernas cansadas, sensação de inchaço e cansaço corporal. Perfeita para dias puxados ou para quem passa muito tempo em pé.'
          },
          {
            titulo: 'Detox Corporal',
            descricao: 'Uma verdadeira faxina no organismo. Combina esfoliação, aplicação de ativos desintoxicantes e manobras que estimulam o sistema linfático. Renova a pele e proporciona uma sensação incrível de leveza e purificação.'
          }
        ]
      },
      {
        categoria: 'Tratamentos Faciais',
        servicos: [
          {
            titulo: 'Limpeza de Pele Profunda',
            descricao: 'Mais do que estética: é cuidado com a saúde da sua pele. A limpeza profunda remove cravos, impurezas e células mortas, desobstrui poros e deixa a pele mais saudável, viçosa e pronta para absorver tratamentos. Ideal para quem deseja uma pele renovada e equilibrada.'
          },
          {
            titulo: 'LEDterapia',
            descricao: 'Tecnologia a favor da sua beleza. A luz de LED atua em diferentes camadas da pele, tratando acne, manchas, sinais do tempo e estimulando o colágeno. É segura, indolor e personalizada para cada tipo de necessidade.'
          },
          {
            titulo: 'Dermaplaning',
            descricao: 'Um tratamento que deixa a pele com toque de seda. A técnica remove as células mortas e os pelos finos do rosto (penugens), proporcionando uma pele lisa, iluminada e com melhor absorção de cosméticos. Resultado imediato e incrível.'
          },
          {
            titulo: 'Revitalização Facial',
            descricao: 'Indicado para peles cansadas, opacas ou desidratadas. Une ativos específicos com técnicas de aplicação que estimulam o colágeno, renovam as células e devolvem o brilho natural da pele. Ideal para um efeito glow e aparência descansada.'
          },
          {
            titulo: 'Hidragloss',
            descricao: 'Hidratação intensa e brilho natural para os lábios. O tratamento nutre profundamente, define o contorno labial e realça a cor natural da boca, deixando um efeito "gloss" saudável, macio e irresistível. Sensação de boca renovada já na primeira aplicação.'
          }
        ]
      },
      {
        categoria: 'Tratamentos Corporais com Aparelhos e Técnicas Avançadas',
        servicos: [
          {
            titulo: 'Radiofrequência',
            descricao: 'Tecnologia que aquece as camadas mais profundas da pele para estimular a produção de colágeno. Combate a flacidez, melhora a textura da pele e trata celulites de forma eficaz, sem dor ou tempo de recuperação.'
          },
          {
            titulo: 'Corrente Russa',
            descricao: 'Aparelho de eletroestimulação que tonifica a musculatura, melhora a firmeza da pele e auxilia no ganho de definição muscular. Ideal para quem quer complementar os treinos ou acelerar os resultados estéticos.'
          },
          {
            titulo: 'Corrente Aussie',
            descricao: 'Estímulo muscular profundo com foco em fortalecimento e definição. Age como uma academia localizada nos pontos certos do corpo, ideal para potencializar os treinos e definir regiões específicas com eficiência.'
          },
          {
            titulo: 'Ultrassom',
            descricao: 'Combate à gordura localizada com resultados visíveis. As ondas ultrassônicas penetram nas camadas de gordura, fragmentando-as para serem eliminadas naturalmente pelo organismo. Tratamento indolor, eficaz e não invasivo.'
          },
          {
            titulo: 'Criomodelagem',
            descricao: 'A união do frio e da estética. A técnica utiliza crioterapia (baixas temperaturas) para tratar gordura localizada, promovendo quebra de adipócitos e remodelação do contorno corporal. Ideal para quem busca redução de medidas com tecnologia segura.'
          },
          {
            titulo: 'Terapias Combinadas',
            descricao: 'Para resultados mais potentes e personalizados. Combinação estratégica de técnicas manuais e aparelhos, definidas após avaliação, para tratar diversos objetivos ao mesmo tempo: flacidez, gordura localizada, celulite e mais.'
          },
          {
            titulo: 'Intradermoterapia Corporal',
            descricao: 'Aplicação de ativos diretamente na camada onde o problema está. Utiliza microinjeções para tratar gordura localizada, flacidez e celulite com mais precisão e resultados rápidos. Procedimento feito com segurança e acompanhamento profissional.'
          },
          {
            titulo: 'Remodelação Glútea com Intradermoterapia',
            descricao: 'Técnica exclusiva para quem busca firmeza e volume na região dos glúteos. São aplicados ativos específicos para estimular o colágeno, melhorar o tônus e realçar a forma natural dos glúteos com mais harmonia.'
          },
          {
            titulo: 'PAMP – Protocolo Avançado para Glúteos',
            descricao: 'Protocolo completo que une eletroestimulação, técnicas manuais, ativos firmadores e estratégias personalizadas. Ideal para elevar, firmar e modelar os glúteos com naturalidade e resultados consistentes. Um verdadeiro upgrade na autoestima.'
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
    imagem: '/src/assets/simone.jpg',
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
    id: 'cleia',
    nome: 'Cleia',
    especialidade: 'Terapias e Estética',
    descricao: 'Massagens relaxantes, pedras quentes, modeladora turbinada, microderme e bandagem.',
    destaque: false,
    bio: 'Terapeuta especializada em tratamentos corporais e faciais com técnicas diversificadas.',
    experiencia: '7+ anos de experiência',
    imagem: '/src/assets/cleia.jpg',
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
    imagem: '/src/assets/luana.jpg',
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
    imagem: '/src/assets/nadja.jpg',
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
    imagem: '/src/assets/rayka.jpg',
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
    imagem: '/src/assets/geisiane.jpg',
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
    imagem: '/src/assets/vanessa.jpg',
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
  },
  {
    id: 'fernanda',
    nome: 'Dra. Fernanda Mattos',
    especialidade: 'Farmacêutica Esteta',
    descricao: 'Especialista em tratamentos estéticos injetáveis, faciais e terapia capilar com protocolos modernos e eficazes.',
    destaque: false,
    bio: 'Farmacêutica esteta com ampla experiência em procedimentos estéticos avançados, especializada em tratamentos injetáveis, rejuvenescimento facial e terapias capilares.',
    experiencia: '8+ anos de experiência',
    imagem: '/src/assets/fernanda.jpg',
    secaoServicos: [
      {
        categoria: 'Tratamentos Injetáveis',
        servicos: [
          {
            titulo: 'Botox',
            descricao: 'Aplicação de toxina botulínica para suavização de rugas e linhas de expressão, com resultados naturais e harmoniosos.'
          },
          {
            titulo: 'Soroterapia',
            descricao: 'Infusão de vitaminas, minerais e antioxidantes para hidratação profunda, revitalização e bem-estar geral.'
          },
          {
            titulo: 'PEIM (Protocolo Estético Intradérmico Microinflamatório)',
            descricao: 'Técnica avançada para tratamento de gordura localizada e flacidez através de microinjeções específicas.'
          },
          {
            titulo: 'Skinbooster',
            descricao: 'Hidratação profunda da pele através de ácido hialurônico injetável para textura uniforme e aspecto rejuvenescido.'
          },
          {
            titulo: 'PDRN (Polidesoxirribonucleotídeo)',
            descricao: 'Tratamento regenerativo celular que estimula a reparação dos tecidos, melhora a qualidade da pele e promove rejuvenescimento natural.'
          }
        ]
      },
      {
        categoria: 'Tratamentos Faciais',
        servicos: [
          {
            titulo: 'Microagulhamento',
            descricao: 'Estimulação de colágeno através de microagulhas para renovação celular, melhoria de cicatrizes e textura da pele.'
          },
          {
            titulo: 'Limpeza de Pele',
            descricao: 'Limpeza profunda com extração de impurezas, desobstrução de poros e renovação celular para pele saudável e radiante.'
          },
          {
            titulo: 'Dermaplaning',
            descricao: 'Remoção de células mortas e penugens faciais para pele lisa, luminosa e com melhor absorção de produtos.'
          },
          {
            titulo: 'Enzimas',
            descricao: 'Tratamento enzimático para esfoliação suave, renovação celular e luminosidade natural da pele.'
          },
          {
            titulo: 'Jato de Plasma para Rejuvenescimento',
            descricao: 'Tecnologia avançada de plasma para rejuvenescimento sem cirurgia, tratando flacidez, rugas e manchas.'
          },
          {
            titulo: 'Peeling Químico',
            descricao: 'Renovação profunda da pele através de ácidos específicos para tratar manchas, acne, rugas e uniformizar o tom da pele.'
          }
        ]
      },
      {
        categoria: 'Terapia Capilar',
        servicos: [
          {
            titulo: 'Terapia Capilar',
            descricao: 'Tratamentos avançados para fortalecimento, crescimento e saúde dos fios, combatendo queda e restaurando a vitalidade capilar.'
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
    destaque: prof.destaque,
    imagem: prof.imagem
  }));
};