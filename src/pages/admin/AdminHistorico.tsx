import { Card } from "@/components/ui/card";
import { History } from "lucide-react";

const AdminHistorico = () => (
  <div className="space-y-6">
    <header>
      <h1 className="text-3xl font-bold tracking-tight">Histórico</h1>
      <p className="text-muted-foreground mt-1">Artes geradas anteriormente</p>
    </header>
    <Card className="p-12 text-center border-dashed">
      <div className="w-14 h-14 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
        <History className="w-6 h-6 text-primary" />
      </div>
      <h2 className="text-xl font-semibold">Disponível com a Fase 2</h2>
      <p className="text-muted-foreground mt-2 max-w-md mx-auto">
        Aqui você verá todas as artes já geradas, podendo baixar, duplicar e reaproveitar.
      </p>
    </Card>
  </div>
);

export default AdminHistorico;
