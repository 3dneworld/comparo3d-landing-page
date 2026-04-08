import { useState } from "react";
import { ChevronDown, ChevronRight, Eye, CheckCircle2, MapPin } from "lucide-react";
import modeloPreview from "@/assets/modelo-preview.png";
import { toast } from "@/components/ui/sonner";
import { TrimmedThumbnail } from "./TrimmedThumbnail";

// ── Materiales ────────────────────────────────────────────────────────────────
// "No estoy seguro" se muestra al usuario pero se envía "PLA" al backend
const MATERIAL_OPTIONS = [
  { label: "PLA (Económico) - Recomendado", value: "PLA" },
  { label: "No estoy seguro (Asesorarme)", value: "ASESORAR" }, // → PLA internamente
  { label: "ABS (Resistente)", value: "ABS" },
  { label: "PETG (Intermedio)", value: "PETG" },
  { label: "Nylon (Industrial)", value: "Nylon" },
  { label: "TPU (Flexible)", value: "TPU" },
];

// ── Infill opciones ───────────────────────────────────────────────────────────
const INFILL_OPTIONS = ["5%", "10%", "20%", "25%", "30%", "40%", "50%", "60%", "70%", "80%", "90%", "100%"];
const INFILL_DEFAULT = "20%";

// ── Altura de capa opciones ───────────────────────────────────────────────────
const LAYER_OPTIONS = [
  { label: "0.1mm (Alta calidad)", value: "0.1mm" },
  { label: "0.2mm (Recomendado)", value: "0.2mm" },
  { label: "0.3mm (Económico/Rápido)", value: "0.3mm" },
];
const LAYER_DEFAULT = "0.2mm";

// ── Colores ───────────────────────────────────────────────────────────────────
const COLOR_OPTIONS = [
  { label: "BLANCO",  value: "Blanco",  bg: "#FFFFFF", border: "#D1D5DB" },
  { label: "NEGRO",   value: "Negro",   bg: "#1F1F1F", border: "#1F1F1F" },
  { label: "AZUL",    value: "Azul",    bg: "#2563EB", border: "#2563EB" },
  { label: "ROJO",    value: "Rojo",    bg: "#DC2626", border: "#DC2626" },
  { label: "GRIS",    value: "Gris",    bg: "#6B7280", border: "#6B7280" },
  { label: "AMARILLO",value: "Amarillo",bg: "#F59E0B", border: "#F59E0B" },
  { label: "VERDE",   value: "Verde",   bg: "#16A34A", border: "#16A34A" },
  { label: "NARANJA", value: "Naranja", bg: "#EA580C", border: "#EA580C" },
];

interface FormState {
  nombre: string;
  email: string;
  telefono: string;
  ubicacion: string;
  material: string;
  cantidad: string;
  detalles: string;
  colorAcabado: string;
  infill: string;
  alturaCapa: string;
  observaciones: string;
}

interface StepUserDataProps {
  data: FormState;
  fileName: string;
  thumbnailUrl?: string | null;
  isEmpresa: boolean;
  isLoading: boolean;
  progressMessage: string;
  error: string | null;
  onChange: (field: keyof FormState, value: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function StepUserData({
  data,
  fileName,
  thumbnailUrl,
  isEmpresa,
  isLoading,
  progressMessage,
  error,
  onChange,
  onBack,
  onContinue,
}: StepUserDataProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [colorCustom, setColorCustom] = useState("");
  const thumbnailSrc = thumbnailUrl || modeloPreview;

  const inputClass =
    "w-full rounded-xl border border-input bg-background px-4 py-3 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  const selectClass =
    "w-full rounded-xl border border-input bg-background px-4 py-3 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer";

  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(() => {
        onChange("ubicacion", "Buenos Aires");
      });
    }
  };

  // Color seleccionado actual (puede ser un valor predefinido o el custom)
  const selectedColor = data.colorAcabado;
  const isCustomColor = selectedColor && !COLOR_OPTIONS.find(c => c.value === selectedColor);

  const handleColorSelect = (value: string) => {
    onChange("colorAcabado", value);
    setColorCustom("");
  };

  const handleCustomColor = (val: string) => {
    setColorCustom(val);
    onChange("colorAcabado", val);
  };

