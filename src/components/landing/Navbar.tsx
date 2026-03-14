import { useState } from "react";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  console.log("[Navbar] Rendered, mobileOpen:", mobileOpen);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-hero/95 backdrop-blur-md border-b border-hero-muted/10">
      <div className="container flex items-center justify-between h-16">
        <a href="#" className="font-display text-xl font-bold text-hero-foreground tracking-tight">
          COMPARO<span className="text-gradient-primary">3D</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          <a href="#como-funciona" className="text-sm text-hero-muted hover:text-hero-foreground transition-colors">Cómo funciona</a>
          <a href="#empresas" className="text-sm text-hero-muted hover:text-hero-foreground transition-colors">Empresas</a>
          <a href="#materiales" className="text-sm text-hero-muted hover:text-hero-foreground transition-colors">Materiales</a>
          <a href="#faq" className="text-sm text-hero-muted hover:text-hero-foreground transition-colors">FAQ</a>
          <a
            href="#cotizar"
            className="bg-gradient-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-cta"
          >
            Cotizar ahora
          </a>
        </div>

        <button
          className="md:hidden text-hero-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-hero border-t border-hero-muted/10 pb-4">
          <div className="container flex flex-col gap-3 pt-3">
            <a href="#como-funciona" className="text-sm text-hero-muted py-2" onClick={() => setMobileOpen(false)}>Cómo funciona</a>
            <a href="#empresas" className="text-sm text-hero-muted py-2" onClick={() => setMobileOpen(false)}>Empresas</a>
            <a href="#materiales" className="text-sm text-hero-muted py-2" onClick={() => setMobileOpen(false)}>Materiales</a>
            <a href="#faq" className="text-sm text-hero-muted py-2" onClick={() => setMobileOpen(false)}>FAQ</a>
            <a
              href="#cotizar"
              className="bg-gradient-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold text-center"
              onClick={() => setMobileOpen(false)}
            >
              Cotizar ahora
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
