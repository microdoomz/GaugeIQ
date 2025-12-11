import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { Vehicle, Trip } from "@/lib/types";
import { TripForm } from "@/components/trips/trip-form";
import { TripsList } from "@/components/trips/trips-list";
export const revalidate = 0;

export default async function TripsPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect(`/login?redirect=/trips`);
  const userId = session.user.id;

  const [{ data: vehiclesData = [] }, { data: tripsData = [] }, { data: profile }] = await Promise.all([
    supabase
      .from("vehicles")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase
      .from("trips")
      .select("*")
      .eq("user_id", userId)
      .order("start_date", { ascending: false }),
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const vehicles = (vehiclesData ?? []) as Vehicle[];
  const trips = (tripsData ?? []).map((trip) => ({
    ...trip,
    fuelVolume: (trip as any).fuelvolume ?? (trip as any).fuelVolume ?? null,
    totalCost: (trip as any).totalcost ?? (trip as any).totalCost ?? null,
  })) as Trip[];

  return (
    <AppShell
      email={session.user.email ?? undefined}
      userId={userId}
      displayName={profile?.displayName}
      namePromptDismissed={profile?.namePromptDismissed ?? false}
    >
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-wide text-[hsl(var(--foreground))]/60">Trips</p>
          <h1 className="text-2xl font-semibold">Plan and review trips</h1>
          <p className="text-sm text-[hsl(var(--foreground))]/70">Track odometer-based trip segments with optional fuel and cost.</p>
        </div>

        <div className="glass-card p-4">
          <h2 className="text-lg font-semibold">New trip</h2>
          <p className="text-sm text-[hsl(var(--foreground))]/70">Capture start/end, odometer, and optional fuel/cost.</p>
          <div className="mt-4">
            <TripForm userId={userId} vehicles={vehicles} />
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Your trips</h2>
            <p className="text-xs text-[hsl(var(--foreground))]/60">{trips.length} saved</p>
          </div>
          <div className="mt-3">
            <TripsList trips={trips} vehicles={vehicles} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
