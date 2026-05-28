import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Cpu, LoaderCircle, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import {
  fetchBedStandards,
  fetchProviderAgenda,
  fetchProviderProduction,
  updateProviderProduction,
} from "@/features/provider-dashboard/api";
import {
  BED_STANDARDS,
  BED_STANDARDS_CONTACT_HINT,
  type BedStandardEntry,
  findBedSkuForDimensions,
  getBedStandard,
  isValidBedSku,
  normalizeBedSku,
} from "@/features/provider-dashboard/bedStandards";
import { DashboardField } from "@/features/provider-dashboard/components/DashboardField";
import { DashboardPageHeader } from "@/features/provider-dashboard/components/DashboardPageHeader";
import {
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingState,
} from "@/features/provider-dashboard/components/DashboardStates";
import { PrinterCard, type PrinterCardStatus } from "@/features/provider-dashboard/components/PrinterCard";
import { WarningInlineBanner } from "@/features/provider-dashboard/components/WarningInlineBanner";
import { WeeklySchedule } from "@/features/provider-dashboard/components/WeeklySchedule";
import { useProviderDashboardSession } from "@/features/provider-dashboard/context/ProviderDashboardSessionContext";
import type {
  DashboardPrinter,
  DashboardPrinterFormPayload,
  ProviderProductionResponse,
} from "@/features/provider-dashboard/types";

type EditorMode = { kind: "new" } | { kind: "edit"; id: number };

interface PrinterEditorState {
  nombre_impresora: string;
  bed_sku: string;
  cantidad_unidades: string;
  activa: boolean;
  es_principal: boolean;
  materiales_permitidos_text: string;
  marcas_text: string;
  notas: string;
}

const DEFAULT_BED_SKU = "220x220";
const darkInputClass =
  "h-10 rounded-[9px] border-white/10 bg-white/[0.045] text-[var(--c3d-text-strong)] placeholder:text-[var(--c3d-text-faint)] focus-visible:ring-blue-500/40";
const darkTextareaClass =
  "min-h-24 rounded-[9px] border-white/10 bg-white/[0.045] text-[var(--c3d-text-strong)] placeholder:text-[var(--c3d-text-faint)] focus-visible:ring-blue-500/40";
const productionGuidance = [
  "Recomendamos que pongas como principal a la impresora con tamaño de cama más grande.",
  "La que pongas como principal es la que usaremos para tu slicing como proveedor.",
  "Realizamos un slicing por cama por proveedor (Impresora Principal).",
  "Los pedidos en curso bloquean días automáticamente.",
];

function safeString(value: unknown) {
  return value == null ? "" : String(value);
}

function resolveBedSku(printer: {
  bed_sku?: string | null;
  cama_x?: number | null;
  cama_y?: number | null;
}, bedStandards: BedStandardEntry[] = BED_STANDARDS) {
  const raw = normalizeBedSku(printer.bed_sku ?? "");
  if (raw && isValidBedSku(raw, bedStandards)) return raw;
  return findBedSkuForDimensions(Number(printer.cama_x) || 0, Number(printer.cama_y) || 0, bedStandards) ?? "";
}

