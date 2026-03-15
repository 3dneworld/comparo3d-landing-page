const Footer = () => {
  return (
    <footer className="bg-hero border-t border-hero-muted/10 py-12">
      <div className="container">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <span className="font-display text-lg font-bold text-hero-foreground">
              COMPARO<span className="text-gradient-primary">3D</span>
            </span>
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
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-hero-muted/10 text-center">
          <p className="text-xs text-hero-muted">© {new Date().getFullYear()} COMPARO3D. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
