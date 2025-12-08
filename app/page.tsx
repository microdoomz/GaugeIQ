import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-12 px-4 py-16 text-center">
      <div className="space-y-4">
        <p className="inline-flex rounded-full bg-[hsl(var(--primary))]/10 px-3 py-1 text-xs font-semibold text-[hsl(var(--primary))]">
          GaugeIQ · Mileage & fuel intelligence
        </p>
        <h1 className="text-4xl font-bold leading-tight md:text-5xl">
          Track every kilometre, drop of fuel, and rupee with confidence.
        </h1>
        <p className="max-w-2xl text-lg text-[hsl(var(--foreground))]/80 mx-auto">
          GaugeIQ is your modern mileage tracker with Supabase auth, beautiful charts, emissions insights, projections,
          and reminders. Mobile-friendly, free to use, and ready for Vercel deployment.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild href="/register">
            Get started free
          </Button>
          <Button asChild href="/login" variant="secondary">
            Login
          </Button>
          <span className="text-sm text-[hsl(var(--foreground))]/70">No paywalls. Data stays yours.</span>
        </div>
      </div>

      <div className="glass-card w-full space-y-3 p-6 text-left">
        <p className="text-center text-sm font-medium text-[hsl(var(--foreground))]">What you get</p>
        <ul className="grid gap-3 text-sm text-[hsl(var(--foreground))]/80 md:grid-cols-2">
          <li>Daily odometer logging with reminders and validation.</li>
          <li>Fuel fill-ups with cost, price per litre, and station tracking.</li>
          <li>Dashboard with mileage, costs, emissions, projections, and comparisons.</li>
          <li>History tab merging odometer and fuel in one timeline with filters.</li>
          <li>Responsive charts (line, bar, donut) for distance, fuel, cost, CO₂.</li>
          <li>Light/dark mode, CSV export, and user preferences for currency & units.</li>
        </ul>
      </div>
    </main>
  );
}
