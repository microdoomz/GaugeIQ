import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { apiError, apiSuccess } from "@/lib/apiAuth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * POST /api/shortcuts/auth/check
 *
 * Check whether an access token is still valid.
 * If it is expired/invalid, automatically refresh using the refresh token.
 *
 * Body:
 * {
 *   "access_token": "...",
 *   "refresh_token": "..."
 * }
 *
 * Returns:
 *
 * Valid token:
 * {
 *   "success": true,
 *   "authenticated": true,
 *   "refreshed": false
 * }
 *
 * Refreshed token:
 * {
 *   "success": true,
 *   "authenticated": true,
 *   "refreshed": true,
 *   "access_token": "...",
 *   "refresh_token": "...",
 *   "expires_in": ...
 * }
 *
 * Login required:
 * {
 *   "success": true,
 *   "authenticated": false
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const accessToken = String(body?.access_token ?? "").trim();
    const refreshToken = String(body?.refresh_token ?? "").trim();

    if (!accessToken) {
      return apiError("'access_token' is required.");
    }

    if (!refreshToken) {
      return apiError("'refresh_token' is required.");
    }

    /*
     * First, check the existing access token.
     * Do NOT refresh if it is still valid.
     */
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const {
      data: { user },
      error: accessError,
    } = await supabase.auth.getUser(accessToken);

    if (user && !accessError) {
      return apiSuccess({
        authenticated: true,
        refreshed: false,
      });
    }

    /*
     * Access token is no longer valid.
     * Try the refresh token.
     */
    const { data, error: refreshError } =
      await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

    if (refreshError || !data.session) {
      return apiSuccess({
        authenticated: false,
        refreshed: false,
      });
    }

    /*
     * Refresh succeeded.
     * Supabase may rotate the refresh token, so return BOTH
     * new tokens to the Shortcut.
     */
    return apiSuccess({
      authenticated: true,
      refreshed: true,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
    });
  } catch {
    return apiError(
      "Invalid request body. Send JSON with access_token and refresh_token."
    );
  }
}