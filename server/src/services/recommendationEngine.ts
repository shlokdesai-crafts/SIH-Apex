import { query } from '../config/database.js';

export interface CalculateAdvisoryInput {
  crop: string;
  farmArea: number; // in acres
  soilN: number;    // available N in kg/acre
  soilP: number;    // available P in kg/acre
  soilK: number;    // available K in kg/acre
  soilPh: number;   // pH (0 - 14)
  targetYield?: number; // target yield in tonnes/acre (optional)
}

export interface SoilNutrientStatus {
  name: string;
  symbol: string;
  status: 'Low' | 'Moderate' | 'Adequate' | 'High';
  currentVal: number;
  targetVal: number;
  deficitVal: number;
  unit: string;
  interpretation: string;
}

export interface RecommendedFertilizerItem {
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

export interface TimingStep {
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

export interface AdvisoryCalculationResult {
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
    nitrogen: SoilNutrientStatus;
    phosphorus: SoilNutrientStatus;
    potassium: SoilNutrientStatus;
    ph: {
      value: number;
      status: 'Acidic' | 'Optimal' | 'Alkaline';
      description: string;
    };
  };
  nutrientRequirements: {
    nutrient: string;
    symbol: string;
    recommendedRatePerAcre: number;
    currentSoilAvailability: number;
    additionalNeededPerAcre: number;
    totalFarmDeficitKg: number;
    unit: string;
  }[];
  recommendedFertilizers: RecommendedFertilizerItem[];
  applicationTiming: TimingStep[];
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

interface CropProfile {
  name: string;
  defaultYield: number; // tonnes/acre
  yieldUnit: string;
  targetN: number;      // kg/acre baseline
  targetP: number;      // kg/acre baseline
  targetK: number;      // kg/acre baseline
  thresholds: {
    n: { low: number; high: number };
    p: { low: number; high: number };
    k: { low: number; high: number };
  };
  defaultStage: string;
}

const CROP_PROFILES: Record<string, CropProfile> = {
  tomato: {
    name: 'Tomato (Solanum lycopersicum)',
    defaultYield: 25.0,
    yieldUnit: 'Tonnes / Acre',
    targetN: 60.0,
    targetP: 25.0,
    targetK: 40.0,
    thresholds: {
      n: { low: 35, high: 55 },
      p: { low: 15, high: 28 },
      k: { low: 25, high: 45 },
    },
    defaultStage: 'Flowering & Fruit Development',
  },
  cotton: {
    name: 'Cotton (Gossypium hirsutum)',
    defaultYield: 1.5,
    yieldUnit: 'Tonnes / Acre',
    targetN: 48.0,
    targetP: 24.0,
    targetK: 24.0,
    thresholds: {
      n: { low: 30, high: 50 },
      p: { low: 12, high: 25 },
      k: { low: 20, high: 40 },
    },
    defaultStage: 'Square & Boll Formation',
  },
  soybean: {
    name: 'Soybean (Glycine max)',
    defaultYield: 1.2,
    yieldUnit: 'Tonnes / Acre',
    targetN: 15.0, // legume fixates N
    targetP: 30.0,
    targetK: 20.0,
    thresholds: {
      n: { low: 25, high: 45 },
      p: { low: 15, high: 30 },
      k: { low: 20, high: 40 },
    },
    defaultStage: 'Pod Initiation',
  },
  sugarcane: {
    name: 'Sugarcane (Saccharum officinarum)',
    defaultYield: 45.0,
    yieldUnit: 'Tonnes / Acre',
    targetN: 100.0,
    targetP: 45.0,
    targetK: 60.0,
    thresholds: {
      n: { low: 40, high: 75 },
      p: { low: 20, high: 35 },
      k: { low: 30, high: 55 },
    },
    defaultStage: 'Tillering & Grand Growth',
  },
  default: {
    name: 'Standard Field Crop',
    defaultYield: 20.0,
    yieldUnit: 'Tonnes / Acre',
    targetN: 50.0,
    targetP: 25.0,
    targetK: 35.0,
    thresholds: {
      n: { low: 30, high: 50 },
      p: { low: 15, high: 30 },
      k: { low: 25, high: 45 },
    },
    defaultStage: 'Active Vegetative Stage',
  },
};

/**
 * Evaluates categorical nutrient status (Low, Moderate, Adequate, High)
 */
function evaluateNutrientStatus(
  current: number,
  target: number,
  thresholds: { low: number; high: number },
  nutrientName: string,
  unit: string
): SoilNutrientStatus {
  let status: 'Low' | 'Moderate' | 'Adequate' | 'High';
  let interpretation: string;

  if (current < thresholds.low) {
    status = 'Low';
    interpretation = `Critical deficiency of ${nutrientName}. Targeted supplementary application is required to avoid yield depression.`;
  } else if (current < target) {
    status = 'Moderate';
    interpretation = `Sub-optimal ${nutrientName} level. Maintenance and booster doses recommended for optimal canopy and fruit formation.`;
  } else if (current <= thresholds.high) {
    status = 'Adequate';
    interpretation = `Optimal ${nutrientName} range. Recommended maintenance dose will sustain healthy soil reserves.`;
  } else {
    status = 'High';
    interpretation = `Abundant ${nutrientName} in soil. Applications should be reduced to prevent nutrient lock-up or runoff.`;
  }

  const deficitVal = Math.max(0, Math.round((target - current) * 10) / 10);

  return {
    name: nutrientName,
    symbol: nutrientName === 'Nitrogen' ? 'N' : nutrientName === 'Phosphorus' ? 'P' : 'K',
    status,
    currentVal: current,
    targetVal: target,
    deficitVal,
    unit,
    interpretation,
  };
}

/**
 * Evaluates soil pH and provides agronomic interpretation
 */
function evaluateSoilPh(ph: number): {
  value: number;
  status: 'Acidic' | 'Optimal' | 'Alkaline';
  description: string;
} {
  if (ph < 6.0) {
    return {
      value: ph,
      status: 'Acidic',
      description: 'Acidic soil slows beneficial microbial nitrification and causes phosphorus fixation with aluminum/iron. Agricultural lime application recommended.',
    };
  } else if (ph <= 7.6) {
    return {
      value: ph,
      status: 'Optimal',
      description: 'Neutral and optimal pH band for maximum bioavailability of primary (N, P, K) and micronutrients.',
    };
  } else {
    return {
      value: ph,
      status: 'Alkaline',
      description: 'Alkaline/calcareous soil limits phosphorus solubility and induces Zinc/Iron micronutrient deficiency. Single Super Phosphate (SSP) or elemental sulphur recommended.',
    };
  }
}

/**
 * Calculates STCR / nutrient demand based on soil test and target yield
 */
export async function calculateFertilizerAdvisory(
  input: CalculateAdvisoryInput
): Promise<AdvisoryCalculationResult> {
  const cropKey = input.crop.trim().toLowerCase();
  const profile = CROP_PROFILES[cropKey] || CROP_PROFILES['default'];
  const farmArea = Math.max(0.1, Number(input.farmArea) || 1.0);
  const targetYield = Number(input.targetYield) && Number(input.targetYield) > 0 
    ? Number(input.targetYield) 
    : profile.defaultYield;

  const soilN = Math.max(0, Number(input.soilN) || 0);
  const soilP = Math.max(0, Number(input.soilP) || 0);
  const soilK = Math.max(0, Number(input.soilK) || 0);
  const soilPh = Number(input.soilPh) || 7.0;

  // 1. STCR-aligned Target Nutrient Requirements scaled by yield ratio
  const yieldScalingFactor = Math.min(1.5, Math.max(0.7, targetYield / profile.defaultYield));
  const effectiveTargetN = Math.round(profile.targetN * yieldScalingFactor * 10) / 10;
  const effectiveTargetP = Math.round(profile.targetP * yieldScalingFactor * 10) / 10;
  const effectiveTargetK = Math.round(profile.targetK * yieldScalingFactor * 10) / 10;

  // 2. Evaluate soil status
  const nStatus = evaluateNutrientStatus(soilN, effectiveTargetN, profile.thresholds.n, 'Nitrogen', 'kg/acre');
  const pStatus = evaluateNutrientStatus(soilP, effectiveTargetP, profile.thresholds.p, 'Phosphorus', 'kg/acre');
  const kStatus = evaluateNutrientStatus(soilK, effectiveTargetK, profile.thresholds.k, 'Potassium', 'kg/acre');
  const phEval = evaluateSoilPh(soilPh);

  // 3. Additional nutrient requirement per acre and total farm
  const addN = Math.max(20, Math.round(effectiveTargetN - soilN * 0.4));
  const addP = Math.max(15, Math.round(effectiveTargetP - soilP * 0.5));
  const addK = Math.max(15, Math.round(effectiveTargetK - soilK * 0.45));

  const nutrientRequirements = [
    {
      nutrient: 'Nitrogen',
      symbol: 'N',
      recommendedRatePerAcre: effectiveTargetN,
      currentSoilAvailability: soilN,
      additionalNeededPerAcre: addN,
      totalFarmDeficitKg: Math.round(addN * farmArea * 10) / 10,
      unit: 'kg/acre',
    },
    {
      nutrient: 'Phosphorus',
      symbol: 'P',
      recommendedRatePerAcre: effectiveTargetP,
      currentSoilAvailability: soilP,
      additionalNeededPerAcre: addP,
      totalFarmDeficitKg: Math.round(addP * farmArea * 10) / 10,
      unit: 'kg/acre',
    },
    {
      nutrient: 'Potassium',
      symbol: 'K',
      recommendedRatePerAcre: effectiveTargetK,
      currentSoilAvailability: soilK,
      additionalNeededPerAcre: addK,
      totalFarmDeficitKg: Math.round(addK * farmArea * 10) / 10,
      unit: 'kg/acre',
    },
    {
      nutrient: 'Zinc',
      symbol: 'Zn',
      recommendedRatePerAcre: 1.0,
      currentSoilAvailability: 0.3,
      additionalNeededPerAcre: 0.7,
      totalFarmDeficitKg: Math.round(0.7 * farmArea * 10) / 10,
      unit: 'kg/acre',
    },
  ];

  // 4. Fetch available products from PostgreSQL fertilizer_products
  const dbProductsResult = await query(
    `SELECT 
      id, product_code, name, category, formula, composition,
      standard_package_size_kg, package_unit, subsidized_price_inr, mrp_inr,
      badge_text, bag_color_hex, description, is_organic
     FROM fertilizer_products 
     WHERE is_active = TRUE
     ORDER BY is_organic ASC, name ASC`
  );

  const dbProducts = dbProductsResult.rows;
  const findProduct = (code: string) => dbProducts.find((p) => p.product_code === code);

  // 5. Calculate physical fertilizer product rates
  // DAP (18-46-0) supplies all required P: DAP kg = addP / 0.46
  // Standard tomato rate aligns with ~55 kg/acre DAP
  const dapProduct = findProduct('dap');
  const dapRatePerAcre = dapProduct ? Math.round(addP / 0.46) : 55;
  const nSuppliedByDap = dapRatePerAcre * 0.18;

  // Remaining N is supplied by Urea (46% N): Urea kg = (addN - nSuppliedByDap) / 0.46
  const ureaProduct = findProduct('urea');
  const remainingN = Math.max(15, addN - nSuppliedByDap);
  const ureaRatePerAcre = ureaProduct ? Math.round(remainingN / 0.46) : 60;

  // Potassium supplied by MOP (60% K2O): MOP kg = addK / 0.60
  const mopProduct = findProduct('mop');
  const mopRatePerAcre = mopProduct ? Math.round(addK / 0.60) : 35;

  // Micronutrient Zinc Sulphate 21%
  const zincProduct = findProduct('zinc-sulphate');
  const zincRatePerAcre = 2; // 2 kg foliar/drip per acre or 10 kg basal

  // Secondary nutrient: Bentonite Sulphur or MgSO4 if alkaline or tomato
  const secondaryProduct = phEval.status === 'Alkaline' ? findProduct('bentonite-s') : findProduct('mgso4');
  const secondaryRatePerAcre = secondaryProduct ? (secondaryProduct.product_code === 'bentonite-s' ? 10 : 8) : 0;

  const productSelections: {
    dbRow: any;
    ratePerAcre: number;
    role: string;
  }[] = [];

  if (ureaProduct) {
    productSelections.push({
      dbRow: ureaProduct,
      ratePerAcre: ureaRatePerAcre,
      role: 'Vegetative Canopy & Leaf Area Expansion',
    });
  }
  if (dapProduct) {
    productSelections.push({
      dbRow: dapProduct,
      ratePerAcre: dapRatePerAcre,
      role: 'Root Proliferation & Early Bloom Anchorage',
    });
  }
  if (mopProduct) {
    productSelections.push({
      dbRow: mopProduct,
      ratePerAcre: mopRatePerAcre,
      role: 'Fruit Firmness, Sugar Accumulation & Drought Resistance',
    });
  }
  if (zincProduct) {
    productSelections.push({
      dbRow: zincProduct,
      ratePerAcre: zincRatePerAcre,
      role: 'Enzyme Activation & Prevention of Leaf Chlorosis',
    });
  }
  if (secondaryProduct && secondaryRatePerAcre > 0) {
    productSelections.push({
      dbRow: secondaryProduct,
      ratePerAcre: secondaryRatePerAcre,
      role: phEval.status === 'Alkaline' ? 'Soil pH Buffer & Sulphur Supply' : 'Chlorophyll Restoration & Photosynthesis',
    });
  }

  // 6. Build recommended fertilizer response objects
  let totalBagsCount = 0;
  let totalEstimatedCostInr = 0;
  let totalWeightKg = 0;

  const recommendedFertilizers: RecommendedFertilizerItem[] = productSelections.map((item) => {
    const pkgSize = item.dbRow.standard_package_size_kg ? parseFloat(item.dbRow.standard_package_size_kg) : 50;
    const pricePerBag = item.dbRow.subsidized_price_inr ? parseFloat(item.dbRow.subsidized_price_inr) : 0;
    const mrp = item.dbRow.mrp_inr ? parseFloat(item.dbRow.mrp_inr) : pricePerBag;

    const totalQuantityKg = Math.round(item.ratePerAcre * farmArea * 10) / 10;
    const totalBags = Math.ceil(totalQuantityKg / pkgSize);
    const estimatedCostInr = totalBags * pricePerBag;

    totalBagsCount += totalBags;
    totalEstimatedCostInr += estimatedCostInr;
    totalWeightKg += totalQuantityKg;

    return {
      id: item.dbRow.id,
      productCode: item.dbRow.product_code,
      name: item.dbRow.name,
      category: item.dbRow.category,
      formula: item.dbRow.formula || '',
      composition: item.dbRow.composition,
      standardPackageSizeKg: pkgSize,
      packageUnit: item.dbRow.package_unit || 'kg',
      pricePerBagInr: pricePerBag,
      mrpPerBagInr: mrp,
      ratePerAcreKg: item.ratePerAcre,
      totalQuantityKg,
      totalBags,
      estimatedCostInr,
      applicationRole: item.role,
      badge: item.dbRow.badge_text || item.role,
      bagColor: item.dbRow.bag_color_hex || '#1e56a0',
      description: item.dbRow.description || '',
      isOrganic: Boolean(item.dbRow.is_organic),
    };
  });

  // 7. Stage-wise Split Application Timing
  const ureaBasal = Math.round(ureaRatePerAcre * 0.25);
  const ureaVeg = Math.round(ureaRatePerAcre * 0.45);
  const ureaFlowering = ureaRatePerAcre - ureaBasal - ureaVeg;

  const mopBasal = Math.round(mopRatePerAcre * 0.3);
  const mopVeg = Math.round(mopRatePerAcre * 0.3);
  const mopFruit = mopRatePerAcre - mopBasal - mopVeg;

  const applicationTiming: TimingStep[] = [
    {
      step: 1,
      stageName: 'Basal Dose (Transplanting / Field Preparation)',
      timingWindow: 'Day 0 to 7',
      badge: 'Immediate Basal',
      details: 'Incorporate DAP (100%), initial Urea (25%), and MOP (30%) in band placement 5-7 cm away from root zone.',
      fertilizersApplied: [
        { productName: 'DAP (18-46-0)', dosePerAcreKg: dapRatePerAcre, method: 'Band placement near root zone' },
        { productName: 'Urea (46% N)', dosePerAcreKg: ureaBasal, method: 'Soil incorporation' },
        { productName: 'MOP (60% K₂O)', dosePerAcreKg: mopBasal, method: 'Basal application' },
      ],
    },
    {
      step: 2,
      stageName: 'First Top Dressing (Active Vegetative Flush)',
      timingWindow: '15 to 20 Days After Transplanting',
      badge: 'Canopy Boost',
      details: 'Apply second dose of Nitrogen and Potassium to stimulate branching, lush canopy, and sturdy stems.',
      fertilizersApplied: [
        { productName: 'Urea (46% N)', dosePerAcreKg: ureaVeg, method: 'Side-dressing followed by light irrigation' },
        { productName: 'MOP (60% K₂O)', dosePerAcreKg: mopVeg, method: 'Fertigation or ring placement' },
      ],
    },
    {
      step: 3,
      stageName: 'Micronutrient Foliar Correction',
      timingWindow: '25 to 30 Days After Transplanting',
      badge: 'Foliar Health',
      details: 'Foliar spray of Zinc Sulphate (0.5% solution) in the cool morning hours to boost chlorophyll and avoid flower drop.',
      fertilizersApplied: [
        { productName: 'Zinc Sulphate (21% Zn)', dosePerAcreKg: zincRatePerAcre, method: 'Foliar spray with wetting agent' },
      ],
    },
    {
      step: 4,
      stageName: 'Second Top Dressing (Flowering & Fruit Bulking)',
      timingWindow: '40 to 45 Days After Transplanting',
      badge: 'Fruit Set & Brix',
      details: 'Apply final Potassium and Nitrogen split to accelerate fruit enlargement, rind thickness, and sugar translocation.',
      fertilizersApplied: [
        { productName: 'Urea (46% N)', dosePerAcreKg: ureaFlowering, method: 'Fertigation / Drip application' },
        { productName: 'MOP (60% K₂O)', dosePerAcreKg: mopFruit, method: 'Soil drenching / drip' },
      ],
    },
  ];

  // 8. Agronomic Insights
  const agronomicInsights: string[] = [
    nStatus.status === 'Low'
      ? `Soil Nitrogen is low (${soilN} kg/acre vs target ${effectiveTargetN} kg/acre). Splitting Urea across 3 intervals prevents leaching and ensures steady vegetative vigor.`
      : `Soil Nitrogen is at an adequate baseline (${soilN} kg/acre). Maintain targeted application to avoid excessive vegetative growth over flowering.`,
    pStatus.status === 'Low'
      ? `Phosphorus is critically low (${soilP} kg/acre). Full dose of DAP (${dapRatePerAcre} kg/acre) placed basally will anchor secondary feeder roots.`
      : `Phosphorus status is ${pStatus.status.toLowerCase()} (${soilP} kg/acre). DAP application ensures adequate bloom initiation.`,
    `Potassium requirement is ${effectiveTargetK} kg/acre to bolster fruit weight and shelf life. MOP application in split intervals enhances disease resistance.`,
    phEval.description,
  ];

  // 9. Organic Alternatives
  const organicAlternatives = [
    {
      name: 'Bio-Enriched Vermicompost',
      type: 'Soil Conditioner',
      dosage: '2.5 Tonnes / Acre',
      benefit: 'Enhances organic carbon, water retention, and supplies slow-release bio-nitrogen.',
    },
    {
      name: 'Jeevamrutha Microbial Drench',
      type: 'Bio-stimulant',
      dosage: '200 Litres / Acre through drip',
      benefit: 'Stimulates native rhizosphere microbes and accelerates organic phosphorus solubilization.',
    },
    {
      name: 'De-oiled Neem Cake',
      type: 'Nitrification Guard',
      dosage: '150 kg / Acre',
      benefit: 'Suppresses root-knot nematodes and retards nitrification of applied urea.',
    },
  ];

  return {
    inputSummary: {
      crop: input.crop,
      cropDisplayName: profile.name,
      farmAreaAcres: farmArea,
      targetYieldTonnesPerAcre: targetYield,
      soilTest: {
        nitrogenKgPerAcre: soilN,
        phosphorusKgPerAcre: soilP,
        potassiumKgPerAcre: soilK,
        ph: soilPh,
        phInterpretation: phEval.status,
      },
    },
    nutrientStatus: {
      nitrogen: nStatus,
      phosphorus: pStatus,
      potassium: kStatus,
      ph: phEval,
    },
    nutrientRequirements,
    recommendedFertilizers,
    applicationTiming,
    costSummary: {
      totalEstimatedCostInr,
      totalBagsCount,
      totalWeightKg,
      costPerAcreInr: Math.round(totalEstimatedCostInr / farmArea),
    },
    agronomicInsights,
    organicAlternatives,
  };
}
