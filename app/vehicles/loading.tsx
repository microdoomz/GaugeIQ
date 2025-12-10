export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="text-center animate-pulse space-y-2">
        <div className="mx-auto h-3 w-32 rounded bg-[hsl(var(--muted))]/60" />
        <div className="mx-auto h-6 w-48 rounded bg-[hsl(var(--muted))]/60" />
        <div className="mx-auto h-4 w-64 rounded bg-[hsl(var(--muted))]/50" />
      </div>

      <div className="glass-card animate-pulse p-4 space-y-3">
        <div className="h-5 w-40 rounded bg-[hsl(var(--muted))]/60" />
        <div className="h-4 w-52 rounded bg-[hsl(var(--muted))]/50" />
        <div className="mt-3 h-12 rounded-lg bg-[hsl(var(--muted))]/40" />
      </div>

      <div className="glass-card animate-pulse p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 rounded bg-[hsl(var(--muted))]/60" />
          <div className="h-4 w-16 rounded bg-[hsl(var(--muted))]/50" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-14 rounded-lg bg-[hsl(var(--muted))]/40" />
          ))}
        </div>
      </div>
    </div>
  );
}
