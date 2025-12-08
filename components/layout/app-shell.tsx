import React from "react";
import { TopBar } from "./topbar";

export const AppShell = ({
  children,
  email,
  displayName,
  userId,
  namePromptDismissed,
}: {
  children: React.ReactNode;
  email?: string;
  displayName?: string | null;
  userId?: string;
  namePromptDismissed?: boolean;
}) => {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <TopBar
        email={email}
        displayName={displayName ?? undefined}
        userId={userId}
        namePromptDismissed={namePromptDismissed}
      />
      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
};
