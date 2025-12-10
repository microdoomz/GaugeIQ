export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="glass-card animate-pulse p-4">
            <div className="h-4 w-24 rounded bg-[hsl(var(--muted))]/60" />
            <div className="mt-3 h-6 w-28 rounded bg-[hsl(var(--muted))]/60" />
            <div className="mt-2 h-4 w-20 rounded bg-[hsl(var(--muted))]/50" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, idx) => (
          <div key={idx} className="glass-card animate-pulse p-4">
            <div className="h-5 w-40 rounded bg-[hsl(var(--muted))]/60" />
            <div className="mt-2 h-4 w-32 rounded bg-[hsl(var(--muted))]/50" />
            <div className="mt-4 h-56 w-full rounded-xl bg-[hsl(var(--muted))]/40" />
          </div>
        ))}
      </div>

      <div className="glass-card animate-pulse p-4">
        <div className="h-5 w-36 rounded bg-[hsl(var(--muted))]/60" />
        <div className="mt-2 grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-52 rounded-xl bg-[hsl(var(--muted))]/40" />
          ))}
        </div>
      </div>

      <div className="glass-card animate-pulse p-4">
        <div className="h-5 w-32 rounded bg-[hsl(var(--muted))]/60" />
        <div className="mt-3 space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-10 rounded-lg bg-[hsl(var(--muted))]/40" />
          ))}
        </div>
      </div>
    </div>
  );
}
