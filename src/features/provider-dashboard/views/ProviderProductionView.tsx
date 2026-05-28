import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Cpu, LoaderCircle, Plus, X } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  deleteProviderPrinter,
  fetchBedStandards,
  fetchProviderAgenda,
  fetchProviderProduction,
  reorderProviderPrinters,
  setProviderPrincipalPrinter,
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
import {
  PrinterCard,
  type PrinterCardData,
  type PrinterCardStatus,
} from "@/features/provider-dashboard/components/PrinterCard";
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
  notas: string;
}

const DEFAULT_BED_SKU = "220x220";
const darkInputClass =
  "h-10 rounded-[9px] border-white/10 bg-white/[0.045] text-[var(--c3d-text-strong)] placeholder:text-[var(--c3d-text-faint)] focus-visible:ring-blue-500/40";
const darkTextareaClass =
  "min-h-24 rounded-[9px] border-white/10 bg-white/[0.045] text-[var(--c3d-text-strong)] placeholder:text-[var(--c3d-text-faint)] focus-visible:ring-blue-500/40";
const productionGuidance = [
  "Una sola impresora es la principal a la vez — es la que usamos para tu slicing y cotizaciones.",
  "Arrastrá las cards para fijar la prioridad: cuando se libere la principal, el sistema usa la siguiente por orden.",
  "El switch principal se cambia automáticamente cuando un pedido ocupa la impresora actual.",
  "Los pedidos aceptados bloquean días en la agenda hasta que cargues las fotos de despacho.",
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

function printerToPayload(
  printer: DashboardPrinter,
  bedStandards: BedStandardEntry[] = BED_STANDARDS,
): DashboardPrinterFormPayload {
  return {
    nombre_impresora: printer.nombre_impresora || `Impresora ${printer.id}`,
    bed_sku: resolveBedSku(printer, bedStandards) || DEFAULT_BED_SKU,
    cantidad_unidades: Math.max(1, Math.round(Number(printer.cantidad_unidades) || 1)),
    activa: Boolean(printer.activa),
    es_principal: Boolean(printer.es_principal),
    priority_order: Number(printer.priority_order ?? 0),
    materiales_permitidos: Array.isArray(printer.materiales_permitidos)
      ? printer.materiales_permitidos
      : [],
    marcas: getPrinterMarcas(printer),
    notas: safeString(printer.notas),
  };
}

function printerToEditorState(
  printer?: DashboardPrinter | null,
  bedStandards: BedStandardEntry[] = BED_STANDARDS,
): PrinterEditorState {
  if (!printer) {
    return {
      nombre_impresora: "",
      bed_sku: DEFAULT_BED_SKU,
      notas: "",
    };
  }
  return {
    nombre_impresora: safeString(printer.nombre_impresora),
    bed_sku: resolveBedSku(printer, bedStandards) || DEFAULT_BED_SKU,
    notas: safeString(printer.notas),
  };
}

function editorToPayloadPatch(
  state: PrinterEditorState,
  fallbackName: string,
  bedStandards: BedStandardEntry[] = BED_STANDARDS,
): Pick<DashboardPrinterFormPayload, "nombre_impresora" | "bed_sku" | "notas"> {
  if (!isValidBedSku(state.bed_sku, bedStandards)) {
    throw new Error(`Elegi una cama estandar. ${BED_STANDARDS_CONTACT_HINT}`);
  }
  return {
    nombre_impresora: state.nombre_impresora.trim() || fallbackName,
    bed_sku: normalizeBedSku(state.bed_sku),
    notas: state.notas,
  };
}

function formatBed(printer: DashboardPrinter, bedStandards: BedStandardEntry[] = BED_STANDARDS) {
  const bed = getBedStandard(resolveBedSku(printer, bedStandards), bedStandards);
  if (bed) return `${bed.x}x${bed.y}x${bed.z}`;
  const x = Math.round(Number(printer.cama_x) || 0);
  const y = Math.round(Number(printer.cama_y) || 0);
  const z = Math.round(Number(printer.cama_z) || 0);
  return `${x}x${y}x${z}`;
}

function buildPayloadForToggleActiva(
  printers: DashboardPrinter[],
  printerId: number,
  nextActiva: boolean,
  bedStandards: BedStandardEntry[] = BED_STANDARDS,
): { impresoras: DashboardPrinterFormPayload[] } {
  return {
    impresoras: printers.map((printer) => ({
      ...printerToPayload(printer, bedStandards),
      activa: printer.id === printerId ? nextActiva : Boolean(printer.activa),
    })),
  };
}

function buildPayloadForEditor(
  printers: DashboardPrinter[],
  mode: EditorMode,
  state: PrinterEditorState,
  bedStandards: BedStandardEntry[] = BED_STANDARDS,
): { impresoras: DashboardPrinterFormPayload[] } {
  const patch = editorToPayloadPatch(state, `Impresora ${printers.length + 1}`, bedStandards);
  const base = printers.map((printer) => printerToPayload(printer, bedStandards));
  if (mode.kind === "new") {
    return {
      impresoras: [
        ...base,
        {
          ...patch,
          cantidad_unidades: 1,
          activa: true,
          es_principal: false,
          priority_order: base.length,
          materiales_permitidos: [],
          marcas: [],
        },
      ],
    };
  }
  return {
    impresoras: base.map((item, index) =>
      printers[index]?.id === mode.id ? { ...item, ...patch } : item,
    ),
  };
}

export function ProviderProductionView() {
  const { providerId } = useProviderDashboardSession();
  const queryClient = useQueryClient();
  const [confirmTurnOffId, setConfirmTurnOffId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
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
    [productionQuery.data?.printers],
  );

  const activeCount = useMemo(
    () => printers.filter((printer) => Boolean(printer.activa)).length,
    [printers],
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
      toast.success("Producción guardada");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No pudimos guardar producción.");
    },
  });

  const deletePrinterMutation = useMutation({
    mutationFn: async (printerId: number) => {
      if (!providerId) throw new Error("No encontramos un proveedor valido.");
      return deleteProviderPrinter(providerId, printerId);
    },
    onSuccess: (payload: ProviderProductionResponse) => {
      queryClient.setQueryData(["provider-dashboard", "production", providerId], payload);
      queryClient.setQueryData(["provider-dashboard", "profile", providerId], payload);
      void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "agenda", providerId] });
      void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "summary", providerId] });
      toast.success("Impresora eliminada");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No pudimos eliminar la impresora.");
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (order: number[]) => {
      if (!providerId) throw new Error("No encontramos un proveedor valido.");
      return reorderProviderPrinters(providerId, order);
    },
    onSuccess: (payload: ProviderProductionResponse) => {
      queryClient.setQueryData(["provider-dashboard", "production", providerId], payload);
      queryClient.setQueryData(["provider-dashboard", "profile", providerId], payload);
      void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "agenda", providerId] });
      void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "summary", providerId] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No pudimos reordenar.");
    },
  });

  const setPrincipalMutation = useMutation({
    mutationFn: async (printerId: number) => {
      if (!providerId) throw new Error("No encontramos un proveedor valido.");
      return setProviderPrincipalPrinter(providerId, printerId);
    },
    onSuccess: (payload: ProviderProductionResponse) => {
      queryClient.setQueryData(["provider-dashboard", "production", providerId], payload);
      queryClient.setQueryData(["provider-dashboard", "profile", providerId], payload);
      void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "agenda", providerId] });
      void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "summary", providerId] });
      toast.success("Principal actualizada");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No pudimos cambiar la principal.");
    },
  });

  const isMutating =
    updatePrintersMutation.isPending ||
    deletePrinterMutation.isPending ||
    reorderMutation.isPending ||
    setPrincipalMutation.isPending;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = printers.map((p) => p.id);
    const oldIndex = ids.indexOf(Number(active.id));
    const newIndex = ids.indexOf(Number(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = [...ids];
    const [removed] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, removed);
    reorderMutation.mutate(next);
  }

  function requestToggleActiva(printer: DashboardPrinter, next: boolean) {
    if (!next && activeCount === 1 && Boolean(printer.activa)) {
      setConfirmTurnOffId(printer.id);
      return;
    }
    updatePrintersMutation.mutate(
      buildPayloadForToggleActiva(printers, printer.id, next, bedStandards),
    );
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
      (job) => Number(job.start_day || 0) <= 0 && Number(job.duration_days || 0) > 0,
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
        title="No pudimos cargar Producción"
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
        description="La sesión está activa, pero no recibimos un snapshot válido para esta vista."
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
          Tenés 0 impresoras dedicadas — no aparecés en cotizaciones de Comparo3D. Activá al menos 1 para volver a recibir pedidos.
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
          title="Todavía no cargaste impresoras"
          description="Sumá una impresora para definir capacidad productiva real."
          icon={<Cpu className="h-6 w-6" />}
          actionLabel="Agregar impresora"
          onAction={() => openEditor({ kind: "new" })}
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={printers.map((p) => p.id)} strategy={rectSortingStrategy}>
            <section className="grid gap-5 lg:grid-cols-2">
              {printers.map((printer) => (
                <SortablePrinterCard
                  key={printer.id}
                  printer={printer}
                  bedStandards={bedStandards}
                  planningPrinterId={planningPrinterId}
                  buildStatus={buildPrinterStatus}
                  disabled={isMutating}
                  onToggleActiva={(next) => requestToggleActiva(printer, next)}
                  onTogglePrincipal={() => setPrincipalMutation.mutate(printer.id)}
                  onEdit={() => openEditor({ kind: "edit", id: printer.id })}
                  onDelete={() => setConfirmDeleteId(printer.id)}
                />
              ))}
            </section>
          </SortableContext>
        </DndContext>
      )}

      <section className="rounded-[17px] border border-dashed border-[var(--c3d-card-border-soft)] bg-[var(--c3d-card-bg)] px-5 py-8 text-center shadow-[var(--c3d-card-shadow)]">
        <div className="mx-auto flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-primary/10 text-primary">
          <Plus className="h-[18px] w-[18px]" />
        </div>
        <div className="mx-auto mt-3 max-w-sm">
          <h2 className="font-[Montserrat] text-[16px] font-extrabold tracking-[-0.005em] text-[var(--c3d-text-strong)]">
            Agregá más impresoras
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
            updatePrintersMutation.mutate(
              buildPayloadForToggleActiva(printers, confirmTurnOffId, false, bedStandards),
              { onSuccess: () => setConfirmTurnOffId(null) },
            );
          }}
        />
      ) : null}

      {confirmDeleteId !== null ? (
        <ConfirmDeleteModal
          printerName={
            printers.find((p) => p.id === confirmDeleteId)?.nombre_impresora ||
            `Impresora ${confirmDeleteId}`
          }
          isSaving={deletePrinterMutation.isPending}
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => {
            deletePrinterMutation.mutate(confirmDeleteId, {
              onSuccess: () => setConfirmDeleteId(null),
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
            updatePrintersMutation.mutate(
              buildPayloadForEditor(printers, editorMode, state, bedStandards),
              { onSuccess: () => setEditorMode(null) },
            );
          }}
        />
      ) : null}
    </div>
  );
}

