import { CalendarDays, Printer } from "lucide-react";

import type { AgendaPrinter } from "@/features/provider-dashboard/types";
import { cn } from "@/lib/utils";

interface WeeklyScheduleProps {
  todayIso: string;
  days: number;
  printers: AgendaPrinter[];
}

type ScheduleCell =
  | { kind: "off" }
  | { kind: "free" }
  | { kind: "job"; id: string; client: string; color: string; first: boolean; last: boolean };

const WEEKDAYS = ["D", "L", "M", "M", "J", "V", "S"];

function addDays(iso: string, offset: number) {
  const base = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(base.getTime())) return null;
  base.setDate(base.getDate() + offset);
  return base;
}

function getCell(printer: AgendaPrinter, dayIndex: number): ScheduleCell {
  if (!printer.dedicated && !printer.is_planning_printer) return { kind: "off" };
  const job = printer.jobs.find((item) => {
    const start = Math.max(0, Number(item.start_day || 0));
    const duration = Math.max(1, Number(item.duration_days || 1));
    return dayIndex >= start && dayIndex < start + duration;
  });
  if (!job) return { kind: "free" };
  const start = Math.max(0, Number(job.start_day || 0));
  const duration = Math.max(1, Number(job.duration_days || 1));
  return {
    kind: "job",
    id: job.id,
    client: job.client,
    color: job.color || "hsl(220,70%,55%)",
    first: dayIndex === start,
    last: dayIndex === start + duration - 1,
  };
}

