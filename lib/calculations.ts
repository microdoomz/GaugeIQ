import { addDays, endOfMonth, isWithinInterval, startOfMonth, startOfDay, endOfDay } from "date-fns";
import { DailyOdometerEntry, FuelFillUp, HistoryItem, Vehicle } from "./types";

const CO2_FACTORS: Record<string, number> = {
  petrol: 2.3,
  diesel: 2.7,
  cng: 1.6,
  default: 2.3,
};

// ---------------------------------------------------------------------------
// Odometer distance helpers
// ---------------------------------------------------------------------------

export interface OdometerDistancePoint {
  id: string;
  vehicle_id: string;
  date: string;
  odometer: number;
  source: "entry" | "fillup";
  created_at?: string;
  isAnchor?: boolean;
  distanceSincePrev: number;
}

const sortReadings = (
  a: { date: string; created_at?: string; id?: string },
  b: { date: string; created_at?: string; id?: string }
) => {
  const da = new Date(a.date).getTime();
  const db = new Date(b.date).getTime();
  if (da !== db) return da - db;
  const ca = a.created_at ? new Date(a.created_at).getTime() : da;
  const cb = b.created_at ? new Date(b.created_at).getTime() : db;
  if (ca !== cb) return ca - cb;
  if (a.id && b.id) return a.id.localeCompare(b.id);
  return 0;
};

const buildCombinedReadings = (entries: DailyOdometerEntry[], fillups: FuelFillUp[]) => {
  const readings: Array<{
    id: string;
    vehicle_id: string;
    date: string;
    odometer: number;
    source: "entry" | "fillup";
    created_at?: string;
  }> = [];

  entries.forEach((e) => {
    if (typeof e.odometerReading === "number") {
      readings.push({
        id: e.id,
        vehicle_id: e.vehicle_id,
        date: e.date,
        odometer: e.odometerReading,
        source: "entry",
        created_at: e.created_at,
      });
    }
  });

  fillups.forEach((f) => {
    if (typeof f.odometerAtFill === "number") {
      readings.push({
        id: `fill-${f.id}`,
        vehicle_id: f.vehicle_id,
        date: f.date,
        odometer: f.odometerAtFill,
        source: "fillup",
        created_at: f.created_at,
      });
    }
  });

  return readings;
};

/**
 * Compute per-reading distance deltas within a date range.
 * An "anchor" reading (the latest reading before the range) is used so the
 * first in-range reading still gets a proper distance delta.
 */
export const computeOdometerDistancesForRange = (
  entries: DailyOdometerEntry[],
  fillups: FuelFillUp[],
  range: { from: Date; to: Date }
) => {
  const start = startOfDay(range.from).getTime();
  const end = endOfDay(range.to).getTime();
  const combined = buildCombinedReadings(entries, fillups);

  const byVehicle = new Map<string, typeof combined>();
  combined.forEach((r) => {
    byVehicle.set(r.vehicle_id, [...(byVehicle.get(r.vehicle_id) ?? []), r]);
  });

  const result: OdometerDistancePoint[] = [];

  byVehicle.forEach((list) => {
    const sorted = [...list].sort(sortReadings);
    const anchor = sorted.filter((r) => new Date(r.date).getTime() < start).pop();
    const inRange = sorted.filter((r) => {
      const t = new Date(r.date).getTime();
      return t >= start && t <= end;
    });
    if (!anchor && !inRange.length) return;
    const series = [...(anchor ? [{ ...anchor, isAnchor: true }] : []), ...inRange];

    let prev: (typeof series)[number] | undefined;
    series.forEach((r) => {
      const prevIsAnchor = Boolean((prev as any)?.isAnchor);
      const distance = prev ? (prevIsAnchor ? 0 : Math.max(r.odometer - prev.odometer, 0)) : 0;
      result.push({ ...r, distanceSincePrev: distance });
      prev = r;
    });
  });

  return result.sort(sortReadings);
};

