import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PATHS = ["/dashboard", "/vehicles", "/logs", "/history", "/settings"];

export async function middleware(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const pathname = requestUrl.pathname;

  // Skip protection for auth routes
  if (pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          const response = NextResponse.next();
          response.cookies.set({ name, value, ...options });
          return response;
        },
        remove(name: string, options: any) {
          const response = NextResponse.next();
          response.cookies.set({ name, value: "", ...options });
          return response;
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (PROTECTED_PATHS.some((path) => pathname.startsWith(path)) && !session) {
    const redirectUrl = new URL("/login", requestUrl.origin);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl.toString());
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
