import type { AgendaJob } from "@/features/provider-dashboard/types";

interface JobBarProps {
  job: AgendaJob;
  days: number;
}

export function JobBar({ job, days }: JobBarProps) {
  const start = Math.max(0, Math.min(days - 1, Number(job.start_day) || 0));
  const duration = Math.max(1, Math.min(days - start, Number(job.duration_days) || 1));
  const left = `${(start / days) * 100}%`;
  const width = `${(duration / days) * 100}%`;

  return (
    <div
      className="absolute top-1/2 z-10 flex h-9 -translate-y-1/2 items-center overflow-hidden rounded-lg px-2 text-left shadow-sm"
      style={{
        left,
        width,
        minWidth: 54,
        background: job.color || "hsl(220,70%,55%)",
      }}
      title={`${job.id} - ${job.client}`}
    >
      <span className="truncate font-[Montserrat] text-[11px] font-bold leading-none text-white">
        {job.id}
      </span>
    </div>
  );
}
