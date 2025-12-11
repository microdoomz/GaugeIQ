"use client";

import { useEffect, useState } from "react";
import { Theme, ThemeContext } from "./theme-context";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { ToastProvider } from "./ui/toast";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>("light");
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    let mounted = true;

    const loadTheme = async (sessionArg?: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]) => {
      const session = sessionArg ?? (await supabase.auth.getSession()).data.session;
      if (!mounted) return;
      if (!session) {
        document.documentElement.classList.toggle("dark", false);
        setTheme("light");
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("theme")
        .eq("user_id", session.user.id)
        .maybeSingle();
      const nextTheme = (data?.theme as Theme) ?? "light";
      if (!mounted) return;
      setTheme(nextTheme);
      document.documentElement.classList.toggle("dark", nextTheme === "dark");
    };

    loadTheme();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      loadTheme(session ?? undefined);
    });

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggle = async () => {
    setTheme((t) => {
      const next = t === "light" ? "dark" : "light";
      (async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          await supabase.from("profiles").upsert({ user_id: session.user.id, theme: next });
        }
      })();
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      <ToastProvider>{children}</ToastProvider>
    </ThemeContext.Provider>
  );
};
