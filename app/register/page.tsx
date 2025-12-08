"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));
    const nameFromEmail = email.split("@")[0];

    setLoading(true);
    setError(null);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const userId = signUpData.user?.id;
    if (userId) {
      await supabase.from("profiles").upsert({
        user_id: userId,
        currency: "INR",
        distanceUnit: "km",
        fuelUnit: "L",
        remindersEnabled: true,
        displayName: nameFromEmail,
      });
    }
    router.push("/dashboard");
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div className="glass-card p-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold">Create your GaugeIQ account</h1>
          <p className="text-sm text-[hsl(var(--foreground))]/70">Start tracking mileage and fuel in minutes.</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input type="email" name="email" label="Email" placeholder="you@example.com" required />
          <Input type="password" name="password" label="Password" required minLength={6} />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create account"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-[hsl(var(--foreground))]/70">
          Already registered? <Link href="/login" className="text-[hsl(var(--primary))]">Login</Link>
        </p>
      </div>
    </div>
  );
}
