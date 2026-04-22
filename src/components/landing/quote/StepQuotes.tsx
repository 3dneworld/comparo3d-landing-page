import { useEffect, useMemo, useRef, useState } from "react";
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
import { geocodeAddress, isApiError, type QuoteOption } from "@/lib/api";
import { BadgeChip, sortBadges } from "./BadgeChip";
import { RankingExplainer } from "@/components/shared/RankingExplainer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
const LOCATION_ADDRESS_STORAGE_KEY = "comparo3d_location_address";

interface NearbyAddressForm {
  street: string;
  number: string;
  floor: string;
  city: string;
  postal_code: string;
  province: string;
}

type NearbyNotice =
  | { type: "address-help"; message: string }
  | { type: "plain"; message: string }
  | null;

const defaultNearbyAddress: NearbyAddressForm = {
  street: "",
  number: "",
  floor: "",
  city: "",
  postal_code: "",
  province: "",
};

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

function compareBySortMode(sortMode: SortMode) {
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

    const aPos = a.ranking_position ?? Number.POSITIVE_INFINITY;
    const bPos = b.ranking_position ?? Number.POSITIVE_INFINITY;
    return aPos - bPos || a.price_ars - b.price_ars;
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
  isRecommended,
  onSelect,
}: {
  option: DisplayQuote;
  isRecommended: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`relative rounded-xl border p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-card-hover ${
        isRecommended
          ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white"
          : "border-border bg-card"
      }`}
    >
      {isRecommended && (
        <span className="absolute -top-2.5 left-4 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 px-3 py-0.5 text-[11px] font-bold text-white">
          Oferta Recomendada
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
                <Truck size={12} />
                {option.delivery_days} {option.delivery_days === 1 ? "dia" : "dias"}
              </span>

              {sortBadges(option.badges ?? []).map((badge) => (
                <BadgeChip key={badge.badge_type} badge={badge} />
              ))}
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
      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
        active
          ? "border-primary/70 bg-primary/10 text-primary"
          : "border-transparent bg-transparent text-muted-foreground hover:border-primary/20 hover:text-foreground"
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
  const [nearbyNotice, setNearbyNotice] = useState<NearbyNotice>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [draftQuantity, setDraftQuantity] = useState(clampQuantity(cantidad ?? 1));
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [showRankingExplainer, setShowRankingExplainer] = useState(false);
  const [mediationAccordionValue, setMediationAccordionValue] = useState<string | undefined>();
  const quotesListRef = useRef<HTMLDivElement | null>(null);
  const mediationRef = useRef<HTMLElement | null>(null);
  const [addressForm, setAddressForm] = useState<NearbyAddressForm>(() => {
    try {
      const raw = localStorage.getItem(LOCATION_ADDRESS_STORAGE_KEY);
      if (!raw) return defaultNearbyAddress;
      const parsed = JSON.parse(raw) as Partial<NearbyAddressForm>;
      return { ...defaultNearbyAddress, ...parsed };
    } catch {
      return defaultNearbyAddress;
    }
  });

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
    localStorage.setItem(LOCATION_ADDRESS_STORAGE_KEY, JSON.stringify(addressForm));
  }, [addressForm]);

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
      next = next.filter((quote) =>
        quote.badges?.some(
          (b) =>
            b.badge_type === "certificado_organico" ||
            b.badge_type === "seleccion_fundador",
        ),
      );
    }

    if (filterNearby && userLocation) {
      const withCoordinates = next.filter((quote) => quote.distanceKm !== null);
      if (withCoordinates.length > 0) {
        next = withCoordinates;
      }
    }

    const compare = compareBySortMode(sortMode);
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

  useEffect(() => {
    const node = quotesListRef.current;
    if (!node || visibleQuotes.length === 0 || isProcessing) {
      setShowRankingExplainer(false);
      return;
    }

    const updateVisibility = () => {
      const rect = node.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      setShowRankingExplainer(rect.bottom > 0 && rect.top < viewportHeight);
    };

    updateVisibility();

    if (!("IntersectionObserver" in window)) {
      window.addEventListener("scroll", updateVisibility, { passive: true });
      window.addEventListener("resize", updateVisibility);
      return () => {
        window.removeEventListener("scroll", updateVisibility);
        window.removeEventListener("resize", updateVisibility);
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowRankingExplainer(entry.isIntersecting);
      },
      { threshold: 0 }
    );
    observer.observe(node);

    return () => observer.disconnect();
  }, [visibleQuotes.length, isProcessing]);

  const openMediationPolicy = () => {
    setMediationAccordionValue("politica");
    window.setTimeout(() => {
      mediationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      mediationRef.current?.focus({ preventScroll: true });
    }, 0);
  };

  const recommendedQuoteUid = useMemo(() => {
    if (!visibleQuotes.length) return null;
    const topRanked = visibleQuotes.find((quote) => quote.ranking_position === 1);
    return (topRanked ?? visibleQuotes[0]).quote_option_uid;
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
      setShowAddressForm(false);
      return;
    }

    if (userLocation) {
      setFilterNearby(true);
      setNearbyNotice(null);
      return;
    }

    if (!navigator.geolocation) {
      setNearbyNotice({
        type: "address-help",
        message:
          "No pudimos obtener tu ubicacion. Con tu domicilio podemos darte los proveedores mas cercanos a vos.",
      });
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
        setShowAddressForm(false);
        localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
      },
      () => {
        setNearbyNotice({
          type: "address-help",
          message:
            "No pudimos obtener tu ubicacion. Con tu domicilio podemos darte los proveedores mas cercanos a vos.",
        });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const handleAddressFieldChange =
    (field: keyof NearbyAddressForm) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setAddressForm((current) => ({ ...current, [field]: event.target.value }));
    };

  const handleAddressSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSavingAddress) return;

    if (
      !addressForm.street.trim() ||
      !addressForm.number.trim() ||
      !addressForm.city.trim() ||
      !addressForm.postal_code.trim() ||
      !addressForm.province.trim()
    ) {
      setNearbyNotice({
        type: "plain",
        message: "Completa calle, numero, ciudad, codigo postal y provincia para ubicar tu domicilio.",
      });
      return;
    }

    setIsSavingAddress(true);
    setNearbyNotice(null);

    const result = await geocodeAddress({
      street: addressForm.street,
      number: addressForm.number,
      floor: addressForm.floor || undefined,
      city: addressForm.city,
      postal_code: addressForm.postal_code,
      province: addressForm.province,
    });

    if (isApiError(result)) {
      setNearbyNotice({ type: "plain", message: result.error });
      setIsSavingAddress(false);
      return;
    }

    const location = { lat: result.lat, lng: result.lng };
    setUserLocation(location);
    setFilterNearby(true);
    setShowAddressForm(false);
    setNearbyNotice(null);
    setIsSavingAddress(false);
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
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
                <span>Proveedores Certificados</span>
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
            <div className="mt-2 space-y-3">
              {nearbyNotice && (
                <p className="text-[12px] text-muted-foreground">
                  {nearbyNotice.type === "address-help" ? (
                    <>
                      No pudimos obtener tu ubicacion. Con{" "}
                      <button
                        type="button"
                        onClick={() => setShowAddressForm((current) => !current)}
                        className="font-medium text-primary underline underline-offset-2 transition-colors hover:text-primary/80"
                      >
                        tu domicilio
                      </button>{" "}
                      podemos darte los proveedores mas cercanos a vos.
                    </>
                  ) : (
                    nearbyNotice.message
                  )}
                </p>
              )}

              {!nearbyNotice && filterNearby && userLocation && !hasNearbyCoordinates && (
                <p className="text-[12px] text-muted-foreground">
                  No encontramos proveedores con coordenadas publicas para ordenar por cercania.
                </p>
              )}

              {showAddressForm && (
                <form
                  onSubmit={handleAddressSubmit}
                  className="rounded-2xl border border-border bg-muted/30 p-4"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold text-foreground">
                        Calle
                      </label>
                      <input
                        value={addressForm.street}
                        onChange={handleAddressFieldChange("street")}
                        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Nombre de la calle"
                        autoComplete="street-address"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold text-foreground">
                        Numero
                      </label>
                      <input
                        value={addressForm.number}
                        onChange={handleAddressFieldChange("number")}
                        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Nro. de puerta"
                        autoComplete="address-line2"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-[13px] font-semibold text-foreground">
                        Piso / Depto <span className="font-normal text-muted-foreground">(opcional)</span>
                      </label>
                      <input
                        value={addressForm.floor}
                        onChange={handleAddressFieldChange("floor")}
                        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Ej: 3 B"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold text-foreground">
                        Ciudad
                      </label>
                      <input
                        value={addressForm.city}
                        onChange={handleAddressFieldChange("city")}
                        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Tu ciudad"
                        autoComplete="address-level2"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold text-foreground">
                        Codigo Postal
                      </label>
                      <input
                        value={addressForm.postal_code}
                        onChange={handleAddressFieldChange("postal_code")}
                        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Ej: 1425"
                        autoComplete="postal-code"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-[13px] font-semibold text-foreground">
                        Provincia
                      </label>
                      <input
                        value={addressForm.province}
                        onChange={handleAddressFieldChange("province")}
                        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Ej: Buenos Aires"
                        autoComplete="address-level1"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingAddress}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {isSavingAddress && <Loader2 size={14} className="animate-spin" />}
                      Usar este domicilio
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

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
            <div ref={quotesListRef} className="mt-6 space-y-3">
              {visibleQuotes.map((quote) => (
                <ProviderCard
                  key={quote.quote_option_uid}
                  option={quote}
                  isRecommended={quote.quote_option_uid === recommendedQuoteUid}
                  onSelect={() => onSelectQuote(quote.quote_option_uid)}
                />
              ))}

              <div className="flex justify-end pt-1">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-2 py-1 text-[11px] text-muted-foreground">
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
              </div>
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

          {visibleQuotes.length > 0 && (
            <section
              id="politica-mediacion"
              ref={mediationRef}
              tabIndex={-1}
              className="mx-auto mt-8 max-w-3xl scroll-mt-24 border-t border-border pt-6 text-[13px] text-muted-foreground focus:outline-none"
            >
              <Accordion
                type="single"
                collapsible
                value={mediationAccordionValue}
                onValueChange={setMediationAccordionValue}
              >
                <AccordionItem value="politica" className="border-none">
                  <AccordionTrigger className="justify-start gap-2 py-2 text-[13px] font-semibold text-foreground hover:no-underline">
                    Política de Mediación Transparente
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 text-[13px] leading-relaxed">
                    <p>
                      Comparo3D conecta a compradores con proveedores de impresión 3D.
                      La ejecución, calidad y garantía del trabajo son
                      responsabilidad del proveedor que elijas.
                    </p>
                    <p className="mt-3">
                      Si surge un problema con tu pedido, Comparo3D actúa como mediador:
                      revisamos el caso, facilitamos la comunicación con el proveedor y,
                      cuando corresponda, aplicamos sanciones en su ranking. Nuestro sistema
                      de Trayectoria Verificada, ratings
                      reales y certificación por desempeño existe justamente para que elijas
                      con información.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>
          )}

        </>
      )}

      {visibleQuotes.length > 0 && showRankingExplainer && (
        <RankingExplainer
          mediationLinkTarget="#politica-mediacion"
          onMediationClick={openMediationPolicy}
        />
      )}
    </div>
  );
}
