import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getProfissionaisBasicos } from '@/data/profissionais';
import teamPhoto from '@/assets/profissionais.jpg';

const Profissionais = () => {
  const profissionais = getProfissionaisBasicos();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-20">
        <div className="container mx-auto px-6">
          {/* Team Photo */}
          <div className="mb-16 rounded-2xl overflow-hidden max-w-4xl mx-auto">
            <img 
              src={teamPhoto} 
              alt="Equipe Aura Estética" 
              className="w-full h-auto object-cover"
            />
          </div>

          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-3">Nossa Equipe</p>
            <h1 className="text-4xl md:text-5xl font-semibold text-primary mb-4">
              Especialistas em Beleza
            </h1>
            <p className="text-base text-muted-foreground max-w-xl mx-auto font-light">
              Profissionais qualificados e dedicados ao seu bem-estar.
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {profissionais.map((profissional, index) => (
              <Link 
                key={index} 
                to={`/profissional/${profissional.id}`}
                className="group"
              >
                <div className={`rounded-2xl overflow-hidden bg-card border border-border/50 hover:border-primary/20 hover:shadow-elegant transition-all duration-300 ${
                  profissional.destaque ? 'ring-1 ring-primary/20' : ''
                }`}>
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img 
                      src={profissional.imagem} 
                      alt={profissional.nome}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  
                  <div className="p-6">
                    {profissional.destaque && (
                      <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-primary mb-2">Destaque</p>
                    )}
                    
                    <h3 className="text-xl font-semibold text-primary mb-1">
                      {profissional.nome}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground mb-4">
                      {profissional.especialidade}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs font-medium text-primary group-hover:gap-3 transition-all">
                      <span>Ver Serviços</span>
                      <ArrowRight size={12} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profissionais;