/**
 * Simple per-vehicle odometer deltas for a flat list of entries (no anchor).
 */
export const computeDistances = (entries: DailyOdometerEntry[]) => {
  const byVehicle = new Map<string, DailyOdometerEntry[]>();
  entries.forEach((e) => {
    byVehicle.set(e.vehicle_id, [...(byVehicle.get(e.vehicle_id) ?? []), e]);
  });

  const distances = new Map<string, number>();

  byVehicle.forEach((list) => {
    const sorted = [...list].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    sorted.forEach((entry, idx) => {
      if (idx === 0) {
        distances.set(entry.id, 0);
      } else {
        const prev = sorted[idx - 1];
        const distance = entry.odometerReading - prev.odometerReading;
        distances.set(entry.id, Math.max(distance, 0));
      }
    });
  });

  return [...entries]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((entry) => ({ ...entry, distanceSincePrev: distances.get(entry.id) ?? 0 }));
};

// ---------------------------------------------------------------------------
// Trip estimates
// ---------------------------------------------------------------------------

export const computeTripEstimates = ({
  startOdometer,
  endOdometer,
  fuelVolume,
  typicalMileage,
  fuelType,
  pricePerLitre,
}: {
  startOdometer: number;
  endOdometer: number;
  fuelVolume?: number | null;
  typicalMileage?: number | null;
  fuelType?: string | null;
  pricePerLitre?: number | null;
}) => {
  const distance = Math.max(endOdometer - startOdometer, 0);
  const estimatedFuel = fuelVolume ?? (typicalMileage ? distance / typicalMileage : null);
  const factor = CO2_FACTORS[fuelType ?? "default"] ?? CO2_FACTORS.default;
  const estimatedCO2 = estimatedFuel != null ? estimatedFuel * factor : null;
  const estimatedCost = estimatedFuel != null && pricePerLitre != null ? estimatedFuel * pricePerLitre : null;
  return { distance, estimatedFuel, estimatedCO2, estimatedCost };
};

// ---------------------------------------------------------------------------
// Fuel mileage — full-to-full method with weighted average
// ---------------------------------------------------------------------------

export interface MileageCycle {
  mileage: number;
  date: string;
  fuelVolume: number;
  distance: number;
}

export interface FuelMileageResult {
  /** Individual full-to-full mileage cycles for trend charting. */
  cycles: MileageCycle[];
  /** Weighted average: totalDistance / totalFuel across all valid cycles. */
  weightedAvgMileage: number;
  /** Total distance across all valid cycles. */
  totalCycleDistance: number;
  /** Total fuel across all valid cycles. */
  totalCycleFuel: number;
  /** Standard deviation of per-cycle mileage values. */
  mileageStdDev: number;
  /** Min mileage seen across cycles. */
  mileageMin: number;
  /** Max mileage seen across cycles. */
  mileageMax: number;
}

/**
 * Compute mileage using the full-to-full tank method.
 *
 * A valid cycle starts at a full-tank fill-up and ends at the next full-tank
 * fill-up. Any partial fill-ups in between have their fuel volume accumulated
 * into the cycle total. This gives accurate mileage even when the user
 * doesn't always fill to full.
 *
 * The function also computes a proper weighted average (total distance / total
 * fuel) instead of a simple average of per-cycle values.
 */
