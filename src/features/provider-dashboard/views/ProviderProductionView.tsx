import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Gauge,
  Layers3,
  LoaderCircle,
  Plus,
  Printer,
  Save,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import {
  fetchProviderProduction,
  updateProviderProduction,
} from "@/features/provider-dashboard/api";
import { DashboardField } from "@/features/provider-dashboard/components/DashboardField";
import { DashboardPageHeader } from "@/features/provider-dashboard/components/DashboardPageHeader";
import { DashboardPanel } from "@/features/provider-dashboard/components/DashboardPanel";
import { DashboardStatePill } from "@/features/provider-dashboard/components/DashboardStatePill";
import {
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingState,
} from "@/features/provider-dashboard/components/DashboardStates";
import { useProviderDashboardSession } from "@/features/provider-dashboard/context/ProviderDashboardSessionContext";
import type {
  DashboardPrinterFormPayload,
  ProviderProductionResponse,
} from "@/features/provider-dashboard/types";
import { cn } from "@/lib/utils";

type PrinterFormState = {
  nombre_impresora: string;
  cama_x: string;
  cama_y: string;
  cama_z: string;
  cantidad_unidades: string;
  activa: boolean;
  es_principal: boolean;
  materiales_permitidos_text: string;
  notas: string;
};

type SaveFeedback = {
  tone: "success" | "danger";
  title: string;
  description: string;
};

const reasonCopy: Record<string, string> = {
  SIN_IMPRESORAS_ACTIVAS: "Activar al menos una impresora",
  SIN_MATERIALES_ACTIVOS: "Completar materiales activos",
  STOCK_MATERIALES_DESCONOCIDO: "Completar estado de stock",
};

function safeString(value: unknown) {
  return value == null ? "" : String(value);
}

function formatNumberInput(value: unknown) {
  return value == null || value === "" ? "" : String(value);
}

function defaultPrinter(index: number): PrinterFormState {
  return {
    nombre_impresora: `Impresora ${index + 1}`,
    cama_x: "220",
    cama_y: "220",
    cama_z: "250",
    cantidad_unidades: "1",
    activa: true,
    es_principal: index === 0,
    materiales_permitidos_text: "",
    notas: "",
  };
}

function printersToFormState(payload: ProviderProductionResponse): PrinterFormState[] {
  return (payload.printers || []).map((printer, index) => ({
    nombre_impresora: safeString(printer.nombre_impresora || `Impresora ${index + 1}`),
    cama_x: formatNumberInput(printer.cama_x),
    cama_y: formatNumberInput(printer.cama_y),
    cama_z: formatNumberInput(printer.cama_z),
    cantidad_unidades: formatNumberInput(printer.cantidad_unidades || 1),
    activa: Boolean(printer.activa),
    es_principal: Boolean(printer.es_principal) || index === 0,
    materiales_permitidos_text: Array.isArray(printer.materiales_permitidos)
      ? printer.materiales_permitidos.join(", ")
      : "",
    notas: safeString(printer.notas),
  }));
}

