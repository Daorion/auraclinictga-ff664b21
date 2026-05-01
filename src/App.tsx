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
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminServicos from "./pages/admin/AdminServicos";
import AdminImagens from "./pages/admin/AdminImagens";
import AdminGerador from "./pages/admin/AdminGerador";
import AdminHistorico from "./pages/admin/AdminHistorico";

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
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="servicos" element={<AdminServicos />} />
              <Route path="imagens" element={<AdminImagens />} />
              <Route path="gerador" element={<AdminGerador />} />
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
