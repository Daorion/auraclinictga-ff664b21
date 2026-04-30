export interface Servico {
  titulo: string;
  descricao: string;
  preco?: string;
  destaque?: boolean;
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
    nome: 'Sirlei Glatz',
    especialidade: 'Massoterapeuta',
    descricao: 'Especialista em massagens relaxantes, terapêuticas e estéticas. Oferece uma ampla gama de tratamentos para bem-estar e beleza.',
    destaque: true,
    bio: 'Profissional com mais de 10 anos de experiência em massoterapia e estética. Especializada em técnicas de relaxamento e tratamentos estéticos avançados.',
    experiencia: '10+ anos de experiência',
    imagem: '/assets/profissionais/sirlei.jpg',
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
    nome: 'Simone Lima',
    especialidade: 'Nail Designer',
    descricao: 'Especialista em alongamento de unhas, banho de gel, esmaltação em gel e design de sobrancelhas personalizado.',
    destaque: false,
    bio: 'Nail designer e designer de sobrancelhas especializada em técnicas avançadas de unhas em gel e design facial personalizado.',
    experiencia: '8+ anos de experiência',
    imagem: '/assets/profissionais/simone.jpg',
    secaoServicos: [
      {
        categoria: 'Serviços de Unhas',
        servicos: [
          {
            titulo: 'Alongamento de Unhas',
            descricao: 'Técnica moderna e precisa que utiliza o molde F1 para alongar as unhas com resultado natural, resistente e duradouro. Ideal para quem deseja unhas mais longas e com acabamento impecável, sem agredir as unhas naturais.'
          },
          {
            titulo: 'Banho de Gel',
            descricao: 'Perfeito para fortalecer as unhas naturais, o banho de gel cria uma camada protetora que aumenta a durabilidade do esmalte e evita que as unhas quebrem. Indicado para quem quer unhas bonitas, fortes e com brilho prolongado.'
          },
          {
            titulo: 'Esmaltação em Gel',
            descricao: 'Esmalte com alta durabilidade e brilho intenso que permanece perfeito por até 20 dias. Secagem imediata na cabine, sem risco de borrar. Ideal para quem busca praticidade e acabamento impecável no dia a dia.'
          }
        ]
      },
      {
        categoria: 'Design de Sobrancelhas',
        servicos: [
          {
            titulo: 'Design de Sobrancelhas Personalizado',
            descricao: 'Análise facial completa para valorizar o formato natural do seu rosto. O design é feito de forma personalizada, respeitando o crescimento dos fios e realçando a sua beleza de forma harmônica e natural.'
          },
          {
            titulo: 'Design de Sobrancelhas com Henna',
            descricao: 'Além do design tradicional, a henna é aplicada para preencher e realçar o formato das sobrancelhas, proporcionando um efeito de sobrancelhas mais definidas e marcadas. O resultado dura de 7 a 10 dias na pele.'
          }
        ]
      },
      {
        categoria: 'Tratamentos Complementares',
        servicos: [
          {
            titulo: 'Spa dos Lábios',
            descricao: 'Tratamento de hidratação profunda que remove células mortas, devolve maciez, viço e suavidade aos lábios. Ideal para quem sofre com ressecamento e quer lábios saudáveis e bonitos.'
          },
          {
            titulo: 'Epilação de Buço na Cera',
            descricao: 'Remoção delicada e eficiente dos pelos do buço com cera morna, garantindo uma pele lisinha, sem irritações e com resultado duradouro.'
          }
        ]
      }
    ]
  },
  {
    id: 'cleia',
    nome: 'Cleia Oliveira',
    especialidade: 'Massoterapeuta',
    descricao: 'Massagens relaxantes, pedras quentes, modeladora turbinada, microderme e bandagem.',
    destaque: false,
    bio: 'Terapeuta especializada em tratamentos corporais e faciais com técnicas diversificadas.',
    experiencia: '7+ anos de experiência',
    imagem: '/assets/profissionais/cleia.jpg',
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
    nome: 'Dra. Luana Glatz',
    especialidade: 'Biomédica',
    descricao: 'Especialista em tratamentos inovadores de emagrecimento com Tirzepatida, rejuvenescimento facial com Botox e terapias avançadas.',
    destaque: true,
    bio: 'Profissional com expertise em tratamentos faciais e corporais de alta performance. Especializada em protocolos de emagrecimento com Tirzepatida (Mounjaro®), rejuvenescimento facial com toxina botulínica, microagulhamento e terapias estéticas avançadas. Oferece acompanhamento personalizado focado em resultados reais e transformadores.',
    experiencia: '6+ anos de experiência',
    imagem: '/assets/profissionais/luana.jpg',
    secaoServicos: [
      {
        categoria: 'Tratamento de Emagrecimento',
        servicos: [
          {
            titulo: 'Tirzepatida (Mounjaro®)',
            descricao: 'Tratamento inovador e revolucionário para emagrecimento, aprovado pela ANVISA. A Tirzepatida é um agonista duplo dos receptores GIP e GLP-1, proporcionando perda de peso eficaz e sustentável através da redução do apetite, controle da glicemia e melhora do metabolismo. Estudos clínicos demonstram redução de até 20% do peso corporal. Indicado para quem busca resultados reais e duradouros com acompanhamento profissional personalizado. Deve ser utilizado em conjunto com dieta equilibrada e prática de exercícios físicos. Consulte para saber se você é candidato(a) ao tratamento.',
            destaque: true
          }
        ]
      },
      {
        categoria: 'Tratamentos de Rejuvenescimento',
        servicos: [
          {
            titulo: 'Botox (Toxina Botulínica)',
            descricao: 'O tratamento mais realizado no mundo para rejuvenescimento facial. A toxina botulínica suaviza rugas e linhas de expressão (testa, olhos, glabela), previne o envelhecimento precoce e promove um efeito lifting natural sem necessidade de cirurgia. Resultados visíveis em 3 a 7 dias com duração de 4 a 6 meses. Aplicação segura, precisa e personalizada para cada rosto, respeitando a expressão natural e harmonia facial.'
          },
          {
            titulo: 'Microagulhamento',
            descricao: 'Estimulação do colágeno para renovação celular e melhoria da textura da pele.'
          },
          {
            titulo: 'Terapia com Enzimas',
            descricao: 'Tratamento enzimático para renovação e luminosidade da pele.'
          },
          {
            titulo: 'Eletroterapia Corporal',
            descricao: 'Uso de correntes específicas para tonificação e modelagem corporal com resultados eficazes.'
          }
        ]
      }
    ]
  },
  {
    id: 'rayka',
    nome: 'Rayka Guedes',
    especialidade: 'Lash Designer',
    descricao: 'Extensão de cílios em diversos volumes para um olhar mais marcante e natural.',
    destaque: false,
    bio: 'Especialista em extensão de cílios com técnicas que garantem naturalidade e durabilidade.',
    experiencia: '4+ anos de experiência',
    imagem: '/assets/profissionais/rayka.jpg',
    secaoServicos: [
      {
        categoria: 'Extensão de Cílios',
        servicos: [
          {
            titulo: 'Volume Brasileiro',
            descricao: 'Técnica brasileira que oferece volume e naturalidade perfeitos para um olhar marcante.'
          },
          {
            titulo: 'Glamour/Egípcio',
            descricao: 'Estilo glamouroso e sofisticado inspirado na beleza egípcia, com volume intenso e dramático.'
          },
          {
            titulo: 'Hyper 30+',
            descricao: 'Técnica de mega volume com mais de 30 fios por cílio natural, para resultado ultra volumoso.'
          }
        ]
      }
    ]
  },
  {
    id: 'geisiane',
    nome: 'Dra. Geisiane Pereira',
    especialidade: 'Biomédica',
    descricao: 'Massagem MAF, limpeza de pele e tratamentos específicos para gordura e flacidez.',
    destaque: false,
    bio: 'Biomédica especializada em tratamentos corporais estéticos e funcionais.',
    experiencia: '9+ anos de experiência',
    imagem: '/assets/profissionais/geisiane.jpg',
    secaoServicos: [
      {
        categoria: 'Tratamentos Corporais Avançados',
        servicos: [
          {
            titulo: 'Massagem MAF',
            descricao: 'É uma técnica de drenagem linfática manual que combina manobras específicas com alongamentos, posturas e respirações. Seus benefícios incluem a redução de inchaço, celulite e medidas, além de promover relaxamento, melhorar a circulação sanguínea e intestinal e auxiliar na cicatrização e imunidade.'
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
    nome: 'Dra. Vanessa Gregório',
    especialidade: 'Biomédica',
    descricao: 'Harmonização facial e corporal com técnicas modernas e seguras.',
    destaque: false,
    bio: 'Médica especializada em harmonização estética facial e corporal.',
    experiencia: '11+ anos de experiência',
    imagem: '/assets/profissionais/vanessa.jpg',
    secaoServicos: [
      {
        categoria: 'Tratamentos Faciais',
        servicos: [
          { titulo: 'Peeling', descricao: 'Renovação celular e melhora da textura da pele.' },
          { titulo: 'Botox', descricao: 'Suavização de linhas de expressão e rugas.' },
          { titulo: 'Preenchimento', descricao: 'Restauração de volume e contorno facial com ácido hialurônico.' },
          { titulo: 'Bioestimulador de Colágeno', descricao: 'Estímulo natural à produção de colágeno para firmeza e rejuvenescimento.' },
          { titulo: 'Jato de Plasma', descricao: 'Tecnologia avançada para rejuvenescimento e tratamento de imperfeições.' }
        ]
      },
      {
        categoria: 'Lasers & Tecnologias',
        servicos: [
          { titulo: 'Laser de CO2', descricao: 'Tratamento fracionado para renovação profunda da pele e cicatrizes.' },
          { titulo: 'Depilação a Laser', descricao: 'Redução pelos com tecnologia segura e eficaz.' }
        ]
      },
      {
        categoria: 'Tratamentos Corporais',
        servicos: [
          { titulo: 'Criolipólise', descricao: 'Redução de gordura localizada por congelamento controlado.' },
          { titulo: 'Aplicação de Enzimas', descricao: 'Tratamento injetável para gordura localizada.' },
          { titulo: 'Aplicação de Pein', descricao: 'Tratamento injetável para vasinhos das pernas.' }
        ]
      },
      {
        categoria: 'Tratamentos Especiais',
        servicos: [
          { titulo: 'Tratamento Capilar', descricao: 'Protocolos para fortalecimento, queda e saúde do couro cabeludo.' },
          { titulo: 'Tratamento Íntimo', descricao: 'Cuidados estéticos e funcionais da região íntima feminina.' }
        ]
      }
    ]
  },
  {
    id: 'tatynara',
    nome: 'Tatynara Puka',
    especialidade: 'Especialista em Micropigmentação e Design Facial',
    descricao: 'Especialista em micropigmentação fio a fio, efeito henna, fios e sombra, micropigmentação labial e nos olhos, além de design de sobrancelhas.',
    destaque: false,
    bio: 'Micropigmentadora especializada em técnicas avançadas de sobrancelhas e lábios. Oferece resultados naturais e duradouros com pigmentos de alta qualidade e equipamentos de última geração.',
    experiencia: '5+ anos de experiência',
    imagem: '/assets/profissionais/tatynara.png',
    secaoServicos: [
      {
        categoria: 'Micropigmentação de Sobrancelhas',
        servicos: [
          {
            titulo: 'Micro Fio a Fio',
            descricao: 'Técnica que cria a aparência de cabelos naturais e permanentes com pigmentos inseridos na pele. Resultados duram 14 meses com retoques anuais. Personalizada em cor, textura e densidade para cada cliente.',
            destaque: true
          },
          {
            titulo: 'Micro Henna',
            descricao: 'Técnica de pigmentação semipermanente que imita a cor e textura da henna tradicional. Tons naturais de marrom, castanho, ruivo e preto. Duração de 6-9 meses com resultado natural e suave.'
          },
          {
            titulo: 'Fios & Sombra',
            descricao: 'Técnica que combina fios realistas com efeito de sombra para volume e definição. Cria sobrancelhas mais grossas e preenchidas, com durabilidade de até 18 meses e aparência extremamente natural.'
          }
        ]
      },
      {
        categoria: 'Micropigmentação Facial',
        servicos: [
          {
            titulo: 'Micropigmentação nos Olhos',
            descricao: 'Realça a base dos cílios criando a ilusão de cílios mais grossos. Reduz necessidade de maquiagem com definição imediata, resistente à água e suor, com durabilidade superior a 18 meses.'
          },
          {
            titulo: 'Micropigmentação Labial',
            descricao: 'Técnica semipermanente que define a forma dos lábios, aumenta a cor natural, reduz aparência de rugas e corrige assimetrias. Duração aproximada de 18 meses.'
          }
        ]
      },
      {
        categoria: 'Design de Sobrancelhas',
        servicos: [
          {
            titulo: 'Design de Sobrancelhas',
            descricao: 'Criação de forma harmoniosa e equilibrada considerando o formato do rosto, olhos e personalidade de cada pessoa.'
          },
          {
            titulo: 'Design com Henna',
            descricao: 'Design completo com aplicação de henna para realçar e definir as sobrancelhas. Cor natural e suave com duração de até 4 semanas.'
          }
        ]
      }
    ]
  },
  {
    id: 'nilce',
    nome: 'Nilce Lopez',
    especialidade: 'Cabelo',
    descricao: 'Especialista em cortes, coloração e tratamentos capilares.',
    destaque: false,
    bio: 'Profissional dedicada à arte capilar, oferecendo cortes modernos, coloração personalizada e tratamentos para saúde dos fios.',
    experiencia: '',
    imagem: '/assets/profissionais/nilce.jpg',
    secaoServicos: [
      {
        categoria: 'Serviços Capilares',
        servicos: [
          {
            titulo: 'Corte Feminino',
            descricao: 'Cortes personalizados que valorizam o formato do rosto e estilo pessoal.'
          },
          {
            titulo: 'Coloração',
            descricao: 'Técnicas de coloração modernas para um visual renovado e natural.'
          },
          {
            titulo: 'Tratamentos Capilares',
            descricao: 'Tratamentos para recuperação e saúde dos fios.'
          }
        ]
      }
    ]
  },
  {
    id: 'zilma',
    nome: 'Zilma Dias',
    especialidade: 'Afrodite',
    descricao: 'Especialista em tratamentos estéticos e bem-estar.',
    destaque: false,
    bio: 'Profissional especializada em cuidados estéticos e protocolos de beleza.',
    experiencia: '',
    imagem: '/assets/profissionais/zilma.jpg',
    secaoServicos: [
      {
        categoria: 'Tratamentos Estéticos',
        servicos: [
          {
            titulo: 'Tratamentos de Beleza',
            descricao: 'Protocolos personalizados para realçar a beleza natural.'
          }
        ]
      }
    ]
  },
  {
    id: 'camila',
    nome: 'Camila Ferraz',
    especialidade: 'Fisioterapeuta',
    descricao: 'Fisioterapeuta especializada em tratamentos corporais e reabilitação estética.',
    destaque: false,
    bio: 'Fisioterapeuta com foco em tratamentos corporais, reabilitação e estética funcional.',
    experiencia: '',
    imagem: '/assets/profissionais/camila.jpg',
    secaoServicos: [
      {
        categoria: 'Fisioterapia Estética',
        servicos: [
          {
            titulo: 'Fisioterapia Dermato-Funcional',
            descricao: 'Tratamentos fisioterapêuticos voltados para estética e funcionalidade corporal.'
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