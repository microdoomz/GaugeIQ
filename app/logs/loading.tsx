export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="text-center animate-pulse space-y-2">
        <div className="mx-auto h-3 w-28 rounded bg-[hsl(var(--muted))]/60" />
        <div className="mx-auto h-6 w-40 rounded bg-[hsl(var(--muted))]/60" />
        <div className="mx-auto h-4 w-56 rounded bg-[hsl(var(--muted))]/50" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-card animate-pulse p-4 space-y-3">
          <div className="h-5 w-36 rounded bg-[hsl(var(--muted))]/60" />
          <div className="h-12 rounded-lg bg-[hsl(var(--muted))]/40" />
          <div className="h-12 rounded-lg bg-[hsl(var(--muted))]/40" />
        </div>
        <div className="glass-card animate-pulse p-4 space-y-3">
          <div className="h-5 w-32 rounded bg-[hsl(var(--muted))]/60" />
          <div className="h-12 rounded-lg bg-[hsl(var(--muted))]/40" />
          <div className="h-12 rounded-lg bg-[hsl(var(--muted))]/40" />
        </div>
      </div>

      <div className="glass-card animate-pulse p-4 space-y-3">
        <div className="h-5 w-40 rounded bg-[hsl(var(--muted))]/60" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-10 rounded-lg bg-[hsl(var(--muted))]/40" />
          ))}
        </div>
      </div>
    </div>
  );
}
