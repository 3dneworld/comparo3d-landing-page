import { CalendarClock, CheckCircle2, Edit3, Printer, XCircle } from "lucide-react";

import { DedicatedSwitch } from "@/features/provider-dashboard/components/DedicatedSwitch";
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
  tech: string;
  is_planning_printer: boolean;
  activa: boolean;
  es_principal: boolean;
  marcas: string[];
  materiales?: string[];
  cantidad_unidades: number;
  status?: PrinterCardStatus;
}

interface PrinterCardProps {
  data: PrinterCardData;
  onToggleActiva: (next: boolean) => void;
  onEdit: () => void;
  disabled?: boolean;
}

export function PrinterCard({ data, onToggleActiva, onEdit, disabled = false }: PrinterCardProps) {
  const dedicated = Boolean(data.activa || data.is_planning_printer);
  const status = data.status ?? {
    tone: dedicated ? "idle" : "off",
    label: dedicated ? "Libre ahora" : "En uso por fuera",
    detail: dedicated ? "Puede aceptar pedidos del marketplace." : "No recibe pedidos. Reactivala cuando vuelva a estar libre para Comparo3D.",
  };

  return (
    <article className="overflow-hidden rounded-[17px] border border-[var(--c3d-card-border)] bg-[var(--c3d-card-bg)] shadow-[var(--c3d-card-shadow)]">
      <header className="flex items-start justify-between gap-3 border-b border-[var(--c3d-card-border-soft)] px-5 pb-[11px] pt-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-primary/10 text-primary">
            <Printer className="h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0">
            <p className="font-[Montserrat] text-[10px] font-extrabold uppercase leading-none tracking-[0.18em] text-[hsl(200,85%,65%)]">
              {data.es_principal ? "IMPRESORA PRINCIPAL" : "IMPRESORA"}
            </p>
            <h3 className="mt-1.5 truncate font-[Montserrat] text-[16px] font-bold leading-[1.2] tracking-[-0.005em] text-[var(--c3d-text-strong)]">
              {data.name}
            </h3>
            <p className="mt-0.5 truncate text-[12px] leading-[1.5] text-[var(--c3d-text-muted)]">
              {data.tech} - {data.bed} - {data.cantidad_unidades} unidad{data.cantidad_unidades === 1 ? "" : "es"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          disabled={disabled}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-[12px] font-semibold text-[var(--c3d-text-strong)] hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Edit3 className="h-3.5 w-3.5" />
          Editar
        </button>
      </header>

      <div className="px-5 pb-[18px] pt-[14px]">
        <section
          className={cn(
            "mb-3.5 flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3",
            dedicated ? "border-emerald-400/30 bg-emerald-500/[0.08]" : "border-[var(--c3d-card-border-soft)] bg-white/[0.025]"
          )}
        >
          <div className="min-w-0">
            <p className={cn("font-[Montserrat] text-[10px] font-extrabold uppercase leading-none tracking-[0.14em]", dedicated ? "text-emerald-400" : "text-[var(--c3d-text-faint)]")}>
              DEDICACION A COMPARO3D
            </p>
            <h4 className="mt-1.5 font-[Montserrat] text-[15px] font-extrabold leading-[1.2] text-[var(--c3d-text-strong)]">
              {dedicated ? "Disponible para el marketplace" : "En uso por fuera"}
            </h4>
            <p className="mt-1 text-[11.5px] leading-[1.45] text-[var(--c3d-text-muted)]">
              {dedicated ? "Recibe pedidos del marketplace cuando este libre." : "No recibe pedidos. Reactivala cuando vuelva a estar libre para Comparo3D."}
            </p>
          </div>
          <DedicatedSwitch value={dedicated} onChange={onToggleActiva} ariaLabel={`Activar ${data.name}`} disabled={disabled} />
        </section>

        {dedicated ? (
          <section className="mb-3.5">
            <p className="mb-2 font-[Montserrat] text-[10px] font-extrabold uppercase leading-none tracking-[0.14em] text-[var(--c3d-text-faint)]">
              Estado actual
            </p>
            <StatusRow status={status} />
            {status.nextDetail ? (
              <div className="mt-2 flex items-center gap-2.5 rounded-[10px] border border-[var(--c3d-card-border-soft)] bg-[var(--c3d-card-bg-alt)] px-3 py-2.5">
                <CalendarClock className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                <p className="min-w-0 text-[11.5px] font-semibold leading-[1.35] text-[var(--c3d-text-muted)]">{status.nextDetail}</p>
              </div>
            ) : null}
          </section>
        ) : null}

        <dl className="mb-3.5 grid grid-cols-2 gap-3.5">
          <Fact label="Tecnologia" value={data.tech} />
          <Fact label="Volumen" value={data.bed} />
          <Fact label="Unidades" value={String(data.cantidad_unidades)} />
          <Fact label="Materiales" value={(data.materiales?.length ? data.materiales : ["PLA", "PETG", "ABS", "Nylon"]).join(" - ")} />
        </dl>

        <section>
          <p className="mb-2 font-[Montserrat] text-[10px] font-extrabold uppercase leading-none tracking-[0.14em] text-[var(--c3d-text-faint)]">
            Marcas de filamento
          </p>
          <div className="flex flex-wrap gap-1.5">
            {data.marcas.length ? (
              data.marcas.map((brand) => (
                <span key={brand} className="rounded-full bg-blue-500/15 px-2.5 py-1 text-[11px] font-semibold leading-none text-blue-300">
                  {brand}
                </span>
              ))
            ) : (
              <span className="text-[11px] font-medium text-[var(--c3d-text-muted)]">Sin declarar</span>
            )}
          </div>
        </section>
      </div>
    </article>
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
        status.tone === "off" && "border-[var(--c3d-card-border-soft)] bg-white/[0.025]"
      )}
    >
      {idle ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" /> : <XCircle className={cn("h-3.5 w-3.5 shrink-0", busy ? "text-blue-400" : "text-[var(--c3d-text-faint)]")} />}
      <div className="min-w-0">
        <p className="font-[Montserrat] text-[12.5px] font-bold leading-[1.2] text-[var(--c3d-text-strong)]">{status.label}</p>
        <p className="mt-0.5 text-[11px] leading-[1.35] text-[var(--c3d-text-muted)]">{status.detail}</p>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[auto_1fr] items-baseline gap-2">
      <dt className="font-[Montserrat] text-[11px] font-bold text-[var(--c3d-text-muted)]">{label}</dt>
      <dd className="truncate text-right font-[Montserrat] text-[12px] font-extrabold text-[var(--c3d-text-strong)]">{value}</dd>
    </div>
  );
}
