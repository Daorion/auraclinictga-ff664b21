import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SocialButtons from '@/components/SocialButtons';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Award, HeartHandshake, ShieldCheck, Star, Quote } from 'lucide-react';
import { Link } from 'react-router-dom';
import auraLogo from '@/assets/aura-logo-new.png';
import clinicHero from '@/assets/clinic-hero-new.jpg';

const Index = () => {
  const diferenciais = [
    {
      icon: Award,
      titulo: 'Equipe Premiada',
      desc: 'Profissionais com certificações internacionais e décadas de experiência combinada.',
    },
    {
      icon: ShieldCheck,
      titulo: 'Tecnologia de Ponta',
      desc: 'Equipamentos de última geração para resultados visíveis e duradouros.',
    },
    {
      icon: HeartHandshake,
      titulo: 'Atendimento Humanizado',
      desc: 'Cada protocolo é desenhado para você, respeitando sua história e seu tempo.',
    },
    {
      icon: Sparkles,
      titulo: 'Resultados Naturais',
      desc: 'Realçamos sua beleza com técnicas que preservam sua essência única.',
    },
  ];

  const galeria = [
    { titulo: 'Harmonização Facial', categoria: 'Estética Avançada' },
    { titulo: 'Limpeza de Pele', categoria: 'Tratamentos Faciais' },
    { titulo: 'Massagem Modeladora', categoria: 'Corporal' },
    { titulo: 'Micropigmentação', categoria: 'Design Facial' },
    { titulo: 'Lash Design', categoria: 'Olhar' },
    { titulo: 'Drenagem Linfática', categoria: 'Bem-estar' },
  ];

  const depoimentos = [
    {
      nome: 'Mariana S.',
      texto: 'Simplesmente a melhor clínica de Tangará! Ambiente sofisticado, atendimento impecável e profissionais extremamente qualificadas. Saí me sentindo outra mulher.',
      servico: 'Harmonização Facial',
    },
    {
      nome: 'Patrícia L.',
      texto: 'O carinho e o cuidado de toda equipe é único. Cada detalhe é pensado para o bem-estar do cliente. Virei cliente de casa, recomendo de olhos fechados!',
      servico: 'Tratamentos Faciais',
    },
    {
      nome: 'Renata M.',
      texto: 'Lugar lindo, sofisticado e acolhedor. Cada visita é uma experiência completa de beleza e bem-estar. Os resultados falam por si.',
      servico: 'Estética Avançada',
    },
    {
      nome: 'Camila R.',
      texto: 'Estrutura impecável, profissionais qualificadíssimas e resultado surpreendente. A Aura Clinic superou todas as minhas expectativas!',
      servico: 'Bioestimulador',
    },
    {
      nome: 'Juliana A.',
      texto: 'Atendimento de altíssimo nível! Me senti em uma clínica de São Paulo. As profissionais são atualizadíssimas com as melhores técnicas do mercado.',
      servico: 'Botox',
    },
    {
      nome: 'Fernanda B.',
      texto: 'Indico de coração! Equipe atenciosa, ambiente sofisticado e resultados naturais. Não troco a Aura Clinic por nenhuma outra em Tangará.',
      servico: 'Limpeza de Pele',
    },
  ];

  const stats = [
    { numero: '11', label: 'Especialistas' },
    { numero: '10+', label: 'Anos de mercado' },
    { numero: '5K+', label: 'Clientes atendidas' },
    { numero: '50+', label: 'Procedimentos' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={clinicHero} alt="Aura Clinic" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-hero" />
        </div>

        <div className="relative z-10 container mx-auto px-6 py-32">
          <div className="max-w-5xl animate-fade-in">
            <img
              src={auraLogo}
              alt="Aura Clinic"
              className="h-14 md:h-16 w-auto mb-10 drop-shadow-2xl brightness-0 invert opacity-90"
            />

            <div className="flex items-center gap-3 mb-8">
              <span className="h-px w-10 bg-gold" />
              <p className="text-[10px] md:text-xs font-semibold tracking-[0.45em] uppercase text-gold">
                Estética Avançada · Tangará da Serra
              </p>
            </div>

            <h1 className="font-display text-[3.5rem] sm:text-7xl md:text-[6.5rem] lg:text-[8rem] leading-[0.88] text-white uppercase mb-8">
              Beleza que
              <br />
              <span className="text-gold">revela</span> sua
              <br />
              <span className="font-italic-serif normal-case text-white/95">essência</span>
            </h1>

            <p className="text-base md:text-lg text-white/80 mb-12 leading-relaxed max-w-xl font-light">
              Tratamentos exclusivos, equipe especializada e uma experiência sensorial completa.
              Descubra a Aura Clinic — onde cada detalhe é pensado para você.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Button
                asChild
                className="bg-gold hover:bg-gold/90 text-gold-foreground rounded-full px-8 py-6 text-xs font-bold tracking-[0.25em] uppercase transition-all duration-500 shadow-2xl"
              >
                <Link to="/profissionais" className="flex items-center gap-3">
                  <span>Conheça a Equipe</span>
                  <ArrowRight size={16} />
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="text-white hover:bg-white/10 rounded-full px-8 py-6 text-xs font-bold tracking-[0.25em] uppercase border border-white/30"
              >
                <Link to="/servicos" className="flex items-center gap-3">
                  <span>Nossos Serviços</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats overlay */}
          <div className="absolute bottom-12 right-6 hidden lg:flex items-center gap-10 bg-background/10 backdrop-blur-md border border-white/20 px-10 py-6 rounded-full">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <p className="font-display text-3xl text-gold leading-none">{s.numero}</p>
                <p className="text-[9px] tracking-[0.3em] uppercase text-white/70 mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS — mobile */}
      <section className="lg:hidden bg-primary py-12">
        <div className="container mx-auto px-6 grid grid-cols-2 gap-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <p className="font-display text-4xl text-gold leading-none">{s.numero}</p>
              <p className="text-[9px] tracking-[0.3em] uppercase text-primary-foreground/70 mt-2">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DIFERENCIAIS */}
      <section className="py-32 bg-background">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-16 items-end mb-20">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-3 mb-6">
                <span className="h-px w-10 bg-gold" />
                <p className="text-[10px] font-semibold tracking-[0.45em] uppercase text-muted-foreground">
                  Por que Aura Clinic
                </p>
              </div>
              <h2 className="font-display text-5xl md:text-7xl uppercase text-primary leading-[0.9]">
                Excelência em
                <br />
                cada <span className="text-gold">detalhe</span>
                <span className="font-italic-serif normal-case text-primary/80">.</span>
              </h2>
            </div>
            <div className="lg:col-span-5">
              <p className="text-base text-muted-foreground leading-relaxed font-light">
                Mais que uma clínica, somos um espaço dedicado ao seu bem-estar.
                Combinamos ciência, arte e cuidado para entregar resultados que vão além
                do espelho — eles transformam como você se sente.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {diferenciais.map((d, i) => {
              const Icon = d.icon;
              return (
                <div
                  key={i}
                  className="group relative p-8 bg-card border border-border/50 hover:border-gold/40 hover:shadow-elegant transition-all duration-500 rounded-3xl overflow-hidden"
                >
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-gold/5 rounded-full group-hover:bg-gold/10 transition-all duration-700" />
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-6 group-hover:bg-gold/10 group-hover:border-gold/30 transition-all duration-500">
                      <Icon className="w-6 h-6 text-primary group-hover:text-gold transition-colors duration-500" />
                    </div>
                    <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-gold mb-3">
                      0{i + 1}
                    </p>
                    <h3 className="font-display text-xl uppercase text-primary mb-3 leading-tight">
                      {d.titulo}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed font-light">
                      {d.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* GALERIA DE TRATAMENTOS */}
      <section className="py-32 bg-gradient-elegant relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="h-px w-10 bg-gold" />
              <p className="text-[10px] font-semibold tracking-[0.45em] uppercase text-muted-foreground">
                Tratamentos
              </p>
              <span className="h-px w-10 bg-gold" />
            </div>
            <h2 className="font-display text-5xl md:text-7xl uppercase text-primary leading-[0.9]">
              Cuidados <span className="text-gold">premium</span>
              <br />
              <span className="font-italic-serif normal-case text-primary/80">para você</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
            {galeria.map((item, i) => (
              <Link
                key={i}
                to="/servicos"
                className="group relative aspect-[4/5] overflow-hidden rounded-3xl bg-primary/90 hover:shadow-elegant transition-all duration-700"
              >
                <div
                  className="absolute inset-0 opacity-30 group-hover:opacity-50 group-hover:scale-110 transition-all duration-1000 bg-cover bg-center"
                  style={{
                    backgroundImage: `linear-gradient(135deg, hsl(var(--primary)/0.4), hsl(var(--gold)/0.2))`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-transparent" />
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-gold mb-2">
                    {item.categoria}
                  </p>
                  <h3 className="font-display text-xl md:text-2xl uppercase text-primary-foreground leading-tight mb-3">
                    {item.titulo}
                  </h3>
                  <div className="flex items-center gap-2 text-gold opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                    <span className="text-[10px] font-bold tracking-[0.3em] uppercase">Saiba mais</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="py-32 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="h-px w-10 bg-gold" />
              <p className="text-[10px] font-semibold tracking-[0.45em] uppercase text-muted-foreground">
                Depoimentos
              </p>
              <span className="h-px w-10 bg-gold" />
            </div>
            <h2 className="font-display text-5xl md:text-7xl uppercase text-primary leading-[0.9]">
              Histórias que
              <br />
              <span className="font-italic-serif normal-case text-gold">inspiram</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {depoimentos.map((d, i) => (
              <div
                key={i}
                className="group relative p-10 bg-card border border-border/50 rounded-3xl hover:border-gold/40 hover:shadow-elegant transition-all duration-500"
              >
                <Quote className="w-10 h-10 text-gold/30 mb-6" />
                <div className="flex gap-1 mb-5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-gold text-gold" />
                  ))}
                </div>
                <p className="text-base text-foreground leading-relaxed mb-8 font-light italic">
                  "{d.texto}"
                </p>
                <div className="pt-6 border-t border-border/50">
                  <p className="font-display text-base uppercase text-primary">{d.nome}</p>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-gold mt-1">{d.servico}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gold rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gold rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <p className="text-[10px] font-semibold tracking-[0.45em] uppercase text-gold mb-6">
            — Agende sua experiência —
          </p>
          <h2 className="font-display text-5xl md:text-7xl lg:text-8xl uppercase text-primary-foreground mb-8 leading-[0.9]">
            Pronta para
            <br />
            <span className="text-gold">brilhar</span>
            <span className="font-italic-serif normal-case text-primary-foreground">?</span>
          </h2>

          <p className="text-base text-primary-foreground/70 mb-12 max-w-xl mx-auto font-light leading-relaxed">
            Agende seu horário e descubra tratamentos exclusivos, personalizados para você.
          </p>

          <SocialButtons />
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Index;
