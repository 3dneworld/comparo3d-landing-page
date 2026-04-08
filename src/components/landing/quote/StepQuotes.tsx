import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  FileText,
  Loader2,
  MapPin,
  Minus,
  Plus,
  Ruler,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";
import { QuoteOption } from "@/lib/api";
import { Switch } from "@/components/ui/switch";
import { TrimmedThumbnail } from "./TrimmedThumbnail";

type SortMode = "recommended" | "price" | "rating";

interface StepQuotesProps {
  isEmpresa: boolean;
  isProcessing: boolean;
  progressMessage: string;
  error: string | null;
  quotes: QuoteOption[];
  sessionId: string;
  thumbnailUrl: string | null;
  material: string | null;
  cantidad: number | null;
  stlDimensions: { x: number; y: number; z: number } | null;
  onSelectQuote: (quoteOptionUid: string) => void;
  onUpdateQuantity: (qty: number) => void | Promise<void>;
  onRetry: () => void;
  onBack: () => void;
}

interface UserLocation {
  lat: number;
  lng: number;
}

interface DisplayQuote extends QuoteOption {
  distanceKm: number | null;
}

const LOCATION_STORAGE_KEY = "comparo3d_location";

const formatRoundedArs = (value: number) =>
  Math.round(Number(value) || 0).toLocaleString("es-AR");

const clampQuantity = (value: number) => Math.min(500, Math.max(1, Math.round(value || 1)));

const getThumbnailSrc = (thumbnailUrl: string) =>
  thumbnailUrl.startsWith("data:") ? thumbnailUrl : `data:image/png;base64,${thumbnailUrl}`;

function FilamentIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className={className}>
      <circle cx="26" cy="32" r="20" stroke="currentColor" strokeWidth="3" />
      <circle cx="26" cy="32" r="8" stroke="currentColor" strokeWidth="3" />
      <path
        d="M34 18c8 3 14 11 16 20 1 4 1 8 0 12"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M41 14c9 4 16 13 18 24 1 5 1 10-1 15"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M10 49h6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M45 27h6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

const getDeliveryDotClass = (days: number) => {
  if (days <= 3) return "bg-emerald-500";
  if (days <= 7) return "bg-amber-400";
  return "bg-sky-500";
};

const haversineKm = (
  from: UserLocation,
  to: { lat: number | null | undefined; lng: number | null | undefined }
) => {
  if (to.lat === null || to.lat === undefined || to.lng === null || to.lng === undefined) {
    return null;
  }

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

function calculateSR(quote: QuoteOption, allQuotes: QuoteOption[]): number {
  const prices = allQuotes.map((q) => q.price_ars);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice || 1;

  const priceScore = 1 - (quote.price_ars - minPrice) / range;
  const ratingScore = (quote.trust_metrics.score || 0) / 5;

  let deliveryScore = 0.1;
  if (quote.delivery_days <= 3) deliveryScore = 1.0;
  else if (quote.delivery_days <= 5) deliveryScore = 0.7;
  else if (quote.delivery_days <= 7) deliveryScore = 0.4;

  const certScore = quote.is_certified ? 1 : 0;

  return priceScore * 0.4 + ratingScore * 0.25 + deliveryScore * 0.15 + certScore * 0.2;
}

function compareBySortMode(sortMode: SortMode, quotes: QuoteOption[]) {
  return (a: QuoteOption, b: QuoteOption) => {
    if (sortMode === "price") {
      return a.price_ars - b.price_ars;
    }

    if (sortMode === "rating") {
      return (
        (b.trust_metrics.score || 0) - (a.trust_metrics.score || 0) ||
        a.price_ars - b.price_ars
      );
    }

    return calculateSR(b, quotes) - calculateSR(a, quotes) || a.price_ars - b.price_ars;
  };
}

function StarRating({ score }: { score: number }) {
  const normalizedScore = Math.max(0, Math.min(score || 0, 5));

  return (
    <span className="flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }).map((_, index) => {
        const fill = normalizedScore - index;
        if (fill >= 1) {
          return <Star key={index} size={14} fill="currentColor" className="text-amber-500" />;
        }

        if (fill >= 0.5) {
          return (
            <span key={index} className="relative h-[14px] w-[14px]">
              <Star size={14} className="absolute inset-0 text-amber-200" />
              <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: "50%" }}>
                <Star size={14} fill="currentColor" className="text-amber-500" />
              </span>
            </span>
          );
        }

        return <Star key={index} size={14} className="text-amber-200" />;
      })}
    </span>
  );
}

