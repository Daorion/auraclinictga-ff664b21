import Header from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getProfissionaisBasicos } from '@/data/profissionais';

const Profissionais = () => {
  const profissionais = getProfissionaisBasicos();

  const precos = [
    {
      profissional: 'Nadja (Design de Sobrancelhas)',
      servicos: [
        { nome: 'Henna', preco: 'R$ 35' },
        { nome: 'Design sem Henna', preco: 'R$ 50' },
        { nome: 'Design com Henna', preco: 'R$ 60' },
        { nome: 'Brow Lamination', preco: 'R$ 120' },
        { nome: 'Micropigmentação', preco: 'R$ 200' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-elegant">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
              Nossa Equipe de Especialistas
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Conheça nossos profissionais altamente qualificados, dedicados a proporcionar 
              os melhores tratamentos estéticos e de bem-estar.
            </p>
          </div>

          {/* Professionals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {profissionais.map((profissional, index) => (
              <Card 
                key={index} 
                className={`p-6 hover:shadow-elegant transition-all duration-300 hover:scale-105 ${
                  profissional.destaque 
                    ? 'ring-2 ring-primary bg-gradient-to-br from-quaternary to-tertiary' 
                    : 'bg-card'
                }`}
              >
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary-foreground">
                      {profissional.nome.charAt(0)}
                    </span>
                  </div>
                  
                  {profissional.destaque && (
                    <div className="inline-block bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold mb-3">
                      Destaque
                    </div>
                  )}
                  
                  <h3 className="text-xl font-bold text-primary mb-2">
                    {profissional.nome}
                  </h3>
                  
                  <h4 className="text-secondary font-semibold mb-3">
                    {profissional.especialidade}
                  </h4>
                  
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    {profissional.descricao}
                  </p>
                  
                  <Link to={`/profissional/${profissional.id}`}>
                    <Button className="w-full gap-2 group">
                      Ver Serviços
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          {/* Pricing Section */}
          <div className="bg-card rounded-2xl p-8 shadow-card-elegant">
            <h2 className="text-3xl font-bold text-primary text-center mb-8">
              Preços Oficiais
            </h2>
            
            {precos.map((preco, index) => (
              <div key={index} className="mb-6">
                <h3 className="text-xl font-bold text-secondary mb-4">
                  {preco.profissional}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {preco.servicos.map((servico, serviceIndex) => (
                    <div 
                      key={serviceIndex}
                      className="flex justify-between items-center p-4 bg-tertiary/30 rounded-lg"
                    >
                      <span className="font-medium text-foreground">
                        {servico.nome}
                      </span>
                      <span className="font-bold text-primary">
                        {servico.preco}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            <p className="text-center text-muted-foreground mt-6 italic">
              Para consultar preços de outros serviços, entre em contato conosco.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profissionais;