"use client";

import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Vehicle, UserPreferences } from "@/lib/types";
import { useToast } from "../ui/toast";

export const OdometerForm = ({ userId, vehicles, onSaved, preferences }: { userId: string; vehicles: Vehicle[]; onSaved?: () => void; preferences?: UserPreferences }) => {
  const supabase = createSupabaseBrowserClient();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const router = useRouter();
  const { push } = useToast();

  const distanceUnitLabel = preferences?.distanceUnit ?? "km";
  const fuelUnitLabel = preferences?.fuelUnit ?? "L";
  const currency = preferences?.currency ?? "₹";

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError(null);
    setFeedback(null);
    const vehicle_id = String(formData.get("vehicle_id"));
    const date = String(formData.get("date"));
    const odometerReading = Number(formData.get("odometerReading"));
    const notes = String(formData.get("notes") || "") || null;

    // Inline validation: odometer should not go backwards
    const { data: latest } = await supabase
      .from("daily_odometer_entries")
      .select("odometerReading")
      .eq("vehicle_id", vehicle_id)
      .lte("date", date)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latest && odometerReading < Number(latest.odometerReading)) {
      setError("Odometer cannot be less than your last entry for this vehicle.");
      setLoading(false);
      return;
    }

    // Distance driven since previous entry
    const prevOdo = latest ? Number(latest.odometerReading) : 0;
    const distanceDriven = prevOdo > 0 && odometerReading > prevOdo ? odometerReading - prevOdo : 0;

    // Fetch fillups to calculate accurate mileage and price per litre
    const { data: fillups } = await supabase
      .from("fuel_fillups")
      .select("odometerAtFill, fuelVolume, totalCost, fuelPricePerLitre, date")
      .eq("vehicle_id", vehicle_id)
      .order("date", { ascending: true });

    let avgMileage = 0;
    if (fillups && fillups.length >= 2) {
      const recentFills = fillups.slice(-20);
      const firstRecent = recentFills[0];
      const lastRecent = recentFills[recentFills.length - 1];
      const dist = Math.max(Number(lastRecent.odometerAtFill) - Number(firstRecent.odometerAtFill), 0);
      const totalFuel = recentFills.reduce((sum, f) => sum + Number(f.fuelVolume || 0), 0);
      if (dist > 0 && totalFuel > 0) {
        avgMileage = (dist / totalFuel) * 0.90; // 10% reduction
      }
    }

    if (avgMileage <= 0) {
      const v = vehicles.find((veh) => veh.id === vehicle_id);
      if (v?.typicalMileage && v.typicalMileage > 0) avgMileage = v.typicalMileage;
    }

    let pricePerLitre = 0;
    if (fillups && fillups.length > 0) {
      const lastFill = fillups[fillups.length - 1];
      if (lastFill.fuelPricePerLitre && Number(lastFill.fuelPricePerLitre) > 0) {
        pricePerLitre = Number(lastFill.fuelPricePerLitre);
      } else if (lastFill.totalCost && lastFill.fuelVolume && Number(lastFill.fuelVolume) > 0) {
        pricePerLitre = Number(lastFill.totalCost) / Number(lastFill.fuelVolume);
      }
    }

    let fuelConsumed: number | null = null;
    let cost: number | null = null;
    if (distanceDriven > 0 && avgMileage > 0) {
      fuelConsumed = distanceDriven / avgMileage;
      if (pricePerLitre > 0) {
        cost = fuelConsumed * pricePerLitre;
      }
    }

    const { error: insertError } = await supabase.from("daily_odometer_entries").insert({
      user_id: userId,
      vehicle_id,
      date,
      odometerReading,
      notes,
    });
    if (insertError) setError(insertError.message);
    else {
      let msg = "Saved";
      if (distanceDriven > 0 && fuelConsumed != null) {
        msg = `Saved! +${distanceDriven.toFixed(1)} ${distanceUnitLabel} · Fuel consumed: ${fuelConsumed.toFixed(2)} ${fuelUnitLabel}${cost != null ? ` (${currency}${Math.round(cost)})` : ""}`;
        setFeedback(msg);
      }
      push({ message: msg, type: "success" });
      onSaved?.();
      router.refresh();
    }
    setLoading(false);
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Vehicle</span>
        <select
          name="vehicle_id"
          className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm"
          required
        >
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.make} {v.model}
            </option>
          ))}
        </select>
      </label>
      <Input name="date" label="Date" type="date" defaultValue={today} required />
      <Input name="odometerReading" label={`Odometer (${distanceUnitLabel})`} type="number" required min={0} step="0.01" />
      <Textarea name="notes" label="Notes" placeholder="Optional notes" className="md:col-span-2" />
      <div className="md:col-span-2 flex items-center justify-between">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save entry"}
        </Button>
        <div className="flex items-center gap-3">
          {feedback && <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{feedback}</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      </div>
    </form>
  );
};
