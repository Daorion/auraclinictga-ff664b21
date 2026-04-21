import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border/30 bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground tracking-wide">
          © {new Date().getFullYear()} Aura Clinic. Todos os direitos reservados.
        </p>
        <Link
          to="/admin/login"
          className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          aria-label="Acesso administrativo"
        >
          ·
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
