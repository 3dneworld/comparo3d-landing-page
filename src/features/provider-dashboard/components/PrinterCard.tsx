import { Edit3, Printer, Star } from "lucide-react";

import { DedicatedSwitch } from "@/features/provider-dashboard/components/DedicatedSwitch";
import { DashboardStatePill } from "@/features/provider-dashboard/components/DashboardStatePill";
import { cn } from "@/lib/utils";

export interface PrinterCardStatus {
  label: string;
  detail: string;
  tone: "idle" | "busy" | "off";
}

export interface PrinterCardData {
  id: number;
  name: string;
  bed: string;
  tech: string;
  is_planning_printer: boolean;
  activa: boolean;
  es_principal: boolean;
  marcas: string[];
  cantidad_unidades: number;
  status?: PrinterCardStatus;
}

interface PrinterCardProps {
  data: PrinterCardData;
  onToggleActiva: (next: boolean) => void;
  onEdit: () => void;
  disabled?: boolean;
}

const statusTone = {
  idle: "border-emerald-200 bg-emerald-50 text-emerald-800",
  busy: "border-blue-200 bg-blue-50 text-blue-800",
  off: "border-slate-200 bg-slate-50 text-slate-600",
} satisfies Record<PrinterCardStatus["tone"], string>;

export function PrinterCard({ data, onToggleActiva, onEdit, disabled = false }: PrinterCardProps) {
  const status = data.status ?? {
    tone: data.activa ? "idle" : "off",
    label: data.activa ? "Libre ahora" : "Apagada",
    detail: data.activa ? "Sin jobs activos" : "No participa en planning",
  };

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-[1.25rem] border bg-white p-5 shadow-card",
        data.is_planning_printer ? "border-emerald-300" : "border-border/70",
        !data.activa && "bg-muted/30"
      )}
      data-active={data.activa ? "true" : "false"}
    >
      <div className={cn("absolute inset-y-0 left-0 w-1", data.is_planning_printer ? "bg-emerald-500" : "bg-border")} />

      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
              data.is_planning_printer ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
            )}
          >
            <Printer className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-[Montserrat] text-base font-extrabold tracking-tight text-foreground">
              {data.name}
            </h3>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {data.tech} - {data.bed} - {data.cantidad_unidades || 1} u.
            </p>
          </div>
        </div>
        <DedicatedSwitch
          value={data.activa}
          onChange={onToggleActiva}
          ariaLabel={`Activar ${data.name}`}
          disabled={disabled}
        />
      </header>

      <div className="mt-4 flex min-h-7 flex-wrap items-center gap-2">
        {data.is_planning_printer ? <DashboardStatePill tone="success">Planning</DashboardStatePill> : null}
        {data.es_principal ? (
          <DashboardStatePill tone="info">
            <Star className="mr-1 h-3 w-3" />
            Principal
          </DashboardStatePill>
        ) : null}
        {!data.is_planning_printer && !data.es_principal ? <DashboardStatePill tone="muted">Visible en perfil</DashboardStatePill> : null}
      </div>

      <section className={cn("mt-4 rounded-xl border px-4 py-3", statusTone[status.tone])}>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-75">Estado actual</p>
        <strong className="mt-1 block font-[Montserrat] text-base font-extrabold">{status.label}</strong>
        <span className="mt-1 block text-xs font-semibold opacity-80">{status.detail}</span>
      </section>

      <dl className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
          <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Tecnologia</dt>
          <dd className="mt-1 truncate text-sm font-extrabold text-foreground">{data.tech}</dd>
        </div>
        <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
          <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Volumen</dt>
          <dd className="mt-1 truncate text-sm font-extrabold text-foreground">{data.bed}</dd>
        </div>
        <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
          <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Unidades</dt>
          <dd className="mt-1 truncate text-sm font-extrabold text-foreground">{data.cantidad_unidades || 1}</dd>
        </div>
      </dl>

      <section className="mt-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Marcas de filamento
        </p>
        <div className="mt-2 flex min-h-7 flex-wrap items-center gap-2">
          {data.marcas.length ? (
            data.marcas.map((marca) => (
              <span
                key={marca}
                className="rounded-full border border-border/70 bg-muted/50 px-2.5 py-1 text-[11px] font-bold text-foreground"
              >
                {marca}
              </span>
            ))
          ) : (
            <em className="text-xs font-medium not-italic text-muted-foreground">Sin declarar</em>
          )}
        </div>
      </section>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={onEdit}
          disabled={disabled}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border/80 bg-white px-3 text-xs font-bold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Edit3 className="h-3.5 w-3.5" />
          Editar
        </button>
      </div>
    </article>
  );
}
