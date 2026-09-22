import { query } from '../config/database.js';
import { 
  getCropProfile, 
  normalizeCropName, 
  getCropDisplayName,
  type CropProfileData, 
  type CropSourceMetadata 
} from './cropDataProvider.js';
import { getHfAdvisoryEvidence } from './hfAdvisoryLookup.js';
import type { HfAdvisoryEvidence } from './hfAdvisoryEvidence.js';

export interface CalculateAdvisoryInput {
  crop: string;
  state?: string;
  district?: string;
  farmArea: number; // in acres
  soilN: number;    // available elemental N in kg/acre
  soilP: number;    // available elemental P in kg/acre (Olsen P / Bray P)
  soilK: number;    // available elemental K in kg/acre (NH4OAc extractable K)
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
  // Explicit chemical distinction:
  chemicalForm?: string;
  oxideEquivalent?: {
    name: string;
    symbol: string;
    currentVal: number;
    targetVal: number;
    unit: string;
  };
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

export interface NutrientRequirementItem {
  nutrient: string;
  symbol: string;
  recommendedRatePerAcre: number;
  currentSoilAvailability: number;
  additionalNeededPerAcre: number;
  totalFarmDeficitKg: number;
  unit: string;
  chemicalForm?: string;
}

export interface AdvisoryCalculationResult {
  isAvailable?: boolean;
  sourceMetadata?: CropSourceMetadata;
  hfEvidence?: HfAdvisoryEvidence[];
  inputSummary: {
    crop: string;
    state?: string;
    district?: string;
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
  nutrientRequirements: NutrientRequirementItem[];
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

// Stoichiometric conversion factors
const P_TO_P2O5 = 141.94452 / 61.94752; // ~2.291367
const K_TO_K2O = 94.196 / 78.1966;       // ~1.204604

/**
 * Evaluates categorical nutrient status (Low, Moderate, Adequate, High)
 * by comparing soil available nutrient against the crop target in the EXACT SAME representation.
 */
function evaluateNutrientStatus(
  current: number,
  target: number,
  thresholds: { low: number; high: number },
  nutrientName: string,
  symbol: string,
  unit: string,
  oxideMultiplier?: number,
  oxideName?: string,
  oxideSymbol?: string
): SoilNutrientStatus {
  let status: 'Low' | 'Moderate' | 'Adequate' | 'High';
  let interpretation: string;

  if (current < thresholds.low) {
    status = 'Low';
    interpretation = `Critical deficiency of available ${nutrientName}. Targeted supplementary application is required to avoid yield depression.`;
  } else if (current < target) {
    status = 'Moderate';
    interpretation = `Sub-optimal available ${nutrientName} reserve. Maintenance and booster doses recommended for optimal growth.`;
  } else if (current <= thresholds.high) {
    status = 'Adequate';
    interpretation = `Optimal available ${nutrientName} range. Recommended maintenance dose will sustain healthy soil reserves.`;
  } else {
    status = 'High';
    interpretation = `Abundant available ${nutrientName} in soil. Supplementary fertilizer should be reduced to prevent nutrient lock-up or runoff.`;
  }

  const deficitVal = Math.max(0, Math.round((target - current) * 10) / 10);

  const result: SoilNutrientStatus = {
    name: nutrientName,
    symbol,
    status,
    currentVal: current,
    targetVal: Math.round(target * 10) / 10,
    deficitVal,
    unit,
    interpretation,
    chemicalForm: symbol === 'N' ? 'Elemental Nitrogen (N)' : symbol === 'P' ? 'Available Elemental P (Olsen)' : 'Available Elemental K (NH₄OAc)',
  };

  if (oxideMultiplier && oxideName && oxideSymbol) {
    result.oxideEquivalent = {
      name: oxideName,
      symbol: oxideSymbol,
      currentVal: Math.round(current * oxideMultiplier * 10) / 10,
      targetVal: Math.round(target * oxideMultiplier * 10) / 10,
      unit,
    };
  }

  return result;
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
      description: `Soil pH is acidic (${ph}). Phosphorus availability and root nodulation may be restricted. Consider agricultural lime or dolomite application.`,
    };
  } else if (ph > 8.0) {
    return {
      value: ph,
      status: 'Alkaline',
      description: `Soil pH is alkaline (${ph}). Calcareous fixation may reduce Zinc, Iron, and Phosphorus uptake. Incorporate organic matter, FYM, and elemental sulphur.`,
    };
  } else {
    return {
      value: ph,
      status: 'Optimal',
      description: `Soil pH is in the optimal neutral range (${ph}) for robust nutrient uptake, microbial activity, and root respiration.`,
    };
  }
}

/**
 * Main Advisory Recommendation Engine
 *
 * CRITICAL UNIT CONSISTENCY RULES:
 * 1. Preserves existing soil-test contract:
 *    - soilN is in elemental N (kg/acre)
 *    - soilP is in available elemental P (kg/acre)
 *    - soilK is in available elemental K (kg/acre)
 *
 * 2. Compares crop requirements in the EXACT SAME representation:
 *    - effectiveTargetN (elemental N) compared directly with soilN
 *    - effectiveTargetP_elemental (elemental P) compared directly with soilP
 *    - effectiveTargetK_elemental (elemental K) compared directly with soilK
 *
 * 3. Never subtracts elemental P from P₂O₅ or elemental K from K₂O.
 * 4. Once elemental deficits are established, converts elemental deficits to
 *    commercial fertilizer oxide requirements (P₂O₅ = P * 2.2914, K₂O = K * 1.2046)
 *    before calculating DAP (46% P₂O₅), SSP (16% P₂O₅), and MOP (60% K₂O).
 */
export async function calculateFertilizerAdvisory(
  input: CalculateAdvisoryInput
): Promise<AdvisoryCalculationResult> {
  const farmArea = Math.max(0.1, Number(input.farmArea) || 1.0);
  const soilN = Number(input.soilN) || 0;
  const soilP = Number(input.soilP) || 0;
  const soilK = Number(input.soilK) || 0;
  const soilPh = Number(input.soilPh) || 7.0;

  const profile = await getCropProfile(input.crop, input.state, input.district);

  const phEval = evaluateSoilPh(soilPh);

  // If crop is unsupported or has no verified agronomic benchmark
  if (!profile) {
    const canonicalKey = normalizeCropName(input.crop);
    const displayName = getCropDisplayName(input.crop);
    const hfEvidence = getHfAdvisoryEvidence(input.crop);

    const sourceMeta: CropSourceMetadata = hfEvidence.length > 0 ? {
      sourceName: 'HindiKrishi Farmer Advisory Dataset (Hugging Face)',
      sourceType: 'Supplementary-Agricultural-Evidence',
      verificationStatus: 'unverified',
      sourceNote: `Supplementary agricultural advisory evidence retrieved for ${displayName} from HindiKrishi dataset. Unverified supplementary evidence; use with local extension officer guidance.`,
      sourceUrl: 'https://huggingface.co/datasets/me-nabi/hindikrishi-farmer-advisory-dataset',
      lastVerified: new Date().toISOString().split('T')[0],
    } : {
      sourceName: 'CropGuard Agronomic Registry',
      sourceType: 'Pending-Field-Verification',
      verificationStatus: 'pending-field-verification',
      sourceNote: `Authoritative benchmark for ${displayName} is currently pending field calibration. Real soil test parameters are preserved.`,
      lastVerified: new Date().toISOString().split('T')[0],
    };

    return {
      isAvailable: false,
      sourceMetadata: sourceMeta,
      hfEvidence,
      inputSummary: {
        crop: canonicalKey,
        state: input.state,
        district: input.district,
        cropDisplayName: displayName,
        farmAreaAcres: farmArea,
        targetYieldTonnesPerAcre: 0,
        soilTest: {
          nitrogenKgPerAcre: soilN,
          phosphorusKgPerAcre: soilP,
          potassiumKgPerAcre: soilK,
          ph: soilPh,
          phInterpretation: phEval.status,
        },
      },
      nutrientStatus: {
        nitrogen: {
          name: 'Nitrogen (N)',
          symbol: 'N',
          status: 'Adequate',
          currentVal: soilN,
          targetVal: 0,
          deficitVal: 0,
          unit: 'kg/acre',
          interpretation: `Actual soil Nitrogen availability is ${soilN} kg/acre. Certified crop benchmark for ${displayName} is pending field verification.`,
        },
        phosphorus: {
          name: 'Phosphorus (P)',
          symbol: 'P',
          status: 'Adequate',
          currentVal: soilP,
          targetVal: 0,
          deficitVal: 0,
          unit: 'kg/acre',
          interpretation: `Actual soil available elemental P is ${soilP} kg/acre (equivalent to ${(soilP * P_TO_P2O5).toFixed(1)} kg/acre P₂O₅). Certified crop benchmark for ${displayName} is pending.`,
        },
        potassium: {
          name: 'Potassium (K)',
          symbol: 'K',
          status: 'Adequate',
          currentVal: soilK,
          targetVal: 0,
          deficitVal: 0,
          unit: 'kg/acre',
          interpretation: `Actual soil available elemental K is ${soilK} kg/acre (equivalent to ${(soilK * K_TO_K2O).toFixed(1)} kg/acre K₂O). Certified crop benchmark for ${displayName} is pending.`,
        },
        ph: phEval,
      },
      nutrientRequirements: [],
      recommendedFertilizers: [],
      applicationTiming: [],
      costSummary: {
        totalEstimatedCostInr: 0,
        totalBagsCount: 0,
        totalWeightKg: 0,
        costPerAcreInr: 0,
      },
      agronomicInsights: [
        ...(hfEvidence.length > 0
          ? [
              `Hugging Face agricultural advisory evidence available for ${displayName} (HindiKrishi Dataset):`,
              ...hfEvidence.slice(0, 3).map(
                (item) => `• ${item.advisory}`
              ),
              'Notice: This agricultural evidence is supplementary and unverified. Do not use as a definitive chemical prescription without local field verification.',
            ]
          : [
              `Crop-specific fertilizer benchmarks are currently unavailable for "${displayName}".`,
              `Advisory benchmark data is pending field calibration.`,
              `To avoid chemical burning, salinity stress, or fertilizer misapplication, fabricated dosages are not displayed.`,
              `Please consult your local Krishi Vigyan Kendra (KVK) or Block Agriculture Officer for certified recommendations for ${displayName}.`,
            ]),
        `Your certified soil test parameters (N: ${soilN} kg/ac, P: ${soilP} kg/ac, K: ${soilK} kg/ac, pH: ${soilPh}) are preserved above.`,
      ],
      organicAlternatives: [],
    };
  }

  // 1. Scaled crop targets based on user target yield
  const targetYield = Number(input.targetYield) && Number(input.targetYield) > 0 
    ? Number(input.targetYield) 
    : profile.defaultYield;

  const yieldScalingFactor = Math.min(1.5, Math.max(0.7, targetYield / profile.defaultYield));

  // Elemental targets (in kg/acre) - used for direct comparison with soil test
  const effectiveTargetN = profile.targetN * yieldScalingFactor;
  const effectiveTargetP_elemental = profile.targetP * yieldScalingFactor;
  const effectiveTargetK_elemental = profile.targetK * yieldScalingFactor;

  // Commercial oxide targets (in kg/acre) - used for fertilizer dosing
  const effectiveTargetP2O5 = profile.targetP2O5 * yieldScalingFactor;
  const effectiveTargetK2O = profile.targetK2O * yieldScalingFactor;

  // 2. Evaluate soil status comparing elemental soil test against elemental crop targets
  const nStatus = evaluateNutrientStatus(
    soilN,
    effectiveTargetN,
    profile.thresholds.n,
    'Nitrogen (N)',
    'N',
    'kg/acre'
  );

  const pStatus = evaluateNutrientStatus(
    soilP,
    effectiveTargetP_elemental,
    profile.thresholds.p,
    'Phosphorus (P)',
    'P',
    'kg/acre',
    P_TO_P2O5,
    'Phosphate Equivalent',
    'P₂O₅'
  );

  const kStatus = evaluateNutrientStatus(
    soilK,
    effectiveTargetK_elemental,
    profile.thresholds.k,
    'Potassium (K)',
    'K',
    'kg/acre',
    K_TO_K2O,
    'Potash Equivalent',
    'K₂O'
  );

  // 3. Deficit calculation:
  // Strictly compare elemental to elemental:
  const deficitN_elemental = Math.max(0, effectiveTargetN - soilN);
  const deficitP_elemental = Math.max(0, effectiveTargetP_elemental - soilP);
  const deficitK_elemental = Math.max(0, effectiveTargetK_elemental - soilK);

  // Agronomic buffer for fertilizer application (efficiency factors: N ~60%, P ~20-25% immediate, K ~50-60%)
  const addN = Math.round(deficitN_elemental * 0.60 * 10) / 10;
  const addP_elemental = Math.round(deficitP_elemental * 0.50 * 10) / 10;
  const addK_elemental = Math.round(deficitK_elemental * 0.55 * 10) / 10;

  // Convert elemental deficits to commercial oxide requirements for fertilizer calculation:
  // P₂O₅ = P * 2.291367
  // K₂O = K * 1.204604
  const neededP2O5 = Math.round(addP_elemental * P_TO_P2O5 * 10) / 10;
  const neededK2O = Math.round(addK_elemental * K_TO_K2O * 10) / 10;

  // Explicitly distinguish elemental P vs P₂O₅ and elemental K vs K₂O
  const nutrientRequirements: NutrientRequirementItem[] = [
    {
      nutrient: 'Nitrogen (N)',
      symbol: 'N',
      recommendedRatePerAcre: Math.round(effectiveTargetN * 10) / 10,
      currentSoilAvailability: soilN,
      additionalNeededPerAcre: addN,
      totalFarmDeficitKg: Math.round(addN * farmArea * 10) / 10,
      unit: 'kg/acre',
      chemicalForm: 'Elemental Nitrogen (N)',
    },
    {
      nutrient: 'Phosphorus (P)',
      symbol: 'P',
      recommendedRatePerAcre: Math.round(effectiveTargetP_elemental * 10) / 10,
      currentSoilAvailability: soilP,
      additionalNeededPerAcre: addP_elemental,
      totalFarmDeficitKg: Math.round(addP_elemental * farmArea * 10) / 10,
      unit: 'kg/acre',
      chemicalForm: 'Available Elemental P (Soil Test form)',
    },
    {
      nutrient: 'Phosphate Equivalent (P₂O₅)',
      symbol: 'P₂O₅',
      recommendedRatePerAcre: Math.round(effectiveTargetP2O5 * 10) / 10,
      currentSoilAvailability: Math.round(soilP * P_TO_P2O5 * 10) / 10,
      additionalNeededPerAcre: neededP2O5,
      totalFarmDeficitKg: Math.round(neededP2O5 * farmArea * 10) / 10,
      unit: 'kg/acre',
      chemicalForm: 'Phosphate Oxide (P₂O₅ = P × 2.291)',
    },
    {
      nutrient: 'Potassium (K)',
      symbol: 'K',
      recommendedRatePerAcre: Math.round(effectiveTargetK_elemental * 10) / 10,
      currentSoilAvailability: soilK,
      additionalNeededPerAcre: addK_elemental,
      totalFarmDeficitKg: Math.round(addK_elemental * farmArea * 10) / 10,
      unit: 'kg/acre',
      chemicalForm: 'Available Elemental K (Soil Test form)',
    },
    {
      nutrient: 'Potash Equivalent (K₂O)',
      symbol: 'K₂O',
      recommendedRatePerAcre: Math.round(effectiveTargetK2O * 10) / 10,
      currentSoilAvailability: Math.round(soilK * K_TO_K2O * 10) / 10,
      additionalNeededPerAcre: neededK2O,
      totalFarmDeficitKg: Math.round(neededK2O * farmArea * 10) / 10,
      unit: 'kg/acre',
      chemicalForm: 'Potash Oxide (K₂O = K × 1.205)',
    },
  ];

  // Micronutrients check
  const strategy = profile.fertilizerStrategy || { products: ['urea', 'dap', 'mop'] };
  const strategyProducts = strategy.products ?? ['urea', 'dap', 'mop'];
  const requiresZinc = strategyProducts.includes('zinc-sulphate') || 
    (strategy.micronutrients ?? []).includes('zinc-sulphate');

  if (requiresZinc) {
    nutrientRequirements.push({
      nutrient: 'Zinc (Zn)',
      symbol: 'Zn',
      recommendedRatePerAcre: 1.0,
      currentSoilAvailability: 0.3,
      additionalNeededPerAcre: 0.7,
      totalFarmDeficitKg: Math.round(0.7 * farmArea * 10) / 10,
      unit: 'kg/acre',
      chemicalForm: 'Elemental Micronutrient (Zn)',
    });
  }

  // 4. Fetch available products from PostgreSQL fertilizer_products
  let dbProducts: any[] = [];
  try {
    const dbProductsResult = await query(
      `SELECT 
        id, product_code, name, category, formula, composition,
        standard_package_size_kg, package_unit, subsidized_price_inr, mrp_inr,
        badge_text, bag_color_hex, description, is_organic
       FROM fertilizer_products 
       WHERE is_active = TRUE
       ORDER BY is_organic ASC, name ASC`
    );
    dbProducts = dbProductsResult.rows;
  } catch (dbErr) {
    console.warn('[recommendationEngine] PostgreSQL fertilizer_products query failed, using built-in catalog:', dbErr);
  }

  const findProduct = (code: string) => {
    const row = dbProducts.find((p) => p.product_code === code);
    if (row) return row;
    const fallbacks: Record<string, any> = {
      urea: { id: 'urea', product_code: 'urea', name: 'Urea (46% N)', category: 'Nitrogenous', formula: 'CO(NH₂)₂', composition: '46% Nitrogen (N)', standard_package_size_kg: 50, package_unit: 'kg', subsidized_price_inr: 266.5, mrp_inr: 266.5, badge_text: 'Vegetative Canopy Flush', bag_color_hex: '#1e56a0', description: 'Primary nitrogen driver for canopy development.', is_organic: false },
      dap: { id: 'dap', product_code: 'dap', name: 'Di-Ammonium Phosphate (DAP)', category: 'Phosphatic', formula: '(NH₄)₂HPO₄', composition: '18% N, 46% P₂O₅', standard_package_size_kg: 50, package_unit: 'kg', subsidized_price_inr: 1350, mrp_inr: 1350, badge_text: 'Root Anchor & Flower Initiation', bag_color_hex: '#e67e22', description: 'Concentrated water-soluble phosphorus supplement.', is_organic: false },
      mop: { id: 'mop', product_code: 'mop', name: 'Muriate of Potash (MOP)', category: 'Potassic', formula: 'KCl', composition: '60% K₂O', standard_package_size_kg: 50, package_unit: 'kg', subsidized_price_inr: 1700, mrp_inr: 1750, badge_text: 'Grain Boldness & Fruit Brix', bag_color_hex: '#c0392b', description: 'High-potassium fertilizer enhancing disease immunity.', is_organic: false },
      ssp: { id: 'ssp', product_code: 'ssp', name: 'Single Super Phosphate (SSP)', category: 'Phosphatic', formula: 'Ca(H₂PO₄)₂ + CaSO₄', composition: '16% P₂O₅, 11% S, 19% Ca', standard_package_size_kg: 50, package_unit: 'kg', subsidized_price_inr: 425, mrp_inr: 475, badge_text: 'Boll Architecture & Sulphur', bag_color_hex: '#d35400', description: 'Provides phosphorus and sulphate sulphur.', is_organic: false },
      'zinc-sulphate': { id: 'zinc-sulphate', product_code: 'zinc-sulphate', name: 'Zinc Sulphate 21% (ZnSO₄)', category: 'Micronutrient', formula: 'ZnSO₄·7H₂O', composition: '21% Zn, 10% S', standard_package_size_kg: 10, package_unit: 'kg', subsidized_price_inr: 320, mrp_inr: 380, badge_text: 'Khaira & Enzyme Activator', bag_color_hex: '#16a085', description: 'Essential micronutrient preventing chlorosis.', is_organic: false },
    };
    return fallbacks[code] || null;
  };

  const productSelections: { dbRow: any; ratePerAcre: number; role: string }[] = [];
  const addProduct = (code: string, ratePerAcre: number, role: string) => {
    const dbRow = findProduct(code);
    if (dbRow && ratePerAcre > 0) productSelections.push({ dbRow, ratePerAcre, role });
  };

  // 5. Fertilizer Dosing using exact commercial nutrient percentages
  const usesSsp = strategyProducts.includes('ssp');
  const usesDap = strategyProducts.includes('dap');

  let dapRatePerAcre = 0;
  let sspRatePerAcre = 0;

  // Calculate Phosphatic fertilizer dosage based on needed P₂O₅ (NOT elemental P)
  if (usesSsp) {
    // SSP supplies 16% P₂O₅
    sspRatePerAcre = neededP2O5 > 0 ? Math.max(25, Math.round(neededP2O5 / 0.16)) : (effectiveTargetP2O5 > 0 ? 25 : 0);
    addProduct('ssp', sspRatePerAcre, 'Phosphorus (16% P₂O₅), sulphate sulphur (11% S), and calcium for root nodules and seed development');
  } else if (usesDap) {
    // DAP supplies 46% P₂O₅
    dapRatePerAcre = neededP2O5 > 0 ? Math.max(25, Math.round(neededP2O5 / 0.46)) : (effectiveTargetP2O5 > 0 ? 25 : 0);
    addProduct('dap', dapRatePerAcre, 'Water-soluble phosphate (46% P₂O₅) for rapid root network establishment and floral initiation');
  }

  // Calculate Nitrogenous fertilizer dosage (Urea 46% N), subtracting N supplied by DAP (18% N)
  if (strategyProducts.includes('urea')) {
    const nSuppliedByDap = dapRatePerAcre * 0.18; // DAP provides 18% elemental N
    const remainingN = Math.max(0, addN - nSuppliedByDap);
    const ureaRate = remainingN > 0 ? Math.max(20, Math.round(remainingN / 0.46)) : 0;
    if (ureaRate > 0) {
      addProduct('urea', ureaRate, 'Direct nitrogen (46% N) for rapid canopy vegetative flush and protein synthesis');
    }
  }

  // Calculate Potassic fertilizer dosage (MOP 60% K₂O) based on needed K₂O
  if (strategyProducts.includes('mop')) {
    const mopRate = neededK2O > 0 ? Math.max(15, Math.round(neededK2O / 0.60)) : (effectiveTargetK2O > 0 ? 15 : 0);
    if (mopRate > 0) {
      addProduct('mop', mopRate, 'Potash (60% K₂O) for cellular turgor, water efficiency, disease immunity, and fruit bulking');
    }
  }

  // Micronutrient supplementation (Zinc Sulphate 21% Zn)
  if (requiresZinc) {
    addProduct('zinc-sulphate', 2, 'Zinc micronutrient (21% Zn) preventing interveinal chlorosis and enzyme activation');
  }

  // Secondary/specialty products explicitly listed in strategy
  for (const code of strategyProducts) {
    if (!['urea', 'dap', 'ssp', 'mop', 'zinc-sulphate'].includes(code)) {
      addProduct(code, 10, 'Crop-specific secondary or organic nutrient supplement');
    }
  }

  // 6. Build final recommended items
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

  const ureaRatePerAcre = productSelections.find((x) => x.dbRow.product_code === 'urea')?.ratePerAcre ?? 0;
  const mopRatePerAcre = productSelections.find((x) => x.dbRow.product_code === 'mop')?.ratePerAcre ?? 0;
  const zincRatePerAcre = productSelections.find((x) => x.dbRow.product_code === 'zinc-sulphate')?.ratePerAcre ?? 0;

  // 7. Stage-wise Split Application Timing tailored to crop
  const ureaBasal = Math.round(ureaRatePerAcre * 0.25);
  const ureaVeg = Math.round(ureaRatePerAcre * 0.45);
  const ureaFlowering = Math.max(0, ureaRatePerAcre - ureaBasal - ureaVeg);

  const mopBasal = Math.round(mopRatePerAcre * 0.35);
  const mopVeg = Math.round(mopRatePerAcre * 0.35);
  const mopFruit = Math.max(0, mopRatePerAcre - mopBasal - mopVeg);

  const basalFertilizers: { productName: string; dosePerAcreKg: number; method: string }[] = [];
  if (dapRatePerAcre > 0) {
    basalFertilizers.push({ productName: 'DAP (18% N, 46% P₂O₅)', dosePerAcreKg: dapRatePerAcre, method: 'Band placement 5 cm below seed level' });
  }
  if (sspRatePerAcre > 0) {
    basalFertilizers.push({ productName: 'SSP (16% P₂O₅, 11% S)', dosePerAcreKg: sspRatePerAcre, method: 'Soil incorporation during land preparation' });
  }
  if (ureaBasal > 0) {
    basalFertilizers.push({ productName: 'Urea (46% N)', dosePerAcreKg: ureaBasal, method: 'Basal broadcasting followed by shallow harrowing' });
  }
  if (mopBasal > 0) {
    basalFertilizers.push({ productName: 'MOP (60% K₂O)', dosePerAcreKg: mopBasal, method: 'Basal soil placement' });
  }

  const vegFertilizers: { productName: string; dosePerAcreKg: number; method: string }[] = [];
  if (ureaVeg > 0) {
    vegFertilizers.push({ productName: 'Urea (46% N)', dosePerAcreKg: ureaVeg, method: 'Side-dressing followed by light irrigation' });
  }
  if (mopVeg > 0) {
    vegFertilizers.push({ productName: 'MOP (60% K₂O)', dosePerAcreKg: mopVeg, method: 'Ring placement or fertigation' });
  }

  const applicationTiming: TimingStep[] = [
    {
      step: 1,
      stageName: `Basal Dose (Field Preparation / Sowing for ${profile.displayName})`,
      timingWindow: 'Day 0 to 7',
      badge: 'Immediate Basal',
      details: `Apply full phosphorus requirement (${dapRatePerAcre > 0 ? 'DAP' : 'SSP'}), initial potassium, and starter nitrogen in band placement near root zone.`,
      fertilizersApplied: basalFertilizers,
    },
  ];

  if (vegFertilizers.length > 0) {
    applicationTiming.push({
      step: 2,
      stageName: `First Top Dressing (Vegetative Stage of ${profile.displayName})`,
      timingWindow: '20 to 25 Days After Sowing / Transplanting',
      badge: 'Canopy Boost',
      details: 'Apply secondary split of Nitrogen and Potassium to stimulate branching, lush canopy, and sturdy stems.',
      fertilizersApplied: vegFertilizers,
    });
  }

  if (zincRatePerAcre > 0) {
    applicationTiming.push({
      step: applicationTiming.length + 1,
      stageName: 'Micronutrient Correction (Zinc Sulphate)',
      timingWindow: '25 to 35 Days After Sowing',
      badge: 'Foliar Health',
      details: 'Apply Zinc Sulphate (0.5% foliar spray in morning hours) to prevent interveinal chlorosis and boost chlorophyll synthesis.',
      fertilizersApplied: [
        { productName: 'Zinc Sulphate (21% Zn)', dosePerAcreKg: zincRatePerAcre, method: 'Foliar spray with surfactant' },
      ],
    });
  }

  if (ureaFlowering > 0 || mopFruit > 0) {
    const finalFertilizers: { productName: string; dosePerAcreKg: number; method: string }[] = [];
    if (ureaFlowering > 0) {
      finalFertilizers.push({ productName: 'Urea (46% N)', dosePerAcreKg: ureaFlowering, method: 'Fertigation / top-dressing' });
    }
    if (mopFruit > 0) {
      finalFertilizers.push({ productName: 'MOP (60% K₂O)', dosePerAcreKg: mopFruit, method: 'Soil drenching / drip' });
    }
    applicationTiming.push({
      step: applicationTiming.length + 1,
      stageName: `Second Top Dressing (Flowering & Bulking for ${profile.displayName})`,
      timingWindow: '45 to 55 Days After Sowing',
      badge: 'Yield & Quality',
      details: 'Apply final Potassium and Nitrogen split to accelerate fruit/grain enlargement, rind thickness, and sugar translocation.',
      fertilizersApplied: finalFertilizers,
    });
  }

  // 8. Agronomic Insights
  const pProductStr = usesSsp ? `SSP (${sspRatePerAcre} kg/acre)` : `DAP (${dapRatePerAcre} kg/acre)`;
  const agronomicInsights: string[] = [
    nStatus.status === 'Low'
      ? `Soil Nitrogen is low (${soilN} kg/acre vs ${profile.displayName} target of ${Math.round(effectiveTargetN * 10) / 10} kg/acre). Splitting nitrogen across vegetative and reproductive stages prevents leaching.`
      : `Soil Nitrogen is at an adequate baseline (${soilN} kg/acre for ${profile.displayName}). Maintenance application sustains vigorous foliage.`,
    pStatus.status === 'Low'
      ? `Available Phosphorus is low (${soilP} kg/acre elemental P vs target ${Math.round(effectiveTargetP_elemental * 10) / 10} kg/acre). Application of ${pProductStr} anchors feeder roots.`
      : `Available Phosphorus status is ${pStatus.status.toLowerCase()} (${soilP} kg/acre elemental P, equivalent to ${(soilP * P_TO_P2O5).toFixed(1)} kg/acre P₂O₅). Application of ${pProductStr} ensures synchronous blooming.`,
    `Potassium target for ${profile.displayName} is ${Math.round(effectiveTargetK_elemental * 10) / 10} kg/acre elemental K (${Math.round(effectiveTargetK2O * 10) / 10} kg/acre K₂O). MOP application in split intervals bolsters test weight, grain filling, and disease resilience.`,
    phEval.description,
  ];

  if (profile.applicabilityCondition) {
    agronomicInsights.push(`Agronomic Context: ${profile.applicabilityCondition}`);
  }

  if (requiresZinc) {
    agronomicInsights.push(`Zinc supplementation is recommended for ${profile.displayName} to activate carbonic anhydrase enzymes and prevent chlorotic striping.`);
  }

  // 9. Organic Alternatives
  const organicAlternatives = [
    {
      name: 'Bio-Enriched Vermicompost',
      type: 'Soil Conditioner',
      dosage: '2.5 Tonnes / Acre',
      benefit: 'Enhances organic carbon, moisture retention, and supplies slow-release bio-nitrogen.',
    },
    {
      name: 'Jeevamrutha Microbial Drench',
      type: 'Bio-stimulant',
      dosage: '200 Litres / Acre through drip',
      benefit: 'Stimulates native rhizosphere microbes and accelerates phosphorus solubilization.',
    },
    {
      name: 'De-oiled Neem Cake',
      type: 'Nitrification Guard',
      dosage: '150 kg / Acre',
      benefit: 'Suppresses soil nematodes and retards nitrification losses of applied urea.',
    },
  ];

  return {
    isAvailable: true,
    sourceMetadata: profile.sourceMetadata,
    inputSummary: {
      crop: input.crop,
      state: input.state,
      district: input.district,
      cropDisplayName: profile.displayName,
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