  return (
    <div>
      {/* Preview archivo */}
      {fileName && (
        <div className="mb-5 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="flex items-center gap-2 px-4 pt-3 pb-2">
            <Eye size={14} className="text-primary" />
            <p className="text-sm font-medium text-foreground">Vista previa del modelo</p>
            <CheckCircle2 size={14} className="ml-auto text-accent" />
            <span className="text-xs font-medium text-accent">Cargado</span>
          </div>
          <div className="px-4 pb-4">
            <div className="flex justify-center">
              <div className="inline-flex max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-3">
                <TrimmedThumbnail
                  src={thumbnailSrc}
                  alt="Vista previa del modelo 3D"
                  className="block max-h-[320px] w-auto max-w-full object-contain"
                />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">{fileName}</p>
              <p className="text-xs text-muted-foreground">Cargado correctamente</p>
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
        {/* Nombre */}
        <div>
          <label className="mb-1.5 block text-[14px] font-semibold text-foreground">Nombre *</label>
          <input
            value={data.nombre}
            onChange={(e) => onChange("nombre", e.target.value)}
            className={inputClass}
            placeholder="Tu nombre"
          />
        </div>

        {/* Email */}
        <div>
          <label className="mb-1.5 block text-[14px] font-semibold text-foreground">E-mail *</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onChange("email", e.target.value)}
            className={inputClass}
            placeholder="tu@email.com"
          />
        </div>

        {/* Teléfono */}
        <div>
          <label className="mb-1.5 block text-[14px] font-semibold text-foreground">Teléfono</label>
          <input
            type="tel"
            value={data.telefono}
            onChange={(e) => onChange("telefono", e.target.value)}
            className={inputClass}
            placeholder="+54 11 ..."
          />
        </div>

        {/* Ubicación */}
        <div>
          <label className="mb-1.5 block text-[14px] font-semibold text-foreground">
            Ubicación / Ciudad
          </label>
          <div className="relative">
            <input
              value={data.ubicacion}
              onChange={(e) => onChange("ubicacion", e.target.value)}
              className={`${inputClass} pr-28`}
              placeholder="Tu ciudad"
            />
            <button
              type="button"
              onClick={handleDetectLocation}
              className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg bg-primary/5 px-2 py-1 text-[11px] text-primary transition-colors hover:bg-primary/10"
            >
              <MapPin size={12} />
              Detectar
            </button>
          </div>
        </div>

        {/* Material */}
        <div>
          <label className="mb-1.5 block text-[14px] font-semibold text-foreground">Material *</label>
          <div className="relative">
            <select
              value={data.material || "PLA"}
              onChange={(e) => onChange("material", e.target.value)}
              className={selectClass}
            >
              
              {MATERIAL_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {/* Cantidad */}
        <div>
          <label className="mb-1.5 block text-[14px] font-semibold text-foreground">
            Cantidad de copias *
          </label>
          <input
            type="number"
            min="1"
            value={data.cantidad}
            onChange={(e) => onChange("cantidad", e.target.value)}
            className={inputClass}
            placeholder="1"
          />
        </div>
      </div>

      {/* Detalles */}
      <div className="mt-4">
        <label className="mb-1.5 block text-[14px] font-semibold text-foreground">
          Detalles del proyecto
        </label>
        <textarea
          value={data.detalles}
          onChange={(e) => onChange("detalles", e.target.value)}
          rows={3}
          className={`${inputClass} resize-none`}
          placeholder={`Uso de la pieza:\nCaracterísticas: Rozamiento / Exposición al sol / Flexibilidad / Resistencia a temperatura, etc`}
        />
      </div>

      {/* ── Opciones avanzadas ────────────────────────────────────────────────── */}
      <div className="mt-5 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronDown
            size={16}
            className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`}
          />
          Opciones avanzadas
        </button>

        {showAdvanced && (
          <div className="mt-5 space-y-6">

            {/* ── Color ─────────────────────────────────────────────────────── */}
            <div>
              <label className="mb-3 block text-[14px] font-semibold text-foreground">COLOR</label>
              <div className="flex flex-wrap gap-4">
                {COLOR_OPTIONS.map((c) => {
                  const isSelected = selectedColor === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => handleColorSelect(c.value)}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <span
                        className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
                          isSelected
                            ? "ring-2 ring-primary ring-offset-2"
                            : "hover:ring-2 hover:ring-muted-foreground hover:ring-offset-1"
                        }`}
                        style={{ backgroundColor: c.bg, border: `2px solid ${c.border}` }}
                      >
                        {isSelected && (
                          <CheckCircle2
                            size={20}
                            style={{ color: c.value === "Blanco" ? "#111" : "#fff" }}
                            strokeWidth={2.5}
                          />
                        )}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {c.label}
                      </span>
                    </button>
                  );
                })}

                {/* Botón "DETALLAR" para color custom */}
                <button
                  type="button"
                  onClick={() => {
                    setColorCustom("");
                    onChange("colorAcabado", "");
                    toast("Especificiar en Detalles del proyecto", {
                      duration: 2400,
                    });
                  }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed transition-all ${
                      isCustomColor
                        ? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2"
                        : "border-border bg-muted/30 hover:border-muted-foreground"
                    }`}
                  >
                    <span className="text-[18px] font-light text-muted-foreground">+</span>
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    DETALLAR
                  </span>
                </button>
              </div>

            </div>

            {/* ── Infill y Altura de capa ───────────────────────────────────── */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Infill */}
              <div>
                <label className="mb-1.5 block text-[14px] font-semibold text-foreground">
                  RELLENO
                </label>
                <div className="relative">
                  <select
                    value={data.infill || INFILL_DEFAULT}
                    onChange={(e) => onChange("infill", e.target.value)}
                    className={selectClass}
                  >
                    {INFILL_OPTIONS.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
                <p className="mt-1.5 text-[12px] text-muted-foreground">
                  Mayor relleno = más resistencia pero más tiempo/costo
                </p>
              </div>

              {/* Altura de capa */}
              <div>
                <label className="mb-1.5 block text-[14px] font-semibold text-foreground">
                  ALTURA DE CAPA
                </label>
                <div className="relative">
                  <select
                    value={data.alturaCapa || LAYER_DEFAULT}
                    onChange={(e) => onChange("alturaCapa", e.target.value)}
                    className={selectClass}
                  >
                    {LAYER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
                <p className="mt-1.5 text-[12px] text-muted-foreground">
                  Menor altura = más detalle pero más tiempo
                </p>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <p className="text-[13px] text-destructive">{error}</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-[14px] font-medium text-primary">{progressMessage}</p>
        </div>
      )}

      <div className="mt-5 flex gap-3">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="rounded-xl border border-border px-5 py-3 text-[14px] font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          Atrás
        </button>

        <button
          onClick={onContinue}
          disabled={isLoading}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3 text-[15px] font-semibold text-primary-foreground shadow-cta transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isLoading
            ? progressMessage
            : isEmpresa
            ? "Solicitar propuesta"
            : "Ver cotizaciones"}
          {!isLoading && <ChevronRight size={18} />}
        </button>
      </div>
    </div>
  );
}
