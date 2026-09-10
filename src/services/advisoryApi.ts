/**
 * Fertilizer Recommendation & Precision Advisory API Client
 */

export interface CalculateAdvisoryParams {
  crop: string;
  farmArea: number;
  soilN: number;
  soilP: number;
  soilK: number;
  soilPh: number;
  targetYield?: number;
}

export interface ApiSoilNutrientStatus {
  name: string;
  symbol: string;
  status: 'Low' | 'Moderate' | 'Adequate' | 'High';
  currentVal: number;
  targetVal: number;
  deficitVal: number;
  unit: string;
  interpretation: string;
}

export interface ApiRecommendedFertilizer {
  id: string;
  productCode: string;
  name: string;
  category: string;
  formula: string;
  composition: string;
  standardPackageSizeKg: number;
  packageUnit: string;
  pricePerBagInr: number;
  mrpPerBagInr: number;
  ratePerAcreKg: number;
  totalQuantityKg: number;
  totalBags: number;
  estimatedCostInr: number;
  applicationRole: string;
  badge: string;
  bagColor: string;
  description: string;
  isOrganic: boolean;
}

export interface ApiTimingStep {
  step: number;
  stageName: string;
  timingWindow: string;
  badge: string;
  details: string;
  fertilizersApplied: {
    productName: string;
    dosePerAcreKg: number;
    method: string;
  }[];
}

export interface ApiNutrientRequirement {
  nutrient: string;
  symbol: string;
  recommendedRatePerAcre: number;
  currentSoilAvailability: number;
  additionalNeededPerAcre: number;
  totalFarmDeficitKg: number;
  unit: string;
}

export interface ApiAdvisoryCalculationData {
  inputSummary: {
    crop: string;
    cropDisplayName: string;
    farmAreaAcres: number;
    targetYieldTonnesPerAcre: number;
    soilTest: {
      nitrogenKgPerAcre: number;
      phosphorusKgPerAcre: number;
      potassiumKgPerAcre: number;
      ph: number;
      phInterpretation: string;
    };
  };
  nutrientStatus: {
    nitrogen: ApiSoilNutrientStatus;
    phosphorus: ApiSoilNutrientStatus;
    potassium: ApiSoilNutrientStatus;
    ph: {
      value: number;
      status: 'Acidic' | 'Optimal' | 'Alkaline';
      description: string;
    };
  };
  nutrientRequirements: ApiNutrientRequirement[];
  recommendedFertilizers: ApiRecommendedFertilizer[];
  applicationTiming: ApiTimingStep[];
  costSummary: {
    totalEstimatedCostInr: number;
    totalBagsCount: number;
    totalWeightKg: number;
    costPerAcreInr: number;
  };
  agronomicInsights: string[];
  organicAlternatives: {
    name: string;
    type: string;
    dosage: string;
    benefit: string;
  }[];
}

export interface ApiAdvisoryResponse {
  status: 'success' | 'error';
  message?: string;
  data?: ApiAdvisoryCalculationData;
  error?: string;
}

/**
 * Calls POST /api/advisories/calculate with graceful host fallback
 */
export async function calculateAdvisory(
  params: CalculateAdvisoryParams
): Promise<ApiAdvisoryCalculationData> {
  let response: Response;
  const body = JSON.stringify(params);

  try {
    response = await fetch('/api/advisories/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  } catch {
    // Direct dev fallback if proxy is bypassed
    response = await fetch('http://localhost:5000/api/advisories/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Calculation API failed with status ${response.status}: ${errorText}`);
  }

  const json: ApiAdvisoryResponse = await response.json();
  if (json.status !== 'success' || !json.data) {
    throw new Error(json.message || 'Advisory API returned unsuccessful status');
  }

  return json.data;
}

export interface FarmerContextData {
  farmer: {
    id: string;
    fullName: string;
    phoneNumber: string;
    email?: string;
    preferredLanguage: string;
    state: string;
    district: string;
    taluka?: string;
    village?: string;
    avatarUrl?: string;
  };
  farm: {
    id: string;
    farmerId: string;
    farmName: string;
    totalArea: number;
    areaUnit: string;
    soilType?: string;
    irrigationType?: string;
    latitude?: number | null;
    longitude?: number | null;
    surveyNumber?: string;
  } | null;
  cropCycle: {
    id: string;
    farmId: string;
    cropId: string;
    cropName: string;
    variety?: string;
    season: string;
    sowingDate: string;
    expectedHarvestDate?: string;
    currentStage: string;
    stageDayCount: number;
    totalCycleDays: number;
    allocatedAcres: number;
    status: string;
    healthScore: number;
    todayAdvice?: string;
  } | null;
  soilTest: {
    id: string;
    farmId: string;
    sampleId: string;
    testingLabName: string;
    testedBy?: string;
    sampleDate: string;
    status: string;
    nitrogenVal: number;
    nitrogenStatus: string;
    nitrogenTarget: number;
    phosphorusVal: number;
    phosphorusStatus: string;
    phosphorusTarget: number;
    potassiumVal: number;
    potassiumStatus: string;
    potassiumTarget: number;
    phVal: number;
    phLabel: string;
    organicCarbonPercent: number;
    organicCarbonStatus: string;
    electricalConductivityDsM?: number | null;
    zincStatus?: string;
    ironStatus?: string;
    micronutrientsSummary?: string;
    healthIndexScore?: number;
    reportPdfUrl?: string;
    remarks?: string;
  } | null;
}

export interface ApiFarmerContextResponse {
  status: 'success' | 'error';
  message?: string;
  data?: FarmerContextData;
  error?: string;
}

/**
 * Fetches the active farmer profile, farm parcel, crop cycle, and latest certified soil test
 */
export async function fetchFarmerAdvisoryContext(cropId?: string): Promise<FarmerContextData | null> {
  const queryParam = cropId ? `?crop=${encodeURIComponent(cropId)}` : '';
  let response: Response;

  try {
    response = await fetch(`/api/advisories/context${queryParam}`);
  } catch {
    response = await fetch(`http://localhost:5000/api/advisories/context${queryParam}`);
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch advisory context: HTTP ${response.status}`);
  }

  const json: ApiFarmerContextResponse = await response.json();
  if (json.status !== 'success' || !json.data) {
    return null;
  }

  return json.data;
}

