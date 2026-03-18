import logoChe3d from "@/assets/logo-che3d.png";
import logo3dInsumos from "@/assets/logo-3d-insumos.jpg";
import logoPal from "@/assets/logo-pal.png";
import logoPiscobot from "@/assets/logo-piscobot.png";

const providers = [
  { name: "CHE3D", logo: logoChe3d },
  { name: "3D Insumos", logo: logo3dInsumos },
  { name: "PAL", logo: logoPal },
  { name: "Piscobot", logo: logoPiscobot },
];

const ProvidersSection = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Nuestra red</p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Red de proveedores evaluados</h2>
          <p className="mt-3 text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Trabajamos con proveedores seleccionados por capacidad técnica, materiales, cumplimiento y calidad.
          </p>
        </div>

        <div className="flex items-center justify-center gap-8 md:gap-14 max-w-4xl mx-auto flex-wrap">
          {providers.map((p) => (
            <div
              key={p.name}
              className="flex flex-col items-center gap-3"
            >
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-white border border-border/80 flex items-center justify-center p-4 shadow-sm">
                <img
                  src={p.logo}
                  alt={`Logo de ${p.name}`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProvidersSection;
