import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/apiAuth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * POST /api/shortcuts/auth
 *
 * Authentication endpoint for the GaugeIQ Shortcut.
 *
 * The Shortcut sends the currently saved access_token and
 * refresh_token on every run.
 *
 * Authentication flow:
 *
 * 1. If the saved access_token is valid:
 *      -> continue without login
 *
 * 2. If the access_token is expired/invalid but the
 *    refresh_token is valid:
 *      -> refresh the Supabase session
 *      -> return the new access_token + refresh_token
 *
 * 3. If neither token is usable:
 *      -> return login_required: 1
 *
 * 4. The Shortcut then uses a Repeat action with the value
 *    of login_required.
 *
 *    login_required = 0
 *      -> Repeat runs zero times
 *      -> no email/password prompt
 *
 *    login_required = 1
 *      -> Repeat runs once
 *      -> ask for email/password and sign in
 *
 * 5. When email + password are supplied:
 *      -> perform normal Supabase password login
 *      -> return both tokens
 *
 * IMPORTANT:
 * Token/session failure intentionally returns HTTP 200
 * with login_required: 1 instead of HTTP 401.
 *
 * This allows the iOS Shortcut to make the login decision
 * without using an If action.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      email,
      password,
      access_token,
      refresh_token,
    } = body ?? {};

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey
    );

    /*
     * -------------------------------------------------------
     * 1. Explicit login
     * -------------------------------------------------------
     *
     * This is used when the Shortcut asks the user for
     * email/password.
     */
    if (email && password) {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: String(email).trim(),
          password: String(password),
        });

      if (error || !data.session) {
        return apiError(
          error?.message ?? "Login failed.",
          401
        );
      }

      return apiSuccess({
        login_required: 0,

        access_token: data.session.access_token,

        refresh_token: data.session.refresh_token,

        expires_in: data.session.expires_in,
      });
    }

    /*
     * -------------------------------------------------------
     * 2. Check existing access token
     * -------------------------------------------------------
     *
     * If it is still valid, there is no reason to refresh it.
     */
    if (access_token) {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(
        String(access_token)
      );

      if (!error && user) {
        return apiSuccess({
          login_required: 0,

          access_token: String(access_token),

          /*
           * Keep the existing refresh token.
           * The Shortcut will save it again.
           */
          refresh_token: refresh_token
            ? String(refresh_token)
            : "",

          expires_in: null,
        });
      }
    }

    /*
     * -------------------------------------------------------
     * 3. Access token invalid -> try refresh token
     * -------------------------------------------------------
     */
    if (refresh_token) {
      const {
        data,
        error,
      } = await supabase.auth.refreshSession({
        refresh_token: String(refresh_token),
      });

      if (!error && data.session) {
        return apiSuccess({
          login_required: 0,

          access_token: data.session.access_token,

          /*
           * IMPORTANT:
           * Supabase may rotate the refresh token.
           *
           * The Shortcut therefore saves this returned
           * refresh token and replaces the old one.
           */
          refresh_token: data.session.refresh_token,

          expires_in: data.session.expires_in,

          refreshed: true,
        });
      }
    }

    /*
     * -------------------------------------------------------
     * 4. Nothing usable -> tell Shortcut to ask for login
     * -------------------------------------------------------
     *
     * This deliberately returns HTTP 200.
     *
     * The Shortcut uses:
     *
     * Repeat login_required times
     *
     * Therefore:
     *
     * 0 = no login prompt
     * 1 = ask for credentials once
     */
    return apiSuccess({
      login_required: 1,

      access_token: "",

      refresh_token: "",

      refreshed: false,
    });
  } catch (error) {
    return apiError(
      "Invalid request body.",
      400
    );
  }
}