import { useParams, Navigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageCircle, Phone } from 'lucide-react';
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
      'Tratamento de Emagrecimento': 'bg-gradient-to-br from-violet-100 to-purple-100 text-violet-900 dark:from-violet-900/30 dark:to-purple-900/30 dark:text-violet-200 border-2 border-violet-300 dark:border-violet-700',
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

          {/* Special Hero for Luana */}
          {profissional.id === 'luana' && (
            <div className="mb-12 bg-gradient-to-br from-violet-500 to-purple-600 dark:from-violet-900 dark:to-purple-900 rounded-3xl p-8 md:p-12 shadow-2xl">
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
                        <Card key={serviceIndex} className="col-span-1 md:col-span-2 lg:col-span-3 p-8 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-2 border-violet-300 dark:border-violet-700 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                          <div className="flex flex-col md:flex-row gap-6 items-start">
                            <div className="flex-shrink-0">
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                ⭐
                              </div>
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-3 mb-4">
                                <h3 className="text-2xl font-bold text-violet-900 dark:text-violet-200">
                                  {servico.titulo}
                                </h3>
                                <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0">
                                  Tratamento Premium
                                </Badge>
                                {servico.preco && (
                                  <span className="text-xl font-bold text-violet-700 dark:text-violet-300 bg-white dark:bg-violet-950/50 px-4 py-2 rounded-full shadow-sm">
                                    {servico.preco}
                                  </span>
                                )}
                              </div>
                              
                              <p className="text-muted-foreground leading-relaxed text-base mb-6">
                                {servico.descricao}
                              </p>
                              
                              <Button 
                                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg gap-2"
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