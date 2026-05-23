import { useMemo, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  PackageCheck,
  QrCode,
  RefreshCcw,
  Send,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import {
  fetchProviderShipments,
  updateProviderShipmentStatus,
  updateProviderShipmentTracking,
} from "@/features/provider-dashboard/api";
import { DashboardPageHeader } from "@/features/provider-dashboard/components/DashboardPageHeader";
import { DashboardStatePill } from "@/features/provider-dashboard/components/DashboardStatePill";
import {
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingState,
} from "@/features/provider-dashboard/components/DashboardStates";
import { useProviderDashboardSession } from "@/features/provider-dashboard/context/ProviderDashboardSessionContext";
import { DispatchConfirmDialog, type DispatchConfirmParams } from "@/features/provider-dashboard/components/DispatchConfirmDialog";
import type { DashboardShipment } from "@/features/provider-dashboard/types";
import { cn } from "@/lib/utils";

/* ---------- status config matching envios.jsx ---------- */

const SM: Record<string, { label: string; color: string; icon: ReactNode }> = {
  ready_to_ship: {
    label: "Listo para despachar",
    color: "#f59e0b",
    icon: <PackageCheck className="h-5 w-5" />,
  },
  dispatched: {
    label: "Despachado",
    color: "#6366f1",
    icon: <Send className="h-5 w-5" />,
  },
  in_transit: {
    label: "En transito",
    color: "#3b82f6",
    icon: <Truck className="h-5 w-5" />,
  },
  delivered: {
    label: "Entregado",
    color: "#10b981",
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
};

const STATUS_STRIP_ORDER = ["ready_to_ship", "dispatched", "in_transit", "delivered"];

const methodLabels: Record<string, string> = {
  retiro_taller: "Retiro en taller",
  paqar_clasico: "PAQ.AR Clasico",
  paqar_expreso: "PAQ.AR Expreso",
};

function statusMeta(status?: string | null) {
  if (!status) return { label: "Pendiente", color: "#6b7280", icon: <Truck className="h-5 w-5" /> };
  return SM[status] ?? { label: status.replaceAll("_", " "), color: "#6b7280", icon: <Truck className="h-5 w-5" /> };
}

function methodLabel(method?: string | null) {
  if (!method) return "Sin metodo";
  return methodLabels[method] ?? method.replaceAll("_", " ");
}

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit" }).format(date);
}

function shipmentDestination(shipment: DashboardShipment) {
  return [shipment.destino_localidad, shipment.destino_provincia]
    .filter(Boolean)
    .join(", ") || "Destino no cargado";
}

/* ---------- Status strip card ---------- */

function StatusStripCard({
  statusKey,
  count,
}: {
  statusKey: string;
  count: number;
}) {
  const meta = SM[statusKey];
  if (!meta) return null;

  return (
    <div className="flex items-center gap-[10px] rounded-xl border border-[var(--c3d-card-border)] bg-[var(--c3d-card-bg)] px-4 py-3 shadow-[var(--c3d-card-shadow)]">
      <div
        className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px]"
        style={{ background: `${meta.color}14`, color: meta.color }}
      >
        {meta.icon}
      </div>
      <div>
        <p
          className="font-[Montserrat] text-[18px] font-extrabold leading-none tabular-nums"
          style={{ color: "var(--c3d-text-strong)" }}
        >
          {count}
        </p>
        <p className="mt-[3px] font-[Montserrat] text-[10px] font-semibold uppercase leading-[1.2] tracking-[0.1em] text-[var(--c3d-text-faint)]">
          {meta.label}
        </p>
      </div>
    </div>
  );
}

/* ---------- ShipmentCard matching envios.jsx ---------- */

