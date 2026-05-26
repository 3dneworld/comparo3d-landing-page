import { CalendarDays, Printer } from "lucide-react";

import { JobBar } from "@/features/provider-dashboard/components/JobBar";
import type { AgendaPrinter } from "@/features/provider-dashboard/types";
import { cn } from "@/lib/utils";

interface WeeklyScheduleProps {
  todayIso: string;
  days: number;
  printers: AgendaPrinter[];
}

const WEEKDAYS = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"];

function addDays(iso: string, offset: number) {
  const base = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(base.getTime())) return null;
  base.setDate(base.getDate() + offset);
  return base;
}

export function WeeklySchedule({ todayIso, days, printers }: WeeklyScheduleProps) {
  const cols = `180px repeat(${days}, minmax(34px, 1fr))`;

  return (
    <section className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-[Montserrat] text-base font-extrabold tracking-tight text-foreground">
              Agenda 14 dias
            </h2>
            <p className="text-xs text-muted-foreground">
              Jobs reales asignados a la impresora que cuenta para planning.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Dedicada
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div
            className="grid border-b border-border/70 bg-muted/30"
            style={{ gridTemplateColumns: cols }}
          >
            <div className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Impresora
            </div>
            {Array.from({ length: days }).map((_, index) => {
              const date = addDays(todayIso, index);
              return (
                <div
                  key={index}
                  className="border-l border-border/60 px-1 py-2 text-center"
                >
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
              className={cn(
                "grid min-h-[72px] border-b border-border/60 last:border-b-0",
                !printer.is_planning_printer && "bg-muted/20"
              )}
              style={{ gridTemplateColumns: cols }}
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
                    {printer.is_planning_printer ? "Dedicada" : "Visible en perfil"} · {printer.bed}
                  </p>
                </div>
              </div>
              <div className="relative" style={{ gridColumn: `2 / span ${days}` }}>
                <div
                  className="absolute inset-0 grid"
                  style={{ gridTemplateColumns: `repeat(${days}, minmax(34px, 1fr))` }}
                >
                  {Array.from({ length: days }).map((_, index) => (
                    <div key={index} className="border-l border-border/60" />
                  ))}
                </div>
                {printer.jobs.map((job) => (
                  <JobBar key={`${printer.id}-${job.id}-${job.start_day}`} job={job} days={days} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
