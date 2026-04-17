// ProfileHero.tsx — Sidebar sticky desktop / Hero mobile del perfil de proveedor
import { Globe, MapPin, MessageCircle, Star } from "lucide-react";
import { AvatarFallback } from "./AvatarFallback";
import { BadgeChip, sortBadges } from "@/components/landing/quote/BadgeChip";
import type { PublicProvider, PublicProviderBadge } from "../types";
import type { QuoteOptionBadge } from "@/lib/api";

interface Props {
  provider: PublicProvider;
  badges: PublicProviderBadge[];
}

function formatARS(amount: number | null): string | null {
  if (amount == null) return null;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function buildWhatsAppUrl(whatsapp: string, nombre: string): string {
  const phone = whatsapp.replace(/\D/g, "");
  const msg = encodeURIComponent(
    `Hola, vi tu perfil en Comparo3D y quería consultarte por un trabajo.`
  );
  return `https://wa.me/${phone}?text=${msg}`;
}

// Convertir PublicProviderBadge → QuoteOptionBadge (mismo componente BadgeChip)
function toQuoteOptionBadge(b: PublicProviderBadge): QuoteOptionBadge {
  return {
    badge_type: b.type as QuoteOptionBadge["badge_type"],
    badge_tier: b.tier ?? undefined,
    granted_at: b.granted_at ?? "",
  };
}

export function ProfileHero({ provider, badges }: Props) {
  const {
    id,
    nombre,
    logo_url,
    location,
    social,
    pricing,
    rating,
  } = provider;

  const quoteBadges = sortBadges(badges.map(toQuoteOptionBadge));
  const hasRating = rating.count > 0 && rating.average != null;
  const minTrabajoStr = formatARS(pricing.min_trabajo_ars);

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        {/* Logo / Avatar */}
        <div className="flex flex-col items-center gap-3">
          {logo_url ? (
            <img
              src={logo_url}
              alt={`Logo de ${nombre}`}
              className="h-24 w-24 rounded-full object-cover shadow-sm ring-2 ring-border/40"
            />
          ) : (
            <AvatarFallback id={id} nombre={nombre} size={96} />
          )}

          {/* Nombre */}
          <h1 className="font-[Montserrat] text-xl font-bold text-foreground text-center leading-tight">
            {nombre}
          </h1>

          {/* Rating */}
          {hasRating ? (
            <div className="flex items-center gap-1.5 text-sm">
              <Star
                size={15}
                className="fill-amber-400 text-amber-400"
                aria-hidden="true"
              />
              <span className="font-semibold text-foreground">
                {rating.average!.toFixed(1)}
              </span>
              <span className="text-muted-foreground">
                ({rating.count} reseñas)
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin reseñas aún</p>
          )}

          {/* Badges */}
          {quoteBadges.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {quoteBadges.map((badge, i) => (
                <BadgeChip key={i} badge={badge} />
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="my-5 border-t border-border/50" />

        {/* CTA primario */}
        <a
          href="/#cotizador"
          className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary to-cyan-500 px-4 py-3 text-[15px] font-bold text-white shadow-sm transition-opacity hover:opacity-90"
        >
          Pedir cotización
        </a>

        {/* Meta info */}
        <div className="mt-4 space-y-2.5 text-sm text-muted-foreground">
          {minTrabajoStr && (
            <div className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
                Mínimo
              </span>
              <span className="font-semibold text-foreground">
                {minTrabajoStr}
              </span>
            </div>
          )}
          {pricing.tiempo_entrega_dias != null && (
            <div className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
                Entrega
              </span>
              <span className="font-semibold text-foreground">
                {pricing.tiempo_entrega_dias} días aprox.
              </span>
            </div>
          )}
          {(location.localidad || location.provincia) && (
            <div className="flex items-center gap-2">
              <MapPin size={14} className="shrink-0 text-muted-foreground/70" aria-hidden="true" />
              <span>
                {[location.localidad, location.provincia]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </div>
          )}
        </div>

        {/* Social */}
        {(social.sitio_web || social.whatsapp) && (
          <div className="mt-4 flex gap-2">
            {social.sitio_web && (
              <a
                href={social.sitio_web}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Sitio web del proveedor"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Globe size={16} />
              </a>
            )}
            {social.whatsapp && (
              <a
                href={buildWhatsAppUrl(social.whatsapp, nombre)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contactar por WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
              >
                <MessageCircle size={16} />
              </a>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
