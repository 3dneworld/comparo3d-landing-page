// ListingHero.tsx — Hero section del directorio de proveedores

interface Props {
  total: number;
}

export function ListingHero({ total }: Props) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 pb-12 pt-28 text-center">
      {/* Decoración geométrica sutil */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, hsl(var(--primary)) 0%, transparent 50%), radial-gradient(circle at 80% 50%, hsl(var(--accent)) 0%, transparent 50%)",
        }}
      />

      <div className="relative mx-auto max-w-3xl">
        <h1 className="font-[Montserrat] text-4xl font-bold text-white sm:text-5xl">
          Proveedores certificados
        </h1>
        <p className="mt-4 text-lg text-white/70">
          Todos los talleres activos de Comparo3D, con trayectoria comprobada y
          reseñas reales.
        </p>

        {total > 0 && (
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white ring-1 ring-white/20">
            <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
            {total} {total === 1 ? "proveedor activo" : "proveedores activos"}
          </div>
        )}
      </div>
    </div>
  );
}
