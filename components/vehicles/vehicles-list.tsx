"use client";

import { useState } from "react";
import { Vehicle } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface VehiclesListProps {
  vehicles: Vehicle[];
  distanceFactor: number;
  fuelFactor: number;
  mileageUnitLabel: string;
}

export function VehiclesList({ vehicles, distanceFactor, fuelFactor, mileageUnitLabel }: VehiclesListProps) {
  const supabase = createSupabaseBrowserClient();
  const { push } = useToast();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from("vehicles").delete().eq("id", id);
    if (error) {
      push({ message: error.message, type: "error" });
    } else {
      push({ message: "Vehicle deleted", type: "success" });
      router.refresh();
    }
    setDeletingId(null);
    setConfirmId(null);
  };

  if (!vehicles.length) {
    return <p className="py-3 text-[hsl(var(--foreground))]/60">No vehicles yet. Add one to begin tracking.</p>;
  }

  return (
    <div className="divide-y divide-[hsl(var(--border))] text-sm">
      {vehicles.map((v) => (
        <div key={v.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div>
            <p className="font-medium">{v.make} {v.model} {v.variant ? `· ${v.variant}` : ""}</p>
            <p className="text-[hsl(var(--foreground))]/70">{v.year} · {v.vehicleType} · {v.fuelType}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[hsl(var(--foreground))]/70">Typical mileage</p>
              <p className="font-semibold">
                {v.typicalMileage
                  ? `${((v.typicalMileage * distanceFactor) / (fuelFactor || 1)).toFixed(1)} ${mileageUnitLabel}`
                  : "—"}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => setConfirmId(v.id)}
              disabled={deletingId === v.id}
            >
              {deletingId === v.id ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      ))}
      <ConfirmDialog
        open={Boolean(confirmId)}
        title="Delete vehicle?"
        description="Deleting a vehicle removes its associated data."
        confirmLabel="Delete"
        onCancel={() => setConfirmId(null)}
        onConfirm={() => confirmId && handleDelete(confirmId)}
        loading={Boolean(deletingId)}
      />
    </div>
  );
}
