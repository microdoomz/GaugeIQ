"use client";

import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { lookupTypicalMileage, lookupTypicalTankCapacity } from "@/lib/typicalMileage";
import { FuelType, VehicleType, Vehicle } from "@/lib/types";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useToast } from "../ui/toast";

export const VehicleForm = ({ userId, onCreated, initialData, onCancel }: { userId: string; onCreated?: () => void; initialData?: Vehicle; onCancel?: () => void }) => {
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { push } = useToast();

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    setLoading(true);
    const make = String(formData.get("make") || "");
    const model = String(formData.get("model") || "");
    const year = Number(formData.get("year") || 0);
    const vehicleType = String(formData.get("vehicleType") || "car") as VehicleType;
    const fuelType = String(formData.get("fuelType") || "petrol") as FuelType;
    const variant = String(formData.get("variant") || "") || null;
    const typicalMileage = lookupTypicalMileage(make, model, year) ?? null;
    let tankCapacity = formData.get("tankCapacity") ? Number(formData.get("tankCapacity")) : null;
    if (!tankCapacity) {
      tankCapacity = lookupTypicalTankCapacity(make, model, year) ?? null;
    }

    const dataToSave = {
      user_id: userId,
      make,
      model,
      year,
      vehicleType,
      fuelType,
      variant,
      typicalMileage,
      tankCapacity,
    };

    let dbError;
    if (initialData?.id) {
      const { error } = await supabase.from("vehicles").update(dataToSave).eq("id", initialData.id);
      dbError = error;
    } else {
      const { error } = await supabase.from("vehicles").insert(dataToSave);
      dbError = error;
    }

    if (dbError) {
      setError(dbError.message);
    } else {
      push({ message: "Saved", type: "success" });
      onCreated?.();
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <form action={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <Input name="make" label="Make" placeholder="Toyota" required defaultValue={initialData?.make} />
      <Input name="model" label="Model" placeholder="Corolla" required defaultValue={initialData?.model} />
      <Input name="variant" label="Variant" placeholder="Hybrid" defaultValue={initialData?.variant || ""} />
      <Input name="year" label="Year" type="number" required min={1950} max={2100} defaultValue={initialData?.year} />
      <Input name="tankCapacity" label="Tank capacity (Litres)" type="number" step="0.1" min={0} placeholder="Auto-estimated if blank" defaultValue={initialData?.tankCapacity || ""} />

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Vehicle type</span>
        <select
          name="vehicleType"
          className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm"
          defaultValue={initialData?.vehicleType || "car"}
        >
          <option value="car">Car</option>
          <option value="scooter">Scooter</option>
          <option value="bike">Bike</option>
          <option value="truck">Truck</option>
          <option value="van">Van</option>
          <option value="ev">EV</option>
          <option value="other">Other</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Fuel type</span>
        <select
          name="fuelType"
          className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm"
          defaultValue={initialData?.fuelType || "petrol"}
        >
          <option value="petrol">Petrol</option>
          <option value="diesel">Diesel</option>
          <option value="cng">CNG</option>
          <option value="hybrid">Hybrid</option>
          <option value="ev">EV</option>
          <option value="other">Other</option>
        </select>
      </label>

      <div className="md:col-span-2 flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save vehicle"}
          </Button>
          {onCancel && (
            <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      </div>
    </form>
  );
};
