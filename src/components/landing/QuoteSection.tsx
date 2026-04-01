import { useState, useEffect, useCallback, useRef } from "react";
import {
  Upload,
  User,
  FileText,
  ShoppingCart,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Lock,
  MapPin,
  Eye,
  CheckCircle2,
  Layers3,
  ShieldCheck,
  Files,
} from "lucide-react";
import { useAudience } from "@/contexts/AudienceContext";
import modeloPreview from "@/assets/modelo-preview.png";

const STORAGE_KEY = "comparo3d_quote";

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
  usoPieza: string;
  urgencia: string;
  tolerancia: string;
  observaciones: string;
  step: number;
  sessionId: string;
  updatedAt: string;
}

const defaultData: QuoteData = {
  nombre: "",
  email: "",
  telefono: "",
  ubicacion: "",
  material: "",
  cantidad: "1",
  detalles: "",
  fileName: "",
  colorAcabado: "",
  usoPieza: "",
  urgencia: "",
  tolerancia: "",
  observaciones: "",
  step: 1,
  sessionId: "",
  updatedAt: "",
};

const stepLabels = [
  { icon: Upload, label: "Archivo 3D", short: "Archivo" },
  { icon: User, label: "Tus datos", short: "Datos" },
  { icon: FileText, label: "Cotizaciones", short: "Opciones" },
  { icon: ShoppingCart, label: "Compra", short: "Compra" },
];

const materials = ["PLA", "PETG", "ABS", "TPU", "Nylon", "Policarbonato"];

