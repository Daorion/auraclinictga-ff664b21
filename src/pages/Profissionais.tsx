import Header from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getProfissionaisBasicos } from '@/data/profissionais';
import teamPhoto from '@/assets/profissionais.jpg';

const Profissionais = () => {
  const profissionais = getProfissionaisBasicos();

  return (
    <div className="min-h-screen bg-gradient-elegant">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Team Photo */}
          <div className="mb-12 rounded-2xl overflow-hidden shadow-elegant max-w-5xl mx-auto">
            <img 
              src={teamPhoto} 
              alt="Equipe Aura Estética" 
              className="w-full h-auto object-cover"
            />
          </div>

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
                  <div className="w-32 h-32 rounded-full mx-auto mb-4 overflow-hidden shadow-lg">
                    <img 
                      src={profissional.imagem} 
                      alt={profissional.nome}
                      className="w-full h-full object-cover"
                    />
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
        </div>
      </main>
    </div>
  );
};

export default Profissionais;