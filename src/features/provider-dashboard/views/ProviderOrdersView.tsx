import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BadgeX,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Download,
  ExternalLink,
  FileText,
  LoaderCircle,
  PackageOpen,
  Printer,
  RefreshCcw,
  Truck,
  Upload,
  Star,
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
import { DashboardStatePill } from "@/features/provider-dashboard/components/DashboardStatePill";
import {
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingState,
} from "@/features/provider-dashboard/components/DashboardStates";
import { useProviderDashboardSession } from "@/features/provider-dashboard/context/ProviderDashboardSessionContext";
import { DispatchConfirmDialog, type DispatchConfirmParams } from "@/features/provider-dashboard/components/DispatchConfirmDialog";
import type { DashboardOrder } from "@/features/provider-dashboard/types";
import { cn } from "@/lib/utils";

/* ---------- status config matching pedidos.jsx ---------- */

const ST: Record<
  string,
  { label: string; color: string; bg: string; icon: ReactNode; next: string | null }
> = {
  paid_confirmed: {
    label: "Confirmado",
    color: "#3b82f6",
    bg: "#3b82f614",
    icon: <CheckCircle2 className="h-5 w-5" />,
    next: "Iniciar produccion",
  },
  in_production: {
    label: "En produccion",
    color: "#f59e0b",
    bg: "#f59e0b14",
    icon: <Printer className="h-5 w-5" />,
    next: "Marcar listo",
  },
  ready_to_ship: {
    label: "Listo p/ despachar",
    color: "#10b981",
    bg: "#10b98114",
    icon: <PackageOpen className="h-5 w-5" />,
    next: "Despachar",
  },
  en_transito: {
    label: "Despachado",
    color: "#6366f1",
    bg: "#6366f114",
    icon: <Truck className="h-5 w-5" />,
    next: null,
  },
  completed: {
    label: "Completado",
    color: "#10b981",
    bg: "#10b98114",
    icon: <CheckCircle2 className="h-5 w-5" />,
    next: null,
  },
  cancelled: {
    label: "Cancelado",
    color: "#ef4444",
    bg: "#ef444414",
    icon: <BadgeX className="h-5 w-5" />,
    next: null,
  },
};

const PIPELINE_STEPS = [
  { ids: ["paid_confirmed"], label: "Confirmados", icon: <CheckCircle2 className="h-[17px] w-[17px]" /> },
  { ids: ["in_production"], label: "En produccion", icon: <Printer className="h-[17px] w-[17px]" /> },
  { ids: ["ready_to_ship"], label: "Listos", icon: <PackageOpen className="h-[17px] w-[17px]" /> },
  { ids: ["en_transito", "completed"], label: "Despachados", icon: <Truck className="h-[17px] w-[17px]" /> },
];

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDateTime(value?: string | null) {
  if (!value) return "Sin registro";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin registro";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function safeText(value?: string | number | null, fallback = "Sin dato") {
  if (value == null || value === "") return fallback;
  return String(value);
}

function orderProgress(status?: string | null) {
  const map: Record<string, number> = {
    paid_confirmed: 18,
    in_production: 42,
    ready_to_ship: 65,
    en_transito: 82,
    completed: 100,
  };
  return map[status || ""] ?? 20;
}

function slaColor(days: number | null): string | null {
  if (days == null || days === 0) return null;
  if (days <= 1) return "#ef4444";
  if (days <= 2) return "#f59e0b";
  return "#10b981";
}

function computeSLADays(order: DashboardOrder): number | null {
  if (!order.fecha_entrega_estimada) return null;
  const deadline = new Date(order.fecha_entrega_estimada);
  if (Number.isNaN(deadline.getTime())) return null;
  const now = new Date();
  const diff = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
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

/* ---------- ProgressBar ---------- */

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1 w-[180px] overflow-hidden rounded-full bg-[var(--c3d-card-border)]">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  );
}

/* ---------- OrderCard matching pedidos.jsx ---------- */

