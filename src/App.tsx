import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Profissionais from "./pages/Profissionais";
import ProfissionalDetail from "./pages/ProfissionalDetail";
import Servicos from "./pages/Servicos";
import ServicosVitrine from "./pages/ServicosVitrine";
import Servicos3 from "./pages/Servicos3";
import Servicos4 from "./pages/Servicos4";
import Servicos5 from "./pages/Servicos5";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminServicos from "./pages/admin/AdminServicos";
import AdminImagens from "./pages/admin/AdminImagens";
import AdminEstudio from "./pages/admin/AdminEstudio";
import AdminHistorico from "./pages/admin/AdminHistorico";
import AdminClientes from "./pages/admin/AdminClientes";
import AdminClienteDetail from "./pages/admin/AdminClienteDetail";
import AdminProfissionais from "./pages/admin/AdminProfissionais";
import AdminProfissionalDetail from "./pages/admin/AdminProfissionalDetail";
import AdminAgenda from "./pages/admin/AdminAgenda";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/profissionais" element={<Profissionais />} />
            <Route path="/profissional/:id" element={<ProfissionalDetail />} />
            <Route path="/servicos" element={<Servicos />} />
            <Route path="/servicos2" element={<ServicosVitrine />} />
            <Route path="/servicos3" element={<Servicos3 />} />
            <Route path="/servicos4" element={<Servicos4 />} />
            <Route path="/servicos5" element={<Servicos5 />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="agenda" element={<AdminAgenda />} />
              <Route path="servicos" element={<AdminServicos />} />
              <Route path="profissionais" element={<AdminProfissionais />} />
              <Route path="profissionais/:id" element={<AdminProfissionalDetail />} />
              <Route path="clientes" element={<AdminClientes />} />
              <Route path="clientes/:id" element={<AdminClienteDetail />} />

              <Route path="imagens" element={<AdminImagens />} />
              <Route path="estudio" element={<AdminEstudio />} />
              <Route path="historico" element={<AdminHistorico />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
