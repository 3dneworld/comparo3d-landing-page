import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logoWhite from "@/assets/logo-white.png";
import logoDark from "@/assets/logo-dark.png";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const useLightPageNav = location.pathname !== "/";
  const navLinkClass = useLightPageNav
    ? "text-sm text-muted-foreground transition-colors hover:text-foreground"
    : "text-sm text-hero-muted transition-colors hover:text-hero-foreground";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  console.log("[Navbar] Rendered, mobileOpen:", mobileOpen);

  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        useLightPageNav
          ? "border-b border-border bg-background/95 shadow-sm backdrop-blur-md"
          : scrolled
            ? "border-b border-hero-muted/10 bg-hero/95 shadow-lg backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="container flex h-16 max-w-6xl items-center justify-between">
        <a href="/">
          <img src={useLightPageNav ? logoDark : logoWhite} alt="COMPARO3D" className="h-8" />
        </a>

        <div className="hidden items-center gap-8 md:flex">
          <a href="/#como-funciona" className={navLinkClass}>Como funciona</a>
          <a href="/#empresas" className={navLinkClass}>Empresas</a>
          <a href="/#materiales" className={navLinkClass}>Materiales</a>
          <Link to="/proveedores" className={navLinkClass}>Proveedores</Link>
          <a href="/#faq" className={navLinkClass}>FAQ</a>
          <a
            href="/#cotizar"
            className="rounded-lg bg-gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-cta transition-opacity hover:opacity-90"
          >
            Cotizar ahora
          </a>
        </div>

        <button
          className={`md:hidden ${useLightPageNav ? "text-foreground" : "text-hero-foreground"}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div
          className={`border-t pb-4 md:hidden ${
            useLightPageNav ? "border-border bg-background" : "border-hero-muted/10 bg-hero"
          }`}
        >
          <div className="container flex max-w-6xl flex-col gap-3 pt-3">
            <a href="/#como-funciona" className={`${navLinkClass} py-2`} onClick={() => setMobileOpen(false)}>Como funciona</a>
            <a href="/#empresas" className={`${navLinkClass} py-2`} onClick={() => setMobileOpen(false)}>Empresas</a>
            <a href="/#materiales" className={`${navLinkClass} py-2`} onClick={() => setMobileOpen(false)}>Materiales</a>
            <Link to="/proveedores" className={`${navLinkClass} py-2`} onClick={() => setMobileOpen(false)}>Proveedores</Link>
            <a href="/#faq" className={`${navLinkClass} py-2`} onClick={() => setMobileOpen(false)}>FAQ</a>
            <a
              href="/#cotizar"
              className="rounded-lg bg-gradient-primary px-5 py-2.5 text-center text-sm font-semibold text-primary-foreground"
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
