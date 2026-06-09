import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import {
  Upload,
  User,
  FileText,
  CreditCard,
  CheckCircle2,
  RotateCcw,
  Files,
  ShieldCheck,
} from "lucide-react";
import { useAudience } from "@/contexts/AudienceContext";
import { trackEvent } from "@/lib/analytics";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import { StaggerChildren, StaggerItem } from "@/components/StaggerChildren";
import { useQuoteFlow } from "@/hooks/useQuoteFlow";
import { StepUpload } from "./quote/StepUpload";
import { StepUserData } from "./quote/StepUserData";
import { StepQuotes } from "./quote/StepQuotes";
import { StepCheckout } from "./quote/StepCheckout";
import { StepConfirmation } from "./quote/StepConfirmation";
import { QuoteOption, getThumbnail, isApiError } from "@/lib/api";

const STORAGE_KEY      = "comparo3d_quote";
const MP_BANNER_KEY    = "comparo3d_mp_banner";
const VALID_MATERIALS = new Set(["PLA", "ASESORAR", "ABS", "PETG", "Nylon", "TPU"]);
const FULL_THUMBNAIL_POLL_ATTEMPTS = 120;

interface QuoteData {
  nombre: string;
  email: string;
  telefono: string;
  ubicacion: string;
  material: string;
  cantidad: string;
  detalles: string;
  fileName: string;
  colorAcabado: string;
  infill: string;
  alturaCapa: string;
  observaciones: string;
  thumbnailUrl: string;
  thumbnailQuality: "preview" | "full" | "";
  step: number;
  sessionId: string;
  tempName: string;
  stlSha256: string;
  selectedQuote: QuoteOption | null;
  orderId: string;
  updatedAt: string;
}

const defaultData: QuoteData = {
  nombre: "", email: "", telefono: "", ubicacion: "",
  material: "PLA", cantidad: "1", detalles: "", fileName: "",
  colorAcabado: "", infill: "20%", alturaCapa: "0.2mm",
  observaciones: "", thumbnailUrl: "", thumbnailQuality: "", step: 1, sessionId: "", tempName: "",
  stlSha256: "", selectedQuote: null, orderId: "", updatedAt: "",
};

const stepLabels = [
  { icon: Upload, label: "Archivo 3D", short: "Archivo" },
  { icon: User, label: "Tus datos", short: "Datos" },
  { icon: FileText, label: "Cotizaciones", short: "Opciones" },
  { icon: CreditCard, label: "Envío y pago", short: "Pago" },
  { icon: CheckCircle2, label: "Confirmación", short: "Listo" },
];

function loadSaved(): QuoteData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<QuoteData>;
    const hasStaleUpload =
      Boolean(parsed.fileName || parsed.thumbnailUrl || parsed.stlSha256) &&
      (!parsed.sessionId || !parsed.tempName);
    if (hasStaleUpload) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    const normalizedMaterial =
      typeof parsed.material === "string" && VALID_MATERIALS.has(parsed.material)
        ? parsed.material
        : defaultData.material;
    const normalizedCantidad =
      typeof parsed.cantidad === "string" && parsed.cantidad.trim() !== ""
        ? parsed.cantidad
        : defaultData.cantidad;
    return {
      ...defaultData,
      ...parsed,
      material: normalizedMaterial,
      cantidad: normalizedCantidad,
      selectedQuote: parsed.selectedQuote ?? null,
      orderId: parsed.orderId ?? "",
    };
  } catch {
    return null;
  }
}

function saveData(data: QuoteData): void {
  try {
    const { thumbnailUrl: _thumbnailUrl, ...persistedData } = data;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...persistedData, updatedAt: new Date().toISOString() })
    );
  } catch (error) {
    console.warn("[QUOTE] No se pudo persistir la cotizacion local:", error);
  }
}

export interface CatalogInjection {
  /** Vacio si todavia no llego el response del backend. El paso 2 se renderiza igual con el thumbnail. */
  sessionId: string;
  tempName: string;
  stlSha256: string;
  thumbnailUrl: string;
  fileName: string;
  material: string;
  catalogTitle: string;
  slug: string;
  /** Color predeterminado sugerido para esta pieza (e.g. "amarillo", "gris"). */
  suggestedColor?: string;
  /** Altura de capa sugerida en milimetros sin sufijo (e.g. "0.15"). */
  suggestedLayerHeight?: string;
}

