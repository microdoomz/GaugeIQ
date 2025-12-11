"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { Trip, Vehicle } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { computeTripEstimates } from "@/lib/calculations";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export const TripsList = ({ trips, vehicles }: { trips: Trip[]; vehicles: Vehicle[] }) => {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const { push } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from("trips").delete().eq("id", id);
    if (error) {
      push({ message: error.message, type: "error" });
    } else {
      push({ message: "Trip deleted", type: "success" });
      router.refresh();
    }
    setDeletingId(null);
    setConfirmId(null);
  };

  if (!trips.length) {
    return <p className="text-sm text-[hsl(var(--foreground))]/70">No trips yet. Create one to see it here.</p>;
  }

  return (
    <div className="space-y-3">
      {trips.map((trip) => {
        const vehicle = vehicles.find((v) => v.id === trip.vehicle_id);
        const pricePerLitre = trip.fuelVolume && trip.totalCost ? trip.totalCost / trip.fuelVolume : null;
        const estimates = computeTripEstimates({
          startOdometer: trip.start_odometer,
          endOdometer: trip.end_odometer,
          fuelVolume: trip.fuelVolume ?? undefined,
          typicalMileage: vehicle?.typicalMileage ?? undefined,
          fuelType: vehicle?.fuelType ?? null,
          pricePerLitre,
        });
        return (
          <div key={trip.id} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm text-[hsl(var(--foreground))]/70">{vehicle ? `${vehicle.make} ${vehicle.model}` : "Vehicle"}</p>
                <p className="text-lg font-semibold">{new Date(trip.start_date).toLocaleString()} → {new Date(trip.end_date).toLocaleString()}</p>
              </div>
              <Button
                variant="secondary"
                onClick={() => setConfirmId(trip.id)}
                disabled={deletingId === trip.id}
              >
                {deletingId === trip.id ? "Deleting..." : "Delete"}
              </Button>
            </div>
            <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <p><span className="text-[hsl(var(--foreground))]/70">Distance:</span> {estimates.distance.toFixed(1)}</p>
              <p><span className="text-[hsl(var(--foreground))]/70">Fuel used:</span> {estimates.estimatedFuel?.toFixed(2) ?? "—"}</p>
              <p><span className="text-[hsl(var(--foreground))]/70">CO₂:</span> {estimates.estimatedCO2?.toFixed(2) ?? "—"}</p>
              <p><span className="text-[hsl(var(--foreground))]/70">Cost:</span> {trip.totalCost ?? estimates.estimatedCost?.toFixed(2) ?? "—"}</p>
            </div>
            {trip.notes && <p className="mt-2 text-sm text-[hsl(var(--foreground))]/70">{trip.notes}</p>}
          </div>
        );
      })}
      <ConfirmDialog
        open={Boolean(confirmId)}
        title="Delete trip?"
        description="This action permanently removes the trip."
        confirmLabel="Delete"
        onCancel={() => setConfirmId(null)}
        onConfirm={() => confirmId && handleDelete(confirmId)}
        loading={Boolean(deletingId)}
      />
    </div>
  );
};
