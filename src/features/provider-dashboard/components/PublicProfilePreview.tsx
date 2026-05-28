import { Eye, MapPin, Star } from "lucide-react";

export interface PublicProfilePreviewData {
  nombre: string;
  descripcion: string;
  localidad: string;
  provincia: string;
  logoUrl?: string | null;
  rating?: number | null;
  reviewsCount?: number | null;
  deliveryDays?: number | null;
  minJob?: number | null;
  materials: string[];
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "P"
  );
}

export function PublicProfilePreview({ data }: { data: PublicProfilePreviewData }) {
  const location = [data.localidad, data.provincia].filter(Boolean).join(", ");

  return (
    <section className="overflow-hidden rounded-[17px] border border-[var(--c3d-card-border)] bg-[var(--c3d-card-bg)] shadow-[var(--c3d-card-shadow)]" aria-label="Vista publica">
      <header className="flex items-start justify-between gap-3 border-b border-[var(--c3d-card-border-soft)] px-5 pb-[11px] pt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-primary/10 text-primary">
            <Eye className="h-[18px] w-[18px]" />
          </div>
          <div>
            <p className="font-[Montserrat] text-[10px] font-extrabold uppercase leading-none tracking-[0.18em] text-[hsl(220,80%,65%)]">
              VISTA PÚBLICA - EN VIVO
            </p>
            <h2 className="mt-1.5 font-[Montserrat] text-[16px] font-bold leading-[1.2] text-[var(--c3d-text-strong)]">
              Así te ven los clientes
            </h2>
            <p className="mt-0.5 text-[12px] leading-[1.5] text-[var(--c3d-text-muted)]">
              Cualquier cambio a la izquierda se refleja acá inmediatamente.
            </p>
          </div>
        </div>
        <span className="rounded-full border border-blue-400/30 bg-blue-500/15 px-2.5 py-1 text-[10px] font-bold text-blue-200">
          En vivo
        </span>
      </header>

      <div className="px-5 pb-[18px] pt-[14px]">
        <div className="overflow-hidden rounded-[16px] border border-white/10 bg-white text-slate-900 shadow-2xl">
          <div className="relative h-[74px] bg-[linear-gradient(135deg,#2458d6_0%,#20a6e3_100%)]">
            <span className="absolute right-3 top-3 rounded-full bg-white/25 px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.08em] text-white">
              Nivel plata
            </span>
          </div>
          <div className="relative px-4 pb-4">
            <div className="-mt-8 flex h-[58px] w-[58px] items-center justify-center overflow-hidden rounded-[13px] border-[3px] border-white bg-slate-800 shadow-lg">
              {data.logoUrl ? (
                <img src={data.logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="font-[Montserrat] text-xl font-extrabold text-white">{initials(data.nombre)}</span>
              )}
            </div>
            <div className="mt-2 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-[Montserrat] text-[16px] font-extrabold tracking-tight text-slate-900">
                  {data.nombre || "Nombre comercial"}
                </h3>
                <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                  <MapPin className="h-3 w-3 text-rose-500" />
                  {location || "Ubicación sin declarar"} - entrega {data.deliveryDays || 1} días
                </p>
              </div>
              <div className="shrink-0 text-right text-[10px] font-bold text-slate-500">
                <span className="block text-amber-500">
                  <Star className="inline h-3 w-3 fill-current" /> {data.rating ? data.rating.toFixed(1) : "4.8"}
                </span>
                {data.reviewsCount || 0} resenas
              </div>
            </div>
            <p className="mt-3 line-clamp-3 text-[12px] leading-[1.45] text-slate-600">
              {data.descripcion || "Descripcion publica del proveedor."}
            </p>
            <div className="mt-4 grid grid-cols-3 border-y border-slate-200 py-2 text-center">
              <Stat value="312" label="Pedidos" />
              <Stat value="2.4h" label="Respuesta" />
              <Stat value="5+ anos" label="En la red" />
            </div>
            <p className="mt-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
              Materiales
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {(data.materials.length ? data.materials : ["PLA", "PETG", "ABS"]).slice(0, 5).map((material) => (
                <span key={material} className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-extrabold leading-none text-blue-700">
                  {material}
                </span>
              ))}
            </div>
            <button className="mt-4 h-10 w-full rounded-[9px] bg-[linear-gradient(135deg,#2458d6,#0ea5e9)] font-[Montserrat] text-[12px] font-extrabold text-white shadow-lg" type="button">
              Cotizar con {data.nombre || "proveedor"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-[Montserrat] text-[13px] font-extrabold leading-none text-slate-900">{value}</p>
      <p className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.08em] text-slate-400">{label}</p>
    </div>
  );
}
