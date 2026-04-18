import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  LoaderCircle,
  MapPinned,
  PackageCheck,
  RefreshCcw,
  Route,
  Search,
  Send,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import {
  fetchProviderNotifications,
  fetchProviderShipments,
  markAllProviderNotificationsRead,
  markProviderNotificationRead,
  updateProviderShipmentStatus,
  updateProviderShipmentTracking,
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
import type { DashboardNotification, DashboardShipment } from "@/features/provider-dashboard/types";

const shipmentStatusOptions = [
  { value: "", label: "Todos los estados" },
  { value: "pending", label: "Pendiente" },
  { value: "ready_to_ship", label: "Listo para despachar" },
  { value: "dispatched", label: "Despachado" },
  { value: "in_transit", label: "En transito" },
  { value: "delivered", label: "Entregado" },
  { value: "problem", label: "Con problema" },
  { value: "cancelled", label: "Cancelado" },
];

const shipmentStatusCopy: Record<string, { label: string; tone: "success" | "warning" | "danger" | "info" | "muted" }> = {
  pending: { label: "Pendiente", tone: "muted" },
  ready_to_ship: { label: "Listo para despachar", tone: "warning" },
  dispatched: { label: "Despachado", tone: "info" },
  in_transit: { label: "En transito", tone: "info" },
  delivered: { label: "Entregado", tone: "success" },
  cancelled: { label: "Cancelado", tone: "danger" },
  problem: { label: "Con problema", tone: "danger" },
};

const methodLabels: Record<string, string> = {
  retiro_taller: "Retiro en taller",
  paqar_clasico: "PAQ.AR Clasico",
  paqar_expreso: "PAQ.AR Expreso",
};

function statusMeta(status?: string | null) {
  if (!status) return { label: "Sin estado", tone: "muted" as const };
  return shipmentStatusCopy[status] ?? { label: status.replaceAll("_", " "), tone: "muted" as const };
}

function methodLabel(method?: string | null) {
  if (!method) return "Sin metodo";
  return methodLabels[method] ?? method.replaceAll("_", " ");
}

function formatDateTime(value?: string | null) {
  if (!value) return "Sin registro";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin registro";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatMoney(value?: number | null) {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function safeText(value?: string | number | null, fallback = "Sin dato") {
  if (value == null || value === "") return fallback;
  return String(value);
}

function shipmentDestination(shipment: DashboardShipment) {
  return [shipment.destino_nombre, shipment.destino_localidad, shipment.destino_provincia]
    .filter(Boolean)
    .join(", ") || "Destino no cargado";
}

function shipmentOrigin(shipment: DashboardShipment) {
  return [shipment.origen_nombre, shipment.origen_localidad, shipment.origen_provincia]
    .filter(Boolean)
    .join(", ") || "Origen no cargado";
}

function packageDimensions(shipment: DashboardShipment) {
  const parts = [shipment.dimension_largo_cm, shipment.dimension_ancho_cm, shipment.dimension_alto_cm]
    .map((value) => Number(value) || 0)
    .filter((value) => value > 0);
  return parts.length === 3 ? `${parts.join(" x ")} cm` : "Sin dimensiones";
}

function isOverdue(shipment: DashboardShipment) {
  if (!shipment.fecha_limite_despacho) return false;
  if (["delivered", "cancelled"].includes(String(shipment.status || ""))) return false;
  const deadline = new Date(shipment.fecha_limite_despacho);
  return Number.isFinite(deadline.getTime()) && deadline.getTime() < Date.now();
}

function publicTrackingPath(shipment: DashboardShipment) {
  return shipment.cotizacion_id ? `/tracking/${shipment.cotizacion_id}` : "";
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

function ShipmentRow({
  shipment,
  selected,
  onSelect,
}: {
  shipment: DashboardShipment;
  selected: boolean;
  onSelect: () => void;
}) {
  const meta = statusMeta(shipment.status);
  const overdue = isOverdue(shipment);

  return (
    <DashboardDataRow
      onClick={onSelect}
      selected={selected}
      columnsClassName="lg:grid-cols-[0.68fr_0.92fr_0.9fr_1.05fr_1.15fr_0.82fr]"
    >
      <DashboardDataValue label="Envio">
        <p className="text-sm font-semibold text-foreground">#{shipment.id}</p>
        <p className="text-xs text-muted-foreground">Cot #{safeText(shipment.cotizacion_id)}</p>
      </DashboardDataValue>
      <DashboardDataValue label="Estado" className="flex flex-col items-start">
        <DashboardStatePill tone={meta.tone}>{meta.label}</DashboardStatePill>
      </DashboardDataValue>
      <DashboardDataValue label="Metodo" className="text-sm text-muted-foreground">
        {methodLabel(shipment.shipping_method)}
      </DashboardDataValue>
      <DashboardDataValue label="Tracking">
        <p className="text-sm font-medium text-foreground">{safeText(shipment.tracking_code, "Sin tracking")}</p>
        <p className="text-xs text-muted-foreground">{shipment.tracking_loaded_at ? "Tracking cargado" : "Pendiente"}</p>
      </DashboardDataValue>
      <DashboardDataValue label="Destino">
        <p className="text-sm font-medium text-foreground">{shipmentDestination(shipment)}</p>
        <p className="text-xs text-muted-foreground">CP {safeText(shipment.destino_cp)}</p>
      </DashboardDataValue>
      <DashboardDataValue label="Plazo" className="flex flex-col items-start gap-2">
        <span className="text-sm text-muted-foreground">{formatDateTime(shipment.fecha_limite_despacho)}</span>
        <DashboardStatePill tone={overdue ? "danger" : "muted"}>{overdue ? "Vencido" : "En plazo"}</DashboardStatePill>
      </DashboardDataValue>
    </DashboardDataRow>
  );
}

function NotificationList({
  items,
  unread,
  onMarkRead,
  onMarkAllRead,
  isMutating,
}: {
  items: DashboardNotification[];
  unread: number;
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
  isMutating: boolean;
}) {
  return (
    <DashboardPanel
      title="Notificaciones"
      description="Alertas de pagos, despachos y cambios vinculados a envios."
      headerAction={
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-xl border-border/80 bg-white/90 px-4 text-foreground hover:bg-muted"
          onClick={onMarkAllRead}
          disabled={!unread || isMutating}
        >
          {isMutating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Marcar leidas
        </Button>
      }
    >
      <div className="space-y-3">
        {items.length ? (
          items.slice(0, 8).map((item) => {
            const read = Boolean(item.leida);
            return (
              <div key={item.id} className="rounded-[1.15rem] border border-border/70 bg-background/70 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{safeText(item.titulo, "Notificacion")}</p>
                      <DashboardStatePill tone={read ? "muted" : "info"}>{read ? "Leida" : "Nueva"}</DashboardStatePill>
                    </div>
                    <p className="line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {safeText(item.mensaje, "Sin mensaje")}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(item.created_at)}</p>
                  </div>
                  {!read ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-xl border-border/80 bg-white/90 px-3 text-xs text-foreground hover:bg-muted"
                      onClick={() => onMarkRead(item.id)}
                      disabled={isMutating}
                    >
                      OK
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-[1.15rem] border border-dashed border-border/80 bg-background/70 px-4 py-6 text-center text-sm text-muted-foreground">
            Sin notificaciones para mostrar.
          </div>
        )}
      </div>
    </DashboardPanel>
  );
}

function ShipmentDetailPanel({
  shipment,
  trackingCode,
  onTrackingCodeChange,
  onSaveTracking,
  onStatusChange,
  isMutating,
}: {
  shipment?: DashboardShipment | null;
  trackingCode: string;
  onTrackingCodeChange: (value: string) => void;
  onSaveTracking: () => void;
  onStatusChange: (status: string) => void;
  isMutating: boolean;
}) {
  if (!shipment) {
    return (
      <div className="rounded-[1.25rem] border border-dashed border-border/80 bg-background/70 p-5 text-sm leading-relaxed text-muted-foreground">
        Elegi un envio para ver destino, paquete, tracking y acciones disponibles.
      </div>
    );
  }

  const meta = statusMeta(shipment.status);
  const canLoadTracking = ["pending", "ready_to_ship"].includes(String(shipment.status || ""));
  const canMarkDispatched = shipment.status === "ready_to_ship";
  const canMarkDelivered = shipment.status === "dispatched" || shipment.status === "in_transit";
  const trackingPath = publicTrackingPath(shipment);

  return (
    <div className="space-y-4">
      <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-[Montserrat] text-lg font-bold tracking-tight text-foreground">Envio #{shipment.id}</p>
            <p className="mt-1 text-sm text-muted-foreground">Cotizacion #{safeText(shipment.cotizacion_id)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <DashboardStatePill tone={meta.tone}>{meta.label}</DashboardStatePill>
            <DashboardStatePill tone={shipment.tracking_code ? "success" : "warning"}>
              {shipment.tracking_code ? "Con tracking" : "Sin tracking"}
            </DashboardStatePill>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <DetailRow label="Metodo" value={methodLabel(shipment.shipping_method)} icon={<Truck className="h-3.5 w-3.5" />} />
        <DetailRow label="Gestionado por" value={safeText(shipment.managed_by)} />
        <DetailRow label="Origen" value={shipmentOrigin(shipment)} icon={<PackageCheck className="h-3.5 w-3.5" />} />
        <DetailRow label="Destino" value={shipmentDestination(shipment)} icon={<MapPinned className="h-3.5 w-3.5" />} />
        <DetailRow label="Direccion destino" value={safeText(shipment.destino_direccion)} />
        <DetailRow label="Telefono destino" value={safeText(shipment.destino_telefono)} />
        <DetailRow label="Peso" value={`${Number(shipment.peso_gramos) || 0} g`} />
        <DetailRow label="Dimensiones" value={packageDimensions(shipment)} />
        <DetailRow label="Costo real" value={formatMoney(shipment.shipping_cost_real_ars || shipment.tarifa_estimada_ars)} />
        <DetailRow label="Cobrado cliente" value={formatMoney(shipment.precio_cobrado_cliente_ars)} />
        <DetailRow label="Limite despacho" value={formatDateTime(shipment.fecha_limite_despacho)} icon={<CalendarClock className="h-3.5 w-3.5" />} />
        <DetailRow label="Pickup sugerido" value={formatDateTime(shipment.fecha_pickup_sugerida)} />
        <DetailRow label="Despachado" value={formatDateTime(shipment.fecha_despacho_real)} />
        <DetailRow label="Entregado" value={formatDateTime(shipment.fecha_entrega_real)} />
      </div>

      <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground" htmlFor="shipment-tracking-code">
              Codigo de tracking
            </label>
            <Input
              id="shipment-tracking-code"
              value={trackingCode}
              onChange={(event) => onTrackingCodeChange(event.target.value)}
              className="mt-2 h-11 rounded-xl border-border/80 bg-white"
              placeholder="Codigo Correo Argentino"
              disabled={!canLoadTracking || isMutating}
            />
          </div>
          <Button
            type="button"
            className="h-11 rounded-xl bg-gradient-primary px-5 text-primary-foreground shadow-cta hover:opacity-95"
            onClick={onSaveTracking}
            disabled={!canLoadTracking || !trackingCode.trim() || isMutating}
          >
            {isMutating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Guardar tracking
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {shipment.tracking_url ? (
            <Button asChild variant="outline" className="h-10 rounded-xl border-border/80 bg-white/90 px-4 text-foreground hover:bg-muted">
              <a href={shipment.tracking_url} target="_blank" rel="noreferrer">
                Correo Argentino
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          ) : null}
          {trackingPath ? (
            <Button asChild variant="outline" className="h-10 rounded-xl border-border/80 bg-white/90 px-4 text-foreground hover:bg-muted">
              <a href={trackingPath} target="_blank" rel="noreferrer">
                Tracking cliente
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
        <p className="text-sm font-semibold text-foreground">Acciones de estado</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Las transiciones usan el flujo validado por backend para evitar saltos inconsistentes.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-border/80 bg-white/90 px-4 text-foreground hover:bg-muted"
            onClick={() => onStatusChange("dispatched")}
            disabled={!canMarkDispatched || isMutating}
          >
            <Truck className="h-4 w-4" />
            Marcar despachado
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-border/80 bg-white/90 px-4 text-foreground hover:bg-muted"
            onClick={() => onStatusChange("delivered")}
            disabled={!canMarkDelivered || isMutating}
          >
            <ClipboardCheck className="h-4 w-4" />
            Marcar entregado
          </Button>
        </div>
      </div>

      {shipment.dispatch_package ? (
        <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
          <p className="text-sm font-semibold text-foreground">Paquete de despacho</p>
          <pre className="mt-3 max-h-[320px] overflow-auto whitespace-pre-wrap rounded-[1rem] border border-border/70 bg-white p-4 text-xs leading-relaxed text-muted-foreground">
            {shipment.dispatch_package}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

function ShipmentsContent({
  items,
  notifications,
  unreadNotifications,
  selectedShipment,
  selectedId,
  statusFilter,
  trackingCode,
  onStatusChange,
  onRefresh,
  onSelectShipment,
  onTrackingCodeChange,
  onSaveTracking,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  isFetching,
  isMutating,
}: {
  items: DashboardShipment[];
  notifications: DashboardNotification[];
  unreadNotifications: number;
  selectedShipment?: DashboardShipment | null;
  selectedId: number | null;
  statusFilter: string;
  trackingCode: string;
  onStatusChange: (status: string) => void;
  onRefresh: () => void;
  onSelectShipment: (shipment: DashboardShipment) => void;
  onTrackingCodeChange: (value: string) => void;
  onSaveTracking: () => void;
  onMarkNotificationRead: (id: number) => void;
  onMarkAllNotificationsRead: () => void;
  isFetching: boolean;
  isMutating: boolean;
}) {
  const activeShipments = items.filter((item) => !["delivered", "cancelled"].includes(String(item.status || "")));
  const readyShipments = items.filter((item) => item.status === "ready_to_ship");
  const withTracking = items.filter((item) => item.tracking_code);
  const overdueCount = items.filter(isOverdue).length;
  const latestShipment = items[0];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Vista operativa"
        title="Mis envios"
        description="Shipments reales del proveedor con tracking, deadlines de despacho y notificaciones operativas."
        meta={
          <>
            <DashboardStatePill tone={items.length ? "info" : "muted"}>{items.length} envios</DashboardStatePill>
            <DashboardStatePill tone={readyShipments.length ? "warning" : "success"}>
              {readyShipments.length} listos
            </DashboardStatePill>
            <DashboardStatePill tone={unreadNotifications ? "warning" : "muted"}>
              {unreadNotifications} alertas
            </DashboardStatePill>
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
              {shipmentStatusOptions.map((option) => (
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
              disabled={isFetching || isMutating}
            >
              {isFetching ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Recargar
            </Button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard title="Envios activos" value={String(activeShipments.length)} support="Pendientes, listos, en transito o con revision." icon={<Route className="h-5 w-5" />} />
        <DashboardMetricCard title="Listos para despacho" value={String(readyShipments.length)} support="Requieren tracking o salida operativa." icon={<Truck className="h-5 w-5" />} />
        <DashboardMetricCard title="Con tracking" value={`${withTracking.length}/${items.length}`} support="Codigos cargados sobre el filtro actual." icon={<Search className="h-5 w-5" />} />
        <DashboardMetricCard title="Vencidos" value={String(overdueCount)} support={`Ultima actividad: ${formatDateTime(latestShipment?.updated_at || latestShipment?.created_at)}`} icon={<CalendarClock className="h-5 w-5" />} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <DashboardPanel
          title="Listado de shipments"
          description="Click en un envio para abrir instrucciones, destino y acciones permitidas."
          contentClassName="p-4 pt-0 md:p-5 md:pt-0"
        >
          {items.length ? (
            <div className="space-y-3">
              {items.map((shipment) => (
                <ShipmentRow
                  key={shipment.id}
                  shipment={shipment}
                  selected={selectedId === shipment.id}
                  onSelect={() => onSelectShipment(shipment)}
                />
              ))}
            </div>
          ) : (
            <DashboardEmptyState
              title="No hay envios para este filtro"
              description="El endpoint real no devolvio shipments visibles para el estado seleccionado."
              icon={<Search className="h-6 w-6" />}
              className="min-h-[420px]"
            />
          )}
        </DashboardPanel>

        <div className="space-y-6">
          <DashboardPanel title="Detalle y acciones" description="Tracking, despacho y paquete operativo del shipment.">
            <ShipmentDetailPanel
              shipment={selectedShipment}
              trackingCode={trackingCode}
              onTrackingCodeChange={onTrackingCodeChange}
              onSaveTracking={onSaveTracking}
              onStatusChange={onStatusChange}
              isMutating={isMutating}
            />
          </DashboardPanel>

          <NotificationList
            items={notifications}
            unread={unreadNotifications}
            onMarkRead={onMarkNotificationRead}
            onMarkAllRead={onMarkAllNotificationsRead}
            isMutating={isMutating}
          />

          <DashboardPanel title="Regla operativa" description="Frontera de esta migracion.">
            <div className="space-y-3">
              <div className="rounded-[1.15rem] border border-border/70 bg-background/70 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                Envios opera sobre shipments ya creados por checkout/pago; no crea etiquetas nuevas desde React.
              </div>
              <div className="rounded-[1.15rem] border border-border/70 bg-background/70 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                Tracking y estados avanzan con validaciones del backend compartidas con el dashboard legacy.
              </div>
            </div>
          </DashboardPanel>
        </div>
      </section>
    </div>
  );
}

export function ProviderShipmentsView() {
  const queryClient = useQueryClient();
  const { providerId } = useProviderDashboardSession();
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [trackingCode, setTrackingCode] = useState("");

  const shipmentsQuery = useQuery({
    queryKey: ["provider-dashboard", "shipments", providerId, statusFilter],
    queryFn: () => fetchProviderShipments(providerId!, statusFilter),
    enabled: providerId != null,
    staleTime: 20_000,
  });

  const notificationsQuery = useQuery({
    queryKey: ["provider-dashboard", "notifications", providerId],
    queryFn: () => fetchProviderNotifications(providerId!),
    enabled: providerId != null,
    staleTime: 20_000,
  });

  const invalidateShipments = () => {
    void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "shipments", providerId] });
    void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "notifications", providerId] });
  };

  const trackingMutation = useMutation({
    mutationFn: async () => {
      if (!providerId || !selectedId) throw new Error("No encontramos un envio valido.");
      const code = trackingCode.trim();
      if (!code) throw new Error("Cargue un codigo de tracking.");
      return updateProviderShipmentTracking(providerId, selectedId, code);
    },
    onSuccess: (payload) => {
      setTrackingCode(payload.shipment.tracking_code || "");
      toast.success("Tracking guardado");
      invalidateShipments();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No pudimos guardar el tracking.");
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      if (!providerId || !selectedId) throw new Error("No encontramos un envio valido.");
      return updateProviderShipmentStatus(providerId, selectedId, status);
    },
    onSuccess: (payload) => {
      toast.success(`Envio actualizado a ${statusMeta(payload.shipment.status).label}`);
      invalidateShipments();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No pudimos actualizar el envio.");
    },
  });

  const readNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      if (!providerId) throw new Error("No encontramos un proveedor valido.");
      return markProviderNotificationRead(providerId, notificationId);
    },
    onSuccess: () => {
      toast.success("Notificacion marcada como leida");
      invalidateShipments();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No pudimos actualizar la notificacion.");
    },
  });

  const readAllNotificationsMutation = useMutation({
    mutationFn: async () => {
      if (!providerId) throw new Error("No encontramos un proveedor valido.");
      return markAllProviderNotificationsRead(providerId);
    },
    onSuccess: () => {
      toast.success("Notificaciones marcadas como leidas");
      invalidateShipments();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No pudimos actualizar las notificaciones.");
    },
  });

  const items = useMemo(() => shipmentsQuery.data?.items || [], [shipmentsQuery.data]);
  const notifications = useMemo(() => notificationsQuery.data?.items || [], [notificationsQuery.data]);
  const unreadNotifications = Number(notificationsQuery.data?.unread) || 0;
  const selectedShipment = items.find((item) => item.id === selectedId) || null;
  const isMutating =
    trackingMutation.isPending ||
    statusMutation.isPending ||
    readNotificationMutation.isPending ||
    readAllNotificationsMutation.isPending;

  if (shipmentsQuery.error) {
    return (
      <DashboardErrorState
        title="No pudimos cargar Envios"
        description="La ruta React esta lista, pero el endpoint real de shipments no respondio correctamente."
      />
    );
  }

  if (shipmentsQuery.isLoading || (shipmentsQuery.isFetching && !shipmentsQuery.data)) {
    return (
      <DashboardLoadingState
        title="Armando envios"
        description="Estamos conectando shipments, tracking y notificaciones reales del proveedor."
      />
    );
  }

  if (!shipmentsQuery.data) {
    return (
      <DashboardEmptyState
        title="No encontramos envios"
        description="La sesion esta activa, pero no recibimos una respuesta valida para esta vista."
        icon={<AlertTriangle className="h-6 w-6" />}
      />
    );
  }

  return (
    <ShipmentsContent
      items={items}
      notifications={notifications}
      unreadNotifications={unreadNotifications}
      selectedShipment={selectedShipment}
      selectedId={selectedId}
      statusFilter={statusFilter}
      trackingCode={trackingCode}
      onStatusChange={(status) => {
        const label = statusMeta(status).label.toLowerCase();
        if (!window.confirm(`Confirmar cambio de estado a ${label}?`)) return;
        void statusMutation.mutateAsync(status);
      }}
      onRefresh={() => {
        void shipmentsQuery.refetch();
        void notificationsQuery.refetch();
      }}
      onSelectShipment={(shipment) => {
        setSelectedId(shipment.id);
        setTrackingCode(shipment.tracking_code || "");
      }}
      onTrackingCodeChange={setTrackingCode}
      onSaveTracking={() => void trackingMutation.mutateAsync()}
      onMarkNotificationRead={(id) => void readNotificationMutation.mutateAsync(id)}
      onMarkAllNotificationsRead={() => void readAllNotificationsMutation.mutateAsync()}
      isFetching={shipmentsQuery.isFetching || notificationsQuery.isFetching}
      isMutating={isMutating}
    />
  );
}