function SortablePrinterCard(props: {
  printer: DashboardPrinter;
  bedStandards: BedStandardEntry[];
  planningPrinterId: number | undefined;
  buildStatus: (id: number) => PrinterCardStatus;
  disabled: boolean;
  onToggleActiva: (next: boolean) => void;
  onTogglePrincipal: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { printer, bedStandards, planningPrinterId, buildStatus, disabled } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: printer.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const data: PrinterCardData = {
    id: printer.id,
    name: printer.nombre_impresora || `Impresora ${printer.id}`,
    bed: formatBed(printer, bedStandards),
    is_planning_printer: printer.id === planningPrinterId,
    activa: Boolean(printer.activa),
    es_principal: Boolean(printer.es_principal),
    cantidad_unidades: Math.max(1, Math.round(Number(printer.cantidad_unidades) || 1)),
    priority_order: Number(printer.priority_order ?? 0),
    status: buildStatus(printer.id),
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <PrinterCard
        data={data}
        disabled={disabled}
        onToggleActiva={props.onToggleActiva}
        onTogglePrincipal={props.onTogglePrincipal}
        onEdit={props.onEdit}
        onDelete={props.onDelete}
        dragHandleProps={listeners as Record<string, unknown>}
      />
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
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-rose-400">Confirmación</p>
        <h2 className="mt-3 font-[Montserrat] text-xl font-extrabold leading-tight text-[var(--c3d-text-strong)]">
          Si deshabilitas todas, dejás de aparecer en cotizaciones
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--c3d-text-muted)]">
          Confirmás que querés apagar tu última impresora dedicada?
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

function ConfirmDeleteModal({
  printerName,
  isSaving,
  onCancel,
  onConfirm,
}: {
  printerName: string;
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
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-rose-400">Eliminar impresora</p>
        <h2 className="mt-3 font-[Montserrat] text-xl font-extrabold leading-tight text-[var(--c3d-text-strong)]">
          Confirmás eliminar {printerName}?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--c3d-text-muted)]">
          Esta acción no se puede deshacer. Si la impresora tiene pedidos activos, primero
          tenés que completarlos o cancelarlos.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving} className="border-white/10 bg-white/[0.04] text-[var(--c3d-text-strong)] hover:bg-white/[0.08]">
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isSaving}>
            {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            Eliminar
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

          <DashboardField label="Tamaño de cama" htmlFor="printer-bed" hint={BED_STANDARDS_CONTACT_HINT} className="md:col-span-2">
            <Select
              value={isValidBedSku(state.bed_sku, bedStandards) ? state.bed_sku : ""}
              onValueChange={(value) => patchState({ bed_sku: value })}
            >
              <SelectTrigger id="printer-bed" className={darkInputClass}>
                <SelectValue placeholder="Elegir cama" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#0d1117]">
                {bedStandards.map((entry) => (
                  <SelectItem key={entry.sku} value={entry.sku} className="text-[hsl(210,20%,85%)] focus:bg-white/[0.10] focus:text-white">
                    {entry.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DashboardField>

          <DashboardField label="Notas" htmlFor="printer-notes" className="md:col-span-2">
            <Textarea
              id="printer-notes"
              value={state.notas}
              onChange={(event) => patchState({ notas: event.target.value })}
              className={darkTextareaClass}
            />
          </DashboardField>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving} className="border-white/10 bg-white/[0.04] text-[var(--c3d-text-strong)] hover:bg-white/[0.08]">
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => {
              try {
                onSave(state);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Datos inválidos");
              }
            }}
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
