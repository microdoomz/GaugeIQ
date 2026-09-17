import { NextRequest } from "next/server";
import { authenticateRequest, apiError, apiSuccess } from "@/lib/apiAuth";
import { computeSmartProjection, projectedRange } from "@/lib/calculations";
import { DailyOdometerEntry, FuelFillUp, Vehicle } from "@/lib/types";

/**
 * POST /api/shortcuts/fuel
 *
 * Record a fuel fill-up and return GaugeIQ's existing mileage/projection data.
 *
 * Header: Authorization: Bearer <access_token>
 *
 * Body:
 * {
 *   "vehicle_id": "uuid",
 *   "date": "YYYY-MM-DD",
 *   "odometerAtFill": 12345.6,
 *   "fuelVolume": 25.5,
 *   "totalCost": 2500,
 *   "isFullTank": true | false
 * }
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
  const date =
    (body.date as string | undefined) ??
    new Date().toISOString().slice(0, 10);

  const odometerAtFill = Number(body.odometerAtFill);
  const fuelVolume = Number(body.fuelVolume);
  const totalCost = Number(body.totalCost);

  const isFullTank =
    body.isFullTank === true || body.isFullTank === "true";

  const stationName =
    (body.stationName as string | undefined) ?? null;

  const notes =
    (body.notes as string | undefined) ?? null;

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------

  if (!vehicle_id) {
    return apiError(
      "'vehicle_id' is required. Use the /api/shortcuts/vehicles endpoint to get your vehicle IDs."
    );
  }

  if (!Number.isFinite(odometerAtFill) || odometerAtFill < 0) {
    return apiError(
      "'odometerAtFill' must be a positive number (decimals allowed)."
    );
  }

  if (!Number.isFinite(fuelVolume) || fuelVolume <= 0) {
    return apiError(
      "'fuelVolume' must be a positive number greater than 0 (decimals allowed)."
    );
  }

  if (!Number.isFinite(totalCost) || totalCost < 0) {
    return apiError(
      "'totalCost' must be a non-negative number (decimals allowed)."
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return apiError("'date' must be in YYYY-MM-DD format.");
  }

  // -------------------------------------------------------------------------
  // Verify vehicle belongs to the user
  // -------------------------------------------------------------------------

  const { data: vehicle, error: vehicleError } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", vehicle_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (vehicleError || !vehicle) {
    return apiError(
      "Vehicle not found or does not belong to your account."
    );
  }

  // -------------------------------------------------------------------------
  // Calculate fuel price per litre
  // -------------------------------------------------------------------------

  const fuelPricePerLitre =
    fuelVolume > 0 ? totalCost / fuelVolume : null;

  // -------------------------------------------------------------------------
  // Save the fuel fill-up
  // -------------------------------------------------------------------------

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
    return apiError(
      `Failed to save fuel fill-up: ${insertError.message}`,
      500
    );
  }

  // -------------------------------------------------------------------------
  // Fetch the existing GaugeIQ data used by the site's calculations
  // -------------------------------------------------------------------------

  const { data: fillupData, error: fillupError } = await supabase
    .from("fuel_fillups")
    .select(
      "id, user_id, vehicle_id, date, odometerAtFill, fuelVolume, totalCost, fuelPricePerLitre, stationName, isFullTank, notes, created_at"
    )
    .eq("vehicle_id", vehicle_id)
    .eq("user_id", userId);

  if (fillupError) {
    return apiError(
      `Fuel was saved, but existing fuel data could not be loaded: ${fillupError.message}`,
      500
    );
  }

  const { data: entryData, error: entryError } = await supabase
    .from("daily_odometer_entries")
    .select(
      "id, user_id, vehicle_id, date, odometerReading, notes, created_at"
    )
    .eq("vehicle_id", vehicle_id)
    .eq("user_id", userId);

  if (entryError) {
    return apiError(
      `Fuel was saved, but odometer data could not be loaded: ${entryError.message}`,
      500
    );
  }

  // -------------------------------------------------------------------------
  // Convert Supabase data to GaugeIQ's existing calculation types
  // -------------------------------------------------------------------------

  const fillups = (fillupData ?? []) as FuelFillUp[];
  const entries = (entryData ?? []) as DailyOdometerEntry[];
  const selectedVehicle = vehicle as Vehicle;

  // -------------------------------------------------------------------------
  // Use GaugeIQ's existing smart projection calculation
  //
  // This gives us:
  // - Existing GaugeIQ mileage calculation
  // - Existing EWMA daily-distance calculation
  // - The same effective mileage used throughout the site
  // -------------------------------------------------------------------------

  const smartProjection = computeSmartProjection({
    fillups,
    entries,
    vehicles: [selectedVehicle],
    vehicleId: vehicle_id,
  });

  let estimatedRangeKm: number | null = null;
  let estimatedDays: number | null = null;
  let estimatedMileage: number | null = null;
  let averageDailyDistance: number | null = null;

  if (smartProjection) {
    estimatedMileage = smartProjection.ewmaMileage;
    averageDailyDistance = smartProjection.ewmaDailyDistance;

    // Use GaugeIQ's existing projectedRange helper.
    const projection = projectedRange(
      smartProjection.ewmaMileage,
      fuelVolume,
      smartProjection.ewmaDailyDistance
    );

    estimatedRangeKm = projection.km;
    estimatedDays =
      smartProjection.ewmaDailyDistance > 0
        ? projection.days
        : null;
  }

  // -------------------------------------------------------------------------
  // Response
  // -------------------------------------------------------------------------

  const fillType = isFullTank ? "Full tank" : "Partial fill";

  return apiSuccess(
    {
      id: inserted.id,

      // Actual values saved
      fuelVolume: Number(fuelVolume.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      fuelPricePerLitre:
        fuelPricePerLitre != null
          ? Number(fuelPricePerLitre.toFixed(2))
          : null,

      // Existing GaugeIQ calculations
      estimatedMileage,
      averageDailyDistance,

      // Projection for THIS fuel addition
      estimatedRangeKm,
      estimatedDays,

      message: `⛽ ${fillType}: ${fuelVolume}L at ₹${totalCost} saved for ${date}.`,
    },
    201
  );
}