import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  AlertCircle,
  Check,
  CreditCard,
  Loader2,
  MapPin,
  Package,
  Store,
  Truck,
} from "lucide-react";
import {
  getAddressProvinces,
  normalizeAddress,
  searchAddressLocalities,
  createCheckout,
  getShippingEstimate,
  getShippingMethods,
  isApiError,
  type AddressLocality,
  type AddressProvince,
  type NormalizeAddressResponse,
  type QuoteOption,
  type ShippingMethod,
} from "@/lib/api";
import { TrimmedThumbnail } from "./TrimmedThumbnail";

interface AddressForm {
  street: string;
  number: string;
  floor: string;
  city: string;
  locality_id: string;
  postal_code: string;
  province: string;
  province_id: string;
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
  cantidad?: number | null;
  thumbnailUrl?: string | null;
  onBack: () => void;
}

const defaultAddress: AddressForm = {
  street: "",
  number: "",
  floor: "",
  city: "",
  locality_id: "",
  postal_code: "",
  province: "",
  province_id: "",
};

interface AddressValidationState {
  validated: boolean;
  normalized: NormalizeAddressResponse["normalized"];
  validation: NormalizeAddressResponse["validation"];
}

const checkoutStorageKey = (sessionId: string, orderId: string) =>
  `comparo3d_checkout_${sessionId}_${orderId}`;

const METHOD_ICONS: Record<string, typeof Truck> = {
  retiro: Store,
  paq_clasico: Truck,
  paq_expreso: Package,
};

const FALLBACK_METHODS: ShippingMethod[] = [
  { id: "retiro", name: "Retiro en oficinas del proveedor", eta_days: 0 },
  { id: "paq_clasico", name: "PAQ.AR Clasico", eta_days: 5 },
  { id: "paq_expreso", name: "PAQ.AR Expreso", eta_days: 2 },
];

const formatRoundedArs = (value: number) =>
  Math.round(Number(value) || 0).toLocaleString("es-AR");

const formatEstimatedDate = (days: number) => {
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + Math.max(0, days));
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(baseDate);
};

function ShippingMethodCard({
  method,
  isSelected,
  estimatePrice,
  isLoadingEstimate,
  pickupReadyLabel,
  onSelect,
}: {
  method: ShippingMethod;
  isSelected: boolean;
  estimatePrice: number | null;
  isLoadingEstimate: boolean;
  pickupReadyLabel: string;
  onSelect: () => void;
}) {
  const Icon = METHOD_ICONS[method.id] ?? Truck;
  const isPickup = method.id === "retiro";
  const title = isPickup ? "Retiro en oficinas del proveedor" : method.name;
  const subtitle = isPickup
    ? `Fecha estimada: ${pickupReadyLabel}`
    : `${method.eta_days} dias habiles`;

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
          {title}
        </p>
        <p className="text-[12px] text-muted-foreground">{subtitle}</p>
      </div>

      <div className="shrink-0 text-right">
        {isSelected && isLoadingEstimate && !isPickup && (
          <Loader2 size={14} className="animate-spin text-muted-foreground" />
        )}
        {isSelected && isPickup && (
          <p className="text-[15px] font-bold text-foreground">Pick up Cliente</p>
        )}
        {isSelected && !isPickup && !isLoadingEstimate && estimatePrice !== null && (
          <p className="text-[15px] font-bold text-foreground">
            ${formatRoundedArs(estimatePrice)}
          </p>
        )}
        {isSelected && !isPickup && !isLoadingEstimate && estimatePrice === null && (
          <p className="text-[12px] text-muted-foreground">-</p>
        )}
      </div>
    </label>
  );
}