const QuoteSection = ({ catalogInjection }: { catalogInjection?: CatalogInjection | null }) => {
  const { audience } = useAudience();
  const isEmpresa = audience === "empresa";
  const sectionRef = useRef<HTMLElement | null>(null);
  const contentCardRef = useRef<HTMLDivElement | null>(null);
  const restoredScrollKeyRef = useRef<string>("");
  const previousStepRef = useRef<number>(1);

  const [data, setDataRaw] = useState<QuoteData>(() => loadSaved() ?? defaultData);
  const [hasSaved, setHasSaved] = useState(() => !!loadSaved());
  const [isCheckingSavedSession, setIsCheckingSavedSession] = useState(() => {
    const saved = loadSaved();
    return Boolean(saved?.step && saved.step > 1 && saved.sessionId);
  });
  /** Cotización elegida por el usuario (Paso 3 → 4), persistida para volver desde MercadoPago. */
  const [selectedQuote, setSelectedQuote] = useState<QuoteOption | null>(() => data.selectedQuote ?? null);
  /** Banner de retorno desde MercadoPago */
  const [mpBanner, setMpBanner] = useState<{ type: "success" | "failure" | "pending"; orderId: string } | null>(null);
  /** Banner cuando un deep link de cotizacion ya no esta disponible (LOST expiro) */
  const [lostUnavailable, setLostUnavailable] = useState(false);
  /** Lista de keys de campos del paso 2 que faltan (para marcar visualmente). */
  const [missingStep2Fields, setMissingStep2Fields] = useState<string[]>([]);

  // ── Deep link recovery: ?session=XXX desde mail follow-up ──
  // Si el cliente abre el link del mail desde otro browser (mobile/desktop
  // distinto) sin sessionStorage, llamamos /from-lost/<sid> al backend, que
  // lee el snapshot LOST y crea una cotizacion nueva con precios del momento.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionFromUrl = params.get("session");
    if (!sessionFromUrl) return;

    // Limpiar URL para no re-disparar en HMR / navegacion interna
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, "", cleanUrl);

    const saved = loadSaved();
    // Si ya tenemos la misma sesion guardada localmente, no necesitamos LOST recovery
    if (saved?.sessionId && saved.sessionId === sessionFromUrl) return;

    void (async () => {
      const { recoverQuoteFromLost } = await import("@/lib/api");
      const result = await recoverQuoteFromLost(sessionFromUrl);
      if (!result.success) {
        // 404 o error → mostrar mensaje exacto que pidio Chris (sin email contacto)
        setLostUnavailable(true);
        return;
      }
      // OK: restaurar state minimo y saltar directo al paso 3 (cotizaciones)
      const pf = result.client_data_prefill || {};
      setDataRaw((prev) => {
        const next = {
          ...prev,
          sessionId: sessionFromUrl,
          tempName: sessionFromUrl,
          step: 3,
          nombre: pf.client_name || prev.nombre,
          email: pf.client_email || prev.email,
          telefono: pf.client_phone || prev.telefono,
          ubicacion: pf.client_location || prev.ubicacion,
          material: pf.material || prev.material,
          cantidad: pf.cantidad || prev.cantidad,
          colorAcabado: pf.color_acabado || prev.colorAcabado,
          alturaCapa: pf.layer_height || prev.alturaCapa,
          infill: pf.infill || prev.infill,
        };
        saveData(next);
        return next;
      });
      setHasSaved(true);
      requestAnimationFrame(() => {
        document.getElementById("cotizar")?.scrollIntoView({ block: "start" });
      });
    })();
  }, []);

  // ── Detectar retorno desde MercadoPago (?payment=success|failure|pending&order_id=XXX) ──
  useEffect(() => {
    const params  = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const orderId = params.get("order_id");

    if (!payment || !orderId) return;
    if (payment !== "success" && payment !== "failure" && payment !== "pending") return;

    // Limpiar URL sin recargar
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, "", cleanUrl);

    const saved = loadSaved();
    const restoredQuote = saved?.selectedQuote ?? null;
    if (restoredQuote) setSelectedQuote(restoredQuote);

    setDataRaw((prev) => {
      const next = {
        ...prev,
        selectedQuote: prev.selectedQuote ?? restoredQuote,
        orderId,
        step: payment === "success" ? 5 : 4,
      };
      saveData(next);
      return next;
    });
    setHasSaved(true);
    requestAnimationFrame(() => {
      document.getElementById("cotizar")?.scrollIntoView({ block: "start" });
    });

    setMpBanner({ type: payment as "success" | "failure" | "pending", orderId });
  }, []);

  const setData = (updater: Partial<QuoteData> | ((prev: QuoteData) => QuoteData)) => {
    setDataRaw((prev) => {
      const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      saveData(next);
      return next;
    });
  };

  const updateField = (field: keyof QuoteData, value: string) => {
    setData({ [field]: value } as Partial<QuoteData>);
  };

  const canNavigateToStep = (step: number) => {
    if (step <= data.step) return true;
    if (step === 3) return data.step >= 3 && Boolean(data.sessionId);
    if (step === 4) return Boolean(data.orderId && (selectedQuote || data.selectedQuote));
    if (step === 5) return data.step >= 5 && Boolean(data.orderId);
    return false;
  };

  const goToStep = (step: number) => setData({ step });

  const navigateToStep = (step: number) => {
    if (!canNavigateToStep(step)) return;
    goToStep(step);
  };

  const resetQuote = () => {
    localStorage.removeItem(STORAGE_KEY);
    setDataRaw(defaultData);
    setSelectedQuote(null);
    setMpBanner(null);
    setHasSaved(false);
    setIsCheckingSavedSession(false);
  };

  const scrollToActiveStep = useCallback((behavior: ScrollBehavior = "smooth") => {
    const target = contentCardRef.current ?? sectionRef.current ?? document.getElementById("cotizar");
    target?.scrollIntoView?.({ behavior, block: "start" });
  }, []);

  // ── Ref para no iniciar el polling dos veces para la misma sesión ──
  const polledSessionRef = useRef<string>("");
  // ── Ref para no pedir el thumbnail dos veces para la misma sesión ──
  const thumbnailFetchedRef = useRef<string>("");
  // ── Ref para validar una sesión restaurada una sola vez contra el backend ──
  const restoredSessionCheckedRef = useRef<string>("");
  // ── Atribución de campaña: slug del item de catálogo de la sesión activa
  //    (para disparar trending_quote_viewed una sola vez al ver cotizaciones) ──
  const catalogSlugRef = useRef<string>("");
  const quoteViewedFiredRef = useRef<boolean>(false);

  // --- Callbacks para el hook ---
  const handleSessionIdReady = useCallback(
    (
      sessionId: string,
      tempName: string,
      stlSha256: string,
      thumbnailUrl: string | null,
      thumbnailQuality: "preview" | "full" | null
    ) => {
      setData({
        sessionId,
        tempName,
        stlSha256,
        thumbnailUrl: thumbnailUrl || "",
        thumbnailQuality: thumbnailQuality || "",
      });
    },
    []
  );

  const handleQuotesReady = useCallback((_quotes: QuoteOption[]) => {
    // quotes ya vienen del hook, no necesitamos guardarlas en data
    // GA4: atribución de campaña — el usuario que vino del carrusel vio cotizaciones
    if (catalogSlugRef.current && !quoteViewedFiredRef.current) {
      quoteViewedFiredRef.current = true;
      trackEvent("trending_quote_viewed", { slug: catalogSlugRef.current });
    }
  }, []);

  const flow = useQuoteFlow({
    sessionId: data.sessionId,
    tempName: data.tempName,
    onSessionIdReady: handleSessionIdReady,
    onQuotesReady: handleQuotesReady,
  });

  const removeUploadedStl = () => {
    flow.resetUploadState();
    thumbnailFetchedRef.current = "";
    restoredSessionCheckedRef.current = "";
    polledSessionRef.current = "";
    catalogSlugRef.current = "";
    setSelectedQuote(null);
    setData((prev) => ({
      ...prev,
      fileName: "",
      thumbnailUrl: "",
      thumbnailQuality: "",
      sessionId: "",
      tempName: "",
      stlSha256: "",
      selectedQuote: null,
      orderId: "",
      step: 1,
    }));
  };

  useEffect(() => {
    if (flow.orderId && flow.orderId !== data.orderId) {
      setData({ orderId: flow.orderId });
    }
  }, [flow.orderId, data.orderId]);

  useEffect(() => {
    const updates: Partial<QuoteData> = {};
    if (flow.material && flow.material !== data.material) {
      updates.material = flow.material;
    }
    if (flow.cantidad !== null && String(flow.cantidad) !== data.cantidad) {
      updates.cantidad = String(flow.cantidad);
    }
    if (Object.keys(updates).length > 0) {
      setData(updates);
    }
  }, [flow.material, flow.cantidad, data.material, data.cantidad]);

  // ── Validar sesión restaurada y recuperar thumbnail desde backend ──
  useEffect(() => {
    const isRestoredSession = hasSaved && data.step > 1 && !!data.sessionId;
    const conditions = {
      stepOk:          data.step >= 2,
      sessionOk:       !!data.sessionId,
      restoredOk:      !isRestoredSession || restoredSessionCheckedRef.current !== data.sessionId,
      refOk:           isRestoredSession || thumbnailFetchedRef.current !== data.sessionId,
      noFlowThumb:     !flow.thumbnailUrl,
      noDataThumb:     !data.thumbnailUrl,
      hasSaved,
      step:            data.step,
      sessionId:       data.sessionId,
      refCurrent:      thumbnailFetchedRef.current,
      flowThumbLen:    flow.thumbnailUrl?.length ?? 0,
      dataThumbLen:    data.thumbnailUrl?.length ?? 0,
    };
    if (
      conditions.stepOk &&
      conditions.sessionOk &&
      conditions.restoredOk &&
      conditions.refOk &&
      (isRestoredSession || (conditions.noFlowThumb && conditions.noDataThumb))
    ) {
      if (isRestoredSession) restoredSessionCheckedRef.current = data.sessionId;
      thumbnailFetchedRef.current = data.sessionId;
      getThumbnail(data.sessionId).then((result) => {
        if (!isApiError(result) && result.thumbnail_base64) {
          setData({ thumbnailUrl: result.thumbnail_base64, thumbnailQuality: result.thumbnail_quality || "full" });
          if (isRestoredSession) setIsCheckingSavedSession(false);
        } else {
          console.warn("[THUMB] Thumbnail no disponible en backend:", isApiError(result) ? (result as { error: string }).error : "sin thumbnail_base64");
          if (isApiError(result) && (result.needs_reupload || result.http_status === 404)) {
            localStorage.removeItem(STORAGE_KEY);
            restoredSessionCheckedRef.current = "";
            thumbnailFetchedRef.current = "";
            polledSessionRef.current = "";
            setHasSaved(false);
            setIsCheckingSavedSession(false);
            setDataRaw(defaultData);
            flow.setError("No pudimos recuperar el STL de la sesión guardada. Por favor subí el archivo nuevamente.");
          } else if (isRestoredSession) {
            setIsCheckingSavedSession(false);
          }
        }
      }).catch((err) => {
        console.error("[THUMB] Error inesperado en getThumbnail:", err);
        if (isRestoredSession) setIsCheckingSavedSession(false);
      });
    } else {
      if (!isRestoredSession) setIsCheckingSavedSession(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.step, data.sessionId, hasSaved]);

  useEffect(() => {
    if (data.step < 2 || !data.sessionId || data.thumbnailQuality !== "preview") return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;

    const pollFullThumbnail = async () => {
      attempts += 1;
      const result = await getThumbnail(data.sessionId);
      if (cancelled) return;

      if (!isApiError(result) && result.thumbnail_base64 && result.thumbnail_quality === "full") {
        setData({ thumbnailUrl: result.thumbnail_base64, thumbnailQuality: "full" });
        return;
      }

      if (attempts < FULL_THUMBNAIL_POLL_ATTEMPTS) {
        timer = setTimeout(pollFullThumbnail, 3000);
      }
    };

    timer = setTimeout(pollFullThumbnail, 1000);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.step, data.sessionId, data.thumbnailQuality]);

  // ── Auto-iniciar polling cuando se llega al step 3 (incluso restaurando desde localStorage) ──
  useEffect(() => {
    if (
      !isCheckingSavedSession &&
      data.step === 3 &&
      data.sessionId &&
      polledSessionRef.current !== data.sessionId
    ) {
      polledSessionRef.current = data.sessionId;
      flow.startPollingOptions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.step, data.sessionId, isCheckingSavedSession]);

  // ── Inyección desde catálogo ──────────────────────────────────────────────
  // Se dispara dos veces por click:
  //   1) Optimistic UI (sessionId === ""): pinta el paso 2 al toque con thumbnail full.
  //   2) Backend response llega: solo mergea sessionId/tempName/stlSha256 sin tocar thumbnail.
  const lastInjectedSlugRef = useRef<string>("");
  useEffect(() => {
    if (!catalogInjection) return;

    const isFirstInject = lastInjectedSlugRef.current !== catalogInjection.slug;
    const layerHeightDisplay = catalogInjection.suggestedLayerHeight
      ? `${catalogInjection.suggestedLayerHeight}mm`
      : "";
    // Color del backend viene lowercase ("amarillo"). El select del frontend usa
    // capitalize ("Amarillo"). Normalizamos al pre-cargar para que matchee la option.
    const normalizedColor = catalogInjection.suggestedColor
      ? catalogInjection.suggestedColor.charAt(0).toUpperCase() + catalogInjection.suggestedColor.slice(1).toLowerCase()
      : "";

    if (isFirstInject) {
      lastInjectedSlugRef.current = catalogInjection.slug;

      // Reset de sesión previa
      localStorage.removeItem(STORAGE_KEY);
      polledSessionRef.current = "";
      thumbnailFetchedRef.current = "";
      restoredSessionCheckedRef.current = "";

      // Atribución de campaña para esta nueva sesión de catálogo
      catalogSlugRef.current = catalogInjection.slug;
      quoteViewedFiredRef.current = false;

      // Inyectar datos del catálogo — con defaults sugeridos por pieza
      const next: QuoteData = {
        ...defaultData,
        sessionId:        catalogInjection.sessionId,
        tempName:         catalogInjection.tempName,
        stlSha256:        catalogInjection.stlSha256,
        thumbnailUrl:     catalogInjection.thumbnailUrl,
        thumbnailQuality: "full",
        fileName:         catalogInjection.fileName,
        material:         catalogInjection.material,
        colorAcabado:     normalizedColor,
        alturaCapa:       layerHeightDisplay || defaultData.alturaCapa,
        step: 2,
      };
      saveData(next);
      setDataRaw(next);
      setHasSaved(true);
      setIsCheckingSavedSession(false);
      setSelectedQuote(null);
      setMpBanner(null);
      return;
    }

    // Mismo slug: el backend response llego. Mergear sessionId/tempName/stlSha256 sin tocar thumbnail.
    if (catalogInjection.sessionId && !data.sessionId) {
      setData({
        sessionId: catalogInjection.sessionId,
        tempName:  catalogInjection.tempName,
        stlSha256: catalogInjection.stlSha256,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogInjection]);

  // --- Handlers de cada step ---
  const handleStep1Continue = async () => {
    if (!flow.stlFile && !data.fileName) {
      // Sin archivo, igual avanzan (modo sin STL no existe actualmente — dejar pasar)
      goToStep(2);
      return;
    }
    if (flow.stlFile) {
      const ok = await flow.handleUploadStl(flow.stlFile, data.sessionId || undefined);
      if (ok) {
        setData({ fileName: flow.stlFile.name });
        goToStep(2);
      }
    } else {
      goToStep(2);
    }
  };

  const handleStep1AutoUpload = async (file: File) => {
    const ok = await flow.handleUploadStl(file, data.sessionId || undefined);
    if (ok) {
      setData({ fileName: file.name });
      goToStep(2);
    }
  };

  const handleReplacementFileSelect = (file: File) => {
    flow.setStlFile(file);
    setData({ fileName: file.name });
    void handleStep1AutoUpload(file);
  };

  const handleStep2Continue = async () => {
    // Si veniamos del flujo catalogo y todavia no llego el sessionId real del backend,
    // esperamos brevemente (max ~3s). En la practica ya llego para cuando el cliente
    // termina de completar nombre/email/telefono.
    if (catalogInjection && !data.sessionId) {
      const waitStart = Date.now();
      while (!data.sessionId && Date.now() - waitStart < 3000) {
        await new Promise((r) => setTimeout(r, 100));
        if (data.sessionId) break;
      }
      // Releer del state actualizado tras la espera
      const latestSession = (loadSaved()?.sessionId) || data.sessionId;
      if (!latestSession) {
        flow.setError("Estamos preparando la pieza, esperá un instante y reintentá.");
        return;
      }
    }

    // Validar y armar lista de campos faltantes en orden de aparicion del form
    const missing: { key: string; label: string }[] = [];
    if (!data.nombre)   missing.push({ key: "nombre",   label: "Nombre" });
    if (!data.email)    missing.push({ key: "email",    label: "Email" });
    if (!data.telefono) missing.push({ key: "telefono", label: "Teléfono" });
    if (!data.cantidad) missing.push({ key: "cantidad", label: "Cantidad" });

    if (missing.length > 0) {
      // Enviar al StepUserData la lista de keys para marcar con border rojo + glow
      setMissingStep2Fields(missing.map((m) => m.key));
      // Mensaje especifico: "Falta cargar: Teléfono y Email" o "Falta cargar: Teléfono"
      const labels = missing.map((m) => m.label);
      let listText: string;
      if (labels.length === 1) {
        listText = labels[0];
      } else if (labels.length === 2) {
        listText = `${labels[0]} y ${labels[1]}`;
      } else {
        listText = `${labels.slice(0, -1).join(", ")} y ${labels[labels.length - 1]}`;
      }
      flow.setError(`Falta cargar: ${listText}.`);
      return;
    }
    // Si llega aca: limpiar marcas de error rojas
    setMissingStep2Fields([]);
    // El dropdown siempre debería tener valor; si una sesión vieja guardó material vacío,
    // forzamos PLA para mantener compatibilidad y evitar un falso error de validación.
    const normalizedMaterial = VALID_MATERIALS.has(data.material) ? data.material : "PLA";
    const materialParaBackend = normalizedMaterial === "ASESORAR" ? "PLA" : normalizedMaterial;

    const ok = await flow.handleInitDraft({
      client_name: data.nombre,
      client_email: data.email,
      client_phone: data.telefono,
      client_location: data.ubicacion,
      material: materialParaBackend,
      cantidad: data.cantidad,
      project_details: data.detalles,
      color_acabado: data.colorAcabado,
      observaciones: data.observaciones,
      infill: data.infill || "20%",
      layer_height: data.alturaCapa || "0.2mm",
      stl_sha256: data.stlSha256,
    });
    if (ok) {
      polledSessionRef.current = "";
      goToStep(3); // el useEffect de polling detecta step=3 y arranca automáticamente
    }
  };

  const handleSelectQuote = async (quoteOptionUid: string) => {
    // Guardar la cotización elegida ANTES de llamar al backend para tenerla disponible en Paso 4
    const chosen = flow.quotes.find((q) => q.quote_option_uid === quoteOptionUid) ?? null;
    if (!chosen) {
      flow.setError("No pudimos identificar la cotización elegida. Por favor intentá nuevamente.");
      return;
    }
    setSelectedQuote(chosen);
    setData({ selectedQuote: chosen });
    const accepted = await flow.handleAcceptQuote(quoteOptionUid);
    if (accepted) {
      setData((prev) => ({ ...prev, step: 4, selectedQuote: chosen }));
    }
  };

  useEffect(() => {
    if (isCheckingSavedSession) return;
    if (!hasSaved || data.step <= 1) return;
    // Si la URL pide explícitamente otra sección (#trending, #faq, etc.), no robarle el scroll.
    // El hash tiene prioridad sobre la restauración de sesión.
    if (typeof window !== "undefined" && window.location.hash && window.location.hash !== "#cotizar") {
      return;
    }

    const scrollKey = `${data.sessionId}:${data.step}`;
    if (restoredScrollKeyRef.current === scrollKey) return;
    restoredScrollKeyRef.current = scrollKey;

    const timer = window.setTimeout(() => {
      scrollToActiveStep("smooth");
    }, 120);

    return () => window.clearTimeout(timer);
  }, [data.sessionId, data.step, hasSaved, isCheckingSavedSession, scrollToActiveStep]);

  useEffect(() => {
    const previousStep = previousStepRef.current;
    previousStepRef.current = data.step;
    if (previousStep !== 2 || data.step !== 3) return;

    const firstTimer = window.setTimeout(() => {
      scrollToActiveStep("auto");
    }, 0);
    const secondTimer = window.setTimeout(() => {
      scrollToActiveStep("smooth");
    }, 90);

    return () => {
      window.clearTimeout(firstTimer);
      window.clearTimeout(secondTimer);
    };
  }, [data.step, scrollToActiveStep]);

  return (
    <section id="cotizar" ref={sectionRef} className="scroll-mt-24 bg-muted/50 py-16 md:scroll-mt-28 md:py-24">
      <div className="container max-w-4xl">

        {/* Header */}
        <AnimateOnScroll variant="fade-up">
          <div className="mb-8 text-center md:mb-10">
            <h2 className="text-[32px] font-bold leading-[1.08] text-foreground md:text-[42px]">
              {isEmpresa ? "Solicitá tu propuesta" : "Pedí tu cotización"}
            </h2>
            <p className="mx-auto mt-5 text-[16px] leading-[1.7] text-muted-foreground md:text-[18px]">
              {isEmpresa
                ? "Ordená el requerimiento, cargá el archivo y dejá listo el pedido para recibir una propuesta consolidada."
                : "Cargá tu STL, completá los datos y compará opciones reales sin perder tiempo buscando proveedor por proveedor."}
            </p>
          </div>
        </AnimateOnScroll>

        {/* Info cards */}
        <InfoCards isEmpresa={isEmpresa} />

        {/* Banner de retorno desde MercadoPago */}
        {mpBanner && (
          <div
            className={`mb-5 flex items-start justify-between gap-3 rounded-2xl border p-4 ${
              mpBanner.type === "success"
                ? "border-green-200 bg-green-50"
                : mpBanner.type === "pending"
                ? "border-yellow-200 bg-yellow-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl leading-none">
                {mpBanner.type === "success" ? "✅" : mpBanner.type === "pending" ? "⏳" : "⚠️"}
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {mpBanner.type === "success"
                    ? "¡Pago recibido! Tu pedido está confirmado."
                    : mpBanner.type === "pending"
                    ? "Pago pendiente — te avisamos cuando se acredite."
                    : "El pago no se procesó. Podés intentarlo de nuevo."}
                </p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  Ref: {mpBanner.orderId}
                </p>
              </div>
            </div>
            <button
              onClick={() => setMpBanner(null)}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        )}

        {/* Banner: deep link a cotizacion ya no disponible (LOST expiro) */}
        {lostUnavailable && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl leading-none">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Esta cotización ya no está disponible.
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Subí tu archivo de nuevo y te generamos una cotización actualizada con los precios del momento.
                </p>
              </div>
            </div>
            <button
              onClick={() => setLostUnavailable(false)}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        )}

        {/* Banner de sesión guardada */}
        {isCheckingSavedSession && (
          <div className="mb-5 rounded-2xl border border-primary/20 bg-primary/[0.05] p-4">
            <p className="text-sm font-medium text-foreground">Validando cotización guardada...</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Estamos comprobando que el STL todavía esté disponible para continuar.
            </p>
          </div>
        )}

        {hasSaved && !isCheckingSavedSession && data.step > 1 && (
          <div className="mb-8 rounded-2xl border border-primary/20 bg-primary/[0.05] p-4 md:mb-9">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Encontramos una cotización empezada
                </p>
                <p className="text-[11px] text-muted-foreground/70">Sesión {data.sessionId}</p>
              </div>
              <div className="flex gap-2">
              <button
                onClick={resetQuote}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted"
              >
                <RotateCcw size={12} /> Empezar de nuevo
              </button>
              </div>
            </div>
          </div>
        )}

        {catalogInjection && data.step === 2 && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-3">
              <span className="text-lg">📦</span>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Pieza del catálogo: {catalogInjection.catalogTitle}
                </p>
                <p className="text-[11px] text-muted-foreground/70">
                  STL pre-cargado — completá tus datos para ver cotizaciones
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step indicator */}
        <div className="mb-8 flex items-center md:mb-9">
          {stepLabels.map((s, i) => {
            const stepNum = i + 1;
            const isActive = data.step === stepNum;
            const isDone = data.step > stepNum;
            return (
              <Fragment key={s.label}>
                <button
                  type="button"
                  onClick={() => navigateToStep(stepNum)}
                  disabled={!canNavigateToStep(stepNum)}
                  aria-current={isActive ? "step" : undefined}
                  className="group flex shrink-0 flex-col items-center text-center outline-none disabled:cursor-not-allowed"
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-2 md:h-10 md:w-10 ${
                      isActive
                        ? "bg-gradient-primary text-primary-foreground shadow-cta"
                        : isDone
                        ? "bg-primary text-primary-foreground"
                        : canNavigateToStep(stepNum)
                        ? "bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        : "bg-secondary text-muted-foreground/45"
                    }`}
                  >
                    <s.icon size={15} className="md:h-[17px] md:w-[17px]" />
                  </span>
                  <span
                    className={`mt-2 whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.08em] transition-colors md:text-[11px] ${
                      isActive
                        ? "text-primary"
                        : canNavigateToStep(stepNum)
                        ? "text-muted-foreground group-hover:text-primary"
                        : "text-muted-foreground/45"
                    }`}
                  >
                    <span className="hidden sm:inline">{s.label}</span>
                    <span className="sm:hidden">{s.short}</span>
                  </span>
                </button>
                {i < stepLabels.length - 1 && (
                  <div className={`mx-1 h-[2px] flex-1 self-start mt-4 md:mt-5 ${isDone ? "bg-primary" : "bg-border"}`} />
                )}
              </Fragment>
            );
          })}
        </div>

        {/* Step content */}
        <div ref={contentCardRef} className="rounded-2xl border border-border bg-card p-5 shadow-card md:p-6">
          {isCheckingSavedSession ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-[15px] font-medium text-foreground">Validando sesión guardada...</p>
              <p className="max-w-md text-[13px] leading-relaxed text-muted-foreground">
                Si el STL ya no está disponible en el backend, te vamos a pedir que lo subas nuevamente.
              </p>
            </div>
          ) : data.step === 1 && (
            <StepUpload
              fileName={data.fileName}
              isLoading={flow.isLoading}
              progressMessage={flow.progressMessage}
              error={flow.error}
              onFileSelect={(file) => {
                flow.setStlFile(file);
                updateField("fileName", file.name);
              }}
              onAutoUpload={handleStep1AutoUpload}
              onRemoveFile={removeUploadedStl}
            />
          )}

          {!isCheckingSavedSession && data.step === 2 && (
            <StepUserData
              data={{
                nombre: data.nombre, email: data.email, telefono: data.telefono,
                ubicacion: data.ubicacion, material: data.material, cantidad: data.cantidad,
                detalles: data.detalles, colorAcabado: data.colorAcabado,
                infill: data.infill, alturaCapa: data.alturaCapa,
                observaciones: data.observaciones,
              }}
              fileName={data.fileName}
              thumbnailUrl={data.thumbnailUrl || flow.thumbnailUrl || null}
              isEmpresa={isEmpresa}
              isLoading={flow.isLoading}
              progressMessage={flow.progressMessage}
              error={flow.error}
              missingFields={missingStep2Fields}
              suggestedLayerHeight={catalogInjection?.suggestedLayerHeight ?? null}
              onChange={(field, value) => {
                updateField(field, value);
                // Limpiar marca de error de ese campo cuando empieza a tipear
                if (missingStep2Fields.includes(field)) {
                  setMissingStep2Fields((prev) => prev.filter((f) => f !== field));
                }
              }}
              onRemoveFile={removeUploadedStl}
              onReplacementFileSelect={handleReplacementFileSelect}
              onBack={() => goToStep(1)}
              onContinue={handleStep2Continue}
            />
          )}

          {!isCheckingSavedSession && data.step === 3 && (
            <StepQuotes
              isEmpresa={isEmpresa}
              isProcessing={flow.isProcessing}
              progressMessage={flow.progressMessage}
              progressPct={flow.progressPct}
              progressStep={flow.progressStep}
              progressStartedAt={flow.progressStartedAt}
              error={flow.error}
              quotes={flow.quotes}
              sessionId={data.sessionId}
              thumbnailUrl={data.thumbnailUrl || flow.thumbnailUrl || null}
              material={flow.material || data.material || null}
              selectedColor={data.colorAcabado || null}
              cantidad={flow.cantidad ?? (data.cantidad ? Number(data.cantidad) : null)}
              stlDimensions={flow.stlDimensions}
              onSelectQuote={handleSelectQuote}
              onUpdateQuantity={async (newQty) => {
                const ok = await flow.handleUpdateQuantity(newQty);
                if (ok) {
                  setSelectedQuote(null);
                  setData({ cantidad: String(newQty), selectedQuote: null, orderId: "" });
                }
              }}
              onRetry={() => {
                flow.clearError();
                polledSessionRef.current = ""; // permite reiniciar el polling
                // RETRY REAL: llama /retry-slicing en backend (resetea
                // slicing_status y relanza BG thread). Antes solo reiniciaba
                // polling -> mismo error en <1s.
                void flow.handleRetrySlicing();
              }}
              onBack={() => {
                flow.clearError();
                goToStep(2);
              }}
            />
          )}

          {!isCheckingSavedSession && data.step === 4 && (
            <StepCheckout
              selectedQuote={
                selectedQuote ?? data.selectedQuote ?? {
                  quote_option_uid: "",
                  provider_id: 0,
                  provider_name: "—",
                  provider_score: 0,
                  provider_tier: "",
                  provider_location: "",
                  logo_url: "",
                  is_certified: false,
                  provider_lat: null,
                  provider_lng: null,
                  price_ars: 0,
                  delivery_days: 0,
                  trust_metrics: { score: 0, reviews_count: 0, on_time_pct: 0 },
                }
              }
              orderId={flow.orderId || data.orderId || ""}
              sessionId={data.sessionId}
              isEmpresa={isEmpresa}
              isAccepting={flow.isLoading}
              cantidad={flow.cantidad ?? (data.cantidad ? Number(data.cantidad) : 1)}
              thumbnailUrl={data.thumbnailUrl || flow.thumbnailUrl || null}
              onBack={() => {
                flow.clearError();
                goToStep(3);
              }}
            />
          )}

          {!isCheckingSavedSession && data.step === 5 && (
            <StepConfirmation
              isEmpresa={isEmpresa}
              sessionId={data.sessionId}
              orderId={flow.orderId || data.orderId}
              isLoading={flow.isLoading}
              progressMessage={flow.progressMessage}
              onReset={resetQuote}
            />
          )}
        </div>

      </div>
    </section>
  );
};

type InfoCard = {
  key: string;
  icon: typeof Files;
  label: string;
  title: string;
  body: string;
  highlight?: boolean;
};

function InfoCards({ isEmpresa }: { isEmpresa: boolean }) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const cards: InfoCard[] = [
    {
      key: "archivo",
      icon: Files,
      label: "Archivo",
      title: "1 archivo por cotización",
      body: "Varias copias de la misma pieza, sí. Piezas distintas, por separado.",
    },
    {
      key: "formato",
      icon: Upload,
      label: "Formato",
      title: "STL",
      body: "La experiencia actual está pensada para STL y cotización automática.",
      highlight: true,
    },
    {
      key: "respuesta",
      icon: ShieldCheck,
      label: "Respuesta",
      title: isEmpresa ? "Propuesta en hasta 72 hs hábiles" : "Cotizaciones en minutos",
      body: isEmpresa
        ? "Coordinamos proveedores verificados y consolidamos la propuesta."
        : "Comparás opciones reales sin salir a buscar talleres por tu cuenta.",
    },
  ];

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;
    const handler = () => {
      const width = node.clientWidth;
      if (width <= 0) return;
      const idx = Math.round(node.scrollLeft / width);
      setActiveIndex(Math.max(0, Math.min(cards.length - 1, idx)));
    };
    node.addEventListener("scroll", handler, { passive: true });
    return () => node.removeEventListener("scroll", handler);
  }, [cards.length]);

  const scrollTo = (idx: number) => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollTo({ left: idx * node.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="mb-6 md:mb-8">
      <div className="relative md:hidden">
        <div
          ref={scrollerRef}
          className="scrollbar-hide -mx-4 flex snap-x snap-mandatory overflow-x-auto pb-2"
          aria-label="Información del flujo de cotización"
        >
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.key}
                className="w-full shrink-0 snap-center px-4"
              >
                <div
                  className={`h-full rounded-2xl border bg-card px-4 py-3 text-left ${
                    card.highlight ? "border-primary/15" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-2 text-primary">
                    <Icon size={16} />
                    <span className="text-[12px] font-semibold uppercase tracking-[0.12em]">
                      {card.label}
                    </span>
                  </div>
                  <p className="mt-2 text-[14px] font-medium leading-snug text-foreground">
                    {card.title}
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                    {card.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-center gap-2" role="tablist" aria-label="Paginación de información">
          {cards.map((card, idx) => (
            <button
              key={card.key}
              type="button"
              role="tab"
              aria-selected={idx === activeIndex}
              aria-label={`Ir a ${card.label}`}
              onClick={() => scrollTo(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === activeIndex
                  ? "w-6 bg-primary"
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
      </div>

      <StaggerChildren className="hidden md:grid md:grid-cols-3 md:gap-3" staggerDelay={0.1}>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <StaggerItem key={card.key}>
              <div
                className={`h-full rounded-2xl border bg-card px-4 py-3 text-left ${
                  card.highlight ? "border-primary/15" : "border-border"
                }`}
              >
                <div className="flex items-center gap-2 text-primary">
                  <Icon size={16} />
                  <span className="text-[12px] font-semibold uppercase tracking-[0.12em]">
                    {card.label}
                  </span>
                </div>
                <p className="mt-2 text-[14px] font-medium leading-snug text-foreground">
                  {card.title}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                  {card.body}
                </p>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerChildren>
    </div>
  );
}

export default QuoteSection;
