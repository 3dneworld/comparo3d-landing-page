const projects = [
  { title: "Prototipo carcasa electrónica", material: "PLA", pieces: 12, category: "Ingeniería" },
  { title: "Modelo arquitectónico escala 1:100", material: "Resina", pieces: 1, category: "Arquitectura" },
  { title: "Engranajes de repuesto industrial", material: "Nylon", pieces: 48, category: "Industria" },
  { title: "Packaging personalizado", material: "PETG", pieces: 200, category: "Retail" },
  { title: "Herramientas quirúrgicas de práctica", material: "Resina", pieces: 6, category: "Salud" },
  { title: "Figuras coleccionables", material: "PLA", pieces: 30, category: "Consumo" },
];

const ProjectsGallery = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Proyectos reales</p>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
            +500 proyectos completados
          </h2>
          <p className="mt-3 text-muted-foreground">Estos son algunos de los tipos de proyectos que gestionamos.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => (
            <div key={p.title} className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-card-hover transition-shadow">
              <div className="h-32 bg-gradient-primary/10 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-display font-bold text-primary text-lg">{p.category[0]}</span>
                </div>
              </div>
              <div className="p-5">
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{p.category}</span>
                <h3 className="font-display font-semibold text-foreground mt-2 mb-1">{p.title}</h3>
                <p className="text-xs text-muted-foreground">{p.material} · {p.pieces} {p.pieces === 1 ? "pieza" : "piezas"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectsGallery;
