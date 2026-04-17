// ProfileSkeleton.tsx — Estado de carga del perfil
export function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mx-auto max-w-screen-xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          {/* Sidebar skeleton */}
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <div className="flex flex-col items-center gap-3">
              <div className="h-24 w-24 rounded-full bg-muted" />
              <div className="h-5 w-40 rounded bg-muted" />
              <div className="h-4 w-24 rounded bg-muted" />
            </div>
            <div className="my-5 border-t border-border/50" />
            <div className="h-12 w-full rounded-xl bg-muted" />
            <div className="mt-4 space-y-2.5">
              <div className="h-4 w-28 rounded bg-muted" />
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-4 w-36 rounded bg-muted" />
            </div>
          </div>

          {/* Main content skeleton */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <div className="mb-3 h-5 w-40 rounded bg-muted" />
              <div className="space-y-2">
                <div className="h-3.5 w-full rounded bg-muted" />
                <div className="h-3.5 w-5/6 rounded bg-muted" />
                <div className="h-3.5 w-4/6 rounded bg-muted" />
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <div className="mb-4 h-5 w-40 rounded bg-muted" />
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 w-20 rounded bg-muted" />
                    <div className="h-5 w-28 rounded bg-muted" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio skeleton */}
        <div className="mt-10">
          <div className="mb-4 h-6 w-48 rounded bg-muted" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
