import { useEffect, useState } from "react";

const TABS = [
  { id: "resumen", label: "Resumen" },
  { id: "capacidad", label: "Capacidad" },
  { id: "materiales", label: "Materiales" },
  { id: "trabajos", label: "Trabajos" },
  { id: "resenas", label: "Reseñas" },
];

export function ProfileTabs() {
  const [active, setActive] = useState("resumen");
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    TABS.forEach((t) => {
      const el = document.getElementById(t.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);
  return (
    <nav className="sticky top-16 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-screen-xl gap-6 overflow-x-auto px-4">
        {TABS.map((t) => (
          <a
            key={t.id}
            href={`#${t.id}`}
            className={`whitespace-nowrap border-b-2 py-4 text-sm transition-colors ${
              active === t.id
                ? "border-primary font-semibold text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