function ShipmentCard({
  shipment,
  onDispatch,
  isMutating,
}: {
  shipment: DashboardShipment;
  onDispatch: (trackingCode: string) => void;
  isMutating: boolean;
}) {
  const meta = statusMeta(shipment.status);
  const isAction = shipment.status === "ready_to_ship";
  const [trackingInput, setTrackingInput] = useState(shipment.tracking_code || "");
  const [confirmed, setConfirmed] = useState(false);
  const deadlineStr = formatDate(shipment.fecha_limite_despacho);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[14px] bg-[var(--c3d-card-bg)] shadow-[var(--c3d-card-shadow)]",
        isAction
          ? "border border-[#fde68a]"
          : "border border-[var(--c3d-card-border)]"
      )}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-[13px]">
        {/* Icon */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px]"
          style={{ background: `${meta.color}14`, color: meta.color }}
        >
          {meta.icon}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-[Montserrat] text-[13px] font-bold leading-none text-[var(--c3d-text-strong)]">
              #{shipment.id}
            </span>
            <span className="font-[Montserrat] text-xs font-medium text-[var(--c3d-text-faint)]">
              → {shipment.public_order_id || (shipment.cotizacion_id ? `ORD-${shipment.cotizacion_id}` : "")}
            </span>
            {deadlineStr && (
              <span className="rounded-full bg-[var(--c3d-card-bg-alt)] px-[7px] py-0.5 font-[Montserrat] text-[10px] font-bold uppercase tracking-[0.05em] text-[var(--c3d-text-faint)]">
                Limite {deadlineStr}
              </span>
            )}
          </div>
          <div className="mt-[5px] flex flex-wrap gap-[14px]">
            <span className="flex items-center gap-1 font-[Montserrat] text-xs font-medium text-[var(--c3d-text-faint)]">
              <MapPin className="h-[13px] w-[13px]" />
              {shipmentDestination(shipment)}
            </span>
            <span className="flex items-center gap-1 font-[Montserrat] text-xs font-medium text-[var(--c3d-text-faint)]">
              <Truck className="h-[13px] w-[13px]" />
              {methodLabel(shipment.shipping_method)}
            </span>
            {shipment.tracking_code && (
              <span className="flex items-center gap-1 font-[Montserrat] text-xs font-semibold text-primary">
                <QrCode className="h-[13px] w-[13px]" />
                {shipment.tracking_code}
              </span>
            )}
          </div>
        </div>

        {/* Status pill */}
        <div className="shrink-0">
          <div
            className="rounded-lg px-[10px] py-[5px] font-[Montserrat] text-[11px] font-semibold"
            style={{
              background: `${meta.color}14`,
              color: meta.color,
              border: `1px solid ${meta.color}28`,
            }}
          >
            {meta.label}
          </div>
        </div>
      </div>

      {/* Action row for ready_to_ship */}
      {isAction && !confirmed && (
        <div className="border-t border-[var(--c3d-card-border-soft)] px-4 pb-[14px] pt-[11px]">
          <div className="grid grid-cols-[1fr_auto] gap-[9px]">
            <Input
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              placeholder="Numero de tracking (ej: LC123456789AR)"
              className="h-[35px] rounded-[9px] border-[var(--c3d-card-border)] bg-transparent font-[Montserrat] text-[13px] font-medium text-[var(--c3d-text-strong)] placeholder:text-[var(--c3d-text-faint)]"
            />
            <Button
              type="button"
              className="h-[35px] rounded-[10px] bg-gradient-to-r from-primary to-cyan-500 px-4 font-[Montserrat] text-[13px] font-bold text-white shadow-[0_4px_20px_hsl(220_70%_45%/0.35)] hover:opacity-90"
              onClick={() => {
                onDispatch(trackingInput);
                setConfirmed(true);
              }}
              disabled={isMutating}
            >
              {isMutating ? (
                <LoaderCircle className="mr-1.5 h-[14px] w-[14px] animate-spin" />
              ) : (
                <Send className="mr-1.5 h-[14px] w-[14px]" />
              )}
              Confirmar despacho
            </Button>
          </div>
          <p className="mt-[7px] flex items-center gap-[5px] font-[Montserrat] text-[11px] font-medium leading-[1.4] text-[var(--c3d-text-faint)]">
            <Camera className="h-3 w-3" />
            Recorda subir foto del paquete antes de confirmar el despacho.
          </p>
        </div>
      )}
    </div>
  );
}

/* ---------- Main export ---------- */

