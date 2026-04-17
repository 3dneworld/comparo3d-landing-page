import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logoWhite from "@/assets/logo-white.png";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  console.log("[Navbar] Rendered, mobileOpen:", mobileOpen);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? "bg-hero/95 backdrop-blur-md border-b border-hero-muted/10 shadow-lg"
        : "bg-transparent border-b border-transparent"
    }`}>
      <div className="container max-w-6xl flex items-center justify-between h-16">
        <a href="#">
          <img src={logoWhite} alt="COMPARO3D" className="h-8" />
        </a>

        <div className="hidden md:flex items-center gap-8">
          <a href="#como-funciona" className="text-sm text-hero-muted hover:text-hero-foreground transition-colors">Cómo funciona</a>
          <a href="#empresas" className="text-sm text-hero-muted hover:text-hero-foreground transition-colors">Empresas</a>
          <a href="#materiales" className="text-sm text-hero-muted hover:text-hero-foreground transition-colors">Materiales</a>
          <Link to="/proveedores" className="text-sm text-hero-muted hover:text-hero-foreground transition-colors">Proveedores</Link>
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
          <div className="container max-w-6xl flex flex-col gap-3 pt-3">
            <a href="#como-funciona" className="text-sm text-hero-muted py-2" onClick={() => setMobileOpen(false)}>Cómo funciona</a>
            <a href="#empresas" className="text-sm text-hero-muted py-2" onClick={() => setMobileOpen(false)}>Empresas</a>
            <a href="#materiales" className="text-sm text-hero-muted py-2" onClick={() => setMobileOpen(false)}>Materiales</a>
            <Link to="/proveedores" className="text-sm text-hero-muted py-2" onClick={() => setMobileOpen(false)}>Proveedores</Link>
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
