import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { ShortcutsGuideClient } from "@/components/shortcuts/shortcuts-guide-client";

export const revalidate = 0;

export default async function ShortcutsPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect(`/login?redirect=/shortcuts`);

  const userId = session.user.id;
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return (
    <AppShell
      email={session.user.email ?? undefined}
      userId={userId}
      displayName={profile?.displayName}
      namePromptDismissed={profile?.namePromptDismissed ?? false}
    >
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-wide text-[hsl(var(--foreground))]/60">Integrations</p>
          <h1 className="text-2xl font-semibold">Apple Shortcuts Guide</h1>
          <p className="text-sm text-[hsl(var(--foreground))]/70">
            Log daily odometer readings and fuel fill-ups seamlessly directly from iOS Shortcuts.
          </p>
        </div>
        <ShortcutsGuideClient />
      </div>
    </AppShell>
  );
}