export function ProviderShipmentsView() {
  const queryClient = useQueryClient();
  const { providerId } = useProviderDashboardSession();
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchShipmentId, setDispatchShipmentId] = useState<number | null>(null);

  const shipmentsQuery = useQuery({
    queryKey: ["provider-dashboard", "shipments", providerId],
    queryFn: () => fetchProviderShipments(providerId!),
    enabled: providerId != null,
    staleTime: 20_000,
  });

  const items = useMemo(() => shipmentsQuery.data?.items || [], [shipmentsQuery.data]);

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "shipments", providerId] });
    void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "orders", providerId] });
    void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "notifications", providerId] });
  };

  const trackingMutation = useMutation({
    mutationFn: async ({ shipmentId, code }: { shipmentId: number; code: string }) => {
      if (!providerId) throw new Error("No encontramos proveedor.");
      return updateProviderShipmentTracking(providerId, shipmentId, code);
    },
    onSuccess: () => {
      toast.success("Tracking guardado");
      invalidateAll();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al guardar tracking.");
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({
      shipmentId,
      status,
      dispatchParams,
    }: {
      shipmentId: number;
      status: string;
      dispatchParams?: DispatchConfirmParams;
    }) => {
      if (!providerId) throw new Error("No encontramos proveedor.");
      return updateProviderShipmentStatus(providerId, shipmentId, status, dispatchParams);
    },
    onSuccess: () => {
      toast.success("Envio actualizado.");
      invalidateAll();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al actualizar envio.");
    },
  });

  const isMutating = trackingMutation.isPending || statusMutation.isPending;

  const readyCount = items.filter((s) => s.status === "ready_to_ship").length;

  /* ---- Loading / Error ---- */

  if (shipmentsQuery.error) {
    return (
      <DashboardErrorState
        title="No pudimos cargar Envios"
        description="El endpoint de shipments no respondio correctamente."
      />
    );
  }

  if (shipmentsQuery.isLoading || (shipmentsQuery.isFetching && !shipmentsQuery.data)) {
    return <DashboardLoadingState title="Cargando envios" description="Conectando shipments reales..." />;
  }

  if (!shipmentsQuery.data) {
    return (
      <DashboardEmptyState
        title="No encontramos envios"
        description="Sin respuesta valida del backend."
        icon={<AlertTriangle className="h-6 w-6" />}
      />
    );
  }

  function handleDispatch(shipmentId: number, trackingCode: string) {
    if (trackingCode.trim()) {
      // Save tracking first, then mark dispatched
      void trackingMutation
        .mutateAsync({ shipmentId, code: trackingCode.trim() })
        .then(() => {
          void statusMutation.mutateAsync({ shipmentId, status: "dispatched" });
        });
    } else {
      // Open dispatch confirm dialog for cases without tracking
      setDispatchShipmentId(shipmentId);
      setShowDispatchModal(true);
    }
  }

  const dispatchShipment = items.find((s) => s.id === dispatchShipmentId) || null;

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* --- PageHeader --- */}
        <DashboardPageHeader
          variant="dark"
          eyebrow="LOGISTICA OPERATIVA"
          title="Mis envios"
          description="Seguimiento de despachos activos. Confirma cada envio con numero de tracking."
          metaPills={
            <>
              {readyCount > 0 && (
                <DashboardStatePill tone="warning">
                  {readyCount} listo/s para despachar
                </DashboardStatePill>
              )}
              <DashboardStatePill tone="info">
                {items.length} envios activos
              </DashboardStatePill>
              {shipmentsQuery.isFetching && (
                <DashboardStatePill tone="warning">Actualizando</DashboardStatePill>
              )}
            </>
          }
          actions={
            <Button
              type="button"
              variant="outline"
              className="h-[38px] rounded-[10px] border-white/15 bg-white/10 px-4 font-[Montserrat] text-[13px] font-semibold text-white hover:bg-white/20"
              onClick={() => void shipmentsQuery.refetch()}
              disabled={shipmentsQuery.isFetching}
            >
              {shipmentsQuery.isFetching ? (
                <LoaderCircle className="mr-1.5 h-[15px] w-[15px] animate-spin" />
              ) : (
                <RefreshCcw className="mr-1.5 h-[15px] w-[15px]" />
              )}
              Recargar
            </Button>
          }
        />

        {/* --- Status strip (4 cols) --- */}
        <section className="grid grid-cols-4 gap-[11px]">
          {STATUS_STRIP_ORDER.map((key) => (
            <StatusStripCard
              key={key}
              statusKey={key}
              count={items.filter((s) => s.status === key).length}
            />
          ))}
        </section>

        {/* --- Shipment cards --- */}
        <section className="flex flex-col gap-[9px]">
          {items.length ? (
            items.map((shipment) => (
              <ShipmentCard
                key={shipment.id}
                shipment={shipment}
                onDispatch={(trackingCode) =>
                  handleDispatch(shipment.id, trackingCode)
                }
                isMutating={isMutating}
              />
            ))
          ) : (
            <DashboardEmptyState
              title="No hay envios"
              description="Todavia no hay shipments creados para tu cuenta."
              icon={<Truck className="h-6 w-6" />}
              className="min-h-[200px]"
            />
          )}
        </section>
      </div>

      <DispatchConfirmDialog
        open={showDispatchModal}
        onOpenChange={setShowDispatchModal}
        orderId={dispatchShipment?.cotizacion_id ?? dispatchShipment?.id}
        isPickup={dispatchShipment?.shipping_method === "retiro_taller"}
        hasTracking={!!dispatchShipment?.tracking_code}
        isSubmitting={statusMutation.isPending}
        onConfirm={(params) => {
          setShowDispatchModal(false);
          if (dispatchShipmentId) {
            void statusMutation.mutateAsync({
              shipmentId: dispatchShipmentId,
              status: "dispatched",
              dispatchParams: params,
            });
          }
        }}
      />
    </>
  );
}
