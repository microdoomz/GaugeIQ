import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { DailyOdometerEntry, FuelFillUp, Vehicle, UserPreferences } from "@/lib/types";
import { OdometerForm } from "@/components/forms/odometer-form";
import { FuelForm } from "@/components/forms/fuel-form";
import { aggregateMetrics } from "@/lib/calculations";
import LogsClient from "@/components/logs/logs-client";
export const revalidate = 0;

export default async function LogsPage() {
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
    redirect(`/login?redirect=/logs`);
  }

  if (!session) redirect(`/login?redirect=/logs`);

  const userId = session.user.id;
  const [vehiclesRes, entriesRes, fillupsRes, profileRes] = await Promise.all([
    trace("vehicles", async () =>
      supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
    ),
    trace("daily_odometer_entries", async () =>
      supabase
        .from("daily_odometer_entries")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: true })
    ),
    trace("fuel_fillups", async () =>
      supabase
        .from("fuel_fillups")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: true })
    ),
    trace("profiles", async () =>
      supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle()
    ),
  ]);

  const vehicles = vehiclesRes.data ?? [];
  const entries = entriesRes.data ?? [];
  const fillups = fillupsRes.data ?? [];
  const profile = profileRes.data;

  const metrics = aggregateMetrics(
    (entries ?? []) as DailyOdometerEntry[],
    (fillups ?? []) as FuelFillUp[],
    (vehicles ?? []) as Vehicle[]
  );

  const prefs: UserPreferences = {
    currency: profile?.currency ?? "INR",
    distanceUnit: (profile?.distanceUnit as UserPreferences["distanceUnit"]) ?? "km",
    fuelUnit: (profile?.fuelUnit as UserPreferences["fuelUnit"]) ?? "L",
    co2Unit: (profile?.co2unit as UserPreferences["co2Unit"]) ?? "kg",
    theme: (profile?.theme as UserPreferences["theme"]) ?? "light",
    remindersEnabled: profile?.remindersEnabled ?? true,
  };

  return (
    <AppShell
      email={session.user.email ?? undefined}
      userId={userId}
      displayName={profile?.displayName}
      namePromptDismissed={profile?.namePromptDismissed ?? false}
    >
      <LogsClient
        userId={userId}
        vehicles={vehicles as Vehicle[]}
        entries={entries as DailyOdometerEntry[]}
        fillups={fillups as FuelFillUp[]}
        metrics={metrics}
        preferences={prefs}
      />
    </AppShell>
  );
}
