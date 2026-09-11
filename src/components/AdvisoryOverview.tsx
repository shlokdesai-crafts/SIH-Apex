import { useState, useEffect, useMemo } from 'react';
import './AdvisoryOverview.css';
import { getOrganicPreparationDetails } from '../utils/organicGuides';
import { 
  calculateAdvisory, 
  fetchFarmerAdvisoryContext, 
  type ApiAdvisoryCalculationData,
  type FarmerContextData 
} from '../services/advisoryApi';

interface AdvisoryOverviewProps {
  onBack?: () => void;
  onOpenFertilizer?: () => void;
}

interface SoilNutrient {
  name: string;
  symbol: string;
  status: 'Low' | 'Adequate' | 'Moderate' | 'High';
  currentVal: number;
  targetVal: number;
  unit: string;
}

interface NutrientRequirement {
  nutrient: string;
  symbol: string;
  recommended: number;
  current: number;
  additional: number;
  unit: string;
}

export interface FertilizerProduct {
  id: string;
  name: string;
  formula: string;
  composition: string;
  ratePerAcre: number;
  unit: string;
  badge: string;
  bagColor: string;
  description: string;
  category?: string;
  packageSizeKg?: number;
  packageUnit?: string;
  price?: number;
  isOrganic?: boolean;
}

export interface DbFertilizerItem {
  id: string;
  productCode: string;
  name: string;
  category: string;
  formula: string;
  composition: string;
  packageSizeKg: number;
  packageUnit: string;
  price: number;
  mrp: number;
  badge: string;
  bagColor: string;
  description: string;
  isOrganic: boolean;
  isActive: boolean;
}

interface ApplicationStep {
  step: number;
  title: string;
  timing: string;
  badge: string;
  details: string;
}

interface NearbyRiskReport {
  id: string;
  crop: string;
  threat: string;
  distance: string;
  farmsAffected: number;
  severity: 'High' | 'Moderate' | 'Low';
  status: string;
  advisedAction: string;
}

interface CropAdvisoryData {
  id: string;
  name: string;
  image: string;
  stage: string;
  stageDays: string;
  field: string;
  acres: number;
  location: string;
  soilType: string;
  todayAdvice: string;
  soilNutrients: {
    nitrogen: SoilNutrient;
    phosphorus: SoilNutrient;
    potassium: SoilNutrient;
    ph: { value: number; label: string };
    organicCarbon: { value: string; label: string };
    micronutrients: { label: string; elements: string };
  };
  requirements: NutrientRequirement[];
  keyInsights: string[];
  calloutMessage: string;
  products: FertilizerProduct[];
  calculatorRates: {
    ureaKgPerAcre: number;
    dapKgPerAcre: number;
    mopKgPerAcre: number;
    zincKgPerAcre: number;
  };
  timingSteps: ApplicationStep[];
  safetyTips: string[];
  organicAlternatives: {
    name: string;
    type: string;
    dosage: string;
    benefit: string;
  }[];
  nearbyRiskReports: NearbyRiskReport[];
}

const ADVISORY_DATA: Record<string, CropAdvisoryData> = {
  tomato: {
    id: 'tomato',
    name: 'Tomato',
    image: '/images/tomato_crop.jpg',
    stage: 'Flowering Stage',
    stageDays: 'Day 48 of 120',
    field: 'Field 1',
    acres: 3.5,
    location: 'Akola, Maharashtra',
    soilType: 'Medium Black Clay Loam',
    todayAdvice: 'Apply 2nd Nitrogen split (Urea) and give light drip irrigation early morning before 10 AM. Inspect lower leaves for blight spots.',
    soilNutrients: {
      nitrogen: {
        name: 'Nitrogen',
        symbol: 'N',
        status: 'Low',
        currentVal: 25,
        targetVal: 60,
        unit: 'kg/acre',
      },
      phosphorus: {
        name: 'Phosphorus',
        symbol: 'P',
        status: 'Adequate',
        currentVal: 18,
        targetVal: 25,
        unit: 'kg/acre',
      },
      potassium: {
        name: 'Potassium',
        symbol: 'K',
        status: 'Moderate',
        currentVal: 20,
        targetVal: 40,
        unit: 'kg/acre',
      },
      ph: { value: 7.2, label: 'Neutral' },
      organicCarbon: { value: '0.6%', label: 'Low' },
      micronutrients: { label: 'Needs Attention', elements: 'Zn, Fe' },
    },
    requirements: [
      { nutrient: 'Nitrogen', symbol: 'N', recommended: 60, current: 25, additional: 35, unit: 'kg/acre' },
      { nutrient: 'Phosphorus', symbol: 'P', recommended: 25, current: 18, additional: 7, unit: 'kg/acre' },
      { nutrient: 'Potassium', symbol: 'K', recommended: 40, current: 20, additional: 20, unit: 'kg/acre' },
      { nutrient: 'Calcium', symbol: 'Ca', recommended: 10, current: 5, additional: 5, unit: 'kg/acre' },
      { nutrient: 'Magnesium', symbol: 'Mg', recommended: 5, current: 2, additional: 3, unit: 'kg/acre' },
      { nutrient: 'Zinc', symbol: 'Zn', recommended: 1, current: 0.3, additional: 0.7, unit: 'kg/acre' },
    ],
    keyInsights: [
      'Nitrogen is critically low, impacting vegetative growth and flower formation.',
      'Phosphorus is at an adequate level; maintain current application rate.',
      'Zinc and Iron deficiency observed, which may cause interveinal chlorosis.',
      'Potassium levels are moderate; supplementary dose needed during fruit set.',
    ],
    calloutMessage: 'Apply the recommended fertilizers at the right time to ensure healthy flowering and higher yield.',
    products: [
      {
        id: 'urea',
        name: 'Urea',
        formula: 'CO(NH₂)₂',
        composition: '46% N',
        ratePerAcre: 60,
        unit: 'kg/acre',
        badge: 'High Nitrogen',
        bagColor: '#1e56a0',
        description: 'Fast acting granular nitrogen fertilizer for rapid canopy growth and lush foliage.',
      },
      {
        id: 'dap',
        name: 'DAP',
        formula: 'Di-Ammonium Phosphate',
        composition: '18% N, 46% P',
        ratePerAcre: 55,
        unit: 'kg/acre',
        badge: 'Root Developer',
        bagColor: '#e67e22',
        description: 'Excellent source of available phosphorus and nitrogen to stimulate deep root development.',
      },
      {
        id: 'mop',
        name: 'MOP',
        formula: 'Muriate of Potash (KCl)',
        composition: '60% Potassium',
        ratePerAcre: 35,
        unit: 'kg/acre',
        badge: 'Fruit Quality',
        bagColor: '#c0392b',
        description: 'Increases fruit firmness, sugar content, shelf life, and resistance against drought.',
      },
    ],
    calculatorRates: {
      ureaKgPerAcre: 60,
      dapKgPerAcre: 55,
      mopKgPerAcre: 35,
      zincKgPerAcre: 1,
    },
    timingSteps: [
      {
        step: 1,
        title: 'First Dose (Basal)',
        timing: 'This Week',
        badge: 'Immediate',
        details: 'Apply Urea & DAP near root zone with light irrigation.',
      },
      {
        step: 2,
        title: 'Second Dose (Top Dressing)',
        timing: 'After 15 Days',
        badge: 'Flowering Boost',
        details: 'Apply MOP and remaining Nitrogen before flowering peak.',
      },
      {
        step: 3,
        title: 'Micronutrient Spray',
        timing: 'After 20 Days',
        badge: 'Foliar Health',
        details: 'Foliar spray of Zinc Sulphate + Boron in early morning.',
      },
    ],
    safetyTips: [
      'Always wear protective gloves and mask when handling chemicals.',
      'Avoid fertilizer application during high winds or right before heavy rainfall.',
      'Store fertilizers in a dry, ventilated area away from direct sunlight.',
    ],
    organicAlternatives: [
      {
        name: 'Well-Decomposed Vermicompost',
        type: 'Organic Matter',
        dosage: '2.5 Tonnes / Acre',
        benefit: 'Enriches microbial biodiversity, soil water-holding capacity, and balanced slow-release nutrients.',
      },
      {
        name: 'Jeevamrutha Fermented Drench',
        type: 'Bio-stimulant',
        dosage: '200 Litres / Acre with drip',
        benefit: 'Natural nitrogen fixers and phosphorus solubilizers directly revitalize rhizosphere bacteria.',
      },
      {
        name: 'Neem Cake (De-oiled)',
        type: 'Nitrification Inhibitor',
        dosage: '100 kg / Acre',
        benefit: 'Retards nitrogen leaching into groundwater while suppressing harmful soil nematodes.',
      },
    ],
    nearbyRiskReports: [
      {
        id: 'risk-1',
        crop: 'Tomato',
        threat: 'Early Blight (Alternaria solani)',
        distance: '4.2 km away',
        farmsAffected: 6,
        severity: 'Moderate',
        status: 'Active Spore Spread',
        advisedAction: 'Keep foliage dry; inspect lower leaf quadrants for dark brown target-spot rings.',
      },
      {
        id: 'risk-2',
        crop: 'Chilli & Tomato',
        threat: 'Whitefly Infestation (Vector)',
        distance: '6.8 km away',
        farmsAffected: 11,
        severity: 'Moderate',
        status: 'Surveillance Alert',
        advisedAction: 'Set up 4 yellow sticky traps per acre; spray neem oil 10,000 ppm if nymphs appear.',
      },
      {
        id: 'risk-3',
        crop: 'Brinjal / Solanaceae',
        threat: 'Bacterial Wilt Notice',
        distance: '12 km away',
        farmsAffected: 3,
        severity: 'Low',
        status: 'Localized Containment',
        advisedAction: 'Maintain clean drainage channels and avoid furrow flooding across adjacent plots.',
      },
    ],
  },
  cotton: {
    id: 'cotton',
    name: 'Cotton',
    image: '/images/cotton_crop.jpg',
    stage: 'Boll Development Stage',
    stageDays: 'Day 78 of 150',
    field: 'Field 2',
    acres: 5.0,
    location: 'Akola, Maharashtra',
    soilType: 'Deep Black Cotton Vertisol',
    todayAdvice: 'Install 5 pheromone traps per acre today. Apply Potassium (MOP) to accelerate boll filling and fiber strength.',
    soilNutrients: {
      nitrogen: {
        name: 'Nitrogen',
        symbol: 'N',
        status: 'Moderate',
        currentVal: 38,
        targetVal: 65,
        unit: 'kg/acre',
      },
      phosphorus: {
        name: 'Phosphorus',
        symbol: 'P',
        status: 'Low',
        currentVal: 14,
        targetVal: 30,
        unit: 'kg/acre',
      },
      potassium: {
        name: 'Potassium',
        symbol: 'K',
        status: 'Adequate',
        currentVal: 45,
        targetVal: 50,
        unit: 'kg/acre',
      },
      ph: { value: 7.8, label: 'Slightly Alkaline' },
      organicCarbon: { value: '0.5%', label: 'Low' },
      micronutrients: { label: 'Deficient', elements: 'Boron, Magnesium' },
    },
    requirements: [
      { nutrient: 'Nitrogen', symbol: 'N', recommended: 65, current: 38, additional: 27, unit: 'kg/acre' },
      { nutrient: 'Phosphorus', symbol: 'P', recommended: 30, current: 14, additional: 16, unit: 'kg/acre' },
      { nutrient: 'Potassium', symbol: 'K', recommended: 50, current: 45, additional: 5, unit: 'kg/acre' },
      { nutrient: 'Boron', symbol: 'B', recommended: 1.5, current: 0.5, additional: 1.0, unit: 'kg/acre' },
      { nutrient: 'Magnesium', symbol: 'Mg', recommended: 12, current: 6, additional: 6, unit: 'kg/acre' },
      { nutrient: 'Sulphur', symbol: 'S', recommended: 8, current: 4, additional: 4, unit: 'kg/acre' },
    ],
    keyInsights: [
      'Phosphorus deficit is limiting boll retention and fiber elongation.',
      'Boron deficiency can trigger flower bud shedding; spray recommended.',
      'Potassium levels are adequate, supporting healthy boll weight.',
      'Magnesium top-dressing prevents leaf reddening (lalya disease).',
    ],
    calloutMessage: 'Apply phosphorus booster immediately to maximize boll retention and prevent square shedding.',
    products: [
      {
        id: 'ssp',
        name: 'Single Super Phosphate (SSP)',
        formula: 'Ca(H₂PO₄)₂ + CaSO₄',
        composition: '16% P, 11% S',
        ratePerAcre: 80,
        unit: 'kg/acre',
        badge: 'Phosphate & Sulphur',
        bagColor: '#16a085',
        description: 'Supplies essential phosphorus with readily available sulphate to strengthen boll walls.',
      },
      {
        id: 'urea',
        name: 'Urea',
        formula: 'CO(NH₂)₂',
        composition: '46% N',
        ratePerAcre: 50,
        unit: 'kg/acre',
        badge: 'Boll Sizing',
        bagColor: '#1e56a0',
        description: 'Sustains boll maturation without encouraging excessive vegetative rank growth.',
      },
      {
        id: 'mgso4',
        name: 'Magnesium Sulphate',
        formula: 'MgSO₄·7H₂O',
        composition: '9.6% Mg, 12% S',
        ratePerAcre: 20,
        unit: 'kg/acre',
        badge: 'Anti-Reddening',
        bagColor: '#8e44ad',
        description: 'Prevents cotton leaf reddening and enhances photosynthetic green chlorophyll.',
      },
    ],
    calculatorRates: {
      ureaKgPerAcre: 50,
      dapKgPerAcre: 40,
      mopKgPerAcre: 25,
      zincKgPerAcre: 1.5,
    },
    timingSteps: [
      {
        step: 1,
        title: 'Boll Sizing Dose',
        timing: 'This Week',
        badge: 'Immediate',
        details: 'Apply SSP and Urea at second irrigation split in moist furrows.',
      },
      {
        step: 2,
        title: 'Foliar Boron Spray',
        timing: 'After 10 Days',
        badge: 'Square Retention',
        details: 'Spray 0.15% Solubor (Boron) in evening hours for flower retention.',
      },
      {
        step: 3,
        title: 'Potash Boost Split',
        timing: 'After 25 Days',
        badge: 'Fiber Quality',
        details: 'Broadcast MOP to ensure complete fiber filling and high lint index.',
      },
    ],
    safetyTips: [
      'Maintain deep moisture before applying concentrated granular fertilizer in black cotton soil.',
      'Do not mix magnesium sulphate directly with phosphorus solutions in high concentrations.',
      'Use certified masks when spraying foliar micronutrients.',
    ],
    organicAlternatives: [
      {
        name: 'Farm Yard Manure (FYM)',
        type: 'Organic Base',
        dosage: '4 Tonnes / Acre',
        benefit: 'Restores black soil structure, prevents deep cracking, and increases organic carbon.',
      },
      {
        name: 'Trichoderma enriched Compost',
        type: 'Bio-Fungicide & Nutrient',
        dosage: '250 kg / Acre',
        benefit: 'Controls soil-borne root rot and wilt pathogens while unlocking fixed phosphorus.',
      },
      {
        name: 'Panchagavya Foliar Tonic',
        type: 'Plant Tonic',
        dosage: '3% dilution (30 ml/L)',
        benefit: 'Triggers phytohormones for abundant boll setting and uniform fiber growth.',
      },
    ],
    nearbyRiskReports: [
      {
        id: 'cotton-risk-1',
        crop: 'Cotton',
        threat: 'Pink Bollworm (Pectinophora gossypiella)',
        distance: '3.1 km away',
        farmsAffected: 14,
        severity: 'High',
        status: 'Moth Catches > 8 / trap',
        advisedAction: 'Install pheromone delta traps immediately; inspect rosetted flowers.',
      },
      {
        id: 'cotton-risk-2',
        crop: 'Cotton',
        threat: 'Jassids & Thrips Alert',
        distance: '7.5 km away',
        farmsAffected: 9,
        severity: 'Moderate',
        status: 'Early Hopperburn Risk',
        advisedAction: 'Apply neem-based bio-repellent or flonicamid if downward leaf curling begins.',
      },
    ],
  },
  soybean: {
    id: 'soybean',
    name: 'Soybean',
    image: '/images/soybean_crop.jpg',
    stage: 'Pod Formation Stage',
    stageDays: 'Day 62 of 95',
    field: 'Field 3',
    acres: 4.2,
    location: 'Akola, Maharashtra',
    soilType: 'Clay Loam with good drainage',
    todayAdvice: 'Spray foliar feed (00:52:34) to boost pod grain filling. Hold irrigation as topsoil has optimal 75% moisture.',
    soilNutrients: {
      nitrogen: {
        name: 'Nitrogen',
        symbol: 'N',
        status: 'Adequate',
        currentVal: 42,
        targetVal: 45,
        unit: 'kg/acre',
      },
      phosphorus: {
        name: 'Phosphorus',
        symbol: 'P',
        status: 'Low',
        currentVal: 15,
        targetVal: 35,
        unit: 'kg/acre',
      },
      potassium: {
        name: 'Potassium',
        symbol: 'K',
        status: 'Moderate',
        currentVal: 22,
        targetVal: 35,
        unit: 'kg/acre',
      },
      ph: { value: 6.9, label: 'Optimal' },
      organicCarbon: { value: '0.75%', label: 'Medium' },
      micronutrients: { label: 'Low Sulphur', elements: 'S, Mo' },
    },
    requirements: [
      { nutrient: 'Nitrogen', symbol: 'N', recommended: 45, current: 42, additional: 3, unit: 'kg/acre' },
      { nutrient: 'Phosphorus', symbol: 'P', recommended: 35, current: 15, additional: 20, unit: 'kg/acre' },
      { nutrient: 'Potassium', symbol: 'K', recommended: 35, current: 22, additional: 13, unit: 'kg/acre' },
      { nutrient: 'Sulphur', symbol: 'S', recommended: 15, current: 6, additional: 9, unit: 'kg/acre' },
      { nutrient: 'Molybdenum', symbol: 'Mo', recommended: 0.5, current: 0.1, additional: 0.4, unit: 'kg/acre' },
      { nutrient: 'Zinc', symbol: 'Zn', recommended: 2.0, current: 1.0, additional: 1.0, unit: 'kg/acre' },
    ],
    keyInsights: [
      'Rhizobium nodules are actively fixing nitrogen; heavy urea is NOT required.',
      'Sulphur supplementation is urgently needed to boost grain oil content.',
      'Phosphorus replenishment will speed up pod filling and grain boldness.',
      'Potassium will improve drought resilience and prevent premature senescence.',
    ],
    calloutMessage: 'Prioritize Sulphur and Phosphorus top-dress to significantly enhance pod weight and grain oil content.',
    products: [
      {
        id: 'bentonite-s',
        name: 'Bentonite Sulphur 90%',
        formula: 'Pastille Granular S',
        composition: '90% Elemental Sulphur',
        ratePerAcre: 15,
        unit: 'kg/acre',
        badge: 'Oil & Protein',
        bagColor: '#f39c12',
        description: 'Crucial for synthesis of oil, methionine amino acids, and high test weight in pulses.',
      },
      {
        id: 'dap',
        name: 'DAP (18-46-0)',
        formula: 'Di-Ammonium Phosphate',
        composition: '18% N, 46% P',
        ratePerAcre: 45,
        unit: 'kg/acre',
        badge: 'Pod Filling',
        bagColor: '#e67e22',
        description: 'Provides rapid bioavailable phosphorus for synchronous grain filling across nodes.',
      },
      {
        id: 'potash',
        name: 'Muriate of Potash (MOP)',
        formula: 'KCl',
        composition: '60% K₂O',
        ratePerAcre: 25,
        unit: 'kg/acre',
        badge: 'Grain Boldness',
        bagColor: '#c0392b',
        description: 'Improves grain shine, bold kernel grading, and test-weight uniformity.',
      },
    ],
    calculatorRates: {
      ureaKgPerAcre: 15,
      dapKgPerAcre: 45,
      mopKgPerAcre: 25,
      zincKgPerAcre: 1.0,
    },
    timingSteps: [
      {
        step: 1,
        title: 'Sulphur & DAP Top-Dress',
        timing: 'This Week',
        badge: 'Pod Setting',
        details: 'Side-dress Bentonite Sulphur + DAP before next rain shower.',
      },
      {
        step: 2,
        title: '19:19:19 Foliar Spray',
        timing: 'After 10 Days',
        badge: 'Grain Filling',
        details: 'Foliar spray 1% NPK 19:19:19 with micronutrient chelate in morning.',
      },
      {
        step: 3,
        title: '0:0:50 Potash Finish',
        timing: 'After 22 Days',
        badge: 'Final Shine',
        details: 'Spray Potassium Sulphate (0:0:50) at 5g/L for premium seed luster.',
      },
    ],
    safetyTips: [
      'Do not apply high nitrogen that triggers excessive lodging in soybean.',
      'Sulphur should be spread evenly into moist topsoil for quick oxidation.',
      'Calibrate sprayer pressure to avoid mechanical damage to tender pods.',
    ],
    organicAlternatives: [
      {
        name: 'Rhizobium + PSB Culture',
        type: 'Bio-fertilizer',
        dosage: '1 kg / Acre seed/soil',
        benefit: 'Boosts root nodulation and solubilizes fixed insoluble phosphorus.',
      },
      {
        name: 'Castor De-oiled Cake',
        type: 'Nutrient Rich Cake',
        dosage: '150 kg / Acre',
        benefit: 'Slow continuous release of nitrogen and natural repellent against soil grubs.',
      },
      {
        name: 'Bio-Potash (Frateuria aurentia)',
        type: 'Potash Mobilizer',
        dosage: '1 Litre / Acre',
        benefit: 'Mobilizes insoluble potash reserves in soil without adding salts.',
      },
    ],
    nearbyRiskReports: [
      {
        id: 'soy-risk-1',
        crop: 'Soybean',
        threat: 'Semilooper Foliage Defoliator',
        distance: '5.4 km away',
        farmsAffected: 8,
        severity: 'Moderate',
        status: 'Scattered Feeding Signs',
        advisedAction: 'Spray biological Bacillus thuringiensis (Bt) or hand-pick larger caterpillars.',
      },
      {
        id: 'soy-risk-2',
        crop: 'Soybean & Pulses',
        threat: 'Yellow Mosaic Virus (YMV)',
        distance: '11.0 km away',
        farmsAffected: 4,
        severity: 'Low',
        status: 'Isolated Vectors',
        advisedAction: 'Rogue out infected chlorotic yellow plants to halt vector transmission.',
      },
    ],
  },
  sugarcane: {
    id: 'sugarcane',
    name: 'Sugarcane',
    image: '/images/sugarcane_crop.jpg',
    stage: 'Grand Growth Stage',
    stageDays: 'Day 90 of 360',
    field: 'Field 4',
    acres: 6.0,
    location: 'Akola, Maharashtra',
    soilType: 'Heavy Clay Vertisol with high organic matter',
    todayAdvice: 'Apply top dressing of Urea along with earth-up operation. Ensure uniform furrow moisture.',
    soilNutrients: {
      nitrogen: {
        name: 'Nitrogen',
        symbol: 'N',
        status: 'Low',
        currentVal: 45,
        targetVal: 120,
        unit: 'kg/acre',
      },
      phosphorus: {
        name: 'Phosphorus',
        symbol: 'P',
        status: 'Moderate',
        currentVal: 28,
        targetVal: 45,
        unit: 'kg/acre',
      },
      potassium: {
        name: 'Potassium',
        symbol: 'K',
        status: 'Low',
        currentVal: 32,
        targetVal: 80,
        unit: 'kg/acre',
      },
      ph: { value: 7.5, label: 'Neutral to Alkaline' },
      organicCarbon: { value: '0.8%', label: 'Medium' },
      micronutrients: { label: 'Deficient', elements: 'Fe, Zn' },
    },
    requirements: [
      { nutrient: 'Nitrogen', symbol: 'N', recommended: 120, current: 45, additional: 75, unit: 'kg/acre' },
      { nutrient: 'Phosphorus', symbol: 'P', recommended: 45, current: 28, additional: 17, unit: 'kg/acre' },
      { nutrient: 'Potassium', symbol: 'K', recommended: 80, current: 32, additional: 48, unit: 'kg/acre' },
      { nutrient: 'Iron', symbol: 'Fe', recommended: 10, current: 3, additional: 7, unit: 'kg/acre' },
      { nutrient: 'Zinc', symbol: 'Zn', recommended: 5, current: 1.5, additional: 3.5, unit: 'kg/acre' },
      { nutrient: 'Sulphur', symbol: 'S', recommended: 25, current: 12, additional: 13, unit: 'kg/acre' },
    ],
    keyInsights: [
      'High cane tonnage demand requires heavy Nitrogen split application.',
      'Potassium deficiency directly affects cane girth, internode count, and Brix sugar index.',
      'Iron chlorosis (yellowing of whorl leaves) needs foliar ferrous sulphate correction.',
      'Split fertilizer application along with earthing-up operations prevents lodging.',
    ],
    calloutMessage: 'Provide heavy Potash and Nitrogen split before cane canopy closes to lock in high sugar recovery and cane weight.',
    products: [
      {
        id: 'urea',
        name: 'Urea (46% N)',
        formula: 'CO(NH₂)₂',
        composition: '46% N',
        ratePerAcre: 110,
        unit: 'kg/acre',
        badge: 'Cane Elongation',
        bagColor: '#1e56a0',
        description: 'Drives rapid internode elongation and maximum biomass accumulation during monsoon.',
      },
      {
        id: 'mop',
        name: 'MOP (0-0-60)',
        formula: 'Muriate of Potash',
        composition: '60% K₂O',
        ratePerAcre: 75,
        unit: 'kg/acre',
        badge: 'Sugar & Girth',
        bagColor: '#c0392b',
        description: 'Improves cane diameter, internode thickness, drought hardiness, and Brix sucrose recovery.',
      },
      {
        id: 'micronutrient-cane',
        name: 'Sugarcane Micro-Mix',
        formula: 'Fe + Zn + Mn + B Chelate',
        composition: 'Full Spectrum Chelate',
        ratePerAcre: 10,
        unit: 'kg/acre',
        badge: 'Whorl Chlorosis',
        bagColor: '#27ae60',
        description: 'Restores vibrant green photosynthesis in yellowed upper leaf canopies.',
      },
    ],
    calculatorRates: {
      ureaKgPerAcre: 110,
      dapKgPerAcre: 50,
      mopKgPerAcre: 75,
      zincKgPerAcre: 5.0,
    },
    timingSteps: [
      {
        step: 1,
        title: 'Grand Growth Earthing-Up Dose',
        timing: 'This Week',
        badge: 'Earthing Up',
        details: 'Apply Urea + Potash deep into ridges prior to tractor earthing up.',
      },
      {
        step: 2,
        title: 'Ferrous + Zinc Drench',
        timing: 'After 15 Days',
        badge: 'Leaf Greening',
        details: 'Apply 0.5% FeSO₄ drench at base to reverse iron chlorosis in whorls.',
      },
      {
        step: 3,
        title: 'Final Potassium Finish',
        timing: 'After 35 Days',
        badge: 'Sucrose Stacking',
        details: 'Complete remaining Potash dose with irrigation to boost sucrose content.',
      },
    ],
    safetyTips: [
      'Never apply high dose fertilizer in completely dry trenches without immediate irrigation.',
      'Ensure proper furrow placement at 10-15 cm depth to prevent volatilization loss.',
      'Keep bags elevated on wooden pallets away from moisture during humid monsoon weather.',
    ],
    organicAlternatives: [
      {
        name: 'Pressmud Bio-Compost',
        type: 'Sugar Mill By-product',
        dosage: '5 Tonnes / Acre',
        benefit: 'Rich in organic carbon, phosphorus, and essential micro-nutrients.',
      },
      {
        name: 'Acetobacter Bio-fertilizer',
        type: 'Endophytic Nitrogen Fixer',
        dosage: '2 Litres / Acre',
        benefit: 'Lives inside cane stems, continuously fixing 30-40% of cane nitrogen requirement.',
      },
      {
        name: 'Trash Mulching with decomposer',
        type: 'In-situ Organic Waste',
        dosage: 'All field residue',
        benefit: 'Retains soil moisture, prevents weed emergence, and adds tons of organic carbon.',
      },
    ],
    nearbyRiskReports: [
      {
        id: 'cane-risk-1',
        crop: 'Sugarcane',
        threat: 'Early Shoot Borer (Chilo infuscatellus)',
        distance: '4.8 km away',
        farmsAffected: 5,
        severity: 'Moderate',
        status: 'Dead-heart monitoring',
        advisedAction: 'Perform earthing up and release Trichogramma chilonis egg parasitoids.',
      },
      {
        id: 'cane-risk-2',
        crop: 'Sugarcane',
        threat: 'Pyrilla Leaf Hopper',
        distance: '9.2 km away',
        farmsAffected: 7,
        severity: 'Low',
        status: 'Encourage Epiricania',
        advisedAction: 'Conserve natural nymphal cocoons of Epiricania melanoleuca; avoid broad sprays.',
      },
    ],
  },
};

