import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Eye, CheckCircle2, HelpCircle, MapPin, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { TrimmedThumbnail } from "./TrimmedThumbnail";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { fetchMaterialsAvailability } from "@/lib/api";

// ── Materiales ────────────────────────────────────────────────────────────────
// "No estoy seguro" se muestra al usuario pero se envía "PLA" al backend.
// Estos son los defaults antes de que llegue la respuesta del backend con
// has_stock real — todos arrancan como disponibles para no mostrar grisado
// equivocado durante el flash inicial.
const MATERIAL_OPTIONS_DEFAULT: MaterialOption[] = [
  { label: "PLA (Económico) - Recomendado", value: "PLA", hasStock: true },
  { label: "No estoy seguro (Asesorarme)", value: "ASESORAR", hasStock: true },
  { label: "ABS (Resistente)", value: "ABS", hasStock: true },
  { label: "PETG (Intermedio)", value: "PETG", hasStock: true },
  { label: "Nylon (Industrial)", value: "Nylon", hasStock: true },
  { label: "TPU (Flexible)", value: "TPU", hasStock: true },
  { label: "Policarbonato (Técnico)", value: "PC", hasStock: true },
];

interface MaterialOption {
  label: string;
  value: string;
  hasStock: boolean;
}

const NO_STOCK_MESSAGE =
  "Si necesitas imprimir con este filamento envíanos un correo a info@comparo3d.com.ar para que podamos ayudarte";

// ── Infill opciones ───────────────────────────────────────────────────────────
const INFILL_OPTIONS = ["5%", "10%", "20%", "25%", "30%", "40%", "50%", "60%", "70%", "80%", "90%", "100%"];
const INFILL_DEFAULT = "20%";

// ── Altura de capa opciones ───────────────────────────────────────────────────
const LAYER_OPTIONS = [
  { label: "0.1mm (Alta calidad)",     value: "0.1mm" },
  { label: "0.15mm (Detalle)",         value: "0.15mm" },
  { label: "0.2mm (Recomendado)",      value: "0.2mm" },
  { label: "0.3mm (Económico/Rápido)", value: "0.3mm" },
];
const LAYER_DEFAULT = "0.2mm";