function OrderCard({
  order,
  onAction,
  isActioning,
}: {
  order: DashboardOrder;
  onAction: (action: "printing" | "ready" | "dispatch" | "cancel") => void;
  isActioning: boolean;
}) {
  const [open, setOpen] = useState(false);
  const status = order.order_status || "paid_confirmed";
  const meta = ST[status] || ST.paid_confirmed;
  const prog = orderProgress(status);
  const slaDays = computeSLADays(order);
  const slaClr = slaColor(slaDays);

  return (
    <div
      className="overflow-hidden rounded-[14px] border border-[var(--c3d-card-border)] bg-[var(--c3d-card-bg)] shadow-[var(--c3d-card-shadow)] transition-shadow hover:shadow-md"
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-[13px]">
        {/* Status icon */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px]"
          style={{ background: meta.bg, color: meta.color }}
        >
          {meta.icon}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-[7px]">
            <span className="font-[Montserrat] text-[13px] font-bold leading-none text-[var(--c3d-text-strong)]">
              {order.public_order_id || `#${order.id}`}
            </span>
            <span className="font-[Montserrat] text-xs font-medium text-[var(--c3d-text-muted)]">
              {safeText(order.client_name, "")}
              {order.delivery_method ? ` - ${order.delivery_method.replaceAll("_", " ")}` : ""}
            </span>
          </div>
          <div className="mt-[7px]">
            <ProgressBar value={prog} color={meta.color} />
          </div>
        </div>

        {/* Right side: SLA + price + status + action + expand */}
        <div className="flex shrink-0 items-center gap-[9px]">
          {slaClr && slaDays != null && (
            <div
              className="rounded-[7px] px-[9px] py-1 font-[Montserrat] text-[11px] font-bold"
              style={{
                background: `${slaClr}14`,
                border: `1px solid ${slaClr}28`,
                color: slaClr,
              }}
            >
              SLA: {slaDays}d
            </div>
          )}

          <span className="font-[Montserrat] text-sm font-extrabold tabular-nums text-[var(--c3d-text-strong)]">
            {/* No tenemos precio por orden en el tipo actual — mostramos files_count */}
          </span>

          <div
            className="whitespace-nowrap rounded-lg px-[10px] py-1 font-[Montserrat] text-[11px] font-semibold"
            style={{
              background: meta.bg,
              color: meta.color,
              border: `1px solid ${meta.color}28`,
            }}
          >
            {meta.label}
          </div>

          {meta.next && (
            <Button
              type="button"
              className="h-[34px] rounded-[10px] bg-gradient-to-r from-primary to-cyan-500 px-3 font-[Montserrat] text-[12px] font-bold text-white shadow-[0_4px_20px_hsl(220_70%_45%/0.35)] hover:opacity-90"
              onClick={(e) => {
                e.stopPropagation();
                if (status === "paid_confirmed") onAction("printing");
                else if (status === "in_production") onAction("ready");
                else if (status === "ready_to_ship") onAction("dispatch");
              }}
              disabled={isActioning}
            >
              {isActioning ? (
                <LoaderCircle className="h-3 w-3 animate-spin" />
              ) : null}
              {meta.next}
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          )}

          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="p-1 text-[var(--c3d-text-faint)] hover:text-[var(--c3d-text-strong)]"
          >
            {open ? (
              <ChevronUp className="h-[19px] w-[19px]" />
            ) : (
              <ChevronDown className="h-[19px] w-[19px]" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable detail row */}
      {open && (
        <div className="flex items-center gap-5 border-t border-[var(--c3d-card-border-soft)] bg-[var(--c3d-card-bg-alt)] px-4 py-[11px]">
          <span className="flex items-center gap-1.5 font-[Montserrat] text-xs font-medium text-[var(--c3d-text-faint)]">
            <FileText className="h-[14px] w-[14px]" />
            {safeText(order.delivery_method, "Sin metodo")}
          </span>
          <span className="flex items-center gap-1.5 font-[Montserrat] text-xs font-medium text-[var(--c3d-text-faint)]">
            <PackageOpen className="h-[14px] w-[14px]" />
            {order.files_count ?? 0} archivos
          </span>
          <span className="flex items-center gap-1.5 font-[Montserrat] text-xs font-medium text-[var(--c3d-text-faint)]">
            Creado: {formatDateTime(order.created_at)}
          </span>
          <div className="ml-auto flex gap-2">
            {order.files?.length ? (
              <Button
                asChild
                variant="outline"
                className="h-[30px] rounded-[10px] border-[var(--c3d-card-border)] bg-[var(--c3d-card-bg-alt)] px-2.5 font-[Montserrat] text-[11px] font-semibold text-[var(--c3d-text-muted)] hover:bg-white/10"
              >
                <a
                  href={order.files[0]?.url || "#"}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download className="mr-1 h-3 w-3" />
                  Bajar STL
                </a>
              </Button>
            ) : null}
            <Button
              asChild
              variant="outline"
              className="h-[30px] rounded-[10px] border-[var(--c3d-card-border)] bg-[var(--c3d-card-bg-alt)] px-2.5 font-[Montserrat] text-[11px] font-semibold text-[var(--c3d-text-muted)] hover:bg-white/10"
            >
              <a
                href={`/proveedores-v2/pedidos?pedido_id=${order.id}`}
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                Ver detalle
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Pipeline Card ---------- */

function PipelineCard({
  step,
  count,
  active,
  isLast,
  onClick,
}: {
  step: (typeof PIPELINE_STEPS)[number];
  count: number;
  active: boolean;
  isLast: boolean;
  onClick: () => void;
}) {
  const meta = ST[step.ids[0]] || ST.paid_confirmed;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-[14px] px-[18px] py-4 text-left transition-all",
        "border shadow-[var(--c3d-card-shadow)]",
        active
          ? "border-opacity-40"
          : "border-[var(--c3d-card-border)] bg-[var(--c3d-card-bg)]"
      )}
      style={
        active
          ? { background: meta.bg, borderColor: `${meta.color}40` }
          : undefined
      }
    >
      <div className="mb-2 flex items-center justify-between">
        <span style={{ color: meta.color }}>{step.icon}</span>
        {!isLast && (
          <ChevronRight className="h-[15px] w-[15px] text-[var(--c3d-text-faint)]" />
        )}
      </div>
      <p
        className="font-[Montserrat] text-[26px] font-extrabold leading-none tabular-nums"
        style={{ color: active ? meta.color : "var(--c3d-text-strong)" }}
      >
        {count}
      </p>
      <p className="mt-1 font-[Montserrat] text-[11px] font-semibold uppercase leading-[1.3] tracking-[0.1em] text-[var(--c3d-text-faint)]">
        {step.label}
      </p>
    </button>
  );
}

/* ---------- ReadyToShipComposer ---------- */

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
    <Dialog open onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>Subir fotos del pedido</DialogTitle>
          <DialogDescription>
            Subi fotos del producto terminado antes de marcar listo para despachar.
          </DialogDescription>
        </DialogHeader>
        <div
          onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => { event.preventDefault(); setIsDragging(false); handleFiles(event.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "cursor-pointer rounded-xl border-2 border-dashed px-5 py-8 text-center transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border/80 bg-background/40 hover:border-primary/50"
          )}
        >
          <Upload className="mx-auto mb-3 h-8 w-8 text-primary/60" />
          <p className="text-sm font-medium">Arrastra las fotos o hace clic</p>
          <p className="mt-1 text-xs text-muted-foreground">JPG, PNG o WEBP</p>
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
          <div className="flex flex-wrap gap-2">
            {files.map((file, index) => (
              <button
                key={`${file.name}-${file.size}-${file.lastModified}`}
                type="button"
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs"
                onClick={() => onRemoveFile(index)}
                disabled={isSubmitting}
              >
                <span className="max-w-[120px] truncate">{file.name}</span>
                <span className="text-muted-foreground">x</span>
              </button>
            ))}
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- CancelOrderDialog ---------- */

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
      <DialogContent className="max-w-xl rounded-2xl border-rose-200">
        <DialogHeader>
          <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle>Cancelar pedido {order ? (order.public_order_id || `#${order.id}`) : ""}</DialogTitle>
          <DialogDescription className="space-y-2 pt-2 text-left">
            <span className="block">
              Estas por cancelar este pedido. Se solicitara refund por MercadoPago y el{" "}
              <strong className="font-semibold text-foreground">cliente recibira un email.</strong>
            </span>
            <span className="block">
              Es obligatorio escribir el motivo. Lo que escribas se le enviara al cliente.
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            Impacto: se revierte el cobro, se cierra la operacion y el cliente recibe comunicacion inmediata.
          </div>
          <Textarea
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            placeholder="Motivo de la cancelacion (min. 30 caracteres)..."
            className="min-h-[120px] rounded-xl border-rose-200"
          />
          <p className={cn("text-right text-xs", reason.trim().length < 30 ? "text-rose-500" : "text-muted-foreground")}>
            {reason.trim().length} / 30
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Volver
          </Button>
          <Button
            className="bg-rose-600 text-white hover:bg-rose-700"
            onClick={onConfirm}
            disabled={isSubmitting || reason.trim().length < 30}
          >
            {isSubmitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <BadgeX className="mr-2 h-4 w-4" />}
            Confirmar cancelacion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Main export ---------- */

export function ProviderOrdersView() {
  const queryClient = useQueryClient();
  const { providerId } = useProviderDashboardSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pipelineFilter, setPipelineFilter] = useState<string>("all");
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
  const [actionOrderId, setActionOrderId] = useState<number | null>(null);

  const ordersQuery = useQuery({
    queryKey: ["provider-dashboard", "orders", providerId],
    queryFn: () => fetchProviderOrders(providerId!),
    enabled: providerId != null,
    staleTime: 20_000,
  });

  const items = useMemo(() => ordersQuery.data?.items || [], [ordersQuery.data]);

  // Filter by pipeline
  const filteredItems = useMemo(() => {
    if (pipelineFilter === "all") return items;
    const step = PIPELINE_STEPS.find((s) => s.ids.includes(pipelineFilter));
    if (!step) return items;
    return items.filter((o) => step.ids.includes(o.order_status || ""));
  }, [items, pipelineFilter]);

  const actionOrder = items.find((o) => o.id === actionOrderId) || null;

  // Clear pedido_id query param
  useEffect(() => {
    if (selectedId != null && searchParams.has("pedido_id")) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("pedido_id");
        return next;
      }, { replace: true });
    }
  }, [selectedId, searchParams, setSearchParams]);

  // Count SLA violations
  const slaViolations = useMemo(() => {
    return items.filter((o) => {
      const days = computeSLADays(o);
      return days != null && days <= 0 && !["completed", "cancelled"].includes(o.order_status || "");
    }).length;
  }, [items]);

  const activeCount = items.filter(
    (o) => !["completed", "cancelled"].includes(o.order_status || "")
  ).length;

  /* ---- Mutations ---- */

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "orders", providerId] });
    void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "order-detail", providerId] });
    void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "shipments", providerId] });
    void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "notifications", providerId] });
    void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "summary", providerId] });
  };

  const printingMutation = useMutation({
    mutationFn: async () => {
      if (!actionOrderId || providerId == null) throw new Error("Elegi un pedido.");
      return markProviderOrderPrinting(providerId, actionOrderId);
    },
    onSuccess: (payload) => {
      toast.success(payload.email_sent ? "En impresion. Email enviado." : "En impresion.");
      invalidateAll();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No pudimos marcar impresion.");
    },
  });

  const readyToShipMutation = useMutation({
    mutationFn: async () => {
      if (!actionOrderId || providerId == null) throw new Error("Elegi un pedido.");
      return markProviderOrderReadyToShip(providerId, actionOrderId, { photos: readyToShipFiles });
    },
    onSuccess: (payload) => {
      setShowReadyToShipComposer(false);
      setReadyToShipFiles([]);
      toast.success(payload.email_sent ? "Listo para despachar. Email enviado." : "Listo para despachar.");
      invalidateAll();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al marcar listo.");
    },
  });

  const dispatchMutation = useMutation({
    mutationFn: async (params: DispatchConfirmParams) => {
      if (!actionOrderId) throw new Error("Elegi un pedido.");
      return dispatchProviderOrder(actionOrderId, params);
    },
    onSuccess: (payload) => {
      toast.success(
        payload.email_sent
          ? `Despacho confirmado. Tracking ${payload.trackingNumber}. Email enviado.`
          : `Despacho confirmado. Tracking ${payload.trackingNumber}`
      );
      invalidateAll();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al confirmar despacho.");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!cancellingOrder || providerId == null) throw new Error("Elegi un pedido.");
      return cancelProviderOrder(providerId, cancellingOrder.id, cancellationReason.trim());
    },
    onSuccess: (payload) => {
      setCancellingOrder(null);
      setCancellationReason("");
      toast.success(payload.refund?.success ? "Cancelado. Refund solicitado." : "Cancelado.");
      invalidateAll();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al cancelar.");
    },
  });

  /* ---- Action handlers ---- */

  function handleOrderAction(orderId: number, action: "printing" | "ready" | "dispatch" | "cancel") {
    setActionOrderId(orderId);
    if (action === "printing") {
      setShowPrintingConfirm(true);
    } else if (action === "ready") {
      setShowReadyToShipComposer(true);
    } else if (action === "dispatch") {
      setShowDispatchModal(true);
    } else if (action === "cancel") {
      const order = items.find((o) => o.id === orderId);
      if (order) {
        setCancellingOrder(order);
        setCancellationReason("");
      }
    }
  }

  /* ---- Loading / Error states ---- */

  if (ordersQuery.error) {
    return (
      <DashboardErrorState
        title="No pudimos cargar Pedidos"
        description="El endpoint de pedidos no respondio correctamente."
      />
    );
  }

  if (ordersQuery.isLoading || (ordersQuery.isFetching && !ordersQuery.data)) {
    return <DashboardLoadingState title="Cargando pedidos" description="Conectando con datos reales..." />;
  }

  if (!ordersQuery.data) {
    return (
      <DashboardEmptyState
        title="No encontramos pedidos"
        description="Sin respuesta valida del backend."
        icon={<AlertTriangle className="h-6 w-6" />}
      />
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* --- PageHeader --- */}
        <DashboardPageHeader
          variant="dark"
          eyebrow="GESTION DE PRODUCCION"
          title="Pedidos"
          description="Actualiza el estado de cada pedido para que el cliente este siempre informado."
          metaPills={
            <>
              {slaViolations > 0 && (
                <DashboardStatePill tone="warning">
                  {slaViolations} supera SLA
                </DashboardStatePill>
              )}
              <DashboardStatePill tone="info">
                {activeCount} activos
              </DashboardStatePill>
              {ordersQuery.isFetching && (
                <DashboardStatePill tone="warning">Actualizando</DashboardStatePill>
              )}
            </>
          }
          actions={
            <Button
              type="button"
              variant="outline"
              className="h-[38px] rounded-[10px] border-white/15 bg-white/10 px-4 font-[Montserrat] text-[13px] font-semibold text-white hover:bg-white/20"
              onClick={() => void ordersQuery.refetch()}
              disabled={ordersQuery.isFetching}
            >
              {ordersQuery.isFetching ? (
                <LoaderCircle className="mr-1.5 h-[15px] w-[15px] animate-spin" />
              ) : (
                <RefreshCcw className="mr-1.5 h-[15px] w-[15px]" />
              )}
              Recargar
            </Button>
          }
        />

        {/* --- Pipeline cards (4 cols) --- */}
        <section className="grid grid-cols-4 gap-[11px]">
          {PIPELINE_STEPS.map((step, i) => {
            const count = items.filter((o) =>
              step.ids.includes(o.order_status || "")
            ).length;
            const active = pipelineFilter === step.ids[0];
            return (
              <PipelineCard
                key={step.ids[0]}
                step={step}
                count={count}
                active={active}
                isLast={i === PIPELINE_STEPS.length - 1}
                onClick={() =>
                  setPipelineFilter(active ? "all" : step.ids[0])
                }
              />
            );
          })}
        </section>

        {/* --- Order cards list --- */}
        <section className="flex flex-col gap-[9px]">
          {filteredItems.length ? (
            filteredItems.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onAction={(action) => handleOrderAction(order.id, action)}
                isActioning={
                  actionOrderId === order.id &&
                  (printingMutation.isPending ||
                    readyToShipMutation.isPending ||
                    dispatchMutation.isPending)
                }
              />
            ))
          ) : (
            <DashboardEmptyState
              title="No hay pedidos para este filtro"
              description="Proba con otro estado del pipeline."
              icon={<PackageOpen className="h-6 w-6" />}
              className="min-h-[200px]"
            />
          )}
        </section>
      </div>

      {/* --- Dialogs --- */}
      <CancelOrderDialog
        order={cancellingOrder}
        reason={cancellationReason}
        onReasonChange={setCancellationReason}
        onCancel={() => {
          if (cancelMutation.isPending) return;
          setCancellingOrder(null);
          setCancellationReason("");
        }}
        onConfirm={() => {
          if (!cancellingOrder || cancellationReason.trim().length < 30) {
            toast.error("El motivo debe tener al menos 30 caracteres.");
            return;
          }
          void cancelMutation.mutateAsync();
        }}
        isSubmitting={cancelMutation.isPending}
      />

      {showReadyToShipComposer && (
        <ReadyToShipComposer
          files={readyToShipFiles}
          onAppendFiles={(files) =>
            setReadyToShipFiles((current) => dedupeFiles(current, files))
          }
          onRemoveFile={(index) =>
            setReadyToShipFiles((current) =>
              current.filter((_, i) => i !== index)
            )
          }
          onCancel={() => {
            setShowReadyToShipComposer(false);
            setReadyToShipFiles([]);
          }}
          onConfirm={() => void readyToShipMutation.mutateAsync()}
          isSubmitting={readyToShipMutation.isPending}
        />
      )}

      <DispatchConfirmDialog
        open={showDispatchModal}
        onOpenChange={setShowDispatchModal}
        orderId={actionOrder?.id}
        isPickup={actionOrder?.delivery_method === "retiro_taller"}
        hasTracking={!!actionOrder?.shipment_tracking_code}
        isSubmitting={dispatchMutation.isPending}
        onConfirm={(params) => {
          setShowDispatchModal(false);
          void dispatchMutation.mutateAsync(params);
        }}
      />

      <Dialog open={showPrintingConfirm} onOpenChange={setShowPrintingConfirm}>
        <DialogContent className="max-w-md rounded-2xl p-0">
          <DialogHeader className="space-y-3 px-6 pt-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10">
              <Printer className="h-7 w-7 text-primary" />
            </div>
            <DialogTitle className="text-center font-[Montserrat] text-lg font-bold">
              Iniciar impresion
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-muted-foreground">
              {actionOrder
                ? `El pedido ${actionOrder.public_order_id || `#${actionOrder.id}`} pasara a "En produccion" y se le avisara al cliente.`
                : "Confirmar inicio de impresion."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 px-6 pb-6 pt-4 sm:justify-center">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setShowPrintingConfirm(false)}
              disabled={printingMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 rounded-xl bg-gradient-to-r from-primary to-cyan-500 text-white shadow-[0_4px_20px_hsl(220_70%_45%/0.35)]"
              onClick={() => {
                setShowPrintingConfirm(false);
                void printingMutation.mutateAsync();
              }}
              disabled={printingMutation.isPending}
            >
              {printingMutation.isPending ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Printer className="mr-2 h-4 w-4" />
              )}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