function getPrinterMarcas(printer: DashboardPrinter): string[] {
  if (Array.isArray(printer.marcas)) return printer.marcas.filter(Boolean).map(String);
  if (!printer.marcas_json) return [];
  try {
    const parsed = JSON.parse(printer.marcas_json);
    return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
  } catch {
    return [];
  }
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeMaterials(value: string) {
  return splitList(value).map((item) => item.toUpperCase());
}

function printerToPayload(printer: DashboardPrinter, bedStandards: BedStandardEntry[] = BED_STANDARDS): DashboardPrinterFormPayload {
  return {
    nombre_impresora: printer.nombre_impresora || `Impresora ${printer.id}`,
    bed_sku: resolveBedSku(printer, bedStandards) || DEFAULT_BED_SKU,
    cantidad_unidades: Math.max(1, Math.round(Number(printer.cantidad_unidades) || 1)),
    activa: Boolean(printer.activa),
    es_principal: Boolean(printer.es_principal),
    materiales_permitidos: Array.isArray(printer.materiales_permitidos)
      ? printer.materiales_permitidos
      : [],
    marcas: getPrinterMarcas(printer),
    notas: safeString(printer.notas),
  };
}

function printerToEditorState(
  printer?: DashboardPrinter | null,
  bedStandards: BedStandardEntry[] = BED_STANDARDS
): PrinterEditorState {
  if (!printer) {
    return {
      nombre_impresora: "",
      bed_sku: DEFAULT_BED_SKU,
      cantidad_unidades: "1",
      activa: true,
      es_principal: false,
      materiales_permitidos_text: "",
      marcas_text: "",
      notas: "",
    };
  }
  return {
    nombre_impresora: safeString(printer.nombre_impresora),
    bed_sku: resolveBedSku(printer, bedStandards) || DEFAULT_BED_SKU,
    cantidad_unidades: "1",
    activa: Boolean(printer.activa),
    es_principal: Boolean(printer.es_principal),
    materiales_permitidos_text: Array.isArray(printer.materiales_permitidos)
      ? printer.materiales_permitidos.join(", ")
      : "",
    marcas_text: getPrinterMarcas(printer).join(", "),
    notas: safeString(printer.notas),
  };
}

function editorToPayload(
  state: PrinterEditorState,
  fallbackName: string,
  bedStandards: BedStandardEntry[] = BED_STANDARDS
): DashboardPrinterFormPayload {
  const qty = Number(state.cantidad_unidades);
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error("Las unidades deben ser mayores a cero.");
  }
  if (!isValidBedSku(state.bed_sku, bedStandards)) {
    throw new Error(`Elegi una cama estandar. ${BED_STANDARDS_CONTACT_HINT}`);
  }
  return {
    nombre_impresora: state.nombre_impresora.trim() || fallbackName,
    bed_sku: normalizeBedSku(state.bed_sku),
    cantidad_unidades: 1,
    activa: state.activa,
    es_principal: state.es_principal,
    materiales_permitidos: normalizeMaterials(state.materiales_permitidos_text),
    marcas: splitList(state.marcas_text),
    notas: state.notas,
  };
}

function ensureOnePrimary(items: DashboardPrinterFormPayload[]) {
  if (!items.length) return items;
  if (items.some((item) => item.es_principal)) return items;
  const firstActive = items.findIndex((item) => item.activa);
  const primaryIndex = firstActive >= 0 ? firstActive : 0;
  return items.map((item, index) => ({ ...item, es_principal: index === primaryIndex }));
}

function formatBed(printer: DashboardPrinter, bedStandards: BedStandardEntry[] = BED_STANDARDS) {
  const bed = getBedStandard(resolveBedSku(printer, bedStandards), bedStandards);
  if (bed) return bed.label;
  return `${Math.round(Number(printer.cama_x) || 0)} x ${Math.round(Number(printer.cama_y) || 0)} x ${Math.round(Number(printer.cama_z) || 0)} mm`;
}

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" }).format(date);
}

function buildPayloadForToggle(
  printers: DashboardPrinter[],
  printerId: number,
  next: boolean,
  bedStandards: BedStandardEntry[] = BED_STANDARDS
): { impresoras: DashboardPrinterFormPayload[] } {
  return {
    impresoras: ensureOnePrimary(
      printers.map((printer) => ({
        ...printerToPayload(printer, bedStandards),
        activa: printer.id === printerId ? next : Boolean(printer.activa),
      }))
    ),
  };
}

function buildPayloadForEditor(
  printers: DashboardPrinter[],
  mode: EditorMode,
  state: PrinterEditorState,
  bedStandards: BedStandardEntry[] = BED_STANDARDS
): { impresoras: DashboardPrinterFormPayload[] } {
  const edited = editorToPayload(state, `Impresora ${printers.length + 1}`, bedStandards);
  const base = printers.map((printer) => printerToPayload(printer, bedStandards));
  const next =
    mode.kind === "new"
      ? [...base, edited]
      : base.map((item, index) => (printers[index]?.id === mode.id ? edited : item));
  if (edited.es_principal) {
    const editedIndex = mode.kind === "new"
      ? next.length - 1
      : printers.findIndex((printer) => printer.id === mode.id);
    return {
      impresoras: next.map((item, index) => ({ ...item, es_principal: index === editedIndex })),
    };
  }
  return { impresoras: ensureOnePrimary(next) };
}

