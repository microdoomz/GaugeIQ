import { NextRequest } from "next/server";
import { authenticateRequest, apiError, apiSuccess } from "@/lib/apiAuth";

/**
 * POST /api/shortcuts/fuel
 *
 * Record a fuel fill-up.
 *
 * Header: Authorization: Bearer <access_token>
 * Body: {
 *   "vehicle_id": "uuid",
 *   "date": "YYYY-MM-DD",            (optional — defaults to today)
 *   "odometerAtFill": 12345.6,        (accepts decimals)
 *   "fuelVolume": 25.5,               (accepts decimals)
 *   "totalCost": 2500,                (accepts decimals)
 *   "isFullTank": true | false        (optional — defaults to false / partial)
 *   "stationName": "optional text",
 *   "notes": "optional text"
 * }
 *
 * Returns: { success, id, message }
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
  const odometerAtFill = Number(body.odometerAtFill);
  const fuelVolume = Number(body.fuelVolume);
  const totalCost = Number(body.totalCost);
  const isFullTank = body.isFullTank === true || body.isFullTank === "true";
  const stationName = (body.stationName as string | undefined) ?? null;
  const notes = (body.notes as string | undefined) ?? null;

  // --- Validation ---
  if (!vehicle_id) {
    return apiError("'vehicle_id' is required. Use the /api/shortcuts/vehicles endpoint to get your vehicle IDs.");
  }

  if (!Number.isFinite(odometerAtFill) || odometerAtFill < 0) {
    return apiError("'odometerAtFill' must be a positive number (decimals allowed).");
  }

  if (!Number.isFinite(fuelVolume) || fuelVolume <= 0) {
    return apiError("'fuelVolume' must be a positive number greater than 0 (decimals allowed).");
  }

  if (!Number.isFinite(totalCost) || totalCost < 0) {
    return apiError("'totalCost' must be a non-negative number (decimals allowed).");
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

  // Compute price per litre
  const fuelPricePerLitre = fuelVolume > 0 ? totalCost / fuelVolume : null;

  // --- Insert fuel fill-up ---
  const { data: inserted, error: insertError } = await supabase
    .from("fuel_fillups")
    .insert({
      user_id: userId,
      vehicle_id,
      date,
      odometerAtFill,
      fuelVolume,
      totalCost,
      fuelPricePerLitre,
      isFullTank,
      stationName,
      notes,
    })
    .select("id")
    .single();

  if (insertError) {
    return apiError(`Failed to save fuel fill-up: ${insertError.message}`, 500);
  }

  const fillType = isFullTank ? "Full tank" : "Partial fill";
  return apiSuccess(
    {
      id: inserted.id,
      message: `⛽ ${fillType}: ${fuelVolume}L at ₹${totalCost} saved for ${date}.`,
    },
    201
  );
}
