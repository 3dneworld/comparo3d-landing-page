const providers = [
  { name: "CHE3D" },
  { name: "3D Insumos" },
  { name: "PJAL" },
  { name: "Trideo" },
];

const ProvidersSection = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            Nuestra red
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Red de proveedores evaluados
          </h2>
          <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Trabajamos con proveedores seleccionados por capacidad técnica, materiales, cumplimiento y calidad.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6 max-w-4xl mx-auto">
          {providers.map((p) => (
            <div
              key={p.name}
              className="flex flex-col items-center rounded-2xl border border-border bg-card p-6 md:p-8"
            >
              {/* Logo slot — replace inner content with <img> when real logos are available */}
              <div className="w-full aspect-[3/2] rounded-xl bg-muted/50 border border-border/60 mb-5 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-muted-foreground/10" />
              </div>
              <span className="text-sm font-semibold text-foreground">{p.name}</span>
              <span className="text-xs text-muted-foreground mt-1">Proveedor evaluado</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProvidersSection;
