import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  FileArchive,
  LoaderCircle,
  Mail,
  MapPinned,
  PackageOpen,
  Phone,
  Printer,
  RefreshCcw,
  Search,
  Truck,
  Upload,
  WalletCards,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import {
  dispatchProviderOrder,
  fetchProviderOrderDetail,
  fetchProviderOrders,
  markProviderOrderPrinting,
  markProviderOrderReadyToShip,
} from "@/features/provider-dashboard/api";
import { DashboardPageHeader } from "@/features/provider-dashboard/components/DashboardPageHeader";
import {
  DashboardDataRow,
  DashboardDataValue,
} from "@/features/provider-dashboard/components/DashboardDataRow";
import { DashboardMetricCard } from "@/features/provider-dashboard/components/DashboardMetricCard";
import { DashboardPanel } from "@/features/provider-dashboard/components/DashboardPanel";
import { DashboardStatePill } from "@/features/provider-dashboard/components/DashboardStatePill";
import {
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingState,
} from "@/features/provider-dashboard/components/DashboardStates";
import { useProviderDashboardSession } from "@/features/provider-dashboard/context/ProviderDashboardSessionContext";
import type { DashboardOrder } from "@/features/provider-dashboard/types";

const orderStatusOptions = [
  { value: "", label: "Todos los estados" },
  { value: "paid_confirmed", label: "Pago confirmado" },
  { value: "in_production", label: "En produccion" },
  { value: "ready_to_ship", label: "Listo para despachar" },
  { value: "en_transito", label: "En transito" },
  { value: "completed", label: "Completados" },
  { value: "cancelled", label: "Cancelados" },
];

const orderStatusCopy: Record<string, { label: string; tone: "success" | "warning" | "danger" | "info" | "muted" }> = {
  paid_confirmed: { label: "Pago confirmado", tone: "success" },
  in_production: { label: "En produccion", tone: "info" },
  ready_to_ship: { label: "Listo para despachar", tone: "warning" },
  en_transito: { label: "En transito", tone: "info" },
  completed: { label: "Completado", tone: "success" },
  cancelled: { label: "Cancelado", tone: "danger" },
  pending_confirmation: { label: "Pendiente", tone: "warning" },
};

const paymentStatusCopy: Record<string, { label: string; tone: "success" | "warning" | "danger" | "muted" }> = {
  approved: { label: "Aprobado", tone: "success" },
  pending: { label: "Pendiente", tone: "warning" },
  rejected: { label: "Rechazado", tone: "danger" },
  cancelled: { label: "Cancelado", tone: "danger" },
};

function orderMeta(status?: string | null) {
  if (!status) return { label: "Sin estado", tone: "muted" as const };
  return orderStatusCopy[status] ?? { label: status.replaceAll("_", " "), tone: "muted" as const };
}

function paymentMeta(status?: string | null) {
  if (!status) return { label: "Sin pago", tone: "muted" as const };
  return paymentStatusCopy[status] ?? { label: status.replaceAll("_", " "), tone: "muted" as const };
}

function formatDateTime(value?: string | null) {
  if (!value) return "Sin registro";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin registro";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatCount(value?: number | null) {
  return new Intl.NumberFormat("es-AR").format(Number(value) || 0);
}

function safeText(value?: string | number | null, fallback = "Sin dato") {
  if (value == null || value === "") return fallback;
  return String(value);
}

function parseDeliveryAddress(value?: DashboardOrder["delivery_address_json"]) {
  if (!value) return "Sin direccion cargada";
  if (typeof value === "object") {
    const raw = value.raw;
    return typeof raw === "string" && raw.trim() ? raw : JSON.stringify(value);
  }
  const trimmed = value.trim();
  if (!trimmed) return "Sin direccion cargada";
  try {
    const parsed = JSON.parse(trimmed) as { raw?: unknown };
    return typeof parsed.raw === "string" && parsed.raw.trim() ? parsed.raw : trimmed;
  } catch {
    return trimmed;
  }
}

function orderDate(order: DashboardOrder) {
  return order.updated_at || order.confirmed_at || order.created_at || null;
}

function DetailRow({ label, value, icon }: { label: string; value?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="rounded-[1rem] border border-border/70 bg-background/70 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 text-sm font-medium leading-relaxed text-foreground">{value || "Sin dato"}</div>
    </div>
  );
}

