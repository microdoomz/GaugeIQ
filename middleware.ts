import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // IMPORTANT: mutate the same `res`
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          // expire the cookie on the same `res`
          res.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If no session, redirect to /login and preserve intended URL with ?redirect=
  if (!session) {
    const redirectUrl = new URL("/login", requestUrl.origin);
    redirectUrl.searchParams.set("redirect", requestUrl.pathname + requestUrl.search);

    const redirectResponse = NextResponse.redirect(redirectUrl);

    // Copy any cookies that Supabase / the client set on `res` onto the redirect
    res.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });

    return redirectResponse;
  }

  // Session exists → allow request through, with cookies applied
  return res;
}

// Only protect app pages, not login/register or static assets
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/vehicles/:path*",
    "/logs/:path*",
    "/history/:path*",
    "/settings/:path*",
  ],
};
