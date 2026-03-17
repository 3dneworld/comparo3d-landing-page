import { Layers } from "lucide-react";

const projects = [
  { title: "Prototipo carcasa electrónica", material: "PLA", pieces: 12, category: "Ingeniería" },
  { title: "Modelo arquitectónico escala 1:100", material: "Resina", pieces: 1, category: "Arquitectura" },
  { title: "Engranajes de repuesto industrial", material: "Nylon", pieces: 48, category: "Industria" },
  { title: "Packaging personalizado", material: "PETG", pieces: 200, category: "Retail" },
  { title: "Instrumental de práctica médica", material: "Resina", pieces: 6, category: "Salud" },
  { title: "Figuras coleccionables", material: "PLA", pieces: 30, category: "Consumo" },
];

const categoryColors: Record<string, string> = {
  "Ingeniería": "bg-primary/10 text-primary",
  "Arquitectura": "bg-accent/10 text-accent",
  "Industria": "bg-primary/10 text-primary",
  "Retail": "bg-accent/10 text-accent",
  "Salud": "bg-primary/10 text-primary",
  "Consumo": "bg-accent/10 text-accent",
};

const ProjectsGallery = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Tipos de proyecto</p>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
            Proyectos que gestionamos
          </h2>
          <p className="mt-3 text-muted-foreground">Algunos ejemplos del tipo de trabajos que coordinamos a través de la plataforma.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => (
            <div key={p.title} className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-card-hover transition-shadow">
              {/* Visual placeholder — intentional neutral area */}
              <div className="h-36 bg-muted/60 flex items-center justify-center border-b border-border">
                <div className="w-14 h-14 rounded-xl bg-card border border-border flex items-center justify-center shadow-sm">
                  <Layers size={24} className="text-muted-foreground/50" />
                </div>
              </div>
              <div className="p-5">
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${categoryColors[p.category] || "bg-muted text-muted-foreground"}`}>
                  {p.category}
                </span>
                <h3 className="font-display font-semibold text-foreground mt-2.5 mb-1.5">{p.title}</h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{p.material}</span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span>{p.pieces} {p.pieces === 1 ? "pieza" : "piezas"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectsGallery;
