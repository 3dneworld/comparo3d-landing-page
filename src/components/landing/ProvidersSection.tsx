const providers = [
  { name: "CHED", initials: "CH" },
  { name: "3D Insumos", initials: "3D" },
  { name: "PJAL", initials: "PJ" },
  { name: "Proveedor 4", initials: "P4" },
];

const ProvidersSection = () => {
  return (
    <section className="py-14 md:py-20 bg-background">
      <div className="container">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Nuestra red</p>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Red de proveedores evaluados</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
            Trabajamos con proveedores seleccionados por capacidad técnica, materiales, cumplimiento y calidad.
          </p>
        </div>

        <div className="flex items-center justify-center gap-6 md:gap-10 max-w-3xl mx-auto">
          {providers.map((p) => (
            <div
              key={p.name}
              className="flex flex-col items-center gap-3"
            >
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-muted/60 border border-border flex items-center justify-center">
                {/* Logo slot — replace with <img> when real logos are available */}
                <span className="font-display font-bold text-lg md:text-xl text-muted-foreground/60">
                  {p.initials}
                </span>
              </div>
              <span className="text-xs font-medium text-muted-foreground">{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProvidersSection;
