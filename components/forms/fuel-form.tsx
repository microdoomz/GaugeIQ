"use client";

import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Vehicle, UserPreferences } from "@/lib/types";

export const FuelForm = ({ userId, vehicles, onSaved, preferences }: { userId: string; vehicles: Vehicle[]; onSaved?: () => void; preferences?: UserPreferences }) => {
  const supabase = createSupabaseBrowserClient();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const distanceUnitLabel = preferences?.distanceUnit ?? "km";
  const fuelUnitLabel = preferences?.fuelUnit ?? "L";

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    const vehicle_id = String(formData.get("vehicle_id"));
    const date = String(formData.get("date"));
    const odometerAtFill = Number(formData.get("odometerAtFill"));
    const fuelVolume = Number(formData.get("fuelVolume"));
    const totalCost = Number(formData.get("totalCost"));
    const fuelPricePerLitre = fuelVolume ? totalCost / fuelVolume : null;
    const stationName = String(formData.get("stationName") || "") || null;
    const notes = String(formData.get("notes") || "") || null;

    // Inline validation: fuel odometer should not be behind latest odometer entry
    const { data: latestOdo } = await supabase
      .from("daily_odometer_entries")
      .select("odometerReading")
      .eq("vehicle_id", vehicle_id)
      .lte("date", date)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestOdo && odometerAtFill < Number(latestOdo.odometerReading)) {
      setError("Odometer at fill cannot be less than your last odometer entry for this vehicle.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("fuel_fillups").insert({
      user_id: userId,
      vehicle_id,
      date,
      odometerAtFill,
      fuelVolume,
      totalCost,
      fuelPricePerLitre,
      stationName,
      notes,
    });
    if (insertError) setError(insertError.message);
    else {
      setSuccess("Saved");
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
      <Input name="odometerAtFill" label={`Odometer at fill (${distanceUnitLabel})`} type="number" required min={0} step="0.01" />
      <Input name="fuelVolume" label={`Fuel volume (${fuelUnitLabel})`} type="number" step="0.01" required min={0} />
      <Input name="totalCost" label="Total cost" type="number" step="0.01" required min={0} />
      <Input name="stationName" label="Station name" placeholder="Optional" />
      <Textarea name="notes" label="Notes" placeholder="Optional" className="md:col-span-2" />
      <div className="md:col-span-2 flex items-center justify-between">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save fill-up"}
        </Button>
        <div className="flex items-center gap-3">
          {success && <p className="text-sm text-green-600">{success}</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      </div>
    </form>
  );
};
