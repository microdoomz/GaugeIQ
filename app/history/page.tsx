import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { DailyOdometerEntry, FuelFillUp, Timeframe, Vehicle, UserPreferences } from "@/lib/types";
import { HistoryClient } from "@/components/history/history-client";
export const revalidate = 0;

export default async function HistoryPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect(`/login?redirect=/history`);

  const userId = session.user.id;

  const { data: vehiclesData = [] } = await supabase
    .from("vehicles")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  const { data: entriesData = [] } = await supabase
    .from("daily_odometer_entries")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: true });

  const { data: fillupsData = [] } = await supabase
    .from("fuel_fillups")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: true });

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

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
      <HistoryClient
        entries={(entriesData ?? []) as DailyOdometerEntry[]}
        fillups={(fillupsData ?? []) as FuelFillUp[]}
        vehicles={(vehiclesData ?? []) as Vehicle[]}
        initialTimeframe={("30d" as Timeframe)}
        preferences={prefs}
      />
    </AppShell>
  );
}
