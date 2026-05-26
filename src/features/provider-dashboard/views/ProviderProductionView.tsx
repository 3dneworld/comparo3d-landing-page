import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Cpu, LoaderCircle, Plus, X } from "lucide-react";

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
  fetchProviderAgenda,
  fetchProviderProduction,
  updateProviderProduction,
} from "@/features/provider-dashboard/api";
import {
  BED_STANDARDS,
  BED_STANDARDS_CONTACT_HINT,
  findBedSkuForDimensions,
  getBedStandard,
  isValidBedSku,
  normalizeBedSku,
} from "@/features/provider-dashboard/bedStandards";
import { DashboardField } from "@/features/provider-dashboard/components/DashboardField";
import { DashboardPageHeader } from "@/features/provider-dashboard/components/DashboardPageHeader";
import { DashboardStatePill } from "@/features/provider-dashboard/components/DashboardStatePill";
import {
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingState,
} from "@/features/provider-dashboard/components/DashboardStates";
import { PrinterCard } from "@/features/provider-dashboard/components/PrinterCard";
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

function safeString(value: unknown) {
  return value == null ? "" : String(value);
}

function resolveBedSku(printer: {
  bed_sku?: string | null;
  cama_x?: number | null;
  cama_y?: number | null;
}) {
  const raw = normalizeBedSku(printer.bed_sku ?? "");
  if (raw && isValidBedSku(raw)) return raw;
  return findBedSkuForDimensions(Number(printer.cama_x) || 0, Number(printer.cama_y) || 0) ?? "";
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

function printerToPayload(printer: DashboardPrinter): DashboardPrinterFormPayload {
  return {
    nombre_impresora: printer.nombre_impresora || `Impresora ${printer.id}`,
    bed_sku: resolveBedSku(printer) || DEFAULT_BED_SKU,
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

function printerToEditorState(printer?: DashboardPrinter | null): PrinterEditorState {
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
    bed_sku: resolveBedSku(printer) || DEFAULT_BED_SKU,
    cantidad_unidades: String(printer.cantidad_unidades || 1),
    activa: Boolean(printer.activa),
    es_principal: Boolean(printer.es_principal),
    materiales_permitidos_text: Array.isArray(printer.materiales_permitidos)
      ? printer.materiales_permitidos.join(", ")
      : "",
    marcas_text: getPrinterMarcas(printer).join(", "),
    notas: safeString(printer.notas),
  };
}

function editorToPayload(state: PrinterEditorState, fallbackName: string): DashboardPrinterFormPayload {
  const qty = Number(state.cantidad_unidades);
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error("Las unidades deben ser mayores a cero.");
  }
  if (!isValidBedSku(state.bed_sku)) {
    throw new Error(`Elegi una cama estandar. ${BED_STANDARDS_CONTACT_HINT}`);
  }
  return {
    nombre_impresora: state.nombre_impresora.trim() || fallbackName,
    bed_sku: normalizeBedSku(state.bed_sku),
    cantidad_unidades: Math.round(qty),
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

function formatBed(printer: DashboardPrinter) {
  const bed = getBedStandard(resolveBedSku(printer));
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
  next: boolean
): { impresoras: DashboardPrinterFormPayload[] } {
  return {
    impresoras: ensureOnePrimary(
      printers.map((printer) => ({
        ...printerToPayload(printer),
        activa: printer.id === printerId ? next : Boolean(printer.activa),
      }))
    ),
  };
}

function buildPayloadForEditor(
  printers: DashboardPrinter[],
  mode: EditorMode,
  state: PrinterEditorState
): { impresoras: DashboardPrinterFormPayload[] } {
  const edited = editorToPayload(state, `Impresora ${printers.length + 1}`);
  const base = printers.map(printerToPayload);
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

  const printers = useMemo(
    () => productionQuery.data?.printers ?? [],
    [productionQuery.data?.printers]
  );

  const activeCount = useMemo(
    () => printers.filter((printer) => Boolean(printer.activa)).length,
    [printers]
  );

  const planningPrinterId = agendaQuery.data?.printers.find((printer) => printer.is_planning_printer)?.id;
  const busyNow = agendaQuery.data?.printers.reduce((count, printer) => count + printer.jobs.filter((job) => job.start_day === 0).length, 0) ?? 0;

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
    updatePrintersMutation.mutate(buildPayloadForToggle(printers, printer.id, next));
  }

  function openEditor(mode: EditorMode) {
    setEditorMode(mode);
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
        eyebrow="Planning"
        title="Produccion"
        description={`Solo 1 impresora cuenta para planning. Tenes ${activeCount} dedicada${activeCount === 1 ? "" : "s"} ahora.`}
        metaPills={
          <>
            <DashboardStatePill tone={activeCount > 0 ? "success" : "danger"}>
              {activeCount} {activeCount === 1 ? "activa" : "activas"}
            </DashboardStatePill>
            <DashboardStatePill tone={busyNow > 0 ? "info" : "muted"}>
              {busyNow} ocupadas ahora
            </DashboardStatePill>
            <DashboardStatePill tone={agendaQuery.data?.proxima_disponibilidad_iso ? "info" : "muted"}>
              Proxima disp.: {formatDate(agendaQuery.data?.proxima_disponibilidad_iso) ?? "sin jobs"}
            </DashboardStatePill>
          </>
        }
        actions={
          <Button type="button" onClick={() => openEditor({ kind: "new" })}>
            <Plus className="h-4 w-4" />
            Agregar impresora
          </Button>
        }
      />

      {activeCount === 0 ? (
        <WarningInlineBanner tone="danger" icon={AlertTriangle}>
          Tenes 0 impresoras dedicadas - no apareces en cotizaciones de Comparo3D. Activa al menos 1 para volver a recibir pedidos.
        </WarningInlineBanner>
      ) : null}

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
          {printers.map((printer) => (
            <PrinterCard
              key={printer.id}
              data={{
                id: printer.id,
                name: printer.nombre_impresora || `Impresora ${printer.id}`,
                bed: formatBed(printer),
                tech: "FDM",
                is_planning_printer: printer.id === planningPrinterId,
                activa: Boolean(printer.activa),
                es_principal: Boolean(printer.es_principal),
                marcas: getPrinterMarcas(printer),
                cantidad_unidades: Number(printer.cantidad_unidades) || 1,
              }}
              disabled={updatePrintersMutation.isPending}
              onToggleActiva={(next) => requestToggle(printer, next)}
              onEdit={() => openEditor({ kind: "edit", id: printer.id })}
            />
          ))}
        </section>
      )}

      {confirmTurnOffId !== null ? (
        <ConfirmTurnOffModal
          isSaving={updatePrintersMutation.isPending}
          onCancel={() => setConfirmTurnOffId(null)}
          onConfirm={() => {
            updatePrintersMutation.mutate(buildPayloadForToggle(printers, confirmTurnOffId, false), {
              onSuccess: () => setConfirmTurnOffId(null),
            });
          }}
        />
      ) : null}

      {editorMode ? (
        <PrinterEditorDialog
          mode={editorMode}
          printers={printers}
          isSaving={updatePrintersMutation.isPending}
          onClose={() => setEditorMode(null)}
          onSave={(state) => {
            updatePrintersMutation.mutate(buildPayloadForEditor(printers, editorMode, state), {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4" onClick={onCancel}>
      <div
        className="w-full max-w-md rounded-[1.25rem] border border-rose-200 bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-rose-600">Confirmacion</p>
        <h2 className="mt-3 font-[Montserrat] text-xl font-extrabold leading-tight text-foreground">
          Si deshabilitas todas, dejas de aparecer en cotizaciones
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Confirmas que queres apagar tu ultima impresora dedicada?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
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
  isSaving,
  onClose,
  onSave,
}: {
  mode: EditorMode;
  printers: DashboardPrinter[];
  isSaving: boolean;
  onClose: () => void;
  onSave: (state: PrinterEditorState) => void;
}) {
  const current = mode.kind === "edit" ? printers.find((printer) => printer.id === mode.id) : null;
  const [state, setState] = useState(() => printerToEditorState(current));
  const marcas = splitList(state.marcas_text);

  function patchState(patch: Partial<PrinterEditorState>) {
    setState((value) => ({ ...value, ...patch }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-8" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[1.25rem] border border-border/70 bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
              {mode.kind === "new" ? "Nueva impresora" : "Editar impresora"}
            </p>
            <h2 className="mt-2 font-[Montserrat] text-xl font-extrabold tracking-tight text-foreground">
              Datos productivos
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-white text-muted-foreground hover:bg-muted"
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
            />
          </DashboardField>

          <DashboardField label="Unidades" htmlFor="printer-units">
            <Input
              id="printer-units"
              type="number"
              min="1"
              step="1"
              value={state.cantidad_unidades}
              onChange={(event) => patchState({ cantidad_unidades: event.target.value })}
            />
          </DashboardField>

          <DashboardField label="Tamano de cama" htmlFor="printer-bed" hint={BED_STANDARDS_CONTACT_HINT}>
            <Select
              value={isValidBedSku(state.bed_sku) ? state.bed_sku : ""}
              onValueChange={(value) => patchState({ bed_sku: value })}
            >
              <SelectTrigger id="printer-bed">
                <SelectValue placeholder="Elegir cama" />
              </SelectTrigger>
              <SelectContent>
                {BED_STANDARDS.map((entry) => (
                  <SelectItem key={entry.sku} value={entry.sku}>
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
            />
          </DashboardField>

          <DashboardField label="Marcas de filamento" htmlFor="printer-brands" className="md:col-span-2">
            <Input
              id="printer-brands"
              value={state.marcas_text}
              onChange={(event) => patchState({ marcas_text: event.target.value })}
              placeholder="Esun, Voxelpla"
            />
            <div className="mt-2 flex min-h-7 flex-wrap gap-2">
              {marcas.length ? (
                marcas.map((marca) => (
                  <span
                    key={marca}
                    className="rounded-full border border-border/70 bg-muted/50 px-2.5 py-1 text-[11px] font-bold text-foreground"
                  >
                    {marca}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">Sin marcas declaradas</span>
              )}
            </div>
          </DashboardField>

          <DashboardField label="Notas" htmlFor="printer-notes" className="md:col-span-2">
            <Textarea
              id="printer-notes"
              value={state.notas}
              onChange={(event) => patchState({ notas: event.target.value })}
              className="min-h-24"
            />
          </DashboardField>

          <label className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm font-semibold text-foreground">
            <input
              type="checkbox"
              checked={state.activa}
              onChange={(event) => patchState({ activa: event.target.checked })}
              className="h-4 w-4"
            />
            Activa
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm font-semibold text-foreground">
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
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
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
