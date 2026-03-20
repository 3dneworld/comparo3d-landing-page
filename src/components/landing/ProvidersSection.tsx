const providers = [
  { name: "PRINTALOT" },
  { name: "Piscobot" },
  { name: "PJAL" },
  { name: "Trideo" },
];

const ProvidersSection = () => {
  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container">
        <div className="text-center mb-8">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
            Nuestra red
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Red de proveedores evaluados
          </h2>
          <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Trabajamos con proveedores seleccionados por capacidad técnica, materiales, cumplimiento y calidad.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 max-w-3xl mx-auto">
          {providers.map((p) => (
            <div
              key={p.name}
              className="flex flex-col items-center rounded-xl border border-border bg-card p-4 md:p-5"
            >
              <div className="w-full aspect-[5/2] rounded-lg bg-muted/40 border border-border/50 mb-3 flex items-center justify-center">
                <div className="w-16 h-[2px] rounded-full bg-muted-foreground/10" />
              </div>
              <span className="text-sm font-semibold text-foreground">{p.name}</span>
              <span className="text-[11px] text-muted-foreground/60 mt-0.5">Proveedor evaluado</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProvidersSection;
