import { useCallback, useEffect, useState } from "react";
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
import { useQuoteFlow } from "@/hooks/useQuoteFlow";
import { StepUpload } from "./quote/StepUpload";
import { StepUserData } from "./quote/StepUserData";
import { StepQuotes } from "./quote/StepQuotes";
import { StepCheckout } from "./quote/StepCheckout";
import { StepConfirmation } from "./quote/StepConfirmation";
import { QuoteOption } from "@/lib/api";

const STORAGE_KEY      = "comparo3d_quote";
const MP_BANNER_KEY    = "comparo3d_mp_banner";

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
  usoPieza: string;
  tolerancia: string;
  observaciones: string;
  step: number;
  sessionId: string;
  tempName: string;
  stlSha256: string;
  updatedAt: string;
}

const defaultData: QuoteData = {
  nombre: "", email: "", telefono: "", ubicacion: "",
  material: "PLA", cantidad: "1", detalles: "", fileName: "",
  colorAcabado: "", infill: "20%", alturaCapa: "0.2mm",
  usoPieza: "", tolerancia: "",
  observaciones: "", step: 1, sessionId: "", tempName: "",
  stlSha256: "", updatedAt: "",
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
    return JSON.parse(raw) as QuoteData;
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

  const [data, setDataRaw] = useState<QuoteData>(() => loadSaved() ?? defaultData);
  const [hasSaved, setHasSaved] = useState(() => !!loadSaved());
  /** Cotización elegida por el usuario (Paso 3 → 4). No se persiste en localStorage. */
  const [selectedQuote, setSelectedQuote] = useState<QuoteOption | null>(null);
  /** Banner de retorno desde MercadoPago */
  const [mpBanner, setMpBanner] = useState<{ type: "success" | "failure" | "pending"; orderId: string } | null>(null);

  // ── Detectar retorno desde MercadoPago (?payment=success|failure|pending&order_id=XXX) ──
  useEffect(() => {
    const params  = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const orderId = params.get("order_id");

    if (!payment || !orderId) return;

    // Limpiar URL sin recargar
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, "", cleanUrl);

    if (payment === "success") {
      // Ir directo a confirmación con el order_id recuperado
      setDataRaw((prev) => {
        const next = { ...prev, step: 5 };
        saveData(next);
        return next;
      });
      // Inyectar orderId en el flow hook si es posible (via estado local)
      setMpBanner({ type: "success", orderId });
    } else if (payment === "failure" || payment === "pending") {
      setMpBanner({ type: payment as "failure" | "pending", orderId });
    }
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
    setHasSaved(false);
  };

  // --- Callbacks para el hook ---
  const handleSessionIdReady = useCallback(
    (sessionId: string, tempName: string, stlSha256: string) => {
      setData({ sessionId, tempName, stlSha256 });
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

  const handleStep2Continue = async () => {
    if (!data.nombre || !data.email || !data.material || !data.cantidad) {
      return;
    }
    // "ASESORAR" → "PLA" para el backend (el usuario elige "No estoy seguro")
    const materialParaBackend = data.material === "ASESORAR" ? "PLA" : data.material;

    const ok = await flow.handleInitDraft({
      client_name: data.nombre,
      client_email: data.email,
      client_phone: data.telefono,
      client_location: data.ubicacion,
      material: materialParaBackend,
      cantidad: data.cantidad,
      project_details: data.detalles,
      color_acabado: data.colorAcabado,
      uso_pieza: data.usoPieza,
      tolerancia: data.tolerancia,
      observaciones: data.observaciones,
      infill: data.infill || "20%",
      layer_height: data.alturaCapa || "0.2mm",
      stl_sha256: data.stlSha256,
    });
    if (ok) {
      goToStep(3);
      flow.startPollingOptions();
    }
  };

  const handleSelectQuote = async (quoteOptionUid: string) => {
    // Guardar la cotización elegida ANTES de llamar al backend para tenerla disponible en Paso 4
    const chosen = flow.quotes.find((q) => q.quote_option_uid === quoteOptionUid) ?? null;
    setSelectedQuote(chosen);
    const ok = await flow.handleAcceptQuote(quoteOptionUid);
    if (ok) goToStep(4);
  };

  return (
    <section id="cotizar" className="bg-muted/50 py-14 md:py-18">
      <div className="container max-w-4xl">

        {/* Header */}
        <div className="mx-auto mb-8 max-w-3xl text-center md:mb-10">
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-primary md:text-[13px]">
            {isEmpresa ? "INICIÁ TU REQUERIMIENTO" : "EMPEZÁ AHORA"}
          </p>
          <h2 className="text-[32px] font-bold leading-[1.08] text-foreground md:text-[42px]">
            {isEmpresa ? "Solicitá tu propuesta" : "Pedí tu cotización"}
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-[16px] leading-[1.7] text-muted-foreground md:text-[18px]">
            {isEmpresa
              ? "Ordená el requerimiento, cargá el archivo y dejá listo el pedido para recibir una propuesta consolidada."
              : "Cargá tu STL, completá los datos y compará opciones reales sin perder tiempo buscando proveedor por proveedor."}
          </p>
        </div>

        {/* Info cards */}
        <div className="mx-auto mb-7 grid max-w-3xl grid-cols-1 gap-3 md:mb-8 md:grid-cols-3">
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

          <div className="rounded-2xl border border-primary/15 px-4 py-3 text-left bg-card">
            <div className="flex items-center gap-2 text-primary">
              <Upload size={16} />
              <span className="text-[12px] font-semibold uppercase tracking-[0.12em]">Formato</span>
            </div>
            <p className="mt-2 text-[14px] font-medium leading-snug text-foreground">
              Hoy aceptamos solo STL
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              La experiencia actual está pensada para STL y cotización automática.
            </p>
          </div>

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
        </div>

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
        {hasSaved && data.step > 1 && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/[0.05] p-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                Encontramos una cotización empezada
              </p>
              <p className="text-xs text-muted-foreground">Sesión {data.sessionId}</p>
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
        )}

        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-between gap-2 md:mb-9">
          {stepLabels.map((s, i) => {
            const stepNum = i + 1;
            const isActive = data.step === stepNum;
            const isDone = data.step > stepNum;
            return (
              <div key={s.label} className="flex flex-1 items-center">
                <div className="flex flex-1 flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-gradient-primary text-primary-foreground shadow-cta"
                        : isDone
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    <s.icon size={17} />
                  </div>
                  <span
                    className={`mt-2 text-[11px] font-medium uppercase tracking-[0.08em] ${
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
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card md:p-6">
          {data.step === 1 && (
            <StepUpload
              fileName={data.fileName}
              isLoading={flow.isLoading}
              progressMessage={flow.progressMessage}
              error={flow.error}
              onFileSelect={(file) => {
                flow.setStlFile(file);
                updateField("fileName", file.name);
              }}
              onContinue={handleStep1Continue}
            />
          )}

          {data.step === 2 && (
            <StepUserData
              data={{
                nombre: data.nombre, email: data.email, telefono: data.telefono,
                ubicacion: data.ubicacion, material: data.material, cantidad: data.cantidad,
                detalles: data.detalles, colorAcabado: data.colorAcabado,
                infill: data.infill, alturaCapa: data.alturaCapa,
                usoPieza: data.usoPieza,
                tolerancia: data.tolerancia, observaciones: data.observaciones,
              }}
              fileName={data.fileName}
              thumbnailUrl={flow.thumbnailUrl}
              isEmpresa={isEmpresa}
              isLoading={flow.isLoading}
              progressMessage={flow.progressMessage}
              error={flow.error}
              onChange={updateField}
              onBack={() => goToStep(1)}
              onContinue={handleStep2Continue}
            />
          )}

          {data.step === 3 && (
            <StepQuotes
              isEmpresa={isEmpresa}
              isProcessing={flow.isProcessing}
              progressMessage={flow.progressMessage}
              error={flow.error}
              quotes={flow.quotes}
              sessionId={data.sessionId}
              onSelectQuote={handleSelectQuote}
              onBack={() => {
                flow.clearError();
                goToStep(2);
              }}
            />
          )}

          {data.step === 4 && (
            <StepCheckout
              selectedQuote={
                selectedQuote ?? {
                  quote_option_uid: "",
                  provider_id: 0,
                  provider_name: "—",
                  provider_score: 0,
                  provider_tier: "",
                  provider_location: "",
                  price_ars: 0,
                  delivery_days: 0,
                  trust_metrics: { score: 0, reviews_count: 0, on_time_pct: 0 },
                }
              }
              orderId={flow.orderId ?? ""}
              sessionId={data.sessionId}
              isEmpresa={isEmpresa}
              isAccepting={flow.isLoading}
              onBack={() => {
                flow.clearError();
                goToStep(3);
              }}
            />
          )}

          {data.step === 5 && (
            <StepConfirmation
              isEmpresa={isEmpresa}
              sessionId={data.sessionId}
              orderId={flow.orderId}
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
