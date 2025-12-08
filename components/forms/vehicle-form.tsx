"use client";

import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { lookupTypicalMileage } from "@/lib/typicalMileage";
import { FuelType, VehicleType } from "@/lib/types";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

export const VehicleForm = ({ userId, onCreated }: { userId: string; onCreated?: () => void }) => {
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    const make = String(formData.get("make") || "");
    const model = String(formData.get("model") || "");
    const year = Number(formData.get("year") || 0);
    const vehicleType = String(formData.get("vehicleType") || "car") as VehicleType;
    const fuelType = String(formData.get("fuelType") || "petrol") as FuelType;
    const variant = String(formData.get("variant") || "") || null;
    const typicalMileage = lookupTypicalMileage(make, model, year) ?? null;

    const { error: insertError } = await supabase.from("vehicles").insert({
      user_id: userId,
      make,
      model,
      year,
      vehicleType,
      fuelType,
      variant,
      typicalMileage,
    });
    if (insertError) {
      setError(insertError.message);
    } else {
      setSuccess("Saved");
      onCreated?.();
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <form action={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <Input name="make" label="Make" placeholder="Toyota" required />
      <Input name="model" label="Model" placeholder="Corolla" required />
      <Input name="variant" label="Variant" placeholder="Hybrid" />
      <Input name="year" label="Year" type="number" required min={1950} max={2100} />

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Vehicle type</span>
        <select
          name="vehicleType"
          className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm"
          defaultValue="car"
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
          defaultValue="petrol"
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
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save vehicle"}
        </Button>
        <div className="flex items-center gap-3">
          {success && <span className="text-sm text-green-600">{success}</span>}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      </div>
    </form>
  );
};