export function ProviderProductionView() {
  const { providerId } = useProviderDashboardSession();
  const queryClient = useQueryClient();
  const [confirmTurnOffId, setConfirmTurnOffId] = useState<number | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode | null>(null);

  const productionQuery = useQuery({
    queryKey: ["provider-dashboard", "production", providerId],
    queryFn: () => fetchProviderProduction(providerId!),
    enabled: providerId != null,
    staleTime: 30_000,
  });

  const agendaQuery = useQuery({
    queryKey: ["provider-dashboard", "agenda", providerId],
    queryFn: () => fetchProviderAgenda(providerId!, 14),
    enabled: providerId != null,
    staleTime: 30_000,
  });

  const bedStandardsQuery = useQuery({
    queryKey: ["bed-standards"],
    queryFn: fetchBedStandards,
    staleTime: 10 * 60_000,
  });

  const bedStandards = bedStandardsQuery.data?.items?.length ? bedStandardsQuery.data.items : BED_STANDARDS;

  const printers = useMemo(
    () => productionQuery.data?.printers ?? [],
    [productionQuery.data?.printers]
  );

  const activeCount = useMemo(
    () => printers.filter((printer) => Boolean(printer.activa)).length,
    [printers]
  );

  const displayPrinters = useMemo(
    () =>
      printers.flatMap((printer) => {
        const total = Math.max(1, Math.round(Number(printer.cantidad_unidades) || 1));
        return Array.from({ length: total }, (_, unitIndex) => ({ printer, unitIndex, total }));
      }),
    [printers]
  );

  const planningPrinterId = agendaQuery.data?.printers.find((printer) => printer.is_planning_printer)?.id;

  const updatePrintersMutation = useMutation({
    mutationFn: async (payload: { impresoras: DashboardPrinterFormPayload[] }) => {
      if (!providerId) throw new Error("No encontramos un proveedor valido.");
      return updateProviderProduction(providerId, payload);
    },
    onSuccess: (payload: ProviderProductionResponse) => {
      queryClient.setQueryData(["provider-dashboard", "production", providerId], payload);
      queryClient.setQueryData(["provider-dashboard", "profile", providerId], payload);
      void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "agenda", providerId] });
      void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "summary", providerId] });
      toast.success("Produccion guardada");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No pudimos guardar produccion.");
    },
  });

  function requestToggle(printer: DashboardPrinter, next: boolean) {
    if (!next && activeCount === 1 && Boolean(printer.activa)) {
      setConfirmTurnOffId(printer.id);
      return;
    }
    updatePrintersMutation.mutate(buildPayloadForToggle(printers, printer.id, next, bedStandards));
  }

  function openEditor(mode: EditorMode) {
    setEditorMode(mode);
  }

  function buildPrinterStatus(printerId: number): PrinterCardStatus {
    const agendaPrinter = agendaQuery.data?.printers.find((item) => Number(item.id) === Number(printerId));
    if (!agendaPrinter?.dedicated && !agendaPrinter?.is_planning_printer) {
      return { tone: "off", label: "No dedicada", detail: "Visible en perfil, no afecta planning" };
    }
    const currentJob = agendaPrinter.jobs.find(
      (job) => Number(job.start_day || 0) <= 0 && Number(job.duration_days || 0) > 0
    );
    if (currentJob) {
      return {
        tone: "busy",
        label: "Ocupada ahora",
        detail: `${currentJob.id} - ${currentJob.client || "Pedido activo"}`,
      };
    }
    return { tone: "idle", label: "Libre ahora", detail: "Sin jobs activos" };
  }

  if (productionQuery.error || agendaQuery.error) {
    return (
      <DashboardErrorState
        title="No pudimos cargar Produccion"
        description="La base del dashboard esta lista, pero no pudimos recuperar impresoras y agenda."
      />
    );
  }

  if (productionQuery.isLoading || agendaQuery.isLoading) {
    return (
      <DashboardLoadingState
        title="Armando la agenda productiva"
        description="Conectando impresoras dedicadas, pedidos activos y disponibilidad."
      />
    );
  }

  if (!productionQuery.data?.provider) {
    return (
      <DashboardEmptyState
        title="No encontramos datos productivos"
        description="La sesion esta activa, pero no recibimos un snapshot valido para esta vista."
        icon={<AlertTriangle className="h-6 w-6" />}
      />
    );
  }

  return (
    <div data-screen-label="Produccion" className="space-y-6">
      <DashboardPageHeader
        variant="dark"
        eyebrow="CAPACIDAD"
        title="Producción"
        actions={
          <Button type="button" onClick={() => openEditor({ kind: "new" })}>
            <Plus className="h-4 w-4" />
            Agregar impresora
          </Button>
        }
      />

      <section className="grid gap-2 rounded-[17px] border border-emerald-400/20 bg-emerald-500/[0.06] px-5 py-4 shadow-[var(--c3d-card-shadow)]">
        {productionGuidance.map((item) => (
          <div key={item} className="flex items-start gap-2.5 text-[13px] font-semibold leading-relaxed text-[var(--c3d-text-strong)]">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <span>{item}</span>
          </div>
        ))}
      </section>

      {activeCount === 0 ? (
        <WarningInlineBanner tone="danger" icon={AlertTriangle}>
          Tenes 0 impresoras dedicadas - no apareces en cotizaciones de Comparo3D. Activa al menos 1 para volver a recibir pedidos.
        </WarningInlineBanner>
      ) : null}

      <section
        className="rounded-[12px] border border-blue-500/20 bg-blue-500/[0.045] px-5 py-3.5 text-[12px] leading-relaxed text-[var(--c3d-text-muted)] shadow-[var(--c3d-card-shadow)]"
        aria-label="Regla de agenda"
      >
        <p>
          La agenda es la fuente de verdad: los pedidos aceptados bloquean días y no recibís nuevas cotizaciones para esas fechas.
        </p>
      </section>

      {agendaQuery.data ? (
        <WeeklySchedule
          todayIso={agendaQuery.data.today}
          days={agendaQuery.data.schedule_days}
          printers={agendaQuery.data.printers}
        />
      ) : null}

      {printers.length === 0 ? (
        <DashboardEmptyState
          title="Todavia no cargaste impresoras"
          description="Suma una impresora para definir capacidad productiva real."
          icon={<Cpu className="h-6 w-6" />}
          actionLabel="Agregar impresora"
          onAction={() => openEditor({ kind: "new" })}
        />
      ) : (
        <section className="grid gap-5 lg:grid-cols-2">
          {displayPrinters.map(({ printer, unitIndex, total }) => (
            <PrinterCard
              key={`${printer.id}-${unitIndex}`}
              data={{
                id: printer.id,
                name: `${printer.nombre_impresora || `Impresora ${printer.id}`}${total > 1 ? ` #${unitIndex + 1}` : ""}`,
                bed: formatBed(printer, bedStandards),
                tech: "FDM",
                is_planning_printer: printer.id === planningPrinterId,
                activa: Boolean(printer.activa),
                es_principal: Boolean(printer.es_principal),
                marcas: getPrinterMarcas(printer),
                materiales: Array.isArray(printer.materiales_permitidos)
                  ? printer.materiales_permitidos
                  : [],
                cantidad_unidades: 1,
                status: buildPrinterStatus(printer.id),
              }}
              disabled={updatePrintersMutation.isPending}
              onToggleActiva={(next) => requestToggle(printer, next)}
              onEdit={() => openEditor({ kind: "edit", id: printer.id })}
            />
          ))}
        </section>
      )}

      <section className="rounded-[17px] border border-dashed border-[var(--c3d-card-border-soft)] bg-[var(--c3d-card-bg)] px-5 py-8 text-center shadow-[var(--c3d-card-shadow)]">
        <div className="mx-auto flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-primary/10 text-primary">
          <Plus className="h-[18px] w-[18px]" />
        </div>
        <div className="mx-auto mt-3 max-w-sm">
          <h2 className="font-[Montserrat] text-[16px] font-extrabold tracking-[-0.005em] text-[var(--c3d-text-strong)]">
            Agrega mas impresoras
          </h2>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--c3d-text-muted)]">
            Cada equipo declarado puede prenderse y apagarse según tu disponibilidad real. Más impresoras dedicadas = más cotizaciones.
          </p>
        </div>
        <Button type="button" onClick={() => openEditor({ kind: "new" })} className="mt-4">
          <Plus className="h-4 w-4" />
          Agregar impresora
        </Button>
      </section>

      {confirmTurnOffId !== null ? (
        <ConfirmTurnOffModal
          isSaving={updatePrintersMutation.isPending}
          onCancel={() => setConfirmTurnOffId(null)}
          onConfirm={() => {
            updatePrintersMutation.mutate(buildPayloadForToggle(printers, confirmTurnOffId, false, bedStandards), {
              onSuccess: () => setConfirmTurnOffId(null),
            });
          }}
        />
      ) : null}

      {editorMode ? (
        <PrinterEditorDialog
          mode={editorMode}
          printers={printers}
          bedStandards={bedStandards}
          isSaving={updatePrintersMutation.isPending}
          onClose={() => setEditorMode(null)}
          onSave={(state) => {
            updatePrintersMutation.mutate(buildPayloadForEditor(printers, editorMode, state, bedStandards), {
              onSuccess: () => setEditorMode(null),
            });
          }}
        />
      ) : null}
    </div>
  );
}

