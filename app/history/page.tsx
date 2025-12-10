import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { DailyOdometerEntry, FuelFillUp, Timeframe, Vehicle, UserPreferences } from "@/lib/types";
import { HistoryClient } from "@/components/history/history-client";
export const revalidate = 0;

export default async function HistoryPage() {
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
    redirect(`/login?redirect=/history`);
  }

  if (!session) redirect(`/login?redirect=/history`);

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

  const vehiclesData = vehiclesRes.data ?? [];
  const entriesData = entriesRes.data ?? [];
  const fillupsData = fillupsRes.data ?? [];
  const profile = profileRes.data;

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
