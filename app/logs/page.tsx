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
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect(`/login?redirect=/logs`);

  const userId = session.user.id;
  const { data: vehicles = [] } = await supabase
    .from("vehicles")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  const { data: entries = [] } = await supabase
    .from("daily_odometer_entries")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: true });

  const { data: fillups = [] } = await supabase
    .from("fuel_fillups")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: true });

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

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
