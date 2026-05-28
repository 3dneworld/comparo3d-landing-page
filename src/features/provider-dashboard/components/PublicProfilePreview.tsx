import { MapPin, Star } from "lucide-react";

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
    <section className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-white shadow-card" aria-label="Vista publica">
      <div className="h-[86px] bg-gradient-to-br from-slate-900 via-blue-900 to-blue-600" />
      <div className="relative px-5 pb-5">
        <div className="-mt-9 flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-slate-900 shadow-lg">
          {data.logoUrl ? (
            <img src={data.logoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="font-[Montserrat] text-2xl font-extrabold text-white">{initials(data.nombre)}</span>
          )}
        </div>
        <div className="mt-3">
          <h3 className="font-[Montserrat] text-lg font-extrabold tracking-tight text-foreground">
            {data.nombre || "Nombre comercial"}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {data.descripcion || "Descripcion publica del proveedor."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {location || "Ubicacion sin declarar"}</span>
            <span className="inline-flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-amber-500" /> {data.rating ? data.rating.toFixed(1) : "Nuevo"} - {data.reviewsCount || 0} reviews</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
              {data.deliveryDays || 1} dias
            </span>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
              Desde ${Math.round(data.minJob || 0)}
            </span>
            {data.materials.slice(0, 4).map((material) => (
              <span key={material} className="rounded-full border border-border/70 bg-muted/50 px-2.5 py-1 text-[11px] font-bold text-foreground">
                {material}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
