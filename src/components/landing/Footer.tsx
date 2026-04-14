import logoWhite from "@/assets/logo-white.png";
import AnimateOnScroll from "@/components/AnimateOnScroll";

const Footer = () => {
  return (
    <footer className="bg-hero border-t border-hero-muted/10 py-12">
      <div className="container max-w-6xl">
        <AnimateOnScroll variant="fade-up" delay={0.1}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <img src={logoWhite} alt="COMPARO3D" className="h-8" />
            <p className="mt-3 text-sm text-hero-muted leading-relaxed">
              La plataforma argentina para cotizar y comparar impresión 3D.
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold text-hero-foreground text-sm mb-3">Plataforma</h4>
            <ul className="space-y-2">
              <li><a href="#como-funciona" className="text-sm text-hero-muted hover:text-hero-foreground transition-colors">Cómo funciona</a></li>
              <li><a href="#materiales" className="text-sm text-hero-muted hover:text-hero-foreground transition-colors">Materiales</a></li>
              <li><a href="#cotizar" className="text-sm text-hero-muted hover:text-hero-foreground transition-colors">Cotizar</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-hero-foreground text-sm mb-3">Empresa</h4>
            <ul className="space-y-2">
              <li><a href="#empresas" className="text-sm text-hero-muted hover:text-hero-foreground transition-colors">Para empresas</a></li>
              <li><a href="#faq" className="text-sm text-hero-muted hover:text-hero-foreground transition-colors">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-hero-foreground text-sm mb-3">Contacto</h4>
            <ul className="space-y-2">
              <li className="text-sm text-hero-muted">Buenos Aires, Argentina</li>
              <li>
                <a href="mailto:info@comparo3d.com.ar" className="text-sm text-hero-muted hover:text-hero-foreground transition-colors">
                  info@comparo3d.com.ar
                </a>
              </li>
            </ul>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://www.instagram.com/comparo3d"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-hero-muted/10 text-hero-muted transition-colors hover:bg-hero-muted/20 hover:text-hero-foreground"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
              <a
                href="https://www.tiktok.com/@comparo3d"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-hero-muted/10 text-hero-muted transition-colors hover:bg-hero-muted/20 hover:text-hero-foreground"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.71a8.19 8.19 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.14z"/></svg>
              </a>
            </div>
          </div>
        </div>
        </AnimateOnScroll>
        <div className="mt-10 pt-6 border-t border-hero-muted/10 text-center">
          <p className="text-xs text-hero-muted">© {new Date().getFullYear()} COMPARO3D. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
