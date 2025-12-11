"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { Vehicle } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

export const TripForm = ({ userId, vehicles }: { userId: string; vehicles: Vehicle[] }) => {
  const supabase = createSupabaseBrowserClient();
  const { push } = useToast();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    setLoading(true);
    const vehicle_id = String(formData.get("vehicle_id"));
    const start_date = String(formData.get("start_date"));
    const end_date = String(formData.get("end_date"));
    const start_odometer = Number(formData.get("start_odometer"));
    const end_odometer = Number(formData.get("end_odometer"));
    const fuelVolume = formData.get("fuelVolume") ? Number(formData.get("fuelVolume")) : null;
    const totalCost = formData.get("totalCost") ? Number(formData.get("totalCost")) : null;
    const notes = String(formData.get("notes") || "") || null;

    if (end_odometer < start_odometer) {
      setError("End odometer cannot be less than start.");
      setLoading(false);
      return;
    }
    if (!start_date || !end_date) {
      setError("Start and end time are required.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("trips").insert({
      user_id: userId,
      vehicle_id,
      start_date,
      end_date,
      start_odometer,
      end_odometer,
      fuelvolume: fuelVolume,
      totalcost: totalCost,
      notes,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      push({ message: "Trip saved", type: "success" });
      router.refresh();
    }
    setLoading(false);
  };

  const nowIso = new Date().toISOString().slice(0, 16);

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
      <Input name="start_date" label="Start date/time" type="datetime-local" required defaultValue={nowIso} />
      <Input name="end_date" label="End date/time" type="datetime-local" required defaultValue={nowIso} />
      <Input name="start_odometer" label="Start odometer" type="number" step="0.01" min={0} required />
      <Input name="end_odometer" label="End odometer" type="number" step="0.01" min={0} required />
      <Input name="fuelVolume" label="Fuel volume (optional)" type="number" step="0.01" min={0} />
      <Input name="totalCost" label="Total cost (optional)" type="number" step="0.01" min={0} />
      <Textarea name="notes" label="Notes" placeholder="Trip notes" className="md:col-span-2" />
      <div className="md:col-span-2 flex items-center justify-between">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save trip"}
        </Button>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </form>
  );
};
