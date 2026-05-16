import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  BadgeX,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileArchive,
  LoaderCircle,
  Mail,
  MapPinned,
  PackageOpen,
  Phone,
  Printer,
  RefreshCcw,
  Search,
  Star,
  Truck,
  Upload,
  WalletCards,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import {
  cancelProviderOrder,
  dispatchProviderOrder,
  fetchProviderOrderDetail,
  fetchProviderOrders,
  markProviderOrderPrinting,
  markProviderOrderReadyToShip,
  requestProviderOrderReview,
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
import { DispatchConfirmDialog, type DispatchConfirmParams } from "@/features/provider-dashboard/components/DispatchConfirmDialog";
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
  if (!status) return { label: "Pendiente", tone: "muted" as const };
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

function sameDateTime(a?: string | null, b?: string | null) {
  if (!a || !b) return false;
  const left = new Date(a).getTime();
  const right = new Date(b).getTime();
  return Number.isFinite(left) && Number.isFinite(right) && left === right;
}

function formatCount(value?: number | null) {
  return new Intl.NumberFormat("es-AR").format(Number(value) || 0);
}

function safeText(value?: string | number | null, fallback = "Sin dato") {
  if (value == null || value === "") return fallback;
  return String(value);
}

function parseDeliveryAddress(value?: DashboardOrder["delivery_address_json"]) {
  if (!value) return "NO ACREDITA DIRECCIÓN";
  if (typeof value === "object") {
    const raw = value.raw;
    return typeof raw === "string" && raw.trim() ? raw : "NO ACREDITA DIRECCIÓN";
  }
  const trimmed = value.trim();
  if (!trimmed) return "NO ACREDITA DIRECCIÓN";
  try {
    const parsed = JSON.parse(trimmed) as { raw?: unknown };
    return typeof parsed.raw === "string" && parsed.raw.trim() ? parsed.raw : "NO ACREDITA DIRECCIÓN";
  } catch {
    return trimmed;
  }
}

function orderDate(order: DashboardOrder) {
  return order.updated_at || order.confirmed_at || order.created_at || null;
}

function timelineRows(order: DashboardOrder) {
  const rows: Array<{ label: string; value?: string | null; icon?: ReactNode }> = [
    { label: "Confirmado", value: order.confirmed_at, icon: <CalendarCheck className="h-3.5 w-3.5" /> },
  ];
  if (!sameDateTime(order.created_at, order.confirmed_at)) {
    rows.push({ label: "Creado", value: order.created_at });
  }
  if (!sameDateTime(order.updated_at, order.confirmed_at) && !sameDateTime(order.updated_at, order.created_at)) {
    rows.push({ label: "Actualizado", value: order.updated_at });
  }
  if (order.cancelled_at) {
    rows.push({ label: "Cancelado", value: order.cancelled_at, icon: <AlertTriangle className="h-3.5 w-3.5" /> });
  }
  return rows;
}

function preferredOrderFile(files: DashboardOrder["files"], kind: "stl" | "gcode") {
  const items = files || [];
  if (kind === "gcode") {
    return items.find((item) => item.file_type === "gcode") || null;
  }
  return (
    items.find((item) => item.file_type === "stl_original") ||
    items.find((item) => item.file_type === "stl_rotado") ||
    null
  );
}

function OrderFileCard({
  title,
  file,
}: {
  title: string;
  file?: DashboardOrder["files"] extends Array<infer T> ? T | null : never;
}) {
  if (!file) {
    return (
      <div className="rounded-[1rem] border border-dashed border-border/80 bg-white px-4 py-4 text-sm text-muted-foreground">
        {title} no disponible.
      </div>
    );
  }

  return (
    <div className="rounded-[1rem] border border-border/70 bg-white p-4">
      <div className="overflow-hidden rounded-[0.9rem] border border-border/70 bg-muted/30">
        {file.thumbnail_url ? (
          <img
            src={file.thumbnail_url}
            alt={file.label || title}
            className="h-40 w-full object-cover"
          />
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Sin thumbnail
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 break-all text-xs text-muted-foreground">
          {safeText(file.filename || file.file_path, "Sin archivo")}
        </p>
        {file.url ? (
          <a
            href={file.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            Abrir archivo
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : null}
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
  onRequestCancel,
  onRequestReview,
  isRequestingReview,
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
  onRequestCancel: () => void;
  onRequestReview: () => void;
  isRequestingReview: boolean;
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
  const stlFile = preferredOrderFile(files, "stl");
  const gcodeFile = preferredOrderFile(files, "gcode");
  const canMarkPrinting = ["paid_confirmed", "preparing"].includes(String(order.order_status || ""));
  const canReadyToShip = ["in_production"].includes(String(order.order_status || ""));
  const canDispatch = ["ready_to_ship", "listo_para_envio"].includes(String(order.order_status || ""));
  const canCancel = !["cancelled", "completed"].includes(String(order.order_status || ""));
  const _s = String(order.order_status || "");
  const step1Done = ["in_production", "ready_to_ship", "listo_para_envio", "en_transito", "completed"].includes(_s);
  const step2Done = ["ready_to_ship", "listo_para_envio", "en_transito", "completed"].includes(_s);
  const step3Done = ["en_transito", "completed"].includes(_s);
  const showActionRow = _s !== "cancelled";

  return (
    <div className="space-y-4">
      <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-[Montserrat] text-lg font-bold tracking-tight text-foreground">
              {order.public_order_id ? order.public_order_id : `Pedido #${order.id}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <DashboardStatePill tone={orderStatus.tone}>{orderStatus.label}</DashboardStatePill>
            {_s === "cancelled" ? (
              <DashboardStatePill tone={paymentStatus.tone}>Pago {paymentStatus.label}</DashboardStatePill>
            ) : null}
          </div>
        </div>
        {showActionRow ? (
          <div className="mt-5 flex items-stretch gap-4">
            {/* Pasos — columna izquierda */}
            <div className="flex flex-1 flex-col">

              {/* Paso 1 */}
              <div className="flex items-center gap-3">
                {step1Done ? (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                ) : (
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${canMarkPrinting ? "border-2 border-primary bg-primary/10 text-primary" : "border border-muted/50 bg-muted/20 text-muted-foreground/50"}`}>
                    1
                  </span>
                )}
                {step1Done ? (
                  <span className="text-sm font-medium text-muted-foreground">Impresión iniciada</span>
                ) : canMarkPrinting ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-xl border-primary/30 bg-primary/[0.06] px-3 text-sm text-primary hover:bg-primary/[0.10]"
                    onClick={onMarkPrinting}
                    disabled={isMarkingPrinting}
                  >
                    {isMarkingPrinting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <img src="/icons/3d-printer.webp" alt="" className="h-4 w-4" />}
                    Iniciar impresión
                  </Button>
                ) : (
                  <button
                    type="button"
                    className="h-9 rounded-xl border border-muted/40 bg-transparent px-3 text-sm text-muted-foreground/50"
                    onClick={() => toast.info("Este paso ya fue completado.")}
                  >
                    Iniciar impresión
                  </button>
                )}
              </div>

              {/* Conector 1→2 */}
              <div className="ml-[17px] h-4 w-px bg-border/60" />

              {/* Paso 2 */}
              <div className="flex items-center gap-3">
                {step2Done ? (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                ) : (
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${canReadyToShip ? "border-2 border-primary bg-primary/10 text-primary" : "border border-muted/50 bg-muted/20 text-muted-foreground/50"}`}>
                    2
                  </span>
                )}
                {step2Done ? (
                  <span className="text-sm font-medium text-muted-foreground">Fotos subidas</span>
                ) : canReadyToShip ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-xl border-primary/30 bg-primary/[0.06] px-3 text-sm text-primary hover:bg-primary/[0.10]"
                    onClick={onOpenReadyToShip}
                    disabled={isReadyingToShip}
                  >
                    {isReadyingToShip ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Subir fotos
                  </Button>
                ) : (
                  <button
                    type="button"
                    className="h-9 rounded-xl border border-muted/40 bg-transparent px-3 text-sm text-muted-foreground/50"
                    onClick={() => toast.info(!step1Done ? "Primero tenés que iniciar la impresión (Paso 1)." : "Este paso ya fue completado.")}
                  >
                    Subir fotos
                  </button>
                )}
              </div>

              {/* Conector 2→3 */}
              <div className="ml-[17px] h-4 w-px bg-border/60" />

              {/* Paso 3 */}
              <div className="flex items-center gap-3">
                {step3Done ? (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                ) : (
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${canDispatch ? "border-2 border-primary bg-primary/10 text-primary" : "border border-muted/50 bg-muted/20 text-muted-foreground/50"}`}>
                    3
                  </span>
                )}
                {step3Done ? (
                  <span className="text-sm font-medium text-muted-foreground">Despacho confirmado</span>
                ) : canDispatch ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-xl border-primary/30 bg-primary/[0.06] px-3 text-sm text-primary hover:bg-primary/[0.10]"
                    onClick={onDispatch}
                    disabled={isDispatching}
                  >
                    {isDispatching ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                    Confirmar despacho
                  </Button>
                ) : (
                  <button
                    type="button"
                    className="h-9 rounded-xl border border-muted/40 bg-transparent px-3 text-sm text-muted-foreground/50"
                    onClick={() => toast.info(!step2Done ? "Primero tenés que subir las fotos y confirmar (Paso 2)." : "Este paso ya fue completado.")}
                  >
                    Confirmar despacho
                  </button>
                )}
              </div>
            </div>

            {/* Acciones — columna derecha, centrado vertical respecto a los 3 pasos */}
            <div className="flex flex-col items-center justify-center gap-2">
              {canCancel ? (
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 rounded-xl border-rose-200 bg-rose-50 px-3 text-sm text-rose-700 hover:bg-rose-100"
                  onClick={onRequestCancel}
                >
                  <BadgeX className="h-4 w-4" />
                  Cancelar pedido
                </Button>
              ) : null}
              {(() => {
                const reviewStatus = String(order.review_reminder_status || "none");
                const reviewAlreadySent = ["sent", "sending"].includes(reviewStatus);
                const canReview = step3Done && !reviewAlreadySent;
                return (
                  <Button
                    type="button"
                    className={`h-9 rounded-xl px-4 text-sm font-semibold ${
                      reviewAlreadySent
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700 cursor-default"
                        : canReview
                        ? "bg-emerald-500 text-white shadow-sm hover:bg-emerald-600"
                        : "border border-muted/40 bg-transparent text-muted-foreground/50 cursor-not-allowed"
                    }`}
                    onClick={onRequestReview}
                    disabled={!canReview || isRequestingReview}
                  >
                    {isRequestingReview ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : reviewAlreadySent ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Star className="h-4 w-4" />
                    )}
                    {reviewAlreadySent ? "Review solicitada" : "Solicitar Review"}
                  </Button>
                );
              })()}
            </div>
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
        {order.shipment_tracking_code ? (
          <a
            href={`https://www.correoargentino.com.ar/formularios/e-commerce?codigo=${encodeURIComponent(order.shipment_tracking_code)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-[1rem] border border-blue-200 bg-blue-50 p-3 text-left transition-colors hover:bg-blue-100"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600">
              <PackageOpen className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-700">Tracking Correo</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-blue-800">{order.shipment_tracking_code}</p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-blue-500" />
          </a>
        ) : null}
        <DetailRow label="Direccion" value={parseDeliveryAddress(order.delivery_address_json)} icon={<MapPinned className="h-3.5 w-3.5" />} />
        {timelineRows(order).map((item) => (
          <DetailRow key={item.label} label={item.label} value={formatDateTime(item.value)} icon={item.icon} />
        ))}
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
            <p className="text-sm font-semibold text-foreground">Archivos del pedido</p>
            <p className="mt-1 text-sm text-muted-foreground">STL y GCODE disponibles para fabricar esta orden confirmada.</p>
          </div>
          <DashboardStatePill tone={files.length ? "success" : "muted"}>{files.length} archivos</DashboardStatePill>
        </div>
        {files.length ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <OrderFileCard title="Thumbnail del STL" file={stlFile} />
            <OrderFileCard title="Thumbnail del GCODE" file={gcodeFile} />
          </div>
        ) : (
          <div className="mt-4 rounded-[1rem] border border-dashed border-border/80 bg-white px-4 py-3 text-sm text-muted-foreground">
            Todavia no hay archivos cargados para este pedido.
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
  onCancel,
}: {
  order: DashboardOrder;
  selected: boolean;
  onSelect: () => void;
  onCancel: () => void;
}) {
  const orderStatus = orderMeta(order.order_status);
  const paymentStatus = paymentMeta(order.payment_status);
  const canCancel = !["cancelled", "completed"].includes(String(order.order_status || ""));

  return (
    <DashboardDataRow
      onClick={onSelect}
      selected={selected}
      columnsClassName="lg:grid-cols-[0.72fr_0.8fr_0.82fr_1.05fr_0.85fr_0.8fr_0.24fr]"
    >
      <DashboardDataValue label="Pedido">
        <p className="text-sm font-semibold text-foreground">
          {order.public_order_id || `#${order.id}`}
        </p>
      </DashboardDataValue>
      <DashboardDataValue label="Estado" className="flex flex-col items-start">
        <DashboardStatePill tone={orderStatus.tone}>{orderStatus.label}</DashboardStatePill>
      </DashboardDataValue>
      <DashboardDataValue label="Pago" className="flex flex-col items-start">
        {order.order_status === "cancelled" ? (
          <DashboardStatePill tone={paymentStatus.tone}>{paymentStatus.label}</DashboardStatePill>
        ) : (
          <span className="text-xs text-muted-foreground">Aprobado</span>
        )}
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
      <DashboardDataValue label="">
        {canCancel ? (
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 transition-colors hover:bg-rose-100"
            onClick={(event) => {
              event.stopPropagation();
              onCancel();
            }}
            aria-label={`Cancelar pedido ${order.id}`}
          >
            <BadgeX className="h-4 w-4" />
          </button>
        ) : null}
      </DashboardDataValue>
    </DashboardDataRow>
  );
}

function CancelOrderDialog({
  order,
  reason,
  onReasonChange,
  onCancel,
  onConfirm,
  isSubmitting,
}: {
  order: DashboardOrder | null;
  reason: string;
  onReasonChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}) {
  return (
    <Dialog open={Boolean(order)} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-xl rounded-[1.5rem] border-rose-200">
        <DialogHeader>
          <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle>Cancelar pedido {order ? `#${order.id}` : ""}</DialogTitle>
          <DialogDescription className="space-y-2 pt-2 text-left">
            <span className="block">
              Estás por cancelar este pedido. El pedido quedará en estado cancelado, vamos a solicitar el refund por Mercado Pago y el{" "}
              <strong className="font-semibold text-foreground">cliente recibirá un email avisando la cancelación.</strong>
            </span>
            <span className="block">
              Es obligatorio escribir el motivo. Lo que escribas acá se le enviará al cliente por email.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-relaxed text-rose-800">
            Impacto: se intenta revertir el cobro, se cierra la operación para este proveedor y el cliente recibe una comunicación inmediata.
          </div>
          <div className="space-y-1">
            <Textarea
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder="Explicá en detalle por qué cancelás este pedido. Sé claro y descriptivo, ya que este texto se envía directamente al cliente."
              className="min-h-[144px] rounded-2xl border-rose-200 bg-white"
            />
            <p className={`text-right text-xs ${reason.trim().length < 30 ? "text-rose-500" : "text-muted-foreground"}`}>
              {reason.trim().length} / 30 caracteres mínimos
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-border/80 bg-white px-4 text-foreground hover:bg-muted"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Volver
          </Button>
          <Button
            type="button"
            className="h-10 rounded-xl bg-rose-600 px-4 text-white hover:bg-rose-700"
            onClick={onConfirm}
            disabled={isSubmitting || reason.trim().length < 30}
          >
            {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <BadgeX className="h-4 w-4" />}
            Confirmar cancelacion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
      <div
        onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => { event.preventDefault(); setIsDragging(false); handleFiles(event.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-[1rem] border-2 border-dashed px-5 py-8 text-center transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-border/80 bg-background/40 hover:border-primary/50 hover:bg-primary/[0.02]"
        }`}
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/[0.08]">
          <Upload className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm font-medium text-foreground">
          Arrastra las fotos acá o hacé clic para seleccionarlas
        </p>
        <p className="mt-2 text-xs text-muted-foreground">JPG, PNG o WEBP</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={(event) => { handleFiles(event.target.files); event.currentTarget.value = ""; }}
        />
      </div>

      {files.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <button
              key={`${file.name}-${file.size}-${file.lastModified}`}
              type="button"
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-border/80 bg-background px-3 py-2 text-xs text-foreground"
              onClick={(e) => { e.stopPropagation(); onRemoveFile(index); }}
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
          Finalizar carga de fotos
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
  onRequestCancelOrder,
  cancellingOrder,
  cancellationReason,
  onCancellationReasonChange,
  onCloseCancellation,
  onConfirmCancellation,
  isCancelling,
  onRequestReview,
  isRequestingReview,
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
  onRequestCancelOrder: (order: DashboardOrder) => void;
  cancellingOrder: DashboardOrder | null;
  cancellationReason: string;
  onCancellationReasonChange: (value: string) => void;
  onCloseCancellation: () => void;
  onConfirmCancellation: () => void;
  isCancelling: boolean;
  onRequestReview: () => void;
  isRequestingReview: boolean;
}) {
  const activeOrders = items.filter((item) => !["completed", "cancelled"].includes(String(item.order_status || "")));
  const completedOrders = items.filter((item) => item.order_status === "completed");
  const filesCount = items.reduce((sum, item) => sum + (Number(item.files_count) || 0), 0);
  const lastOrder = items[0];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        variant="dark"
        eyebrow="GESTIÓN OPERATIVA"
        title="Pedidos confirmados"
        description="Operaciones reales con cliente, entrega y archivos. El backend ya confirmo cada uno de estos pedidos."
        metaPills={
          <>
            <DashboardStatePill tone={items.length ? "info" : "muted"}>{items.length} pedidos</DashboardStatePill>
            <DashboardStatePill tone={activeOrders.length ? "warning" : "success"}>{activeOrders.length} abiertos</DashboardStatePill>
            {isFetching ? <DashboardStatePill tone="warning">Actualizando</DashboardStatePill> : null}
          </>
        }
        lastSync="en tiempo real"
        actions={
          <>
            <select
              value={statusFilter}
              onChange={(event) => onStatusChange(event.target.value)}
              className="h-10 rounded-xl border border-white/15 bg-white/10 px-3 text-sm text-white outline-none"
            >
              {orderStatusOptions.map((option) => (
                <option key={option.value || "all"} value={option.value} className="text-foreground bg-white">
                  {option.label}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl border-white/15 bg-white/10 px-4 text-white hover:bg-white/20"
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
        <DashboardMetricCard
          title="Pedidos abiertos"
          value={String(activeOrders.length)}
          support="Pendientes de produccion, entrega o cierre."
          icon={<PackageOpen className="h-5 w-5" />}
          trend={{ direction: activeOrders.length > 0 ? "up" : "flat", text: `${activeOrders.length} en curso` }}
          sparkline={[60, 50, 65, 55, 70, 60, activeOrders.length > 0 ? 80 : 65]}
          isHot={activeOrders.length > 0}
        />
        <DashboardMetricCard
          title="Completados"
          value={String(completedOrders.length)}
          support="Pedidos cerrados en la vista actual."
          icon={<CheckCircle2 className="h-5 w-5" />}
          trend={{ direction: completedOrders.length > 0 ? "up" : "flat", text: `${completedOrders.length} cerrados` }}
          sparkline={[30, 40, 50, 45, 60, 65, 70]}
        />
        <DashboardMetricCard
          title="Archivos visibles"
          value={String(filesCount)}
          support="STL/GCODE disponibles para operar."
          icon={<FileArchive className="h-5 w-5" />}
          trend={{ direction: filesCount > 0 ? "up" : "flat", text: `${filesCount} archivos` }}
          sparkline={[20, 35, 40, 55, 60, 70, 75]}
        />
        <DashboardMetricCard
          title="Ultima actividad"
          value={lastOrder ? formatDateTime(orderDate(lastOrder)).split(",")[0] : "Sin datos"}
          support="Segun el filtro aplicado."
          icon={<ClipboardList className="h-5 w-5" />}
          trend={{ direction: "flat", text: "Filtro actual" }}
          sparkline={[50, 55, 50, 60, 55, 65, 60]}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <DashboardPanel
          title="Listado de Pedidos"
          description="Click en un pedido para abrir cliente, entrega y archivos."
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
                  onCancel={() => onRequestCancelOrder(order)}
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
              onRequestCancel={() => selectedOrder && onRequestCancelOrder(selectedOrder)}
              onRequestReview={onRequestReview}
              isRequestingReview={isRequestingReview}
            />
          </DashboardPanel>
        </div>
      </section>

      <CancelOrderDialog
        order={cancellingOrder}
        reason={cancellationReason}
        onReasonChange={onCancellationReasonChange}
        onCancel={onCloseCancellation}
        onConfirm={onConfirmCancellation}
        isSubmitting={isCancelling}
      />
    </div>
  );
}

export function ProviderOrdersView() {
  const queryClient = useQueryClient();
  const { providerId } = useProviderDashboardSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const param = searchParams.get("pedido_id");
    return param ? Number(param) : null;
  });
  const [showReadyToShipComposer, setShowReadyToShipComposer] = useState(false);
  const [readyToShipFiles, setReadyToShipFiles] = useState<File[]>([]);
  const [cancellingOrder, setCancellingOrder] = useState<DashboardOrder | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [showPrintingConfirm, setShowPrintingConfirm] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);

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

  // Limpia el query param pedido_id de la URL una vez que el pedido quedó seleccionado
  useEffect(() => {
    if (selectedId != null && searchParams.has("pedido_id")) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("pedido_id");
        return next;
      }, { replace: true });
    }
  }, [selectedId, searchParams, setSearchParams]);

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
    mutationFn: async (params: DispatchConfirmParams) => {
      if (!selectedId) throw new Error("Elegí un pedido para confirmar despacho.");
      return dispatchProviderOrder(selectedId, params);
    },
    onSuccess: (payload) => {
      const isPickup = selectedOrder?.delivery_method === "retiro_taller";
      const wasMoto = payload.product_type === "motorcycle";
      toast.success(
        isPickup
          ? payload.email_sent
            ? "Pedido marcado como listo para retirar. Email enviado al cliente."
            : "Pedido marcado como listo para retirar."
          : wasMoto
          ? payload.email_sent
            ? "Despacho por moto confirmado. Email enviado al cliente."
            : "Despacho por moto confirmado."
          : payload.email_sent
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

  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!selectedId) throw new Error("Elegí un pedido para solicitar review.");
      return requestProviderOrderReview(selectedId);
    },
    onSuccess: (payload) => {
      if (payload.sent) {
        toast.success("Solicitud de review enviada al cliente.");
      } else if (payload.reason === "already_sent") {
        toast.info("Ya se envió una solicitud de review para este pedido.");
      } else if (payload.reason === "review_already_exists") {
        toast.info("El cliente ya dejó una review para este pedido.");
      } else {
        toast.warning("No se pudo enviar la solicitud. Intentá de nuevo más tarde.");
      }
      void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "orders", providerId] });
      void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "order-detail", providerId] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No pudimos enviar la solicitud de review.");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!cancellingOrder || providerId == null) throw new Error("Elegi un pedido para cancelar.");
      return cancelProviderOrder(providerId, cancellingOrder.id, cancellationReason.trim());
    },
    onSuccess: (payload) => {
      setCancellingOrder(null);
      setCancellationReason("");
      toast.success(
        payload.refund?.success
          ? "Pedido cancelado. Refund solicitado, email enviado y review programada."
          : "Pedido cancelado."
      );
      void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "orders", providerId] });
      void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "order-detail", providerId] });
      void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "shipments", providerId] });
      void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "notifications", providerId] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No pudimos cancelar el pedido.");
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
    <>
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
        setShowPrintingConfirm(true);
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
        void readyToShipMutation.mutateAsync();
      }}
      onDispatchSelected={() => {
        if (!selectedOrder) return;
        setShowDispatchModal(true);
      }}
      isFetching={ordersQuery.isFetching}
      isMarkingPrinting={printingMutation.isPending}
      isReadyingToShip={readyToShipMutation.isPending}
      isDispatching={dispatchMutation.isPending}
      onRequestCancelOrder={(order) => {
        setCancellingOrder(order);
        setCancellationReason("");
      }}
      cancellingOrder={cancellingOrder}
      cancellationReason={cancellationReason}
      onCancellationReasonChange={setCancellationReason}
      onCloseCancellation={() => {
        if (cancelMutation.isPending) return;
        setCancellingOrder(null);
        setCancellationReason("");
      }}
      onConfirmCancellation={() => {
        if (!cancellingOrder) return;
        if (cancellationReason.trim().length < 30) {
          toast.error("El motivo debe tener al menos 30 caracteres.");
          return;
        }
        void cancelMutation.mutateAsync();
      }}
      isCancelling={cancelMutation.isPending}
      onRequestReview={() => {
        if (!selectedOrder) return;
        void reviewMutation.mutateAsync();
      }}
      isRequestingReview={reviewMutation.isPending}
    />

    <DispatchConfirmDialog
      open={showDispatchModal}
      onOpenChange={setShowDispatchModal}
      orderId={selectedOrder?.id}
      isPickup={selectedOrder?.delivery_method === "retiro_taller"}
      hasTracking={!!(selectedOrder as (DashboardOrder & { shipment_tracking_code?: string | null }) | null)?.shipment_tracking_code}
      isSubmitting={dispatchMutation.isPending}
      onConfirm={(params) => {
        setShowDispatchModal(false);
        void dispatchMutation.mutateAsync(params);
      }}
    />

    <Dialog open={showPrintingConfirm} onOpenChange={setShowPrintingConfirm}>
      <DialogContent className="max-w-md rounded-2xl border-border/60 bg-background p-0">
        <DialogHeader className="space-y-3 px-6 pt-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10">
            <img src="/icons/3d-printer.webp" alt="" className="h-8 w-8" />
          </div>
          <DialogTitle className="text-center font-[Montserrat] text-lg font-bold tracking-tight">
            Iniciar impresión
          </DialogTitle>
          <DialogDescription className="text-center text-sm leading-relaxed text-muted-foreground">
            {selectedOrder
              ? `Al confirmar, el pedido #${selectedOrder.id} pasará a estado "En producción" y se le enviará un email al cliente avisándole que su trabajo comenzó a imprimirse.`
              : "Confirmar inicio de impresión."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-3 px-6 pb-6 pt-4 sm:justify-center">
          <Button
            type="button"
            variant="outline"
            className="h-10 flex-1 rounded-xl"
            onClick={() => setShowPrintingConfirm(false)}
            disabled={printingMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="h-10 flex-1 rounded-xl bg-gradient-primary text-primary-foreground shadow-cta hover:opacity-95"
            onClick={() => {
              setShowPrintingConfirm(false);
              void printingMutation.mutateAsync();
            }}
            disabled={printingMutation.isPending}
          >
            {printingMutation.isPending ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <img src="/icons/3d-printer.webp" alt="" className="mr-2 h-4 w-4" />
            )}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
