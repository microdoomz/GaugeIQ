import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const res = NextResponse.next();

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        res.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: any) {
        res.cookies.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const redirectUrl = new URL("/login", requestUrl.origin);
    redirectUrl.searchParams.set("redirectedFrom", requestUrl.pathname + requestUrl.search);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    res.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/vehicles/:path*", "/logs/:path*", "/history/:path*", "/settings/:path*"],
};
