import { CalendarDays, Printer } from "lucide-react";

import type { AgendaPrinter } from "@/features/provider-dashboard/types";
import { cn } from "@/lib/utils";

interface WeeklyScheduleProps {
  todayIso: string;
  days: number;
  printers: AgendaPrinter[];
}

type ScheduleCellState = "free" | "off" | "job";

const WEEKDAYS = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"];
const CELL_STYLES: Record<ScheduleCellState, string> = {
  free: "border-emerald-200/80 bg-emerald-500/[0.08]",
  off: "border-slate-200 bg-slate-500/[0.10]",
  job: "border-blue-200 bg-blue-600/[0.10]",
};

function addDays(iso: string, offset: number) {
  const base = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(base.getTime())) return null;
  base.setDate(base.getDate() + offset);
  return base;
}

function hasJobOnDay(printer: AgendaPrinter, dayIndex: number) {
  return printer.jobs.some((job) => {
    const start = Math.max(0, Number(job.start_day || 0));
    const duration = Math.max(1, Number(job.duration_days || 1));
    return dayIndex >= start && dayIndex < start + duration;
  });
}

function getCellState(printer: AgendaPrinter, dayIndex: number): ScheduleCellState {
  if (!printer.dedicated && !printer.is_planning_printer) return "off";
  if (hasJobOnDay(printer, dayIndex)) return "job";
  return "free";
}

export function WeeklySchedule({ todayIso, days, printers }: WeeklyScheduleProps) {
  const gridTemplateColumns = `minmax(170px, 220px) repeat(${days}, minmax(54px, 1fr))`;

  return (
    <section className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-white shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/70 px-5 py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
              PROXIMAS 2 SEMANAS
            </p>
            <h2 className="mt-1 font-[Montserrat] text-lg font-extrabold tracking-tight text-foreground">
              Agenda real por impresora
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Los pedidos confirmados bloquean dias en la impresora dedicada.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-muted-foreground" aria-label="Referencias de agenda">
          <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Libre</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-blue-600" /> Ocupada</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-slate-400" /> No dedicada</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[980px]">
          <div className="grid border-b border-border/70 bg-muted/30" style={{ gridTemplateColumns }}>
            <div className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Impresora
            </div>
            {Array.from({ length: days }).map((_, index) => {
              const date = addDays(todayIso, index);
              return (
                <div key={index} className="border-l border-border/60 px-1 py-2 text-center">
                  <div className="text-[10px] font-bold uppercase text-muted-foreground">
                    {date ? WEEKDAYS[date.getDay()] : "-"}
                  </div>
                  <div className="mt-1 font-[Montserrat] text-sm font-extrabold text-foreground">
                    {date ? date.getDate() : index + 1}
                  </div>
                </div>
              );
            })}
          </div>

          {printers.map((printer) => (
            <div
              key={printer.id}
              className={cn("grid min-h-[78px] border-b border-border/60 last:border-b-0", !printer.is_planning_printer && "bg-muted/20")}
              style={{ gridTemplateColumns }}
            >
              <div className="flex min-w-0 items-center gap-3 px-4 py-3">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    printer.is_planning_printer ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
                  )}
                >
                  <Printer className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">{printer.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {printer.is_planning_printer ? "Dedicada" : "Visible en perfil"} - {printer.bed}
                  </p>
                </div>
              </div>
              {Array.from({ length: days }).map((_, index) => {
                const cellState = getCellState(printer, index);
                const currentJob = printer.jobs.find((job) => {
                  const start = Math.max(0, Number(job.start_day || 0));
                  const duration = Math.max(1, Number(job.duration_days || 1));
                  return index >= start && index < start + duration;
                });
                return (
                  <div key={index} className="border-l border-border/60 px-1.5 py-3">
                    <div
                      className={cn(
                        "flex h-full min-h-[46px] items-center justify-center rounded-lg border text-[10px] font-bold uppercase tracking-[0.08em]",
                        CELL_STYLES[cellState],
                        cellState === "job" ? "text-blue-700" : cellState === "free" ? "text-emerald-700" : "text-slate-500"
                      )}
                      title={currentJob ? `${currentJob.id} - ${currentJob.client}` : undefined}
                    >
                      {cellState === "job" ? "Job" : cellState === "free" ? "Libre" : "Off"}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