export const computeFuelMileage = (fillups: FuelFillUp[]): FuelMileageResult => {
  // Group fillups by vehicle_id so we never mix odometers across different vehicles
  const byVehicle = new Map<string, FuelFillUp[]>();
  fillups.forEach((f) => {
    byVehicle.set(f.vehicle_id, [...(byVehicle.get(f.vehicle_id) ?? []), f]);
  });

  const allCycles: MileageCycle[] = [];
  let totalDistanceAcrossVehicles = 0;
  let totalFuelAcrossVehicles = 0;

  byVehicle.forEach((vFills) => {
    const sorted = [...vFills].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Track full-to-full tank cycles for trend graphing
    let cycleStartOdometer: number | null = null;
    let accumulatedFuel = 0;

    for (const fill of sorted) {
      if (cycleStartOdometer === null) {
        if (fill.isFullTank) {
          cycleStartOdometer = fill.odometerAtFill;
          accumulatedFuel = 0;
        }
        continue;
      }

      accumulatedFuel += fill.fuelVolume;

      if (fill.isFullTank) {
        const distance = fill.odometerAtFill - cycleStartOdometer;
        if (distance > 0 && accumulatedFuel > 0) {
          const rawCycleMileage = distance / accumulatedFuel;
          allCycles.push({
            mileage: Number((rawCycleMileage * 0.90).toFixed(2)), // 10% reduction
            date: fill.date,
            fuelVolume: accumulatedFuel,
            distance,
          });
        }
        cycleStartOdometer = fill.odometerAtFill;
        accumulatedFuel = 0;
      }
    }

    // If no full-tank cycles were found, fallback to interval cycles between consecutive fillups for trend display
    if (allCycles.length === 0 && sorted.length >= 2) {
      for (let i = 1; i < sorted.length; i++) {
        const dist = sorted[i].odometerAtFill - sorted[i - 1].odometerAtFill;
        const vol = sorted[i].fuelVolume;
        if (dist > 0 && vol > 0) {
          allCycles.push({
            mileage: Number(((dist / vol) * 0.90).toFixed(2)),
            date: sorted[i].date,
            fuelVolume: vol,
            distance: dist,
          });
        }
      }
    }

    // Accurate mileage calculation requested:
    // Take the last 20 fuel fillups for this vehicle
    // Find the difference in odometer between the most recent and the least recent within those 20 fillups
    // Add the total amount of fuel filled in those 20 most recent fillups
    // Divide odometer difference by total fuel filled to get average mileage, then subtract 10%
    if (sorted.length >= 2) {
      const recentFills = sorted.slice(-20);
      const firstRecent = recentFills[0];
      const lastRecent = recentFills[recentFills.length - 1];
      const distance = Math.max(lastRecent.odometerAtFill - firstRecent.odometerAtFill, 0);

      const totalFuel = recentFills.reduce((sum, f) => sum + (f.fuelVolume || 0), 0);

      if (totalFuel > 0 && distance > 0) {
        totalDistanceAcrossVehicles += distance;
        totalFuelAcrossVehicles += totalFuel;
      }
    }
  });

  // Calculate weighted average mileage across vehicles using the 20-fillup method with 10% reduction
  let weightedAvgMileage = 0;
  if (totalDistanceAcrossVehicles > 0 && totalFuelAcrossVehicles > 0) {
    const rawMileage = totalDistanceAcrossVehicles / totalFuelAcrossVehicles;
    weightedAvgMileage = Number((rawMileage * 0.90).toFixed(2));
  } else if (allCycles.length > 0) {
    const totalDist = allCycles.reduce((s, c) => s + c.distance, 0);
    const totalFuel = allCycles.reduce((s, c) => s + c.fuelVolume, 0);
    if (totalDist > 0 && totalFuel > 0) {
      weightedAvgMileage = Number(((totalDist / totalFuel) * 0.90).toFixed(2));
    }
  }

  const cycles = allCycles.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const totalCycleDistance = cycles.reduce((s, c) => s + c.distance, 0);
  const totalCycleFuel = cycles.reduce((s, c) => s + c.fuelVolume, 0);

  let mileageStdDev = 0;
  let mileageMin = 0;
  let mileageMax = 0;
  if (cycles.length > 0) {
    const mileages = cycles.map((c) => c.mileage);
    mileageMin = Math.min(...mileages);
    mileageMax = Math.max(...mileages);
    const mean = mileages.reduce((s, v) => s + v, 0) / mileages.length;
    const variance = mileages.reduce((s, v) => s + (v - mean) ** 2, 0) / mileages.length;
    mileageStdDev = Math.sqrt(variance);
  }

  return {
    cycles,
    weightedAvgMileage,
    totalCycleDistance,
    totalCycleFuel,
    mileageStdDev,
    mileageMin,
    mileageMax,
  };
};

