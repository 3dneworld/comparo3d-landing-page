import { CalendarClock, CheckCircle2, Edit3, GripVertical, Power, Printer, Star, Trash2, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export interface PrinterCardStatus {
  label: string;
  detail: string;
  tone: "idle" | "busy" | "off";
  nextDetail?: string;
}

export interface PrinterCardData {
  id: number;
  name: string;
  bed: string;
  is_planning_printer: boolean;
  activa: boolean;
  es_principal: boolean;
  cantidad_unidades: number;
  priority_order: number;
  status?: PrinterCardStatus;
}

interface PrinterCardProps {
  data: PrinterCardData;
  onToggleActiva: (next: boolean) => void;
  onTogglePrincipal: () => void;
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
  dragHandleProps?: Record<string, unknown>;
}

export function PrinterCard({
  data,
  onToggleActiva,
  onTogglePrincipal,
  onEdit,
  onDelete,
  disabled = false,
  dragHandleProps,
}: PrinterCardProps) {
  const dedicated = Boolean(data.activa);
  const status =
    data.status ??
    ({
      tone: dedicated ? "idle" : "off",
      label: dedicated ? "Libre ahora" : "En uso por fuera",
      detail: dedicated
        ? "Puede aceptar pedidos del marketplace."
        : "No recibe pedidos. Reactivala cuando vuelva a estar libre para Comparo3D.",
    } as PrinterCardStatus);

  return (
    <article className="relative overflow-hidden rounded-[17px] border border-[var(--c3d-card-border)] bg-[var(--c3d-card-bg)] shadow-[var(--c3d-card-shadow)]">
      <header className="flex items-start justify-between gap-3 border-b border-[var(--c3d-card-border-soft)] px-5 pb-[11px] pt-4">
        <div className="flex min-w-0 items-center gap-3">
          {/* Badge de prioridad */}
          <div
            className="flex h-[30px] w-[30px] shrink-0 cursor-grab items-center justify-center rounded-full bg-primary/15 font-[Montserrat] text-[13px] font-extrabold text-primary select-none active:cursor-grabbing"
            title="Arrastrá para reordenar"
            {...(dragHandleProps ?? {})}
          >
            {data.priority_order + 1}
          </div>
          <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-primary/10 text-primary">
            <Printer className="h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-[Montserrat] text-[16px] font-bold leading-[1.2] tracking-[-0.005em] text-[var(--c3d-text-strong)]">
              {data.name}
            </h3>
            <p className="mt-0.5 truncate text-[12px] leading-[1.5] text-[var(--c3d-text-muted)]">
              {data.bed}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className="inline-flex h-8 cursor-grab items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-1.5 text-[var(--c3d-text-muted)] hover:bg-white/[0.08] active:cursor-grabbing"
            title="Arrastrá para reordenar"
            {...(dragHandleProps ?? {})}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </span>
        </div>
      </header>

      <div className="px-5 pb-[18px] pt-[14px]">
        {/* Switch Activa */}
        <section
          className={cn(
            "mb-3 flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3",
            dedicated
              ? "border-emerald-400/30 bg-emerald-500/[0.08]"
              : "border-[var(--c3d-card-border-soft)] bg-white/[0.025]",
          )}
        >
          <div className="min-w-0">
            <p
              className={cn(
                "font-[Montserrat] text-[10px] font-extrabold uppercase leading-none tracking-[0.14em]",
                dedicated ? "text-emerald-400" : "text-[var(--c3d-text-faint)]",
              )}
            >
              {dedicated ? "Activa" : "Inactiva"}
            </p>
            <h4 className="mt-1.5 font-[Montserrat] text-[14px] font-extrabold leading-[1.2] text-[var(--c3d-text-strong)]">
              {dedicated ? "Disponible para el marketplace" : "En uso por fuera"}
            </h4>
          </div>
          <ToggleSwitch
            value={dedicated}
            onChange={onToggleActiva}
            ariaLabel={`Activar ${data.name}`}
            disabled={disabled}
            color="emerald"
          />
        </section>

        {/* Switch Principal */}
        <section
          className={cn(
            "mb-3.5 flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3",
            data.es_principal
              ? "border-blue-400/30 bg-blue-500/[0.08]"
              : "border-[var(--c3d-card-border-soft)] bg-white/[0.025]",
          )}
        >
          <div className="min-w-0">
            <p
              className={cn(
                "font-[Montserrat] text-[10px] font-extrabold uppercase leading-none tracking-[0.14em]",
                data.es_principal ? "text-blue-400" : "text-[var(--c3d-text-faint)]",
              )}
            >
              {data.es_principal ? "Principal" : "Secundaria"}
            </p>
            <h4 className="mt-1.5 font-[Montserrat] text-[14px] font-extrabold leading-[1.2] text-[var(--c3d-text-strong)]">
              {data.es_principal ? "Impresora de cotización" : "No cotiza activamente"}
            </h4>
          </div>
          <ToggleSwitch
            value={Boolean(data.es_principal)}
            onChange={() => onTogglePrincipal()}
            ariaLabel={`Principal ${data.name}`}
            disabled={disabled || !dedicated}
            color="blue"
          />
        </section>

        {dedicated ? (
          <section className="mb-3.5">
            <StatusRow status={status} />
            {status.nextDetail ? (
              <div className="mt-2 flex items-center gap-2.5 rounded-[10px] border border-[var(--c3d-card-border-soft)] bg-[var(--c3d-card-bg-alt)] px-3 py-2.5">
                <CalendarClock className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                <p className="min-w-0 text-[11.5px] font-semibold leading-[1.35] text-[var(--c3d-text-muted)]">
                  {status.nextDetail}
                </p>
              </div>
            ) : null}
          </section>
        ) : null}

        {data.cantidad_unidades > 1 ? (
          <div className="mb-2 text-[11px] font-semibold text-[var(--c3d-text-muted)]">
            {data.cantidad_unidades} unidades
          </div>
        ) : null}

        <div className="mt-1 flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            disabled={disabled}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-[12px] font-semibold text-[var(--c3d-text-strong)] hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Editar
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={disabled}
            className="inline-flex h-8 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/[0.06] px-2.5 text-rose-300 hover:bg-rose-500/[0.14] disabled:cursor-not-allowed disabled:opacity-60"
            title="Eliminar impresora"
            aria-label={`Eliminar ${data.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

function ToggleSwitch({
  value,
  onChange,
  ariaLabel,
  disabled = false,
  color,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
  ariaLabel: string;
  disabled?: boolean;
  color: "emerald" | "blue";
}) {
  const palette = {
    emerald: {
      on: "border-emerald-400 bg-gradient-to-b from-emerald-400 to-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,0.16)]",
      thumb: "text-emerald-600",
      Icon: Power,
    },
    blue: {
      on: "border-blue-400 bg-gradient-to-b from-blue-400 to-blue-500 shadow-[0_0_0_5px_rgba(59,130,246,0.16)]",
      thumb: "text-blue-600",
      Icon: Star,
    },
  } as const;
  const c = palette[color];
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={value}
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={cn(
        "relative inline-flex h-[46px] w-[82px] shrink-0 items-center rounded-full border p-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        value ? c.on : "border-slate-300 bg-slate-200/70",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full bg-white text-muted-foreground shadow-sm transition-transform",
          value && `translate-x-9 ${c.thumb}`,
        )}
      >
        <c.Icon className="h-4 w-4" />
      </span>
    </button>
  );
}

function StatusRow({ status }: { status: PrinterCardStatus }) {
  const busy = status.tone === "busy";
  const idle = status.tone === "idle";
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5",
        busy && "border-[var(--c3d-card-border-soft)] bg-[var(--c3d-card-bg-alt)]",
        idle && "border-emerald-400/25 bg-emerald-500/[0.08]",
        status.tone === "off" && "border-[var(--c3d-card-border-soft)] bg-white/[0.025]",
      )}
    >
      {idle ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
      ) : (
        <XCircle className={cn("h-3.5 w-3.5 shrink-0", busy ? "text-blue-400" : "text-[var(--c3d-text-faint)]")} />
      )}
      <div className="min-w-0">
        <p className="font-[Montserrat] text-[12.5px] font-bold leading-[1.2] text-[var(--c3d-text-strong)]">
          {status.label}
        </p>
        <p className="mt-0.5 text-[11px] leading-[1.35] text-[var(--c3d-text-muted)]">{status.detail}</p>
      </div>
    </div>
  );
}
