import { NextRequest } from "next/server";
import { authenticateRequest, apiError, apiSuccess } from "@/lib/apiAuth";

/**
 * POST /api/shortcuts/odometer
 *
 * Add or update a daily odometer reading.
 *
 * Header: Authorization: Bearer <access_token>
 * Body: {
 *   "vehicle_id": "uuid",
 *   "date": "YYYY-MM-DD",          (optional — defaults to today)
 *   "odometerReading": 12345.6,     (accepts decimals)
 *   "notes": "optional text"
 * }
 *
 * If an entry already exists for the same vehicle + date, it is
 * updated in-place (not deleted). Otherwise a new row is inserted.
 *
 * Returns: { success, id, action: "created" | "updated", message }
 */
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if ("error" in auth) return auth.error;

  const { supabase, userId } = auth;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body.");
  }

  const vehicle_id = body.vehicle_id as string | undefined;
  const date = (body.date as string | undefined) ?? new Date().toISOString().slice(0, 10);
  const odometerReading = Number(body.odometerReading);
  const notes = (body.notes as string | undefined) ?? null;

  // --- Validation ---
  if (!vehicle_id) {
    return apiError("'vehicle_id' is required. Use the /api/shortcuts/vehicles endpoint to get your vehicle IDs.");
  }

  if (!Number.isFinite(odometerReading) || odometerReading < 0) {
    return apiError("'odometerReading' must be a positive number (decimals allowed).");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return apiError("'date' must be in YYYY-MM-DD format.");
  }

  // Verify the vehicle belongs to this user
  const { data: vehicle, error: vehError } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", vehicle_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (vehError || !vehicle) {
    return apiError("Vehicle not found or does not belong to your account.");
  }

  // --- Check for existing entry on same vehicle + date ---
  const { data: existing } = await supabase
    .from("daily_odometer_entries")
    .select("id")
    .eq("user_id", userId)
    .eq("vehicle_id", vehicle_id)
    .eq("date", date)
    .maybeSingle();

  let entryId: string;
  let action: "created" | "updated";

  if (existing) {
    // Update the existing entry in place
    const { error: updateError } = await supabase
      .from("daily_odometer_entries")
      .update({ odometerReading, notes })
      .eq("id", existing.id);

    if (updateError) {
      return apiError(`Failed to update entry: ${updateError.message}`, 500);
    }
    entryId = existing.id;
    action = "updated";
  } else {
    // Insert new entry
    const { data: inserted, error: insertError } = await supabase
      .from("daily_odometer_entries")
      .insert({
        user_id: userId,
        vehicle_id,
        date,
        odometerReading,
        notes,
      })
      .select("id")
      .single();

    if (insertError) {
      return apiError(`Failed to save entry: ${insertError.message}`, 500);
    }
    entryId = inserted.id;
    action = "created";
  }

  // --- Calculate distance driven, fuel consumed, and money spent ---
  const { data: prevEntry } = await supabase
    .from("daily_odometer_entries")
    .select("odometerReading, date")
    .eq("vehicle_id", vehicle_id)
    .lt("date", date)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: prevFill } = await supabase
    .from("fuel_fillups")
    .select("odometerAtFill, date")
    .eq("vehicle_id", vehicle_id)
    .lt("date", date)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const prevOdometer = Math.max(
    Number(prevEntry?.odometerReading ?? 0),
    Number(prevFill?.odometerAtFill ?? 0)
  );

  const distanceDriven = prevOdometer > 0 && odometerReading > prevOdometer
    ? Number((odometerReading - prevOdometer).toFixed(1))
    : 0;

  // Retrieve fillups for vehicle to calculate 20-fillup average mileage (-10%) and price per litre
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
      avgMileage = Number(((dist / totalFuel) * 0.90).toFixed(2));
    }
  }

  // Fallback to vehicle typicalMileage if < 2 fillups
  if (avgMileage <= 0) {
    const { data: vehData } = await supabase
      .from("vehicles")
      .select("typicalMileage")
      .eq("id", vehicle_id)
      .maybeSingle();
    if (vehData?.typicalMileage && Number(vehData.typicalMileage) > 0) {
      avgMileage = Number(vehData.typicalMileage);
    }
  }

  // Price per litre from latest fillup
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
  let moneySpent: number | null = null;
  if (distanceDriven > 0 && avgMileage > 0) {
    fuelConsumed = Number((distanceDriven / avgMileage).toFixed(2));
    if (pricePerLitre > 0) {
      moneySpent = Number((fuelConsumed * pricePerLitre).toFixed(2));
    }
  }

  let message = `✅ Odometer ${action === "updated" ? "updated to" : "saved at"} ${odometerReading} for ${date}.`;
  if (distanceDriven > 0 && fuelConsumed != null) {
    message = `✅ Odometer ${action === "updated" ? "updated to" : "saved at"} ${odometerReading} (+${distanceDriven} km). Est. fuel: ${fuelConsumed} L${moneySpent != null ? ` (₹${Math.round(moneySpent)})` : ""}.`;
  }

  return apiSuccess(
    {
      id: entryId,
      action,
      odometerReading,
      distanceDriven: distanceDriven > 0 ? distanceDriven : null,
      avgMileage: avgMileage > 0 ? avgMileage : null,
      fuelConsumed,
      moneySpent,
      pricePerLitre: pricePerLitre > 0 ? Number(pricePerLitre.toFixed(2)) : null,
      message,
    },
    action === "created" ? 201 : 200
  );
}
