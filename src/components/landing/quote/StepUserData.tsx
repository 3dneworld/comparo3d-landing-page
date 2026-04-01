import { useState } from "react";
import { ChevronDown, ChevronRight, Eye, CheckCircle2, MapPin } from "lucide-react";
import modeloPreview from "@/assets/modelo-preview.png";

const materials = ["PLA", "PETG", "ABS", "TPU", "Nylon", "Policarbonato"];

interface FormState {
  nombre: string;
  email: string;
  telefono: string;
  ubicacion: string;
  material: string;
  cantidad: string;
  detalles: string;
  colorAcabado: string;
  usoPieza: string;
  urgencia: string;
  tolerancia: string;
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

  const inputClass =
    "w-full rounded-xl border border-input bg-background px-4 py-3 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(() => {
        onChange("ubicacion", "Buenos Aires");
      });
    }
  };

  return (
    <div>
      {/* Preview archivo */}
      {fileName && (
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
                src={thumbnailUrl || modeloPreview}
                alt="Vista previa del modelo 3D"
                className="h-full w-full object-contain p-4"
              />
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
        <div>
          <label className="mb-1.5 block text-[14px] font-semibold text-foreground">Nombre *</label>
          <input
            value={data.nombre}
            onChange={(e) => onChange("nombre", e.target.value)}
            className={inputClass}
            placeholder="Tu nombre"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[14px] font-semibold text-foreground">Email *</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onChange("email", e.target.value)}
            className={inputClass}
            placeholder="tu@email.com"
          />
        </div>

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

        <div>
          <label className="mb-1.5 block text-[14px] font-semibold text-foreground">Material *</label>
          <select
            value={data.material}
            onChange={(e) => onChange("material", e.target.value)}
            className={inputClass}
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

      <div className="mt-4">
        <label className="mb-1.5 block text-[14px] font-semibold text-foreground">
          Detalles del proyecto
        </label>
        <textarea
          value={data.detalles}
          onChange={(e) => onChange("detalles", e.target.value)}
          rows={3}
          className={`${inputClass} resize-none`}
          placeholder="Contanos qué necesitás..."
        />
      </div>

      {/* Avanzado */}
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
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[14px] font-semibold text-foreground">
                Color / acabado
              </label>
              <input
                value={data.colorAcabado}
                onChange={(e) => onChange("colorAcabado", e.target.value)}
                className={inputClass}
                placeholder="Ej: blanco, negro mate"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[14px] font-semibold text-foreground">
                Uso de la pieza
              </label>
              <input
                value={data.usoPieza}
                onChange={(e) => onChange("usoPieza", e.target.value)}
                className={inputClass}
                placeholder="Ej: prototipo, producción final"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[14px] font-semibold text-foreground">
                Urgencia
              </label>
              <select
                value={data.urgencia}
                onChange={(e) => onChange("urgencia", e.target.value)}
                className={inputClass}
              >
                <option value="">Sin urgencia especial</option>
                <option value="normal">Normal</option>
                <option value="urgente">Urgente</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[14px] font-semibold text-foreground">
                Tolerancia / precisión
              </label>
              <input
                value={data.tolerancia}
                onChange={(e) => onChange("tolerancia", e.target.value)}
                className={inputClass}
                placeholder="Ej: ±0.2mm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-[14px] font-semibold text-foreground">
                Observaciones adicionales
              </label>
              <textarea
                value={data.observaciones}
                onChange={(e) => onChange("observaciones", e.target.value)}
                rows={2}
                className={`${inputClass} resize-none`}
                placeholder="Cualquier detalle extra que nos ayude a cotizar mejor"
              />
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
