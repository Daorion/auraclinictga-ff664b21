import Header from '@/components/Header';
import SocialButtons from '@/components/SocialButtons';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import auraLogo from '@/assets/aura-logo-new.png';
import clinicHero from '@/assets/clinic-hero-new.jpg';

const Index = () => {
  const services = [
    {
      title: 'Massagens',
      description: 'Relaxantes, terapêuticas e estéticas para seu bem-estar completo.'
    },
    {
      title: 'Tratamentos Faciais',
      description: 'Limpeza profunda, LEDterapia, dermaplaning e revitalização.'
    },
    {
      title: 'Harmonização',
      description: 'Botox, preenchimentos e harmonização facial e corporal.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={clinicHero} 
            alt="Aura Clinic" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-hero" />
        </div>
        
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto animate-fade-in">
          <img 
            src={auraLogo} 
            alt="Aura Clinic" 
            className="h-16 md:h-20 w-auto mx-auto mb-12 drop-shadow-2xl opacity-95"
          />

          <div className="flex items-center justify-center gap-4 mb-8">
            <span className="h-px w-12 bg-secondary/60" />
            <p className="text-[10px] md:text-xs font-medium tracking-[0.4em] uppercase text-secondary/90">Aura Clinic · Estética Avançada</p>
            <span className="h-px w-12 bg-secondary/60" />
          </div>
          
          <h1 className="font-serif text-6xl md:text-8xl font-light text-white mb-8 leading-[0.95] tracking-tight">
            Desperte sua
            <span className="block italic font-normal text-secondary mt-2">beleza natural</span>
          </h1>
          
          <p className="text-base md:text-lg text-white/75 mb-12 leading-relaxed max-w-lg mx-auto font-light tracking-wide">
            Tratamentos estéticos exclusivos em Tangará da Serra.
            <span className="block mt-1 italic text-white/60">Elegância e bem-estar em cada detalhe.</span>
          </p>
          
          <Button 
            asChild 
            className="bg-transparent backdrop-blur-md border border-white/30 text-white hover:bg-white hover:text-primary rounded-none px-10 py-6 text-[11px] font-medium tracking-[0.3em] uppercase transition-all duration-500"
          >
            <Link to="/profissionais" className="flex items-center gap-4">
              <span>Conheça Nossa Equipe</span>
              <ArrowRight size={14} />
            </Link>
          </Button>
        </div>
      </section>

      {/* Services */}
      <section className="py-24">
        <div className="container mx-auto px-6">
      {/* Services */}
      <section className="py-32 bg-gradient-elegant">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <p className="text-[10px] font-medium tracking-[0.4em] uppercase text-muted-foreground mb-4">— Nossos Serviços —</p>
            <h2 className="font-serif text-5xl md:text-6xl font-light text-primary tracking-tight">
              Cuidados <span className="italic">especializados</span>
            </h2>
            <div className="flex items-center justify-center mt-6">
              <span className="h-px w-16 bg-primary/30" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {services.map((service, index) => (
              <div 
                key={index}
                className="group relative p-10 bg-card/50 backdrop-blur-sm border border-border/40 hover:border-primary/30 transition-all duration-700 hover:-translate-y-1"
              >
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                <p className="font-serif text-5xl font-light text-primary/20 mb-6 italic">
                  0{index + 1}
                </p>
                
                <h3 className="font-serif text-2xl font-normal text-primary mb-4 tracking-tight">
                  {service.title}
                </h3>
                
                <div className="h-px w-8 bg-secondary mb-4 group-hover:w-16 transition-all duration-500" />
                
                <p className="text-sm text-muted-foreground leading-relaxed font-light">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-secondary rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <p className="text-[10px] font-medium tracking-[0.4em] uppercase text-secondary mb-6">— Agende sua experiência —</p>
          <h2 className="font-serif text-4xl md:text-6xl font-light text-primary-foreground mb-6 leading-tight tracking-tight">
            Pronta para transformar
            <span className="block italic text-secondary mt-1">sua beleza?</span>
          </h2>
          
          <p className="text-base text-primary-foreground/70 mb-12 max-w-xl mx-auto font-light leading-relaxed">
            Agende seu horário e descubra tratamentos exclusivos e personalizados.
          </p>

          <SocialButtons />
        </div>
      </section>
    </div>
  );
};

export default Index;