function parsePositiveNumber(value: string, label: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${label} debe ser mayor a cero.`);
  }
  return parsed;
}

function buildPrintersPayload(formState: PrinterFormState[]): { impresoras: DashboardPrinterFormPayload[] } {
  if (!formState.length) {
    throw new Error("Agrega al menos una impresora antes de guardar.");
  }

  const firstActiveIndex = formState.findIndex((printer) => printer.activa);
  if (firstActiveIndex === -1) {
    throw new Error("Activa al menos una impresora para que el proveedor tenga capacidad productiva.");
  }

  const selectedPrimaryIndex = formState.findIndex((printer) => printer.es_principal);
  const primaryIndex = selectedPrimaryIndex >= 0 ? selectedPrimaryIndex : firstActiveIndex;

  return {
    impresoras: formState.map((printer, index) => ({
      nombre_impresora: printer.nombre_impresora.trim() || `Impresora ${index + 1}`,
      cama_x: parsePositiveNumber(printer.cama_x, `Cama X de ${printer.nombre_impresora || `impresora ${index + 1}`}`),
      cama_y: parsePositiveNumber(printer.cama_y, `Cama Y de ${printer.nombre_impresora || `impresora ${index + 1}`}`),
      cama_z: parsePositiveNumber(printer.cama_z, `Cama Z de ${printer.nombre_impresora || `impresora ${index + 1}`}`),
      cantidad_unidades: Math.round(
        parsePositiveNumber(printer.cantidad_unidades, `Unidades de ${printer.nombre_impresora || `impresora ${index + 1}`}`)
      ),
      activa: printer.activa,
      es_principal: index === primaryIndex,
      materiales_permitidos: printer.materiales_permitidos_text
        .split(",")
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean),
      notas: printer.notas,
    })),
  };
}

function formatDateTime(value?: string | null) {
  if (!value) return "Sin registro";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin registro";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatBed(printer?: PrinterFormState | null) {
  if (!printer) return "Sin cama principal";
  return `${printer.cama_x || "?"} x ${printer.cama_y || "?"} x ${printer.cama_z || "?"} mm`;
}

function humanizeReason(reason: string) {
  return reasonCopy[reason] ?? reason.replaceAll("_", " ").toLowerCase();
}

function FeedbackBanner({ feedback }: { feedback: SaveFeedback }) {
  return (
    <div
      className={cn(
        "rounded-[1.15rem] border px-4 py-3",
        feedback.tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-rose-200 bg-rose-50 text-rose-800"
      )}
    >
      <p className="text-sm font-semibold">{feedback.title}</p>
      <p className="mt-1 text-sm leading-relaxed">{feedback.description}</p>
    </div>
  );
}

function SnapshotCard({
  title,
  value,
  support,
  icon,
}: {
  title: string;
  value: string;
  support: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
          <p className="font-[Montserrat] text-xl font-bold tracking-tight text-foreground">{value}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{support}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ProductionContent({
  data,
  formState,
  initialFormState,
  onFieldChange,
  onToggle,
  onSetPrimary,
  onAddPrinter,
  onRemovePrinter,
  onSave,
  isSaving,
  saveFeedback,
}: {
  data: ProviderProductionResponse;
  formState: PrinterFormState[];
  initialFormState: PrinterFormState[];
  onFieldChange: (index: number, field: keyof PrinterFormState, value: string) => void;
  onToggle: (index: number, field: "activa") => void;
  onSetPrimary: (index: number) => void;
  onAddPrinter: () => void;
  onRemovePrinter: (index: number) => void;
  onSave: () => void;
  isSaving: boolean;
  saveFeedback: SaveFeedback | null;
}) {
  const provider = data.provider;
  const isDirty = JSON.stringify(formState) !== JSON.stringify(initialFormState);
  const activePrinters = formState.filter((printer) => printer.activa);
  const totalUnits = activePrinters.reduce((sum, printer) => sum + (Number(printer.cantidad_unidades) || 0), 0);
  const primaryPrinter = formState.find((printer) => printer.es_principal) || activePrinters[0] || formState[0];
  const supportedMaterials = Array.from(
    new Set(
      formState.flatMap((printer) =>
        printer.materiales_permitidos_text
          .split(",")
          .map((item) => item.trim().toUpperCase())
          .filter(Boolean)
      )
    )
  );
  const nextSteps = [
    !activePrinters.length ? "Activar al menos una impresora para que el proveedor pueda recibir nuevas cotizaciones." : null,
    !supportedMaterials.length ? "Declarar materiales permitidos por impresora si queres limitar tecnologias compatibles." : null,
    primaryPrinter && !primaryPrinter.es_principal ? "Elegir una impresora principal para mantener coherencia con el legacy." : null,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Vista editable"
        title="Produccion e impresoras"
        description="Capacidad productiva real del proveedor: impresoras activas, camas disponibles, unidades operativas y materiales permitidos por equipo."
        meta={
          <>
            <DashboardStatePill tone={activePrinters.length ? "success" : "warning"}>
              {activePrinters.length} impresoras activas
            </DashboardStatePill>
            <DashboardStatePill tone={totalUnits ? "info" : "warning"}>{totalUnits || 0} unidades</DashboardStatePill>
            <DashboardStatePill tone={data.readiness.quote_ready ? "success" : "warning"}>
              {data.readiness.quote_ready ? "Listo para cotizar" : "Cotizacion pendiente"}
            </DashboardStatePill>
            {isDirty ? <DashboardStatePill tone="info">Cambios sin guardar</DashboardStatePill> : null}
          </>
        }
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl border-border/80 bg-white/90 px-4 text-foreground hover:bg-muted"
              onClick={onAddPrinter}
              disabled={isSaving}
            >
              <Plus className="h-4 w-4" />
              Agregar impresora
            </Button>
            <Button
              type="button"
              className="h-11 rounded-xl bg-gradient-primary px-5 text-primary-foreground shadow-cta hover:opacity-95"
              onClick={onSave}
              disabled={!isDirty || isSaving || !formState.length}
            >
              {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar produccion
            </Button>
          </>
        }
      />

      {saveFeedback ? <FeedbackBanner feedback={saveFeedback} /> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SnapshotCard
          title="Parque activo"
          value={`${activePrinters.length}/${formState.length}`}
          support="Impresoras habilitadas dentro de la ficha productiva."
          icon={<Printer className="h-5 w-5" />}
        />
        <SnapshotCard
          title="Unidades operativas"
          value={String(totalUnits || 0)}
          support="Suma de equipos activos disponibles para produccion."
          icon={<Gauge className="h-5 w-5" />}
        />
        <SnapshotCard
          title="Cama principal"
          value={formatBed(primaryPrinter)}
          support={primaryPrinter?.nombre_impresora || "Sin impresora principal definida"}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <SnapshotCard
          title="Tecnologias declaradas"
          value={supportedMaterials.length ? supportedMaterials.slice(0, 3).join(", ") : "Sin limite"}
          support={supportedMaterials.length > 3 ? `+${supportedMaterials.length - 3} adicionales` : "Tomado de materiales permitidos por impresora."}
          icon={<Layers3 className="h-5 w-5" />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <DashboardPanel
            title="Impresoras disponibles"
            description="Edita camas, unidades activas y restricciones por equipo. El guardado reemplaza la lista completa en el backend real."
          >
            {formState.length ? (
              <div className="space-y-4">
                {formState.map((printer, index) => (
                  <article key={`${printer.nombre_impresora}-${index}`} className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5 shadow-card">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-[Montserrat] text-lg font-bold tracking-tight text-foreground">
                            {printer.nombre_impresora || `Impresora ${index + 1}`}
                          </p>
                          <DashboardStatePill tone={printer.activa ? "success" : "muted"}>
                            {printer.activa ? "Activa" : "Pausada"}
                          </DashboardStatePill>
                          {printer.es_principal ? <DashboardStatePill tone="info">Principal</DashboardStatePill> : null}
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {formatBed(printer)} | {printer.cantidad_unidades || "0"} unidad(es)
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 rounded-xl border-border/80 bg-white/90 px-4 text-foreground hover:bg-muted"
                          onClick={() => onToggle(index, "activa")}
                          disabled={isSaving}
                        >
                          {printer.activa ? "Pausar" : "Activar"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 rounded-xl border-border/80 bg-white/90 px-4 text-foreground hover:bg-muted"
                          onClick={() => onSetPrimary(index)}
                          disabled={isSaving}
                        >
                          Marcar principal
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 rounded-xl border-rose-200 bg-white/90 px-4 text-rose-700 hover:bg-rose-50"
                          onClick={() => onRemovePrinter(index)}
                          disabled={isSaving}
                        >
                          <Trash2 className="h-4 w-4" />
                          Quitar
                        </Button>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                      <DashboardField label="Nombre" htmlFor={`printer-${index}-name`} className="xl:col-span-2">
                        <Input
                          id={`printer-${index}-name`}
                          value={printer.nombre_impresora}
                          onChange={(event) => onFieldChange(index, "nombre_impresora", event.target.value)}
                          className="h-11 rounded-xl border-border/80 bg-white"
                        />
                      </DashboardField>
                      <DashboardField label="Unidades" htmlFor={`printer-${index}-units`}>
                        <Input
                          id={`printer-${index}-units`}
                          type="number"
                          min="1"
                          step="1"
                          value={printer.cantidad_unidades}
                          onChange={(event) => onFieldChange(index, "cantidad_unidades", event.target.value)}
                          className="h-11 rounded-xl border-border/80 bg-white"
                        />
                      </DashboardField>
                      <DashboardField label="Materiales" htmlFor={`printer-${index}-materials`} hint="Separados por coma. Ejemplo: PLA, PETG.">
                        <Input
                          id={`printer-${index}-materials`}
                          value={printer.materiales_permitidos_text}
                          onChange={(event) => onFieldChange(index, "materiales_permitidos_text", event.target.value)}
                          className="h-11 rounded-xl border-border/80 bg-white"
                        />
                      </DashboardField>
                      <DashboardField label="Cama X" htmlFor={`printer-${index}-x`}>
                        <Input
                          id={`printer-${index}-x`}
                          type="number"
                          min="1"
                          step="1"
                          value={printer.cama_x}
                          onChange={(event) => onFieldChange(index, "cama_x", event.target.value)}
                          className="h-11 rounded-xl border-border/80 bg-white"
                        />
                      </DashboardField>
                      <DashboardField label="Cama Y" htmlFor={`printer-${index}-y`}>
                        <Input
                          id={`printer-${index}-y`}
                          type="number"
                          min="1"
                          step="1"
                          value={printer.cama_y}
                          onChange={(event) => onFieldChange(index, "cama_y", event.target.value)}
                          className="h-11 rounded-xl border-border/80 bg-white"
                        />
                      </DashboardField>
                      <DashboardField label="Cama Z" htmlFor={`printer-${index}-z`}>
                        <Input
                          id={`printer-${index}-z`}
                          type="number"
                          min="1"
                          step="1"
                          value={printer.cama_z}
                          onChange={(event) => onFieldChange(index, "cama_z", event.target.value)}
                          className="h-11 rounded-xl border-border/80 bg-white"
                        />
                      </DashboardField>
                      <DashboardField label="Notas" htmlFor={`printer-${index}-notes`} className="md:col-span-2 xl:col-span-4">
                        <Textarea
                          id={`printer-${index}-notes`}
                          value={printer.notas}
                          onChange={(event) => onFieldChange(index, "notas", event.target.value)}
                          className="min-h-[96px] rounded-2xl border-border/80 bg-white"
                        />
                      </DashboardField>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <DashboardEmptyState
                title="Todavia no hay impresoras"
                description="Agrega la primera impresora para definir capacidad productiva real del proveedor."
                icon={<Printer className="h-6 w-6" />}
                actionLabel="Agregar impresora"
                onAction={onAddPrinter}
              />
            )}
          </DashboardPanel>
        </div>

        <div className="space-y-6">
          <DashboardPanel title="Diagnostico productivo" description="Lectura simple de capacidad y estado operativo.">
            <div className="space-y-4">
              <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
                <p className="text-sm font-semibold text-foreground">Ultima actualizacion de capacidad</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {formatDateTime(provider.last_capacity_update_at)}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
                <p className="text-sm font-semibold text-foreground">Estado para cotizar</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {data.readiness.quote_ready
                    ? "La base productiva acompana el estado de cotizacion."
                    : "Todavia hay pendientes antes de entrar con normalidad a nuevas cotizaciones."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <DashboardStatePill tone={data.readiness.quote_ready ? "success" : "warning"}>
                    {data.readiness.quote_ready ? "Quote ready" : "Pendiente"}
                  </DashboardStatePill>
                  <DashboardStatePill tone={data.effective_permissions.included_in_new_quotes ? "success" : "muted"}>
                    {data.effective_permissions.included_in_new_quotes ? "Incluido en nuevas cotizaciones" : "No incluido aun"}
                  </DashboardStatePill>
                </div>
              </div>
            </div>
          </DashboardPanel>

          <DashboardPanel
            title="Proximos pasos"
            description="Lo que conviene cerrar antes de migrar Materiales."
            headerAction={
              <Button
                asChild
                variant="outline"
                className="h-10 rounded-xl border-border/80 bg-white/90 px-4 text-foreground hover:bg-muted"
              >
                <a href="/proveedores-v2/logistica" rel="noreferrer">
                  Ir a Logistica
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </Button>
            }
          >
            {nextSteps.length ? (
              <div className="space-y-3">
                {nextSteps.map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.15rem] border border-border/70 bg-background/70 px-4 py-3 text-sm leading-relaxed text-muted-foreground"
                  >
                    {item}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.15rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                La capacidad productiva se ve coherente. El siguiente paso natural es Materiales.
              </div>
            )}
          </DashboardPanel>

          <DashboardPanel title="Bloqueos visibles" description="Tomados del backend para no perder prioridad operativa.">
            {data.readiness.blocking_reasons.length ? (
              <div className="space-y-3">
                {data.readiness.blocking_reasons.slice(0, 6).map((reason, index) => (
                  <div
                    key={reason}
                    className="flex items-start gap-3 rounded-[1.15rem] border border-border/70 bg-background/70 px-4 py-3"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">{humanizeReason(reason)}</p>
                      <p className="text-xs text-muted-foreground">{reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.15rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                No vemos bloqueos criticos de produccion en este snapshot.
              </div>
            )}
          </DashboardPanel>
        </div>
      </section>
    </div>
  );
}

export function ProviderProductionView() {
  const queryClient = useQueryClient();
  const { providerId } = useProviderDashboardSession();
  const [formState, setFormState] = useState<PrinterFormState[]>([]);
  const [initialFormState, setInitialFormState] = useState<PrinterFormState[]>([]);
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedback | null>(null);

  const productionQuery = useQuery({
    queryKey: ["provider-dashboard", "production", providerId],
    queryFn: () => fetchProviderProduction(providerId!),
    enabled: providerId != null,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!productionQuery.data) return;
    if (JSON.stringify(formState) !== JSON.stringify(initialFormState)) return;
    const nextState = printersToFormState(productionQuery.data);
    setFormState(nextState);
    setInitialFormState(nextState);
  }, [formState, initialFormState, productionQuery.data]);

  const applySnapshot = (payload: ProviderProductionResponse) => {
    queryClient.setQueryData(["provider-dashboard", "production", providerId], payload);
    queryClient.setQueryData(["provider-dashboard", "profile", providerId], payload);
    void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "summary", providerId] });
    const nextState = printersToFormState(payload);
    setFormState(nextState);
    setInitialFormState(nextState);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!providerId) throw new Error("No encontramos un proveedor valido para guardar.");
      return updateProviderProduction(providerId, buildPrintersPayload(formState));
    },
    onSuccess: (payload) => {
      applySnapshot(payload);
      setSaveFeedback({
        tone: "success",
        title: "Produccion guardada",
        description: "Las impresoras ya quedaron persistidas en el backend real del dashboard.",
      });
      toast.success("Produccion guardada");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "No pudimos guardar la produccion.";
      setSaveFeedback({
        tone: "danger",
        title: "No pudimos guardar",
        description: message,
      });
      toast.error(message);
    },
  });

  const data = useMemo(() => productionQuery.data, [productionQuery.data]);

  if (productionQuery.error) {
    return (
      <DashboardErrorState
        title="No pudimos cargar Produccion"
        description="La base del dashboard esta lista, pero la lectura real de impresoras no se pudo recuperar."
      />
    );
  }

  if (productionQuery.isLoading || (productionQuery.isFetching && !data)) {
    return (
      <DashboardLoadingState
        title="Armando la capacidad productiva"
        description="Estamos conectando impresoras y camas con el snapshot real del dashboard."
      />
    );
  }

  if (!data?.provider) {
    return (
      <DashboardEmptyState
        title="No encontramos datos productivos"
        description="La sesion esta activa, pero no recibimos un snapshot valido para esta vista."
        icon={<AlertTriangle className="h-6 w-6" />}
      />
    );
  }

  return (
    <ProductionContent
      data={data}
      formState={formState}
      initialFormState={initialFormState}
      onFieldChange={(index, field, value) => {
        setSaveFeedback(null);
        setFormState((current) =>
          current.map((printer, currentIndex) =>
            currentIndex === index ? { ...printer, [field]: value } : printer
          )
        );
      }}
      onToggle={(index, field) => {
        setSaveFeedback(null);
        setFormState((current) =>
          current.map((printer, currentIndex) =>
            currentIndex === index ? { ...printer, [field]: !printer[field] } : printer
          )
        );
      }}
      onSetPrimary={(index) => {
        setSaveFeedback(null);
        setFormState((current) =>
          current.map((printer, currentIndex) => ({ ...printer, es_principal: currentIndex === index }))
        );
      }}
      onAddPrinter={() => {
        setSaveFeedback(null);
        setFormState((current) => [...current, defaultPrinter(current.length)]);
      }}
      onRemovePrinter={(index) => {
        setSaveFeedback(null);
        setFormState((current) => {
          const next = current.filter((_, currentIndex) => currentIndex !== index);
          if (next.length && !next.some((printer) => printer.es_principal)) {
            return next.map((printer, currentIndex) => ({ ...printer, es_principal: currentIndex === 0 }));
          }
          return next;
        });
      }}
      onSave={() => {
        setSaveFeedback(null);
        void saveMutation.mutateAsync();
      }}
      isSaving={saveMutation.isPending}
      saveFeedback={saveFeedback}
    />
  );
}