function OrderDetailPanel({
  order,
  isLoading,
  error,
  onMarkPrinting,
  isMarkingPrinting,
  onOpenReadyToShip,
  showReadyToShipComposer,
  readyToShipFiles,
  onAppendReadyToShipFiles,
  onRemoveReadyToShipFile,
  onCancelReadyToShip,
  onConfirmReadyToShip,
  isReadyingToShip,
  onDispatch,
  isDispatching,
}: {
  order?: DashboardOrder | null;
  isLoading: boolean;
  error: unknown;
  onMarkPrinting: () => void;
  isMarkingPrinting: boolean;
  onOpenReadyToShip: () => void;
  showReadyToShipComposer: boolean;
  readyToShipFiles: File[];
  onAppendReadyToShipFiles: (files: File[]) => void;
  onRemoveReadyToShipFile: (index: number) => void;
  onCancelReadyToShip: () => void;
  onConfirmReadyToShip: () => void;
  isReadyingToShip: boolean;
  onDispatch: () => void;
  isDispatching: boolean;
}) {
  if (isLoading) {
    return (
      <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-5">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
          Cargando detalle operativo...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
        No pudimos cargar el detalle de este pedido.
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-[1.25rem] border border-dashed border-border/80 bg-background/70 p-5 text-sm leading-relaxed text-muted-foreground">
        Elegi un pedido para ver cliente, entrega y archivos visibles. Esta informacion aparece aca porque el pedido ya esta confirmado.
      </div>
    );
  }

  const orderStatus = orderMeta(order.order_status);
  const paymentStatus = paymentMeta(order.payment_status);
  const files = order.files || [];
  const canMarkPrinting = ["paid_confirmed", "preparing"].includes(String(order.order_status || ""));
  const canReadyToShip = ["in_production"].includes(String(order.order_status || ""));
  const canDispatch = ["ready_to_ship", "listo_para_envio"].includes(String(order.order_status || ""));

  return (
    <div className="space-y-4">
      <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-[Montserrat] text-lg font-bold tracking-tight text-foreground">Pedido #{order.id}</p>
            <p className="mt-1 text-sm text-muted-foreground">Cotizacion #{safeText(order.cotizacion_id)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <DashboardStatePill tone={orderStatus.tone}>{orderStatus.label}</DashboardStatePill>
            <DashboardStatePill tone={paymentStatus.tone}>Pago {paymentStatus.label}</DashboardStatePill>
          </div>
        </div>
        {canMarkPrinting || canDispatch ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {canMarkPrinting ? (
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl border-border/80 bg-white/90 px-4 text-foreground hover:bg-muted"
                onClick={onMarkPrinting}
                disabled={isMarkingPrinting}
              >
                {isMarkingPrinting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                Empezo impresion
              </Button>
            ) : null}
            {canReadyToShip ? (
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl border-border/80 bg-white/90 px-4 text-foreground hover:bg-muted"
                onClick={onOpenReadyToShip}
                disabled={isReadyingToShip}
              >
                {isReadyingToShip ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Termino impresion
              </Button>
            ) : null}
            {canDispatch ? (
              <Button
                type="button"
                className="h-10 rounded-xl bg-gradient-primary px-4 text-primary-foreground shadow-cta hover:opacity-95"
                onClick={onDispatch}
                disabled={isDispatching}
              >
                {isDispatching ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                Confirmar despacho
              </Button>
            ) : null}
          </div>
        ) : null}
        {showReadyToShipComposer ? (
          <ReadyToShipComposer
            files={readyToShipFiles}
            onAppendFiles={onAppendReadyToShipFiles}
            onRemoveFile={onRemoveReadyToShipFile}
            onCancel={onCancelReadyToShip}
            onConfirm={onConfirmReadyToShip}
            isSubmitting={isReadyingToShip}
          />
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <DetailRow label="Cliente" value={safeText(order.client_name, "Cliente no cargado")} />
        <DetailRow label="Email" value={safeText(order.client_email)} icon={<Mail className="h-3.5 w-3.5" />} />
        <DetailRow label="Telefono" value={safeText(order.client_phone)} icon={<Phone className="h-3.5 w-3.5" />} />
        <DetailRow label="Metodo de entrega" value={safeText(order.delivery_method)} icon={<Truck className="h-3.5 w-3.5" />} />
        <DetailRow label="Direccion" value={parseDeliveryAddress(order.delivery_address_json)} icon={<MapPinned className="h-3.5 w-3.5" />} />
        <DetailRow label="Confirmado" value={formatDateTime(order.confirmed_at)} icon={<CalendarCheck className="h-3.5 w-3.5" />} />
        <DetailRow label="Creado" value={formatDateTime(order.created_at)} />
        <DetailRow label="Actualizado" value={formatDateTime(order.updated_at)} />
      </div>

      {order.notas ? (
        <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Notas operativas</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground">{order.notas}</p>
        </div>
      ) : null}

      <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Archivos visibles</p>
            <p className="mt-1 text-sm text-muted-foreground">STL/GCODE aparecen solo cuando backend los marca visibles.</p>
          </div>
          <DashboardStatePill tone={files.length ? "success" : "muted"}>{files.length} archivos</DashboardStatePill>
        </div>
        {files.length ? (
          <div className="mt-4 space-y-3">
            {files.map((file, index) => (
              <div key={`${file.file_type}-${index}`} className="rounded-[1rem] border border-border/70 bg-white px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{safeText(file.file_type, "archivo")}</p>
                    <p className="mt-1 break-all text-xs text-muted-foreground">{safeText(file.file_path, "sin path")}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDateTime(file.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-[1rem] border border-dashed border-border/80 bg-white px-4 py-3 text-sm text-muted-foreground">
            Todavia no hay archivos visibles para este pedido.
          </div>
        )}
      </div>
    </div>
  );
}

function OrderRow({
  order,
  selected,
  onSelect,
}: {
  order: DashboardOrder;
  selected: boolean;
  onSelect: () => void;
}) {
  const orderStatus = orderMeta(order.order_status);
  const paymentStatus = paymentMeta(order.payment_status);

  return (
    <DashboardDataRow
      onClick={onSelect}
      selected={selected}
      columnsClassName="lg:grid-cols-[0.72fr_0.9fr_0.82fr_1.15fr_0.9fr_0.85fr]"
    >
      <DashboardDataValue label="Pedido">
        <p className="text-sm font-semibold text-foreground">#{order.id}</p>
        <p className="text-xs text-muted-foreground">Cot #{safeText(order.cotizacion_id)}</p>
      </DashboardDataValue>
      <DashboardDataValue label="Estado" className="flex flex-col items-start">
        <DashboardStatePill tone={orderStatus.tone}>{orderStatus.label}</DashboardStatePill>
      </DashboardDataValue>
      <DashboardDataValue label="Pago" className="flex flex-col items-start">
        <DashboardStatePill tone={paymentStatus.tone}>{paymentStatus.label}</DashboardStatePill>
      </DashboardDataValue>
      <DashboardDataValue label="Cliente">
        <p className="text-sm font-medium text-foreground">{safeText(order.client_name, "Cliente no cargado")}</p>
        <p className="text-xs text-muted-foreground">{safeText(order.client_email, "sin email")}</p>
      </DashboardDataValue>
      <DashboardDataValue label="Entrega" className="text-sm text-muted-foreground">
        {safeText(order.delivery_method)}
      </DashboardDataValue>
      <DashboardDataValue label="Actividad" className="text-sm text-muted-foreground">
        <span className="block">{formatDateTime(order.created_at)}</span>
        <span className="mt-1 block text-xs font-medium text-foreground">
          {formatCount(order.files_count)} archivos
        </span>
      </DashboardDataValue>
    </DashboardDataRow>
  );
}

function dedupeFiles(existing: File[], incoming: File[]) {
  const seen = new Set(existing.map((file) => `${file.name}:${file.size}:${file.lastModified}`));
  const next = [...existing];
  for (const file of incoming) {
    const key = `${file.name}:${file.size}:${file.lastModified}`;
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(file);
  }
  return next;
}

function ReadyToShipComposer({
  files,
  onAppendFiles,
  onRemoveFile,
  onCancel,
  onConfirm,
  isSubmitting,
}: {
  files: File[];
  onAppendFiles: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  onCancel: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (list: FileList | null) => {
    const nextFiles = Array.from(list || []).filter((file) => file.type.startsWith("image/"));
    if (!nextFiles.length) return;
    onAppendFiles(nextFiles);
  };

  return (
    <div className="mt-4 rounded-[1.1rem] border border-border/70 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Fin de impresion</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Sube fotos opcionales de la impresion terminada. Si las cargas, se incluyen en el mail al cliente antes del tracking.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-xl border-border/80 bg-white px-3 text-foreground hover:bg-muted"
          onClick={() => inputRef.current?.click()}
          disabled={isSubmitting}
        >
          <Upload className="h-4 w-4" />
          Subir fotos
        </Button>
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={`mt-4 rounded-[1rem] border-2 border-dashed px-5 py-6 text-center transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-border/80 bg-background/40"
        }`}
      >
        <p className="text-sm font-medium text-foreground">
          Arrastra fotos aca o usa el boton de upload
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          JPG, PNG o WEBP. Puedes seguir sin fotos y se enviara el mail base.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={(event) => {
            handleFiles(event.target.files);
            event.currentTarget.value = "";
          }}
        />
      </div>

      {files.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <button
              key={`${file.name}-${file.size}-${file.lastModified}`}
              type="button"
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-border/80 bg-background px-3 py-2 text-xs text-foreground"
              onClick={() => onRemoveFile(index)}
              disabled={isSubmitting}
            >
              <span className="truncate">{file.name}</span>
              <span className="text-muted-foreground">Quitar</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          className="h-10 rounded-xl bg-gradient-primary px-4 text-primary-foreground shadow-cta hover:opacity-95"
          onClick={onConfirm}
          disabled={isSubmitting}
        >
          {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Avisar fin de impresion
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-xl border-border/80 bg-white px-4 text-foreground hover:bg-muted"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function OrdersContent({
  items,
  selectedOrder,
  selectedId,
  detailLoading,
  detailError,
  statusFilter,
  onStatusChange,
  onRefresh,
  onSelectOrder,
  onMarkPrintingSelected,
  onOpenReadyToShipComposer,
  showReadyToShipComposer,
  readyToShipFiles,
  onAppendReadyToShipFiles,
  onRemoveReadyToShipFile,
  onCancelReadyToShip,
  onConfirmReadyToShip,
  onDispatchSelected,
  isFetching,
  isMarkingPrinting,
  isReadyingToShip,
  isDispatching,
}: {
  items: DashboardOrder[];
  selectedOrder?: DashboardOrder | null;
  selectedId: number | null;
  detailLoading: boolean;
  detailError: unknown;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  onRefresh: () => void;
  onSelectOrder: (id: number) => void;
  onMarkPrintingSelected: () => void;
  onOpenReadyToShipComposer: () => void;
  showReadyToShipComposer: boolean;
  readyToShipFiles: File[];
  onAppendReadyToShipFiles: (files: File[]) => void;
  onRemoveReadyToShipFile: (index: number) => void;
  onCancelReadyToShip: () => void;
  onConfirmReadyToShip: () => void;
  onDispatchSelected: () => void;
  isFetching: boolean;
  isMarkingPrinting: boolean;
  isReadyingToShip: boolean;
  isDispatching: boolean;
}) {
  const activeOrders = items.filter((item) => !["completed", "cancelled"].includes(String(item.order_status || "")));
  const completedOrders = items.filter((item) => item.order_status === "completed");
  const filesCount = items.reduce((sum, item) => sum + (Number(item.files_count) || 0), 0);
  const lastOrder = items[0];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Vista operativa"
        title="Pedidos confirmados"
        description="Operaciones reales del proveedor con cliente, entrega y archivos visibles cuando el backend ya confirmo el pedido."
        meta={
          <>
            <DashboardStatePill tone={items.length ? "info" : "muted"}>{items.length} pedidos</DashboardStatePill>
            <DashboardStatePill tone={activeOrders.length ? "warning" : "success"}>{activeOrders.length} abiertos</DashboardStatePill>
            {isFetching ? <DashboardStatePill tone="warning">Actualizando</DashboardStatePill> : null}
          </>
        }
        actions={
          <>
            <select
              value={statusFilter}
              onChange={(event) => onStatusChange(event.target.value)}
              className="h-11 rounded-xl border border-border/80 bg-white px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {orderStatusOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl border-border/80 bg-white/90 px-4 text-foreground hover:bg-muted"
              onClick={onRefresh}
              disabled={isFetching}
            >
              {isFetching ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Recargar
            </Button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard title="Pedidos abiertos" value={String(activeOrders.length)} support="Pendientes de produccion, entrega o cierre." icon={<PackageOpen className="h-5 w-5" />} />
        <DashboardMetricCard title="Completados" value={String(completedOrders.length)} support="Pedidos cerrados en la vista actual." icon={<CheckCircle2 className="h-5 w-5" />} />
        <DashboardMetricCard title="Archivos visibles" value={String(filesCount)} support="STL/GCODE disponibles para operar." icon={<FileArchive className="h-5 w-5" />} />
        <DashboardMetricCard title="Ultima actividad" value={formatDateTime(orderDate(lastOrder || {}))} support="Segun el filtro aplicado." icon={<ClipboardList className="h-5 w-5" />} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <DashboardPanel
          title="Listado operativo"
          description="Click en un pedido para abrir cliente, entrega y archivos permitidos por backend."
          contentClassName="p-4 pt-0 md:p-5 md:pt-0"
        >
          {items.length ? (
            <div className="space-y-3">
              {items.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  selected={selectedId === order.id}
                  onSelect={() => onSelectOrder(order.id)}
                />
              ))}
            </div>
          ) : (
            <DashboardEmptyState
              title="No hay pedidos para este filtro"
              description="El endpoint real no devolvio pedidos visibles para el estado seleccionado."
              icon={<Search className="h-6 w-6" />}
              className="min-h-[420px]"
            />
          )}
        </DashboardPanel>

        <div className="space-y-6">
          <DashboardPanel title="Detalle del pedido" description="Datos operativos confirmados para producir y entregar.">
            <OrderDetailPanel
              order={selectedOrder}
              isLoading={detailLoading}
              error={detailError}
              onMarkPrinting={onMarkPrintingSelected}
              isMarkingPrinting={isMarkingPrinting}
              onOpenReadyToShip={onOpenReadyToShipComposer}
              showReadyToShipComposer={showReadyToShipComposer}
              readyToShipFiles={readyToShipFiles}
              onAppendReadyToShipFiles={onAppendReadyToShipFiles}
              onRemoveReadyToShipFile={onRemoveReadyToShipFile}
              onCancelReadyToShip={onCancelReadyToShip}
              onConfirmReadyToShip={onConfirmReadyToShip}
              isReadyingToShip={isReadyingToShip}
              onDispatch={onDispatchSelected}
              isDispatching={isDispatching}
            />
          </DashboardPanel>

          <DashboardPanel title="Frontera operativa" description="Regla de exposicion de datos en el dashboard.">
            <div className="space-y-3">
              <div className="rounded-[1.15rem] border border-border/70 bg-background/70 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                En Pedidos si se muestran cliente y archivos porque ya existe una operacion confirmada.
              </div>
              <div className="rounded-[1.15rem] border border-border/70 bg-background/70 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                Cambios de estado avanzados y tracking quedan para la migracion de Envios.
              </div>
            </div>
          </DashboardPanel>
        </div>
      </section>
    </div>
  );
}

export function ProviderOrdersView() {
  const queryClient = useQueryClient();
  const { providerId } = useProviderDashboardSession();
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showReadyToShipComposer, setShowReadyToShipComposer] = useState(false);
  const [readyToShipFiles, setReadyToShipFiles] = useState<File[]>([]);

  const ordersQuery = useQuery({
    queryKey: ["provider-dashboard", "orders", providerId, statusFilter],
    queryFn: () => fetchProviderOrders(providerId!, statusFilter),
    enabled: providerId != null,
    staleTime: 20_000,
  });

  const detailQuery = useQuery({
    queryKey: ["provider-dashboard", "order-detail", providerId, selectedId],
    queryFn: () => fetchProviderOrderDetail(providerId!, selectedId!),
    enabled: providerId != null && selectedId != null,
    staleTime: 20_000,
  });

  const items = useMemo(() => ordersQuery.data?.items || [], [ordersQuery.data]);
  const selectedOrder = detailQuery.data?.item || items.find((item) => item.id === selectedId) || null;

  useEffect(() => {
    setShowReadyToShipComposer(false);
    setReadyToShipFiles([]);
  }, [selectedId]);

  const printingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedId || providerId == null) throw new Error("Elegi un pedido para marcar impresion.");
      return markProviderOrderPrinting(providerId, selectedId);
    },
    onSuccess: (payload) => {
      toast.success(payload.email_sent ? "Pedido en impresion. Email enviado al cliente." : "Pedido en impresion.");
      void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "orders", providerId] });
      void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "order-detail", providerId] });
      void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "notifications", providerId] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No pudimos marcar el pedido en impresion.");
    },
  });

  const readyToShipMutation = useMutation({
    mutationFn: async () => {
      if (!selectedId || providerId == null) throw new Error("Elegi un pedido para avisar fin de impresion.");
      return markProviderOrderReadyToShip(providerId, selectedId, { photos: readyToShipFiles });
    },
    onSuccess: (payload) => {
      setShowReadyToShipComposer(false);
      setReadyToShipFiles([]);
      const uploaded = Number(payload.uploaded) || 0;
      if (payload.email_sent && uploaded > 0) {
        toast.success("Pedido listo para despachar. Fotos y email enviados al cliente.");
      } else if (payload.email_sent) {
        toast.success("Pedido listo para despachar. Email enviado al cliente.");
      } else {
        toast.success("Pedido listo para despachar.");
      }
      void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "orders", providerId] });
      void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "order-detail", providerId] });
      void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "shipments", providerId] });
      void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "notifications", providerId] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No pudimos marcar el pedido como listo para despachar.");
    },
  });

  const dispatchMutation = useMutation({
    mutationFn: async () => {
      if (!selectedId) throw new Error("Elegí un pedido para confirmar despacho.");
      return dispatchProviderOrder(selectedId);
    },
    onSuccess: (payload) => {
      toast.success(
        payload.email_sent
          ? `Despacho confirmado. Tracking ${payload.trackingNumber} y mail enviado.`
          : `Despacho confirmado. Tracking ${payload.trackingNumber}`
      );
      void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "orders", providerId] });
      void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "order-detail", providerId] });
      void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "shipments", providerId] });
      void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "notifications", providerId] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No pudimos confirmar el despacho.");
    },
  });

  if (ordersQuery.error) {
    return (
      <DashboardErrorState
        title="No pudimos cargar Pedidos"
        description="La ruta React esta lista, pero el endpoint real de pedidos no respondio correctamente."
      />
    );
  }

  if (ordersQuery.isLoading || (ordersQuery.isFetching && !ordersQuery.data)) {
    return (
      <DashboardLoadingState
        title="Armando pedidos"
        description="Estamos conectando operaciones confirmadas con los datos reales del dashboard."
      />
    );
  }

  if (!ordersQuery.data) {
    return (
      <DashboardEmptyState
        title="No encontramos pedidos"
        description="La sesion esta activa, pero no recibimos una respuesta valida para esta vista."
        icon={<AlertTriangle className="h-6 w-6" />}
      />
    );
  }

  return (
    <OrdersContent
      items={items}
      selectedOrder={selectedOrder}
      selectedId={selectedId}
      detailLoading={detailQuery.isFetching}
      detailError={detailQuery.error}
      statusFilter={statusFilter}
      onStatusChange={(status) => {
        setStatusFilter(status);
        setSelectedId(null);
      }}
      onRefresh={() => {
        void ordersQuery.refetch();
        if (selectedId != null) void detailQuery.refetch();
      }}
      onSelectOrder={setSelectedId}
      onMarkPrintingSelected={() => {
        if (!selectedOrder) return;
        if (!window.confirm(`Marcar el pedido #${selectedOrder.id} como en impresion y enviar email al cliente?`)) return;
        void printingMutation.mutateAsync();
      }}
      onOpenReadyToShipComposer={() => {
        setShowReadyToShipComposer(true);
      }}
      showReadyToShipComposer={showReadyToShipComposer}
      readyToShipFiles={readyToShipFiles}
      onAppendReadyToShipFiles={(files) => {
        setReadyToShipFiles((current) => dedupeFiles(current, files));
      }}
      onRemoveReadyToShipFile={(index) => {
        setReadyToShipFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
      }}
      onCancelReadyToShip={() => {
        setShowReadyToShipComposer(false);
        setReadyToShipFiles([]);
      }}
      onConfirmReadyToShip={() => {
        if (!selectedOrder) return;
        const confirmMessage = readyToShipFiles.length
          ? `Avisar al cliente que el pedido #${selectedOrder.id} termino de imprimirse y adjuntar ${readyToShipFiles.length} foto(s)?`
          : `Avisar al cliente que el pedido #${selectedOrder.id} termino de imprimirse sin adjuntar fotos?`;
        if (!window.confirm(confirmMessage)) return;
        void readyToShipMutation.mutateAsync();
      }}
      onDispatchSelected={() => {
        if (!selectedOrder) return;
        if (!window.confirm(`Confirmar despacho del pedido #${selectedOrder.id}?`)) return;
        void dispatchMutation.mutateAsync();
      }}
      isFetching={ordersQuery.isFetching}
      isMarkingPrinting={printingMutation.isPending}
      isReadyingToShip={readyToShipMutation.isPending}
      isDispatching={dispatchMutation.isPending}
    />
  );
}
