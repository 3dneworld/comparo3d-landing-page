import projectEnclosure from "@/assets/project-enclosure.jpg";
import projectArchitecture from "@/assets/project-architecture.jpg";
import projectGears from "@/assets/project-gears.jpg";
import projectMedical from "@/assets/project-medical.jpg";
import projectPackaging from "@/assets/project-packaging.jpg";
import projectFigurines from "@/assets/project-figurines.jpg";

const projects = [
  { title: "Carcasa electrónica", material: "PLA", pieces: 12, category: "Ingeniería", image: projectEnclosure },
  { title: "Modelo arquitectónico escala 1:100", material: "Resina", pieces: 1, category: "Arquitectura", image: projectArchitecture },
  { title: "Engranajes de repuesto", material: "Nylon", pieces: 48, category: "Industria", image: projectGears },
  { title: "Instrumental de práctica", material: "Resina", pieces: 6, category: "Salud", image: projectMedical },
  { title: "Packaging personalizado", material: "PETG", pieces: 200, category: "Retail", image: projectPackaging },
  { title: "Figuras coleccionables", material: "PLA", pieces: 30, category: "Consumo", image: projectFigurines },
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
              <div className="h-44 overflow-hidden bg-muted/40">
                <img
                  src={p.image}
                  alt={`Proyecto de impresión 3D: ${p.title}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
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
