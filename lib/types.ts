export type VehicleType = "car" | "scooter" | "bike" | "truck" | "van" | "ev" | "other";
export type FuelType = "petrol" | "diesel" | "cng" | "ev" | "hybrid" | "other";

export interface Vehicle {
  id: string;
  user_id: string;
  vehicleType: VehicleType;
  make: string;
  model: string;
  variant?: string | null;
  year: number;
  fuelType: FuelType;
  typicalMileage?: number | null;
  created_at: string;
}

export interface DailyOdometerEntry {
  id: string;
  user_id: string;
  vehicle_id: string;
  date: string;
  odometerReading: number;
  notes?: string | null;
  created_at: string;
}

export interface FuelFillUp {
  id: string;
  user_id: string;
  vehicle_id: string;
  date: string;
  odometerAtFill: number;
  fuelVolume: number;
  totalCost: number;
  fuelPricePerLitre?: number | null;
  stationName?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface UserPreferences {
  currency: string;
  distanceUnit: "km" | "mi";
  fuelUnit: "L" | "gal";
  co2Unit?: "kg" | "lb";
  theme?: "light" | "dark";
  remindersEnabled: boolean;
}

export type Timeframe =
  | "today"
  | "7d"
  | "30d"
  | "this-month"
  | "last-month"
  | "all"
  | "custom";

export interface DateRange {
  from: Date;
  to: Date;
}

export interface HistoryItemBase {
  id: string;
  type: "odometer" | "fuel";
  date: string;
  vehicleId: string;
  vehicleName: string;
  created_at: string;
}

export interface HistoryOdometerItem extends HistoryItemBase {
  type: "odometer";
  odometerReading: number;
  distanceSinceLast?: number;
  notes?: string | null;
}

export interface HistoryFuelItem extends HistoryItemBase {
  type: "fuel";
  fuelVolume: number;
  totalCost: number;
  fuelPricePerLitre?: number | null;
  odometerAtFill: number;
  stationName?: string | null;
  mileageForCycle?: number;
}

export type HistoryItem = HistoryOdometerItem | HistoryFuelItem;
