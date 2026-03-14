import { useState, useEffect, useCallback, useRef } from "react";
import { Upload, User, FileText, ShoppingCart, ChevronRight, RotateCcw } from "lucide-react";

const STORAGE_KEY = "comparo3d_quote";

interface QuoteData {
  nombre: string;
  email: string;
  telefono: string;
  material: string;
  cantidad: string;
  detalles: string;
  fileName: string;
  step: number;
  sessionId: string;
  updatedAt: string;
}

const defaultData: QuoteData = {
  nombre: "",
  email: "",
  telefono: "",
  material: "",
  cantidad: "1",
  detalles: "",
  fileName: "",
  step: 1,
  sessionId: "",
  updatedAt: "",
};

const stepLabels = [
  { icon: Upload, label: "Archivo STL" },
  { icon: User, label: "Tus datos" },
  { icon: FileText, label: "Cotizaciones" },
  { icon: ShoppingCart, label: "Compra" },
];

const materials = ["PLA", "ABS", "PETG", "Resina", "Nylon", "TPU", "Otro"];

const generateSessionId = () => `CMP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

const QuoteSection = () => {
  const [data, setData] = useState<QuoteData>(defaultData);
  const [hasSaved, setHasSaved] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
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

  // Auto-save to localStorage
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

  // Mock quotes for step 3
  const mockQuotes = [
    { provider: "Proveedor A", price: 4500, time: "3 días", rating: 4.8 },
    { provider: "Proveedor B", price: 3900, time: "5 días", rating: 4.5 },
    { provider: "Proveedor C", price: 5200, time: "2 días", rating: 4.9 },
  ];

  return (
    <section id="cotizar" className="py-20 md:py-28 bg-muted/50">
      <div className="container max-w-3xl">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Empezá ahora</p>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">Pedí tu cotización</h2>
        </div>

        {/* Continue banner */}
        {hasSaved && data.step > 1 && (
          <div className="mb-6 bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Tenés una cotización en curso</p>
              <p className="text-xs text-muted-foreground">Sesión {data.sessionId}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={resetQuote} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <RotateCcw size={12} /> Nueva
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
          {data.step === 1 && (
            <div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-4">Subí tu archivo</h3>
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
                    <p className="text-sm font-medium text-foreground">Arrastrá tu archivo STL acá</p>
                    <p className="text-xs text-muted-foreground mt-1">o hacé clic para seleccionar (.stl, .obj, .3mf)</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".stl,.obj,.3mf,.step"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                />
              </div>
              <button
                onClick={() => goToStep(2)}
                className="mt-6 w-full bg-gradient-primary text-primary-foreground py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-cta"
              >
                Continuar <ChevronRight size={18} />
              </button>
            </div>
          )}

          {data.step === 2 && (
            <div>
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
                  <label className="text-sm font-medium text-foreground block mb-1.5">Cantidad de piezas</label>
                  <input
                    type="number"
                    min="1"
                    value={data.cantidad}
                    onChange={(e) => updateField("cantidad", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                  Ver cotizaciones <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {data.step === 3 && (
            <div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-1">Cotizaciones disponibles</h3>
              <p className="text-sm text-muted-foreground mb-6">Sesión: {data.sessionId}</p>
              {/* TODO: Replace mock quotes with real API data */}
              <div className="space-y-3">
                {mockQuotes.map((q) => (
                  <div key={q.provider} className="border border-border rounded-lg p-4 flex items-center justify-between hover:shadow-card-hover transition-shadow">
                    <div>
                      <p className="font-semibold text-foreground">{q.provider}</p>
                      <p className="text-xs text-muted-foreground">Entrega: {q.time} · ⭐ {q.rating}</p>
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
              <button
                onClick={() => goToStep(2)}
                className="mt-6 px-6 py-3 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
              >
                Atrás
              </button>
            </div>
          )}

          {data.step === 4 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-4">
                <ShoppingCart size={28} className="text-primary-foreground" />
              </div>
              <h3 className="font-display font-semibold text-xl text-foreground mb-2">¡Listo!</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                Tu pedido fue registrado. Nos vamos a poner en contacto con vos para coordinar el pago y la entrega.
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
