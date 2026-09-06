import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess } from "@/lib/apiAuth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * POST /api/shortcuts/auth
 *
 * Authenticate with email + password and receive tokens.
 *
 * Body: { "email": "...", "password": "..." }
 * Returns: { success, access_token, refresh_token, expires_in, user_id }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body ?? {};

    if (!email || !password) {
      return apiError("Both 'email' and 'password' are required.");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(email),
      password: String(password),
    });

    if (error || !data.session) {
      return apiError(error?.message ?? "Login failed. Check your email and password.", 401);
    }

    return apiSuccess({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      user_id: data.session.user.id,
    });
  } catch {
    return apiError("Invalid request body. Send JSON with 'email' and 'password'.");
  }
}