function ConfirmTurnOffModal({
  isSaving,
  onCancel,
  onConfirm,
}: {
  isSaving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="w-full max-w-md rounded-[17px] border border-[var(--c3d-card-border)] bg-[var(--c3d-bg)] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-rose-400">Confirmacion</p>
        <h2 className="mt-3 font-[Montserrat] text-xl font-extrabold leading-tight text-[var(--c3d-text-strong)]">
          Si deshabilitas todas, dejas de aparecer en cotizaciones
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--c3d-text-muted)]">
          Confirmas que queres apagar tu ultima impresora dedicada?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving} className="border-white/10 bg-white/[0.04] text-[var(--c3d-text-strong)] hover:bg-white/[0.08]">
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isSaving}>
            {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            Mantener apagada
          </Button>
        </div>
      </div>
    </div>
  );
}

function PrinterEditorDialog({
  mode,
  printers,
  bedStandards,
  isSaving,
  onClose,
  onSave,
}: {
  mode: EditorMode;
  printers: DashboardPrinter[];
  bedStandards: BedStandardEntry[];
  isSaving: boolean;
  onClose: () => void;
  onSave: (state: PrinterEditorState) => void;
}) {
  const current = mode.kind === "edit" ? printers.find((printer) => printer.id === mode.id) : null;
  const [state, setState] = useState(() => printerToEditorState(current, bedStandards));
  function patchState(patch: Partial<PrinterEditorState>) {
    setState((value) => ({ ...value, ...patch }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-8 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[17px] border border-[var(--c3d-card-border)] bg-[var(--c3d-bg)] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
              {mode.kind === "new" ? "Nueva impresora" : "Editar impresora"}
            </p>
            <h2 className="mt-2 font-[Montserrat] text-xl font-extrabold tracking-tight text-[var(--c3d-text-strong)]">
              Datos productivos
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[var(--c3d-text-muted)] hover:bg-white/[0.08]"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <DashboardField label="Nombre" htmlFor="printer-name" className="md:col-span-2">
            <Input
              id="printer-name"
              value={state.nombre_impresora}
              onChange={(event) => patchState({ nombre_impresora: event.target.value })}
              className={darkInputClass}
            />
          </DashboardField>

          <DashboardField label="Tamano de cama" htmlFor="printer-bed" hint={BED_STANDARDS_CONTACT_HINT} className="md:col-span-2">
            <Select
              value={isValidBedSku(state.bed_sku, bedStandards) ? state.bed_sku : ""}
              onValueChange={(value) => patchState({ bed_sku: value })}
            >
              <SelectTrigger id="printer-bed" className={darkInputClass}>
                <SelectValue placeholder="Elegir cama" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#0d1117] text-[var(--c3d-text-strong)]">
                {bedStandards.map((entry) => (
                  <SelectItem key={entry.sku} value={entry.sku} className="focus:bg-white/[0.08] focus:text-[var(--c3d-text-strong)]">
                    {entry.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DashboardField>

          <DashboardField label="Materiales" htmlFor="printer-materials" className="md:col-span-2">
            <Input
              id="printer-materials"
              value={state.materiales_permitidos_text}
              onChange={(event) => patchState({ materiales_permitidos_text: event.target.value })}
              placeholder="PLA, PETG"
              className={darkInputClass}
            />
          </DashboardField>

          <DashboardField label="Notas" htmlFor="printer-notes" className="md:col-span-2">
            <Textarea
              id="printer-notes"
              value={state.notas}
              onChange={(event) => patchState({ notas: event.target.value })}
              className={darkTextareaClass}
            />
          </DashboardField>

          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-[var(--c3d-text-strong)]">
            <input
              type="checkbox"
              checked={state.activa}
              onChange={(event) => patchState({ activa: event.target.checked })}
              className="h-4 w-4"
            />
            Activa
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-[var(--c3d-text-strong)]">
            <input
              type="checkbox"
              checked={state.es_principal}
              onChange={(event) => patchState({ es_principal: event.target.checked })}
              className="h-4 w-4"
            />
            Principal
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving} className="border-white/10 bg-white/[0.04] text-[var(--c3d-text-strong)] hover:bg-white/[0.08]">
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => onSave(state)}
            disabled={isSaving}
          >
            {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}
