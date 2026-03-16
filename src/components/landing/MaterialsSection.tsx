const materials = [
  { name: "PLA", use: "Prototipos, maquetas, piezas decorativas", benefit: "Buena terminación, fácil de imprimir, biodegradable" },
  { name: "ABS", use: "Carcasas, piezas funcionales, automotriz", benefit: "Resistente al calor y a impactos" },
  { name: "PETG", use: "Envases, piezas mecánicas, uso alimentario", benefit: "Resistencia química y buena flexibilidad" },
  { name: "Resina", use: "Joyería, odontología, detalles finos", benefit: "Alta precisión y acabado superficial liso" },
  { name: "Nylon", use: "Engranajes, herramientas, piezas técnicas", benefit: "Alta resistencia mecánica y durabilidad" },
  { name: "TPU", use: "Juntas, suelas, carcasas flexibles", benefit: "Flexible y absorbe impactos" },
];

const MaterialsSection = () => {
  return (
    <section id="materiales" className="py-20 md:py-28 bg-muted/50">
      <div className="container">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Capacidades</p>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">Materiales disponibles</h2>
          <p className="mt-3 text-muted-foreground">Trabajamos con una amplia variedad de materiales y tecnologías de impresión 3D.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {materials.map((m) => (
            <div key={m.name} className="bg-card border border-border rounded-xl p-6 hover:shadow-card-hover transition-shadow group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/8 flex items-center justify-center">
                  <span className="font-display font-bold text-sm text-primary">{m.name.substring(0, 2)}</span>
                </div>
                <h3 className="font-display font-bold text-lg text-foreground">{m.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">{m.use}</p>
              <p className="text-xs text-primary font-medium leading-relaxed">{m.benefit}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MaterialsSection;