const generateSessionId = () =>
  `CMP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

const QuoteSection = () => {
  const { audience } = useAudience();
  const [data, setData] = useState<QuoteData>(defaultData);
  const [hasSaved, setHasSaved] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as QuoteData;
        console.log("[QuoteSection] Restored saved quote:", parsed.sessionId);
        setData(parsed);
        setHasSaved(true);
      }
    } catch (e) {
      console.warn("[QuoteSection] Failed to load saved quote:", e);
    }
  }, []);

  const saveToStorage = useCallback((newData: QuoteData) => {
    const toSave = { ...newData, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    console.log("[QuoteSection] Auto-saved to localStorage");
  }, []);

  const updateField = (field: keyof QuoteData, value: string) => {
    const updated = { ...data, [field]: value };
    setData(updated);
    saveToStorage(updated);
  };

  const goToStep = (step: number) => {
    const updated = { ...data, step };
    if (step === 2 && !data.sessionId) {
      updated.sessionId = generateSessionId();
    }
    setData(updated);
    saveToStorage(updated);
    console.log("[QuoteSection] Step changed to:", step);
  };

  const handleFileSelect = (file: File | null) => {
    if (file) {
      console.log("[QuoteSection] File selected:", file.name, file.size);
      updateField("fileName", file.name);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const resetQuote = () => {
    localStorage.removeItem(STORAGE_KEY);
    setData(defaultData);
    setHasSaved(false);
    console.log("[QuoteSection] Quote reset");
  };

  const handleDetectLocation = () => {
    console.log("[QuoteSection] Detect location triggered");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          updateField("ubicacion", "Buenos Aires");
          console.log("[QuoteSection] Location detected");
        },
        (err) => {
          console.warn("[QuoteSection] Geolocation error:", err.message);
        }
      );
    }
  };

  const mockQuotes = [
    { provider: "Proveedor A", price: 4500, time: "3 días" },
    { provider: "Proveedor B", price: 3900, time: "5 días" },
    { provider: "Proveedor C", price: 5200, time: "2 días" },
  ];

  const isEmpresa = audience === "empresa";

  return (
    <section id="cotizar" className="bg-muted/50 py-14 md:py-18">
      <div className="container max-w-4xl">
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

        <div className="mx-auto mb-7 grid max-w-3xl grid-cols-1 gap-3 md:mb-8 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card px-4 py-3 text-left">
            <div className="flex items-center gap-2 text-primary">
              <Files size={16} />
              <span className="text-[12px] font-semibold uppercase tracking-[0.12em]">Archivo</span>
            </div>
            <p className="mt-2 text-[14px] font-medium leading-snug text-foreground">1 archivo por cotización</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              Varias copias de la misma pieza, sí. Piezas distintas, por separado.
            </p>
          </div>

          <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] px-4 py-3 text-left">
            <div className="flex items-center gap-2 text-primary">
              <Upload size={16} />
              <span className="text-[12px] font-semibold uppercase tracking-[0.12em]">Formato</span>
            </div>
            <p className="mt-2 text-[14px] font-medium leading-snug text-foreground">Hoy aceptamos solo STL</p>
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

        {hasSaved && data.step > 1 && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/[0.05] p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Encontramos una cotización empezada</p>
              <p className="text-xs text-muted-foreground">Sesión {data.sessionId}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={resetQuote}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card md:p-6">
          {data.step === 1 && (
            <div>
              <div className="mb-5">
                <h3 className="text-[24px] font-semibold leading-tight text-foreground">Subí tu archivo 3D</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                  Un solo archivo por cotización. Si necesitás cotizar piezas distintas, generá una cotización por cada una.
                </p>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors md:px-8 md:py-9 ${
                  isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <div className="mx-auto flex max-w-md flex-col items-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Upload size={28} />
                  </div>

                  {data.fileName ? (
                    <>
                      <p className="text-[16px] font-semibold text-foreground">{data.fileName}</p>
                      <p className="mt-2 text-[13px] text-muted-foreground">Archivo cargado correctamente.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-[18px] font-semibold leading-snug text-foreground">
                        Arrastrá tu STL acá o hacé clic para seleccionarlo
                      </p>
                      <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                        Formato aceptado hoy: STL. La experiencia actual no acepta STEP, STP ni múltiples piezas distintas en una misma cotización.
                      </p>
                    </>
                  )}

                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    <span className="rounded-full border border-primary/12 bg-primary/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
                      Solo STL
                    </span>
                    <span className="rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground">
                      1 archivo por cotización
                    </span>
                    <span className="rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground">
                      Varias copias, sí
                    </span>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".stl"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                />
              </div>

              <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/[0.04] px-4 py-3">
                <div className="flex items-start gap-3">
                  <Lock size={16} className="mt-0.5 shrink-0 text-primary" />
                  <div>
                    <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-primary">Archivo confidencial</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                      Tu archivo se mantiene confidencial y no se comparte fuera del proceso de cotización y coordinación.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => goToStep(2)}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3 text-[15px] font-semibold text-primary-foreground shadow-cta transition-opacity hover:opacity-90"
              >
                Continuar <ChevronRight size={18} />
              </button>
            </div>
          )}

          {data.step === 2 && (
            <div>
              {data.fileName && (
                <div className="mb-5 overflow-hidden rounded-2xl border border-border bg-muted/45">
                  <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                    <Eye size={14} className="text-primary" />
                    <p className="text-sm font-medium text-foreground">Vista previa del modelo</p>
                    <CheckCircle2 size={14} className="ml-auto text-accent" />
                    <span className="text-xs font-medium text-accent">Cargado</span>
                  </div>

                  <div className="px-4 pb-4">
                    <div className="flex h-36 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
                      <img
                        src={modeloPreview}
                        alt="Vista previa del modelo 3D"
                        className="h-full w-full object-contain p-4"
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground">{data.fileName}</p>
                      <p className="text-xs text-muted-foreground">Tu pieza fue cargada correctamente</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-5">
                <h3 className="text-[24px] font-semibold leading-tight text-foreground">Tus datos</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                  Completá lo necesario para poder mostrar opciones y seguir con el pedido.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[14px] font-semibold text-foreground">Nombre</label>
                  <input
                    value={data.nombre}
                    onChange={(e) => updateField("nombre", e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Tu nombre"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[14px] font-semibold text-foreground">Email</label>
                  <input
                    type="email"
                    value={data.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[14px] font-semibold text-foreground">Teléfono</label>
                  <input
                    type="tel"
                    value={data.telefono}
                    onChange={(e) => updateField("telefono", e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="+54 11 ..."
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[14px] font-semibold text-foreground">Ubicación / Ciudad</label>
                  <div className="relative">
                    <input
                      value={data.ubicacion}
                      onChange={(e) => updateField("ubicacion", e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-4 py-3 pr-28 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Tu ciudad"
                    />
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg bg-primary/5 px-2 py-1 text-[11px] text-primary transition-colors hover:bg-primary/10 hover:text-primary/80"
                    >
                      <MapPin size={12} />
                      Detectar
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[14px] font-semibold text-foreground">Material</label>
                  <select
                    value={data.material}
                    onChange={(e) => updateField("material", e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Seleccionar material</option>
                    {materials.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[14px] font-semibold text-foreground">Cantidad de copias</label>
                  <input
                    type="number"
                    min="1"
                    value={data.cantidad}
                    onChange={(e) => updateField("cantidad", e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Copias de la misma pieza"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-1.5 block text-[14px] font-semibold text-foreground">Detalles del proyecto</label>
                <textarea
                  value={data.detalles}
                  onChange={(e) => updateField("detalles", e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Contanos qué necesitás..."
                />
              </div>

              <button
                type="button"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-[14px] text-muted-foreground transition-colors hover:bg-muted/50"
                onClick={() => console.log("[QuoteSection] Google auth placeholder")}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continuar con Google
              </button>

              <div className="mt-5 border-t border-border pt-4">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ChevronDown size={16} className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
                  Avanzado
                </button>

                {showAdvanced && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[14px] font-semibold text-foreground">Color / acabado</label>
                      <input
                        value={data.colorAcabado}
                        onChange={(e) => updateField("colorAcabado", e.target.value)}
                        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Ej: blanco, negro mate"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[14px] font-semibold text-foreground">Uso de la pieza</label>
                      <input
                        value={data.usoPieza}
                        onChange={(e) => updateField("usoPieza", e.target.value)}
                        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Ej: prototipo, producción final"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[14px] font-semibold text-foreground">Urgencia</label>
                      <select
                        value={data.urgencia}
                        onChange={(e) => updateField("urgencia", e.target.value)}
                        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Sin urgencia especial</option>
                        <option value="normal">Normal</option>
                        <option value="urgente">Urgente</option>
                        <option value="flexible">Flexible</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[14px] font-semibold text-foreground">Tolerancia / precisión</label>
                      <input
                        value={data.tolerancia}
                        onChange={(e) => updateField("tolerancia", e.target.value)}
                        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Ej: ±0.2mm"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-[14px] font-semibold text-foreground">Observaciones adicionales</label>
                      <textarea
                        value={data.observaciones}
                        onChange={(e) => updateField("observaciones", e.target.value)}
                        rows={2}
                        className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Cualquier detalle extra que nos ayude a cotizar mejor"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => goToStep(1)}
                  className="rounded-xl border border-border px-5 py-3 text-[14px] font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Atrás
                </button>

                <button
                  onClick={() => goToStep(3)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3 text-[15px] font-semibold text-primary-foreground shadow-cta transition-opacity hover:opacity-90"
                >
                  {isEmpresa ? "Solicitar propuesta" : "Ver cotizaciones"} <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {data.step === 3 && (
            <div>
              <h3 className="text-[24px] font-semibold leading-tight text-foreground">
                {isEmpresa ? "Propuesta en proceso" : "Cotizaciones disponibles"}
              </h3>
              <p className="mt-2 text-[14px] text-muted-foreground">Sesión: {data.sessionId}</p>

              {isEmpresa ? (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                    <FileText size={24} className="text-accent" />
                  </div>
                  <p className="mb-1 text-[15px] font-medium text-foreground">Tu propuesta está siendo preparada</p>
                  <p className="mx-auto max-w-md text-[13px] leading-relaxed text-muted-foreground">
                    Nuestro equipo está coordinando con proveedores verificados. Recibís la propuesta consolidada en hasta 72 hs hábiles.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {mockQuotes.map((q) => (
                    <div
                      key={q.provider}
                      className="flex items-center justify-between rounded-xl border border-border p-4 transition-shadow hover:shadow-card-hover"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{q.provider}</p>
                        <p className="text-xs text-muted-foreground">Entrega estimada: {q.time}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">${q.price.toLocaleString("es-AR")}</p>
                        <button onClick={() => goToStep(4)} className="text-xs font-semibold text-primary hover:underline">
                          Elegir →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => goToStep(2)}
                className="mt-6 rounded-xl border border-border px-5 py-3 text-[14px] font-medium text-foreground transition-colors hover:bg-muted"
              >
                Atrás
              </button>
            </div>
          )}

          {data.step === 4 && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary">
                <ShoppingCart size={28} className="text-primary-foreground" />
              </div>
              <h3 className="mb-2 text-[24px] font-semibold text-foreground">¡Listo!</h3>
              <p className="mx-auto mb-6 max-w-md text-[14px] leading-relaxed text-muted-foreground">
                {isEmpresa
                  ? "Tu solicitud fue registrada. Nos vamos a poner en contacto para coordinar la propuesta corporativa."
                  : "Tu pedido fue registrado. Nos vamos a poner en contacto con vos para coordinar el pago y la entrega."}
              </p>
              <p className="text-xs text-muted-foreground">Referencia: {data.sessionId}</p>
              <button
                onClick={resetQuote}
                className="mt-6 rounded-xl bg-gradient-primary px-8 py-3 font-semibold text-primary-foreground shadow-cta transition-opacity hover:opacity-90"
              >
                Nueva cotización
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default QuoteSection;
