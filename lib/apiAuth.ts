import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Standard JSON error response for the Shortcuts API.
 */
export const apiError = (message: string, status = 400) =>
  NextResponse.json({ success: false, error: message }, { status });

/**
 * Standard JSON success response for the Shortcuts API.
 */
export const apiSuccess = (data: Record<string, unknown>, status = 200) =>
  NextResponse.json({ success: true, ...data }, { status });

/**
 * Extract the Bearer token from the Authorization header, create a
 * Supabase client scoped to that user, and verify the session.
 *
 * Returns `{ supabase, userId }` on success, or a ready-to-return
 * `NextResponse` error on failure.
 */
export async function authenticateRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return { error: apiError("Missing Authorization header. Use: Bearer <access_token>", 401) };
  }

  // Create a one-off Supabase client using the caller's JWT.
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return {
      error: apiError(
        error?.message === "invalid claim: missing sub claim"
          ? "Token expired or invalid. Please refresh your token."
          : `Authentication failed: ${error?.message ?? "unknown error"}`,
        401
      ),
    };
  }

  return { supabase, userId: user.id };
}
