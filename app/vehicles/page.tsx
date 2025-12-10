import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { VehicleForm } from "@/components/forms/vehicle-form";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { Vehicle, UserPreferences } from "@/lib/types";
export const revalidate = 0;

export default async function VehiclesPage() {
  const trace = async <T,>(label: string, fn: () => Promise<T>) => {
    const start = Date.now();
    const result = await fn();
    if (process.env.SUPABASE_TRACE === "true") {
      console.log(`[supabase] ${label} ${Date.now() - start}ms`);
    }
    return result;
  };

  const supabase = createSupabaseServerClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.warn("auth.getSession error", sessionError.message);
    redirect(`/login?redirect=/vehicles`);
  }

  if (!session) redirect(`/login?redirect=/vehicles`);

  const userId = session.user.id;
  const [vehiclesRes, profileRes] = await Promise.all([
    trace("vehicles", async () =>
      supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
    ),
    trace("profiles", async () =>
      supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle()
    ),
  ]);

  const vehiclesData = vehiclesRes.data ?? [];
  const profile = profileRes.data;

  const vehicles = (vehiclesData ?? []) as Vehicle[];

  const prefs: UserPreferences = {
    currency: profile?.currency ?? "INR",
    distanceUnit: (profile?.distanceUnit as UserPreferences["distanceUnit"]) ?? "km",
    fuelUnit: (profile?.fuelUnit as UserPreferences["fuelUnit"]) ?? "L",
    co2Unit: (profile?.co2unit as UserPreferences["co2Unit"]) ?? "kg",
    theme: (profile?.theme as UserPreferences["theme"]) ?? "light",
    remindersEnabled: profile?.remindersEnabled ?? true,
  };

  const distanceFactor = prefs.distanceUnit === "mi" ? 0.621371 : 1;
  const fuelFactor = prefs.fuelUnit === "gal" ? 0.264172 : 1;
  const mileageUnitLabel = `${prefs.distanceUnit}/${prefs.fuelUnit}`;

  return (
    <AppShell
      email={session.user.email ?? undefined}
      userId={userId}
      displayName={profile?.displayName}
      namePromptDismissed={profile?.namePromptDismissed ?? false}
    >
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-wide text-[hsl(var(--foreground))]/60">Garage</p>
          <h1 className="text-2xl font-semibold">Manage vehicles</h1>
          <p className="text-sm text-[hsl(var(--foreground))]/70">Add vehicles to track odometer, fuel, and mileage benchmarks.</p>
        </div>

        <div className="glass-card p-4">
          <h2 className="text-lg font-semibold">Add a vehicle</h2>
          <p className="text-sm text-[hsl(var(--foreground))]/70">We auto-fill typical mileage when available.</p>
          <div className="mt-4">
            <VehicleForm userId={userId} />
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your vehicles</h2>
            <p className="text-xs text-[hsl(var(--foreground))]/60">{vehicles.length} saved</p>
          </div>
          <div className="mt-3 divide-y divide-[hsl(var(--border))] text-sm">
            {vehicles.map((v: Vehicle) => (
              <div key={v.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{v.make} {v.model} {v.variant ? `· ${v.variant}` : ""}</p>
                  <p className="text-[hsl(var(--foreground))]/70">{v.year} · {v.vehicleType} · {v.fuelType}</p>
                </div>
                <div className="text-right">
                  <p className="text-[hsl(var(--foreground))]/70">Typical mileage</p>
                  <p className="font-semibold">
                    {v.typicalMileage
                      ? `${(v.typicalMileage * distanceFactor / (fuelFactor || 1)).toFixed(1)} ${mileageUnitLabel}`
                      : "—"}
                  </p>
                </div>
              </div>
            ))}
            {!vehicles.length && <p className="py-3 text-[hsl(var(--foreground))]/60">No vehicles yet. Add one to begin tracking.</p>}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
