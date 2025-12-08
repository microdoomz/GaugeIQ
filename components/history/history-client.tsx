"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DailyOdometerEntry,
  FuelFillUp,
  HistoryItem,
  Timeframe,
  Vehicle,
  UserPreferences,
} from "@/lib/types";
import { defaultRangeForTimeframe, filterByRange, unifiedHistory } from "@/lib/calculations";
import { TimeRangeFilter } from "@/components/filters/time-range-filter";
import { format } from "date-fns";
import clsx from "classnames";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

interface HistoryClientProps {
  entries: DailyOdometerEntry[];
  fillups: FuelFillUp[];
  vehicles: Vehicle[];
  initialTimeframe: Timeframe;
  preferences: UserPreferences;
}

const formatDate = (value: string) => format(new Date(value), "MMM d, yyyy");

const typeOptions = [
  { value: "all", label: "All" },
  { value: "odometer", label: "Odometer" },
  { value: "fuel", label: "Fuel" },
];

export function HistoryClient({ entries, fillups, vehicles, initialTimeframe, preferences }: HistoryClientProps) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [timeframe, setTimeframe] = useState<Timeframe>(initialTimeframe);
  const [customRange, setCustomRange] = useState<{ from: string; to: string }>(() => {
    const r = defaultRangeForTimeframe(initialTimeframe);
    return { from: r.from.toISOString(), to: r.to.toISOString() };
  });
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "odometer" | "fuel">("all");
  const [sortDesc, setSortDesc] = useState(true);
  const [detail, setDetail] = useState<HistoryItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<UserPreferences>(preferences);

  useEffect(() => {
    setPrefs(preferences);
  }, [preferences]);

  const distanceFactor = prefs.distanceUnit === "mi" ? 0.621371 : 1;
  const fuelFactor = prefs.fuelUnit === "gal" ? 0.264172 : 1;
  const distanceUnitLabel = prefs.distanceUnit;
  const fuelUnitLabel = prefs.fuelUnit;
  const currencyFmt = new Intl.NumberFormat("en", {
    style: "currency",
    currency: prefs.currency,
    maximumFractionDigits: 0,
  });

  const fmtDistance = (v: number) => Number((v * distanceFactor).toFixed(2));
  const fmtFuel = (v: number) => Number((v * fuelFactor).toFixed(2));

  const range = useMemo(() => {
    if (timeframe === "custom") return { from: new Date(customRange.from), to: new Date(customRange.to) };
    return defaultRangeForTimeframe(timeframe);
  }, [timeframe, customRange]);

  const filteredEntries = useMemo(() => filterByRange(entries, range.from, range.to), [entries, range]);
  const filteredFillups = useMemo(() => filterByRange(fillups, range.from, range.to), [fillups, range]);

  const history = useMemo(() => {
    const merged = unifiedHistory(filteredEntries, filteredFillups, vehicles)
      .filter((h) => (vehicleFilter === "all" ? true : h.vehicleId === vehicleFilter))
      .filter((h) => (typeFilter === "all" ? true : h.type === typeFilter))
      .sort((a, b) =>
        sortDesc
          ? new Date(b.date).getTime() - new Date(a.date).getTime()
          : new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    return merged;
  }, [filteredEntries, filteredFillups, vehicles, vehicleFilter, typeFilter, sortDesc]);

  const grouped = useMemo(() => {
    const map = new Map<string, HistoryItem[]>();
    history.forEach((item) => {
      const key = formatDate(item.date);
      map.set(key, [...(map.get(key) ?? []), item]);
    });
    return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
  }, [history]);

  const vehicleName = (id: string) => vehicles.find((v) => v.id === id)?.model ?? "Vehicle";

  const handleDelete = async (item: HistoryItem) => {
    setDeletingId(item.id);
    if (item.type === "fuel") {
      await supabase.from("fuel_fillups").delete().eq("id", item.id);
    } else {
      await supabase.from("daily_odometer_entries").delete().eq("id", item.id);
    }
    setDeletingId(null);
    setSuccess("Deleted");
    router.refresh();
  };

  const [editFuel, setEditFuel] = useState({
    fuelVolume: "",
    totalCost: "",
    odometerAtFill: "",
    stationName: "",
    notes: "",
  });
  const [editOdo, setEditOdo] = useState({
    odometerReading: "",
    notes: "",
  });

  const startEdit = (item: HistoryItem) => {
    setDetail(item);
    if (item.type === "fuel") {
      setEditFuel({
        fuelVolume: String((item as any).fuelVolume ?? ""),
        totalCost: String((item as any).totalCost ?? ""),
        odometerAtFill: String((item as any).odometerAtFill ?? ""),
        stationName: String((item as any).stationName ?? ""),
        notes: String((item as any).notes ?? ""),
      });
    } else {
      setEditOdo({
        odometerReading: String((item as any).odometerReading ?? ""),
        notes: String((item as any).notes ?? ""),
      });
    }
  };

  const saveEdit = async () => {
    if (!detail) return;
    setSavingId(detail.id);
    setSuccess(null);
    if (detail.type === "fuel") {
      const payload: any = {
        fuelVolume: Number(editFuel.fuelVolume),
        totalCost: Number(editFuel.totalCost),
        odometerAtFill: Number(editFuel.odometerAtFill),
        stationName: editFuel.stationName || null,
        notes: editFuel.notes || null,
      };
      if (payload.fuelVolume > 0) payload.fuelPricePerLitre = payload.totalCost / payload.fuelVolume;
      await supabase.from("fuel_fillups").update(payload).eq("id", detail.id);
    } else {
      const payload: any = {
        odometerReading: Number(editOdo.odometerReading),
        notes: editOdo.notes || null,
      };
      await supabase.from("daily_odometer_entries").update(payload).eq("id", detail.id);
    }
    setSavingId(null);
    setDetail(null);
    setSuccess("Saved");
    router.refresh();
  };

  const exportCsv = () => {
    const rows = [
      [
        "type",
        "date",
        "vehicle",
        "odometer",
        "distanceSinceLast",
        "fuelVolume",
        "totalCost",
        "fuelPricePerLitre",
        "stationName",
        "mileageForCycle",
      ],
      ...history.map((h) => [
        h.type,
        h.date,
        vehicleName(h.vehicleId),
        h.type === "odometer" ? (h as any).odometerReading : (h as any).odometerAtFill,
        h.type === "odometer" ? (h as any).distanceSinceLast ?? "" : "",
        h.type === "fuel" ? (h as any).fuelVolume : "",
        h.type === "fuel" ? (h as any).totalCost : "",
        h.type === "fuel" ? (h as any).fuelPricePerLitre ?? "" : "",
        h.type === "fuel" ? (h as any).stationName ?? "" : "",
        h.type === "fuel" ? (h as any).mileageForCycle ?? "" : "",
      ]),
    ];
    const csv = rows.map((r) => r.join(","));
    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gaugeiq-history.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-center w-full">
          <p className="text-xs uppercase tracking-wide text-[hsl(var(--foreground))]/60">History</p>
          <h1 className="text-xl font-semibold">Merged odometer and fuel events</h1>
        </div>
        {success && <span className="text-sm text-green-600">{success}</span>}
        <div className="flex flex-wrap items-center gap-3">
          <TimeRangeFilter value={timeframe} onChange={setTimeframe} />
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
          <select
            className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
          >
            {typeOptions.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setSortDesc((s) => !s)}
            className="rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-xs"
          >
            {sortDesc ? "Newest first" : "Oldest first"}
          </button>
          <button
            onClick={exportCsv}
            className="rounded-lg border border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 px-3 py-2 text-xs text-[hsl(var(--primary))]"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {grouped.map((group) => (
          <div key={group.date} className="space-y-2">
            <p className="text-sm font-semibold text-[hsl(var(--foreground))]/80">{group.date}</p>
            {group.items.map((item) => (
              <button
                key={item.id}
                onClick={() => startEdit(item)}
                className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-3 text-left transition hover:border-[hsl(var(--primary))]/50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.type === "fuel" ? "⛽" : "🚗"}</span>
                  <div>
                    <p className="font-medium">{item.vehicleName}</p>
                    {item.type === "fuel" ? (
                      <p className="text-sm text-[hsl(var(--foreground))]/70">
                        {fmtFuel((item as any).fuelVolume)} {fuelUnitLabel} · {currencyFmt.format((item as any).totalCost)} · Odo {fmtDistance((item as any).odometerAtFill)} {distanceUnitLabel}
                      </p>
                    ) : (
                      <p className="text-sm text-[hsl(var(--foreground))]/70">
                        Odometer {fmtDistance((item as any).odometerReading)} {distanceUnitLabel} · Δ {fmtDistance((item as any).distanceSinceLast ?? 0)} {distanceUnitLabel}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium">{formatDate(item.date)}</p>
                  <p className="text-[hsl(var(--foreground))]/60">Created {format(new Date(item.created_at), "MMM d, HH:mm")}</p>
                </div>
              </button>
            ))}
          </div>
        ))}
        {grouped.length === 0 && <p className="text-[hsl(var(--foreground))]/60">No records for this range.</p>}
      </div>

      {detail && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4" onClick={() => setDetail(null)}>
          <div
            className="w-full max-w-lg rounded-2xl bg-[hsl(var(--card))] p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-wide text-[hsl(var(--foreground))]/60">{detail.type}</p>
                <h2 className="text-xl font-semibold">{detail.vehicleName}</h2>
                <p className="text-sm text-[hsl(var(--foreground))]/70">{formatDate(detail.date)}</p>
              </div>
              <button onClick={() => setDetail(null)} className="text-sm">✕</button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              {detail.type === "fuel" ? (
                <div className="grid gap-2 md:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span>Fuel volume ({fuelUnitLabel})</span>
                    <input
                      className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm"
                      value={editFuel.fuelVolume}
                      onChange={(e) => setEditFuel((p) => ({ ...p, fuelVolume: e.target.value }))}
                      type="number"
                      step="0.1"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Total cost</span>
                    <input
                      className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm"
                      value={editFuel.totalCost}
                      onChange={(e) => setEditFuel((p) => ({ ...p, totalCost: e.target.value }))}
                      type="number"
                      step="0.01"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Odometer at fill ({distanceUnitLabel})</span>
                    <input
                      className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm"
                      value={editFuel.odometerAtFill}
                      onChange={(e) => setEditFuel((p) => ({ ...p, odometerAtFill: e.target.value }))}
                      type="number"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Station</span>
                    <input
                      className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm"
                      value={editFuel.stationName}
                      onChange={(e) => setEditFuel((p) => ({ ...p, stationName: e.target.value }))}
                    />
                  </label>
                  <label className="md:col-span-2 flex flex-col gap-1">
                    <span>Notes</span>
                    <textarea
                      className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm"
                      value={editFuel.notes}
                      onChange={(e) => setEditFuel((p) => ({ ...p, notes: e.target.value }))}
                    />
                  </label>
                </div>
              ) : (
                <div className="grid gap-2">
                  <label className="flex flex-col gap-1">
                    <span>Odometer ({distanceUnitLabel})</span>
                    <input
                      className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm"
                      value={editOdo.odometerReading}
                      onChange={(e) => setEditOdo((p) => ({ ...p, odometerReading: e.target.value }))}
                      type="number"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Notes</span>
                    <textarea
                      className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm"
                      value={editOdo.notes}
                      onChange={(e) => setEditOdo((p) => ({ ...p, notes: e.target.value }))}
                    />
                  </label>
                </div>
              )}
              <p>Created: {format(new Date(detail.created_at), "MMM d, yyyy HH:mm")}</p>
            </div>

            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                onClick={saveEdit}
                disabled={!!savingId}
                className="rounded-lg bg-[hsl(var(--primary))]/10 px-4 py-2 text-[hsl(var(--primary))]"
              >
                {savingId ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => detail && handleDelete(detail)}
                disabled={!!deletingId}
                className="rounded-lg border border-[hsl(var(--destructive))] px-4 py-2 text-[hsl(var(--destructive))]"
              >
                {deletingId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
