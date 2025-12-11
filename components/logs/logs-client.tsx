"use client";

import { useEffect, useMemo, useState } from "react";
import { FuelForm } from "@/components/forms/fuel-form";
import { OdometerForm } from "@/components/forms/odometer-form";
import { DailyOdometerEntry, FuelFillUp, Vehicle, UserPreferences } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { projectedRange } from "@/lib/calculations";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface LogsClientProps {
  userId: string;
  vehicles: Vehicle[];
  entries: DailyOdometerEntry[];
  fillups: FuelFillUp[];
  metrics: { avgMileage: number };
  preferences: UserPreferences;
}

const twoDecimal = (n: number) => Number(n.toFixed(2));

export default function LogsClient({ userId, vehicles, entries, fillups, metrics, preferences }: LogsClientProps) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const { push } = useToast();
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<UserPreferences>(preferences);
  const [confirm, setConfirm] = useState<{ id: string; type: "fuel" | "odo" } | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    setPrefs(preferences);
  }, [preferences]);

  const distanceFactor = prefs.distanceUnit === "mi" ? 0.621371 : 1;
  const fuelFactor = prefs.fuelUnit === "gal" ? 0.264172 : 1;
  const distanceUnitLabel = prefs.distanceUnit;
  const fuelUnitLabel = prefs.fuelUnit;
  const currencyFmt = new Intl.NumberFormat("en", {
    style: "currency",
    currency: prefs.currency,
    maximumFractionDigits: 0,
  });

  const fmtDistance = (v: number) => twoDecimal(v * distanceFactor);
  const fmtFuel = (v: number) => twoDecimal(v * fuelFactor);

  const latestFill = useMemo(() => {
    return [...fillups].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [fillups]);

  const avgDailyDistance = useMemo(() => {
    if (entries.length < 2) return 0;
    const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const days = Math.max(1, (new Date(sorted.at(-1)!.date).getTime() - new Date(sorted[0].date).getTime()) / (1000 * 60 * 60 * 24));
    const distance = Math.max(0, sorted.at(-1)!.odometerReading - sorted[0].odometerReading);
    return distance / days;
  }, [entries]);

  const longevity = useMemo(() => {
    const fuelLitres = latestFill?.fuelVolume ?? 0;
    return projectedRange(metrics.avgMileage, fuelLitres, avgDailyDistance);
  }, [latestFill, metrics.avgMileage, avgDailyDistance]);

  useEffect(() => {
    const handler = () => router.refresh();
    window.addEventListener("gaugeiq-prefs-updated", handler);
    return () => window.removeEventListener("gaugeiq-prefs-updated", handler);
  }, [router]);

  const handleDelete = async (id: string, type: "fuel" | "odo") => {
    setDeletingId(id);
    const { error } =
      type === "fuel"
        ? await supabase.from("fuel_fillups").delete().eq("id", id)
        : await supabase.from("daily_odometer_entries").delete().eq("id", id);

    if (error) {
      push({ message: error.message, type: "error" });
    } else {
      setSuccess("Deleted");
      push({ message: "Deleted", type: "success" });
      router.refresh();
    }
    setDeletingId(null);
    setConfirm(null);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-xs uppercase tracking-wide text-[hsl(var(--foreground))]/60">Logs</p>
        <h1 className="text-2xl font-semibold">Add odometer and fuel entries</h1>
        <p className="text-sm text-[hsl(var(--foreground))]/70">Dates default to today, but you can backfill any past day.</p>
      </div>

      {success && <p className="text-center text-green-600 text-sm">{success}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-card p-4 space-y-3">
          <div className="text-center">
            <h2 className="text-lg font-semibold">Daily odometer</h2>
            <p className="text-sm text-[hsl(var(--foreground))]/70">Record today’s reading to keep distance and projections accurate.</p>
          </div>
          <OdometerForm userId={userId} vehicles={vehicles} preferences={preferences} />

          <div className="pt-2 border-t border-[hsl(var(--border))]">
            <h3 className="text-sm font-semibold mb-2 text-center">Recent odometer entries</h3>
            <div className="space-y-2 max-h-64 overflow-auto">
              {entries
                .slice()
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 5)
                .map((e) => (
                  <div key={e.id} className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm">
                    <span>{e.date} · {fmtDistance(e.odometerReading)} {distanceUnitLabel}</span>
                    <Button
                      variant="ghost"
                      disabled={deletingId === e.id}
                      onClick={() => setConfirm({ id: e.id, type: "odo" })}
                    >
                      {deletingId === e.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                ))}
              {!entries.length && <p className="text-[hsl(var(--foreground))]/60 text-sm text-center">No entries yet.</p>}
            </div>
          </div>
        </div>

        <div className="glass-card p-4 space-y-3">
          <div className="text-center">
            <h2 className="text-lg font-semibold">Fuel fill-up</h2>
            <p className="text-sm text-[hsl(var(--foreground))]/70">Track fuel volume, cost, and odometer at fill for mileage cycles.</p>
          </div>
          <FuelForm userId={userId} vehicles={vehicles} preferences={preferences} />

          <div className="pt-2 border-t border-[hsl(var(--border))] space-y-2">
            <h3 className="text-sm font-semibold mb-1 text-center">Recent fuel fill-ups</h3>
            {latestFill && metrics.avgMileage > 0 && (
              <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 px-3 py-2 text-sm text-center">
                <p className="font-medium">This fill-up projected</p>
                <p className="text-[hsl(var(--foreground))]/80">~{fmtDistance(longevity.km)} {distanceUnitLabel} · ~{longevity.days} days</p>
              </div>
            )}
            <div className="space-y-2 max-h-64 overflow-auto">
              {fillups
                .slice()
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 5)
                .map((f) => (
                  <div key={f.id} className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm">
                    <span>
                      {f.date} · {fmtFuel(f.fuelVolume)} {fuelUnitLabel} · {currencyFmt.format(f.totalCost)} ·
                      Odo {fmtDistance(f.odometerAtFill)} {distanceUnitLabel}
                    </span>
                    <Button
                      variant="ghost"
                      disabled={deletingId === f.id}
                      onClick={() => setConfirm({ id: f.id, type: "fuel" })}
                    >
                      {deletingId === f.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                ))}
              {!fillups.length && <p className="text-[hsl(var(--foreground))]/60 text-sm text-center">No fill-ups yet.</p>}
            </div>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete entry?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm && handleDelete(confirm.id, confirm.type)}
        loading={Boolean(deletingId)}
      />
    </div>
  );
}
