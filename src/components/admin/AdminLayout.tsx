import { ReactNode } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, ScrollText, History, LogOut, Loader2, Image as ImageIcon, Palette, Users, UserCog, CalendarDays } from "lucide-react";
import { toast } from "sonner";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/admin/clientes", label: "Clientes", icon: Users },
  { to: "/admin/profissionais", label: "Profissionais", icon: UserCog },
  { to: "/admin/servicos", label: "Serviços", icon: ScrollText },
  { to: "/admin/imagens", label: "Imagens", icon: ImageIcon },
  { to: "/admin/estudio", label: "Estúdio de Artes", icon: Palette },
  { to: "/admin/historico", label: "Histórico", icon: History },
];

const AdminLayout = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    navigate("/admin/login", { replace: true });
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    toast.success("Sessão encerrada");
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 border-r border-border/50 bg-card/30 backdrop-blur-xl flex flex-col">
        <div className="p-6 border-b border-border/50">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Aura Clinic</p>
          <h1 className="text-lg font-bold mt-1">Painel Admin</h1>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-border/50 space-y-2">
          <p className="text-xs text-muted-foreground px-3 truncate">{user.email}</p>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
