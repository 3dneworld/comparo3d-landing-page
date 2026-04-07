/**
 * StepCheckout.tsx — Paso 4: Dirección de envío + método + resumen + pago MP
 * FASE 10
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CreditCard,
  Loader2,
  MapPin,
  Package,
  Store,
  Truck,
} from "lucide-react";
import {
  createCheckout,
  getShippingEstimate,
  getShippingMethods,
  isApiError,
  ShippingMethod,
  type QuoteOption,
} from "@/lib/api";

// ─── Tipos internos ──────────────────────────────────────────────────────────

interface AddressForm {
  street: string;
  number: string;
  floor: string;
  city: string;
  postal_code: string;
  province: string;
}

interface PersistedCheckoutState {
  address?: Partial<AddressForm>;
  selectedMethodId?: string;
}

export interface StepCheckoutProps {
  selectedQuote: QuoteOption;
  orderId: string;
  sessionId: string;
  isEmpresa: boolean;
  isAccepting?: boolean;
  onBack: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const defaultAddress: AddressForm = {
  street: "",
  number: "",
  floor: "",
  city: "",
  postal_code: "",
  province: "",
};

const checkoutStorageKey = (sessionId: string, orderId: string) =>
  `comparo3d_checkout_${sessionId}_${orderId}`;

const METHOD_ICONS: Record<string, typeof Truck> = {
  retiro: Store,
  paq_clasico: Truck,
  paq_expreso: Package,
};

const FALLBACK_METHODS: ShippingMethod[] = [
  { id: "retiro", name: "Retiro en punto acordado", eta_days: 0 },
  { id: "paq_clasico", name: "PAQ.AR Clásico", eta_days: 5 },
  { id: "paq_expreso", name: "PAQ.AR Expreso", eta_days: 2 },
];

// ─── Sub-componente: card de método de envío ─────────────────────────────────

function ShippingMethodCard({
  method,
  isSelected,
  estimatePrice,
  isLoadingEstimate,
  onSelect,
}: {
  method: ShippingMethod;
  isSelected: boolean;
  estimatePrice: number | null;
  isLoadingEstimate: boolean;
  onSelect: () => void;
}) {
  const Icon = METHOD_ICONS[method.id] ?? Truck;

  return (
    <label
      className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all duration-150 ${
        isSelected
          ? "border-primary/35 bg-primary/[0.04]"
          : "border-border hover:border-primary/20 hover:bg-muted/30"
      }`}
    >
      <input
        type="radio"
        name="shipping_method"
        className="sr-only"
        checked={isSelected}
        onChange={onSelect}
      />

      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
          isSelected
            ? "border-primary/20 bg-primary/10 text-primary"
            : "border-border bg-muted/50 text-muted-foreground"
        }`}
      >
        <Icon size={19} />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`text-[14px] font-semibold leading-snug ${
            isSelected ? "text-foreground" : "text-foreground/80"
          }`}
        >
          {method.name}
        </p>
        {method.eta_days > 0 && (
          <p className="text-[12px] text-muted-foreground">
            {method.eta_days} días hábiles
          </p>
        )}
        {method.eta_days === 0 && (
          <p className="text-[12px] text-muted-foreground">
            A coordinar con el proveedor
          </p>
        )}
      </div>

      {/* Precio estimado (solo cuando está seleccionado) */}
      <div className="shrink-0 text-right">
        {isSelected && isLoadingEstimate && (
          <Loader2 size={14} className="animate-spin text-muted-foreground" />
        )}
        {isSelected && !isLoadingEstimate && estimatePrice !== null && (
          <p className="text-[15px] font-bold text-foreground">
            {estimatePrice === 0 ? "Gratis" : `$${estimatePrice.toLocaleString("es-AR")}`}
          </p>
        )}
        {isSelected && !isLoadingEstimate && estimatePrice === null && method.id !== "retiro" && (
          <p className="text-[12px] text-muted-foreground">—</p>
        )}
      </div>
    </label>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

