"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const ROUTES = ["/dashboard", "/vehicles", "/logs", "/history", "/settings"];

export const NavPrefetcher = () => {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    if (pathname === "/login" || pathname === "/register") return;

    ROUTES.filter((route) => route !== pathname).forEach((route) => {
      try {
        router.prefetch(route);
      } catch (_err) {
        // noop
      }
    });
  }, [pathname, router]);

  return null;
};
