import type { NextRequest } from "next/server";

// Auth protection now happens at the page level (server components) instead of middleware.
// This middleware is disabled to avoid cookie duplication and race conditions in production.
export function middleware(_req: NextRequest) {
  return;
}

// No routes are matched; middleware is effectively disabled.
export const config = {
  matcher: [],
};
