import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { PreferencesClient } from "@/components/settings/preferences-client";
import { UserPreferences } from "@/lib/types";
export const revalidate = 0;

export default async function SettingsPage() {
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
    redirect(`/login?redirect=/settings`);
  }

  if (!session) redirect(`/login?redirect=/settings`);

  const userId = session.user.id;
  const { data: profile } = await trace("profiles", async () =>
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()
  );

  const initialPrefs: UserPreferences = {
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
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-wide text-[hsl(var(--foreground))]/60">Settings</p>
          <h1 className="text-2xl font-semibold">Preferences</h1>
          <p className="text-sm text-[hsl(var(--foreground))]/70">
            Control units, currency, and reminders.
          </p>
        </div>
        <PreferencesClient userId={userId} initialPrefs={initialPrefs} />
      </div>
    </AppShell>
  );
}
