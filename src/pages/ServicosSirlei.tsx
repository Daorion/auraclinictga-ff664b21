import Header from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ServicosSirlei = () => {
  const serviceSections = [
    {
      category: 'Massagens Relaxantes',
      services: [
        {
          title: 'Massagem Relaxante Tradicional',
          description: 'Uma experiência para desligar o mundo e reconectar com você. A massagem relaxante tradicional utiliza movimentos suaves e contínuos que aliviam tensões, reduzem o estresse e promovem bem-estar imediato. Ideal para quem busca momentos de paz em meio à rotina.'
        },
        {
          title: 'Massagem com Pedras Quentes',
          description: 'Aliando o toque das mãos ao calor das pedras vulcânicas, essa técnica promove relaxamento profundo, melhora a circulação e reduz dores musculares. Uma verdadeira terapia que aquece o corpo e acalma a mente.'
        },
        {
          title: 'Escalda-pés com Manobras Relaxantes',
          description: 'Um cuidado especial que começa pelos pés. Banho morno com ervas e sais relaxantes, seguido de manobras manuais que aliviam o cansaço, melhoram a circulação e proporcionam leveza ao corpo inteiro.'
        }
      ]
    },
    {
      category: 'Massagens Terapêuticas',
      services: [
        {
          title: 'Liberação Miofascial',
          description: 'Indicado para quem sofre com dores crônicas e tensões musculares profundas. A técnica atua nas fáscias (tecidos que envolvem os músculos), liberando pontos de tensão e melhorando a mobilidade com efeitos duradouros.'
        },
        {
          title: 'Drenagem Linfática Manual',
          description: 'Movimentos suaves, lentos e rítmicos que ativam o sistema linfático, combatendo inchaços, retenção de líquidos e toxinas. Ideal para quem busca leveza, definição e bem-estar corporal.'
        },
        {
          title: 'Massagem Pré-operatória',
          description: 'Prepara o corpo para cirurgias, ativando a circulação e reduzindo edemas. É um cuidado essencial para otimizar a recuperação e favorecer melhores resultados no pós-operatório.'
        },
        {
          title: 'Massagem Pós-operatória',
          description: 'Com técnicas específicas e toques controlados, essa massagem acelera a recuperação, reduz edemas e hematomas, e promove conforto no período de cicatrização. Um suporte profissional essencial no processo de cura.'
        },
        {
          title: 'Aplicação de Bandagem Elástica (Tape)',
          description: 'As bandagens terapêuticas auxiliam na redução de dores, melhora postural, suporte muscular e drenagem de líquidos. São aplicadas estrategicamente conforme a necessidade individual, com resultados visíveis já nas primeiras aplicações.'
        }
      ]
    },
    {
      category: 'Massagens Estéticas',
      services: [
        {
          title: 'Drenagem Modeladora',
          description: 'A união da drenagem linfática com toques mais firmes que modelam o corpo. Estimula a eliminação de líquidos e ativa a circulação, ajudando na definição corporal com conforto.'
        },
        {
          title: 'Dreno Modeladora',
          description: 'Técnica que une a drenagem profunda com movimentos intensos e ritmados, focando em reduzir medidas, melhorar o contorno corporal e estimular o metabolismo de forma natural.'
        },
        {
          title: 'Massagem Modeladora',
          description: 'Movimentos intensos e firmes que agem diretamente na gordura localizada e celulite. Ideal para quem busca definição corporal, melhora da textura da pele e sensação de leveza.'
        },
        {
          title: 'Massagem Turbinada',
          description: 'A versão intensa da modeladora. Utiliza acessórios e movimentos potentes que ativam a circulação, quebram gordura localizada e promovem resultados visíveis em poucas sessões.'
        },
        {
          title: 'Massagem Circulatória',
          description: 'Técnica focada em melhorar a circulação sanguínea, trazendo alívio para pernas cansadas, sensação de inchaço e cansaço corporal. Perfeita para dias puxados ou para quem passa muito tempo em pé.'
        },
        {
          title: 'Detox Corporal',
          description: 'Uma verdadeira faxina no organismo. Combina esfoliação, aplicação de ativos desintoxicantes e manobras que estimulam o sistema linfático. Renova a pele e proporciona uma sensação incrível de leveza e purificação.'
        }
      ]
    },
    {
      category: 'Tratamentos Faciais',
      services: [
        {
          title: 'Limpeza de Pele Profunda',
          description: 'Mais do que estética: é cuidado com a saúde da sua pele. A limpeza profunda remove cravos, impurezas e células mortas, desobstrui poros e deixa a pele mais saudável, viçosa e pronta para absorver tratamentos. Ideal para quem deseja uma pele renovada e equilibrada.'
        },
        {
          title: 'LEDterapia',
          description: 'Tecnologia a favor da sua beleza. A luz de LED atua em diferentes camadas da pele, tratando acne, manchas, sinais do tempo e estimulando o colágeno. É segura, indolor e personalizada para cada tipo de necessidade.'
        },
        {
          title: 'Dermaplaning',
          description: 'Um tratamento que deixa a pele com toque de seda. A técnica remove as células mortas e os pelos finos do rosto (penugens), proporcionando uma pele lisa, iluminada e com melhor absorção de cosméticos. Resultado imediato e incrível.'
        },
        {
          title: 'Revitalização Facial',
          description: 'Indicado para peles cansadas, opacas ou desidratadas. Une ativos específicos com técnicas de aplicação que estimulam o colágeno, renovam as células e devolvem o brilho natural da pele. Ideal para um efeito glow e aparência descansada.'
        },
        {
          title: 'Hidragloss',
          description: 'Hidratação intensa e brilho natural para os lábios. O tratamento nutre profundamente, define o contorno labial e realça a cor natural da boca, deixando um efeito "gloss" saudável, macio e irresistível. Sensação de boca renovada já na primeira aplicação.'
        }
      ]
    },
    {
      category: 'Tratamentos Corporais com Aparelhos',
      services: [
        {
          title: 'Radiofrequência',
          description: 'Tecnologia que aquece as camadas mais profundas da pele para estimular a produção de colágeno. Combate a flacidez, melhora a textura da pele e trata celulites de forma eficaz, sem dor ou tempo de recuperação.'
        },
        {
          title: 'Corrente Russa',
          description: 'Aparelho de eletroestimulação que tonifica a musculatura, melhora a firmeza da pele e auxilia no ganho de definição muscular. Ideal para quem quer complementar os treinos ou acelerar os resultados estéticos.'
        },
        {
          title: 'Corrente Aussie',
          description: 'Estímulo muscular profundo com foco em fortalecimento e definição. Age como uma academia localizada nos pontos certos do corpo, ideal para potencializar os treinos e definir regiões específicas com eficiência.'
        },
        {
          title: 'Ultrassom',
          description: 'Combate à gordura localizada com resultados visíveis. As ondas ultrassônicas penetram nas camadas de gordura, fragmentando-as para serem eliminadas naturalmente pelo organismo. Tratamento indolor, eficaz e não invasivo.'
        },
        {
          title: 'Criomodelagem',
          description: 'A união do frio e da estética. A técnica utiliza crioterapia (baixas temperaturas) para tratar gordura localizada, promovendo quebra de adipócitos e remodelação do contorno corporal. Ideal para quem busca redução de medidas com tecnologia segura.'
        },
        {
          title: 'Terapias Combinadas',
          description: 'Para resultados mais potentes e personalizados. Combinação estratégica de técnicas manuais e aparelhos, definidas após avaliação, para tratar diversos objetivos ao mesmo tempo: flacidez, gordura localizada, celulite e mais.'
        },
        {
          title: 'Intradermoterapia Corporal',
          description: 'Aplicação de ativos diretamente na camada onde o problema está. Utiliza microinjeções para tratar gordura localizada, flacidez e celulite com mais precisão e resultados rápidos. Procedimento feito com segurança e acompanhamento profissional.'
        },
        {
          title: 'Remodelação Glútea com Intradermoterapia',
          description: 'Técnica exclusiva para quem busca firmeza e volume na região dos glúteos. São aplicados ativos específicos para estimular o colágeno, melhorar o tônus e realçar a forma natural dos glúteos com mais harmonia.'
        },
        {
          title: 'PAMP – Protocolo Avançado para Glúteos',
          description: 'Protocolo completo que une eletroestimulação, técnicas manuais, ativos firmadores e estratégias personalizadas. Ideal para elevar, firmar e modelar os glúteos com naturalidade e resultados consistentes. Um verdadeiro upgrade na autoestima.'
        }
      ]
    }
  ];

  const getCategoryColor = (category: string) => {
    const colors = {
      'Massagens Relaxantes': 'bg-gradient-to-r from-green-100 to-green-200 text-green-800',
      'Massagens Terapêuticas': 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800',
      'Massagens Estéticas': 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800',
      'Tratamentos Faciais': 'bg-gradient-to-r from-pink-100 to-pink-200 text-pink-800',
      'Tratamentos Corporais com Aparelhos': 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-elegant">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
              Serviços da Sirlei
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Especialista em massoterapia e tratamentos estéticos, Sirlei oferece uma ampla 
              gama de serviços para seu bem-estar e beleza.
            </p>
          </div>

          {/* Services Sections */}
          <div className="space-y-16">
            {serviceSections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <div className="flex items-center justify-center mb-8">
                  <Badge className={`px-6 py-2 text-lg font-semibold ${getCategoryColor(section.category)}`}>
                    {section.category}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {section.services.map((service, serviceIndex) => (
                    <Card 
                      key={serviceIndex}
                      className="p-6 hover:shadow-elegant transition-all duration-300 hover:scale-105 bg-card"
                    >
                      <h3 className="text-xl font-bold text-primary mb-4">
                        {service.title}
                      </h3>
                      
                      <p className="text-muted-foreground leading-relaxed">
                        {service.description}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="mt-16 text-center">
            <Card className="p-8 bg-gradient-to-br from-quaternary to-tertiary shadow-card-elegant">
              <h2 className="text-3xl font-bold text-primary mb-4">
                Agende Sua Sessão
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Entre em contato para agendar seu horário e conhecer melhor nossos tratamentos.
              </p>
              <a 
                href="https://wa.me/5565996480484"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-4 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-elegant hover:shadow-glow"
              >
                Chamar no WhatsApp
              </a>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ServicosSirlei;