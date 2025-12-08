import { addDays, endOfMonth, isWithinInterval, startOfMonth, startOfDay, endOfDay } from "date-fns";
import { DailyOdometerEntry, FuelFillUp, HistoryItem, Vehicle } from "./types";

const CO2_FACTORS: Record<string, number> = {
  petrol: 2.3,
  diesel: 2.7,
  default: 2.3,
};

export interface DashboardMetrics {
  totalKm: number;
  totalFuel: number;
  totalCost: number;
  avgMileage: number;
  totalCO2: number;
  bestMileageMonth?: string;
  mostTravelledMonth?: string;
}

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

export const computeFuelMileage = (fillups: FuelFillUp[]) => {
  const sorted = [...fillups].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const cycles: { mileage: number; date: string; fuelVolume: number; distance: number }[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const distance = curr.odometerAtFill - prev.odometerAtFill;
    const fuel = curr.fuelVolume;
    if (fuel > 0 && distance > 0) {
      cycles.push({ mileage: distance / fuel, date: curr.date, fuelVolume: fuel, distance });
    }
  }
  return cycles;
};

export const aggregateMetrics = (
  entries: DailyOdometerEntry[],
  fillups: FuelFillUp[],
  vehicles: Vehicle[]
): DashboardMetrics => {
  // Per-vehicle distance calculations within the provided (already filtered) entries.
  const withDistances = computeDistances(entries);

  const totalKmFromDeltas = withDistances.reduce((sum, e) => sum + (e.distanceSincePrev ?? 0), 0);

  // Fallback: span between oldest and newest odometer per vehicle (entries), summed across vehicles.
  const byVehicle = new Map<string, number[]>();
  entries.forEach((e) => {
    byVehicle.set(e.vehicle_id, [...(byVehicle.get(e.vehicle_id) ?? []), e.odometerReading]);
  });
  const spanKmFromEntries = Array.from(byVehicle.values()).reduce((sum, readings) => {
    if (readings.length < 2) return sum;
    return sum + (Math.max(...readings) - Math.min(...readings));
  }, 0);

  // Additional fallback: use fuel fill-up odometerAtFill spans per vehicle if entries are sparse.
  const byVehicleFill = new Map<string, number[]>();
  fillups.forEach((f) => {
    if (typeof f.odometerAtFill === "number") {
      byVehicleFill.set(f.vehicle_id, [...(byVehicleFill.get(f.vehicle_id) ?? []), f.odometerAtFill]);
    }
  });
  const spanKmFromFillups = Array.from(byVehicleFill.values()).reduce((sum, readings) => {
    if (readings.length < 2) return sum;
    return sum + (Math.max(...readings) - Math.min(...readings));
  }, 0);

  // Combined span using both entry odometers and fill-up odometers per vehicle.
  const byVehicleAllOdo = new Map<string, number[]>();
  entries.forEach((e) => {
    byVehicleAllOdo.set(e.vehicle_id, [...(byVehicleAllOdo.get(e.vehicle_id) ?? []), e.odometerReading]);
  });
  fillups.forEach((f) => {
    if (typeof f.odometerAtFill === "number") {
      byVehicleAllOdo.set(f.vehicle_id, [...(byVehicleAllOdo.get(f.vehicle_id) ?? []), f.odometerAtFill]);
    }
  });
  const spanKmCombined = Array.from(byVehicleAllOdo.values()).reduce((sum, readings) => {
    if (readings.length < 2) return sum;
    return sum + (Math.max(...readings) - Math.min(...readings));
  }, 0);

  const totalKm = Math.max(totalKmFromDeltas, spanKmFromEntries, spanKmFromFillups, spanKmCombined);
  const totalFuel = fillups.reduce((sum, f) => sum + f.fuelVolume, 0);
  const totalCost = fillups.reduce((sum, f) => sum + f.totalCost, 0);

  const cycles = computeFuelMileage(fillups);
  const avgMileage = cycles.length
    ? cycles.reduce((sum, c) => sum + c.mileage, 0) / cycles.length
    : 0;

  const totalCO2 = fillups.reduce((sum, f) => {
    const veh = vehicles.find((v) => v.id === f.vehicle_id);
    const factor = CO2_FACTORS[veh?.fuelType ?? "default"] ?? CO2_FACTORS.default;
    return sum + f.fuelVolume * factor;
  }, 0);

  const monthMileage = new Map<string, { distance: number; fuel: number }>();
  fillups.forEach((f) => {
    const month = f.date.slice(0, 7); // YYYY-MM
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

  return { totalKm, totalFuel, totalCost, avgMileage, totalCO2, bestMileageMonth, mostTravelledMonth };
};

export const filterByRange = <T extends { date: string }>(items: T[], from: Date, to: Date) => {
  const start = startOfDay(from);
  const end = endOfDay(to);
  return items.filter((i) => {
    const d = new Date(i.date);
    return isWithinInterval(d, { start, end });
  });
};

export const projectedRange = (avgMileage: number, fuelLitres: number, avgDailyDistance: number) => {
  const km = fuelLitres * avgMileage;
  const days = avgDailyDistance > 0 ? km / avgDailyDistance : 0;
  return { km: Number(km.toFixed(1)), days: Math.round(days) };
};

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

  const mileageCycles = computeFuelMileage(fillups);
  const mileageByDate = new Map<string, number>();
  mileageCycles.forEach((c) => mileageByDate.set(c.date, c.mileage));

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
    mileageForCycle: mileageByDate.get(f.date),
  }));

  return [...entryHistory, ...fuelHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

export const inactivityReminderNeeded = (entries: DailyOdometerEntry[]) => {
  if (!entries.length) return true;
  const latest = entries.reduce((a, b) => (new Date(a.date) > new Date(b.date) ? a : b));
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - new Date(latest.date).getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 1;
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
