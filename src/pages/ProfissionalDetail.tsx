import { useParams, Navigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, MessageCircle, Phone, Star, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getProfissionalById } from '@/data/profissionais';

const ProfissionalDetail = () => {
  const { id } = useParams<{ id: string }>();
  
  if (!id) {
    return <Navigate to="/profissionais" replace />;
  }

  const profissional = getProfissionalById(id);

  if (!profissional) {
    return <Navigate to="/profissionais" replace />;
  }

  const getCategoryColor = (categoria: string) => {
    const colorMap: { [key: string]: string } = {
      'Massagens Relaxantes': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      'Massagens Terapêuticas': 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-300',
      'Massagens Estéticas': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300',
      'Tratamentos Faciais': 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300',
      'Tratamentos Corporais': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      'Tratamentos Corporais com Aparelhos e Técnicas Avançadas': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300',
      'Tratamentos Corporais Avançados': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300',
      'Tratamentos Estéticos': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300',
      'Tratamentos de Rejuvenescimento': 'bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-300',
      'Tratamento de Emagrecimento': 'bg-gradient-to-br from-rose-100 to-red-100 text-red-900 dark:from-rose-950/40 dark:to-red-950/40 dark:text-rose-200 border-2 border-rose-400 dark:border-rose-700',
      'Unhas em Gel': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
      'Harmonização Facial': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
      'Harmonização Estética': 'bg-violet-100 text-violet-800 dark:bg-violet-900/20 dark:text-violet-300',
      'Design de Sobrancelhas': 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
      'Extensão de Cílios': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-300'
    };
    return colorMap[categoria] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
  };

  return (
    <div className="min-h-screen bg-gradient-elegant">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <div className="mb-8">
            <Link to="/profissionais">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar para Profissionais
              </Button>
            </Link>
          </div>


          {/* Professional Header */}
          <div className="text-center mb-12">
            <div className="w-40 h-40 rounded-full mx-auto mb-6 overflow-hidden shadow-elegant ring-4 ring-primary/20">
              <img 
                src={profissional.imagem} 
                alt={profissional.nome}
                className="w-full h-full object-cover"
              />
            </div>
            
            {profissional.destaque && (
              <Badge className="mb-4 bg-primary text-primary-foreground">
                Profissional Destaque
              </Badge>
            )}
            
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
              {profissional.nome}
            </h1>
            
            <h2 className="text-2xl text-secondary font-semibold mb-4">
              {profissional.especialidade}
            </h2>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-6">
              {profissional.bio}
            </p>
            
            <div className="inline-block bg-card rounded-lg px-4 py-2 shadow-sm">
              <span className="text-sm font-semibold text-primary">
                {profissional.experiencia}
              </span>
            </div>
          </div>

          {/* Special Hero for Luana - moved here after experience */}
          {profissional.id === 'luana' && (
            <div className="mb-12 bg-gradient-to-br from-rose-700 to-red-800 dark:from-rose-900 dark:to-red-950 rounded-3xl p-8 md:p-12 shadow-2xl">
              <div className="text-center text-white">
                <div className="inline-block mb-4">
                  <Badge className="bg-white/20 text-white border-white/30 text-sm px-4 py-2">
                    ⭐ Tratamentos Premium
                  </Badge>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Transformação Real com Ciência e Técnica
                </h2>
                <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto">
                  Emagrecimento eficaz com Tirzepatida e rejuvenescimento facial com Botox. Resultados comprovados e acompanhamento personalizado.
                </p>
              </div>
            </div>
          )}

          {/* Services Sections */}
          <div className="space-y-12">
            {profissional.secaoServicos.map((secao, index) => (
              <div key={index} className="bg-card rounded-2xl p-8 shadow-card-elegant">
                <div className="flex items-center gap-3 mb-8">
                  <Badge className={getCategoryColor(secao.categoria)}>
                    {secao.categoria}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {secao.servicos.map((servico, serviceIndex) => {
                    // Special card for featured services (Tirzepatida)
                    if (servico.destaque) {
                      return (
                        <Card key={serviceIndex} className="col-span-1 md:col-span-2 lg:col-span-3 p-8 bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30 border-2 border-rose-400 dark:border-rose-700 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                          <div className="flex flex-col md:flex-row gap-6 items-start">
                            <div className="flex-shrink-0">
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-700 to-red-800 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                ⭐
                              </div>
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-3 mb-4">
                                <h3 className="text-2xl font-bold text-red-900 dark:text-rose-200">
                                  {servico.titulo}
                                </h3>
                                <Badge className="bg-gradient-to-r from-rose-700 to-red-800 text-white border-0">
                                  Tratamento Premium
                                </Badge>
                                {servico.preco && (
                                  <span className="text-xl font-bold text-red-800 dark:text-rose-300 bg-white dark:bg-rose-950/50 px-4 py-2 rounded-full shadow-sm">
                                    {servico.preco}
                                  </span>
                                )}
                              </div>
                              
                              <p className="text-muted-foreground leading-relaxed text-base mb-6">
                                {servico.descricao}
                              </p>
                              
                              <Button 
                                className="bg-gradient-to-r from-rose-700 to-red-800 hover:from-rose-800 hover:to-red-900 text-white shadow-lg gap-2"
                                onClick={() => window.open('https://api.whatsapp.com/send/?phone=5565996480484&text&type=phone_number&app_absent=0', '_blank')}
                              >
                                <MessageCircle className="w-4 h-4" />
                                Agende sua Avaliação
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    }
                    
                    // Regular service card
                    return (
                      <Card key={serviceIndex} className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-lg font-bold text-primary">
                            {servico.titulo}
                          </h3>
                          {servico.preco && (
                            <span className="text-lg font-bold text-secondary bg-tertiary/30 px-3 py-1 rounded-full">
                              {servico.preco}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-muted-foreground leading-relaxed">
                          {servico.descricao}
                        </p>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Testimonials Section - Only for Luana */}
          {profissional.id === 'luana' && (
            <div className="mt-16">
              <div className="bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/20 dark:to-red-950/20 rounded-2xl p-8 shadow-card-elegant border border-rose-200 dark:border-rose-800">
                <div className="text-center mb-10">
                  <div className="inline-flex items-center gap-2 mb-4">
                    <Star className="w-6 h-6 text-rose-700 dark:text-rose-400 fill-rose-700 dark:fill-rose-400" />
                    <h3 className="text-3xl font-bold text-primary">Depoimentos</h3>
                    <Star className="w-6 h-6 text-rose-700 dark:text-rose-400 fill-rose-700 dark:fill-rose-400" />
                  </div>
                  <p className="text-muted-foreground">O que nossos pacientes dizem sobre os tratamentos</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Testimonial 1 - Tirzepatida */}
                  <Card className="p-6 bg-white dark:bg-card hover:shadow-xl transition-shadow">
                    <div className="mb-4">
                      <div className="text-4xl text-rose-700 dark:text-rose-400 mb-2">"</div>
                      <p className="text-muted-foreground leading-relaxed">
                        Perdi 15kg em 4 meses com o acompanhamento da Luana. O tratamento mudou minha vida! Além da perda de peso, me sinto mais disposta e saudável.
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <p className="font-semibold text-primary">P.R.</p>
                        <div className="flex gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
                        Tirzepatida
                      </Badge>
                    </div>
                  </Card>

                  {/* Testimonial 2 - Botox */}
                  <Card className="p-6 bg-white dark:bg-card hover:shadow-xl transition-shadow">
                    <div className="mb-4">
                      <div className="text-4xl text-rose-700 dark:text-rose-400 mb-2">"</div>
                      <p className="text-muted-foreground leading-relaxed">
                        Resultado incrível e natural! As rugas suavizaram sem perder minha expressão. A Luana tem mão de fada e muito profissionalismo.
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <p className="font-semibold text-primary">C.M.</p>
                        <div className="flex gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <Badge className="bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300">
                        Botox
                      </Badge>
                    </div>
                  </Card>

                  {/* Testimonial 3 - General */}
                  <Card className="p-6 bg-white dark:bg-card hover:shadow-xl transition-shadow">
                    <div className="mb-4">
                      <div className="text-4xl text-rose-700 dark:text-rose-400 mb-2">"</div>
                      <p className="text-muted-foreground leading-relaxed">
                        Profissional extremamente competente e atenciosa. Explica tudo com detalhes e me sinto segura em cada sessão. Super recomendo!
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <p className="font-semibold text-primary">J.A.</p>
                        <div className="flex gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300">
                        Microagulhamento
                      </Badge>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* FAQ Tirzepatida - Only for Luana */}
          {profissional.id === 'luana' && (
            <div className="mt-16">
              <div className="bg-card rounded-2xl p-8 shadow-card-elegant">
                <div className="flex items-center justify-center gap-3 mb-8">
                  <HelpCircle className="w-8 h-8 text-rose-700 dark:text-rose-400" />
                  <h3 className="text-3xl font-bold text-primary">Perguntas Frequentes sobre Tirzepatida</h3>
                  <Badge className="bg-gradient-to-r from-rose-700 to-red-800 text-white">Premium</Badge>
                </div>
                
                <Accordion type="single" collapsible className="w-full space-y-4">
                  <AccordionItem value="item-1" className="border rounded-lg px-6 bg-muted/30">
                    <AccordionTrigger className="text-left font-semibold hover:text-rose-700 dark:hover:text-rose-400">
                      O que é Tirzepatida (Mounjaro®)?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      A Tirzepatida é um medicamento inovador aprovado pela ANVISA para tratamento da obesidade e diabetes tipo 2. É um agonista duplo dos receptores GIP e GLP-1, que atua reduzindo o apetite, controlando a glicemia e melhorando o metabolismo. Estudos clínicos demonstram perda de peso de até 20% do peso corporal total.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2" className="border rounded-lg px-6 bg-muted/30">
                    <AccordionTrigger className="text-left font-semibold hover:text-rose-700 dark:hover:text-rose-400">
                      Como funciona o tratamento?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      O medicamento é aplicado via injeção subcutânea semanal. Ele age diretamente nos hormônios que regulam o apetite e a saciedade, fazendo com que você se sinta satisfeito(a) mais rapidamente e por mais tempo. Deve ser combinado com dieta equilibrada e exercícios físicos para resultados otimizados.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3" className="border rounded-lg px-6 bg-muted/30">
                    <AccordionTrigger className="text-left font-semibold hover:text-rose-700 dark:hover:text-rose-400">
                      Quem pode fazer o tratamento?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      O tratamento é indicado para adultos com IMC acima de 30 (obesidade) ou IMC acima de 27 com comorbidades relacionadas ao peso (como hipertensão, diabetes tipo 2, colesterol alto). É necessária avaliação médica completa antes de iniciar.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4" className="border rounded-lg px-6 bg-muted/30">
                    <AccordionTrigger className="text-left font-semibold hover:text-rose-700 dark:hover:text-rose-400">
                      Quais são os resultados esperados?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Os resultados variam de pessoa para pessoa, mas em média os pacientes perdem entre 15% a 20% do peso corporal ao longo de 6 a 12 meses de tratamento. Além da perda de peso, há melhora significativa em exames metabólicos, disposição e qualidade de vida.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-5" className="border rounded-lg px-6 bg-muted/30">
                    <AccordionTrigger className="text-left font-semibold hover:text-rose-700 dark:hover:text-rose-400">
                      O tratamento é seguro? Quais os efeitos colaterais?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Sim, o tratamento é aprovado pela ANVISA e possui perfil de segurança comprovado. Os efeitos colaterais mais comuns são náuseas, diarreia e constipação, que geralmente são leves e diminuem com o tempo. O acompanhamento profissional garante que o tratamento seja feito de forma segura e personalizada.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-6" className="border rounded-lg px-6 bg-muted/30">
                    <AccordionTrigger className="text-left font-semibold hover:text-rose-700 dark:hover:text-rose-400">
                      Preciso de prescrição médica?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Sim, a Tirzepatida é um medicamento de prescrição controlada. É obrigatória a avaliação com profissional habilitado, que irá avaliar seu histórico médico, realizar exames e prescrever o medicamento caso você seja candidato(a).
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-7" className="border rounded-lg px-6 bg-muted/30">
                    <AccordionTrigger className="text-left font-semibold hover:text-rose-700 dark:hover:text-rose-400">
                      Quanto tempo dura o tratamento?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      O tratamento geralmente dura entre 6 a 12 meses, dependendo dos objetivos individuais e resposta ao medicamento. Após atingir o peso desejado, pode-se manter com doses menores ou estratégias de manutenção conforme orientação profissional.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-8" className="border rounded-lg px-6 bg-muted/30">
                    <AccordionTrigger className="text-left font-semibold hover:text-rose-700 dark:hover:text-rose-400">
                      Como faço para iniciar?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Entre em contato para agendar uma avaliação completa. Nesta consulta, será realizada anamnese detalhada, avaliação de exames (se necessário solicitar novos), discussão de expectativas e, sendo candidato(a), prescrição e orientações para início do tratamento.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          )}

          {/* FAQ Botox - Only for Luana */}
          {profissional.id === 'luana' && (
            <div className="mt-16">
              <div className="bg-card rounded-2xl p-8 shadow-card-elegant">
                <div className="flex items-center justify-center gap-3 mb-8">
                  <HelpCircle className="w-8 h-8 text-pink-600 dark:text-pink-400" />
                  <h3 className="text-3xl font-bold text-primary">Perguntas Frequentes sobre Botox</h3>
                </div>
                
                <Accordion type="single" collapsible className="w-full space-y-4">
                  <AccordionItem value="botox-1" className="border rounded-lg px-6 bg-muted/30">
                    <AccordionTrigger className="text-left font-semibold hover:text-pink-600 dark:hover:text-pink-400">
                      O que é Botox (Toxina Botulínica)?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Botox é o nome comercial da toxina botulínica tipo A, um tratamento estético seguro e amplamente utilizado para suavizar rugas e linhas de expressão. É o procedimento não cirúrgico mais realizado no mundo para rejuvenescimento facial.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="botox-2" className="border rounded-lg px-6 bg-muted/30">
                    <AccordionTrigger className="text-left font-semibold hover:text-pink-600 dark:hover:text-pink-400">
                      Como funciona o Botox?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      A toxina botulínica age relaxando temporariamente os músculos faciais responsáveis pela formação de rugas dinâmicas (aquelas que aparecem quando você sorri, franze a testa, etc.). Com os músculos relaxados, a pele fica mais lisa e as rugas são suavizadas.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="botox-3" className="border rounded-lg px-6 bg-muted/30">
                    <AccordionTrigger className="text-left font-semibold hover:text-pink-600 dark:hover:text-pink-400">
                      Quais áreas podem ser tratadas?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      As áreas mais comuns são: testa (linhas horizontais), glabela (entre as sobrancelhas - "franzido"), pés de galinha (ao redor dos olhos), linhas de coelho (nariz), sorriso gengival, pescoço (bandas platismais) e rugas ao redor da boca.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="botox-4" className="border rounded-lg px-6 bg-muted/30">
                    <AccordionTrigger className="text-left font-semibold hover:text-pink-600 dark:hover:text-pink-400">
                      O resultado fica natural ou congelado?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Quando aplicado por profissional experiente, o resultado é natural e harmonioso. A ideia é suavizar as rugas mantendo a expressão facial, não "congelar" o rosto. A técnica de aplicação e a dosagem são fundamentais para resultados elegantes.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="botox-5" className="border rounded-lg px-6 bg-muted/30">
                    <AccordionTrigger className="text-left font-semibold hover:text-pink-600 dark:hover:text-pink-400">
                      Quanto tempo dura o efeito?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Os resultados começam a aparecer entre 3 a 7 dias após a aplicação e duram em média de 4 a 6 meses. Com aplicações regulares, a musculatura "aprende" a relaxar e o intervalo entre as aplicações pode aumentar.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="botox-6" className="border rounded-lg px-6 bg-muted/30">
                    <AccordionTrigger className="text-left font-semibold hover:text-pink-600 dark:hover:text-pink-400">
                      O procedimento dói?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      A aplicação é feita com agulhas muito finas e é bem tolerada pela maioria dos pacientes. Pode haver um leve desconforto momentâneo, mas não é necessária anestesia. Algumas clínicas oferecem anestésico tópico para maior conforto.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="botox-7" className="border rounded-lg px-6 bg-muted/30">
                    <AccordionTrigger className="text-left font-semibold hover:text-pink-600 dark:hover:text-pink-400">
                      Tem efeitos colaterais?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Efeitos colaterais graves são raros. Os mais comuns são leves e temporários: pequenos hematomas no local da aplicação, leve dor de cabeça nas primeiras 24h. Importante seguir todas as orientações pós-procedimento para evitar complicações.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="botox-8" className="border rounded-lg px-6 bg-muted/30">
                    <AccordionTrigger className="text-left font-semibold hover:text-pink-600 dark:hover:text-pink-400">
                      Posso fazer Botox para prevenir rugas?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Sim! O Botox preventivo é altamente recomendado para pessoas a partir dos 25-30 anos que começam a notar as primeiras linhas de expressão. Prevenir é mais fácil do que tratar rugas já instaladas profundamente na pele.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="botox-9" className="border rounded-lg px-6 bg-muted/30">
                    <AccordionTrigger className="text-left font-semibold hover:text-pink-600 dark:hover:text-pink-400">
                      Quais são os cuidados após a aplicação?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Nas primeiras 4 horas: não deitar, não abaixar a cabeça, não fazer exercícios intensos, não massagear a área. Nas primeiras 24-48 horas: evitar exposição ao calor excessivo (sauna, sol intenso), bebidas alcoólicas e exercícios físicos intensos.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="botox-10" className="border rounded-lg px-6 bg-muted/30">
                    <AccordionTrigger className="text-left font-semibold hover:text-rose-700 dark:hover:text-rose-400">
                      Como faço para agendar?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Entre em contato via WhatsApp ou telefone para agendar uma avaliação. Durante a consulta, será feita análise facial detalhada, explicação do procedimento, esclarecimento de dúvidas e, se desejar, a aplicação pode ser feita no mesmo dia.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          )}

          {/* Contact Section */}
          <div className="mt-16 text-center">
            <div className="bg-card rounded-2xl p-8 shadow-card-elegant">
              <h3 className="text-2xl font-bold text-primary mb-6">
                Agende seu horário com {profissional.nome}
              </h3>
              
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                Entre em contato para agendar uma consulta e conhecer mais sobre os tratamentos oferecidos.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  className="gap-2"
                  onClick={() => window.open('https://api.whatsapp.com/send/?phone=5565996480484&text&type=phone_number&app_absent=0', '_blank')}
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp da Clínica
                </Button>
                
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => window.open('tel:+5565996480484', '_blank')}
                >
                  <Phone className="w-4 h-4" />
                  Ligar para a Clínica
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfissionalDetail;