"use client";

import { useEffect, useMemo, useState } from "react";
import {
  aggregateMetrics,
  computeDistances,
  computeFuelMileage,
  defaultRangeForTimeframe,
  filterByRange,
  projectedRange,
  unifiedHistory,
} from "@/lib/calculations";
import { DailyOdometerEntry, FuelFillUp, HistoryItem, Timeframe, Vehicle, UserPreferences } from "@/lib/types";
import { TimeRangeFilter } from "@/components/filters/time-range-filter";
import { StatCard } from "@/components/ui/stat-card";
import { ChartCard } from "@/components/ui/chart-card";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format } from "date-fns";
import Link from "next/link";

interface DashboardClientProps {
  entries: DailyOdometerEntry[];
  fillups: FuelFillUp[];
  vehicles: Vehicle[];
  initialTimeframe: Timeframe;
  initialRange: { from: string; to: string };
  reminderNeeded: boolean;
  initialHistory: HistoryItem[];
  preferences: UserPreferences;
}

const COLORS = ["#6366f1", "#22c55e", "#f97316", "#06b6d4", "#f43f5e", "#a855f7"];

const oneDecimal = (n: number) => Number(n.toFixed(1));

export default function DashboardClient({
  entries,
  fillups,
  vehicles,
  initialTimeframe,
  initialRange,
  reminderNeeded,
  initialHistory,
  preferences,
}: DashboardClientProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>(initialTimeframe);
  const [customRange, setCustomRange] = useState<{ from: string; to: string }>(initialRange);
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");
  const [prefs, setPrefs] = useState<UserPreferences>(preferences);

  useEffect(() => {
    const handler = () => window.location.reload();
    window.addEventListener("gaugeiq-prefs-updated", handler);
    return () => window.removeEventListener("gaugeiq-prefs-updated", handler);
  }, []);

  useEffect(() => {
    setPrefs(preferences);
  }, [preferences]);

  const distanceFactor = prefs.distanceUnit === "mi" ? 0.621371 : 1;
  const fuelFactor = prefs.fuelUnit === "gal" ? 0.264172 : 1;
  const distanceUnitLabel = prefs.distanceUnit;
  const fuelUnitLabel = prefs.fuelUnit;
  const co2Factor = prefs.co2Unit === "lb" ? 2.20462 : 1;
  const co2UnitLabel = prefs.co2Unit ?? "kg";
  const currencyFmt = new Intl.NumberFormat("en", {
    style: "currency",
    currency: prefs.currency,
    maximumFractionDigits: 0,
  });

  const activeRange = useMemo(() => {
    if (timeframe === "custom") {
      return {
        from: new Date(customRange.from),
        to: new Date(customRange.to),
      };
    }
    return defaultRangeForTimeframe(timeframe);
  }, [timeframe, customRange]);

  const filteredEntries = useMemo(
    () => filterByRange(entries, activeRange.from, activeRange.to),
    [entries, activeRange]
  );

  const filteredFillups = useMemo(
    () => filterByRange(fillups, activeRange.from, activeRange.to),
    [fillups, activeRange]
  );

  const vehicleFilteredEntries = useMemo(
    () =>
      vehicleFilter === "all"
        ? filteredEntries
        : filteredEntries.filter((e) => e.vehicle_id === vehicleFilter),
    [filteredEntries, vehicleFilter]
  );

  const vehicleFilteredFillups = useMemo(
    () =>
      vehicleFilter === "all"
        ? filteredFillups
        : filteredFillups.filter((f) => f.vehicle_id === vehicleFilter),
    [filteredFillups, vehicleFilter]
  );

  const metrics = useMemo(
    () => aggregateMetrics(vehicleFilteredEntries, vehicleFilteredFillups, vehicles),
    [vehicleFilteredEntries, vehicleFilteredFillups, vehicles]
  );

  const typicalMileageBase = useMemo(() => {
    const candidates = vehicleFilter === "all" ? vehicles : vehicles.filter((v) => v.id === vehicleFilter);
    const withTypical = candidates.map((v) => v.typicalMileage).filter((v): v is number => typeof v === "number");
    if (!withTypical.length) return undefined;
    return withTypical.reduce((sum, v) => sum + v, 0) / withTypical.length;
  }, [vehicleFilter, vehicles]);

  const effectiveMileageBase = metrics.avgMileage > 0 ? metrics.avgMileage : typicalMileageBase ?? 0;
  const effectiveMileageDisplay = fuelFactor > 0 ? (effectiveMileageBase * distanceFactor) / fuelFactor : effectiveMileageBase;

  const dataMinDate = useMemo(() => {
    const dates = [...vehicleFilteredEntries, ...vehicleFilteredFillups].map((i) => new Date(i.date).getTime());
    if (!dates.length) return null;
    return new Date(Math.min(...dates));
  }, [vehicleFilteredEntries, vehicleFilteredFillups]);

  const dataMaxDate = useMemo(() => {
    const dates = [...vehicleFilteredEntries, ...vehicleFilteredFillups].map((i) => new Date(i.date).getTime());
    if (!dates.length) return null;
    return new Date(Math.max(...dates));
  }, [vehicleFilteredEntries, vehicleFilteredFillups]);

  const displayMetrics = {
    totalKm: metrics.totalKm * distanceFactor,
    totalFuel: metrics.totalFuel * fuelFactor,
    totalCost: metrics.totalCost,
    avgMileage: fuelFactor > 0 ? (metrics.avgMileage * distanceFactor) / fuelFactor : 0,
    totalCO2: metrics.totalCO2 * co2Factor,
  };

  const fmtDistance = (v: number) => oneDecimal(v * distanceFactor);
  const fmtFuel = (v: number) => oneDecimal(v * fuelFactor);

  const distances = useMemo(() => computeDistances(vehicleFilteredEntries), [vehicleFilteredEntries]);
  const distanceSeries = distances.map((e) => ({
    date: e.date,
    km: (e.distanceSincePrev ?? 0) * distanceFactor,
    vehicle: vehicles.find((v) => v.id === e.vehicle_id)?.model ?? "Vehicle",
  }));

  const mileageCycles = useMemo(() => computeFuelMileage(vehicleFilteredFillups), [vehicleFilteredFillups]);

  const mileageCyclesDisplay = useMemo(
    () =>
      mileageCycles.map((c) => ({
        ...c,
        mileage: fuelFactor > 0 ? (c.mileage * distanceFactor) / fuelFactor : c.mileage,
      })),
    [mileageCycles, distanceFactor, fuelFactor]
  );

  const monthlyFuel = useMemo(() => {
    const map = new Map<string, { fuel: number; cost: number }>();
    vehicleFilteredFillups.forEach((f) => {
      const m = f.date.slice(0, 7);
      const entry = map.get(m) ?? { fuel: 0, cost: 0 };
      entry.fuel += f.fuelVolume * fuelFactor;
      entry.cost += f.totalCost;
      map.set(m, entry);
    });
    return Array.from(map.entries()).map(([month, data]) => ({ month, ...data }));
  }, [vehicleFilteredFillups, fuelFactor]);

  const monthlyCO2 = useMemo(() => {
    const factor = (fuelType?: string) => {
      if (fuelType === "diesel") return 2.7;
      if (fuelType === "petrol") return 2.3;
      return 2.3;
    };
    const map = new Map<string, number>();
    vehicleFilteredFillups.forEach((f) => {
      const veh = vehicles.find((v) => v.id === f.vehicle_id);
      const month = f.date.slice(0, 7);
      map.set(month, (map.get(month) ?? 0) + f.fuelVolume * factor(veh?.fuelType));
    });
    return Array.from(map.entries()).map(([month, co2]) => ({ month, co2 }));
  }, [vehicleFilteredFillups, vehicles]);

  const monthlyCO2Display = useMemo(
    () => monthlyCO2.map((row) => ({ ...row, co2: row.co2 * co2Factor })),
    [monthlyCO2, co2Factor]
  );

  const history = useMemo(
    () => unifiedHistory(vehicleFilteredEntries, vehicleFilteredFillups, vehicles),
    [vehicleFilteredEntries, vehicleFilteredFillups, vehicles]
  );

  const daysInRange = useMemo(() => {
    if (dataMinDate && dataMaxDate) {
      return Math.max(1, Math.round((dataMaxDate.getTime() - dataMinDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    }
    return Math.max(
      1,
      Math.round((activeRange.to.getTime() - activeRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );
  }, [activeRange.from, activeRange.to, dataMaxDate, dataMinDate]);
  const avgDailyDistance = metrics.totalKm / daysInRange;
  const avgDailyCost = metrics.totalCost / daysInRange;
  const avgFuelPrice = metrics.totalFuel > 0 ? metrics.totalCost / metrics.totalFuel : 0;
  const projectedMonthlyFuelLitres = effectiveMileageBase > 0 ? (avgDailyDistance * 30) / effectiveMileageBase : 0;
  const projectedMonthlyCost = avgFuelPrice > 0 ? projectedMonthlyFuelLitres * avgFuelPrice : avgDailyCost * 30;
  const co2PerLitre = metrics.totalFuel > 0 ? metrics.totalCO2 / metrics.totalFuel : 2.3;
  const projectedMonthlyEmissionsKg = projectedMonthlyFuelLitres * co2PerLitre;
  const projectedMonthlyFuelDisplay = projectedMonthlyFuelLitres * fuelFactor;
  const projectedMonthlyEmissionsDisplay = projectedMonthlyEmissionsKg * co2Factor;

  const lastFill = [...vehicleFilteredFillups]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const rangeFromLastFill = projectedRange(
    effectiveMileageDisplay,
    (lastFill?.fuelVolume ?? 0) * fuelFactor,
    avgDailyDistance * distanceFactor
  );

  const avgFillVolume = vehicleFilteredFillups.length
    ? vehicleFilteredFillups.reduce((sum, f) => sum + f.fuelVolume, 0) / vehicleFilteredFillups.length
    : 0;
  const todayIso = new Date().toISOString().slice(0, 10);
  const todaysFill = vehicleFilteredFillups.find((f) => f.date === todayIso);
  const assumedFillVolume = todaysFill?.fuelVolume ?? (avgFillVolume > 0 ? avgFillVolume : lastFill?.fuelVolume ?? 0);
  const fillTodayRange = projectedRange(
    effectiveMileageDisplay,
    (assumedFillVolume ?? 0) * fuelFactor,
    avgDailyDistance * distanceFactor
  );

  const distanceByVehicle = useMemo(() => {
    const map = new Map<string, number>();
    computeDistances(vehicleFilteredEntries).forEach((e) => {
      map.set(e.vehicle_id, (map.get(e.vehicle_id) ?? 0) + (e.distanceSincePrev ?? 0) * distanceFactor);
    });
    return Array.from(map.entries()).map(([vehicle_id, distance]) => ({
      vehicle_id,
      vehicle: vehicles.find((v) => v.id === vehicle_id)?.model ?? "Vehicle",
      distance,
    }));
  }, [vehicleFilteredEntries, vehicles, distanceFactor]);

  const vehicleComparisons = useMemo(() => {
    return vehicles.map((v) => {
      const vFillups = filteredFillups.filter((f) => f.vehicle_id === v.id);
      const cycles = computeFuelMileage(vFillups);
      const avgMileage = cycles.length ? cycles.reduce((s, c) => s + c.mileage, 0) / cycles.length : 0;
      return {
        id: v.id,
        name: `${v.make} ${v.model}`,
        typical: v.typicalMileage ?? undefined,
        actual: avgMileage,
      };
    });
  }, [vehicles, filteredFillups]);

  const formatDateLabel = (value: string) => {
    try {
      return format(new Date(value), "MMM d");
    } catch (e) {
      return value;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="text-center w-full">
          <p className="text-xs uppercase tracking-wide text-[hsl(var(--foreground))]/60">Dashboard</p>
          <h1 className="text-2xl font-semibold">Mileage, fuel, cost, and emissions overview</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <TimeRangeFilter value={timeframe} onChange={setTimeframe} />
          <select
            className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm"
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
          >
            <option value="all">All vehicles</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.make} {v.model}
              </option>
            ))}
          </select>
          {timeframe === "custom" && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={customRange.from.slice(0, 10)}
                onChange={(e) => setCustomRange((r) => ({ ...r, from: e.target.value }))}
                className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2 py-1"
              />
              <span>to</span>
              <input
                type="date"
                value={customRange.to.slice(0, 10)}
                onChange={(e) => setCustomRange((r) => ({ ...r, to: e.target.value }))}
                className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2 py-1"
              />
            </div>
          )}
        </div>
      </div>

      {reminderNeeded && (
        <div className="glass-card flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-medium">Don’t forget today’s odometer reading</p>
            <p className="text-xs text-[hsl(var(--foreground))]/70">
              Log today’s reading to keep projections accurate and reminders quiet.
            </p>
          </div>
          <Button asChild href="/logs" variant="secondary">
            Add today’s entry
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Distance travelled" value={`${oneDecimal(displayMetrics.totalKm)} ${distanceUnitLabel}`} hint={`${daysInRange} days`} />
        <StatCard
          title="Fuel consumed"
          value={`${oneDecimal(displayMetrics.totalFuel)} ${fuelUnitLabel}`}
          hint={metrics.avgMileage ? `${oneDecimal(displayMetrics.avgMileage)} ${distanceUnitLabel}/${fuelUnitLabel} avg` : "Need more fill-ups"}
        />
        <StatCard title="Money spent" value={currencyFmt.format(metrics.totalCost)} hint={`${currencyFmt.format(projectedMonthlyCost)} / month projected`} />
        <StatCard title="Emissions" value={`${oneDecimal(displayMetrics.totalCO2)} ${co2UnitLabel} CO₂`} hint="Based on fuel mix" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Monthly fuel & cost" description={`Fuel volume (${fuelUnitLabel}) vs spend`}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyFuel} margin={{ left: -8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis yAxisId="left" tickFormatter={(v) => `${v}${fuelUnitLabel}`} width={50} fontSize={12} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={40} fontSize={12} />
              <Tooltip
                formatter={(value: number, name) =>
                  name === "fuel"
                    ? [`${oneDecimal(value)} ${fuelUnitLabel}`, "Fuel"]
                    : [currencyFmt.format(value), "Cost"]
                }
              />
              <Bar yAxisId="left" dataKey="fuel" fill="#6366f1" radius={[6, 6, 0, 0]} />
              <Bar yAxisId="right" dataKey="cost" fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly CO₂" description={`Emissions from fuel mix (${co2UnitLabel})`}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyCO2Display} margin={{ left: -8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis tickFormatter={(v) => `${Math.round(v)} ${co2UnitLabel}`} width={70} fontSize={12} />
              <Tooltip formatter={(v: number) => [`${oneDecimal(v)} ${co2UnitLabel}`, "CO₂"]} />
              <Bar dataKey="co2" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Repeat the core charts below the monthly summaries as requested */}
        <div className="lg:col-span-2">
          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard title="Daily distance" description="Computed from odometer deltas">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={distanceSeries} margin={{ left: -16, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tickFormatter={formatDateLabel} fontSize={12} />
                  <YAxis width={50} tickFormatter={(v) => `${v}`} fontSize={12} />
                  <Tooltip labelFormatter={(v) => formatDateLabel(String(v))} formatter={(v: number) => [`${oneDecimal(v)} ${distanceUnitLabel}`, "Distance"]} />
                  <Line type="monotone" dataKey="km" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Mileage trend" description="Between consecutive fill-ups">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={mileageCyclesDisplay} margin={{ left: -8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tickFormatter={formatDateLabel} fontSize={12} />
                  <YAxis width={50} tickFormatter={(v) => `${v}`} fontSize={12} />
                  <Tooltip
                    labelFormatter={(v) => formatDateLabel(String(v))}
                    formatter={(v: number) => [`${oneDecimal(v)} ${distanceUnitLabel}/${fuelUnitLabel}`, "Mileage"]}
                  />
                  <Line type="monotone" dataKey="mileage" stroke="#22c55e" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Vehicle share" description="Distance split by vehicle">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={distanceByVehicle} dataKey="distance" nameKey="vehicle" innerRadius={60} outerRadius={90}>
                    {distanceByVehicle.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number, _name, entry) => [`${oneDecimal(v)} ${distanceUnitLabel}`, entry?.payload?.vehicle ?? ""]} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>

        <div className="grid gap-3 lg:col-span-2 lg:grid-cols-2">
          <div className="glass-card p-4">
            <p className="text-sm font-medium">Projections</p>
            <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
              <div>
                <p className="text-[hsl(var(--foreground))]/70">Range from last fill</p>
                {effectiveMileageDisplay > 0 && (lastFill?.fuelVolume ?? 0) > 0 ? (
                  <p className="text-lg font-semibold">{fmtDistance(rangeFromLastFill.km)} {distanceUnitLabel} · ~{rangeFromLastFill.days} days</p>
                ) : (
                  <p className="text-[hsl(var(--foreground))]/60">Add a fill-up and odometer entries to project range.</p>
                )}
              </div>
              <div>
                <p className="text-[hsl(var(--foreground))]/70">If you fill today</p>
                {effectiveMileageDisplay > 0 && assumedFillVolume > 0 ? (
                  <>
                    <p className="text-lg font-semibold">{fmtDistance(fillTodayRange.km)} {distanceUnitLabel} · ~{fillTodayRange.days} days</p>
                    <p className="text-[hsl(var(--foreground))]/60">
                      Assumes {fmtFuel(assumedFillVolume)} {fuelUnitLabel} using recent average mileage.
                    </p>
                  </>
                ) : (
                  <p className="text-[hsl(var(--foreground))]/60">Enter a recent fill-up to forecast today’s range.</p>
                )}
              </div>
              <div>
                <p className="text-[hsl(var(--foreground))]/70">Projected monthly cost</p>
                <p className="text-lg font-semibold">{currencyFmt.format(projectedMonthlyCost)}</p>
                <p className="text-[hsl(var(--foreground))]/60">Uses recent avg price {avgFuelPrice > 0 ? currencyFmt.format(avgFuelPrice) + "/" + fuelUnitLabel : "—"}</p>
              </div>
              <div>
                <p className="text-[hsl(var(--foreground))]/70">Projected monthly fuel</p>
                <p className="text-lg font-semibold">{oneDecimal(projectedMonthlyFuelDisplay)} {fuelUnitLabel}</p>
              </div>
              <div>
                <p className="text-[hsl(var(--foreground))]/70">Projected monthly emissions</p>
                <p className="text-lg font-semibold">{oneDecimal(projectedMonthlyEmissionsDisplay)} {co2UnitLabel}</p>
                <p className="text-[hsl(var(--foreground))]/60">Based on recent fuel mix</p>
              </div>
              <div>
                <p className="text-[hsl(var(--foreground))]/70">Best mileage month</p>
                <p className="text-lg font-semibold">{metrics.bestMileageMonth ?? "—"}</p>
              </div>
              <div>
                <p className="text-[hsl(var(--foreground))]/70">Most travelled month</p>
                <p className="text-lg font-semibold">{metrics.mostTravelledMonth ?? "—"}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <p className="text-sm font-medium">Vehicle mileage vs typical</p>
            <div className="mt-3 space-y-3 text-sm">
              {vehicleComparisons.map((v, idx) => (
                <div key={v.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{v.name}</p>
                    <p className="text-[hsl(var(--foreground))]/70">
                      {(() => {
                        const actualDisplay = fuelFactor > 0 ? (v.actual * distanceFactor) / fuelFactor : v.actual;
                        const typicalDisplay = v.typical ? (fuelFactor > 0 ? (v.typical * distanceFactor) / fuelFactor : v.typical) : undefined;
                        return `Actual ${oneDecimal(actualDisplay)} ${distanceUnitLabel}/${fuelUnitLabel}` +
                          (typicalDisplay !== undefined ? ` · Typical ${oneDecimal(typicalDisplay)} ${distanceUnitLabel}/${fuelUnitLabel}` : "");
                      })()}
                    </p>
                  </div>
                  <span className="rounded-full bg-[hsl(var(--primary))]/10 px-3 py-1 text-xs text-[hsl(var(--primary))]">
                    {v.typical
                      ? (() => {
                          const actualDisplay = fuelFactor > 0 ? (v.actual * distanceFactor) / fuelFactor : v.actual;
                          const typicalDisplay = fuelFactor > 0 ? (v.typical * distanceFactor) / fuelFactor : v.typical;
                          return `${oneDecimal(actualDisplay - typicalDisplay)} vs typical`;
                        })()
                      : "Tracked"}
                  </span>
                </div>
              ))}
              {!vehicleComparisons.length && <p className="text-[hsl(var(--foreground))]/60">Add a vehicle to compare.</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Recent history</p>
            <p className="text-xs text-[hsl(var(--foreground))]/70">Merged odometer and fuel timeline</p>
          </div>
          <Button asChild variant="ghost" href="/history">
            View full history
          </Button>
        </div>
        <div className="mt-4 space-y-3 text-sm">
          {history.slice(0, 6).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.type === "fuel" ? "⛽" : "🚗"}</span>
                <div>
                  <p className="font-medium">
                    {item.vehicleName} ·
                    {item.type === "fuel"
                      ? ` ${fmtFuel((item as any).fuelVolume)} ${fuelUnitLabel}`
                      : ` ${fmtDistance((item as any).odometerReading)} ${distanceUnitLabel}`}
                  </p>
                  <p className="text-[hsl(var(--foreground))]/70">
                    {formatDateLabel(item.date)} ·
                    {item.type === "fuel"
                      ? currencyFmt.format((item as any).totalCost)
                      : ` Odometer ${fmtDistance((item as any).odometerReading)} ${distanceUnitLabel}`}
                  </p>
                </div>
              </div>
              <span className="text-xs text-[hsl(var(--foreground))]/60">{formatDateLabel(item.date)}</span>
            </div>
          ))}
          {history.length === 0 && <p className="text-[hsl(var(--foreground))]/60">No history yet. Add odometer or fuel logs.</p>}
        </div>
      </div>
    </div>
  );
}
