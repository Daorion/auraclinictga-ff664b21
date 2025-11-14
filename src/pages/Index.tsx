import Header from '@/components/Header';
import SocialButtons from '@/components/SocialButtons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Sparkles, Heart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import auraLogo from '@/assets/aura-logo-new.png';
import clinicHero from '@/assets/clinic-hero-new.jpg';

const Index = () => {
  const services = [
    {
      icon: Heart,
      title: 'Massagens Relaxantes',
      description: 'Massagem tradicional, pedras quentes e escalda-pés para seu bem-estar completo.'
    },
    {
      icon: Sparkles,
      title: 'Tratamentos Faciais',
      description: 'Limpeza profunda, LEDterapia, dermaplaning e revitalização facial.'
    },
    {
      icon: Star,
      title: 'Harmonização',
      description: 'Botox, preenchimentos e harmonização facial e corporal.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-elegant">
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={clinicHero} 
            alt="Aura Clinic - Ambiente elegante e sofisticado" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-hero"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="mb-8">
            <img 
              src={auraLogo} 
              alt="Aura Clinic" 
              className="h-24 md:h-32 w-auto mx-auto mb-6 drop-shadow-2xl"
            />
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 leading-tight">
            Desperte Sua
            <span className="block bg-gradient-to-r from-secondary to-tertiary bg-clip-text text-transparent">
              Beleza Natural
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-12 leading-relaxed max-w-3xl mx-auto">
            Na Aura Clinic, transformamos cuidado em arte. Descubra tratamentos estéticos únicos 
            em Tangará da Serra, onde elegância e bem-estar se encontram.
          </p>
          
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                asChild 
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow hover:shadow-elegant transition-all duration-300 transform hover:scale-105 px-8 py-4 rounded-full text-lg font-semibold"
              >
                <Link to="/profissionais" className="flex items-center space-x-2">
                  <span>Conheça Nossa Equipe</span>
                  <ArrowRight size={20} />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-20 bg-quaternary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
              Nossos Principais Serviços
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Oferecemos uma ampla gama de tratamentos estéticos e terapêuticos 
              para realçar sua beleza natural e promover seu bem-estar.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Card 
                  key={index}
                  className="p-8 text-center hover:shadow-elegant transition-all duration-300 hover:scale-105 bg-card border-tertiary/20"
                >
                  <div className="w-16 h-16 bg-gradient-primary rounded-full mx-auto mb-6 flex items-center justify-center">
                    <IconComponent size={32} className="text-primary-foreground" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-primary mb-4">
                    {service.title}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            Pronta para Transformar Sua Beleza?
          </h2>
          
          <p className="text-xl text-primary-foreground/90 mb-12 max-w-3xl mx-auto">
            Agende seu horário e descubra como podemos realçar sua beleza natural 
            com nossos tratamentos exclusivos e personalizados.
          </p>

          <SocialButtons />
        </div>
      </section>
    </div>
  );
};

export default Index;