// ---------------------------------------------------------------------------
// Dashboard metrics
// ---------------------------------------------------------------------------

export interface DashboardMetrics {
  totalKm: number;
  totalFuel: number;
  totalCost: number;
  avgMileage: number;
  totalCO2: number;
  bestMileageMonth?: string;
  mostTravelledMonth?: string;
  /** Mileage standard deviation for the "±" display. */
  mileageStdDev: number;
  mileageMin: number;
  mileageMax: number;
}

export const aggregateMetrics = (
  entries: DailyOdometerEntry[],
  fillups: FuelFillUp[],
  vehicles: Vehicle[],
  options?: {
    range?: { from: Date; to: Date };
    allEntries?: DailyOdometerEntry[];
    allFillups?: FuelFillUp[];
  }
): DashboardMetrics => {
  const distanceEntries = options?.allEntries ?? entries;
  const distanceFillups = options?.allFillups ?? fillups;

  // ---- Total distance: single reliable method ----
  const combinedDates = [
    ...distanceEntries.map((e) => new Date(e.date).getTime()),
    ...distanceFillups.map((f) => new Date(f.date).getTime()),
  ].filter((t) => Number.isFinite(t));
  const fallbackFrom = combinedDates.length ? new Date(Math.min(...combinedDates)) : new Date("1970-01-01");
  const fallbackTo = combinedDates.length ? new Date(Math.max(...combinedDates)) : new Date();
  const distanceRange = options?.range ?? { from: fallbackFrom, to: fallbackTo };

  const distanceReadings = computeOdometerDistancesForRange(distanceEntries, distanceFillups, distanceRange);
  const totalKm = distanceReadings.reduce((sum, r) => sum + (r.distanceSincePrev ?? 0), 0);

  // ---- Fuel totals ----
  const totalFuel = fillups.reduce((sum, f) => sum + f.fuelVolume, 0);
  const totalCost = fillups.reduce((sum, f) => sum + f.totalCost, 0);

  // ---- Mileage: computed from the latest 20 fillups regardless of date filter ----
  const mileageFillups = options?.allFillups ?? fillups;
  const fuelResult = computeFuelMileage(mileageFillups);
  const avgMileage = fuelResult.weightedAvgMileage;

  // ---- CO2 ----
  const totalCO2 = fillups.reduce((sum, f) => {
    const veh = vehicles.find((v) => v.id === f.vehicle_id);
    const factor = CO2_FACTORS[veh?.fuelType ?? "default"] ?? CO2_FACTORS.default;
    return sum + f.fuelVolume * factor;
  }, 0);

  // ---- Best mileage month ----
  const monthMileage = new Map<string, { distance: number; fuel: number }>();
  fillups.forEach((f) => {
    const month = f.date.slice(0, 7);
    const entry = monthMileage.get(month) ?? { distance: 0, fuel: 0 };
    const prev = fillups
      .filter((x) => x.vehicle_id === f.vehicle_id && new Date(x.date) < new Date(f.date))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    if (prev) {
      entry.distance += Math.max(f.odometerAtFill - prev.odometerAtFill, 0);
    }
    entry.fuel += f.fuelVolume;
    monthMileage.set(month, entry);
  });

  let bestMileageMonth: string | undefined;
  let bestMileageValue = 0;
  monthMileage.forEach((v, month) => {
    if (v.fuel > 0) {
      const mileage = v.distance / v.fuel;
      if (mileage > bestMileageValue) {
        bestMileageValue = mileage;
        bestMileageMonth = month;
      }
    }
  });

  // ---- Most travelled month ----
  const monthDistance = new Map<string, number>();
  computeDistances(entries).forEach((e) => {
    const month = e.date.slice(0, 7);
    monthDistance.set(month, (monthDistance.get(month) ?? 0) + (e.distanceSincePrev ?? 0));
  });
  let mostTravelledMonth: string | undefined;
  let maxKm = 0;
  monthDistance.forEach((km, month) => {
    if (km > maxKm) {
      maxKm = km;
      mostTravelledMonth = month;
    }
  });

  return {
    totalKm,
    totalFuel,
    totalCost,
    avgMileage,
    totalCO2,
    bestMileageMonth,
    mostTravelledMonth,
    mileageStdDev: fuelResult.mileageStdDev,
    mileageMin: fuelResult.mileageMin,
    mileageMax: fuelResult.mileageMax,
  };
};

