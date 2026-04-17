// ListingSkeleton.tsx — Estado de carga: grid de 6 skeleton cards

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 flex-shrink-0 animate-pulse rounded-full bg-neutral-200" />
        <div className="flex flex-col gap-2">
          <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
          <div className="h-3 w-24 animate-pulse rounded bg-neutral-100" />
        </div>
      </div>
      <div className="h-3 w-40 animate-pulse rounded bg-neutral-100" />
      <div className="flex gap-2">
        <div className="h-5 w-24 animate-pulse rounded-full bg-neutral-100" />
        <div className="h-5 w-20 animate-pulse rounded-full bg-neutral-100" />
      </div>
      <div className="flex gap-1.5">
        <div className="h-5 w-10 animate-pulse rounded-md bg-neutral-100" />
        <div className="h-5 w-12 animate-pulse rounded-md bg-neutral-100" />
        <div className="h-5 w-10 animate-pulse rounded-md bg-neutral-100" />
      </div>
    </div>
  );
}

export function ListingSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