export function WeeklySchedule({ todayIso, days, printers }: WeeklyScheduleProps) {
  const occupiedDays = printers
    .filter((printer) => printer.dedicated || printer.is_planning_printer)
    .reduce((total, printer) => total + printer.jobs.reduce((sum, job) => sum + Math.max(1, Number(job.duration_days || 1)), 0), 0);
  const dedicatedCount = printers.filter((printer) => printer.dedicated || printer.is_planning_printer).length;
  const freeDays = Math.max(0, dedicatedCount * days - occupiedDays);
  const gridTemplateColumns = `180px repeat(${days}, minmax(0, 1fr))`;

  return (
    <section className="overflow-hidden rounded-[17px] border border-[var(--c3d-card-border)] bg-[var(--c3d-card-bg)] shadow-[var(--c3d-card-shadow)]">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--c3d-card-border-soft)] px-5 pb-[11px] pt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-primary/10 text-primary">
            <CalendarDays className="h-[18px] w-[18px]" />
          </div>
          <div>
            <p className="font-[Montserrat] text-[10px] font-extrabold uppercase leading-none tracking-[0.18em] text-[hsl(200,85%,65%)]">
              PRÓXIMAS 2 SEMANAS
            </p>
            <h2 className="mt-1.5 font-[Montserrat] text-[16px] font-bold leading-[1.2] tracking-[-0.005em] text-[var(--c3d-text-strong)]">
              Agenda real por impresora
            </h2>
            <p className="mt-0.5 text-[12px] leading-[1.5] text-[var(--c3d-text-muted)]">
              Los pedidos en curso bloquean días automáticamente. Apagá una impresora para sacarla del marketplace.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          <span className="rounded-full border border-cyan-400/30 bg-cyan-500/15 px-2 py-1 text-[10px] font-bold text-cyan-200">
            {occupiedDays} días con pedidos
          </span>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-200">
            {freeDays} días libres
          </span>
        </div>
      </div>

      <div className="overflow-x-auto px-5 pb-[18px] pt-[14px]">
        <div className="min-w-[980px]">
          <div className="mb-2 grid gap-1" style={{ gridTemplateColumns }}>
            <div />
            {Array.from({ length: days }).map((_, index) => {
              const date = addDays(todayIso, index);
              const isToday = index === 0;
              const isWeekend = date ? date.getDay() === 0 || date.getDay() === 6 : false;
              return (
                <div
                  key={index}
                  className={cn(
                    "rounded-[7px] border px-1 py-1.5 text-center",
                    isToday ? "border-blue-400/35 bg-blue-500/15" : "border-transparent bg-transparent"
                  )}
                >
                  <div className={cn("text-[9px] font-bold uppercase tracking-[0.06em]", isToday ? "text-blue-200" : isWeekend ? "text-[var(--c3d-text-faint)]" : "text-[var(--c3d-text-muted)]")}>
                    {date ? WEEKDAYS[date.getDay()] : "-"}
                  </div>
                  <div className={cn("mt-1 font-[Montserrat] text-[12px] font-extrabold leading-none", isToday ? "text-white" : "text-[var(--c3d-text-strong)]")}>
                    {date ? date.getDate() : index + 1}
                  </div>
                </div>
              );
            })}
          </div>

          {printers.map((printer) => (
            <div
              key={printer.id}
              className={cn("mb-1.5 grid gap-1", !printer.dedicated && !printer.is_planning_printer && "opacity-55")}
              style={{ gridTemplateColumns }}
            >
              <div className="flex min-w-0 items-center gap-2 py-2">
                <Printer className={cn("h-[15px] w-[15px] shrink-0", printer.dedicated || printer.is_planning_printer ? "text-[hsl(220,80%,65%)]" : "text-[var(--c3d-text-faint)]")} />
                <div className="min-w-0">
                  <p className="truncate font-[Montserrat] text-[12px] font-bold leading-[1.2] text-[var(--c3d-text-strong)]">
                    {printer.name}
                  </p>
                  <p className="mt-0.5 text-[9.5px] font-semibold uppercase leading-none tracking-[0.08em] text-[var(--c3d-text-faint)]">
                    {printer.dedicated || printer.is_planning_printer ? "Dedicada" : "OFF - sin uso acá"}
                  </p>
                </div>
              </div>
              {Array.from({ length: days }).map((_, index) => {
                const cell = getCell(printer, index);
                if (cell.kind === "off") {
                  return (
                    <div
                      key={index}
                      className="min-h-9 rounded-[7px] border border-dashed border-white/10 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,.04)_0_4px,transparent_4px_8px)]"
                    />
                  );
                }
                if (cell.kind === "free") {
                  return <div key={index} className="min-h-9 rounded-[7px] border border-dashed border-emerald-400/30 bg-emerald-500/[0.08]" title="Libre - puede recibir pedidos" />;
                }
                return (
                  <div
                    key={index}
                    title={`${cell.id} - ${cell.client}`}
                    className={cn("flex min-h-9 items-center overflow-hidden px-1.5 py-1", cell.first && cell.last ? "rounded-[7px]" : cell.first ? "rounded-l-[7px]" : cell.last ? "rounded-r-[7px]" : "")}
                    style={{
                      background: cell.color,
                      marginLeft: cell.first ? 0 : -4,
                      marginRight: cell.last ? 0 : -4,
                    }}
                  >
                    {cell.first ? (
                      <div className="min-w-0">
                        <p className="truncate font-[Montserrat] text-[10px] font-extrabold leading-none text-white">{cell.id}</p>
                        <p className="mt-1 truncate text-[9px] font-semibold leading-none text-white/85">{cell.client}</p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}

          <div className="mt-3 flex flex-wrap gap-4 border-t border-[var(--c3d-card-border-soft)] pt-3">
            <LegendItem label="Libre" className="border-dashed border-emerald-400/30 bg-emerald-500/[0.08]" />
            <LegendItem label="Pedido en curso" className="border-blue-500 bg-blue-500" />
            <LegendItem label="Impresora apagada (no recibe pedidos)" className="border-dashed border-white/20 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,.04)_0_4px,transparent_4px_8px)]" />
          </div>
        </div>
      </div>
    </section>
  );
}

function LegendItem({ label, className }: { label: string; className: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-3.5 w-[18px] rounded-[3px] border", className)} />
      <span className="text-[11px] font-medium leading-none text-[var(--c3d-text-muted)]">{label}</span>
    </div>
  );
}
