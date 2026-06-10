// ProfileHero.tsx — Hero dark de perfil publico de proveedor
// Layout: sección full-width con fondo gradient-dark, badges pill-style, quick-stats reales
import { MapPin, ShieldCheck, CheckCircle2, Star } from "lucide-react";
import { AvatarFallback } from "./AvatarFallback";
import type { PublicProvider, PublicProviderBadge } from "../types";

interface Props {
  provider: PublicProvider;
  badges: PublicProviderBadge[];
}

// Determina la dimension mayor de la cama para mostrarlo como headline
function getCamaMaxDim(cama: { x: number; y: number; z: number }): number {
  return Math.max(cama.x, cama.y, cama.z);
}

// Devuelve clase de estilo + icono para cada tipo de badge
function getBadgeStyle(badge: PublicProviderBadge): {
  className: string;
  icon: React.ReactNode;
} | null {
  const type = String(badge.type || "").toLowerCase();
  if (type.includes("trayectoria") || type.includes("fundador")) {
    return {
      className:
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border bg-[hsl(var(--primary)/0.16)] text-[#c1d4f5] border-[hsl(var(--primary)/0.4)]",
      icon: <ShieldCheck size={13} aria-hidden="true" />,
    };
  }
  if (type.includes("organico")) {
    return {
      className:
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border bg-[hsl(152_68%_40%/0.16)] text-[#6ee7b7] border-[hsl(152_68%_40%/0.4)]",
      icon: <CheckCircle2 size={13} aria-hidden="true" />,
    };
  }
  return null;
}

interface QStat {
  label: string;
  value: string;
  sub: string;
}

export function ProfileHero({ provider, badges }: Props) {
  const { id, nombre, logo_url, location, capacity, pricing, rating } = provider;

  const hasRating = rating.count > 0 && rating.average != null;

  // Filtrar solo badges con estilo conocido (trayectoria + organico)
  const heroBadges = badges
    .map((badge) => ({ badge, style: getBadgeStyle(badge) }))
    .filter((item) => item.style !== null)
    .slice(0, 3);

  // Quick-stats — solo columnas con dato real
  const stats: QStat[] = [];

  // Cama maxima — presente solo si al menos un eje tiene dimension > 0
  const cama = capacity.cama_max_mm;
  if (cama && (cama.x > 0 || cama.y > 0 || cama.z > 0)) {
    const maxDim = getCamaMaxDim(cama);
    stats.push({
      label: "Cama máxima",
      value: `${maxDim}³`,
      sub: "mm · volumen de impresión",
    });
  }

  // Entrega — solo si hay dato
  if (pricing.tiempo_entrega_dias != null) {
    const dias = pricing.tiempo_entrega_dias;
    stats.push({
      label: "Entrega",
      value: `${dias} día${dias === 1 ? "" : "s"}`,
      sub: "tiempo estimado de producción",
    });
  }

  // Impresoras declaradas — solo si hay dato
  if (capacity.impresoras_declaradas != null && capacity.impresoras_declaradas > 0) {
    stats.push({
      label: "Impresoras",
      value: String(capacity.impresoras_declaradas),
      sub: "equipos declarados activos",
    });
  }

  // Materiales activos — solo si hay dato
  if (
    stats.length < 4 &&
    capacity.materiales_activos != null &&
    capacity.materiales_activos.length > 0
  ) {
    stats.push({
      label: "Materiales",
      value: String(capacity.materiales_activos.length),
      sub: "tipos de filamento disponibles",
    });
  }

  // Columnas del grid segun cantidad de stats reales
  const gridCols =
    stats.length === 4
      ? "grid-cols-4"
      : stats.length === 3
        ? "grid-cols-3"
        : stats.length === 2
          ? "grid-cols-2"
          : "grid-cols-1";

  const locationStr = [location.localidad, location.provincia]
    .filter(Boolean)
    .join(", ");

  return (
    <section className="bg-gradient-dark text-hero-foreground relative overflow-hidden rounded-3xl">
      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none' stroke='white' stroke-width='.5'/%3E%3C/svg%3E")`,
          opacity: 0.035,
        }}
        aria-hidden="true"
      />

      {/* Hero inner — avatar + título + meta + badges */}
      <div className="relative grid grid-cols-[auto_1fr] items-center gap-7 px-10 pb-6 pt-10">
        {/* Avatar 96px */}
        <div className="shrink-0">
          {logo_url ? (
            <img
              src={logo_url}
              alt={`Logo de ${nombre}`}
              className="h-24 w-24 rounded-[20px] object-cover shadow-[0_20px_50px_-10px_rgba(34,96,201,.5)] ring-[3px] ring-white/6"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-[20px] bg-gradient-primary shadow-[0_20px_50px_-10px_rgba(34,96,201,.5)] ring-[3px] ring-white/6">
              <AvatarFallback id={id} nombre={nombre} size={96} />
            </div>
          )}
        </div>

        {/* Nombre + meta + badges */}
        <div className="min-w-0">
          <h1 className="font-[Montserrat] text-[clamp(1.8rem,2vw+1rem,2.6rem)] font-extrabold leading-[1.1] tracking-[-0.015em] text-hero-foreground">
            {nombre}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px] font-medium text-hero-muted">
            {locationStr && (
              <span className="flex items-center gap-1">
                <MapPin size={13} aria-hidden="true" className="shrink-0" />
                {locationStr}
              </span>
            )}
            {locationStr && hasRating && (
              <span className="opacity-40">·</span>
            )}
            {hasRating && (
              <span className="flex items-center gap-1">
                <Star
                  size={13}
                  className="fill-amber-400 text-amber-400"
                  aria-hidden="true"
                />
                <span>
                  {rating.average!.toFixed(1)} sobre {rating.count}{" "}
                  {rating.count === 1 ? "reseña" : "reseñas"}
                </span>
              </span>
            )}
          </div>

          {heroBadges.length > 0 && (
            <div className="mt-3.5 flex flex-wrap gap-2">
              {heroBadges.map(({ badge, style }, i) => (
                <span
                  key={`${badge.type}-${i}`}
                  className={style!.className}
                >
                  {style!.icon}
                  {badge.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick-stats — solo columnas con dato real */}
      {stats.length > 0 && (
        <div
          className={`relative grid ${gridCols} gap-3 px-10 py-6 border-t border-[hsl(var(--hero-muted)/0.12)]`}
        >
          {stats.map((s) => (
            <div key={s.label} className="py-1">
              <div
                className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: "hsl(var(--hero-muted) / 0.8)" }}
              >
                {s.label}
              </div>
              <div className="font-[Montserrat] text-[22px] font-bold leading-none tracking-[-0.01em] text-hero-foreground">
                {s.value}
              </div>
              <span
                className="mt-1 block text-[11px] font-medium text-hero-muted"
              >
                {s.sub}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
