import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { defaultRangeForTimeframe, inactivityReminderNeeded } from "@/lib/calculations";
import { Timeframe, DailyOdometerEntry, FuelFillUp, Vehicle, HistoryItem } from "@/lib/types";
import DashboardClient from "@/components/dashboard/dashboard-client";
import { filterByRange, unifiedHistory } from "@/lib/calculations";
import { AppShell } from "@/components/layout/app-shell";
import { UserPreferences } from "@/lib/types";

export const revalidate = 0;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { timeframe?: Timeframe; from?: string; to?: string };
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect(`/login?redirect=/dashboard`);
  }

  const userId = session!.user.id;

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

  const vehicles = (vehiclesData ?? []) as Vehicle[];
  const entries = (entriesData ?? []) as DailyOdometerEntry[];
  const fillups = (fillupsData ?? []) as FuelFillUp[];

  const timeframe = (searchParams?.timeframe as Timeframe) || "30d";
  const range =
    searchParams?.from && searchParams?.to
      ? { from: new Date(searchParams.from), to: new Date(searchParams.to) }
      : defaultRangeForTimeframe(timeframe);

  const filteredEntries = filterByRange(entries, range.from, range.to);
  const filteredFillups = filterByRange(fillups, range.from, range.to);
  const history: HistoryItem[] = unifiedHistory(filteredEntries, filteredFillups, vehicles);

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
      <DashboardClient
        initialTimeframe={timeframe}
        initialRange={{ from: range.from.toISOString(), to: range.to.toISOString() }}
        entries={entries as DailyOdometerEntry[]}
        fillups={fillups as FuelFillUp[]}
        vehicles={vehicles as Vehicle[]}
        reminderNeeded={inactivityReminderNeeded(entries as DailyOdometerEntry[])}
        initialHistory={history}
        preferences={prefs}
      />
    </AppShell>
  );
}
