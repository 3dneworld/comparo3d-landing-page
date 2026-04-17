// ListingCard.tsx — Tarjeta compacta de proveedor para el directorio
import { useNavigate } from "react-router-dom";
import { Star, Clock, ChevronRight, ShieldCheck, BadgeCheck } from "lucide-react";
import { AvatarFallback } from "@/features/provider-profile/components/AvatarFallback";
import type { ListingProvider, ListingProviderBadge } from "../types";

const BADGE_MAX = 2;
const MATERIAL_MAX = 5;

function BadgePill({ badge }: { badge: ListingProviderBadge }) {
  const isTrayectoria = badge.type === "seleccion_fundador";
  const Icon = isTrayectoria ? ShieldCheck : BadgeCheck;
  const classes = isTrayectoria
    ? "bg-primary/10 text-primary ring-1 ring-primary/20"
    : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${classes}`}
    >
      <Icon size={11} aria-hidden="true" />
      {badge.label}
    </span>
  );
}

function formatARS(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface Props {
  provider: ListingProvider;
}

export function ListingCard({ provider: p }: Props) {
  const navigate = useNavigate();
  const slug = `${p.id}-${p.slug_hint}`;

  const visibleBadges = p.badges.slice(0, BADGE_MAX);
  const extraBadges = p.badges.length - BADGE_MAX;
  const mats = p.capacity.materiales_activos ?? [];
  const visibleMats = mats.slice(0, MATERIAL_MAX);
  const extraMats = mats.length - MATERIAL_MAX;

  const rating = p.rating.average;
  const ratingCount = p.rating.count;

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Ver perfil de ${p.nombre}`}
      onClick={() => navigate(`/proveedores/${slug}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") navigate(`/proveedores/${slug}`);
      }}
      className="group flex cursor-pointer flex-col gap-0 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition-all duration-150 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      {/* Logo + nombre */}
      <div className="flex items-center gap-3">
        {p.logo_url ? (
          <img
            src={p.logo_url}
            alt={p.nombre}
            width={56}
            height={56}
            className="h-14 w-14 flex-shrink-0 rounded-full object-cover"
            loading="lazy"
          />
        ) : (
          <AvatarFallback id={p.id} nombre={p.nombre} size={56} />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-[Montserrat] text-base font-bold text-foreground group-hover:text-primary">
            {p.nombre}
          </h3>
          {(p.location.localidad || p.location.provincia) && (
            <p className="truncate text-xs text-muted-foreground">
              {[p.location.localidad, p.location.provincia]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* Rating + precio mínimo */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        {rating !== null ? (
          <span className="flex items-center gap-1 font-semibold text-foreground">
            <Star size={13} className="fill-amber-400 text-amber-400" aria-hidden="true" />
            {rating.toFixed(1)}
            <span className="font-normal text-muted-foreground">
              ({ratingCount})
            </span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Sin reseñas aún</span>
        )}

        {p.pricing.tiempo_entrega_dias && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock size={12} aria-hidden="true" />
            {p.pricing.tiempo_entrega_dias}d
          </span>
        )}

        {p.pricing.min_trabajo_ars && (
          <span className="text-muted-foreground">
            Desde {formatARS(p.pricing.min_trabajo_ars)}
          </span>
        )}
      </div>

      {/* Badges */}
      {p.badges.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {visibleBadges.map((b, i) => (
            <BadgePill key={i} badge={b} />
          ))}
          {extraBadges > 0 && (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              +{extraBadges}
            </span>
          )}
        </div>
      )}

      {/* Materiales */}
      {visibleMats.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {visibleMats.map((mat) => (
            <span
              key={mat}
              className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium uppercase text-foreground"
            >
              {mat}
            </span>
          ))}
          {extraMats > 0 && (
            <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              +{extraMats}
            </span>
          )}
        </div>
      )}

      {/* Industrias */}
      {p.industries_served.length > 0 && (
        <p className="mt-2.5 truncate text-xs text-muted-foreground">
          {p.industries_served.slice(0, 3).join(" · ")}
        </p>
      )}

      {/* CTA */}
      <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary">
        Ver perfil
        <ChevronRight size={14} aria-hidden="true" />
      </div>
    </article>
  );
}