export function StepCheckout({
  selectedQuote,
  orderId,
  sessionId,
  isEmpresa,
  isAccepting = false,
  onBack,
}: StepCheckoutProps) {
  const [address, setAddress] = useState<AddressForm>(defaultAddress);
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState("");
  const [estimatePrice, setEstimatePrice] = useState<number | null>(null);
  const [estimateEta, setEstimateEta] = useState<number | null>(null);

  const [loadingMethods, setLoadingMethods] = useState(false);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [creatingCheckout, setCreatingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const skipNextCheckoutSaveRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (!sessionId || !orderId) return;
    try {
      const raw = localStorage.getItem(checkoutStorageKey(sessionId, orderId));
      if (!raw) return;
      const parsed = JSON.parse(raw) as PersistedCheckoutState;
      skipNextCheckoutSaveRef.current = true;
      setAddress({ ...defaultAddress, ...(parsed.address ?? {}) });
      setSelectedMethodId(parsed.selectedMethodId ?? "");
    } catch {
      // Ignore malformed checkout state and let the customer fill it again.
    }
  }, [sessionId, orderId]);

  useEffect(() => {
    if (!sessionId || !orderId) return;
    if (skipNextCheckoutSaveRef.current) {
      skipNextCheckoutSaveRef.current = false;
      return;
    }
    localStorage.setItem(
      checkoutStorageKey(sessionId, orderId),
      JSON.stringify({ address, selectedMethodId })
    );
  }, [address, selectedMethodId, sessionId, orderId]);

  // Cargar métodos de envío al montar
  useEffect(() => {
    const load = async () => {
      setLoadingMethods(true);
      const result = await getShippingMethods();
      if (!isMountedRef.current) return;
      setMethods(isApiError(result) ? FALLBACK_METHODS : result.methods);
      setLoadingMethods(false);
    };
    load();
  }, []);

  const isRetiro = selectedMethodId === "retiro";

  // Calcular estimación de envío (debounced 600ms)
  // Solo cuando hay método seleccionado + CP válido + no es retiro
  useEffect(() => {
    if (!selectedMethodId || isRetiro) {
      setEstimatePrice(isRetiro ? 0 : null);
      setEstimateEta(null);
      return;
    }
    if (address.postal_code.length < 4) {
      setEstimatePrice(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!isMountedRef.current) return;
      setLoadingEstimate(true);
      const result = await getShippingEstimate({
        method_id: selectedMethodId,
        postal_code: address.postal_code,
        province: address.province || undefined,
      });
      if (!isMountedRef.current) return;
      if (!isApiError(result)) {
        setEstimatePrice(result.price);
        setEstimateEta(result.eta_days);
      } else {
        setEstimatePrice(null);
        setEstimateEta(null);
      }
      setLoadingEstimate(false);
    }, 600);
  }, [selectedMethodId, address.postal_code, address.province, isRetiro]);

  // Validación del formulario
  const isFormValid = useMemo(() => {
    if (!selectedMethodId) return false;
    if (isRetiro) return true;
    return (
      address.street.trim().length > 0 &&
      address.number.trim().length > 0 &&
      address.city.trim().length > 0 &&
      address.postal_code.length >= 4 &&
      address.province.trim().length > 0
    );
  }, [address, selectedMethodId, isRetiro]);

  const setField =
    (field: keyof AddressForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setAddress((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethodId(methodId);
    setEstimatePrice(null);
    setEstimateEta(null);
    setCheckoutError(null);
  };

  // Totales para el resumen
  const printPrice = selectedQuote.price_ars;
  const shippingPrice = estimatePrice ?? 0;
  const total = printPrice + shippingPrice;
  const totalIsPartial = !isRetiro && estimatePrice === null && !!selectedMethodId;

  const selectedMethod = methods.find((m) => m.id === selectedMethodId);
  const deliveryDays = estimateEta ?? selectedMethod?.eta_days ?? selectedQuote.delivery_days;

  // ─── Handler de pago ────────────────────────────────────────────────────────

  const handlePay = async () => {
    if (!isFormValid || creatingCheckout) return;
    setCreatingCheckout(true);
    setCheckoutError(null);

    const result = await createCheckout(sessionId, {
      order_id: orderId,
      shipping: {
        method_id: selectedMethodId,
        price: estimatePrice ?? 0,
        eta_days: deliveryDays ?? 0,
        address: isRetiro
          ? undefined
          : {
              street: address.street,
              number: address.number,
              floor: address.floor || undefined,
              city: address.city,
              postal_code: address.postal_code,
              province: address.province,
            },
      },
    });

    if (!isMountedRef.current) return;

    if (isApiError(result)) {
      setCheckoutError(
        result.error || "Error al iniciar el pago. Por favor intentá de nuevo."
      );
      setCreatingCheckout(false);
      return;
    }

    // Redirigir a MercadoPago
    window.location.href = result.init_point;
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  // Estado intermedio: acceptQuote aún en curso
  if (isAccepting) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-[15px] font-medium text-foreground">
          Confirmando tu selección...
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-6">
        <h3 className="text-[24px] font-semibold leading-tight text-foreground">
          {isEmpresa ? "Completar pedido" : "Datos de envío y pago"}
        </h3>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          {isEmpresa
            ? "Elegí cómo querés recibir tu pedido y confirmá el pago."
            : "Elegí el método de envío, completá los datos y pasá al pago."}
        </p>
      </div>

      {/* Layout: form izquierda, resumen derecha */}
      <div className="grid gap-6 md:grid-cols-[1fr_288px]">

        {/* ── Columna izquierda: método + dirección ── */}
        <div className="space-y-6">

          {/* Método de envío */}
          <div>
            <p className="mb-3 text-[14px] font-semibold text-foreground">
              Método de envío
            </p>

            {loadingMethods ? (
              <div className="flex items-center gap-2 py-4 text-muted-foreground">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-[14px]">Cargando métodos...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {methods.map((m) => (
                  <ShippingMethodCard
                    key={m.id}
                    method={m}
                    isSelected={selectedMethodId === m.id}
                    estimatePrice={selectedMethodId === m.id ? estimatePrice : null}
                    isLoadingEstimate={
                      selectedMethodId === m.id && loadingEstimate
                    }
                    onSelect={() => handleMethodSelect(m.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Dirección de entrega (solo para envío a domicilio) */}
          {selectedMethodId && !isRetiro && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <MapPin size={15} className="text-primary" />
                <p className="text-[14px] font-semibold text-foreground">
                  Dirección de entrega
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[14px] font-semibold text-foreground">
                    Calle
                  </label>
                  <input
                    value={address.street}
                    onChange={setField("street")}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Nombre de la calle"
                    autoComplete="street-address"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[14px] font-semibold text-foreground">
                    Número
                  </label>
                  <input
                    value={address.number}
                    onChange={setField("number")}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Nro. de puerta"
                    autoComplete="address-line2"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-[14px] font-semibold text-foreground">
                    Piso / Depto{" "}
                    <span className="font-normal text-muted-foreground">
                      (opcional)
                    </span>
                  </label>
                  <input
                    value={address.floor}
                    onChange={setField("floor")}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Ej: 3° B"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[14px] font-semibold text-foreground">
                    Ciudad
                  </label>
                  <input
                    value={address.city}
                    onChange={setField("city")}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Tu ciudad"
                    autoComplete="address-level2"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[14px] font-semibold text-foreground">
                    Código Postal
                  </label>
                  <input
                    value={address.postal_code}
                    onChange={setField("postal_code")}
                    inputMode="numeric"
                    maxLength={8}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Ej: 1425"
                    autoComplete="postal-code"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-[14px] font-semibold text-foreground">
                    Provincia
                  </label>
                  <input
                    value={address.province}
                    onChange={setField("province")}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Ej: Buenos Aires"
                    autoComplete="address-level1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Retiro: aviso de coordinación */}
          {isRetiro && selectedMethodId && (
            <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
              <p className="text-[14px] leading-relaxed text-muted-foreground">
                Coordinamos el punto y horario de retiro con el proveedor. Te
                avisamos por email cuando esté listo.
              </p>
            </div>
          )}
        </div>

        {/* ── Columna derecha: resumen + botón de pago ── */}
        <div>
          <div className="rounded-2xl border border-border bg-muted/35 p-5">
            <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Resumen del pedido
            </p>

            <div className="space-y-3">
              {/* Proveedor */}
              <div className="flex items-start justify-between gap-3">
                <span className="text-[14px] text-muted-foreground">
                  Proveedor
                </span>
                <span className="max-w-[140px] text-right text-[14px] font-medium text-foreground">
                  {selectedQuote.provider_name}
                </span>
              </div>

              {/* Impresión */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-[14px] text-muted-foreground">
                  Impresión
                </span>
                <span className="text-[14px] font-semibold text-foreground">
                  ${printPrice.toLocaleString("es-AR")}
                </span>
              </div>

              {/* Envío */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-[14px] text-muted-foreground">Envío</span>
                <span className="text-[14px] font-semibold text-foreground">
                  {loadingEstimate ? (
                    <Loader2 size={14} className="animate-spin text-muted-foreground" />
                  ) : estimatePrice === null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : estimatePrice === 0 ? (
                    <span className="text-accent">Gratis</span>
                  ) : (
                    `$${estimatePrice.toLocaleString("es-AR")}`
                  )}
                </span>
              </div>

              {/* Total */}
              <div className="border-t border-border pt-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[15px] font-semibold text-foreground">
                    Total
                  </span>
                  <span className="text-[22px] font-extrabold leading-tight text-foreground">
                    {totalIsPartial && (
                      <span className="mr-0.5 text-[16px] font-medium text-muted-foreground">
                        desde{" "}
                      </span>
                    )}
                    ${total.toLocaleString("es-AR")}
                  </span>
                </div>
                {totalIsPartial && (
                  <p className="mt-1 text-right text-[11px] text-muted-foreground">
                    Completá el CP para calcular el envío exacto
                  </p>
                )}
              </div>

              {/* Entrega estimada + referencia */}
              <div className="space-y-1 border-t border-border pt-3">
                {deliveryDays !== null && deliveryDays !== undefined && deliveryDays > 0 && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12px] text-muted-foreground">
                      Entrega estimada
                    </span>
                    <span className="text-[12px] font-medium text-foreground">
                      {deliveryDays} días hábiles
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[12px] text-muted-foreground">
                    Referencia
                  </span>
                  <span className="font-mono text-[12px] font-medium text-foreground">
                    {orderId}
                  </span>
                </div>
              </div>
            </div>

            {/* Error de checkout */}
            {checkoutError && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-3">
                <AlertCircle
                  size={14}
                  className="mt-0.5 shrink-0 text-destructive"
                />
                <p className="text-[13px] leading-snug text-destructive">
                  {checkoutError}
                </p>
              </div>
            )}

            {/* Botón de pago */}
            <button
              onClick={handlePay}
              disabled={!isFormValid || creatingCheckout}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3.5 text-[15px] font-semibold text-primary-foreground shadow-cta transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {creatingCheckout ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Preparando pago...
                </>
              ) : (
                <>
                  <CreditCard size={17} />
                  Pagar con MercadoPago
                </>
              )}
            </button>

            <p className="mt-2 text-center text-[11px] leading-relaxed text-muted-foreground">
              Serás redirigido a la plataforma segura de MercadoPago
            </p>
          </div>
        </div>
      </div>

      {/* Botón Atrás */}
      <button
        onClick={onBack}
        disabled={creatingCheckout}
        className="mt-6 rounded-xl border border-border px-5 py-3 text-[14px] font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
      >
        Atrás
      </button>
    </div>
  );
}
