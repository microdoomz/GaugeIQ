"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import clsx from "classnames";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { UserPreferences } from "@/lib/types";
import { useRouter } from "next/navigation";

export function PreferencesClient({
  userId,
  initialPrefs,
}: {
  userId: string;
  initialPrefs: UserPreferences;
}) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [prefs, setPrefs] = useState<UserPreferences>(initialPrefs);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setPrefs(initialPrefs);
  }, [initialPrefs]);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    const basePayload = {
      user_id: userId,
      currency: prefs.currency,
      distanceUnit: prefs.distanceUnit,
      fuelUnit: prefs.fuelUnit,
      co2unit: prefs.co2Unit,
      theme: prefs.theme ?? "light",
      remindersEnabled: prefs.remindersEnabled,
    };

    const attempt = async (payload: Record<string, unknown>) =>
      supabase.from("profiles").upsert(payload, { onConflict: "user_id" });

    const { error: upsertError } = await attempt(basePayload);

    if (upsertError) {
      setError(upsertError.message);
      setSaving(false);
      return;
    }

    setSaved(true);
    setSuccess("Saved");
    setTimeout(() => setSaved(false), 1500);
    router.refresh();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("gaugeiq-prefs-updated"));
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <h2 className="text-lg font-semibold">Units & currency</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Currency</span>
            <select
              value={prefs.currency}
              onChange={(e) => setPrefs((p) => ({ ...p, currency: e.target.value }))}
              className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm"
            >
              {[
                "INR",
                "USD",
                "EUR",
                "GBP",
                "AUD",
                "CAD",
                "SGD",
                "JPY",
                "CNY",
              ].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <span className="font-medium">Theme</span>
            <div className="flex gap-2">
              {["light", "dark"].map((theme) => (
                <button
                  key={theme}
                  onClick={() => setPrefs((p) => ({ ...p, theme: theme as UserPreferences["theme"] }))}
                  className={clsx(
                    "rounded-lg border px-3 py-2 capitalize",
                    (prefs.theme ?? "light") === theme
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                      : "border-[hsl(var(--border))] text-[hsl(var(--foreground))]/80"
                  )}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <span className="font-medium">Distance unit</span>
            <div className="flex gap-2">
              {["km", "mi"].map((unit) => (
                <button
                  key={unit}
                  onClick={() => setPrefs((p) => ({ ...p, distanceUnit: unit as UserPreferences["distanceUnit"] }))}
                  className={clsx(
                    "rounded-lg border px-3 py-2",
                    prefs.distanceUnit === unit
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                      : "border-[hsl(var(--border))] text-[hsl(var(--foreground))]/80"
                  )}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <span className="font-medium">Fuel unit</span>
            <div className="flex gap-2">
              {["L", "gal"].map((unit) => (
                <button
                  key={unit}
                  onClick={() => setPrefs((p) => ({ ...p, fuelUnit: unit as UserPreferences["fuelUnit"] }))}
                  className={clsx(
                    "rounded-lg border px-3 py-2",
                    prefs.fuelUnit === unit
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                      : "border-[hsl(var(--border))] text-[hsl(var(--foreground))]/80"
                  )}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <span className="font-medium">CO₂ unit</span>
            <div className="flex gap-2">
              {["kg", "lb"].map((unit) => (
                <button
                  key={unit}
                  onClick={() => setPrefs((p) => ({ ...p, co2Unit: unit as UserPreferences["co2Unit"] }))}
                  className={clsx(
                    "rounded-lg border px-3 py-2",
                    prefs.co2Unit === unit
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                      : "border-[hsl(var(--border))] text-[hsl(var(--foreground))]/80"
                  )}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={prefs.remindersEnabled}
              onChange={(e) => setPrefs((p) => ({ ...p, remindersEnabled: e.target.checked }))}
            />
            Enable daily reminders to log odometer
          </label>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save preferences"}
          </Button>
          {success && <span className="text-sm text-green-600">{success}</span>}
          {error && <span className="text-sm text-red-500">{error}</span>}
        </div>
      </div>
    </div>
  );
}
