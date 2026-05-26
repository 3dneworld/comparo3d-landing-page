import { AlertTriangle, Edit, Printer, Star } from "lucide-react";

import { DedicatedSwitch } from "@/features/provider-dashboard/components/DedicatedSwitch";
import { DashboardStatePill } from "@/features/provider-dashboard/components/DashboardStatePill";
import { cn } from "@/lib/utils";

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
}

interface PrinterCardProps {
  data: PrinterCardData;
  onToggleActiva: (next: boolean) => void;
  onEdit: () => void;
  disabled?: boolean;
}

export function PrinterCard({ data, onToggleActiva, onEdit, disabled = false }: PrinterCardProps) {
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-[1.25rem] border bg-white p-5 shadow-card",
        data.is_planning_printer ? "border-emerald-300" : "border-border/70",
        !data.activa && "bg-muted/30"
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          data.is_planning_printer ? "bg-emerald-500" : "bg-border"
        )}
      />

      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            data.is_planning_printer ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
          )}
        >
          <Printer className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-[Montserrat] text-base font-extrabold tracking-tight text-foreground">
              {data.name}
            </h3>
            {data.is_planning_printer ? (
              <DashboardStatePill tone="success">Planning</DashboardStatePill>
            ) : null}
            {data.es_principal ? (
              <DashboardStatePill tone="info">
                <Star className="mr-1 h-3 w-3" />
                Principal
              </DashboardStatePill>
            ) : null}
          </div>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {data.tech} · {data.bed} · {data.cantidad_unidades} u.
          </p>
          {!data.activa ? (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              Apagada, no aporta capacidad
            </p>
          ) : null}
        </div>
        <DedicatedSwitch
          value={data.activa}
          onChange={onToggleActiva}
          ariaLabel={`Activar ${data.name}`}
          disabled={disabled}
        />
      </div>

      <div className="mt-5">
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
            <span className="text-xs font-medium text-muted-foreground">Sin declarar</span>
          )}
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={onEdit}
          disabled={disabled}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border/80 bg-white px-3 text-xs font-bold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Edit className="h-3.5 w-3.5" />
          Editar
        </button>
      </div>
    </article>
  );
}