/** Normaliza "0.15" / "0.15mm" / "0,15" a "0.15mm" para comparar contra el value del select. */
function normalizeLayerValue(v: string | null | undefined): string {
  if (!v) return "";
  const s = String(v).trim().toLowerCase().replace(",", ".").replace(/mm$/, "");
  const num = Number(s);
  if (!isFinite(num) || num <= 0) return "";
  // Formato compacto: 0.1, 0.15, 0.2, 0.3
  return `${num}mm`;
}

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
  /** Keys de campos faltantes — marcamos border rojo + ring rojo al focus. */
  missingFields?: string[];
  /** Altura de capa sugerida (sin sufijo mm, e.g. "0.15"). Si difiere del seleccionado, mostramos tooltip ambar. */
  suggestedLayerHeight?: string | null;
  onChange: (field: keyof FormState, value: string) => void;
  onRemoveFile: () => void;
  onReplacementFileSelect?: (file: File) => void;
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
  missingFields = [],
  suggestedLayerHeight = null,
  onChange,
  onRemoveFile,
  onBack,
  onContinue,
}: StepUserDataProps) {
  const suggestedLayerValue = normalizeLayerValue(suggestedLayerHeight);
  const layerDiffersFromSuggested =
    !!suggestedLayerValue && normalizeLayerValue(data.alturaCapa) !== suggestedLayerValue;
  // Helper: dado el key del campo, devolver className extra si esta en error.
  const errorClass = (field: string) =>
    missingFields.includes(field)
      ? "border-red-500 ring-2 ring-red-500/30 focus:ring-red-500/50 focus:border-red-500"
      : "";
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [colorCustom, setColorCustom] = useState("");
  const thumbnailSrc = thumbnailUrl || null;

  // ── Materiales con stock dinamico ────────────────────────────────────────
  const [materialOptions, setMaterialOptions] = useState<MaterialOption[]>(MATERIAL_OPTIONS_DEFAULT);
  const [materialPickerOpen, setMaterialPickerOpen] = useState(false);
  const [noStockDialogOpen, setNoStockDialogOpen] = useState(false);
  const [noStockMaterialLabel, setNoStockMaterialLabel] = useState("");
  // Dialog para el "?" al lado del badge Sin stock del material seleccionado
  const [selectedOutOfStockDialogOpen, setSelectedOutOfStockDialogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const items = await fetchMaterialsAvailability();
        if (cancelled || !items.length) return;
        // Mantengo el orden y los labels del default (el backend tiene los
        // mismos labels pero por las dudas uso los del frontend para no
        // depender de cambios de copy en el server).
        const byCode = new Map(items.map((i) => [i.code, i.has_stock]));
        setMaterialOptions((prev) =>
          prev.map((opt) => ({
            ...opt,
            hasStock: byCode.has(opt.value) ? !!byCode.get(opt.value) : opt.hasStock,
          })),
        );
      } catch {
        // Silencio: fallback permisivo. El usuario podra elegir cualquier
        // material y el backend ya tiene su propia validacion.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleMaterialClick = (opt: MaterialOption) => {
    if (!opt.hasStock) {
      setNoStockMaterialLabel(opt.label);
      setNoStockDialogOpen(true);
      return;
    }
    onChange("material", opt.value);
    setMaterialPickerOpen(false);
  };

  const currentMaterial = materialOptions.find((m) => m.value === (data.material || "PLA")) || materialOptions[0];
  // Si el material actualmente seleccionado (puede venir de sessionStorage de
  // una visita anterior) ya no tiene stock, mostramos un banner arriba del
  // campo. No bloqueamos seguir — solo avisamos.
  const selectedMaterialOutOfStock = !!currentMaterial && currentMaterial.hasStock === false;

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

  const handleReplacementFile = (file: File | undefined) => {
    if (!file || isLoading) return;
    onReplacementFileSelect(file);
  };

  return (
    <div>
      {/* Preview archivo */}
      {fileName && (
        <div className="mb-5 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="flex items-center gap-2 px-4 pt-3 pb-2">
            <Eye size={14} className="text-primary" />
            <p className="text-sm font-medium text-foreground">Vista previa del modelo</p>
            <button
              type="button"
              onClick={onRemoveFile}
              className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200"
              aria-label="Quitar archivo"
              title="Quitar archivo"
            >
              <Trash2 size={15} />
              <span className="sr-only">Quitar archivo</span>
            </button>
          </div>
          <div className="px-4 pb-4">
            <div className="flex justify-center">
              <div className="inline-flex max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-3">
                {thumbnailSrc ? (
                  <TrimmedThumbnail
                    src={thumbnailSrc}
                    alt="Vista previa del modelo 3D"
                    className="block max-h-[320px] w-auto max-w-full object-contain"
                  />
                ) : (
                  <div className="flex h-[220px] w-[280px] max-w-full items-center justify-center rounded-md bg-slate-50 px-6 text-center text-sm text-muted-foreground">
                    Generando vista previa real del STL...
                  </div>
                )}
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">{fileName}</p>
            </div>
          </div>
        </div>
      )}

      {!fileName && (
        <div
          className={`mb-5 rounded-2xl border-2 border-dashed px-4 py-5 transition-colors ${
            isLoading
              ? "cursor-wait opacity-80"
              : isDraggingFile
                ? "cursor-pointer border-primary bg-primary/5"
                : "cursor-pointer border-border bg-muted/20 hover:border-primary/50"
          }`}
          onClick={() => {
            if (!isLoading) replacementInputRef.current?.click();
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDraggingFile(true);
          }}
          onDragLeave={() => setIsDraggingFile(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDraggingFile(false);
            handleReplacementFile(event.dataTransfer.files[0]);
          }}
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Upload size={22} />
            </span>
            <p className="text-[15px] font-semibold text-foreground">
              Carga un nuevo STL
            </p>
            <p className="max-w-md text-[13px] leading-relaxed text-muted-foreground">
              Tus datos se mantienen. Solo se reemplaza el archivo para recalcular la cotizacion.
            </p>
          </div>
          <input
            ref={replacementInputRef}
            type="file"
            accept=".stl"
            disabled={isLoading}
            className="hidden"
            onChange={(event) => {
              handleReplacementFile(event.currentTarget.files?.[0]);
              event.currentTarget.value = "";
            }}
          />
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
            className={`${inputClass} ${errorClass("nombre")}`}
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
            className={`${inputClass} ${errorClass("email")}`}
            placeholder="tu@email.com"
          />
        </div>

        {/* Teléfono */}
        <div>
          <label className="mb-1.5 block text-[14px] font-semibold text-foreground">Teléfono *</label>
          <input
            type="tel"
            value={data.telefono}
            onChange={(e) => onChange("telefono", e.target.value)}
            className={`${inputClass} ${errorClass("telefono")}`}
            placeholder="+54 11 ..."
            required
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

        {/* Material — picker custom con grisado para items sin stock */}
        <div>
          <label className="mb-1.5 block text-[14px] font-semibold text-foreground">Material *</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMaterialPickerOpen((v) => !v)}
              className={`${selectClass} flex items-center justify-between text-left ${
                selectedMaterialOutOfStock ? "border-yellow-500 text-muted-foreground" : ""
              }`}
              aria-haspopup="listbox"
              aria-expanded={materialPickerOpen}
            >
              <span className="flex items-center gap-2">
                <span>{currentMaterial?.label || "PLA"}</span>
                {selectedMaterialOutOfStock && (
                  <>
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-medium text-yellow-800 border border-yellow-500">
                      Sin stock
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label="Por que esta sin stock?"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOutOfStockDialogOpen(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedOutOfStockDialogOpen(true);
                        }
                      }}
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white text-[12px] font-semibold leading-none hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                      <HelpCircle size={14} aria-hidden />
                    </span>
                  </>
                )}
              </span>
              <ChevronDown size={16} className={`text-muted-foreground transition-transform ${materialPickerOpen ? "rotate-180" : ""}`} />
            </button>

            {materialPickerOpen && (
              <>
                {/* Backdrop para cerrar al click fuera */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMaterialPickerOpen(false)}
                  aria-hidden
                />
                <ul
                  role="listbox"
                  className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-input bg-background shadow-lg"
                >
                  <TooltipProvider delayDuration={150}>
                    {materialOptions.map((opt) => {
                      const isSelected = (data.material || "PLA") === opt.value;
                      const greyed = !opt.hasStock;
                      const item = (
                        <li
                          key={opt.value}
                          role="option"
                          aria-selected={isSelected}
                          aria-disabled={greyed}
                          onClick={() => handleMaterialClick(opt)}
                          className={[
                            "flex cursor-pointer items-center justify-between gap-2 px-4 py-2.5 text-[15px] transition-colors",
                            greyed
                              ? "text-muted-foreground/60 hover:bg-muted/40"
                              : "text-foreground hover:bg-primary/5",
                            isSelected && !greyed ? "bg-primary/5 font-medium" : "",
                          ].join(" ")}
                        >
                          <span>{opt.label}</span>
                          {greyed && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                              Sin stock
                            </span>
                          )}
                        </li>
                      );
                      if (!greyed) return item;
                      // Para grisados envolvemos en Tooltip (hover desktop).
                      // El click sigue funcionando — abre el Dialog.
                      return (
                        <Tooltip key={opt.value}>
                          <TooltipTrigger asChild>{item}</TooltipTrigger>
                          <TooltipContent side="left" className="max-w-xs text-sm">
                            {NO_STOCK_MESSAGE}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </TooltipProvider>
                </ul>
              </>
            )}
          </div>
        </div>

        {/* Dialog disparado por el "?" al lado del badge Sin stock del material seleccionado */}
        <Dialog open={selectedOutOfStockDialogOpen} onOpenChange={setSelectedOutOfStockDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{currentMaterial?.label || "Material"} sin stock</DialogTitle>
              <DialogDescription className="pt-2 text-[15px] leading-relaxed">
                El filamento seleccionado actualmente no se encuentra en stock de ninguno de los proveedores.
                Alternativamente seleccionar otro filamento o puede enviarnos un e-mail{" "}
                <a
                  href="mailto:info@comparo3d.com.ar"
                  className="font-semibold underline underline-offset-2"
                >
                  info@comparo3d.com.ar
                </a>
                .
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedOutOfStockDialogOpen(false)}
              >
                Cerrar
              </Button>
              <Button type="button" asChild>
                <a href="mailto:info@comparo3d.com.ar">Enviar correo</a>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog cuando el usuario clickea un material sin stock */}
        <Dialog open={noStockDialogOpen} onOpenChange={setNoStockDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{noStockMaterialLabel} sin stock</DialogTitle>
              <DialogDescription className="pt-2 text-[15px] leading-relaxed">
                {NO_STOCK_MESSAGE}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNoStockDialogOpen(false)}
              >
                Cerrar
              </Button>
              <Button
                type="button"
                asChild
              >
                <a href="mailto:info@comparo3d.com.ar">Enviar correo</a>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
            className={`${inputClass} ${errorClass("cantidad")}`}
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
                {layerDiffersFromSuggested ? (
                  <div
                    role="note"
                    className="mt-1.5 flex items-start gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[12px] text-amber-900"
                  >
                    <span aria-hidden="true">ℹ</span>
                    <span>
                      La configuración predeterminada ({suggestedLayerValue}) es la sugerida para un mejor resultado.
                    </span>
                  </div>
                ) : (
                  <p className="mt-1.5 text-[12px] text-muted-foreground">
                    Menor altura = más detalle pero más tiempo
                  </p>
                )}
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
