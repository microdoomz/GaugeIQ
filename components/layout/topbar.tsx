"use client";

import { useEffect, useState, useContext } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ThemeContext } from "../theme-context";
import { NavLinks } from "./nav-links";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export const TopBar = ({
  email,
  displayName,
  userId,
  namePromptDismissed,
}: {
  email?: string;
  displayName?: string;
  userId?: string;
  namePromptDismissed?: boolean;
}) => {
  const { theme, toggle } = useContext(ThemeContext);
  const supabase = createSupabaseBrowserClient();
  const [name, setName] = useState(displayName ?? "");
  const [showPrompt, setShowPrompt] = useState(false);
  const [nameSaving, setNameSaving] = useState(false);

  useEffect(() => {
    setName(displayName ?? "");
    if (!displayName && !namePromptDismissed) {
      setShowPrompt(true);
    } else {
      setShowPrompt(false);
    }
  }, [displayName, namePromptDismissed]);

  const saveName = async () => {
    const cleaned = name.trim();
    if (!userId || !cleaned) return;
    setNameSaving(true);
    await supabase.from("profiles").upsert({ user_id: userId, displayName: cleaned }, { onConflict: "user_id" });
    setName(cleaned);
    setNameSaving(false);
    setShowPrompt(false);
    if (userId) {
      await supabase.from("profiles").upsert({ user_id: userId, namePromptDismissed: true });
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    if (userId) {
      supabase.from("profiles").upsert({ user_id: userId, namePromptDismissed: true });
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/90 px-3 py-3 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 md:gap-3">
        <div className="flex w-full items-center justify-between gap-2">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold whitespace-nowrap">
            <span className="rounded-lg bg-[hsl(var(--primary))]/10 px-2 py-1 text-[hsl(var(--primary))]">GaugeIQ</span>
          </Link>
          <div className="flex shrink-0 items-center gap-1 text-sm md:hidden">
            {(name || email) && (
              <button
                type="button"
                onClick={() => userId && setShowPrompt(true)}
                className="max-w-[140px] truncate rounded-full bg-[hsl(var(--muted))] px-3 py-1 text-[hsl(var(--foreground))]/80 hover:border hover:border-[hsl(var(--border))]"
                title="Edit display name"
              >
                {name || email}
              </button>
            )}
            <button
              onClick={toggle}
              className="rounded-lg border border-[hsl(var(--border))] px-2 py-2 hover:bg-[hsl(var(--muted))]"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? "🌙" : "☀️"}
            </button>
            <Link
              href="/logout"
              className="rounded-lg bg-[hsl(var(--primary))]/10 px-2 py-2 text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/20 whitespace-nowrap flex items-center gap-1"
            >
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden" aria-label="Logout">⇦</span>
            </Link>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 md:gap-3">
          <div className="w-full overflow-x-auto md:flex md:min-w-0 md:flex-1 md:items-center">
            <NavLinks />
          </div>
          <div className="hidden shrink-0 items-center gap-1 text-sm md:flex md:ml-auto md:pl-3">
            {(name || email) && (
              <button
                type="button"
                onClick={() => userId && setShowPrompt(true)}
                className="max-w-[180px] truncate rounded-full bg-[hsl(var(--muted))] px-3 py-1 text-[hsl(var(--foreground))]/80 hover:border hover:border-[hsl(var(--border))]"
                title="Edit display name"
              >
                {name || email}
              </button>
            )}
            <button
              onClick={toggle}
              className="rounded-lg border border-[hsl(var(--border))] px-2 py-2 hover:bg-[hsl(var(--muted))]"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? "🌙" : "☀️"}
            </button>
            <Link
              href="/logout"
              className="rounded-lg bg-[hsl(var(--primary))]/10 px-2 py-2 text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/20 whitespace-nowrap flex items-center gap-1"
            >
              Logout
            </Link>
          </div>
        </div>
      </div>

      {showPrompt && userId && typeof window !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
              <div className="w-full max-w-sm rounded-2xl bg-[hsl(var(--card))] p-5 shadow-lg">
                <h2 className="text-center text-lg font-semibold">Welcome! What should we call you?</h2>
                <p className="mt-2 text-center text-sm text-[hsl(var(--foreground))]/70">Enter a name to display in the nav.</p>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-3 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm"
                  placeholder="Your name"
                />
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={saveName}
                    disabled={nameSaving || !name.trim()}
                    className="rounded-lg bg-[hsl(var(--primary))]/10 px-4 py-2 text-[hsl(var(--primary))]"
                  >
                    {nameSaving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={dismissPrompt}
                    className="rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm"
                  >
                    Skip
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </header>
  );
};
