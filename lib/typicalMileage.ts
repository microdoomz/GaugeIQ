type MileageMap = Record<string, number>;
type TankMap = Record<string, number>;

// Simple illustrative mapping; extend with real-world data later.
export const typicalMileageByModel: MileageMap = {
  "toyota-corolla-2022": 16,
  "honda-civic-2021": 15,
  "tesla-model-3-2024": 0, // EV placeholder
  "maruti-swift-2020": 19,
  "hyundai-creta-2023": 17,
};

// Typical tank capacity in litres by make-model-year.
export const typicalTankCapacityByModel: TankMap = {
  "toyota-corolla-2022": 50,
  "honda-civic-2021": 47,
  "tesla-model-3-2024": 0, // EV placeholder
  "maruti-swift-2020": 37,
  "hyundai-creta-2023": 50,
};

const buildKey = (make: string, model: string, year?: number) =>
  `${make}-${model}-${year ?? ""}`.toLowerCase().replace(/\s+/g, "-");

export const lookupTypicalMileage = (
  make: string,
  model: string,
  year?: number
): number | undefined => {
  return typicalMileageByModel[buildKey(make, model, year)];
};

export const lookupTypicalTankCapacity = (
  make: string,
  model: string,
  year?: number
): number | undefined => {
  return typicalTankCapacityByModel[buildKey(make, model, year)];
};
