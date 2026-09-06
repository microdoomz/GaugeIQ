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

  if (existing) {
    // Update the existing entry in place
    const { error: updateError } = await supabase
      .from("daily_odometer_entries")
      .update({ odometerReading, notes })
      .eq("id", existing.id);

    if (updateError) {
      return apiError(`Failed to update entry: ${updateError.message}`, 500);
    }

    return apiSuccess({
      id: existing.id,
      action: "updated",
      message: `✅ Odometer updated to ${odometerReading} for ${date}.`,
    });
  }

  // --- Insert new entry ---
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

  return apiSuccess(
    {
      id: inserted.id,
      action: "created",
      message: `✅ Odometer reading of ${odometerReading} saved for ${date}.`,
    },
    201
  );
}
