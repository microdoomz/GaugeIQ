export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="text-center animate-pulse space-y-2">
        <div className="mx-auto h-3 w-24 rounded bg-[hsl(var(--muted))]/60" />
        <div className="mx-auto h-6 w-40 rounded bg-[hsl(var(--muted))]/60" />
        <div className="mx-auto h-4 w-56 rounded bg-[hsl(var(--muted))]/50" />
      </div>

      <div className="glass-card animate-pulse p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-8 w-36 rounded bg-[hsl(var(--muted))]/60" />
          <div className="h-8 w-28 rounded bg-[hsl(var(--muted))]/50" />
          <div className="h-8 w-24 rounded bg-[hsl(var(--muted))]/50" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-12 rounded-lg bg-[hsl(var(--muted))]/40" />
          ))}
        </div>
      </div>
    </div>
  );
}