export function StepCheckout({
  selectedQuote,
  orderId,
  sessionId,
  isEmpresa,
  isAccepting = false,
  cantidad = 1,
  thumbnailUrl = null,
  onBack,
}: StepCheckoutProps) {
  const [address, setAddress] = useState<AddressForm>(defaultAddress);
  const [provinces, setProvinces] = useState<AddressProvince[]>([]);
  const [localities, setLocalities] = useState<AddressLocality[]>([]);
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState("");
  const [estimatePrice, setEstimatePrice] = useState<number | null>(null);
  const [estimateEta, setEstimateEta] = useState<number | null>(null);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingLocalities, setLoadingLocalities] = useState(false);
  const [normalizingAddress, setNormalizingAddress] = useState(false);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [creatingCheckout, setCreatingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [addressValidation, setAddressValidation] = useState<AddressValidationState | null>(null);

  const estimateDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const skipNextCheckoutSaveRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (estimateDebounceRef.current) clearTimeout(estimateDebounceRef.current);
      if (localityDebounceRef.current) clearTimeout(localityDebounceRef.current);
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
      setSelectedMethodId(parsed.selectedMethodId ?? "retiro");
    } catch {
      setSelectedMethodId("retiro");
    }
  }, [sessionId, orderId]);

  useEffect(() => {
    if (!methods.some((method) => method.id === "retiro")) return;
    if (selectedMethodId) return;
    setSelectedMethodId("retiro");
  }, [methods, selectedMethodId]);

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

  useEffect(() => {
    const load = async () => {
      setLoadingProvinces(true);
      const provinceResult = await getAddressProvinces();
      if (isMountedRef.current) {
        if (!isApiError(provinceResult)) {
          setProvinces(provinceResult.items);
        }
        setLoadingProvinces(false);
      }

      setLoadingMethods(true);
      const result = await getShippingMethods();
      if (!isMountedRef.current) return;

      const nextMethods = isApiError(result) ? FALLBACK_METHODS : result.methods;
      setMethods(nextMethods);
      setLoadingMethods(false);
    };

    void load();
  }, []);

  useEffect(() => {
    if (!provinces.length) return;
    if (address.province_id) return;
    if (!address.province.trim()) return;

    const provinceMatch = provinces.find(
      (item) => item.name.toLowerCase() === address.province.trim().toLowerCase()
    );
    if (!provinceMatch) return;

    setAddress((current) => ({
      ...current,
      province: provinceMatch.name,
      province_id: provinceMatch.id,
    }));
  }, [address.province, address.province_id, provinces]);

  useEffect(() => {
    if (!address.province_id) {
      setLocalities([]);
      setLoadingLocalities(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      setLoadingLocalities(true);
      const result = await searchAddressLocalities({
        province_id: address.province_id,
        max: 5000,
      });
      if (!isMountedRef.current || cancelled) return;

      if (isApiError(result)) {
        setLocalities([]);
        setLoadingLocalities(false);
        return;
      }

      setLocalities(result.items);
      setLoadingLocalities(false);

      setAddress((current) => {
        if (current.locality_id) {
          const selected = result.items.find((item) => item.id === current.locality_id);
          if (selected) {
            return {
              ...current,
              city: selected.name,
            };
          }
        }

        if (current.city.trim()) {
          const match = result.items.find(
            (item) => item.name.toLowerCase() === current.city.trim().toLowerCase()
          );
          if (match) {
            return {
              ...current,
              city: match.name,
              locality_id: match.id,
            };
          }
        }

        return current;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [address.province_id]);

  const isRetiro = selectedMethodId === "retiro";

  useEffect(() => {
    if (!selectedMethodId || isRetiro) {
      setEstimatePrice(isRetiro ? 0 : null);
      setEstimateEta(null);
      return;
    }

    if (address.postal_code.length < 4) {
      setEstimatePrice(null);
      setEstimateEta(null);
      return;
    }

    if (estimateDebounceRef.current) clearTimeout(estimateDebounceRef.current);
    estimateDebounceRef.current = setTimeout(async () => {
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
  }, [address.postal_code, address.province, isRetiro, selectedMethodId]);

  const isFormValid = useMemo(() => {
    if (!selectedMethodId) return false;
    if (isRetiro) return true;

    return (
      address.street.trim().length > 0 &&
      address.number.trim().length > 0 &&
      address.city.trim().length > 0 &&
      address.postal_code.length >= 4 &&
      address.province.trim().length > 0 &&
      Boolean(addressValidation?.validated)
    );
  }, [address, addressValidation?.validated, isRetiro, selectedMethodId]);

  const setField =
    (field: keyof AddressForm) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.target.value;
      const nextValue =
        field === "postal_code"
          ? rawValue.toUpperCase().replace(/\s+/g, "")
          : rawValue;

      setAddress((current) => ({
        ...current,
        [field]: nextValue,
        ...(field === "city" ? { locality_id: "" } : {}),
      }));
      setAddressValidation(null);
      setCheckoutError(null);
    };

  const handleProvinceChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const province = provinces.find((item) => item.id === event.target.value);
    setAddress((current) => ({
      ...current,
      province: province?.name ?? "",
      province_id: province?.id ?? "",
      city: "",
      locality_id: "",
    }));
    setLocalities([]);
    setAddressValidation(null);
    setCheckoutError(null);
  };

  const handleLocalityChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const locality = localities.find((item) => item.id === event.target.value);
    setAddress((current) => ({
      ...current,
      city: locality?.name ?? "",
      locality_id: locality?.id ?? "",
    }));
    setAddressValidation(null);
    setCheckoutError(null);
  };

  const handleNormalizeAddress = async () => {
    if (normalizingAddress) return;
    if (!address.street.trim() || !address.number.trim() || !address.city.trim() || !address.postal_code.trim() || !address.province.trim()) {
      setCheckoutError("Completa calle, numero, localidad, provincia y codigo postal para validar la direccion.");
      return;
    };

    setNormalizingAddress(true);
    setCheckoutError(null);

    const result = await normalizeAddress({
      street: address.street,
      number: address.number,
      floor: address.floor || undefined,
      locality: address.city,
      locality_id: address.locality_id || undefined,
      province: address.province,
      province_id: address.province_id || undefined,
      postal_code: address.postal_code,
    });

    if (!isMountedRef.current) return;

    if (isApiError(result)) {
      setCheckoutError(result.error || "No pudimos validar la direccion.");
      setAddressValidation(null);
      setNormalizingAddress(false);
      return;
    }

    setAddress({
      street: result.normalized.street_name,
      number: result.normalized.street_number,
      floor: address.floor,
      city: result.normalized.locality_name,
      locality_id: result.normalized.locality_id,
      postal_code: result.normalized.postal_code,
      province: result.normalized.province_name,
      province_id: result.normalized.province_id,
    });
    setAddressValidation({
      validated: result.validated,
      normalized: result.normalized,
      validation: result.validation,
    });
    setCheckoutError(null);
    setLocalities((current) => {
      if (current.some((item) => item.id === result.normalized.locality_id)) {
        return current;
      }
      return result.normalized.locality_id
        ? [
            {
              id: result.normalized.locality_id,
              name: result.normalized.locality_name,
              municipality_id: "",
              municipality_name: result.normalized.municipality_name,
              department_id: "",
              department_name: result.normalized.department_name,
              province_id: result.normalized.province_id,
              province_name: result.normalized.province_name,
              display_name: result.normalized.full_address,
            },
            ...current,
          ]
        : current;
    });
    setNormalizingAddress(false);
  };

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethodId(methodId);
    setEstimatePrice(null);
    setEstimateEta(null);
    setCheckoutError(null);
  };

  const printPrice = Math.round(selectedQuote.price_ars);
  const shippingPrice = estimatePrice ?? 0;
  const total = printPrice + shippingPrice;
  const totalIsPartial = !isRetiro && estimatePrice === null && !!selectedMethodId;
  const selectedMethod = methods.find((method) => method.id === selectedMethodId);
  const selectedLocality = localities.find((item) => item.id === address.locality_id) ?? null;
  const deliveryDays = estimateEta ?? selectedMethod?.eta_days ?? selectedQuote.delivery_days;
  const quantityLabel = `${cantidad ?? 1} ${(cantidad ?? 1) === 1 ? "pieza" : "piezas"}`;
  const pickupReadyLabel = formatEstimatedDate(Math.max(1, selectedQuote.delivery_days || 0));
  const thumbnailSrc = thumbnailUrl
    ? thumbnailUrl.startsWith("data:")
      ? thumbnailUrl
      : `data:image/png;base64,${thumbnailUrl}`
    : null;

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
              locality_id: address.locality_id || undefined,
              province_id: address.province_id || undefined,
            },
      },
    });

    if (!isMountedRef.current) return;

    if (isApiError(result)) {
      setCheckoutError(result.error || "Error al iniciar el pago. Por favor intenta de nuevo.");
      setCreatingCheckout(false);
      return;
    }

    window.location.href = result.init_point;
  };

  if (isAccepting) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-[15px] font-medium text-foreground">Confirmando tu seleccion...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-[24px] font-semibold leading-tight text-foreground">
          {isEmpresa ? "Completar pedido" : "Datos de envio y pago"}
        </h3>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          {isEmpresa
            ? "Elegi como queres recibir tu pedido y confirma el pago."
            : "Elegi el metodo de envio, completa los datos y pasa al pago."}
        </p>
      </div>

      {thumbnailSrc && (
        <div className="mb-6 flex justify-center">
          <div className="w-full max-w-[288px] rounded-2xl border border-border bg-white p-4 shadow-sm">
            <TrimmedThumbnail
              src={thumbnailSrc}
              alt="Vista previa de la pieza"
              className="mx-auto block max-h-[220px] w-auto max-w-full object-contain"
            />
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_288px]">
        <div className="space-y-6">
          <div>
            <p className="mb-3 text-[14px] font-semibold text-foreground">Metodo de envio</p>

            {loadingMethods ? (
              <div className="flex items-center gap-2 py-4 text-muted-foreground">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-[14px]">Cargando metodos...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {methods.map((method) => (
                  <ShippingMethodCard
                    key={method.id}
                    method={method}
                    isSelected={selectedMethodId === method.id}
                    estimatePrice={selectedMethodId === method.id ? estimatePrice : null}
                    isLoadingEstimate={selectedMethodId === method.id && loadingEstimate}
                    pickupReadyLabel={pickupReadyLabel}
                    onSelect={() => handleMethodSelect(method.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {selectedMethodId && !isRetiro && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <MapPin size={15} className="text-primary" />
                <p className="text-[14px] font-semibold text-foreground">Direccion de entrega</p>
              </div>

              <div className="mb-4 rounded-xl border border-border bg-muted/35 px-4 py-3">
                <p className="text-[13px] font-medium text-foreground">
                  Para PAQ.AR necesitamos una direccion sin ambiguedades.
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                  Elegi la provincia, selecciona una localidad valida y luego confirma calle +
                  altura para dejar la direccion normalizada antes del pago.
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
                    Numero
                  </label>
                  <input
                    value={address.number}
                    onChange={setField("number")}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Nro. de puerta"
                    autoComplete="address-line2"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[14px] font-semibold text-foreground">
                    Piso / Depto <span className="font-normal text-muted-foreground">(opcional)</span>
                  </label>
                  <input
                    value={address.floor}
                    onChange={setField("floor")}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Ej: 3 B"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[14px] font-semibold text-foreground">
                    Provincia
                  </label>
                  <select
                    value={address.province_id}
                    onChange={handleProvinceChange}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    disabled={loadingProvinces}
                  >
                    <option value="">{loadingProvinces ? "Cargando provincias..." : "Selecciona una provincia"}</option>
                    {provinces.map((province) => (
                      <option key={province.id} value={province.id}>
                        {province.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-[14px] font-semibold text-foreground">
                    Localidad
                  </label>
                  <select
                    value={address.locality_id}
                    onChange={handleLocalityChange}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    disabled={!address.province_id || loadingLocalities}
                  >
                    <option value="">
                      {!address.province_id
                        ? "Primero selecciona una provincia"
                        : loadingLocalities
                          ? "Cargando localidades..."
                          : "Selecciona una localidad"}
                    </option>
                    {localities.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.display_name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {selectedLocality
                      ? selectedLocality.display_name
                      : "Mostramos solo localidades oficiales de la provincia elegida."}
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-[14px] font-semibold text-foreground">
                    Codigo Postal
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
                  <button
                    type="button"
                    onClick={handleNormalizeAddress}
                    disabled={normalizingAddress}
                    className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/[0.06] px-4 py-3 text-[14px] font-semibold text-primary transition-colors hover:bg-primary/[0.1] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {normalizingAddress ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Validando direccion...
                      </>
                    ) : (
                      <>
                        <Check size={15} />
                        Validar y normalizar direccion
                      </>
                    )}
                  </button>
                </div>

                {addressValidation && (
                  <div
                    className={`sm:col-span-2 rounded-xl border px-4 py-3 ${
                      addressValidation.validation.correo_status === "validated"
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-amber-200 bg-amber-50"
                    }`}
                  >
                    <p className="text-[13px] font-semibold text-foreground">
                      {addressValidation.validation.correo_status === "validated"
                        ? "Direccion validada"
                        : "Direccion estructurada"}
                    </p>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      {addressValidation.normalized.full_address}
                    </p>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      {addressValidation.validation.message}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {isRetiro && selectedMethodId && (
            <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background">
                  <Check size={18} className="text-emerald-500" />
                </div>
                <p className="pt-1 text-[14px] leading-relaxed text-muted-foreground">
                  Coordinamos el punto y horario de retiro con el proveedor. Te avisamos por
                  email cuando este listo.
                </p>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="rounded-2xl border border-border bg-muted/35 p-5">
            <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Resumen del pedido
            </p>

            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <span className="text-[14px] text-muted-foreground">Proveedor</span>
                <span className="max-w-[140px] text-right text-[14px] font-medium text-foreground">
                  {selectedQuote.provider_name}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="text-[14px] text-muted-foreground">
                  <p>Impresion 3D</p>
                  <p>{quantityLabel}</p>
                </div>
                <span className="text-[14px] font-semibold text-foreground">
                  ${formatRoundedArs(printPrice)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-[14px] text-muted-foreground">Envio</span>
                <span className="text-[14px] font-semibold text-foreground">
                  {loadingEstimate ? (
                    <Loader2 size={14} className="animate-spin text-muted-foreground" />
                  ) : isRetiro ? (
                    "Pick up Cliente"
                  ) : estimatePrice === null ? (
                    <span className="text-muted-foreground">-</span>
                  ) : (
                    `$${formatRoundedArs(estimatePrice)}`
                  )}
                </span>
              </div>

              <div className="border-t border-border pt-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[15px] font-semibold text-foreground">Total</span>
                  <span className="text-[22px] font-extrabold leading-tight text-foreground">
                    {totalIsPartial && (
                      <span className="mr-0.5 text-[16px] font-medium text-muted-foreground">
                        desde{" "}
                      </span>
                    )}
                    ${formatRoundedArs(total)}
                  </span>
                </div>
                {totalIsPartial && (
                  <p className="mt-1 text-right text-[11px] text-muted-foreground">
                    Completa el CP para calcular el envio exacto
                  </p>
                )}
              </div>

              <div className="space-y-1 border-t border-border pt-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[12px] text-muted-foreground">Entrega estimada</span>
                  <span className="text-[12px] font-medium text-foreground">
                    {isRetiro ? pickupReadyLabel : `${deliveryDays} dias habiles`}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[12px] text-muted-foreground">Referencia</span>
                  <span className="font-mono text-[12px] font-medium text-foreground">
                    {orderId}
                  </span>
                </div>
              </div>
            </div>

            {checkoutError && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-3">
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-destructive" />
                <p className="text-[13px] leading-snug text-destructive">{checkoutError}</p>
              </div>
            )}

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
              Seras redirigido a la plataforma segura de MercadoPago
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={onBack}
        disabled={creatingCheckout}
        className="mt-6 rounded-xl border border-border px-5 py-3 text-[14px] font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
      >
        Atras
      </button>
    </div>
  );
}
