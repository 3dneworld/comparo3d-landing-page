import { useCallback, useEffect, useRef, useState } from "react";
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
  thumbnailUrl: string;  // ← persiste el thumbnail en localStorage para restaurar sesión
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
  observaciones: "", thumbnailUrl: "", step: 1, sessionId: "", tempName: "",
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
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...data, updatedAt: new Date().toISOString() })
  );
}

const QuoteSection = () => {
  const { audience } = useAudience();
  const isEmpresa = audience === "empresa";
  const sectionRef = useRef<HTMLElement | null>(null);
  const contentCardRef = useRef<HTMLDivElement | null>(null);
  const restoredScrollKeyRef = useRef<string>("");

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const goToStep = (step: number) => setData({ step });

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
    target?.scrollIntoView({ behavior, block: "start" });
  }, []);

  // ── Ref para no iniciar el polling dos veces para la misma sesión ──
  const polledSessionRef = useRef<string>("");
  // ── Ref para no pedir el thumbnail dos veces para la misma sesión ──
  const thumbnailFetchedRef = useRef<string>("");
  // ── Ref para validar una sesión restaurada una sola vez contra el backend ──
  const restoredSessionCheckedRef = useRef<string>("");

  // --- Callbacks para el hook ---
  const handleSessionIdReady = useCallback(
    (sessionId: string, tempName: string, stlSha256: string, thumbnailUrl: string | null) => {
      setData({ sessionId, tempName, stlSha256, thumbnailUrl: thumbnailUrl || "" });
    },
    []
  );

  const handleQuotesReady = useCallback((_quotes: QuoteOption[]) => {
    // quotes ya vienen del hook, no necesitamos guardarlas en data
  }, []);

  const flow = useQuoteFlow({
    sessionId: data.sessionId,
    tempName: data.tempName,
    onSessionIdReady: handleSessionIdReady,
    onQuotesReady: handleQuotesReady,
  });

  useEffect(() => {
    if (flow.orderId && flow.orderId !== data.orderId) {
      setData({ orderId: flow.orderId });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    console.log("[THUMB] useEffect thumbnail fired —", conditions);

    if (
      conditions.stepOk &&
      conditions.sessionOk &&
      conditions.restoredOk &&
      conditions.refOk &&
      (isRestoredSession || (conditions.noFlowThumb && conditions.noDataThumb))
    ) {
      if (isRestoredSession) restoredSessionCheckedRef.current = data.sessionId;
      thumbnailFetchedRef.current = data.sessionId;
      console.log("[THUMB] Validando/fetch thumbnail del backend para session:", data.sessionId);
      getThumbnail(data.sessionId).then((result) => {
        if (!isApiError(result) && result.thumbnail_base64) {
          console.log("[THUMB] Thumbnail recibido del backend — source:", result.source, "len:", result.thumbnail_base64.length);
          setData({ thumbnailUrl: result.thumbnail_base64 });
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
      console.log("[THUMB] Sin fetch — condición no cumplida (ver arriba)");
      if (!isRestoredSession) setIsCheckingSavedSession(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.step, data.sessionId, hasSaved]);

  // ── Auto-iniciar polling cuando se llega al step 3 (incluso restaurando desde localStorage) ──
  useEffect(() => {
    console.log("[POLL] useEffect polling fired —", {
      step: data.step,
      sessionId: data.sessionId,
      refCurrent: polledSessionRef.current,
      willPoll: !isCheckingSavedSession && data.step === 3 && !!data.sessionId && polledSessionRef.current !== data.sessionId,
    });
    if (
      !isCheckingSavedSession &&
      data.step === 3 &&
      data.sessionId &&
      polledSessionRef.current !== data.sessionId
    ) {
      polledSessionRef.current = data.sessionId;
      console.log("[POLL] Arrancando polling para session:", data.sessionId);
      flow.startPollingOptions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.step, data.sessionId, isCheckingSavedSession]);

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

  const handleStep2Continue = async () => {
    if (!data.nombre || !data.email || !data.cantidad) {
      flow.setError(
        "Completá los campos obligatorios (nombre, email y cantidad) para continuar."
      );
      return;
    }
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
    const orderId = await flow.handleAcceptQuote(quoteOptionUid);
    if (orderId) {
      setData((prev) => ({ ...prev, step: 4, selectedQuote: chosen, orderId }));
    }
  };

  useEffect(() => {
    if (isCheckingSavedSession) return;
    if (!hasSaved || data.step <= 1) return;

    const scrollKey = `${data.sessionId}:${data.step}`;
    if (restoredScrollKeyRef.current === scrollKey) return;
    restoredScrollKeyRef.current = scrollKey;

    const timer = window.setTimeout(() => {
      scrollToActiveStep("smooth");
    }, 120);

    return () => window.clearTimeout(timer);
  }, [data.sessionId, data.step, hasSaved, isCheckingSavedSession, scrollToActiveStep]);

  return (
    <section id="cotizar" ref={sectionRef} className="bg-muted/50 py-16 md:py-24">
      <div className="container max-w-4xl">

        {/* Header */}
        <AnimateOnScroll variant="fade-up">
          <div className="mx-auto mb-8 max-w-3xl text-center md:mb-10">
            <h2 className="text-[32px] font-bold leading-[1.08] text-foreground md:text-[42px]">
              {isEmpresa ? "Solicitá tu propuesta" : "Pedí tu cotización"}
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-[16px] leading-[1.7] text-muted-foreground md:text-[18px]">
              {isEmpresa
                ? "Ordená el requerimiento, cargá el archivo y dejá listo el pedido para recibir una propuesta consolidada."
                : "Cargá tu STL, completá los datos y compará opciones reales sin perder tiempo buscando proveedor por proveedor."}
            </p>
          </div>
        </AnimateOnScroll>

        {/* Info cards */}
        <StaggerChildren staggerDelay={0.1} className="mx-auto mb-7 grid max-w-3xl grid-cols-1 gap-3 md:mb-8 md:grid-cols-3">
          <StaggerItem>
            <div className="rounded-2xl border border-border bg-card px-4 py-3 text-left">
              <div className="flex items-center gap-2 text-primary">
                <Files size={16} />
                <span className="text-[12px] font-semibold uppercase tracking-[0.12em]">Archivo</span>
              </div>
              <p className="mt-2 text-[14px] font-medium leading-snug text-foreground">
                1 archivo por cotización
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                Varias copias de la misma pieza, sí. Piezas distintas, por separado.
              </p>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="rounded-2xl border border-primary/15 px-4 py-3 text-left bg-card">
              <div className="flex items-center gap-2 text-primary">
                <Upload size={16} />
                <span className="text-[12px] font-semibold uppercase tracking-[0.12em]">Formato</span>
              </div>
              <p className="mt-2 text-[14px] font-medium leading-snug text-foreground">
                STL
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                La experiencia actual está pensada para STL y cotización automática.
              </p>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="rounded-2xl border border-border bg-card px-4 py-3 text-left">
              <div className="flex items-center gap-2 text-primary">
                <ShieldCheck size={16} />
                <span className="text-[12px] font-semibold uppercase tracking-[0.12em]">Respuesta</span>
              </div>
              <p className="mt-2 text-[14px] font-medium leading-snug text-foreground">
                {isEmpresa ? "Propuesta en hasta 72 hs hábiles" : "Cotizaciones en minutos"}
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                {isEmpresa
                  ? "Coordinamos proveedores verificados y consolidamos la propuesta."
                  : "Comparás opciones reales sin salir a buscar talleres por tu cuenta."}
              </p>
            </div>
          </StaggerItem>
        </StaggerChildren>

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
          <div className="mb-5 rounded-2xl border border-primary/20 bg-primary/[0.05] p-4">
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
              <button
                onClick={() => goToStep(data.step)}
                className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
              >
                Continuar
              </button>
              </div>
            </div>
          </div>
        )}

        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-between gap-1 overflow-x-auto md:mb-9 md:gap-2">
          {stepLabels.map((s, i) => {
            const stepNum = i + 1;
            const isActive = data.step === stepNum;
            const isDone = data.step > stepNum;
            return (
              <div key={s.label} className="flex flex-1 items-center">
                <div className="flex flex-1 flex-col items-center">
                  <div
                    className={`flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-gradient-primary text-primary-foreground shadow-cta"
                        : isDone
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    <s.icon size={15} className="md:h-[17px] md:w-[17px]" />
                  </div>
                  <span
                    className={`mt-2 whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.08em] ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <span className="hidden sm:inline">{s.label}</span>
                    <span className="sm:hidden">{s.short}</span>
                  </span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div className={`mx-1 h-[2px] flex-1 ${isDone ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
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
              thumbnailUrl={flow.thumbnailUrl || data.thumbnailUrl || null}
              isEmpresa={isEmpresa}
              isLoading={flow.isLoading}
              progressMessage={flow.progressMessage}
              error={flow.error}
              onChange={updateField}
              onBack={() => goToStep(1)}
              onContinue={handleStep2Continue}
            />
          )}

          {!isCheckingSavedSession && data.step === 3 && (
            <StepQuotes
              isEmpresa={isEmpresa}
              isProcessing={flow.isProcessing}
              progressMessage={flow.progressMessage}
              error={flow.error}
              quotes={flow.quotes}
              sessionId={data.sessionId}
              thumbnailUrl={flow.thumbnailUrl || data.thumbnailUrl || null}
              material={flow.material || data.material || null}
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
                flow.startPollingOptions();
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
              thumbnailUrl={flow.thumbnailUrl || data.thumbnailUrl || null}
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

export default QuoteSection;
