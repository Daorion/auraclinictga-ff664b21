import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

const AdminGerador = () => (
  <div className="space-y-6">
    <header>
      <h1 className="text-3xl font-bold tracking-tight">Gerador de Artes</h1>
      <p className="text-muted-foreground mt-1">Crie publicações automáticas com IA</p>
    </header>
    <Card className="p-12 text-center border-dashed">
      <div className="w-14 h-14 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
        <Sparkles className="w-6 h-6 text-primary" />
      </div>
      <h2 className="text-xl font-semibold">Em breve — Fase 2</h2>
      <p className="text-muted-foreground mt-2 max-w-md mx-auto">
        Geração de artes (Story, Post, Carrossel, Flyer) usando IA, com editor para ajustes finais antes de baixar.
      </p>
    </Card>
  </div>
);

export default AdminGerador;
