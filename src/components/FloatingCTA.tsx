import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

const FloatingCTA = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const heroEnd = 600;
      const cotizarEl = document.getElementById("cotizar");
      const cotizarTop = cotizarEl?.getBoundingClientRect().top ?? Infinity;
      const cotizarBottom = cotizarEl?.getBoundingClientRect().bottom ?? Infinity;

      const pastHero = window.scrollY > heroEnd;
      const cotizarInView = cotizarTop < window.innerHeight && cotizarBottom > 0;

      setVisible(pastHero && !cotizarInView);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center px-4 md:hidden">
      <a
        href="#cotizar"
        className="flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-cta transition-opacity hover:opacity-90"
      >
        Cotizar ahora
        <ArrowRight size={16} />
      </a>
    </div>
  );
};

export default FloatingCTA;
