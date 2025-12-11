"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";

function ResetPasswordContent() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const { push } = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw new Error(sessionError.message);
        if (data.session) {
          setHasSession(true);
        } else {
          setError("Reset link invalid or expired.");
        }
      } catch (err: any) {
        setError(err.message ?? "Unable to verify reset link");
      } finally {
        setChecked(true);
      }
    };
    run();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
    } else {
      push({ message: "Password updated. Please log in.", type: "success" });
      router.push("/login");
    }
    setLoading(false);
  };

  const showForm = hasSession;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div className="glass-card p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-center">Reset password</h1>
        {!checked && (
          <p className="text-sm text-center text-[hsl(var(--foreground))]/70">Validating your reset link...</p>
        )}

        {checked && showForm ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="password"
              name="password"
              label="New password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              type="password"
              name="confirm_password"
              label="Confirm password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating..." : "Update password"}
            </Button>
          </form>
        ) : (
          <>
            <p className="text-sm text-[hsl(var(--foreground))]/80 text-center">
              Click the password reset link we sent to your email. It will bring you back here (or to Supabase’s hosted reset page)
              to set a new password.
            </p>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            {!error && checked && (
              <p className="text-sm text-center text-[hsl(var(--foreground))]/70">
                If nothing happens after clicking the link, ensure your email client did not strip the token or try opening it in a browser.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-sm text-[hsl(var(--foreground))]/70">Loading reset form...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
