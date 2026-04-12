import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

const FloatingCTA = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const heroEnd = 900;
      const cotizarEl = document.getElementById("cotizar");
      const empresasEl = document.getElementById("empresas");
      const footerEl = document.querySelector("footer");
      const cotizarTop = cotizarEl?.getBoundingClientRect().top ?? Infinity;
      const cotizarBottom = cotizarEl?.getBoundingClientRect().bottom ?? Infinity;
      const empresasTop = empresasEl?.getBoundingClientRect().top ?? Infinity;
      const empresasBottom = empresasEl?.getBoundingClientRect().bottom ?? Infinity;
      const footerTop = footerEl?.getBoundingClientRect().top ?? Infinity;
      const footerBottom = footerEl?.getBoundingClientRect().bottom ?? Infinity;

      const pastHero = window.scrollY > heroEnd;
      const cotizarInView = cotizarTop < window.innerHeight && cotizarBottom > 0;
      const empresasInView = empresasTop < window.innerHeight && empresasBottom > 0;
      const footerInView = footerTop < window.innerHeight && footerBottom > 0;

      setVisible(pastHero && !cotizarInView && !empresasInView && !footerInView);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4 md:hidden">
      <a
        href="#cotizar"
        className="flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-[13px] font-semibold text-primary-foreground shadow-cta transition-opacity hover:opacity-90"
      >
        Cotizar ahora
        <ArrowRight size={15} />
      </a>
    </div>
  );
};

export default FloatingCTA;
