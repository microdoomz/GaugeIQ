type MileageMap = Record<string, number>;

// Simple illustrative mapping; extend with real-world data later.
export const typicalMileageByModel: MileageMap = {
  "toyota-corolla-2022": 16,
  "honda-civic-2021": 15,
  "tesla-model-3-2024": 0, // EV placeholder
  "maruti-swift-2020": 19,
  "hyundai-creta-2023": 17,
};

export const lookupTypicalMileage = (
  make: string,
  model: string,
  year?: number
): number | undefined => {
  const key = `${make}-${model}-${year ?? ""}`.toLowerCase().replace(/\s+/g, "-");
  return typicalMileageByModel[key];
};