export default function AdvisoryOverview({ onBack, onOpenFertilizer }: AdvisoryOverviewProps) {
  const [selectedCropId, setSelectedCropId] = useState<string>('tomato');
  const [activeSubTab, setActiveSubTab] = useState<string>('nutrient-status');
  const [fieldSize, setFieldSize] = useState<number>(3.5);
  const [fieldUnit, setFieldUnit] = useState<'Acres' | 'Hectares' | 'Guntha'>('Acres');
  // Selected fertilizers state - stores array of fertilizer IDs selected by the farmer
  const [selectedFertilizers, setSelectedFertilizers] = useState<string[]>(['urea', 'dap']);
  const [showCalcModal, setShowCalcModal] = useState<boolean>(false);

  // Modals state
  const [showCropModal, setShowCropModal] = useState<boolean>(false);
  const [showWhyModal, setShowWhyModal] = useState<boolean>(false);
  const [showPlanModal, setShowPlanModal] = useState<boolean>(false);
  const [activeWeekTab, setActiveWeekTab] = useState<number>(1);
  const [planViewMode, setPlanViewMode] = useState<'weekly' | 'checklist'>('weekly');
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({
    'task-today-1': true,
  });

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };
  const [showNearbyModal, setShowNearbyModal] = useState<boolean>(false);
  const [showSoilModal, setShowSoilModal] = useState<boolean>(false);
  const [showCatalogModal, setShowCatalogModal] = useState<boolean>(false);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState<string>('');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>('All');
  const [selectedOrganicGuide, setSelectedOrganicGuide] = useState<{ name: string; type: string; dosage: string; benefit: string } | null>(null);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  const crop = ADVISORY_DATA[selectedCropId] || ADVISORY_DATA.tomato;

  // Fetch live active fertilizer products from PostgreSQL API (/api/fertilizers)
  const [dbFertilizers, setDbFertilizers] = useState<DbFertilizerItem[]>([]);
  const [isDbLoaded, setIsDbLoaded] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function loadFertilizers() {
      try {
        let response: Response;
        try {
          response = await fetch('/api/fertilizers');
        } catch {
          response = await fetch('http://localhost:5000/api/fertilizers');
        }

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const payload = await response.json();
        if (payload.status === 'success' && Array.isArray(payload.data) && isMounted) {
          setDbFertilizers(payload.data);
          setIsDbLoaded(true);
        }
      } catch (error) {
        console.warn('Fertilizer products API unavailable, falling back to local dataset:', error);
      }
    }

    loadFertilizers();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch live active farmer profile, farm parcel, crop cycle, and latest certified soil test from PostgreSQL
  const [farmerContext, setFarmerContext] = useState<FarmerContextData | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadFarmerContext() {
      try {
        const data = await fetchFarmerAdvisoryContext(selectedCropId);
        if (data && isMounted) {
          setFarmerContext(data);
          // Set initial field size from crop cycle or farm if available
          if (data.cropCycle?.allocatedAcres) {
            setFieldSize(data.cropCycle.allocatedAcres);
          } else if (data.farm?.totalArea) {
            setFieldSize(data.farm.totalArea);
          }
        }
      } catch (error) {
        console.warn('Farmer context API unavailable, falling back to local dataset:', error);
      }
    }

    loadFarmerContext();

    return () => {
      isMounted = false;
    };
  }, [selectedCropId]);

  // Compute active recommended fertilizer products enriched with live PostgreSQL data
  const recommendedProducts: FertilizerProduct[] = useMemo(() => {
    return crop.products.map((p) => {
      const dbMatch = dbFertilizers.find(
        (df) =>
          df.productCode.toLowerCase() === p.id.toLowerCase() ||
          df.name.toLowerCase().includes(p.name.toLowerCase()) ||
          p.name.toLowerCase().includes(df.name.toLowerCase())
      );

      if (dbMatch) {
        return {
          ...p,
          name: dbMatch.name,
          formula: dbMatch.formula || p.formula,
          composition: dbMatch.composition,
          badge: dbMatch.badge || p.badge,
          bagColor: dbMatch.bagColor || p.bagColor,
          description: dbMatch.description || p.description,
          category: dbMatch.category,
          packageSizeKg: dbMatch.packageSizeKg,
          packageUnit: dbMatch.packageUnit,
          price: dbMatch.price,
          isOrganic: dbMatch.isOrganic,
        };
      }
      return p;
    });
  }, [crop.products, dbFertilizers]);

  const handleSelectCrop = (cropId: string) => {
    setSelectedCropId(cropId);
    const newCrop = ADVISORY_DATA[cropId] || ADVISORY_DATA.tomato;
    setFieldSize(newCrop.acres || 3.5);
    // Pre-select recommended fertilizers for the switched crop
    setSelectedFertilizers(newCrop.products.map((p) => p.id));
    setShowCropModal(false);
    triggerToast(`Switched active advisory to ${newCrop.name}`);
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3200);
  };

  const handleToggleFertilizer = (productId: string, productName: string) => {
    setSelectedFertilizers((prev) => {
      const isSelected = prev.includes(productId);
      const updated = isSelected ? prev.filter((id) => id !== productId) : [...prev, productId];
      if (!isSelected) {
        triggerToast(`✓ Added ${productName} to your seasonal fertilizer plan!`);
      } else {
        triggerToast(`Removed ${productName} from plan`);
      }
      return updated;
    });
  };

  const handleSavePlan = () => {
    const selectedNames = recommendedProducts
      .filter((p) => selectedFertilizers.includes(p.id))
      .map((p) => p.name)
      .join(', ');
    triggerToast(`✓ Plan saved! ${fieldSize} ${fieldUnit} requirements (${selectedNames || 'custom'}) added to My Farm schedule.`);
  };

  const handleTabClick = (tabId: string) => {
    setActiveSubTab(tabId);
    if (tabId === 'calculator') {
      setShowCalcModal(true);
    }
    const sectionMap: Record<string, string> = {
      'nutrient-status': 'section-soil-status',
      'recommended-fert': 'section-products',
      'app-guide': 'section-timing-tips',
      'calculator': 'section-products',
      'organic-alt': 'section-organic',
      'nearby-risks': 'section-nearby-risks',
    };
    const targetElement = document.getElementById(sectionMap[tabId]);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const multiplier = fieldUnit === 'Acres' ? 1 : fieldUnit === 'Hectares' ? 2.47 : 0.025;
  const effectiveAcres = Math.max(0.1, fieldSize * multiplier);

  // Precision Fertilizer Advisory Calculation via POST /api/advisories/calculate
  const [apiCalculation, setApiCalculation] = useState<ApiAdvisoryCalculationData | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function runAdvisoryCalculation() {
      setIsCalculating(true);
      setCalcError(null);
      try {
        const soilN = farmerContext?.soilTest ? farmerContext.soilTest.nitrogenVal : crop.soilNutrients.nitrogen.currentVal;
        const soilP = farmerContext?.soilTest ? farmerContext.soilTest.phosphorusVal : crop.soilNutrients.phosphorus.currentVal;
        const soilK = farmerContext?.soilTest ? farmerContext.soilTest.potassiumVal : crop.soilNutrients.potassium.currentVal;
        const soilPh = farmerContext?.soilTest ? farmerContext.soilTest.phVal : crop.soilNutrients.ph.value;

        const result = await calculateAdvisory({
          crop: selectedCropId,
          farmArea: effectiveAcres,
          soilN,
          soilP,
          soilK,
          soilPh,
          targetYield: selectedCropId === 'tomato' ? 25 : undefined,
        });

        if (!isCancelled) {
          setApiCalculation(result);
          setIsCalculating(false);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.warn('Advisory calculation API failed, using fallback local data:', err);
          setCalcError(err?.message || 'Calculation API offline');
          setIsCalculating(false);
        }
      }
    }

    runAdvisoryCalculation();

    return () => {
      isCancelled = true;
    };
  }, [
    selectedCropId,
    effectiveAcres,
    farmerContext,
    crop.soilNutrients.nitrogen.currentVal,
    crop.soilNutrients.phosphorus.currentVal,
    crop.soilNutrients.potassium.currentVal,
    crop.soilNutrients.ph.value,
  ]);

  // Derived live soil nutrients status
  const activeSoilNutrients = useMemo(() => {
    const baseSoil = crop.soilNutrients;
    const fallbackN = farmerContext?.soilTest ? {
      name: 'Nitrogen',
      symbol: 'N',
      status: (farmerContext.soilTest.nitrogenStatus || 'Low') as 'Low' | 'Adequate' | 'Moderate' | 'High',
      currentVal: farmerContext.soilTest.nitrogenVal,
      targetVal: farmerContext.soilTest.nitrogenTarget || 60,
      unit: 'kg/acre',
    } : baseSoil.nitrogen;

    const fallbackP = farmerContext?.soilTest ? {
      name: 'Phosphorus',
      symbol: 'P',
      status: (farmerContext.soilTest.phosphorusStatus || 'Adequate') as 'Low' | 'Adequate' | 'Moderate' | 'High',
      currentVal: farmerContext.soilTest.phosphorusVal,
      targetVal: farmerContext.soilTest.phosphorusTarget || 25,
      unit: 'kg/acre',
    } : baseSoil.phosphorus;

    const fallbackK = farmerContext?.soilTest ? {
      name: 'Potassium',
      symbol: 'K',
      status: (farmerContext.soilTest.potassiumStatus || 'Moderate') as 'Low' | 'Adequate' | 'Moderate' | 'High',
      currentVal: farmerContext.soilTest.potassiumVal,
      targetVal: farmerContext.soilTest.potassiumTarget || 40,
      unit: 'kg/acre',
    } : baseSoil.potassium;

    const fallbackPh = farmerContext?.soilTest ? {
      value: farmerContext.soilTest.phVal,
      label: farmerContext.soilTest.phLabel || 'Neutral',
    } : baseSoil.ph;

    const fallbackOc = farmerContext?.soilTest ? {
      value: `${farmerContext.soilTest.organicCarbonPercent}%`,
      label: farmerContext.soilTest.organicCarbonStatus || 'Low',
    } : baseSoil.organicCarbon;

    const fallbackMicro = farmerContext?.soilTest?.micronutrientsSummary ? {
      label: 'Needs Attention',
      elements: farmerContext.soilTest.micronutrientsSummary.replace(' Deficient', '').replace('&', ','),
    } : baseSoil.micronutrients;

    if (!apiCalculation) {
      return {
        nitrogen: fallbackN,
        phosphorus: fallbackP,
        potassium: fallbackK,
        ph: fallbackPh,
        organicCarbon: fallbackOc,
        micronutrients: fallbackMicro,
      };
    }

    const n = apiCalculation.nutrientStatus.nitrogen;
    const p = apiCalculation.nutrientStatus.phosphorus;
    const k = apiCalculation.nutrientStatus.potassium;
    const ph = apiCalculation.nutrientStatus.ph;

    return {
      nitrogen: {
        name: n.name,
        symbol: n.symbol,
        status: (n.status === 'High' ? 'High' : n.status === 'Adequate' ? 'Adequate' : n.status === 'Moderate' ? 'Moderate' : 'Low') as 'Low' | 'Adequate' | 'Moderate' | 'High',
        currentVal: n.currentVal,
        targetVal: n.targetVal,
        unit: n.unit,
      },
      phosphorus: {
        name: p.name,
        symbol: p.symbol,
        status: (p.status === 'High' ? 'High' : p.status === 'Adequate' ? 'Adequate' : p.status === 'Moderate' ? 'Moderate' : 'Low') as 'Low' | 'Adequate' | 'Moderate' | 'High',
        currentVal: p.currentVal,
        targetVal: p.targetVal,
        unit: p.unit,
      },
      potassium: {
        name: k.name,
        symbol: k.symbol,
        status: (k.status === 'High' ? 'High' : k.status === 'Adequate' ? 'Adequate' : k.status === 'Moderate' ? 'Moderate' : 'Low') as 'Low' | 'Adequate' | 'Moderate' | 'High',
        currentVal: k.currentVal,
        targetVal: k.targetVal,
        unit: k.unit,
      },
      ph: {
        value: ph.value,
        label: ph.status === 'Optimal' ? 'Neutral / Optimal' : ph.status,
      },
      organicCarbon: fallbackOc,
      micronutrients: fallbackMicro,
    };
  }, [apiCalculation, crop.soilNutrients, farmerContext]);

  // Derived live nutrient requirements table
  const activeRequirements: NutrientRequirement[] = useMemo(() => {
    if (!apiCalculation?.nutrientRequirements?.length) return crop.requirements;
    return apiCalculation.nutrientRequirements.map((nr) => ({
      nutrient: nr.nutrient,
      symbol: nr.symbol,
      recommended: nr.recommendedRatePerAcre,
      current: nr.currentSoilAvailability,
      additional: nr.additionalNeededPerAcre,
      unit: nr.unit,
    }));
  }, [apiCalculation, crop.requirements]);

  // Derived live recommended fertilizer products with pricing and packaging
  const activeRecommendedProducts = useMemo(() => {
    if (apiCalculation?.recommendedFertilizers?.length) {
      return apiCalculation.recommendedFertilizers.map((rf) => ({
        id: rf.productCode,
        name: rf.name,
        formula: rf.formula,
        composition: rf.composition,
        ratePerAcre: rf.ratePerAcreKg,
        unit: 'kg/acre',
        badge: rf.badge || rf.applicationRole,
        bagColor: rf.bagColor || '#1e56a0',
        description: rf.description,
        category: rf.category,
        packageSizeKg: rf.standardPackageSizeKg,
        packageUnit: rf.packageUnit,
        price: rf.pricePerBagInr,
        isOrganic: rf.isOrganic,
        totalQuantityKg: rf.totalQuantityKg,
        totalBags: rf.totalBags,
        estimatedCostInr: rf.estimatedCostInr,
      }));
    }
    return recommendedProducts;
  }, [apiCalculation, recommendedProducts]);

  // Derived live application timing steps
  const activeTimingSteps: ApplicationStep[] = useMemo(() => {
    if (apiCalculation?.applicationTiming?.length) {
      return apiCalculation.applicationTiming.map((ts) => ({
        step: ts.step,
        title: ts.stageName,
        timing: ts.timingWindow,
        badge: ts.badge,
        details: ts.details + (ts.fertilizersApplied?.length 
          ? ` (${ts.fertilizersApplied.map(f => `${f.productName}: ${f.dosePerAcreKg} kg/ac`).join(', ')})` 
          : ''),
      }));
    }
    return crop.timingSteps;
  }, [apiCalculation, crop.timingSteps]);

  // Derived live agronomic insights
  const activeInsights = useMemo(() => {
    return apiCalculation?.agronomicInsights?.length ? apiCalculation.agronomicInsights : crop.keyInsights;
  }, [apiCalculation, crop.keyInsights]);

  // Derived filtered fertilizer catalog from PostgreSQL API
  const filteredCatalogFertilizers = useMemo(() => {
    const list = dbFertilizers.length > 0 ? dbFertilizers : (crop.products as any[]);
    return list.filter((item: any) => {
      const q = catalogSearchQuery.trim().toLowerCase();
      const matchesQuery = !q ||
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.formula && item.formula.toLowerCase().includes(q)) ||
        (item.composition && item.composition.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q));

      const cat = (item.category || '').toLowerCase();
      let matchesCat = true;
      if (catalogCategoryFilter === 'Primary') {
        matchesCat = cat.includes('primary') || cat.includes('npk');
      } else if (catalogCategoryFilter === 'Secondary') {
        matchesCat = cat.includes('secondary') || item.name.toLowerCase().includes('sulphur') || item.name.toLowerCase().includes('magnesium');
      } else if (catalogCategoryFilter === 'Micronutrient') {
        matchesCat = cat.includes('micro') || item.name.toLowerCase().includes('zinc') || item.name.toLowerCase().includes('boron');
      } else if (catalogCategoryFilter === 'Organic') {
        matchesCat = item.isOrganic === true || cat.includes('organic') || cat.includes('bio');
      }

      return matchesQuery && matchesCat;
    });
  }, [dbFertilizers, crop.products, catalogSearchQuery, catalogCategoryFilter]);

  const catalogCounts = useMemo(() => {
    const list = dbFertilizers.length > 0 ? dbFertilizers : (crop.products as any[]);
    return {
      all: list.length,
      primary: list.filter((f: any) => (f.category || '').toLowerCase().includes('primary') || (f.category || '').toLowerCase().includes('npk')).length,
      secondary: list.filter((f: any) => (f.category || '').toLowerCase().includes('secondary') || f.name.toLowerCase().includes('sulphur') || f.name.toLowerCase().includes('magnesium')).length,
      micro: list.filter((f: any) => (f.category || '').toLowerCase().includes('micro') || f.name.toLowerCase().includes('zinc') || f.name.toLowerCase().includes('boron')).length,
      organic: list.filter((f: any) => f.isOrganic || (f.category || '').toLowerCase().includes('organic')).length,
    };
  }, [dbFertilizers, crop.products]);

  return (
    <div className="fert-advisory-page" id="advisory-overview-root">
      {/* TOAST NOTIFICATION */}
      {showToast && (
        <div className="fert-toast-notification">
          <span className="toast-icon">🌱</span>
          <span className="toast-text">{toastMessage}</span>
          <button className="toast-close" onClick={() => setShowToast(false)}>✕</button>
        </div>
      )}

      {/* TOP CONTROLS ROW */}
      <div className="fert-topbar-nav">
        <button 
          className="fert-back-btn" 
          onClick={onBack || (() => window.history.back())}
          aria-label="Back to dashboard"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Back to Dashboard</span>
        </button>

        <div className="fert-top-tags">
          {isCalculating ? (
            <span className="badge-live-pulse" style={{ background: '#e8f5e9', color: '#2e7d32', borderColor: '#a5d6a7' }}>
              <span className="pulse-indicator"></span>
              Updating Soil Intelligence...
            </span>
          ) : (
            <span className="badge-live-pulse" title={calcError || undefined}>
              <span className="pulse-indicator"></span>
              Soil &amp; Nutrient Intelligence
            </span>
          )}
          <span className="badge-location-pill">📍 {crop.location}</span>
          {onOpenFertilizer && (
            <button 
              className="fert-switch-btn"
              onClick={onOpenFertilizer}
              title="Open full dedicated Fertilizer Recommendation page"
              style={{
                background: '#e8f5e9',
                border: '1px solid #c8e6c9',
                color: '#2e7d32',
                borderRadius: '20px',
                padding: '4px 12px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span>Dedicated Fertilizer View</span>
              <span>→</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================
          HERO BANNER + CROP SELECTION
          ============================================================ */}
      <header className="fert-hero-banner" id="fert-hero-header">
        <div className="fert-banner-leaf-bg"></div>
        <div className="fert-banner-radial-glow"></div>

        <div className="fert-banner-grid">
          {/* Left Column: Titles & Tagline */}
          <div className="fert-banner-left">
            <div className="fert-banner-badge-row">
              <span className="fert-banner-pill">
                <span className="fert-leaf-icon">🌱</span>
                <span>PRECISION AGRONOMY</span>
              </span>
              <span className="fert-season-badge">Soil Health &amp; Crop Intelligence</span>
            </div>

            <h1 className="fert-banner-title">Crop Advisory &amp; Nutrient Intelligence</h1>
            <p className="fert-banner-subtitle">
              Get the right nutrients, in the right quantity, at the right time for higher yield and healthier crops.
            </p>

            <div className="fert-tagline-wrap">
              <span className="fert-tagline-text">"Right Nutrition, Brighter Yields"</span>
              <span className="fert-tagline-leaf">🍃</span>
            </div>
          </div>

          {/* Right Column: Monitored Crop Card */}
          <div className="fert-crop-card-container">
            <div className="fert-monitored-crop-card" id="monitored-crop-card">
              <div className="fert-crop-card-header">
                <div className="fert-monitored-status">
                  <span className="crop-live-dot"></span>
                  <span className="crop-monitored-label">MONITORED CROP</span>
                </div>
                <span className="crop-field-chip">{farmerContext?.farm?.farmName || crop.field}</span>
              </div>

              <div className="fert-crop-card-body">
                <div className="fert-crop-avatar">
                  <img 
                    src={crop.image} 
                    alt={crop.name} 
                    className="fert-crop-img"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="fert-crop-avatar-fallback">🌿</div>
                </div>

                <div className="fert-crop-meta">
                  <div className="crop-name-row">
                    <h2 className="fert-crop-name">{crop.name}</h2>
                    <span className="fert-crop-acres-tag">{farmerContext?.cropCycle?.allocatedAcres ?? crop.acres} Acres</span>
                  </div>
                  <div className="fert-crop-stage">
                    <span className="stage-flower-icon">🌸</span>
                    <span>{farmerContext?.cropCycle?.currentStage ?? crop.stage}</span>
                  </div>
                  <div className="fert-crop-subdetails">
                    <span>{farmerContext?.farm?.farmName ?? crop.field} • {farmerContext?.cropCycle?.allocatedAcres ?? crop.acres} Acres | {(farmerContext?.farmer ? `${farmerContext.farmer.district}, ${farmerContext.farmer.state}` : crop.location).split(',')[0]}</span>
                  </div>
                </div>
              </div>

              <div className="fert-crop-card-footer">
                <button 
                  className="fert-change-crop-btn"
                  id="btn-change-crop"
                  onClick={() => setShowCropModal(true)}
                  aria-label="Change Crop"
                >
                  <span className="dash-minus">−</span>
                  <span>Change Crop</span>
                  <span className="btn-arrow">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================
          SUB-NAVIGATION TABS (Exact Reference UI Design)
          ============================================================ */}
      <nav className="fert-subnav-bar" aria-label="Advisory navigation tabs">
        <button
          className={`fert-subnav-pill ${activeSubTab === 'nutrient-status' ? 'active-pill' : ''}`}
          onClick={() => handleTabClick('nutrient-status')}
          id="tab-nutrient-status"
        >
          <span className="pill-emoji">🌱</span>
          <span>Nutrient Status</span>
        </button>

        <button
          className={`fert-subnav-pill ${activeSubTab === 'recommended-fert' ? 'active-pill' : ''}`}
          onClick={() => handleTabClick('recommended-fert')}
          id="tab-recommended-fert"
        >
          <span className="pill-emoji">🛍️</span>
          <span>Recommended Fertilizer</span>
        </button>

        <button
          className={`fert-subnav-pill ${activeSubTab === 'app-guide' ? 'active-pill' : ''}`}
          onClick={() => handleTabClick('app-guide')}
          id="tab-app-guide"
        >
          <span className="pill-emoji">📄</span>
          <span>Application Guide</span>
        </button>

        <button
          className={`fert-subnav-pill ${activeSubTab === 'calculator' ? 'active-pill' : ''}`}
          onClick={() => handleTabClick('calculator')}
          id="tab-calculator"
        >
          <span className="pill-emoji">🧮</span>
          <span>Fertilizer Calculator</span>
        </button>

        <button
          className={`fert-subnav-pill ${activeSubTab === 'organic-alt' ? 'active-pill' : ''}`}
          onClick={() => handleTabClick('organic-alt')}
          id="tab-organic-alt"
        >
          <span className="pill-emoji">🛡️</span>
          <span>Organic Alternatives</span>
        </button>

        <button
          className={`fert-subnav-pill ${activeSubTab === 'nearby-risks' ? 'active-pill' : ''}`}
          onClick={() => handleTabClick('nearby-risks')}
          id="tab-nearby-risks"
        >
          <span className="pill-emoji">🚨</span>
          <span>Nearby Crop Risks</span>
        </button>
      </nav>

      {/* ============================================================
          TODAY'S ACTIONABLE ADVICE (With "Why This Advice" & "View Action Plan")
          ============================================================ */}
      <section className="advisory-advice-focal-card" id="today-advice-card">
        <div className="advice-focal-accent-line"></div>
        <div className="advice-focal-inner">
          <div className="advice-focal-header">
            <div className="advice-badge-group">
              <span className="advice-pulse-dot"></span>
              <strong className="advice-badge-title">TODAY'S ACTIONABLE ADVICE</strong>
              <span className="advice-badge-sep">•</span>
              <span className="advice-badge-date">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="advice-priority-pill">
              <span>★</span>
              <span>HIGH AGRONOMIC PRIORITY</span>
            </div>
          </div>

          <div className="advice-focal-body">
            <div className="advice-focal-quote-wrap">
              <span className="advice-focal-bulb">💡</span>
              <p className="advice-focal-quote">"{crop.todayAdvice}"</p>
            </div>

            <div className="advice-focal-actions">
              <button 
                className="btn-advice-interactive btn-why"
                id="btn-why-advice"
                onClick={() => setShowWhyModal(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>Why This Advice?</span>
              </button>

              <button 
                className="btn-advice-interactive btn-plan"
                id="btn-view-plan"
                onClick={() => setShowPlanModal(true)}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <span>View Action Plan</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          COMPACT: NEARBY CROP RISK REPORTS
          (Replacing old bulky Risk Forecast card)
          ============================================================ */}
      <section className="nearby-risk-reports-strip" id="section-nearby-risks">
        <div className="nearby-strip-header">
          <div className="nearby-strip-title-group">
            <span className="nearby-radar-icon">🚨</span>
            <div>
              <h2 className="nearby-strip-title">Nearby Crop Risk Reports</h2>
              <p className="nearby-strip-sub">Real-time disease &amp; pest occurrences verified by agronomists around {crop.location}</p>
            </div>
          </div>
          <button 
            className="btn-view-nearby-reports"
            id="btn-view-nearby-reports"
            onClick={() => setShowNearbyModal(true)}
          >
            <span>View All Nearby Reports ({crop.nearbyRiskReports.length})</span>
            <span>→</span>
          </button>
        </div>

        <div className="nearby-reports-compact-grid">
          {crop.nearbyRiskReports.map((report) => (
            <div key={report.id} className="nearby-compact-card">
              <div className="nearby-compact-top">
                <span className="nearby-crop-pill">{report.crop}</span>
                <span className={`nearby-severity-chip severity-${report.severity.toLowerCase()}`}>
                  {report.severity} Alert
                </span>
              </div>
              <h3 className="nearby-threat-title">{report.threat}</h3>
              <div className="nearby-meta-row">
                <span className="nearby-dist-tag">📍 {report.distance}</span>
                <span className="nearby-farms-tag">🏡 {report.farmsAffected} Farms Affected</span>
              </div>
              <p className="nearby-action-hint"><strong>Advised Action:</strong> {report.advisedAction}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================
          MAIN 2x3 PROMINENT SOIL & FERTILIZER GRID (Exact Reference UI)
          ============================================================ */}
      {/* ============================================================
          ROW 1: MAIN FERTILIZER TABLES & CARDS (Single Horizontal Row)
          ============================================================ */}
      <div className="fert-primary-tables-row" id="fert-primary-tables-container">

        {/* ------------------------------------------------------------
            CARD 1: SOIL NUTRIENT STATUS
            ------------------------------------------------------------ */}
        <section 
          className={`fert-card fert-card-soil ${activeSubTab === 'nutrient-status' ? 'card-highlighted' : ''}`}
          id="section-soil-status"
          aria-labelledby="heading-soil-status"
        >
          <div className="fert-card-header">
            <div className="fert-card-title-group">
              <div className="fert-card-icon soil-icon">🧪</div>
              <h2 className="fert-card-title" id="heading-soil-status">Soil Nutrient Status</h2>
            </div>
            <button 
              className="fert-card-link"
              onClick={() => setShowSoilModal(true)}
              id="link-detailed-soil-report"
            >
              <span>View Detailed Soil Report</span>
              <span className="link-arrow">→</span>
            </button>
          </div>

          <div className="fert-card-body">
            {/* Top 3 Status Blocks: Nitrogen, Phosphorus, Potassium */}
            <div className="soil-nutrients-row">
              {/* Nitrogen Block */}
              <div className={`nutrient-status-box box-nitrogen status-${activeSoilNutrients.nitrogen.status.toLowerCase()}`}>
                <div className="nutrient-header">
                  <span className="nutrient-name">Nitrogen</span>
                  <span className={`nutrient-pill ${activeSoilNutrients.nitrogen.status === 'Low' ? 'red-pill' : activeSoilNutrients.nitrogen.status === 'Adequate' ? 'green-pill' : 'amber-pill'}`}>
                    {activeSoilNutrients.nitrogen.status}
                  </span>
                </div>
                <div className="nutrient-value-row">
                  <span className="nutrient-big-val">{activeSoilNutrients.nitrogen.currentVal}</span>
                  <span className="nutrient-unit">{activeSoilNutrients.nitrogen.unit}</span>
                </div>
                <div className="nutrient-target-text">
                  Target: {activeSoilNutrients.nitrogen.targetVal} {activeSoilNutrients.nitrogen.unit}
                </div>
                <div className="nutrient-meter-bar">
                  <div 
                    className="nutrient-meter-fill fill-red" 
                    style={{ width: `${Math.min(100, (activeSoilNutrients.nitrogen.currentVal / Math.max(1, activeSoilNutrients.nitrogen.targetVal)) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Phosphorus Block */}
              <div className={`nutrient-status-box box-phosphorus status-${activeSoilNutrients.phosphorus.status.toLowerCase()}`}>
                <div className="nutrient-header">
                  <span className="nutrient-name">Phosphorus</span>
                  <span className={`nutrient-pill ${activeSoilNutrients.phosphorus.status === 'Low' ? 'red-pill' : activeSoilNutrients.phosphorus.status === 'Adequate' ? 'green-pill' : 'amber-pill'}`}>
                    {activeSoilNutrients.phosphorus.status}
                  </span>
                </div>
                <div className="nutrient-value-row">
                  <span className="nutrient-big-val">{activeSoilNutrients.phosphorus.currentVal}</span>
                  <span className="nutrient-unit">{activeSoilNutrients.phosphorus.unit}</span>
                </div>
                <div className="nutrient-target-text">
                  Target: {activeSoilNutrients.phosphorus.targetVal} {activeSoilNutrients.phosphorus.unit}
                </div>
                <div className="nutrient-meter-bar">
                  <div 
                    className="nutrient-meter-fill fill-green" 
                    style={{ width: `${Math.min(100, (activeSoilNutrients.phosphorus.currentVal / Math.max(1, activeSoilNutrients.phosphorus.targetVal)) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Potassium Block */}
              <div className={`nutrient-status-box box-potassium status-${activeSoilNutrients.potassium.status.toLowerCase()}`}>
                <div className="nutrient-header">
                  <span className="nutrient-name">Potassium</span>
                  <span className={`nutrient-pill ${activeSoilNutrients.potassium.status === 'Low' ? 'red-pill' : activeSoilNutrients.potassium.status === 'Adequate' ? 'green-pill' : 'amber-pill'}`}>
                    {activeSoilNutrients.potassium.status}
                  </span>
                </div>
                <div className="nutrient-value-row">
                  <span className="nutrient-big-val">{activeSoilNutrients.potassium.currentVal}</span>
                  <span className="nutrient-unit">{activeSoilNutrients.potassium.unit}</span>
                </div>
                <div className="nutrient-target-text">
                  Target: {activeSoilNutrients.potassium.targetVal} {activeSoilNutrients.potassium.unit}
                </div>
                <div className="nutrient-meter-bar">
                  <div 
                    className="nutrient-meter-fill fill-amber" 
                    style={{ width: `${Math.min(100, (activeSoilNutrients.potassium.currentVal / Math.max(1, activeSoilNutrients.potassium.targetVal)) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Bottom 3 Metrics Bar: pH, Organic Carbon, Micronutrients */}
            <div className="soil-secondary-bar">
              <div className="secondary-metric-item">
                <span className="secondary-metric-label">pH</span>
                <div className="secondary-metric-val">
                  <strong>{activeSoilNutrients.ph.value}</strong>
                  <span className="secondary-badge badge-neutral">{activeSoilNutrients.ph.label}</span>
                </div>
              </div>

              <div className="secondary-metric-divider"></div>

              <div className="secondary-metric-item">
                <span className="secondary-metric-label">Organic Carbon</span>
                <div className="secondary-metric-val">
                  <strong>{activeSoilNutrients.organicCarbon.value}</strong>
                  <span className="secondary-badge badge-low">{activeSoilNutrients.organicCarbon.label}</span>
                </div>
              </div>

              <div className="secondary-metric-divider"></div>

              <div className="secondary-metric-item">
                <span className="secondary-metric-label">Micronutrients</span>
                <div className="secondary-metric-val">
                  <strong className="text-attention">{activeSoilNutrients.micronutrients.label}</strong>
                  <span className="secondary-subelements">{activeSoilNutrients.micronutrients.elements}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------
            CARD 2: CROP NUTRIENT REQUIREMENT TABLE
            ------------------------------------------------------------ */}
        <section 
          className="fert-card fert-card-requirement" 
          id="section-requirements"
          aria-labelledby="heading-requirements"
        >
          <div className="fert-card-header">
            <div className="fert-card-title-group">
              <div className="fert-card-icon req-icon">📊</div>
              <h2 className="fert-card-title" id="heading-requirements">Crop Nutrient Requirement</h2>
            </div>
            <span className="fert-stage-tag">{crop.stage}</span>
          </div>

          <div className="fert-card-body table-responsive-wrapper">
            <table className="fert-req-table" aria-label="Crop Nutrient Requirement Table">
              <thead>
                <tr>
                  <th scope="col" className="th-nutrient">Nutrient</th>
                  <th scope="col" className="th-num">Recommended <span className="th-unit">(kg/acre)</span></th>
                  <th scope="col" className="th-num">Current <span className="th-unit">(kg/acre)</span></th>
                  <th scope="col" className="th-num th-highlight">Additional Required</th>
                </tr>
              </thead>
              <tbody>
                {activeRequirements.map((row) => (
                  <tr key={row.nutrient} className="req-table-row">
                    <td className="td-nutrient">
                      <div className="nutrient-label-cell">
                        <span className="nutrient-symbol-badge">{row.symbol}</span>
                        <span className="nutrient-full-name">{row.nutrient}</span>
                      </div>
                    </td>
                    <td className="td-num font-mono">{row.recommended}</td>
                    <td className="td-num font-mono text-muted">{row.current}</td>
                    <td className="td-num td-highlight font-mono">
                      <span className="additional-val-badge">
                        +{row.additional} {row.unit.split('/')[0]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ------------------------------------------------------------
            CARD 3: RECOMMENDED FERTILIZER PRODUCTS (With Calculator Trigger)
            ------------------------------------------------------------ */}
        <section 
          className={`fert-card fert-card-products ${activeSubTab === 'recommended-fert' || activeSubTab === 'calculator' ? 'card-highlighted' : ''}`}
          id="section-products"
          aria-labelledby="heading-products"
        >
          <div className="fert-card-header">
            <div className="fert-card-title-group">
              <div className="fert-card-icon prod-icon">🛍️</div>
              <div>
                <h2 className="fert-card-title" id="heading-products">Recommended Fertilizer Products</h2>
                <div className="fert-selected-count-chip">
                  <span className="count-dot"></span>
                  <span>{selectedFertilizers.length} of {activeRecommendedProducts.length} Selected for Plan</span>
                  {apiCalculation?.costSummary ? (
                    <span 
                      style={{
                        marginLeft: '8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: '#e8f5e9',
                        color: '#1b5e20',
                        border: '1px solid #a5d6a7',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Total estimated farm cost from PostgreSQL pricing"
                    >
                      Est. Total Cost: ₹{apiCalculation.costSummary.totalEstimatedCostInr.toLocaleString()} ({apiCalculation.costSummary.totalBagsCount} bags)
                    </span>
                  ) : isDbLoaded ? (
                    <span 
                      style={{
                        marginLeft: '8px',
                        fontSize: '10px',
                        fontWeight: 700,
                        background: '#e8f5e9',
                        color: '#1b5e20',
                        border: '1px solid #a5d6a7',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                      title="Sourced live from certified agricultural catalog"
                    >
                      ✓ Certified
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="fert-card-header-actions">
              <button 
                type="button"
                className="fert-card-calc-btn"
                onClick={() => setShowCalcModal(true)}
                id="btn-open-fert-calculator"
                title="Calculate custom fertilizer quantities based on your field size"
              >
                <span className="calc-btn-icon">🧮</span>
                <span>Fertilizer Calculator</span>
              </button>
              <button 
                className="fert-card-link"
                onClick={() => setShowCatalogModal(true)}
                id="link-view-all-products"
              >
                <span>View All Catalog</span>
                <span className="link-arrow">→</span>
              </button>
            </div>
          </div>

          <div className="fert-card-body">
            {/* Recommended Fertilizers Grid (Top 3 by Default) */}
            <div className="fert-products-grid">
              {activeRecommendedProducts.slice(0, 3).map((prod) => {
                const isSelected = selectedFertilizers.includes(prod.id);
                const calculatedKg = Math.round(effectiveAcres * prod.ratePerAcre * 10) / 10;
                const calculatedBags = Math.ceil(calculatedKg / (prod.packageSizeKg || 50));

                return (
                  <div 
                    key={prod.id} 
                    className={`fert-product-item-card ${isSelected ? 'prod-card-selected' : ''}`} 
                    id={`product-${prod.id}`}
                  >
                    <div className="fert-bag-container">
                      <div className="fertilizer-bag-graphic" style={{ borderColor: prod.bagColor }}>
                        <div className="bag-top-crease"></div>
                        <div className="bag-stripe" style={{ backgroundColor: prod.bagColor }}>
                          <span className="bag-stripe-text">{prod.name}</span>
                        </div>
                        <div className="bag-body-content">
                          <span className="bag-grade-text">{prod.composition}</span>
                          <span className="bag-weight-sub">{prod.packageSizeKg || 50} {prod.packageUnit || 'KG'} NET</span>
                        </div>
                      </div>
                    </div>

                    <div className="fert-product-info">
                      <div className="prod-name-row">
                        <h3 className="fert-prod-title">{prod.name}</h3>
                        <span className="fert-prod-badge" style={{ color: prod.bagColor, borderColor: `${prod.bagColor}40` }}>
                          {prod.badge}
                        </span>
                      </div>
                      <div className="fert-prod-formula">{prod.composition}</div>
                      
                      <div className="fert-prod-dosage-box">
                        <div className="dosage-rate-line">
                          <span className="dosage-label">Recommended Rate:</span>
                          <span className="dosage-num">{prod.ratePerAcre} {prod.unit}</span>
                        </div>

                        {isSelected && (
                          <div className="fert-card-calculated-dosage">
                            <span className="calc-dosage-tag">Total for {fieldSize} {fieldUnit}:</span>
                            <div className="calc-dosage-result">
                              <strong className="calc-bold-kg">{calculatedKg} kg</strong>
                              <span className="calc-bold-bags">({calculatedBags} bag{calculatedBags > 1 ? 's' : ''})</span>
                            </div>
                            {prod.price ? (
                              <div className="calc-cost-estimate" style={{ marginTop: '5px', fontSize: '11px', color: '#1b5e20', fontWeight: 600 }}>
                                Est. Cost: ₹{(calculatedBags * prod.price).toLocaleString()} (@₹{prod.price}/bag)
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>

                      {/* Select / Add to Plan button */}
                      <button 
                        type="button"
                        className={`btn-add-plan ${isSelected ? 'btn-added' : ''}`}
                        onClick={() => handleToggleFertilizer(prod.id, prod.name)}
                        id={`btn-select-${prod.id}`}
                        aria-pressed={isSelected}
                      >
                        {isSelected ? (
                          <>
                            <span className="check-mark">✓</span>
                            <span>Selected for Plan</span>
                          </>
                        ) : (
                          <>
                            <span className="plus-sign">+</span>
                            <span>Select / Add to Plan</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* View More Fertilizers Option */}
            <div className="fert-view-more-container" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn-view-more-fertilizers"
                onClick={() => setShowCatalogModal(true)}
                id="btn-view-more-fertilizers"
              >
                <span style={{ fontSize: '18px' }}>🛍️</span>
                <span>View More Fertilizers ({dbFertilizers.length || 10} Available in Database Catalog)</span>
                <span style={{ fontSize: '16px', fontWeight: 800 }}>→</span>
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* ============================================================
          ROW 2: SECONDARY AGRONOMIC GUIDANCE & APPLICATION TIMING
          ============================================================ */}
      <div className="fert-secondary-insights-row" id="fert-secondary-insights-container">

        {/* ------------------------------------------------------------
            CARD A: KEY INSIGHTS
            ------------------------------------------------------------ */}
        <section 
          className="fert-card fert-card-insights" 
          id="section-insights"
          aria-labelledby="heading-insights"
        >
          <div className="fert-card-header">
            <div className="fert-card-title-group">
              <div className="fert-card-icon insight-icon">💡</div>
              <h2 className="fert-card-title" id="heading-insights">Key Insights</h2>
            </div>
            <span className="ai-badge-pill">
              <span className="ai-sparkle">🤖</span>
              <span>AI Powered</span>
            </span>
          </div>

          <div className="fert-card-body insights-body-layout">
            <ul className="insights-checklist">
              {activeInsights.map((insight, idx) => (
                <li key={idx} className="insight-item">
                  <div className="insight-check-circle">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="insight-text">{insight}</p>
                </li>
              ))}
            </ul>

            <div className="insights-callout-box">
              <div className="callout-icon-col">
                <span className="callout-bulb">💡</span>
              </div>
              <div className="callout-content-col">
                <p className="callout-text">{crop.calloutMessage}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------
            CARD B: APPLICATION TIMING & SAFETY TIPS
            ------------------------------------------------------------ */}
        <section 
          className={`fert-card fert-card-timing ${activeSubTab === 'app-guide' ? 'card-highlighted' : ''}`}
          id="section-timing-tips"
          aria-labelledby="heading-timing-tips"
        >
          <div className="fert-card-header">
            <div className="fert-card-title-group">
              <div className="fert-card-icon timing-icon">🕒</div>
              <h2 className="fert-card-title" id="heading-timing-tips">Application Timing &amp; Safety Tips</h2>
            </div>
            <span className="timing-calendar-chip">Season Schedule</span>
          </div>

          <div className="fert-card-body timing-body-layout">
            <div className="timing-steps-track">
              {activeTimingSteps.map((step) => (
                <div key={step.step} className="timing-step-node">
                  <div className="timing-step-num-col">
                    <div className="step-num-circle">{step.step}</div>
                    {step.step < crop.timingSteps.length && <div className="step-connector-line"></div>}
                  </div>

                  <div className="timing-step-content">
                    <div className="step-header-row">
                      <h3 className="step-title">{step.title}</h3>
                      <span className="step-timing-badge">{step.timing}</span>
                    </div>
                    <p className="step-detail-text">{step.details}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="fert-safety-box">
              <div className="safety-box-header">
                <div className="safety-icon-title">
                  <span className="shield-icon">🛡️</span>
                  <span className="safety-title">Safety Tips</span>
                </div>
                <span className="safety-leaf-accent">🌿</span>
              </div>

              <ul className="safety-tips-list">
                {crop.safetyTips.map((tip, idx) => (
                  <li key={idx} className="safety-tip-item">
                    <span className="safety-bullet-dot">✓</span>
                    <span className="safety-tip-text">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

      </div>

      {/* ============================================================
          SECTION: ORGANIC ALTERNATIVES
          ============================================================ */}
      <section 
        className={`fert-organic-section ${activeSubTab === 'organic-alt' ? 'card-highlighted' : ''}`}
        id="section-organic"
      >
        <div className="organic-section-header">
          <div className="organic-header-left">
            <div className="fert-card-icon organic-icon">🌱</div>
            <div>
              <h2 className="organic-section-title">Organic &amp; Regenerative Alternatives</h2>
              <p className="organic-section-sub">Eco-friendly biological supplements for long-term soil carbon and microbial vitality</p>
            </div>
          </div>
          <span className="organic-badge-pill">100% Bio-Certified</span>
        </div>

        <div className="organic-cards-grid">
          {crop.organicAlternatives.map((alt, i) => (
            <div key={i} className="organic-alt-card">
              <div className="organic-card-top">
                <span className="organic-type-tag">{alt.type}</span>
                <span className="organic-dosage-chip">Dosage: {alt.dosage}</span>
              </div>
              <h3 className="organic-name">{alt.name}</h3>
              <p className="organic-benefit">{alt.benefit}</p>
              <button 
                type="button"
                className="btn-learn-organic"
                onClick={() => setSelectedOrganicGuide(alt)}
                id={`btn-guide-${i}`}
              >
                <span>View Preparation Guide</span>
                <span>→</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================
          MODAL: CHANGE CROP SELECTION
          ============================================================ */}
      {showCropModal && (
        <div className="fert-modal-overlay" onClick={() => setShowCropModal(false)}>
          <div className="fert-modal-container crop-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fert-modal-header">
              <div className="modal-title-wrap">
                <span className="modal-icon">🌾</span>
                <div>
                  <h3 className="fert-modal-title">Select Active Crop</h3>
                  <p className="fert-modal-desc">Switch monitored crop to view tailor-made nutrient plans</p>
                </div>
              </div>
              <button className="fert-modal-close" onClick={() => setShowCropModal(false)}>✕</button>
            </div>

            <div className="fert-modal-body">
              <div className="crop-options-grid">
                {Object.values(ADVISORY_DATA).map((c) => (
                  <div
                    key={c.id}
                    className={`crop-option-item ${selectedCropId === c.id ? 'crop-option-selected' : ''}`}
                    onClick={() => handleSelectCrop(c.id)}
                    id={`select-crop-${c.id}`}
                  >
                    <div className="crop-option-thumb">
                      <img src={c.image} alt={c.name} className="crop-option-img" />
                    </div>
                    <div className="crop-option-info">
                      <div className="crop-option-title-row">
                        <strong className="crop-option-name">{c.name}</strong>
                        {selectedCropId === c.id && <span className="crop-active-badge">Active</span>}
                      </div>
                      <span className="crop-option-stage">{c.stage}</span>
                      <span className="crop-option-meta">{c.field} • {c.acres} Acres</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="fert-modal-footer">
              <button className="btn-modal-cancel" onClick={() => setShowCropModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: WHY THIS ADVICE?
          ============================================================ */}
      {showWhyModal && (
        <div className="fert-modal-overlay" onClick={() => setShowWhyModal(false)}>
          <div className="fert-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="fert-modal-header">
              <div className="modal-title-wrap">
                <span className="modal-icon">🧠</span>
                <div>
                  <h3 className="fert-modal-title">Why This Advice?</h3>
                  <p className="fert-modal-desc">AI-driven agronomy reasoning based on real-time soil &amp; crop metrics</p>
                </div>
              </div>
              <button className="fert-modal-close" onClick={() => setShowWhyModal(false)}>✕</button>
            </div>

            <div className="fert-modal-body">
              <div className="advice-modal-quote-box">
                <span className="modal-quote-leaf">🌿</span>
                <p className="modal-quote-text">"{crop.todayAdvice}"</p>
              </div>

              <h4 className="advice-factors-title">Key Influencing Agronomic Factors</h4>

              <div className="advice-factors-list">
                <div className="advice-factor-card">
                  <div className="factor-icon-squircle blue-tint">🧪</div>
                  <div className="factor-info">
                    <strong>Critical Nitrogen &amp; Mineral Deficit</strong>
                    <p>Current Nitrogen is tested at {crop.soilNutrients.nitrogen.currentVal} kg/acre ({crop.soilNutrients.nitrogen.status}). Immediate application prevents flower abortion and sustains vibrant leaf photosynthesis.</p>
                  </div>
                </div>

                <div className="advice-factor-card">
                  <div className="factor-icon-squircle green-tint">🌸</div>
                  <div className="factor-info">
                    <strong>Crop Growth Phase: {crop.stage}</strong>
                    <p>Crop is currently in {crop.stage} ({crop.stageDays}). Balanced split application ensures high flower-to-fruit conversion ratio.</p>
                  </div>
                </div>

                <div className="advice-factor-card">
                  <div className="factor-icon-squircle amber-tint">💧</div>
                  <div className="factor-info">
                    <strong>Root Zone Uptake Optimization</strong>
                    <p>Light drip irrigation before 10 AM ensures fertilizer nutrients dissolve right into active root hairs without volatilization losses.</p>
                  </div>
                </div>

                <div className="advice-factor-card">
                  <div className="factor-icon-squircle purple-tint">📈</div>
                  <div className="factor-info">
                    <strong>Economic Return on Investment</strong>
                    <p>Addressing the additional nutrient deficit timely protects an estimated 20–25% marketable produce value.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="fert-modal-footer">
              <button className="btn-modal-action" onClick={() => setShowWhyModal(false)}>Understood</button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: AGRONOMIC ACTION PLAN
          ============================================================ */}
      {showPlanModal && (() => {
        // Active selected fertilizers (enriched with recommendation API calculations & live DB data)
        const getUpcomingDate = (weekNum: number, dayIndex: number) => {
          const now = new Date();
          const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
          const daysUntilMonday = (8 - dayOfWeek) % 7;
          const week1Monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilMonday);
          const targetDate = new Date(week1Monday.getFullYear(), week1Monday.getMonth(), week1Monday.getDate() + ((weekNum - 1) * 7 + dayIndex));
          const dayName = targetDate.toLocaleDateString('en-IN', { weekday: 'long' });
          const dayShort = targetDate.toLocaleDateString('en-IN', { weekday: 'short' });
          const fullDate = targetDate.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
          const shortDate = targetDate.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
          });
          return {
            dateObj: targetDate,
            dayName,
            dayShort,
            fullDate,
            shortDate,
          };
        };

        const seenSelectedIds = new Set<string>();
        const activeSelectedProducts = selectedFertilizers
          .map((rawId) => {
            const id = (rawId || '').toLowerCase().trim();
            if (!id || seenSelectedIds.has(id)) return null;

            const rec = activeRecommendedProducts.find((p) => (p.id || '').toLowerCase() === id);
            if (rec) {
              seenSelectedIds.add(id);
              return rec;
            }

            const dbItem = dbFertilizers.find((p: any) => ((p.productCode || p.id) || '').toLowerCase() === id);
            if (dbItem) {
              seenSelectedIds.add(id);
              const pkgSize = dbItem.packageSizeKg || 50;
              const ratePerAcre = (dbItem as any).ratePerAcre || 25;
              const totalKg = Math.round(effectiveAcres * ratePerAcre * 10) / 10;
              const totalBags = Math.ceil(totalKg / pkgSize);
              return {
                id: dbItem.productCode || dbItem.id,
                name: dbItem.name,
                formula: dbItem.formula || dbItem.category || '',
                composition: dbItem.composition || '',
                ratePerAcre,
                unit: 'kg/acre',
                badge: dbItem.category || 'Specialized Nutrient',
                bagColor: '#2e7d32',
                description: dbItem.description || '',
                category: dbItem.category || '',
                packageSizeKg: pkgSize,
                packageUnit: dbItem.packageUnit || 'kg',
                price: dbItem.price || 0,
                isOrganic: dbItem.isOrganic,
                totalQuantityKg: totalKg,
                totalBags: totalBags,
                estimatedCostInr: totalBags * (dbItem.price || 0),
              };
            }

            const cropItem = crop.products.find((p) => (p.id || '').toLowerCase() === id);
            if (cropItem) {
              seenSelectedIds.add(id);
              const totalKg = Math.round(effectiveAcres * cropItem.ratePerAcre * 10) / 10;
              return {
                ...cropItem,
                totalQuantityKg: totalKg,
                totalBags: Math.ceil(totalKg / 50),
              };
            }
            return null;
          })
          .filter(Boolean) as any[];

        interface FertilizerSlotAction {
          id: string;
          prodId: string;
          name: string;
          formula: string;
          composition: string;
          badge: string;
          bagColor: string;
          splitTitle: string;
          quantityKg: number;
          bags: number;
          rateText: string;
          applicationDate: string;
          dayName: string;
          dateObj: Date;
          applicationMethod: string;
          recommendedTiming: string;
          precautions: string;
          weekNum: number;
          dayIndex: number;
        }

        const scheduledSlots: Record<string, FertilizerSlotAction> = {};

        const extraSlotQueue: { weekNum: number; dayIndex: number }[] = [
          { weekNum: 1, dayIndex: 4 },
          { weekNum: 2, dayIndex: 0 },
          { weekNum: 2, dayIndex: 3 },
          { weekNum: 3, dayIndex: 3 },
          { weekNum: 4, dayIndex: 0 },
          { weekNum: 4, dayIndex: 2 },
          { weekNum: 4, dayIndex: 4 },
        ];

        activeSelectedProducts.forEach((prod) => {
          // Use precision API calculated quantities if available from recommendation engine
          const calculatedKg = prod.totalQuantityKg !== undefined && prod.totalQuantityKg !== null
            ? prod.totalQuantityKg
            : Math.round(effectiveAcres * prod.ratePerAcre * 10) / 10;
          const calculatedBags = prod.totalBags !== undefined && prod.totalBags !== null
            ? prod.totalBags
            : Math.ceil(calculatedKg / (prod.packageSizeKg || 50));

          const id = (prod.id || '').toLowerCase();
          const nameLower = (prod.name || '').toLowerCase();

          if (id.includes('urea') || nameLower.includes('urea')) {
            const split1Kg = Math.round(calculatedKg * 0.6 * 10) / 10;
            const split1Bags = Math.max(1, Math.ceil(split1Kg / (prod.packageSizeKg || 50)));
            const split2Kg = Math.round((calculatedKg - split1Kg) * 10) / 10;
            const split2Bags = Math.max(1, Math.ceil(split2Kg / (prod.packageSizeKg || 50)));

            // Week 1 Day 1 (Today: Split 1 - Basal)
            const d0 = getUpcomingDate(1, 0);
            scheduledSlots['w1-d0'] = {
              id: `${prod.id}-split1`,
              prodId: prod.id,
              name: prod.name,
              formula: prod.formula || 'CO(NH₂)₂',
              composition: prod.composition || '46% N',
              badge: prod.badge || 'Basal Fertigation',
              bagColor: prod.bagColor || '#1e56a0',
              splitTitle: '1st Split Dose (60% Basal Fertigation)',
              quantityKg: split1Kg,
              bags: split1Bags,
              rateText: `${Math.round(prod.ratePerAcre * 0.6)} ${prod.unit || 'kg/acre'}`,
              applicationDate: d0.fullDate,
              dayName: d0.dayName,
              dateObj: d0.dateObj,
              applicationMethod: 'Drip fertigation or furrow band placement 5–8 cm from plant stem, followed by light drip cycle.',
              recommendedTiming: 'Early morning (6:30 AM – 9:00 AM) before soil heats up.',
              precautions: 'Do not apply under intense midday heat (> 32°C). Avoid application before heavy rain to prevent ammonia volatilization and leaching.',
              weekNum: 1,
              dayIndex: 0,
            };

            // Week 3 Day 2 (Split 2 - Flowering Boost)
            const w3d1 = getUpcomingDate(3, 1);
            scheduledSlots['w3-d1'] = {
              id: `${prod.id}-split2`,
              prodId: prod.id,
              name: prod.name,
              formula: prod.formula || 'CO(NH₂)₂',
              composition: prod.composition || '46% N',
              badge: prod.badge || 'Flowering Boost',
              bagColor: prod.bagColor || '#1e56a0',
              splitTitle: '2nd Split Dose (40% Flowering Boost)',
              quantityKg: split2Kg,
              bags: split2Bags,
              rateText: `${Math.round(prod.ratePerAcre * 0.4)} ${prod.unit || 'kg/acre'}`,
              applicationDate: w3d1.fullDate,
              dayName: w3d1.dayName,
              dateObj: w3d1.dateObj,
              applicationMethod: 'Side-dress into moist furrow soil along root drip-line or inject via irrigation manifold.',
              recommendedTiming: 'Morning hours (7:00 AM – 9:30 AM).',
              precautions: 'Ensure uniform soil moisture before application. Avoid direct leaf contact with concentrated granules to prevent scorch.',
              weekNum: 3,
              dayIndex: 1,
            };
          } else if (id.includes('dap') || id.includes('ssp') || nameLower.includes('phosphate')) {
            // Week 1 Day 4 (Basal Foundation)
            const w1d3 = getUpcomingDate(1, 3);
            scheduledSlots['w1-d3'] = {
              id: `${prod.id}-full`,
              prodId: prod.id,
              name: prod.name,
              formula: prod.formula || '18% N, 46% P₂O₅',
              composition: prod.composition || '18-46-0',
              badge: prod.badge || 'Root Foundation',
              bagColor: prod.bagColor || '#e67e22',
              splitTitle: 'Full Dose (Root & Phosphorus Foundation)',
              quantityKg: calculatedKg,
              bags: calculatedBags,
              rateText: `${prod.ratePerAcre} ${prod.unit || 'kg/acre'}`,
              applicationDate: w1d3.fullDate,
              dayName: w1d3.dayName,
              dateObj: w1d3.dateObj,
              applicationMethod: 'Deep band placement (5–8 cm depth) along root line followed by moist furrow coverage.',
              recommendedTiming: 'Morning hours (7:00 AM – 10:00 AM) into moist soil bed.',
              precautions: 'Do not place directly touching tender root crowns or seeds to prevent ammonium injury. Follow with light watering.',
              weekNum: 1,
              dayIndex: 3,
            };
          } else if (id.includes('mop') || id.includes('potash') || nameLower.includes('potassium')) {
            // Week 2 Day 3 (Fruit Quality & Hardiness)
            const w2d2 = getUpcomingDate(2, 2);
            scheduledSlots['w2-d2'] = {
              id: `${prod.id}-full`,
              prodId: prod.id,
              name: prod.name,
              formula: prod.formula || 'KCl (60% K₂O)',
              composition: prod.composition || '0-0-60',
              badge: prod.badge || 'Fruit Hardiness & Sugar',
              bagColor: prod.bagColor || '#c0392b',
              splitTitle: 'Full Dose (Fruit Quality, Brix & Drought Hardiness)',
              quantityKg: calculatedKg,
              bags: calculatedBags,
              rateText: `${prod.ratePerAcre} ${prod.unit || 'kg/acre'}`,
              applicationDate: w2d2.fullDate,
              dayName: w2d2.dayName,
              dateObj: w2d2.dateObj,
              applicationMethod: 'Side-dress into moist furrows or broadcast evenly followed by immediate light drip irrigation.',
              recommendedTiming: 'Late afternoon (4:30 PM – 6:30 PM) or early morning.',
              precautions: 'Ensure adequate soil moisture prior to application. Irrigate within 6–12 hours to prevent localized salt concentration.',
              weekNum: 2,
              dayIndex: 2,
            };
          } else if (id.includes('bentonite') || (id.includes('sulphur') && !id.includes('zinc'))) {
            // Week 2 Day 6 (Secondary Nutrients & Chlorophyll)
            const w2d5 = getUpcomingDate(2, 5);
            scheduledSlots['w2-d5'] = {
              id: `${prod.id}-full`,
              prodId: prod.id,
              name: prod.name,
              formula: prod.formula || '90% Elemental Sulphur',
              composition: prod.composition || '90% S',
              badge: prod.badge || 'Soil Health & Oil',
              bagColor: prod.bagColor || '#f39c12',
              splitTitle: 'Full Dose (Elemental Sulphur & Soil Conditioner)',
              quantityKg: calculatedKg,
              bags: calculatedBags,
              rateText: `${prod.ratePerAcre} ${prod.unit || 'kg/acre'}`,
              applicationDate: w2d5.fullDate,
              dayName: w2d5.dayName,
              dateObj: w2d5.dateObj,
              applicationMethod: 'Even surface broadcast followed by light furrow hoeing and incorporation into topsoil.',
              recommendedTiming: 'Morning (7:30 AM – 9:30 AM).',
              precautions: 'Do not mix directly with concentrated phosphate fertilizers to prevent chemical lock-up. Wear gloves and eye protection.',
              weekNum: 2,
              dayIndex: 5,
            };
          } else if (id.includes('mgso4') || nameLower.includes('magnesium')) {
            // Week 2 Day 1 or Week 1 Day 6
            const targetSlot = !scheduledSlots['w2-d0'] ? { w: 2, d: 0 } : { w: 1, d: 5 };
            const slotKey = `w${targetSlot.w}-d${targetSlot.d}`;
            const targetDateInfo = getUpcomingDate(targetSlot.w, targetSlot.d);
            scheduledSlots[slotKey] = {
              id: `${prod.id}-full`,
              prodId: prod.id,
              name: prod.name,
              formula: prod.formula || 'MgSO₄·7H₂O',
              composition: prod.composition || '9.6% Mg, 12% S',
              badge: prod.badge || 'Chlorophyll Activator',
              bagColor: prod.bagColor || '#00897b',
              splitTitle: 'Full Dose (Chlorophyll & Photosynthesis Boost)',
              quantityKg: calculatedKg,
              bags: calculatedBags,
              rateText: `${prod.ratePerAcre} ${prod.unit || 'kg/acre'}`,
              applicationDate: targetDateInfo.fullDate,
              dayName: targetDateInfo.dayName,
              dateObj: targetDateInfo.dateObj,
              applicationMethod: 'Drip fertigation or soil drench around the rhizosphere after light irrigation.',
              recommendedTiming: 'Morning (8:00 AM – 10:00 AM).',
              precautions: 'Do not combine with calcium-rich solutions to prevent insoluble calcium sulphate precipitation.',
              weekNum: targetSlot.w,
              dayIndex: targetSlot.d,
            };
          } else if (id.includes('micro') || id.includes('zinc') || id.includes('boron') || nameLower.includes('chelate')) {
            // Week 3 Day 5 (Micronutrient Foliar Correction)
            const w3d4 = getUpcomingDate(3, 4);
            scheduledSlots['w3-d4'] = {
              id: `${prod.id}-full`,
              prodId: prod.id,
              name: prod.name,
              formula: prod.formula || 'ZnSO₄·7H₂O (21% Zn)',
              composition: prod.composition || '21% Zn, 10% S',
              badge: prod.badge || 'Foliar Chelate',
              bagColor: prod.bagColor || '#0288d1',
              splitTitle: 'Full Dose (Micronutrient Foliar Chelate Correction)',
              quantityKg: calculatedKg,
              bags: calculatedBags,
              rateText: `${prod.ratePerAcre} ${prod.unit || 'kg/acre'}`,
              applicationDate: w3d4.fullDate,
              dayName: w3d4.dayName,
              dateObj: w3d4.dateObj,
              applicationMethod: 'Foliar spray (2–3 g/L water) using fine hollow-cone mist nozzle, thoroughly wetting leaf surfaces.',
              recommendedTiming: 'Calm early morning (wind speed < 8 km/h).',
              precautions: 'Always wear protective face mask and gloves. Avoid spraying during active flower pollination hours.',
              weekNum: 3,
              dayIndex: 4,
            };
          } else {
            // Allocate next open extra slot
            const nextSlot = extraSlotQueue.find((s) => !scheduledSlots[`w${s.weekNum}-d${s.dayIndex}`]) || { weekNum: 4, dayIndex: 4 };
            const slotKey = `w${nextSlot.weekNum}-d${nextSlot.dayIndex}`;
            const targetDateInfo = getUpcomingDate(nextSlot.weekNum, nextSlot.dayIndex);
            scheduledSlots[slotKey] = {
              id: `${prod.id}-full`,
              prodId: prod.id,
              name: prod.name,
              formula: prod.formula || prod.composition || 'Custom',
              composition: prod.composition || 'Specialized formulation',
              badge: prod.badge || 'Supplementary Nutrient',
              bagColor: prod.bagColor || '#2e7d32',
              splitTitle: 'Full Dose (Targeted Nutrition Application)',
              quantityKg: calculatedKg,
              bags: calculatedBags,
              rateText: `${prod.ratePerAcre} ${prod.unit || 'kg/acre'}`,
              applicationDate: targetDateInfo.fullDate,
              dayName: targetDateInfo.dayName,
              dateObj: targetDateInfo.dateObj,
              applicationMethod: 'Side-dress along crop root perimeter in moist furrows or inject via drip.',
              recommendedTiming: 'Early morning (7:00 AM – 9:30 AM).',
              precautions: 'Ensure adequate root zone moisture before application. Store in dry, sealed containers.',
              weekNum: nextSlot.weekNum,
              dayIndex: nextSlot.dayIndex,
            };
          }
        });

        const ROUTINE_ACTIVITIES: Record<number, { category: string; icon: string; title: string; description: string }[]> = {
          1: [
            { category: 'Watering', icon: '💧', title: 'Rhizosphere Drip Hydration', description: 'Run light morning drip cycle (1.5 hrs) to verify emitter flow and saturate the root zone prior to weekly field work.' },
            { category: 'Watering', icon: '💧', title: 'Hydration & Nutrient Mobilization', description: 'Run light drip irrigation (45–60 mins) to activate soil moisture and facilitate root nutrient uptake without causing waterlogging.' },
            { category: 'Scouting', icon: '🔍', title: 'Canopy & Leaf Spot Inspection', description: 'Inspect lower leaf quadrants for dark brown concentric spots (Early Blight) or signs of sap-sucking insects on leaf undersides.' },
            { category: 'Maintenance', icon: '🌿', title: 'Inter-Row Weed Clearance', description: 'Remove competing weeds along furrow shoulders and aerate topsoil without disturbing shallow feeder roots.' },
            { category: 'SoilHealth', icon: '🌡️', title: 'Soil Moisture & Aeration Audit', description: 'Check tensiometer readings (optimal 65–75% field capacity) to verify steady moisture penetration to 15 cm depth.' },
            { category: 'Scouting', icon: '🔍', title: 'Pest Surveillance & Trap Count', description: 'Audit yellow sticky traps and pheromone traps for whitefly or moth density; record count to guide IPM thresholds.' },
            { category: 'Review', icon: '📊', title: 'Weekly Canopy Growth Audit', description: 'Measure vegetative shoot elongation, observe leaf greening index, and verify supplies for next application.' },
          ],
          2: [
            { category: 'Watering', icon: '💧', title: 'Scheduled Morning Drip Cycle', description: 'Deliver 2-hour morning irrigation run followed by drip lateral flush to prevent salt accumulation in root beds.' },
            { category: 'Maintenance', icon: '🌿', title: 'Preventive Canopy Hygiene', description: 'Prune yellowed bottom senescent leaves and inspect side-suckers to enhance air movement and reduce humidity.' },
            { category: 'Scouting', icon: '🔍', title: 'Internode & Flowering Check', description: 'Examine main stem internode spacing, count flower clusters per plant, and evaluate blossom retention vigor.' },
            { category: 'Watering', icon: '💧', title: 'Post-Nutrient Deep Soak', description: 'Deliver clean irrigation water to drive solubilized nutrients down into active root capillary feeding zones.' },
            { category: 'Maintenance', icon: '🌿', title: 'Staking & Trellis Support', description: 'Check branch support strings or bamboo stakes to prevent heavy bearing branches from touching wet furrow soil.' },
            { category: 'SoilHealth', icon: '🌡️', title: 'Root Perimeter Aeration Check', description: 'Check soil compaction along furrow ridges; adjust drainage channels to ensure fast water run-off in case of rainfall.' },
            { category: 'Review', icon: '📊', title: 'Mid-Stage Milestone Review', description: 'Assess fruit set and boll retention progress; review nutrient response compared against seasonal benchmarks.' },
          ],
          3: [
            { category: 'Watering', icon: '💧', title: 'Morning Drip Hydration', description: 'Maintain calibrated drip schedule to satisfy peak transpiration demands during fruit development.' },
            { category: 'Scouting', icon: '🔍', title: 'Flowering & Pest Audit', description: 'Audit flower clusters for thrips and evaluate whether preventive biological neem spray (10,000 ppm) is warranted.' },
            { category: 'Watering', icon: '💧', title: 'Light Irrigation & Runoff Check', description: 'Run brief watering cycle ensuring zero standing puddles in furrow ends to avert root rot pathogens.' },
            { category: 'Maintenance', icon: '🌿', title: 'Furrow Earthing-Up Operation', description: 'Mound loose moist soil around plant stems to support root anchorage and prevent lodging from wind.' },
            { category: 'Scouting', icon: '🔍', title: 'Foliar Micronutrient Audit', description: 'Examine upper young leaves for interveinal chlorosis (Iron/Zinc deficit) or leaf tip scorch.' },
            { category: 'Maintenance', icon: '🌿', title: 'Field Sanitation & Debris Removal', description: 'Collect and remove aborted blossoms, yellowed foliage, and debris from walkways to keep pests at bay.' },
            { category: 'Review', icon: '📊', title: 'Week 3 Growth Audit', description: 'Measure fruit/boll sizing uniformity across sample rows and prepare final week schedule.' },
          ],
          4: [
            { category: 'Watering', icon: '💧', title: 'Controlled Drip Hydration', description: 'Deliver calibrated water volume to maintain soil tension and avoid skin cracking in swelling fruits.' },
            { category: 'Maintenance', icon: '🌿', title: 'Organic Bio-Stimulant Drench', description: 'Apply natural compost tea or Jeevamrutha drench through irrigation lines to revitalize beneficial soil microbes.' },
            { category: 'Scouting', icon: '🔍', title: 'Fruit Firmness & Color Break Check', description: 'Inspect mature fruits for skin gloss, firmness, and inspect for fruit borer or caterpillar pinholes.' },
            { category: 'Watering', icon: '💧', title: 'Moisture Stabilization', description: 'Maintain consistent furrow moisture to prevent sudden osmotic shock and premature flower drop.' },
            { category: 'Maintenance', icon: '🌿', title: 'Harvest Readiness & Row Clearance', description: 'Ensure clean, unobstructed furrow rows for harvesting crates and inspect initial picking batches.' },
            { category: 'Scouting', icon: '🔍', title: 'Pre-Harvest Grading Inspection', description: 'Sample 10 plants per row to evaluate size grades, skin shine, and ensure zero pesticide residue period is honored.' },
            { category: 'Review', icon: '📋', title: 'Monthly Action Plan Completion Audit', description: 'Review total fertilizer efficiency, record yield forecast, and update seasonal farm logs for the next stage.' },
          ],
        };

        const WEEKS_METADATA = [
          { num: 1, title: 'Week 1', focus: 'Basal Nutrition & Early Root Establishment' },
          { num: 2, title: 'Week 2', focus: 'Canopy Expansion & Vegetative Support' },
          { num: 3, title: 'Week 3', focus: 'Flowering Peak & Yield Boost' },
          { num: 4, title: 'Week 4', focus: 'Fruit Sizing & Harvest Preparation' },
        ];

        // Identify today's fertilizer status and next upcoming fertilizer application
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const isSameCalendarDay = (d1: Date, d2: Date) =>
          d1.getFullYear() === d2.getFullYear() &&
          d1.getMonth() === d2.getMonth() &&
          d1.getDate() === d2.getDate();

        // Sort all scheduled actions strictly chronologically
        const allScheduledActions = Object.entries(scheduledSlots)
          .map(([slotKey, action]) => ({ slotKey, ...action }))
          .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

        // Check if any scheduled fertilizer action is specifically scheduled for today's calendar date
        const todayAction = allScheduledActions.find((a) => isSameCalendarDay(a.dateObj, now)) || null;

        // Next upcoming action: the chronologically next action after today (or the first upcoming action if today has no fert)
        let nextUpcomingAction: (FertilizerSlotAction & { slotKey: string }) | null = null;
        if (todayAction) {
          nextUpcomingAction =
            allScheduledActions.find(
              (a) => a.dateObj.getTime() > startOfToday.getTime() && a.slotKey !== todayAction.slotKey
            ) || null;
        } else {
          nextUpcomingAction =
            allScheduledActions.find((a) => a.dateObj.getTime() >= startOfToday.getTime()) ||
            allScheduledActions[0] ||
            null;
        }
        const nextUpcomingKey = nextUpcomingAction ? nextUpcomingAction.slotKey : null;

        const weeksToRender = activeWeekTab === 0 ? WEEKS_METADATA : WEEKS_METADATA.filter((w) => w.num === activeWeekTab);

        return (
          <div className="fert-modal-overlay" onClick={() => setShowPlanModal(false)}>
            <div className="fert-modal-container plan-modal-expanded" onClick={(e) => e.stopPropagation()}>
              <div className="fert-modal-header">
                <div className="modal-title-wrap">
                  <span className="modal-icon">📋</span>
                  <div>
                    <h3 className="fert-modal-title">Agronomic Action Plan &amp; Weekly Schedule</h3>
                    <div className="plan-header-meta">
                      <span className="plan-meta-pill">🌾 {crop.name} ({crop.field})</span>
                      <span className="plan-meta-pill">📐 {fieldSize} {fieldUnit}</span>
                      <span className="plan-meta-pill">🌱 {crop.stage}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="week-selector-tabs" style={{ padding: '2px', background: '#f1f5f0' }}>
                    <button
                      type="button"
                      className={`week-tab-btn ${planViewMode === 'weekly' ? 'active' : ''}`}
                      onClick={() => setPlanViewMode('weekly')}
                      style={{ padding: '5px 10px', fontSize: '11px' }}
                    >
                      📅 Weekly Calendar
                    </button>
                    <button
                      type="button"
                      className={`week-tab-btn ${planViewMode === 'checklist' ? 'active' : ''}`}
                      onClick={() => setPlanViewMode('checklist')}
                      style={{ padding: '5px 10px', fontSize: '11px' }}
                    >
                      ✓ Quick Checklist
                    </button>
                  </div>
                  <button className="fert-modal-close" onClick={() => setShowPlanModal(false)}>✕</button>
                </div>
              </div>

              <div className="fert-modal-body plan-modal-body">
                {/* TOP SUMMARY RIBBON */}
                <div className="plan-summary-ribbon">
                  <div className="plan-summary-card summary-card-active">
                    <span className="summary-card-label">
                      <span>🛍️</span>
                      <span>Selected for Plan</span>
                    </span>
                    <span className="summary-card-val">
                      {activeSelectedProducts.length} Product{activeSelectedProducts.length === 1 ? '' : 's'} Active
                    </span>
                    <span className="summary-card-sub">
                      {activeSelectedProducts.map((p) => p.name).join(', ') || 'No fertilizers selected'}
                    </span>
                  </div>

                  <div className="plan-summary-card summary-card-today">
                    <span className="summary-card-label">
                      <span>📍</span>
                      <span>{todayAction ? `Today's Action (${todayAction.dayName.slice(0, 3)}, Wk ${todayAction.weekNum})` : `Today's Farm Routine (${now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })})`}</span>
                    </span>
                    <span className="summary-card-val">
                      {todayAction
                        ? `${todayAction.name} (${todayAction.quantityKg} kg)`
                        : '💧 Rhizosphere Drip Hydration'}
                    </span>
                    <span className="summary-card-sub">
                      {todayAction
                        ? `${todayAction.applicationDate} • ${todayAction.splitTitle}`
                        : `${now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} • Light morning drip cycle (1.5 hrs)`}
                    </span>
                  </div>

                  <div className="plan-summary-card summary-card-next">
                    <span className="summary-card-label">
                      <span>⚡</span>
                      <span>Next Upcoming Application</span>
                    </span>
                    <span className="summary-card-val">
                      {nextUpcomingAction
                        ? `${nextUpcomingAction.name} (${nextUpcomingAction.quantityKg} kg)`
                        : 'No upcoming doses scheduled'}
                    </span>
                    <span className="summary-card-sub">
                      {nextUpcomingAction
                        ? `${nextUpcomingAction.applicationDate} (Week ${nextUpcomingAction.weekNum} • ${nextUpcomingAction.dayName}) • ${nextUpcomingAction.splitTitle}`
                        : 'Select products in Recommended Fertilizers'}
                    </span>
                  </div>
                </div>

                {activeSelectedProducts.length === 0 && (
                  <div className="empty-fert-plan-notice">
                    <span className="empty-plan-icon">💡</span>
                    <div className="empty-plan-text">
                      <strong>No fertilizers currently selected for your plan.</strong><br />
                      In the <em>Recommended Fertilizer Products</em> section or catalog, click <strong>Select / Add to Plan</strong> on any fertilizer (e.g. Urea, DAP, MOP) to automatically generate its scheduled application dates, doses, and precautions here.
                    </div>
                  </div>
                )}

                {planViewMode === 'weekly' ? (
                  <div className="upcoming-weekly-plan-section">
                    <div className="section-title-row">
                      <div>
                        <h4 className="weekly-section-title">
                          <span>📅</span>
                          <span>Upcoming Weekly Plan</span>
                        </h4>
                        <p className="weekly-section-subtitle">
                          7-Day weekly agronomic cycles automatically synchronized with your selected fertilizers and precision calculated quantities
                        </p>
                      </div>

                      {/* WEEK SELECTOR TABS */}
                      <div className="week-selector-tabs" role="tablist">
                        {WEEKS_METADATA.map((wk) => {
                          const hasFertInWeek = [0, 1, 2, 3, 4, 5, 6].some((d) => !!scheduledSlots[`w${wk.num}-d${d}`]);
                          return (
                            <button
                              key={wk.num}
                              type="button"
                              className={`week-tab-btn ${activeWeekTab === wk.num ? 'active' : ''}`}
                              onClick={() => setActiveWeekTab(wk.num)}
                            >
                              <span>Week {wk.num}</span>
                              {wk.num === 1 && <span className="plan-meta-pill" style={{ fontSize: '9.5px', padding: '1px 5px' }}>Current</span>}
                              {hasFertInWeek && <span className="week-tab-indicator" title="Fertilizer scheduled this week"></span>}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          className={`week-tab-btn ${activeWeekTab === 0 ? 'active' : ''}`}
                          onClick={() => setActiveWeekTab(0)}
                        >
                          <span>All 4 Weeks</span>
                        </button>
                      </div>
                    </div>

                    {/* WEEKS CONTENT */}
                    <div className="weeks-container-flow">
                      {weeksToRender.map((week) => (
                        <div key={week.num} className="week-group-block" style={{ marginBottom: '22px' }}>
                          <div className="week-header-banner">
                            <div>
                              <span className="week-banner-title">Week {week.num}: {week.title}</span>
                              <span style={{ color: '#4c644d', margin: '0 8px' }}>•</span>
                              <span className="week-banner-focus">Focus: {week.focus}</span>
                            </div>
                            <span className="plan-meta-pill">7 Days Scheduled</span>
                          </div>

                          {/* 7 DAYS LIST (Day 1 to Day 7) */}
                          <div className="days-week-list">
                            {[0, 1, 2, 3, 4, 5, 6].map((dIdx) => {
                              const slotKey = `w${week.num}-d${dIdx}`;
                              const fert = scheduledSlots[slotKey];
                              const dayDateInfo = getUpcomingDate(week.num, dIdx);
                              const isToday = isSameCalendarDay(dayDateInfo.dateObj, now);
                              const isNextApp = slotKey === nextUpcomingKey;
                              const routine = ROUTINE_ACTIVITIES[week.num]?.[dIdx] || ROUTINE_ACTIVITIES[1][0];
                              const dayHeading = fert ? fert.dayName : dayDateInfo.dayName;
                              const dayDateDisplay = fert ? fert.applicationDate : dayDateInfo.fullDate;

                              return (
                                <div
                                  key={dIdx}
                                  className={`day-plan-card ${isToday ? 'day-is-today' : ''} ${isNextApp ? 'day-is-next-app' : ''}`}
                                  id={`plan-day-${week.num}-d${dIdx}`}
                                >
                                  <div className="day-card-header">
                                    <div className="day-title-left">
                                      <span className="day-name-label">{dayHeading}</span>
                                      <span className="day-date-sub">
                                        {dayDateDisplay} • Wk {week.num} • Day {dIdx + 1}
                                      </span>
                                    </div>

                                    <div className="day-badges-right">
                                      {isToday && (
                                        <span className="badge-today-pulse">
                                          <span className="pulse-dot"></span>
                                          <span>Today's Action</span>
                                        </span>
                                      )}
                                      {isNextApp && (
                                        <span className="badge-next-app">
                                          <span>⚡</span>
                                          <span>Next Fertilizer Application</span>
                                        </span>
                                      )}
                                      {fert ? (
                                        <span className="badge-fert-application">
                                          <span>🛍️</span>
                                          <span>Fertilizer Application</span>
                                        </span>
                                      ) : (
                                        <span className="badge-routine-care">
                                          <span>{routine.icon}</span>
                                          <span>{routine.category}</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* DAY CONTENT */}
                                  {fert ? (
                                    <div className="fert-day-content">
                                      <div className="fert-item-headline">
                                        <div className="fert-chip-icon" style={{ backgroundColor: fert.bagColor || '#2e7d32' }}>
                                          🛍️
                                        </div>
                                        <div className="fert-headline-info">
                                          <span className="fert-headline-title">{fert.name} — {fert.splitTitle}</span>
                                          <span className="fert-headline-formula">Composition: {fert.composition}</span>
                                        </div>
                                      </div>

                                      {/* SPECS GRID */}
                                      <div className="fert-specs-grid">
                                        <div className="fert-spec-item">
                                          <span className="fert-spec-label">
                                            <span>📅</span>
                                            <span>Application Date</span>
                                          </span>
                                          <span className="fert-spec-val bold-dose" style={{ color: '#1b5e20' }}>
                                            {fert.applicationDate}
                                          </span>
                                          <span className="fert-spec-sub">
                                            Week {week.num} • {dayHeading}
                                          </span>
                                        </div>

                                        <div className="fert-spec-item">
                                          <span className="fert-spec-label">
                                            <span>⚖️</span>
                                            <span>Required Quantity</span>
                                          </span>
                                          <span className="fert-spec-val bold-dose">
                                            {fert.quantityKg} kg ({fert.bags} bag{fert.bags > 1 ? 's' : ''})
                                          </span>
                                          <span className="fert-spec-sub">
                                            For {fieldSize} {fieldUnit} (Rate: {fert.rateText})
                                          </span>
                                        </div>

                                        <div className="fert-spec-item">
                                          <span className="fert-spec-label">
                                            <span>⏰</span>
                                            <span>Recommended Timing</span>
                                          </span>
                                          <span className="fert-spec-val">
                                            {fert.recommendedTiming}
                                          </span>
                                        </div>

                                        <div className="fert-spec-item" style={{ gridColumn: '1 / -1' }}>
                                          <span className="fert-spec-label">
                                            <span>🎯</span>
                                            <span>Application Method</span>
                                          </span>
                                          <span className="fert-spec-val">
                                            {fert.applicationMethod}
                                          </span>
                                        </div>
                                      </div>

                                      {/* PRECAUTIONS ALERT BOX */}
                                      <div className="fert-precautions-alert">
                                        <span className="precautions-icon">⚠️</span>
                                        <div className="precautions-text">
                                          <strong>Basic Precautions:</strong> {fert.precautions}
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="routine-day-content">
                                      <div className="routine-icon-box">
                                        {routine.icon}
                                      </div>
                                      <div className="routine-info-box">
                                        <h5 className="routine-title">{routine.title}</h5>
                                        <p className="routine-details">{routine.description}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* QUICK CHECKLIST VIEW */
                  <div className="action-plan-checklist">
                    <div style={{ marginBottom: '12px', fontSize: '12.5px', color: '#496348', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Check off fertilizer applications and farm tasks as you complete them:</span>
                      <span className="plan-meta-pill" style={{ fontSize: '11px' }}>
                        {Object.keys(scheduledSlots).length} Fertilizer Application{Object.keys(scheduledSlots).length === 1 ? '' : 's'}
                      </span>
                    </div>

                    {allScheduledActions.length === 0 ? (
                      <div className="empty-fert-plan-notice" style={{ marginTop: '8px' }}>
                        <span className="empty-plan-icon">💡</span>
                        <div className="empty-plan-text">
                          <strong>No fertilizers selected.</strong> Select fertilizers in the Recommended Fertilizer Products section to generate your application tasks and schedule.
                        </div>
                      </div>
                    ) : (
                      allScheduledActions.map((fert) => {
                        const taskId = `task-fert-${fert.id}`;
                        const isCompleted = !!completedTasks[taskId];
                        return (
                          <label key={fert.slotKey} className="action-task-item" style={{ borderColor: isCompleted ? '#a5d6a7' : '#e0ece0', background: isCompleted ? '#f9fbf9' : '#fff' }}>
                            <input
                              type="checkbox"
                              checked={isCompleted}
                              onChange={() => toggleTask(taskId)}
                            />
                            <div className="task-content">
                              <div className="task-title-row">
                                <strong style={{ textDecoration: isCompleted ? 'line-through' : 'none', color: isCompleted ? '#666' : '#1b5e20' }}>
                                  Apply {fert.name} — {fert.splitTitle} ({fert.quantityKg} kg / {fert.bags} bag{fert.bags > 1 ? 's' : ''})
                                </strong>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                  <span className="task-badge badge-thisweek">
                                    📅 {fert.applicationDate}
                                  </span>
                                  <span className="task-badge badge-nextweek">
                                    Week {fert.weekNum} • {fert.dayName}
                                  </span>
                                </div>
                              </div>
                              <p className="task-desc" style={{ marginTop: '4px', color: '#334e35' }}>
                                <strong>Method:</strong> {fert.applicationMethod}
                              </p>
                              <p className="task-desc" style={{ marginTop: '2px', color: '#b45309', fontSize: '11px' }}>
                                <strong>⚠️ Basic Precautions:</strong> {fert.precautions}
                              </p>
                            </div>
                          </label>
                        );
                      })
                    )}

                    {/* ROUTINE FIELD ACTIVITIES */}
                    <div style={{ margin: '16px 0 8px', fontSize: '11.5px', fontWeight: 700, color: '#2e7d32', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Routine Crop &amp; Soil Care Tasks
                    </div>
                    <label className="action-task-item">
                      <input
                        type="checkbox"
                        checked={!!completedTasks['task-routine-drip']}
                        onChange={() => toggleTask('task-routine-drip')}
                      />
                      <div className="task-content">
                        <div className="task-title-row">
                          <strong>Run morning drip hydration cycle &amp; lateral flush</strong>
                          <span className="task-badge badge-today">Routine</span>
                        </div>
                        <p className="task-desc">Verify 1.5-hr drip output to ensure uniform moisture in root zone before fertilization.</p>
                      </div>
                    </label>
                    <label className="action-task-item">
                      <input
                        type="checkbox"
                        checked={!!completedTasks['task-routine-scout']}
                        onChange={() => toggleTask('task-routine-scout')}
                      />
                      <div className="task-content">
                        <div className="task-title-row">
                          <strong>Canopy &amp; Root Zone Scouting Audit</strong>
                          <span className="task-badge badge-thisweek">Weekly</span>
                        </div>
                        <p className="task-desc">Inspect lower leaves for concentric spots; check yellow sticky traps for insect pest pressure.</p>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              <div className="fert-modal-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: '#556c54', fontWeight: 600 }}>
                  Active Fertilizers: {activeSelectedProducts.length} Selected &amp; Scheduled in Action Plan
                </span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn-modal-action"
                    style={{ background: '#f0f5ef', color: '#1b5e20', border: '1px solid #c7dec6' }}
                    onClick={() => triggerToast(`Action Plan PDF schedule generated for ${crop.name} (${fieldSize} ${fieldUnit})`)}
                  >
                    📥 Export Schedule
                  </button>
                  <button
                    type="button"
                    className="btn-modal-action"
                    onClick={() => {
                      setShowPlanModal(false);
                      triggerToast('✓ Action Plan updated and saved to your seasonal schedule.');
                    }}
                  >
                    Save &amp; Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============================================================
          MODAL: NEARBY CROP RISK REPORTS DETAIL
          ============================================================ */}
      {showNearbyModal && (
        <div className="fert-modal-overlay" onClick={() => setShowNearbyModal(false)}>
          <div className="fert-modal-container nearby-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fert-modal-header">
              <div className="modal-title-wrap">
                <span className="modal-icon">🚨</span>
                <div>
                  <h3 className="fert-modal-title">Nearby Crop Risk Surveillance</h3>
                  <p className="fert-modal-desc">Community agronomic reports within 15 km of {crop.location}</p>
                </div>
              </div>
              <button className="fert-modal-close" onClick={() => setShowNearbyModal(false)}>✕</button>
            </div>

            <div className="fert-modal-body">
              <div className="nearby-detail-list">
                {crop.nearbyRiskReports.map((report) => (
                  <div key={report.id} className="nearby-detail-card">
                    <div className="nearby-detail-header">
                      <div>
                        <span className="nearby-crop-pill">{report.crop}</span>
                        <h4 className="nearby-detail-threat">{report.threat}</h4>
                      </div>
                      <span className={`nearby-severity-chip severity-${report.severity.toLowerCase()}`}>
                        {report.severity} Alert
                      </span>
                    </div>

                    <div className="nearby-detail-specs">
                      <div><strong>Distance:</strong> {report.distance}</div>
                      <div><strong>Affected Farms:</strong> {report.farmsAffected} Farms</div>
                      <div><strong>Telemetry Status:</strong> {report.status}</div>
                    </div>

                    <div className="nearby-detail-action-box">
                      <strong>Agronomist Preventative Guidance:</strong>
                      <p>{report.advisedAction}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="fert-modal-footer">
              <button className="btn-modal-cancel" onClick={() => setShowNearbyModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: DETAILED SOIL REPORT
          ============================================================ */}
      {showSoilModal && (
        <div className="fert-modal-overlay" onClick={() => setShowSoilModal(false)}>
          <div className="fert-modal-container soil-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fert-modal-header">
              <div className="modal-title-wrap">
                <span className="modal-icon">📑</span>
                <div>
                  <h3 className="fert-modal-title">Comprehensive Soil Test Report</h3>
                  <p className="fert-modal-desc">Soil Sample #SL-2025-084 • Lab: Akola District Agronomy Lab</p>
                </div>
              </div>
              <button className="fert-modal-close" onClick={() => setShowSoilModal(false)}>✕</button>
            </div>

            <div className="fert-modal-body">
              <div className="soil-report-summary-box">
                <div className="soil-meta-grid">
                  <div><strong>Plot Location:</strong> {crop.location} ({crop.field})</div>
                  <div><strong>Soil Texture:</strong> {crop.soilType}</div>
                  <div><strong>Sampling Date:</strong> 12 Jan 2026</div>
                  <div><strong>Status:</strong> Certified Valid (6 Months)</div>
                </div>
              </div>

              <h4 className="soil-table-subtitle">Primary &amp; Secondary Chemical Assays</h4>
              <div className="soil-report-table-wrap">
                <table className="soil-report-table">
                  <thead>
                    <tr>
                      <th>Parameter</th>
                      <th>Observed Value</th>
                      <th>Optimal Range</th>
                      <th>Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Nitrogen (Available N)</td>
                      <td>{activeSoilNutrients.nitrogen.currentVal} kg/acre</td>
                      <td>55 - 80 kg/acre</td>
                      <td><span className={`soil-tag tag-${activeSoilNutrients.nitrogen.status === 'Low' ? 'low' : activeSoilNutrients.nitrogen.status === 'Adequate' ? 'opt' : 'mod'}`}>{activeSoilNutrients.nitrogen.status}</span></td>
                    </tr>
                    <tr>
                      <td>Phosphorus (Available P₂O₅)</td>
                      <td>{activeSoilNutrients.phosphorus.currentVal} kg/acre</td>
                      <td>18 - 35 kg/acre</td>
                      <td><span className={`soil-tag tag-${activeSoilNutrients.phosphorus.status === 'Low' ? 'low' : activeSoilNutrients.phosphorus.status === 'Adequate' ? 'opt' : 'mod'}`}>{activeSoilNutrients.phosphorus.status}</span></td>
                    </tr>
                    <tr>
                      <td>Potassium (Available K₂O)</td>
                      <td>{activeSoilNutrients.potassium.currentVal} kg/acre</td>
                      <td>35 - 60 kg/acre</td>
                      <td><span className={`soil-tag tag-${activeSoilNutrients.potassium.status === 'Low' ? 'low' : activeSoilNutrients.potassium.status === 'Adequate' ? 'opt' : 'mod'}`}>{activeSoilNutrients.potassium.status}</span></td>
                    </tr>
                    <tr>
                      <td>Soil Reaction (pH)</td>
                      <td>{activeSoilNutrients.ph.value}</td>
                      <td>6.5 - 7.5</td>
                      <td><span className="soil-tag tag-opt">{activeSoilNutrients.ph.label}</span></td>
                    </tr>
                    <tr>
                      <td>Organic Carbon</td>
                      <td>{activeSoilNutrients.organicCarbon.value}</td>
                      <td>0.75 - 1.25%</td>
                      <td><span className="soil-tag tag-low">{activeSoilNutrients.organicCarbon.label}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="fert-modal-footer">
              <button className="btn-modal-cancel" onClick={() => setShowSoilModal(false)}>Close</button>
              <button 
                className="btn-modal-action"
                onClick={() => {
                  setShowSoilModal(false);
                  triggerToast('Soil test report downloaded as PDF!');
                }}
              >
                Download PDF Report ↓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: PRODUCT CATALOG (VIEW ALL WITH SEARCH & FILTER)
          ============================================================ */}
      {showCatalogModal && (
        <div className="fert-modal-overlay" onClick={() => setShowCatalogModal(false)}>
          <div className="fert-modal-container catalog-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fert-modal-header">
              <div className="modal-title-wrap">
                <span className="modal-icon">🛍️</span>
                <div>
                  <h3 className="fert-modal-title">Authorized Fertilizer Products Catalog</h3>
                  <p className="fert-modal-desc">
                    {dbFertilizers.length || 10} certified products in catalog • Search, filter &amp; select for seasonal plan
                  </p>
                </div>
              </div>
              <button className="fert-modal-close" onClick={() => setShowCatalogModal(false)}>✕</button>
            </div>

            <div className="fert-modal-body">
              {/* Search & Category Filter Header */}
              <div className="catalog-search-filter-section">
                <div className="catalog-search-row">
                  <div className="catalog-search-input-wrap">
                    <span className="catalog-search-icon">🔍</span>
                    <input
                      type="text"
                      className="catalog-search-input"
                      placeholder="Search by fertilizer name, composition (e.g. 46% N), formula..."
                      value={catalogSearchQuery}
                      onChange={(e) => setCatalogSearchQuery(e.target.value)}
                      autoFocus
                    />
                    {catalogSearchQuery && (
                      <button 
                        type="button" 
                        className="catalog-search-clear"
                        onClick={() => setCatalogSearchQuery('')}
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div className="catalog-categories-row">
                  <button
                    type="button"
                    className={`catalog-filter-pill ${catalogCategoryFilter === 'All' ? 'active' : ''}`}
                    onClick={() => setCatalogCategoryFilter('All')}
                  >
                    All ({catalogCounts.all})
                  </button>
                  <button
                    type="button"
                    className={`catalog-filter-pill ${catalogCategoryFilter === 'Primary' ? 'active' : ''}`}
                    onClick={() => setCatalogCategoryFilter('Primary')}
                  >
                    Primary NPK ({catalogCounts.primary})
                  </button>
                  <button
                    type="button"
                    className={`catalog-filter-pill ${catalogCategoryFilter === 'Secondary' ? 'active' : ''}`}
                    onClick={() => setCatalogCategoryFilter('Secondary')}
                  >
                    Secondary S / Mg ({catalogCounts.secondary})
                  </button>
                  <button
                    type="button"
                    className={`catalog-filter-pill ${catalogCategoryFilter === 'Micronutrient' ? 'active' : ''}`}
                    onClick={() => setCatalogCategoryFilter('Micronutrient')}
                  >
                    Micronutrients ({catalogCounts.micro})
                  </button>
                  <button
                    type="button"
                    className={`catalog-filter-pill ${catalogCategoryFilter === 'Organic' ? 'active' : ''}`}
                    onClick={() => setCatalogCategoryFilter('Organic')}
                  >
                    Bio / Organic ({catalogCounts.organic})
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="catalog-items-list">
                {filteredCatalogFertilizers.length > 0 ? (
                  filteredCatalogFertilizers.map((p: any) => {
                    const prodId = p.productCode || p.id;
                    const isSelected = selectedFertilizers.includes(prodId);
                    const displayPrice = p.price !== undefined ? `₹${parseFloat(p.price).toFixed(2)}` : '₹266.50';
                    const packageNote = p.packageSizeKg ? `${p.packageSizeKg}${p.packageUnit || 'kg'}` : '50kg';
                    const typeNote = p.isOrganic ? 'Bio-Certified Organic' : 'Govt. Subsidized';

                    return (
                      <div key={p.id} className={`catalog-item-row ${isSelected ? 'item-selected' : ''}`}>
                        <div className="catalog-item-left">
                          <div className="catalog-item-badge" style={{ backgroundColor: p.bagColor || '#1e56a0' }}>
                            {p.name.slice(0, 3).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <strong className="catalog-item-name">{p.name}</strong>
                              {p.category && (
                                <span style={{ fontSize: '11px', color: '#15803d', background: '#dcfce7', padding: '1px 6px', borderRadius: '8px', fontWeight: 600 }}>
                                  {p.category}
                                </span>
                              )}
                              {p.isOrganic && (
                                <span style={{ fontSize: '11px', color: '#047857', background: '#a7f3d0', padding: '1px 6px', borderRadius: '8px', fontWeight: 700 }}>
                                  🌿 Organic
                                </span>
                              )}
                            </div>
                            <div className="catalog-item-formula">{p.formula ? `${p.formula} • ` : ''}{p.composition}</div>
                            <p className="catalog-item-desc">{p.description}</p>
                          </div>
                        </div>

                        <div className="catalog-item-right">
                          <span className="catalog-price-est">{displayPrice} / {packageNote} bag ({typeNote})</span>
                          <button 
                            type="button"
                            className={`btn-add-plan ${isSelected ? 'btn-added' : ''}`}
                            onClick={() => handleToggleFertilizer(prodId, p.name)}
                            id={`catalog-btn-select-${prodId}`}
                          >
                            {isSelected ? '✓ Selected in Plan' : '+ Select / Add to Plan'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="catalog-empty-state">
                    <span className="catalog-empty-icon">🔍</span>
                    <span className="catalog-empty-title">No matching fertilizers found</span>
                    <span className="catalog-empty-sub">
                      Try clearing your search query or choosing a different category filter above.
                    </span>
                    <button
                      type="button"
                      className="catalog-filter-pill active"
                      style={{ marginTop: '8px' }}
                      onClick={() => {
                        setCatalogSearchQuery('');
                        setCatalogCategoryFilter('All');
                      }}
                    >
                      Reset All Filters
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="fert-modal-footer" style={{ justifyContent: 'space-between' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🌾</span>
                <span>{selectedFertilizers.length} Fertilizer{selectedFertilizers.length !== 1 ? 's' : ''} Selected for Plan</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-modal-cancel" onClick={() => setShowCatalogModal(false)}>Close</button>
                <button className="btn-modal-action" onClick={() => setShowCatalogModal(false)}>
                  Apply to Plan ✓
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: FERTILIZER CALCULATOR (POPUP)
          ============================================================ */}
      {showCalcModal && (
        <div className="fert-modal-overlay" onClick={() => setShowCalcModal(false)}>
          <div className="fert-modal-container calc-popup-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fert-modal-header">
              <div className="modal-title-wrap">
                <span className="modal-icon">🧮</span>
                <div>
                  <h3 className="fert-modal-title">Fertilizer Requirement Calculator</h3>
                  <p className="fert-modal-desc">
                    Calculated for {crop.name} ({crop.field}) based on selected fertilizers &amp; field area
                  </p>
                </div>
              </div>
              <button className="fert-modal-close" onClick={() => setShowCalcModal(false)}>✕</button>
            </div>

            <div className="fert-modal-body">
              {/* Field Size Controls */}
              <div className="calc-popup-field-box">
                <label className="calc-input-label" htmlFor="popup-field-size">Configure Your Field Area</label>
                <div className="calc-input-controls">
                  <div className="calc-number-box">
                    <input
                      id="popup-field-size"
                      type="number"
                      min="0.1"
                      max="500"
                      step="0.5"
                      className="calc-field-input"
                      value={fieldSize}
                      onChange={(e) => setFieldSize(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="calc-select-box">
                    <select 
                      className="calc-unit-select"
                      value={fieldUnit}
                      onChange={(e) => setFieldUnit(e.target.value as any)}
                      aria-label="Select Field Size Unit"
                    >
                      <option value="Acres">Acres ⌄</option>
                      <option value="Hectares">Hectares ⌄</option>
                      <option value="Guntha">Guntha ⌄</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Filtered Calculated List using fertilizers already selected */}
              <div className="calc-popup-results">
                <div className="calc-popup-results-heading">
                  <h4>Selected Fertilizers Dosage Breakdown</h4>
                  <span className="calc-popup-count">{selectedFertilizers.length} Selected</span>
                </div>

                {(() => {
                  const selectedProducts = activeRecommendedProducts.filter((p) => selectedFertilizers.includes(p.id));

                  if (selectedProducts.length === 0) {
                    return (
                      <div className="calc-empty-state">
                        <span className="calc-empty-icon">🌱</span>
                        <div className="calc-empty-text">
                          <strong>No fertilizers selected yet</strong>
                          <p>Select recommended fertilizers below to compute field quantities.</p>
                        </div>
                        <button 
                          type="button"
                          className="btn-select-all-fert"
                          onClick={() => setSelectedFertilizers(activeRecommendedProducts.map((p) => p.id))}
                        >
                          Select All Recommended ({activeRecommendedProducts.length})
                        </button>
                      </div>
                    );
                  }

                  const totalKg = Math.round(selectedProducts.reduce((sum, p) => sum + (effectiveAcres * p.ratePerAcre), 0) * 10) / 10;
                  const totalBags = selectedProducts.reduce((sum, p) => sum + Math.ceil((effectiveAcres * p.ratePerAcre) / (p.packageSizeKg || 50)), 0);
                  const totalCost = selectedProducts.reduce((sum, p) => sum + (p.price ? Math.ceil((effectiveAcres * p.ratePerAcre) / (p.packageSizeKg || 50)) * p.price : 0), 0);

                  return (
                    <>
                      <div className="calc-popup-items-list">
                        {selectedProducts.map((prod) => {
                          const calculatedKg = Math.round(effectiveAcres * prod.ratePerAcre * 10) / 10;
                          const calculatedBags = Math.ceil(calculatedKg / (prod.packageSizeKg || 50));
                          const estimatedCost = prod.price ? calculatedBags * prod.price : undefined;

                          return (
                            <div key={prod.id} className="calc-popup-item-row">
                              <div className="calc-popup-item-left">
                                <span className="calc-bullet" style={{ backgroundColor: prod.bagColor || '#2e7d32' }}></span>
                                <div>
                                  <div className="calc-item-title-wrap">
                                    <strong className="calc-item-name">{prod.name}</strong>
                                    <span className="calc-item-formula-badge">{prod.composition}</span>
                                  </div>
                                  <span className="calc-rate-tag">
                                    Recommended Rate: <strong>{prod.ratePerAcre} {prod.unit}</strong>
                                  </span>
                                </div>
                              </div>

                              <div className="calc-popup-item-right">
                                <div className="calc-qty-num">
                                  <strong>{calculatedKg}</strong> <span className="calc-val-unit">kg</span>
                                </div>
                                <span className="calc-bags-note">({calculatedBags} bag{calculatedBags > 1 ? 's' : ''} of {prod.packageSizeKg || 50} kg)</span>
                                {estimatedCost ? (
                                  <span style={{ fontSize: '11px', color: '#166534', fontWeight: 600 }}>₹{estimatedCost.toLocaleString()}</span>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="calc-popup-summary-strip">
                        <div className="calc-popup-summary-content">
                          <span className="calc-summary-label">Total Requirement for {fieldSize} {fieldUnit}:</span>
                          <strong className="calc-summary-val"> {totalKg} kg</strong>
                          <span className="calc-summary-bags"> ({totalBags} bags)</span>
                          {totalCost > 0 && (
                            <span className="calc-summary-cost" style={{ marginLeft: '12px', color: '#15803d', fontWeight: 700 }}>
                              • Est. Cost: ₹{totalCost.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="fert-modal-footer">
              <button className="btn-modal-cancel" onClick={() => setShowCalcModal(false)}>Close</button>
              <button 
                type="button"
                className="btn-modal-action"
                onClick={() => {
                  setShowCalcModal(false);
                  handleSavePlan();
                }}
              >
                Apply &amp; Save Calculation ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: ORGANIC PREPARATION GUIDE
          ============================================================ */}
      {selectedOrganicGuide && (() => {
        const guide = getOrganicPreparationDetails(selectedOrganicGuide);
        return (
          <div className="fert-modal-overlay" onClick={() => setSelectedOrganicGuide(null)}>
            <div className="fert-modal-container organic-guide-modal" onClick={(e) => e.stopPropagation()}>
              <div className="fert-modal-header">
                <div className="modal-title-wrap">
                  <span className="modal-icon">🌿</span>
                  <div>
                    <h3 className="fert-modal-title">{guide.name}</h3>
                    <p className="fert-modal-desc">Organic Preparation &amp; Application Protocol • {guide.type}</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="fert-modal-close" 
                  onClick={() => setSelectedOrganicGuide(null)}
                  aria-label="Close guide"
                >
                  ✕
                </button>
              </div>

              <div className="organic-guide-body">
                {/* Benefit Banner */}
                <div className="guide-benefit-banner">
                  <span className="benefit-icon">✨</span>
                  <div>
                    <strong className="benefit-title">Agronomic Benefit &amp; Mode of Action</strong>
                    <p className="benefit-desc">{guide.benefit}</p>
                  </div>
                </div>

                {/* Quick Specs Cards */}
                <div className="guide-quick-specs">
                  <div className="quick-spec-card">
                    <span className="quick-spec-label">Recommended Dosage</span>
                    <span className="quick-spec-val">{guide.dosage}</span>
                  </div>
                  <div className="quick-spec-card">
                    <span className="quick-spec-label">Optimal Application Window</span>
                    <span className="quick-spec-val">{guide.timing}</span>
                  </div>
                  <div className="quick-spec-card">
                    <span className="quick-spec-label">Shelf Life &amp; Storage</span>
                    <span className="quick-spec-val">{guide.shelfLife}</span>
                  </div>
                </div>

                {/* Step by Step Preparation */}
                <div className="guide-section-block">
                  <h4 className="guide-block-title">
                    <span>📋</span>
                    <span>Step-by-Step Preparation Protocol</span>
                  </h4>
                  <div className="preparation-steps-timeline">
                    {guide.prepSteps.map((s, idx) => (
                      <div key={idx} className="prep-step-item">
                        <div className="step-num-circle">{idx + 1}</div>
                        <div className="step-text-wrap">
                          <span className="step-label">{s.label}</span>
                          <p className="step-desc">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Application Method */}
                <div className="guide-section-block">
                  <h4 className="guide-block-title">
                    <span>🚜</span>
                    <span>Field Application Method</span>
                  </h4>
                  <div className="guide-method-box">
                    <span className="method-icon">🌱</span>
                    <p className="method-text">{guide.applicationMethod}</p>
                  </div>
                </div>

                {/* Important Precautions */}
                <div className="guide-section-block">
                  <h4 className="guide-block-title">
                    <span>⚠️</span>
                    <span>Important Precautions &amp; Farmer Safety</span>
                  </h4>
                  <div className="guide-precautions-card">
                    <span className="precautions-big-icon">🛡️</span>
                    <div>
                      <h5 className="precautions-heading">Key Safety Guidelines:</h5>
                      <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {guide.precautions.map((p, idx) => (
                          <li key={idx} className="precautions-details">{p}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="fert-modal-footer">
                <button 
                  type="button" 
                  className="btn-modal-cancel" 
                  onClick={() => setSelectedOrganicGuide(null)}
                >
                  Close
                </button>
                <button 
                  type="button" 
                  className="btn-modal-action"
                  onClick={() => {
                    triggerToast(`✓ Preparation protocol for ${guide.name} reviewed`);
                    setSelectedOrganicGuide(null);
                  }}
                >
                  Understood &amp; Close ✓
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
