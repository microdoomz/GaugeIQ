"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { isValidEmail } from "@/lib/validators";

function LoginContent() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const { push } = useToast();

  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const resetRedirectBase = useMemo(
    () => `${process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== "undefined" ? window.location.origin : "")}/reset-password`,
    []
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }
    router.push(redirectTo);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div className="glass-card p-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="text-sm text-[hsl(var(--foreground))]/70">Login to access your dashboard.</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            type="email"
            name="email"
            label="Email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input type="password" name="password" label="Password" required showToggle />
          <div className="text-right">
            <button type="button" className="text-sm text-[hsl(var(--primary))] hover:underline" onClick={() => setShowForgot(true)}>
              Forgot password?
            </button>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-[hsl(var(--foreground))]/70">
          New here? <Link href="/register" className="text-[hsl(var(--primary))]">Create an account</Link>
        </p>
      </div>

      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-[hsl(var(--card))] p-5 shadow-lg">
            <h2 className="text-lg font-semibold">Reset password</h2>
            <p className="mt-1 text-sm text-[hsl(var(--foreground))]/70">Enter your email to receive a reset link.</p>
            <form
              className="mt-4 space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                setForgotError(null);
                if (!isValidEmail(email)) {
                  setForgotError("Enter a valid email address.");
                  return;
                }
                setForgotLoading(true);
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                  redirectTo: `${resetRedirectBase}?email=${encodeURIComponent(email)}`,
                });
                if (resetError) {
                  setForgotError(resetError.message);
                } else {
                  push({ message: "If an account exists, a reset link was sent.", type: "info" });
                  setShowForgot(false);
                }
                setForgotLoading(false);
              }}
            >
              <Input
                type="email"
                name="reset_email"
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {forgotError && <p className="text-sm text-red-500">{forgotError}</p>}
              <div className="flex items-center justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setShowForgot(false)} disabled={forgotLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={forgotLoading}>
                  {forgotLoading ? "Sending..." : "Send reset link"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-sm text-[hsl(var(--foreground))]/70">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
