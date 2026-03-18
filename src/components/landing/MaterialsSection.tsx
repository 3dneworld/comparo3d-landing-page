const materials = [
  { name: "PLA", use: "Prototipos, piezas decorativas, maquetas", benefit: "Fácil de imprimir, buena terminación, biodegradable" },
  { name: "ABS", use: "Carcasas, piezas funcionales, automotriz", benefit: "Resistente al calor y a impactos" },
  { name: "PETG", use: "Envases, piezas mecánicas, uso alimentario", benefit: "Buena resistencia química y flexibilidad" },
  { name: "Resina", use: "Joyería, odontología, detalles finos", benefit: "Alta precisión y acabado superficial liso" },
  { name: "Nylon", use: "Engranajes, herramientas, piezas técnicas", benefit: "Alta resistencia mecánica y durabilidad" },
  { name: "TPU", use: "Juntas, suelas, carcasas flexibles", benefit: "Flexible, absorbe impactos" },
];

const MaterialsSection = () => {
  return (
    <section id="materiales" className="py-20 md:py-28 bg-muted/50">
      <div className="container">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Capacidades</p>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">Materiales disponibles</h2>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">Trabajamos con una amplia variedad de materiales y tecnologías de impresión 3D.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {materials.map((m) => (
            <div key={m.name} className="bg-card border border-border rounded-xl p-6 hover:shadow-card-hover transition-shadow">
              <h3 className="font-display font-bold text-xl text-foreground">{m.name}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{m.use}</p>
              <p className="text-sm text-primary mt-3 font-medium leading-relaxed">{m.benefit}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MaterialsSection;
