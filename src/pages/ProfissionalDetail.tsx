import { useParams, Navigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, MessageCircle, Phone, Star, HelpCircle, Sparkles, Heart, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getProfissionalById } from '@/data/profissionais';
import sirleiWork1 from '@/assets/sirlei-work1.png';
import sirleiWork2 from '@/assets/sirlei-work2.png';

const ProfissionalDetail = () => {
  const { id } = useParams<{ id: string }>();
  
  if (!id) return <Navigate to="/profissionais" replace />;
  const profissional = getProfissionalById(id);
  if (!profissional) return <Navigate to="/profissionais" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-20">
        <div className="container mx-auto px-6 max-w-4xl">
          {/* Back */}
          <Link to="/profissionais" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10">
            <ArrowLeft size={14} />
            <span>Voltar</span>
          </Link>

          {/* Profile Header */}
          <div className="flex flex-col items-center text-center mb-16">
            <div className="w-28 h-28 rounded-full overflow-hidden mb-6 ring-2 ring-border">
              <img 
                src={profissional.imagem} 
                alt={profissional.nome}
                className="w-full h-full object-cover"
              />
            </div>
            
            {profissional.destaque && (
              <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-primary mb-3">Destaque</p>
            )}
            
            <h1 className="text-4xl md:text-5xl font-semibold text-primary mb-2">
              {profissional.nome}
            </h1>
            
            <p className="text-base text-muted-foreground mb-4">
              {profissional.especialidade}
            </p>
            
            <p className="text-sm text-muted-foreground max-w-lg leading-relaxed mb-4 font-light">
              {profissional.bio}
            </p>
            
            <span className="text-xs font-medium tracking-[0.15em] uppercase text-primary/60">
              {profissional.experiencia}
            </span>
          </div>

          {/* Sirlei Special Section */}
          {profissional.id === 'sirlei' && (
            <div className="mb-16 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl overflow-hidden aspect-[4/3]">
                  <img src={sirleiWork1} alt="Sirlei - massagem terapêutica" className="w-full h-full object-cover" />
                </div>
                <div className="rounded-2xl overflow-hidden aspect-[4/3]">
                  <img src={sirleiWork2} alt="Sirlei - atendimento" className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Sparkles, title: '+30 Técnicas', desc: 'Ampla variedade de tratamentos' },
                  { icon: Heart, title: 'Atendimento Humanizado', desc: 'Cuidado personalizado' },
                  { icon: Shield, title: '10+ Anos', desc: 'Profissional certificada' },
                ].map((item, i) => (
                  <div key={i} className="text-center p-5 rounded-xl bg-card border border-border/50">
                    <item.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                    <p className="text-sm font-semibold text-primary">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Premium Banner - per professional */}
          {(() => {
            const banners: Record<string, { eyebrow: string; title: string; desc: string }> = {
              luana: {
                eyebrow: 'Tratamentos Premium',
                title: 'Transformação com Ciência e Técnica',
                desc: 'Emagrecimento com Tirzepatida e rejuvenescimento facial com Botox. Resultados comprovados.',
              },
              vanessa: {
                eyebrow: 'Estética Avançada',
                title: 'Harmonização Facial e Corporal de Alta Performance',
                desc: 'Botox, preenchimentos, bioestimuladores, lasers e protocolos corporais com técnicas modernas e seguras.',
              },
              sirlei: {
                eyebrow: 'Massoterapia & Estética',
                title: 'Bem-estar e Beleza em Cada Toque',
                desc: 'Mais de 30 técnicas entre massagens relaxantes, terapêuticas, modeladoras e tratamentos faciais e corporais.',
              },
              tatynara: {
                eyebrow: 'Dermopigmentação Premium',
                title: 'Beleza Natural com Alta Performance',
                desc: '12 anos de trajetória, +19 certificações e a exclusiva Royal Exo Therapy — terapia regenerativa folicular pioneira.',
              },
              cleia: {
                eyebrow: 'Cuidado & Modelagem',
                title: 'Corpo e Pele em Equilíbrio',
                desc: 'Massagens terapêuticas, modeladora turbinada e tratamentos estéticos com técnicas diversificadas.',
              },
              simone: {
                eyebrow: 'Unhas & Sobrancelhas',
                title: 'Detalhes que Realçam a sua Beleza',
                desc: 'Alongamento em gel, esmaltação duradoura e design de sobrancelhas personalizado para o seu rosto.',
              },
            };
            const banner = banners[profissional.id];
            if (!banner) return null;
            return (
              <div className="mb-16 rounded-2xl bg-primary p-10 text-center">
                <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-primary-foreground/60 mb-3">{banner.eyebrow}</p>
                <h2 className="text-3xl font-semibold text-primary-foreground mb-3">
                  {banner.title}
                </h2>
                <p className="text-sm text-primary-foreground/70 max-w-lg mx-auto font-light">
                  {banner.desc}
                </p>
              </div>
            );
          })()}

          {/* Services */}
          <div className="space-y-12">
            {profissional.secaoServicos.map((secao, index) => (
              <div key={index}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <h2 className="text-lg font-semibold text-foreground tracking-tight">
                    {secao.categoria}
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {secao.servicos.map((servico, si) => {
                    if (servico.destaque) {
                      return (
                        <div key={si} className="col-span-1 md:col-span-2 p-6 rounded-2xl bg-primary/5 border border-primary/10">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm flex-shrink-0 mt-0.5">
                              ⭐
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-primary">{servico.titulo}</h3>
                                <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-primary bg-primary/10 px-2.5 py-1 rounded-full">Premium</span>
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{servico.descricao}</p>
                              <a
                                href="https://api.whatsapp.com/send/?phone=5565996480484&text&type=phone_number&app_absent=0"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                              >
                                <MessageCircle size={14} />
                                Agende sua Avaliação
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={si} className="p-5 rounded-xl bg-card border border-border/50 hover:border-primary/15 transition-colors">
                        <h3 className="text-base font-semibold text-foreground mb-2">{servico.titulo}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{servico.descricao}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Testimonials - Luana */}
          {profissional.id === 'luana' && (
            <div className="mt-16">
              <div className="text-center mb-8">
                <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-2">Depoimentos</p>
                <h3 className="text-2xl font-semibold text-primary">O que dizem nossos pacientes</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { text: 'Perdi 15kg em 4 meses com o acompanhamento da Luana. O tratamento mudou minha vida!', name: 'P.R.', type: 'Tirzepatida' },
                  { text: 'Resultado incrível e natural! As rugas suavizaram sem perder minha expressão.', name: 'C.M.', type: 'Botox' },
                  { text: 'Profissional extremamente competente e atenciosa. Super recomendo!', name: 'J.A.', type: 'Microagulhamento' },
                ].map((t, i) => (
                  <div key={i} className="p-6 rounded-xl bg-card border border-border/50">
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4 italic">"{t.text}"</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t.name}</p>
                        <div className="flex gap-0.5 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground">{t.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQ Tirzepatida - Luana */}
          {profissional.id === 'luana' && (
            <div className="mt-16">
              <div className="text-center mb-8">
                <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-2">FAQ</p>
                <h3 className="text-2xl font-semibold text-primary">Perguntas sobre Tirzepatida</h3>
              </div>
              
              <Accordion type="single" collapsible className="space-y-2">
                {[
                  { q: 'O que é Tirzepatida (Mounjaro®)?', a: 'A Tirzepatida é um medicamento inovador aprovado pela ANVISA para tratamento da obesidade e diabetes tipo 2. É um agonista duplo dos receptores GIP e GLP-1, que atua reduzindo o apetite, controlando a glicemia e melhorando o metabolismo.' },
                  { q: 'Como funciona o tratamento?', a: 'O medicamento é aplicado via injeção subcutânea semanal. Ele age diretamente nos hormônios que regulam o apetite e a saciedade. Deve ser combinado com dieta equilibrada e exercícios físicos.' },
                  { q: 'Quem pode fazer o tratamento?', a: 'O tratamento é indicado para adultos com IMC acima de 30 ou IMC acima de 27 com comorbidades. É necessária avaliação médica completa antes de iniciar.' },
                  { q: 'Quais são os resultados esperados?', a: 'Em média os pacientes perdem entre 15% a 20% do peso corporal ao longo de 6 a 12 meses, com melhora significativa em exames metabólicos.' },
                  { q: 'O tratamento é seguro?', a: 'Sim, é aprovado pela ANVISA com perfil de segurança comprovado. Os efeitos colaterais mais comuns são leves e diminuem com o tempo.' },
                  { q: 'Preciso de prescrição médica?', a: 'Sim, a Tirzepatida é de prescrição controlada. É obrigatória avaliação com profissional habilitado.' },
                  { q: 'Quanto tempo dura o tratamento?', a: 'Geralmente entre 6 a 12 meses, dependendo dos objetivos individuais e resposta ao medicamento.' },
                  { q: 'Como faço para iniciar?', a: 'Entre em contato para agendar uma avaliação completa com anamnese detalhada e orientações.' },
                ].map((item, i) => (
                  <AccordionItem key={i} value={`tirz-${i}`} className="border border-border/50 rounded-xl px-5 bg-card">
                    <AccordionTrigger className="text-sm font-medium text-left hover:text-primary">{item.q}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}

          {/* FAQ Botox - Luana */}
          {profissional.id === 'luana' && (
            <div className="mt-12">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold text-primary">Perguntas sobre Botox</h3>
              </div>
              
              <Accordion type="single" collapsible className="space-y-2">
                {[
                  { q: 'O que é Botox?', a: 'Botox é o nome comercial da toxina botulínica tipo A, um tratamento estético seguro para suavizar rugas e linhas de expressão.' },
                  { q: 'Como funciona?', a: 'A toxina relaxa temporariamente os músculos faciais responsáveis pelas rugas dinâmicas, deixando a pele mais lisa.' },
                  { q: 'Quais áreas podem ser tratadas?', a: 'Testa, glabela, pés de galinha, linhas de coelho, sorriso gengival, pescoço e rugas ao redor da boca.' },
                  { q: 'O resultado fica natural?', a: 'Sim, quando aplicado por profissional experiente. A ideia é suavizar rugas mantendo a expressão natural.' },
                  { q: 'Quanto tempo dura o efeito?', a: 'Resultados aparecem em 3 a 7 dias e duram de 4 a 6 meses. Com aplicações regulares, o intervalo pode aumentar.' },
                  { q: 'Dói?', a: 'A aplicação é feita com agulhas muito finas e é bem tolerada. Pode haver leve desconforto momentâneo.' },
                  { q: 'Posso fazer para prevenir rugas?', a: 'Sim! O Botox preventivo é recomendado a partir dos 25-30 anos para quem começa a notar as primeiras linhas.' },
                  { q: 'Quais os cuidados após?', a: 'Nas primeiras 4 horas: não deitar, não abaixar a cabeça, não fazer exercícios intensos. Evitar calor excessivo nas primeiras 48h.' },
                ].map((item, i) => (
                  <AccordionItem key={i} value={`botox-${i}`} className="border border-border/50 rounded-xl px-5 bg-card">
                    <AccordionTrigger className="text-sm font-medium text-left hover:text-primary">{item.q}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}

          {/* Contact */}
          <div className="mt-16 text-center p-10 rounded-2xl bg-primary">
            <h3 className="text-2xl font-semibold text-primary-foreground mb-3">
              Agende com {profissional.nome}
            </h3>
            <p className="text-sm text-primary-foreground/60 mb-8 font-light">
              Entre em contato para conhecer mais sobre os tratamentos.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://api.whatsapp.com/send/?phone=5565996480484"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-colors"
              >
                <MessageCircle size={14} />
                WhatsApp
              </a>
              
              <a
                href="tel:+5565996480484"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-white/20 text-white text-sm font-medium hover:bg-white/10 transition-colors"
              >
                <Phone size={14} />
                Ligar
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfissionalDetail;