function ProviderAvatar({ option }: { option: QuoteOption }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (option.logo_url && !imageFailed) {
    return (
      <img
        src={option.logo_url}
        alt={`Logo de ${option.provider_name}`}
        className="h-12 w-12 rounded-full border border-border object-cover"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[18px] font-bold text-primary">
      {option.provider_name.charAt(0).toUpperCase()}
    </div>
  );
}

function ProviderCard({
  option,
  isBestPrice,
  onSelect,
}: {
  option: DisplayQuote;
  isBestPrice: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`relative rounded-xl border p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-card-hover ${
        isBestPrice
          ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white"
          : "border-border bg-card"
      }`}
    >
      {isBestPrice && (
        <span className="absolute -top-2.5 left-4 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 px-3 py-0.5 text-[11px] font-bold text-white">
          Mejor precio
        </span>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <ProviderAvatar option={option} />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-[16px] font-bold text-foreground">
                {option.provider_name}
              </p>

              {option.trust_metrics.score > 0 && (
                <span className="flex items-center gap-1 text-[13px] text-foreground">
                  <StarRating score={option.trust_metrics.score} />
                  <span className="font-semibold text-amber-600">
                    {option.trust_metrics.score.toFixed(1)}
                  </span>
                  {option.trust_metrics.reviews_count > 0 && (
                    <span className="text-muted-foreground">
                      ({option.trust_metrics.reviews_count})
                    </span>
                  )}
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] text-muted-foreground">
              {option.provider_location && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} className="text-red-500" />
                  <span className="truncate">
                    {option.provider_location}
                    {option.distanceKm !== null && ` · ${Math.round(option.distanceKm)} km`}
                  </span>
                </span>
              )}

              <span className="flex items-center gap-1">
                <span className={`h-2.5 w-2.5 rounded-full ${getDeliveryDotClass(option.delivery_days)}`} />
                <Truck size={12} />
                {option.delivery_days} {option.delivery_days === 1 ? "dia" : "dias"}
              </span>

              {option.is_certified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  <ShieldCheck size={12} />
                  Certificado
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-end justify-between gap-4 md:flex-col md:items-end">
          <p className="text-[20px] font-extrabold leading-tight text-foreground">
            ${formatRoundedArs(option.price_ars)}
          </p>
          <button
            onClick={onSelect}
            className="rounded-lg bg-[#667eea] px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-[#5b6fd6]"
          >
            Comprar
          </button>
        </div>
      </div>
    </div>
  );
}

function SortButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

export function StepQuotes({
  isEmpresa,
  isProcessing,
  progressMessage,
  error,
  quotes,
  sessionId,
  thumbnailUrl,
  material,
  cantidad,
  stlDimensions,
  onSelectQuote,
  onUpdateQuantity,
  onRetry,
  onBack,
}: StepQuotesProps) {
  const [sortMode, setSortMode] = useState<SortMode>("recommended");
  const [filterCertified, setFilterCertified] = useState(false);
  const [filterNearby, setFilterNearby] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [nearbyNotice, setNearbyNotice] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [draftQuantity, setDraftQuantity] = useState(clampQuantity(cantidad ?? 1));

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as UserLocation;
      if (typeof parsed.lat === "number" && typeof parsed.lng === "number") {
        setUserLocation(parsed);
      }
    } catch {
      // ignore malformed persisted location
    }
  }, []);

  useEffect(() => {
    setDraftQuantity(clampQuantity(cantidad ?? 1));
  }, [cantidad]);

  const quotesWithDistance = useMemo<DisplayQuote[]>(
    () =>
      quotes.map((quote) => ({
        ...quote,
        distanceKm: userLocation
          ? haversineKm(userLocation, {
              lat: quote.provider_lat ?? null,
              lng: quote.provider_lng ?? null,
            })
          : null,
      })),
    [quotes, userLocation]
  );

  const visibleQuotes = useMemo(() => {
    let next = [...quotesWithDistance];

    if (filterCertified) {
      next = next.filter((quote) => quote.is_certified);
    }

    if (filterNearby && userLocation) {
      const withCoordinates = next.filter((quote) => quote.distanceKm !== null);
      if (withCoordinates.length > 0) {
        next = withCoordinates;
      }
    }

    const compare = compareBySortMode(sortMode, next);
    next.sort((a, b) => {
      if (filterNearby && userLocation) {
        return (
          (a.distanceKm ?? Number.POSITIVE_INFINITY) -
            (b.distanceKm ?? Number.POSITIVE_INFINITY) || compare(a, b)
        );
      }
      return compare(a, b);
    });

    return next;
  }, [quotesWithDistance, filterCertified, filterNearby, sortMode, userLocation]);

  const lowestVisiblePrice = useMemo(() => {
    if (!visibleQuotes.length) return null;
    return Math.min(...visibleQuotes.map((quote) => quote.price_ars));
  }, [visibleQuotes]);

  const dimensionsLabel = stlDimensions
    ? `${Math.round(stlDimensions.x)}×${Math.round(stlDimensions.y)}×${Math.round(stlDimensions.z)} mm`
    : null;

  const hasNearbyCoordinates = quotesWithDistance.some((quote) => quote.distanceKm !== null);
  const quantityChanged = clampQuantity(draftQuantity) !== clampQuantity(cantidad ?? 1);

  const requestNearby = (shouldEnable: boolean) => {
    if (!shouldEnable) {
      setFilterNearby(false);
      setNearbyNotice(null);
      return;
    }

    if (userLocation) {
      setFilterNearby(true);
      setNearbyNotice(null);
      return;
    }

    if (!navigator.geolocation) {
      setNearbyNotice("Tu navegador no permite usar geolocalizacion.");
      return;
    }

    setIsLocating(true);
    setNearbyNotice(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const location = { lat: coords.latitude, lng: coords.longitude };
        setUserLocation(location);
        setFilterNearby(true);
        setIsLocating(false);
        localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
      },
      () => {
        setNearbyNotice("No pudimos obtener tu ubicacion. Revisa los permisos del navegador.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const submitQuantityUpdate = () => {
    const nextQuantity = clampQuantity(draftQuantity);
    if (nextQuantity === clampQuantity(cantidad ?? 1)) {
      return;
    }

    setDraftQuantity(nextQuantity);
    void onUpdateQuantity(nextQuantity);
  };

  return (
    <div>
      {thumbnailUrl && (
        <div className="mb-6 flex justify-center">
          <div className="inline-flex max-w-full overflow-hidden rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <TrimmedThumbnail
              src={getThumbnailSrc(thumbnailUrl)}
              alt="Vista previa de la pieza"
              className="block max-h-[280px] w-auto max-w-full object-contain sm:max-h-[320px]"
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[24px] font-semibold leading-tight text-foreground">
          {isEmpresa ? "Propuesta en proceso" : "Cotizaciones disponibles"}
        </h3>
        <button
          onClick={onBack}
          disabled={isProcessing}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          aria-label="Volver"
        >
          <ArrowLeft size={16} />
        </button>
      </div>

      {isEmpresa ? (
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
            <FileText size={24} className="text-accent" />
          </div>
          <p className="mb-1 text-[15px] font-medium text-foreground">
            Tu propuesta esta siendo preparada
          </p>
          <p className="mx-auto max-w-md text-[13px] leading-relaxed text-muted-foreground">
            Nuestro equipo esta coordinando con proveedores verificados. Recibis la propuesta
            consolidada en hasta 72 hs habiles.
          </p>
          <p className="mt-4 text-center text-[11px] text-muted-foreground/60">Sesion {sessionId}</p>
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-start gap-3">
            {material && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-[13px] text-foreground">
                <FilamentIcon className="h-[14px] w-[14px] text-primary" />
                {material}
              </span>
            )}

            {dimensionsLabel && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-[13px] text-foreground">
                <Ruler size={13} className="text-primary" />
                {dimensionsLabel}
              </span>
            )}

            <div className="flex flex-col items-start">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-2 py-1 text-[13px] text-foreground">
                <button
                  onClick={() => setDraftQuantity((current) => clampQuantity(current - 1))}
                  disabled={isProcessing}
                  className="rounded-full p-1 text-foreground transition-colors hover:bg-background disabled:opacity-50"
                  aria-label="Restar cantidad"
                >
                  <Minus size={14} />
                </button>
                <span className="min-w-[68px] text-center font-semibold">
                  {draftQuantity} {draftQuantity === 1 ? "pieza" : "piezas"}
                </span>
                <button
                  onClick={() => setDraftQuantity((current) => clampQuantity(current + 1))}
                  disabled={isProcessing}
                  className="rounded-full border border-foreground/60 p-1 text-foreground transition-colors hover:bg-background disabled:opacity-50"
                  aria-label="Sumar cantidad"
                >
                  <Plus size={14} />
                </button>
              </div>

              {quantityChanged && !isProcessing && (
                <button
                  onClick={submitQuantityUpdate}
                  className="mt-2 rounded-xl bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Actualizar
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 md:ml-auto">
              <label className="inline-flex items-center gap-2 text-[13px] font-medium text-foreground">
                <BadgeCheck size={16} className="text-emerald-500" />
                <span>Solo certificados</span>
                <Switch checked={filterCertified} onCheckedChange={setFilterCertified} />
              </label>

              <label className="inline-flex items-center gap-2 text-[13px] font-medium text-foreground">
                {isLocating ? (
                  <Loader2 size={14} className="animate-spin text-primary" />
                ) : (
                  <MapPin size={16} className="text-red-500" fill="currentColor" stroke="white" strokeWidth={1.7} />
                )}
                <span>Cerca mio</span>
                <Switch
                  checked={filterNearby}
                  disabled={isLocating}
                  onCheckedChange={(checked) => requestNearby(checked)}
                />
              </label>
            </div>
          </div>

          {(nearbyNotice || (filterNearby && userLocation && !hasNearbyCoordinates)) && (
            <p className="mt-2 text-[12px] text-muted-foreground">
              {nearbyNotice || "No encontramos proveedores con coordenadas publicas para ordenar por cercania."}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <SortButton
              active={sortMode === "recommended"}
              label="Recomendado"
              onClick={() => setSortMode("recommended")}
            />
            <SortButton
              active={sortMode === "price"}
              label="Precio"
              onClick={() => setSortMode("price")}
            />
            <SortButton
              active={sortMode === "rating"}
              label="Rating"
              onClick={() => setSortMode("rating")}
            />
          </div>

          {isProcessing && (
            <div className="mt-6 flex flex-col items-center gap-4 py-8">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-[15px] font-medium text-foreground">{progressMessage}</p>
              <p className="text-[13px] text-muted-foreground">
                Estamos calculando el costo exacto con PrusaSlicer para cada proveedor disponible
              </p>
            </div>
          )}

          {error && !isProcessing && (
            <div className="mt-5 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
              <p className="text-[13px] text-destructive">{error}</p>
              <button
                onClick={onRetry}
                className="mt-3 rounded-lg bg-primary/10 px-4 py-2 text-[13px] font-semibold text-primary transition-colors hover:bg-primary/15"
              >
                Reintentar
              </button>
            </div>
          )}

          {!isProcessing && visibleQuotes.length > 0 && (
            <div className="mt-6 space-y-3">
              {visibleQuotes.map((quote) => (
                <ProviderCard
                  key={quote.quote_option_uid}
                  option={quote}
                  isBestPrice={lowestVisiblePrice !== null && quote.price_ars === lowestVisiblePrice}
                  onSelect={() => onSelectQuote(quote.quote_option_uid)}
                />
              ))}
            </div>
          )}

          {!isProcessing && !error && visibleQuotes.length === 0 && (
            <div className="mt-5 rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-[14px] text-muted-foreground">
                {quotes.length > 0
                  ? "No quedaron proveedores para los filtros seleccionados."
                  : "No se encontraron cotizaciones disponibles. Por favor intenta de nuevo."}
              </p>
            </div>
          )}

          <p className="mt-4 text-center text-[11px] text-muted-foreground/60">Sesion {sessionId}</p>
        </>
      )}
    </div>
  );
}
