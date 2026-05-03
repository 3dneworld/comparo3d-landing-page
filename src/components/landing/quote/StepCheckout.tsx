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
  getPostalLocalityCandidates,
  searchAddressLocalities,
  createCheckout,
  getShippingEstimate,
  getShippingMethods,
  validateCheckoutDiscountCode,
  isApiError,
  type AddressLocality,
  type AddressProvince,
  type NormalizeAddressResponse,
  type QuoteOption,
  type ShippingMethod,
  type ValidateDiscountCodeResponse,
} from "@/lib/api";
import { runNormalizeAddress } from "@/lib/normalizeAddressFlow";
import { toast } from "@/components/ui/sonner";
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

const formatIsoDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
};

const getPostalDigits = (value: string) => value.replace(/\D/g, "").slice(0, 4);

const buildPostalCode = (provinceCode: string, digits: string) =>
  provinceCode ? `${provinceCode}${digits}` : "";

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
  const [allLocalities, setAllLocalities] = useState<AddressLocality[]>([]);
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
  const [discountCode, setDiscountCode] = useState("");
  const [discountResult, setDiscountResult] = useState<ValidateDiscountCodeResponse | null>(null);
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutWarning, setCheckoutWarning] = useState<string | null>(null);
  const [addressValidation, setAddressValidation] = useState<AddressValidationState | null>(null);
  const [validationWarningAcknowledged, setValidationWarningAcknowledged] = useState(false);

  const estimateDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const skipNextCheckoutSaveRef = useRef(false);
  const selectedProvince = provinces.find((item) => item.id === address.province_id) ?? null;
  const postalPrefix = selectedProvince?.correo_code ?? "";
  const postalDigits = getPostalDigits(address.postal_code);

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
      setAllLocalities([]);
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
        setAllLocalities([]);
        setLocalities([]);
        setLoadingLocalities(false);
        return;
      }

      setAllLocalities(result.items);
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

        if (result.items.length === 1) {
          return {
            ...current,
            city: result.items[0].name,
            locality_id: result.items[0].id,
          };
        }

        return current;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [address.province_id]);

  useEffect(() => {
    if (!address.province_id) return;
    if (!allLocalities.length) {
      setLocalities([]);
      return;
    }

    if (postalDigits.length !== 4) {
      setLocalities(allLocalities);
      setAddress((current) => {
        if (!current.locality_id) return current;
        return allLocalities.some((item) => item.id === current.locality_id)
          ? current
          : { ...current, city: "", locality_id: "" };
      });
      return;
    }

    if (localityDebounceRef.current) clearTimeout(localityDebounceRef.current);
    localityDebounceRef.current = setTimeout(async () => {
      const result = await getPostalLocalityCandidates({
        province_id: address.province_id,
        postal_code: address.postal_code,
      });
      if (!isMountedRef.current) return;

      const nextLocalities =
        !isApiError(result) && result.items.length > 0 ? result.items : allLocalities;
      setLocalities(nextLocalities);
      setAddress((current) => {
        const selected = nextLocalities.find((item) => item.id === current.locality_id);
        if (selected) {
          return { ...current, city: selected.name };
        }
        if (nextLocalities.length === 1) {
          return {
            ...current,
            city: nextLocalities[0].name,
            locality_id: nextLocalities[0].id,
          };
        }
        return { ...current, city: "", locality_id: "" };
      });
    }, 250);
  }, [address.postal_code, address.province_id, allLocalities, postalDigits.length]);

  const isRetiro = selectedMethodId === "retiro";

  useEffect(() => {
    if (!selectedMethodId || isRetiro) {
      setEstimatePrice(isRetiro ? 0 : null);
      setEstimateEta(null);
      return;
    }

    if (postalDigits.length < 4) {
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
  }, [address.postal_code, address.province, isRetiro, postalDigits.length, selectedMethodId]);

  useEffect(() => {
    setDiscountResult(null);
  }, [selectedMethodId, estimatePrice, orderId]);

  const isFormValid = useMemo(() => {
    if (!selectedMethodId) return false;
    if (isRetiro) return true;

    return (
      address.street.trim().length > 0 &&
      address.number.trim().length > 0 &&
      address.city.trim().length > 0 &&
      postalDigits.length === 4 &&
      address.province.trim().length > 0
    );
  }, [address, isRetiro, postalDigits.length, selectedMethodId]);

  const setField =
    (field: keyof AddressForm) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.target.value;
      setAddress((current) => ({
        ...current,
        [field]: rawValue,
        ...(field === "city" ? { locality_id: "" } : {}),
      }));
      setAddressValidation(null);
      setValidationWarningAcknowledged(false);
      setCheckoutWarning(null);
      setCheckoutError(null);
    };

  const handlePostalDigitsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const digits = getPostalDigits(event.target.value);
    setAddress((current) => ({
      ...current,
      postal_code: buildPostalCode(postalPrefix, digits),
      city: digits.length === 4 ? current.city : "",
      locality_id: digits.length === 4 ? current.locality_id : "",
    }));
    setAddressValidation(null);
    setValidationWarningAcknowledged(false);
    setCheckoutWarning(null);
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
      postal_code: "",
    }));
    setAllLocalities([]);
    setLocalities([]);
    setAddressValidation(null);
    setValidationWarningAcknowledged(false);
    setCheckoutWarning(null);
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
    setValidationWarningAcknowledged(false);
    setCheckoutWarning(null);
    setCheckoutError(null);
  };

  const handleNormalizeAddress = async () => {
    if (normalizingAddress) return;
    if (!address.street.trim() || !address.number.trim() || !address.city.trim() || !address.postal_code.trim() || !address.province.trim()) {
      setCheckoutError("Completa calle, numero, localidad, provincia y codigo postal para validar la direccion.");
      return;
    }

    setNormalizingAddress(true);
    setCheckoutWarning(null);
    setCheckoutError(null);

    const outcome = await runNormalizeAddress({
      street: address.street,
      number: address.number,
      floor: address.floor,
      city: address.city,
      locality_id: address.locality_id,
      province: address.province,
      province_id: address.province_id,
      postal_code: address.postal_code,
    });

    if (!isMountedRef.current) return;

    if (!outcome.ok) {
      setCheckoutError(outcome.errorMessage);
      setAddressValidation(null);
      setValidationWarningAcknowledged(false);
      setNormalizingAddress(false);
      return;
    }

    const result = outcome.result;
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
    setValidationWarningAcknowledged(false);
    setCheckoutWarning(null);
    setCheckoutError(null);
    toast.success(
      result.validation.correo_status === "validated"
        ? "Dirección validada con Correo Argentino."
        : "Dirección estructurada con datos oficiales."
    );
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
    setValidationWarningAcknowledged(false);
    setCheckoutWarning(null);
    setCheckoutError(null);
  };

  const printPrice = Math.round(selectedQuote.price_ars);
  const shippingPrice = estimatePrice ?? 0;
  const discountAmount = Math.round(discountResult?.discount_amount ?? 0);
  const discountedPrintPrice = Math.round(discountResult?.discounted_print_amount ?? printPrice);
  const total = Math.round(discountResult?.customer_total ?? printPrice + shippingPrice);
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
  const addressValidationIsValidated =
    addressValidation?.validation.correo_status === "validated";
  const addressValidationTitle = addressValidationIsValidated
    ? "Dirección validada con Correo Argentino."
    : "Dirección estructurada con datos oficiales.";
  const addressValidationMessage = addressValidation
    ? [addressValidation.normalized.full_address, addressValidation.validation.message]
        .filter(Boolean)
        .join(" · ")
    : "";

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      setCheckoutError("Ingresa un código de descuento.");
      return;
    }

    setApplyingDiscount(true);
    setCheckoutError(null);
    setCheckoutWarning(null);

    const result = await validateCheckoutDiscountCode(sessionId, {
      order_id: orderId,
      code: discountCode.trim(),
      shipping: { price: shippingPrice },
    });

    setApplyingDiscount(false);

    if (isApiError(result)) {
      setDiscountResult(null);
      setCheckoutError(result.error || "No pudimos validar el código.");
      return;
    }

    setDiscountResult(result);
  };

  const handlePay = async () => {
    if (!isFormValid || creatingCheckout) return;

    setCreatingCheckout(true);
    setCheckoutWarning(null);
    setCheckoutError(null);

    const result = await createCheckout(sessionId, {
      order_id: orderId,
      discount: discountResult?.code ? { code: discountResult.code } : undefined,
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

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
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
            <div className="mt-auto">
              <div className="mb-3 flex items-center gap-2">
                <MapPin size={15} className="text-primary" />
                <p className="text-[14px] font-semibold text-foreground">Direccion de entrega</p>
              </div>

              <div className="mb-4 rounded-xl border border-border bg-muted/35 px-4 py-3">
                <p className="text-[13px] font-medium text-foreground">
                  Para PAQ.AR necesitamos una direccion sin ambiguedades.
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                  La provincia fija la letra del CPA. Luego completas los 4 digitos, elegis la
                  localidad sugerida y confirmas calle + altura antes del pago.
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
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
                    placeholder="Altura"
                    autoComplete="address-line2"
                  />
                </div>

                <div className="sm:col-span-2">
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

                <div>
                  <label className="mb-1.5 block text-[14px] font-semibold text-foreground">
                    Codigo Postal
                  </label>
                  <div className="flex overflow-hidden rounded-xl border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
                    <span className="flex min-w-[52px] items-center justify-center border-r border-input bg-muted px-3 text-[15px] font-semibold text-foreground">
                      {postalPrefix || "-"}
                    </span>
                    <input
                      value={postalDigits}
                      onChange={handlePostalDigitsChange}
                      inputMode="numeric"
                      maxLength={4}
                      disabled={!postalPrefix}
                      className="w-full bg-transparent px-4 py-3 text-[15px] text-foreground focus:outline-none disabled:cursor-not-allowed disabled:text-muted-foreground"
                      placeholder={postalPrefix ? "1043" : "Primero selecciona provincia"}
                      autoComplete="postal-code"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {postalPrefix
                      ? `La letra ${postalPrefix} queda fijada por la provincia elegida.`
                      : "Primero selecciona la provincia para fijar la letra oficial del CPA."}
                  </p>
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
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {selectedLocality
                      ? selectedLocality.display_name
                      : postalDigits.length === 4
                        ? "Filtramos las localidades compatibles con el CPA cuando Correo Argentino lo define."
                        : "Mostramos solo localidades oficiales de la provincia elegida."}
                  </p>
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
                    className={`sm:col-span-2 flex items-start gap-3 rounded-xl border px-4 py-3 ${
                      addressValidationIsValidated
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : "border-amber-200 bg-amber-50 text-amber-900"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        addressValidationIsValidated ? "bg-emerald-500" : "bg-amber-500"
                      } text-white`}
                      aria-hidden="true"
                    >
                      {addressValidationIsValidated ? <Check size={13} /> : <AlertCircle size={13} />}
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold">{addressValidationTitle}</p>
                      <p className="mt-1 text-[12px] leading-relaxed">
                        {addressValidationMessage}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {isRetiro && selectedMethodId && (
            <div className="mt-auto rounded-xl border border-border bg-muted/40 px-4 py-3">
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
          <div className="rounded-2xl border border-border bg-muted/35 p-5 lg:sticky lg:top-24">
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
                <div className="text-right">
                  {discountResult ? (
                    <>
                      <p className="text-[12px] text-muted-foreground line-through">
                        ${formatRoundedArs(printPrice)}
                      </p>
                      <p className="text-[14px] font-semibold text-foreground">
                        ${formatRoundedArs(discountedPrintPrice)}
                      </p>
                    </>
                  ) : (
                    <span className="text-[14px] font-semibold text-foreground">
                      ${formatRoundedArs(printPrice)}
                    </span>
                  )}
                </div>
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

              {discountResult && (
                <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-3">
                  <div>
                    <p className="text-[14px] font-semibold text-emerald-950">Descuento review</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-emerald-800">
                      Codigo aplicado: {discountResult.code}
                    </p>
                  </div>
                  <span className="text-[14px] font-semibold text-emerald-900">
                    -${formatRoundedArs(discountAmount)}
                  </span>
                </div>
              )}

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

            <div className="mt-5 rounded-2xl border border-border/80 bg-background/80 p-4">
              <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Codigo de descuento
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                Si dejaste una review, puedes aplicar tu beneficio del 5% sobre la impresion 3D.
              </p>

              <div className="mt-4 flex gap-2">
                <input
                  value={discountCode}
                  onChange={(event) => {
                    setDiscountCode(event.target.value.toUpperCase());
                    if (discountResult && event.target.value.toUpperCase() !== discountResult.code) {
                      setDiscountResult(null);
                    }
                  }}
                  className="min-w-0 flex-1 rounded-xl border border-input bg-background px-4 py-3 text-[14px] font-medium uppercase tracking-[0.08em] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Ej: REVIEW-5"
                  autoCapitalize="characters"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={handleApplyDiscount}
                  disabled={applyingDiscount || !discountCode.trim()}
                  className="inline-flex shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/[0.08] px-4 py-3 text-[14px] font-semibold text-primary transition-colors hover:bg-primary/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {applyingDiscount ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "Aplicar"
                  )}
                </button>
              </div>

              {discountResult ? (
                <p className="mt-3 text-[12px] leading-relaxed text-emerald-700">
                  Beneficio activo hasta el {formatIsoDate(discountResult.expires_at)}. Se usa una sola vez al completar el pago.
                </p>
              ) : (
                <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
                  El beneficio no impacta el envio y se valida antes de enviarte a MercadoPago.
                </p>
              )}
            </div>

            {checkoutError && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-3">
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-destructive" />
                <p className="text-[13px] leading-snug text-destructive">{checkoutError}</p>
              </div>
            )}

            {checkoutWarning && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-600" />
                <p className="text-[13px] leading-snug text-amber-800">{checkoutWarning}</p>
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
