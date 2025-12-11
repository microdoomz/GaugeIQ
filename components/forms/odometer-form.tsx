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
  const router = useRouter();
  const { push } = useToast();

  const distanceUnitLabel = preferences?.distanceUnit ?? "km";

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError(null);
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

    const { error: insertError } = await supabase.from("daily_odometer_entries").insert({
      user_id: userId,
      vehicle_id,
      date,
      odometerReading,
      notes,
    });
    if (insertError) setError(insertError.message);
    else {
      push({ message: "Saved", type: "success" });
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
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      </div>
    </form>
  );
};
