import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
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
  RefreshCcw,
  Search,
  Truck,
  WalletCards,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { fetchProviderOrderDetail, fetchProviderOrders } from "@/features/provider-dashboard/api";
import { DashboardPageHeader } from "@/features/provider-dashboard/components/DashboardPageHeader";
import { DashboardPanel } from "@/features/provider-dashboard/components/DashboardPanel";
import { DashboardStatePill } from "@/features/provider-dashboard/components/DashboardStatePill";
import {
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingState,
} from "@/features/provider-dashboard/components/DashboardStates";
import { useProviderDashboardSession } from "@/features/provider-dashboard/context/ProviderDashboardSessionContext";
import type { DashboardOrder } from "@/features/provider-dashboard/types";
import { cn } from "@/lib/utils";

const orderStatusOptions = [
  { value: "", label: "Todos los estados" },
  { value: "paid_confirmed", label: "Pago confirmado" },
  { value: "in_production", label: "En produccion" },
  { value: "completed", label: "Completados" },
  { value: "cancelled", label: "Cancelados" },
];

const orderStatusCopy: Record<string, { label: string; tone: "success" | "warning" | "danger" | "info" | "muted" }> = {
  paid_confirmed: { label: "Pago confirmado", tone: "success" },
  in_production: { label: "En produccion", tone: "info" },
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
}: {
  order?: DashboardOrder | null;
  isLoading: boolean;
  error: unknown;
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
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "grid w-full gap-3 border-b border-border/70 px-4 py-4 text-left transition-colors last:border-b-0 lg:grid-cols-[0.6fr_0.9fr_0.8fr_1fr_0.85fr_0.8fr_0.55fr]",
        selected ? "bg-primary/8" : "bg-white hover:bg-muted/50"
      )}
    >
      <div>
        <p className="text-sm font-semibold text-foreground">#{order.id}</p>
        <p className="text-xs text-muted-foreground">Cot #{safeText(order.cotizacion_id)}</p>
      </div>
      <div className="flex items-center">
        <DashboardStatePill tone={orderStatus.tone}>{orderStatus.label}</DashboardStatePill>
      </div>
      <div className="flex items-center">
        <DashboardStatePill tone={paymentStatus.tone}>{paymentStatus.label}</DashboardStatePill>
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{safeText(order.client_name, "Cliente no cargado")}</p>
        <p className="text-xs text-muted-foreground">{safeText(order.client_email, "sin email")}</p>
      </div>
      <div className="text-sm text-muted-foreground">{safeText(order.delivery_method)}</div>
      <div className="text-sm text-muted-foreground">{formatDateTime(order.created_at)}</div>
      <div className="text-sm font-medium text-foreground">{formatCount(order.files_count)}</div>
    </button>
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
  isFetching,
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
  isFetching: boolean;
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
        <SnapshotCard title="Pedidos abiertos" value={String(activeOrders.length)} support="Pendientes de produccion, entrega o cierre." icon={<PackageOpen className="h-5 w-5" />} />
        <SnapshotCard title="Completados" value={String(completedOrders.length)} support="Pedidos cerrados en la vista actual." icon={<CheckCircle2 className="h-5 w-5" />} />
        <SnapshotCard title="Archivos visibles" value={String(filesCount)} support="STL/GCODE disponibles para operar." icon={<FileArchive className="h-5 w-5" />} />
        <SnapshotCard title="Ultima actividad" value={formatDateTime(orderDate(lastOrder || {}))} support="Segun el filtro aplicado." icon={<ClipboardList className="h-5 w-5" />} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <DashboardPanel
          title="Listado operativo"
          description="Click en una fila para abrir cliente, entrega y archivos permitidos por backend."
          contentClassName="p-0"
        >
          {items.length ? (
            <div className="overflow-hidden rounded-b-[1.25rem]">
              <div className="hidden border-b border-border/70 bg-muted/40 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground lg:grid lg:grid-cols-[0.6fr_0.9fr_0.8fr_1fr_0.85fr_0.8fr_0.55fr]">
                <span>ID</span>
                <span>Estado</span>
                <span>Pago</span>
                <span>Cliente</span>
                <span>Entrega</span>
                <span>Creado</span>
                <span>Archivos</span>
              </div>
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
            <OrderDetailPanel order={selectedOrder} isLoading={detailLoading} error={detailError} />
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
  const { providerId } = useProviderDashboardSession();
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

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
      isFetching={ordersQuery.isFetching}
    />
  );
}
