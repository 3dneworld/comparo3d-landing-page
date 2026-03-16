const providers = [
  "CHED",
  "3D Insumos",
  "PJAL",
  "PrintAR",
  "3DLab",
  "MakerZone",
];

const ProviderLogos = () => {
  return (
    <section className="py-10 md:py-14 bg-background border-b border-border">
      <div className="container">
        <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider mb-6">
          Red de proveedores evaluados
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 max-w-3xl mx-auto">
          {providers.map((name) => (
            <span
              key={name}
              className="text-sm font-display font-semibold text-muted-foreground/60 tracking-wide select-none"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProviderLogos;
