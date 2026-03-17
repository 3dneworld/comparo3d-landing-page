import { useState, useEffect, useCallback, useRef } from "react";
import { Upload, User, FileText, ShoppingCart, ChevronRight, ChevronDown, RotateCcw, Lock, MapPin, Eye, CheckCircle2 } from "lucide-react";
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
  // Advanced fields
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
  { icon: Upload, label: "Archivo 3D" },
  { icon: User, label: "Tus datos" },
  { icon: FileText, label: "Cotizaciones" },
  { icon: ShoppingCart, label: "Compra" },
];

const materials = ["PLA", "ABS", "PETG", "Resina", "Nylon", "TPU", "Otro"];

const generateSessionId = () =>
  `CMP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

const QuoteSection = () => {
  const { audience } = useAudience();
  const [data, setData] = useState<QuoteData>(defaultData);
  const [hasSaved, setHasSaved] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage on mount
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
      // TODO: Upload file to backend when API is ready
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
    // TODO: Integrate geolocation API or IP-based detection
    console.log("[QuoteSection] Detect location triggered");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          // For now just set a placeholder — real implementation would reverse geocode
          updateField("ubicacion", "Buenos Aires");
          console.log("[QuoteSection] Location detected");
        },
        (err) => {
          console.warn("[QuoteSection] Geolocation error:", err.message);
        }
      );
    }
  };

  // Mock quotes for step 3
  const mockQuotes = [
    { provider: "Proveedor A", price: 4500, time: "3 días" },
    { provider: "Proveedor B", price: 3900, time: "5 días" },
    { provider: "Proveedor C", price: 5200, time: "2 días" },
  ];

  const isEmpresa = audience === "empresa";

  return (
    <section id="cotizar" className="py-20 md:py-28 bg-muted/50">
      <div className="container max-w-3xl">
        <div className="text-center mb-6">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Empezá ahora</p>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">Pedí tu cotización</h2>
        </div>

        {/* Helper notes */}
        <div className="text-center mb-8 space-y-1">
          <p className="text-sm text-muted-foreground">
            1 archivo por cotización. Podés pedir varias copias de la misma pieza.
          </p>
          <p className="text-xs text-muted-foreground">
            Formatos: STL, OBJ, 3MF · No se aceptan múltiples piezas diferentes en una sola cotización.
          </p>
          {isEmpresa ? (
            <p className="text-xs font-medium text-accent mt-2">
              Recibí una propuesta en hasta 72 hs hábiles.
            </p>
          ) : (
            <p className="text-xs font-medium text-primary mt-2">
              Recibí cotizaciones en minutos.
            </p>
          )}
        </div>

        {/* Session recovery */}
        {hasSaved && data.step > 1 && (
          <div className="mb-6 bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Encontramos una cotización empezada</p>
              <p className="text-xs text-muted-foreground">Sesión {data.sessionId}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={resetQuote}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-3 py-1.5 rounded border border-border hover:bg-muted transition-colors"
              >
                <RotateCcw size={12} /> Empezar de nuevo
              </button>
              <button
                onClick={() => {}}
                className="text-xs text-primary font-semibold flex items-center gap-1 px-3 py-1.5 rounded bg-primary/10 hover:bg-primary/15 transition-colors"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-10">
          {stepLabels.map((s, i) => {
            const stepNum = i + 1;
            const isActive = data.step === stepNum;
            const isDone = data.step > stepNum;
            return (
              <div key={s.label} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-gradient-primary text-primary-foreground shadow-cta"
                        : isDone
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    <s.icon size={18} />
                  </div>
                  <span className={`mt-2 text-xs font-medium hidden sm:block ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div className={`h-[2px] flex-1 mx-1 ${isDone ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="bg-card rounded-xl border border-border p-6 md:p-8 shadow-card">
          {/* ===== STEP 1: FILE UPLOAD ===== */}
          {data.step === 1 && (
            <div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-1">Subí tu archivo 3D</h3>
              <p className="text-sm text-muted-foreground mb-5">
                Un solo archivo por cotización. Si necesitás cotizar piezas distintas, creá una cotización por cada una.
              </p>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                  isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <Upload size={32} className="mx-auto text-muted-foreground mb-3" />
                {data.fileName ? (
                  <p className="text-sm font-medium text-foreground">{data.fileName}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground">Arrastrá tu archivo acá</p>
                    <p className="text-xs text-muted-foreground mt-1">o hacé clic para seleccionar</p>
                    <p className="text-xs text-muted-foreground mt-2 font-medium">Formatos aceptados: STL, OBJ, 3MF</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".stl,.obj,.3mf"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                />
              </div>
              {/* Confidentiality note */}
              <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                <Lock size={13} className="shrink-0" />
                <span>Tu archivo se mantiene confidencial y no se comparte fuera del proceso de cotización.</span>
              </div>
              <button
                onClick={() => goToStep(2)}
                className="mt-6 w-full bg-gradient-primary text-primary-foreground py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-cta"
              >
                Continuar <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* ===== STEP 2: USER DATA ===== */}
          {data.step === 2 && (
            <div>
              {/* Model preview card */}
              {data.fileName && (
                <div className="mb-6 bg-muted/50 border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                    <Eye size={14} className="text-primary" />
                    <p className="text-sm font-medium text-foreground">Vista previa del modelo</p>
                    <CheckCircle2 size={14} className="text-accent ml-auto" />
                    <span className="text-xs text-accent font-medium">Cargado</span>
                  </div>
                  <div className="px-4 pb-4">
                    <div className="bg-background rounded-lg overflow-hidden flex items-center justify-center h-40 border border-border">
                      {/* TODO: Replace with real thumbnail from uploaded file when backend supports it */}
                      <img
                        src={modeloPreview}
                        alt="Vista previa del modelo 3D"
                        className="h-full w-full object-contain p-4"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">{data.fileName}</p>
                      <p className="text-xs text-muted-foreground">Tu pieza fue cargada correctamente</p>
                    </div>
                  </div>
                </div>
              )}

              <h3 className="font-display font-semibold text-lg text-foreground mb-4">Tus datos</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Nombre</label>
                  <input
                    value={data.nombre}
                    onChange={(e) => updateField("nombre", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
                  <input
                    type="email"
                    value={data.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="tu@email.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Teléfono</label>
                  <input
                    type="tel"
                    value={data.telefono}
                    onChange={(e) => updateField("telefono", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="+54 11 ..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Ubicación / Ciudad</label>
                  <div className="relative">
                    <input
                      value={data.ubicacion}
                      onChange={(e) => updateField("ubicacion", e.target.value)}
                      className="w-full px-4 py-2.5 pr-28 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Tu ciudad"
                    />
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded bg-primary/5 hover:bg-primary/10"
                    >
                      <MapPin size={12} />
                      Detectar
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Material</label>
                  <select
                    value={data.material}
                    onChange={(e) => updateField("material", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Seleccionar material</option>
                    {materials.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Cantidad de copias</label>
                  <input
                    type="number"
                    min="1"
                    value={data.cantidad}
                    onChange={(e) => updateField("cantidad", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Copias de la misma pieza"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="text-sm font-medium text-foreground block mb-1.5">Detalles del proyecto</label>
                <textarea
                  value={data.detalles}
                  onChange={(e) => updateField("detalles", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Contanos qué necesitás..."
                />
              </div>

              {/* TODO: Implement Google auth for "Continuar con Google" */}
              <button
                type="button"
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
                onClick={() => console.log("[QuoteSection] Google auth placeholder")}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continuar con Google
              </button>

              {/* Advanced section */}
              <div className="mt-5 border-t border-border pt-4">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronDown size={16} className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
                  Avanzado
                </button>
                {showAdvanced && (
                  <div className="mt-4 grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Color / acabado</label>
                      <input
                        value={data.colorAcabado}
                        onChange={(e) => updateField("colorAcabado", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Ej: blanco, negro mate"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Uso de la pieza</label>
                      <input
                        value={data.usoPieza}
                        onChange={(e) => updateField("usoPieza", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Ej: prototipo, producción final"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Urgencia</label>
                      <select
                        value={data.urgencia}
                        onChange={(e) => updateField("urgencia", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Sin urgencia especial</option>
                        <option value="normal">Normal</option>
                        <option value="urgente">Urgente</option>
                        <option value="flexible">Flexible</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Tolerancia / precisión</label>
                      <input
                        value={data.tolerancia}
                        onChange={(e) => updateField("tolerancia", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Ej: ±0.2mm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-sm font-medium text-foreground block mb-1.5">Observaciones adicionales</label>
                      <textarea
                        value={data.observaciones}
                        onChange={(e) => updateField("observaciones", e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                        placeholder="Cualquier detalle extra que nos ayude a cotizar mejor"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => goToStep(1)}
                  className="px-6 py-3 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
                >
                  Atrás
                </button>
                <button
                  onClick={() => goToStep(3)}
                  className="flex-1 bg-gradient-primary text-primary-foreground py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-cta"
                >
                  {isEmpresa ? "Solicitar propuesta" : "Ver cotizaciones"} <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ===== STEP 3: QUOTES ===== */}
          {data.step === 3 && (
            <div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-1">
                {isEmpresa ? "Propuesta en proceso" : "Cotizaciones disponibles"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">Sesión: {data.sessionId}</p>

              {isEmpresa ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <FileText size={24} className="text-accent" />
                  </div>
                  <p className="text-sm text-foreground font-medium mb-1">Tu propuesta está siendo preparada</p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Nuestro equipo está coordinando con proveedores verificados. Recibís la propuesta consolidada en hasta 72 hs hábiles.
                  </p>
                </div>
              ) : (
                <>
                  {/* TODO: Replace mock quotes with real API data */}
                  <div className="space-y-3">
                    {mockQuotes.map((q) => (
                      <div key={q.provider} className="border border-border rounded-lg p-4 flex items-center justify-between hover:shadow-card-hover transition-shadow">
                        <div>
                          <p className="font-semibold text-foreground">{q.provider}</p>
                          <p className="text-xs text-muted-foreground">Entrega estimada: {q.time}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-display font-bold text-lg text-foreground">${q.price.toLocaleString("es-AR")}</p>
                          <button
                            onClick={() => goToStep(4)}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            Elegir →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <button
                onClick={() => goToStep(2)}
                className="mt-6 px-6 py-3 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
              >
                Atrás
              </button>
            </div>
          )}

          {/* ===== STEP 4: CONFIRMATION ===== */}
          {data.step === 4 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-4">
                <ShoppingCart size={28} className="text-primary-foreground" />
              </div>
              <h3 className="font-display font-semibold text-xl text-foreground mb-2">¡Listo!</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                {isEmpresa
                  ? "Tu solicitud fue registrada. Nos vamos a poner en contacto para coordinar la propuesta corporativa."
                  : "Tu pedido fue registrado. Nos vamos a poner en contacto con vos para coordinar el pago y la entrega."}
              </p>
              <p className="text-xs text-muted-foreground">Referencia: {data.sessionId}</p>
              <button
                onClick={resetQuote}
                className="mt-6 bg-gradient-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-cta"
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