// ---------------------------------------------------------------------------
// EWMA helpers for smart projections
// ---------------------------------------------------------------------------

/**
 * Exponentially Weighted Moving Average.
 * alpha controls how much weight recent values get (0.3 = recent-leaning).
 */
const ewma = (values: number[], alpha = 0.3): number => {
  if (!values.length) return 0;
  let avg = values[0];
  for (let i = 1; i < values.length; i++) {
    avg = alpha * values[i] + (1 - alpha) * avg;
  }
  return avg;
};

// ---------------------------------------------------------------------------
// Smart projection — replaces the old naive projectedRange
// ---------------------------------------------------------------------------

export interface SmartProjection {
  /** Estimated remaining fuel in tank (litres). */
  remainingFuelL: number;
  /** Estimated remaining range (km). */
  remainingKm: number;
  /** Estimated remaining days of driving. */
  remainingDays: number;
  /** EWMA mileage used for this projection (km/L). */
  ewmaMileage: number;
  /** EWMA daily distance used (km/day). */
  ewmaDailyDistance: number;
  /** Tank fill percentage (0-100), only if tankCapacity is known. */
  tankPercent: number | null;
}

/**
 * Smart projection that accounts for:
 * - Fuel consumed since the last fill-up (from odometer data).
 * - Recent driving patterns via EWMA (adapts to traffic/conditions).
 * - Partial fill-ups (accumulates fuel since last full-tank fill).
 * - Tank capacity if known.
 */
