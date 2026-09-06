import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/apiAuth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * POST /api/shortcuts/auth/refresh
 *
 * Exchange a refresh_token for a new access_token.
 *
 * Body: { "refresh_token": "..." }
 * Returns: { success, access_token, refresh_token, expires_in }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { refresh_token } = body ?? {};

    if (!refresh_token) {
      return apiError("'refresh_token' is required.");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: String(refresh_token),
    });

    if (error || !data.session) {
      return apiError(
        error?.message ?? "Token refresh failed. You may need to log in again.",
        401
      );
    }

    return apiSuccess({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
    });
  } catch {
    return apiError("Invalid request body. Send JSON with 'refresh_token'.");
  }
}
