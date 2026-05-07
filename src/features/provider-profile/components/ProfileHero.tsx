// ProfileHero.tsx - ficha izquierda del perfil publico de proveedor
import { Globe, HelpCircle, MapPin, MessageCircle, Star } from "lucide-react";
import { AvatarFallback } from "./AvatarFallback";
import type { PublicProvider, PublicProviderBadge } from "../types";

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

function buildWhatsAppUrl(whatsapp: string): string {
  const phone = whatsapp.replace(/\D/g, "");
  const msg = encodeURIComponent(
    "Hola, vi tu perfil en Comparo3D y queria consultarte por un trabajo.",
  );
  return `https://wa.me/${phone}?text=${msg}`;
}

function getBadgeImage(badge: PublicProviderBadge): string | null {
  const type = String(badge.type || "").toLowerCase();
  const tier = String(badge.tier || "").toLowerCase();

  if (type.includes("organico")) return "/badges/badge-organico.png";
  if (type.includes("fundador") || type.includes("trayectoria")) {
    return tier.includes("10") ? "/badges/badge-10-anos.png" : "/badges/badge-5-anos.png";
  }
  return null;
}

function ProfileBadgeMark({ badge }: { badge: PublicProviderBadge }) {
  const image = getBadgeImage(badge);
  if (!image) return null;

  return (
    <div className="flex items-center justify-end gap-2">
      <img
        src={image}
        alt={badge.label}
        className="h-20 w-20 shrink-0 object-contain drop-shadow-sm"
      />
      <button
        type="button"
        title={badge.label}
        aria-label={`Mas informacion sobre ${badge.label}`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/15 bg-primary/5 text-primary transition hover:bg-primary/10"
      >
        <HelpCircle size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

export function ProfileHero({ provider, badges }: Props) {
  const { id, nombre, logo_url, location, social, pricing, rating } = provider;
  const visualBadges = badges
    .map((badge, index) => ({ badge, index, image: getBadgeImage(badge) }))
    .filter((item) => item.image)
    .slice(0, 2);
  const hasRating = rating.count > 0 && rating.average != null;
  const minTrabajoStr = formatARS(pricing.min_trabajo_ars);

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="overflow-hidden rounded-[28px] border border-border/70 bg-card p-6 shadow-[0_18px_55px_rgba(15,23,42,0.10)]">
        <div className="grid grid-cols-[112px_1fr] items-center gap-5">
          {logo_url ? (
            <img
              src={logo_url}
              alt={`Logo de ${nombre}`}
              className="h-28 w-28 rounded-full object-cover shadow-sm ring-2 ring-border/50"
            />
          ) : (
            <AvatarFallback id={id} nombre={nombre} size={112} />
          )}

          <div className="min-w-0">
            <h1 className="font-[Montserrat] text-3xl font-extrabold leading-tight tracking-[-0.03em] text-foreground">
              {nombre}
            </h1>
            {hasRating ? (
              <div className="mt-5 flex items-center gap-2 text-base">
                <Star
                  size={22}
                  className="fill-amber-400 text-amber-400"
                  aria-hidden="true"
                />
                <span className="font-bold text-foreground">
                  {rating.average!.toFixed(1)}
                </span>
                <span className="text-muted-foreground">
                  ({rating.count} reseñas)
                </span>
              </div>
            ) : (
              <p className="mt-5 text-sm text-muted-foreground">
                Sin reseñas aun
              </p>
            )}
          </div>
        </div>

        <div className="mt-7 grid gap-5 sm:grid-cols-[1fr_auto]">
          <div className="space-y-4 text-[15px]">
            {minTrabajoStr && (
              <div className="grid grid-cols-[92px_1fr] items-baseline gap-3">
                <span className="text-sm font-extrabold uppercase tracking-wide text-muted-foreground/70">
                  Minimo
                </span>
                <span className="font-extrabold text-foreground">
                  {minTrabajoStr}
                </span>
              </div>
            )}
            {pricing.tiempo_entrega_dias != null && (
              <div className="grid grid-cols-[92px_1fr] items-baseline gap-3">
                <span className="text-sm font-extrabold uppercase tracking-wide text-muted-foreground/70">
                  Entrega
                </span>
                <span className="font-extrabold text-foreground">
                  {pricing.tiempo_entrega_dias} dias aprox.
                </span>
              </div>
            )}
            {(location.localidad || location.provincia) && (
              <div className="flex items-center gap-3 pt-1 text-muted-foreground">
                <MapPin size={18} className="shrink-0" aria-hidden="true" />
                <span className="font-semibold">
                  {[location.localidad, location.provincia]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            )}
          </div>

          {visualBadges.length > 0 && (
            <div className="flex flex-col items-end gap-3">
              {visualBadges.map(({ badge, index }) => (
                <ProfileBadgeMark key={`${badge.type}-${index}`} badge={badge} />
              ))}
            </div>
          )}
        </div>

        <a
          href="/#cotizador"
          className="mt-7 flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-[15px] font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
        >
          Pedir cotizacion
        </a>

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
                href={buildWhatsAppUrl(social.whatsapp)}
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