export const computeSmartProjection = ({
  fillups,
  entries,
  vehicles,
  vehicleId,
}: {
  fillups: FuelFillUp[];
  entries: DailyOdometerEntry[];
  vehicles: Vehicle[];
  vehicleId?: string;
}): SmartProjection | null => {
  // Filter to relevant vehicle if specified.
  const vFillups = vehicleId ? fillups.filter((f) => f.vehicle_id === vehicleId) : fillups;
  const vEntries = vehicleId ? entries.filter((e) => e.vehicle_id === vehicleId) : entries;
  const vehicle = vehicleId ? vehicles.find((v) => v.id === vehicleId) : vehicles[0];

  if (!vFillups.length) return null;

  const sortedFillups = [...vFillups].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // 1. Get average mileage using the accurate 20-fillup formula (-10% adjustment).
  const fuelResult = computeFuelMileage(vFillups);
  const effectiveMileage = fuelResult.weightedAvgMileage > 0
    ? fuelResult.weightedAvgMileage
    : (vehicle?.typicalMileage && vehicle.typicalMileage > 0 ? vehicle.typicalMileage : 0);

  if (effectiveMileage <= 0) return null;

  // 2. Get EWMA of daily distance from odometer entries.
  const sortedEntries = [...vEntries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const dailyDistances: number[] = [];
  for (let i = 1; i < sortedEntries.length; i++) {
    const prev = sortedEntries[i - 1];
    const curr = sortedEntries[i];
    const daysDiff = Math.max(
      1,
      (new Date(curr.date).getTime() - new Date(prev.date).getTime()) / (1000 * 60 * 60 * 24)
    );
    const dist = Math.max(curr.odometerReading - prev.odometerReading, 0);
    dailyDistances.push(dist / daysDiff);
  }
  const ewmaDailyDistance = dailyDistances.length > 0 ? ewma(dailyDistances, 0.3) : 0;

  // 3. Tank capacity resolution:
  const explicitCapacity = Number(vehicle?.tankCapacity ?? (vehicle as any)?.tank_capacity ?? 0);
  const maxFuelAddedEver = Math.max(...sortedFillups.map((f) => f.fuelVolume || 0), 0);
  const tankCapacity = explicitCapacity > 0
    ? explicitCapacity
    : (maxFuelAddedEver > 0 ? maxFuelAddedEver * 1.15 : 45); // realistic default fallback if unspecified

  // 4. Calculate remaining fuel in tank.
  // Find latest odometer reading.
  const latestOdoFromEntries = sortedEntries.length
    ? sortedEntries[sortedEntries.length - 1].odometerReading
    : 0;
  const lastFill = sortedFillups[sortedFillups.length - 1];
  const latestOdoFromFillups = lastFill.odometerAtFill;
  const latestOdometer = Math.max(latestOdoFromEntries, latestOdoFromFillups);

  // Find the last full-tank fillup if one exists.
  let lastFullIndex = -1;
  for (let i = sortedFillups.length - 1; i >= 0; i--) {
    if (sortedFillups[i].isFullTank) {
      lastFullIndex = i;
      break;
    }
  }

  let currentFuel = 0;
  let simStartOdometer = 0;

  if (lastFullIndex !== -1) {
    // Start simulation at the last full fill: tank is at capacity
    const fullFill = sortedFillups[lastFullIndex];
    currentFuel = tankCapacity;
    simStartOdometer = fullFill.odometerAtFill;

    // Simulate forward through any subsequent partial fills
    for (let i = lastFullIndex + 1; i < sortedFillups.length; i++) {
      const fill = sortedFillups[i];
      const dist = Math.max(fill.odometerAtFill - simStartOdometer, 0);
      const consumed = dist / effectiveMileage;
      currentFuel = Math.max(currentFuel - consumed, 0);
      // New fuel added cannot exceed the physical tank capacity
      currentFuel = Math.min(currentFuel + fill.fuelVolume, tankCapacity);
      simStartOdometer = fill.odometerAtFill;
    }
  } else {
    // No full tank marked: simulate across the last few fillups (up to 5)
    const recentSimFills = sortedFillups.slice(-5);
    currentFuel = Math.min(recentSimFills[0].fuelVolume, tankCapacity);
    simStartOdometer = recentSimFills[0].odometerAtFill;

    for (let i = 1; i < recentSimFills.length; i++) {
      const fill = recentSimFills[i];
      const dist = Math.max(fill.odometerAtFill - simStartOdometer, 0);
      const consumed = dist / effectiveMileage;
      currentFuel = Math.max(currentFuel - consumed, 0);
      currentFuel = Math.min(currentFuel + fill.fuelVolume, tankCapacity);
      simStartOdometer = fill.odometerAtFill;
    }
  }

  // Deduct fuel consumed from the last fillup to the latest recorded odometer
  const distanceSinceLastFill = Math.max(latestOdometer - simStartOdometer, 0);
  const fuelConsumedSinceLastFill = distanceSinceLastFill / effectiveMileage;
  let remainingFuelL = Math.max(currentFuel - fuelConsumedSinceLastFill, 0);

  // CLAMP TO TANK CAPACITY: Remaining fuel can NEVER exceed tank capacity
  if (tankCapacity > 0) {
    remainingFuelL = Math.min(remainingFuelL, tankCapacity);
  }

  // 5. Project remaining range and days.
  const remainingKm = remainingFuelL * effectiveMileage;
  const remainingDays = ewmaDailyDistance > 0 ? remainingKm / ewmaDailyDistance : 0;

  // 6. Tank percentage strictly capped at 100%.
  const tankPercent = tankCapacity > 0
    ? Math.min(Math.round((remainingFuelL / tankCapacity) * 100), 100)
    : null;

  return {
    remainingFuelL: Number(remainingFuelL.toFixed(1)),
    remainingKm: Number(remainingKm.toFixed(1)),
    remainingDays: Math.round(remainingDays),
    ewmaMileage: Number(effectiveMileage.toFixed(1)),
    ewmaDailyDistance: Number(ewmaDailyDistance.toFixed(1)),
    tankPercent,
  };
};

// ---------------------------------------------------------------------------
// Legacy projectedRange kept for backward compatibility
// ---------------------------------------------------------------------------

export const projectedRange = (avgMileage: number, fuelLitres: number, avgDailyDistance: number) => {
  const km = fuelLitres * avgMileage;
  const days = avgDailyDistance > 0 ? km / avgDailyDistance : 0;
  return { km: Number(km.toFixed(1)), days: Math.round(days) };
};

// ---------------------------------------------------------------------------
// Filtering and time ranges
// ---------------------------------------------------------------------------

export const filterByRange = <T extends { date: string }>(items: T[], from: Date, to: Date) => {
  const start = startOfDay(from);
  const end = endOfDay(to);
  return items.filter((i) => {
    const d = new Date(i.date);
    return isWithinInterval(d, { start, end });
  });
};

export const defaultRangeForTimeframe = (timeframe: string): { from: Date; to: Date } => {
  const today = new Date();
  switch (timeframe) {
    case "today":
      return { from: today, to: today };
    case "7d":
      return { from: addDays(today, -6), to: today };
    case "30d":
      return { from: addDays(today, -29), to: today };
    case "this-month":
      return { from: startOfMonth(today), to: endOfMonth(today) };
    case "last-month":
      const firstPrev = startOfMonth(addDays(startOfMonth(today), -1));
      return { from: firstPrev, to: endOfMonth(firstPrev) };
    case "all":
      return { from: new Date("1970-01-01"), to: today };
    default:
      return { from: new Date("1970-01-01"), to: today };
  }
};

// ---------------------------------------------------------------------------
// Unified history timeline
// ---------------------------------------------------------------------------

export const unifiedHistory = (
  entries: DailyOdometerEntry[],
  fillups: FuelFillUp[],
  vehicles: Vehicle[]
): HistoryItem[] => {
  const vehicleName = (id: string) => vehicles.find((v) => v.id === id)?.model ?? "Vehicle";
  const withDistance = computeDistances(entries);
  const entryHistory: HistoryItem[] = withDistance.map((e) => ({
    id: e.id,
    type: "odometer",
    date: e.date,
    vehicleId: e.vehicle_id,
    vehicleName: vehicleName(e.vehicle_id),
    created_at: e.created_at,
    odometerReading: e.odometerReading,
    distanceSinceLast: e.distanceSincePrev,
    notes: e.notes,
  }));

  const fuelResult = computeFuelMileage(fillups);
  const mileageByDate = new Map<string, number>();
  fuelResult.cycles.forEach((c) => mileageByDate.set(c.date, c.mileage));

  const fuelHistory: HistoryItem[] = fillups.map((f) => ({
    id: f.id,
    type: "fuel",
    date: f.date,
    vehicleId: f.vehicle_id,
    vehicleName: vehicleName(f.vehicle_id),
    created_at: f.created_at,
    fuelVolume: f.fuelVolume,
    totalCost: f.totalCost,
    fuelPricePerLitre: f.fuelPricePerLitre,
    odometerAtFill: f.odometerAtFill,
    stationName: f.stationName,
    isFullTank: f.isFullTank,
    mileageForCycle: mileageByDate.get(f.date),
  }));

  return [...entryHistory, ...fuelHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

// ---------------------------------------------------------------------------
// Inactivity reminder
// ---------------------------------------------------------------------------

export const inactivityReminderNeeded = (entries: DailyOdometerEntry[]) => {
  if (!entries.length) return true;
  const latest = entries.reduce((a, b) => (new Date(a.date) > new Date(b.date) ? a : b));
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - new Date(latest.date).getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 1;
};
