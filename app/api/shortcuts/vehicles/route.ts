import { NextRequest } from "next/server";
import { authenticateRequest, apiError, apiSuccess } from "@/lib/apiAuth";

/**
 * GET /api/shortcuts/vehicles
 *
 * Return the authenticated user's vehicles for a Shortcut picker.
 *
 * Header: Authorization: Bearer <access_token>
 * Returns: { success, vehicles: [{ id, name }] }
 */
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if ("error" in auth) return auth.error;

  const { supabase, userId } = auth;

  const { data, error } = await supabase
    .from("vehicles")
    .select("id, make, model")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    return apiError(`Failed to fetch vehicles: ${error.message}`, 500);
  }

  const vehicles = (data ?? []).map((v: { id: string; make: string; model: string }) => ({
    id: v.id,
    name: `${v.make} ${v.model}`,
  }));

  if (!vehicles.length) {
    return apiError("No vehicles found. Add a vehicle in the GaugeIQ web app first.");
  }

  return apiSuccess({ vehicles });
}
