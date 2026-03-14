const materials = [
  { name: "PLA", use: "Prototipos, piezas decorativas", props: "Fácil de imprimir, biodegradable" },
  { name: "ABS", use: "Piezas funcionales, carcasas", props: "Resistente al calor, duradero" },
  { name: "PETG", use: "Envases, piezas mecánicas", props: "Resistente a químicos, flexible" },
  { name: "Resina", use: "Detalles finos, joyería, dental", props: "Alta precisión, acabado liso" },
  { name: "Nylon", use: "Engranajes, herramientas", props: "Alta resistencia mecánica" },
  { name: "TPU", use: "Suelas, juntas, carcasas flexibles", props: "Flexible, resistente a impactos" },
];

const MaterialsSection = () => {
  return (
    <section id="materiales" className="py-20 md:py-28 bg-muted/50">
      <div className="container">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Capacidades</p>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">Materiales disponibles</h2>
          <p className="mt-3 text-muted-foreground">Trabajamos con una amplia variedad de materiales y tecnologías.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {materials.map((m) => (
            <div key={m.name} className="bg-card border border-border rounded-lg p-5 hover:shadow-card-hover transition-shadow">
              <h3 className="font-display font-bold text-lg text-foreground">{m.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{m.use}</p>
              <p className="text-xs text-primary mt-2 font-medium">{m.props}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MaterialsSection;
