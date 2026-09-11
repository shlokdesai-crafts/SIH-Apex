import { useState, useEffect, useMemo } from 'react';
import './AdvisoryOverview.css';
import { getOrganicPreparationDetails } from '../utils/organicGuides';
import { 
  calculateAdvisory, 
  fetchFarmerAdvisoryContext, 
  type ApiAdvisoryCalculationData,
  type FarmerContextData 
} from '../services/advisoryApi';
import type { DbFertilizerItem } from './AdvisoryOverview';

interface FertilizerRecommendationProps {
  onBack?: () => void;
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

interface FertilizerProduct {
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
  totalQuantityKg?: number;
  totalBags?: number;
  estimatedCostInr?: number;
}

interface ApplicationStep {
  step: number;
  title: string;
  timing: string;
  badge: string;
  details: string;
}

interface CropFertilizerData {
  id: string;
  name: string;
  image: string;
  stage: string;
  field: string;
  acres: number;
  location: string;
  soilType: string;
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
}

const CROPS_DATA: Record<string, CropFertilizerData> = {
  tomato: {
    id: 'tomato',
    name: 'Tomato',
    image: '/images/tomato_crop.jpg',
    stage: 'Flowering Stage',
    field: 'Field 1',
    acres: 3.5,
    location: 'Akola',
    soilType: 'Medium Black Clay Loam',
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
  },
  cotton: {
    id: 'cotton',
    name: 'Cotton',
    image: '/images/cotton_crop.jpg',
    stage: 'Boll Development Stage',
    field: 'Field 2',
    acres: 5.0,
    location: 'Akola',
    soilType: 'Deep Black Cotton Vertisol',
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
  },
  soybean: {
    id: 'soybean',
    name: 'Soybean',
    image: '/images/soybean_crop.jpg',
    stage: 'Pod Formation Stage',
    field: 'Field 3',
    acres: 4.0,
    location: 'Akola',
    soilType: 'Clay Loam with good drainage',
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
  },
  sugarcane: {
    id: 'sugarcane',
    name: 'Sugarcane',
    image: '/images/sugarcane_crop.jpg',
    stage: 'Grand Growth Stage',
    field: 'Field 4',
    acres: 6.0,
    location: 'Akola',
    soilType: 'Heavy Clay Vertisol with high organic matter',
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
  },
};

export default function FertilizerRecommendation({ onBack }: FertilizerRecommendationProps) {
  const [selectedCropId, setSelectedCropId] = useState<string>('tomato');
  const [activeSubTab, setActiveSubTab] = useState<string>('nutrient-status');
  const [fieldSize, setFieldSize] = useState<number>(3.5);
  const [fieldUnit, setFieldUnit] = useState<'Acres' | 'Hectares' | 'Guntha'>('Acres');
  const [addedProducts, setAddedProducts] = useState<Record<string, boolean>>({});
  
  // Modals state
  const [showCropModal, setShowCropModal] = useState<boolean>(false);
  const [showSoilModal, setShowSoilModal] = useState<boolean>(false);
  const [showCatalogModal, setShowCatalogModal] = useState<boolean>(false);
  const [selectedOrganicGuide, setSelectedOrganicGuide] = useState<{ name: string; type: string; dosage: string; benefit: string } | null>(null);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Fetch live active fertilizer products from PostgreSQL API (/api/fertilizers)
  const [dbFertilizers, setDbFertilizers] = useState<DbFertilizerItem[]>([]);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState<string>('');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>('All');

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
        if (!response.ok) return;
        const payload = await response.json();
        if (payload.status === 'success' && Array.isArray(payload.data) && isMounted) {
          setDbFertilizers(payload.data);
        }
      } catch (err) {
        console.warn('Fertilizers API unavailable in recommendation page:', err);
      }
    }
    loadFertilizers();
    return () => { isMounted = false; };
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
          if (data.cropCycle?.allocatedAcres) {
            setFieldSize(data.cropCycle.allocatedAcres);
          } else if (data.farm?.totalArea) {
            setFieldSize(data.farm.totalArea);
          }
        }
      } catch (err) {
        console.warn('Farmer context API unavailable in recommendation page:', err);
      }
    }
    loadFarmerContext();
    return () => { isMounted = false; };
  }, [selectedCropId]);

  const crop = CROPS_DATA[selectedCropId] || CROPS_DATA.tomato;

  // Sync field size when crop changes
  const handleSelectCrop = (cropId: string) => {
    setSelectedCropId(cropId);
    setFieldSize(CROPS_DATA[cropId]?.acres || 3.5);
    setShowCropModal(false);
    triggerToast(`Switched active advisory to ${CROPS_DATA[cropId].name}`);
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3200);
  };

  const handleToggleProduct = (productId: string, productName: string) => {
    setAddedProducts((prev) => {
      const newState = { ...prev, [productId]: !prev[productId] };
      if (newState[productId]) {
        triggerToast(`Added ${productName} to your seasonal fertilizer plan!`);
      } else {
        triggerToast(`Removed ${productName} from plan`);
      }
      return newState;
    });
  };

  const handleSavePlan = () => {
    triggerToast(`✓ Plan saved! ${fieldSize} ${fieldUnit} requirements added to My Farm schedule.`);
  };

  const handleTabClick = (tabId: string) => {
    setActiveSubTab(tabId);
    // Smooth scroll to corresponding section if available
    const sectionMap: Record<string, string> = {
      'nutrient-status': 'section-soil-status',
      'recommended-fert': 'section-products',
      'app-guide': 'section-timing-tips',
      'calculator': 'section-calculator',
      'organic-alt': 'section-organic',
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
    return crop.products;
  }, [apiCalculation, crop.products]);

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

  // Live calculator rates from API
  const activeRates = useMemo(() => {
    if (!apiCalculation) return crop.calculatorRates;
    const urea = apiCalculation.recommendedFertilizers.find(f => f.productCode === 'urea')?.ratePerAcreKg ?? crop.calculatorRates.ureaKgPerAcre;
    const dap = apiCalculation.recommendedFertilizers.find(f => f.productCode === 'dap')?.ratePerAcreKg ?? crop.calculatorRates.dapKgPerAcre;
    const mop = apiCalculation.recommendedFertilizers.find(f => f.productCode === 'mop')?.ratePerAcreKg ?? crop.calculatorRates.mopKgPerAcre;
    const zinc = apiCalculation.recommendedFertilizers.find(f => f.productCode === 'zinc-sulphate')?.ratePerAcreKg ?? crop.calculatorRates.zincKgPerAcre;
    return {
      ureaKgPerAcre: urea,
      dapKgPerAcre: dap,
      mopKgPerAcre: mop,
      zincKgPerAcre: zinc,
    };
  }, [apiCalculation, crop.calculatorRates]);

  // Dynamic calculated totals
  const calcUrea = Math.round(effectiveAcres * activeRates.ureaKgPerAcre * 10) / 10;
  const calcDap = Math.round(effectiveAcres * activeRates.dapKgPerAcre * 10) / 10;
  const calcMop = Math.round(effectiveAcres * activeRates.mopKgPerAcre * 10) / 10;
  const calcZinc = Math.round(effectiveAcres * activeRates.zincKgPerAcre * 10) / 10;

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
          onClick={onBack}
          aria-label="Back to dashboard"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Back to Dashboard</span>
        </button>

        <div className="fert-top-tags">
          {isCalculating ? (
            <span className="badge-live-pulse" style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}>
              <span className="pulse-indicator"></span>
              Updating Soil Intelligence...
            </span>
          ) : (
            <span className="badge-live-pulse" title={calcError || undefined}>
              <span className="pulse-indicator"></span>
              Live Soil Intelligence
            </span>
          )}
          <span className="badge-location-pill">📍 {crop.location}, Maharashtra</span>
        </div>
      </div>

      {/* ============================================================
          HERO BANNER (Fertilizer & Nutrient Recommendation)
          ============================================================ */}
      <header className="fert-hero-banner" id="fert-hero-header">
        <div className="fert-banner-leaf-bg"></div>
        <div className="fert-banner-radial-glow"></div>

        <div className="fert-banner-grid">
          {/* Left: Titles & Tagline */}
          <div className="fert-banner-left">
            <div className="fert-banner-badge-row">
              <span className="fert-banner-pill">
                <span className="fert-leaf-icon">🌱</span>
                <span>PRECISION AGRONOMY</span>
              </span>
              <span className="fert-season-badge">Kharif / Rabi 2025-26</span>
            </div>

            <h1 className="fert-banner-title">Fertilizer &amp; Nutrient Recommendation</h1>
            <p className="fert-banner-subtitle">
              Get the right nutrients, in the right quantity, at the right time for higher yield and healthier crops.
            </p>

            {/* Stylized cursive slogan with decorative leaf */}
            <div className="fert-tagline-wrap">
              <span className="fert-tagline-text">"Right Nutrition, Brighter Yields"</span>
              <span className="fert-tagline-leaf">🍃</span>
            </div>
          </div>

          {/* Right: Monitored Crop Card */}
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
                      // Fallback if image fails to render
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
          SUB-NAVIGATION TABS (5 NAV PILLS)
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
      </nav>

      {/* ============================================================
          MAIN CONTENT 2x3 CARDS GRID
          ============================================================ */}
      <main className="fert-main-grid" id="fert-grid-container">

        {/* ------------------------------------------------------------
            ROW 1 - CARD 1: SOIL NUTRIENT STATUS
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
                  <span className={`nutrient-pill ${activeSoilNutrients.nitrogen.status === 'Adequate' ? 'green-pill' : activeSoilNutrients.nitrogen.status === 'Moderate' ? 'amber-pill' : 'red-pill'}`}>
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
                    className={`nutrient-meter-fill ${activeSoilNutrients.nitrogen.status === 'Adequate' ? 'fill-green' : activeSoilNutrients.nitrogen.status === 'Moderate' ? 'fill-amber' : 'fill-red'}`}
                    style={{ width: `${Math.min(100, (activeSoilNutrients.nitrogen.currentVal / activeSoilNutrients.nitrogen.targetVal) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Phosphorus Block */}
              <div className={`nutrient-status-box box-phosphorus status-${activeSoilNutrients.phosphorus.status.toLowerCase()}`}>
                <div className="nutrient-header">
                  <span className="nutrient-name">Phosphorus</span>
                  <span className={`nutrient-pill ${activeSoilNutrients.phosphorus.status === 'Adequate' ? 'green-pill' : activeSoilNutrients.phosphorus.status === 'Moderate' ? 'amber-pill' : 'red-pill'}`}>
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
                    className={`nutrient-meter-fill ${activeSoilNutrients.phosphorus.status === 'Adequate' ? 'fill-green' : activeSoilNutrients.phosphorus.status === 'Moderate' ? 'fill-amber' : 'fill-red'}`}
                    style={{ width: `${Math.min(100, (activeSoilNutrients.phosphorus.currentVal / activeSoilNutrients.phosphorus.targetVal) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Potassium Block */}
              <div className={`nutrient-status-box box-potassium status-${activeSoilNutrients.potassium.status.toLowerCase()}`}>
                <div className="nutrient-header">
                  <span className="nutrient-name">Potassium</span>
                  <span className={`nutrient-pill ${activeSoilNutrients.potassium.status === 'Adequate' ? 'green-pill' : activeSoilNutrients.potassium.status === 'Moderate' ? 'amber-pill' : 'red-pill'}`}>
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
                    className={`nutrient-meter-fill ${activeSoilNutrients.potassium.status === 'Adequate' ? 'fill-green' : activeSoilNutrients.potassium.status === 'Moderate' ? 'fill-amber' : 'fill-red'}`}
                    style={{ width: `${Math.min(100, (activeSoilNutrients.potassium.currentVal / activeSoilNutrients.potassium.targetVal) * 100)}%` }}
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
            ROW 1 - CARD 2: CROP NUTRIENT REQUIREMENT
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
            ROW 1 - CARD 3: KEY INSIGHTS
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

            {/* Green Callout Highlight Box */}
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
            ROW 2 - CARD 4: RECOMMENDED FERTILIZER PRODUCTS
            ------------------------------------------------------------ */}
        <section 
          className={`fert-card fert-card-products ${activeSubTab === 'recommended-fert' ? 'card-highlighted' : ''}`}
          id="section-products"
          aria-labelledby="heading-products"
        >
          <div className="fert-card-header">
            <div className="fert-card-title-group">
              <div className="fert-card-icon prod-icon">🛍️</div>
              <div>
                <h2 className="fert-card-title" id="heading-products">Recommended Fertilizer Products</h2>
                {apiCalculation?.costSummary && (
                  <span 
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      background: '#e8f5e9',
                      color: '#1b5e20',
                      border: '1px solid #a5d6a7',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginTop: '4px'
                    }}
                    title="Total estimated farm cost from PostgreSQL pricing"
                  >
                    Est. Total Farm Cost: ₹{apiCalculation.costSummary.totalEstimatedCostInr.toLocaleString()} ({apiCalculation.costSummary.totalBagsCount} bags)
                  </span>
                )}
              </div>
            </div>
            <button 
              className="fert-card-link"
              onClick={() => setShowCatalogModal(true)}
              id="link-view-all-products"
            >
              <span>View All</span>
              <span className="link-arrow">→</span>
            </button>
          </div>

          <div className="fert-card-body">
            {/* Recommended Fertilizers Grid (Top 3 by Default) */}
            <div className="fert-products-grid">
              {activeRecommendedProducts.slice(0, 3).map((prod) => {
                const isAdded = !!addedProducts[prod.id];
                const calculatedKg = prod.totalQuantityKg ?? Math.round(effectiveAcres * prod.ratePerAcre * 10) / 10;
                const calculatedBags = prod.totalBags ?? Math.ceil(calculatedKg / (prod.packageSizeKg || 50));
                const estimatedCost = prod.estimatedCostInr ?? (prod.price ? calculatedBags * prod.price : null);

                return (
                  <div key={prod.id} className="fert-product-item-card" id={`product-${prod.id}`}>
                    {/* Realistic Bag Illustration */}
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

                    {/* Product Details */}
                    <div className="fert-product-info">
                      <div className="prod-name-row">
                        <h3 className="fert-prod-title">{prod.name}</h3>
                        <span className="fert-prod-badge" style={{ color: prod.bagColor, borderColor: `${prod.bagColor}40` }}>
                          {prod.badge}
                        </span>
                      </div>
                      <div className="fert-prod-formula">{prod.composition}</div>
                      
                      <div className="fert-prod-dosage-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="dosage-label">Recommended Rate:</span>
                          <span className="dosage-num">{prod.ratePerAcre} {prod.unit}</span>
                        </div>

                        <div className="fert-card-calculated-dosage" style={{ marginTop: '6px', background: '#f8fafc', padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
                            <span>Total for {fieldSize} {fieldUnit}:</span>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>{calculatedKg} kg ({calculatedBags} bag{calculatedBags > 1 ? 's' : ''})</span>
                          </div>
                          {estimatedCost ? (
                            <div style={{ marginTop: '3px', fontSize: '11px', color: '#166534', fontWeight: 600 }}>
                              Est. Cost: ₹{estimatedCost.toLocaleString()} {prod.price ? `(@₹${prod.price}/bag)` : ''}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <button 
                        className={`btn-add-plan ${isAdded ? 'btn-added' : ''}`}
                        onClick={() => handleToggleProduct(prod.id, prod.name)}
                        id={`btn-add-${prod.id}`}
                      >
                        {isAdded ? (
                          <>
                            <span className="check-mark">✓</span>
                            <span>Added to Plan</span>
                          </>
                        ) : (
                          <>
                            <span>Add to Plan</span>
                            <span className="plus-sign">+</span>
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

        {/* ------------------------------------------------------------
            ROW 2 - CARD 5: FERTILIZER CALCULATOR
            ------------------------------------------------------------ */}
        <section 
          className={`fert-card fert-card-calculator ${activeSubTab === 'calculator' ? 'card-highlighted' : ''}`}
          id="section-calculator"
          aria-labelledby="heading-calculator"
        >
          <div className="fert-card-header">
            <div className="fert-card-title-group">
              <div className="fert-card-icon calc-icon">🧮</div>
              <h2 className="fert-card-title" id="heading-calculator">Fertilizer Calculator</h2>
            </div>
            <span className="calc-precision-chip">Dynamic Acreage Math</span>
          </div>

          <div className="fert-card-body calc-body-layout">
            {/* Input Row: Field Size & Unit Selector */}
            <div className="calc-input-section">
              <label className="calc-input-label" htmlFor="field-size-input">Field Size</label>
              <div className="calc-input-controls">
                <div className="calc-number-box">
                  <input
                    id="field-size-input"
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
                    aria-label="Select Unit of Field Size"
                  >
                    <option value="Acres">Acres ⌄</option>
                    <option value="Hectares">Hectares ⌄</option>
                    <option value="Guntha">Guntha ⌄</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Calculated Quantities Output List */}
            <div className="calc-results-list">
              <div className="calc-result-row">
                <div className="calc-item-meta">
                  <span className="calc-bullet blue-bullet"></span>
                  <span className="calc-item-name">Urea</span>
                  <span className="calc-item-sub">(@{activeRates.ureaKgPerAcre} kg/acre)</span>
                </div>
                <div className="calc-item-value">
                  <strong>{calcUrea}</strong> <span className="calc-val-unit">kg</span>
                  <span className="calc-bags-note">({Math.ceil(calcUrea / 50)} bags)</span>
                </div>
              </div>

              <div className="calc-result-row">
                <div className="calc-item-meta">
                  <span className="calc-bullet orange-bullet"></span>
                  <span className="calc-item-name">DAP</span>
                  <span className="calc-item-sub">(@{activeRates.dapKgPerAcre} kg/acre)</span>
                </div>
                <div className="calc-item-value">
                  <strong>{calcDap}</strong> <span className="calc-val-unit">kg</span>
                  <span className="calc-bags-note">({Math.ceil(calcDap / 50)} bags)</span>
                </div>
              </div>

              <div className="calc-result-row">
                <div className="calc-item-meta">
                  <span className="calc-bullet red-bullet"></span>
                  <span className="calc-item-name">MOP</span>
                  <span className="calc-item-sub">(@{activeRates.mopKgPerAcre} kg/acre)</span>
                </div>
                <div className="calc-item-value">
                  <strong>{calcMop}</strong> <span className="calc-val-unit">kg</span>
                  <span className="calc-bags-note">({Math.ceil(calcMop / 50)} bags)</span>
                </div>
              </div>

              <div className="calc-result-row">
                <div className="calc-item-meta">
                  <span className="calc-bullet purple-bullet"></span>
                  <span className="calc-item-name">Zinc Sulphate</span>
                  <span className="calc-item-sub">(@{activeRates.zincKgPerAcre} kg/acre)</span>
                </div>
                <div className="calc-item-value">
                  <strong>{calcZinc}</strong> <span className="calc-val-unit">kg</span>
                </div>
              </div>
            </div>

            {/* Save to My Plan CTA */}
            <div className="calc-cta-wrap">
              <button 
                className="btn-save-my-plan"
                id="btn-save-to-plan"
                onClick={handleSavePlan}
              >
                <span className="btn-icon">📥</span>
                <span>Save to My Plan</span>
                <span className="btn-arrow">→</span>
              </button>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------
            ROW 2 - CARD 6: APPLICATION TIMING & SAFETY TIPS
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
            {/* Timeline Steps: 1, 2, 3 */}
            <div className="timing-steps-track">
              {activeTimingSteps.map((step) => (
                <div key={step.step} className="timing-step-node">
                  <div className="timing-step-num-col">
                    <div className="step-num-circle">{step.step}</div>
                    {step.step < activeTimingSteps.length && <div className="step-connector-line"></div>}
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

            {/* Safety Tips Checklist */}
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

      </main>

      {/* ============================================================
          SECTION: ORGANIC ALTERNATIVES (Scrollable / Sub-tab)
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
                id={`btn-fert-guide-${i}`}
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
                {Object.values(CROPS_DATA).map((c) => (
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
                      <td><span className={`soil-tag ${activeSoilNutrients.nitrogen.status === 'Adequate' ? 'tag-opt' : activeSoilNutrients.nitrogen.status === 'Moderate' ? 'tag-mod' : 'tag-low'}`}>{activeSoilNutrients.nitrogen.status}</span></td>
                    </tr>
                    <tr>
                      <td>Phosphorus (Available P₂O₅)</td>
                      <td>{activeSoilNutrients.phosphorus.currentVal} kg/acre</td>
                      <td>18 - 35 kg/acre</td>
                      <td><span className={`soil-tag ${activeSoilNutrients.phosphorus.status === 'Adequate' ? 'tag-opt' : activeSoilNutrients.phosphorus.status === 'Moderate' ? 'tag-mod' : 'tag-low'}`}>{activeSoilNutrients.phosphorus.status}</span></td>
                    </tr>
                    <tr>
                      <td>Potassium (Available K₂O)</td>
                      <td>{activeSoilNutrients.potassium.currentVal} kg/acre</td>
                      <td>35 - 60 kg/acre</td>
                      <td><span className={`soil-tag ${activeSoilNutrients.potassium.status === 'Adequate' ? 'tag-opt' : activeSoilNutrients.potassium.status === 'Moderate' ? 'tag-mod' : 'tag-low'}`}>{activeSoilNutrients.potassium.status}</span></td>
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
                    <tr>
                      <td>Electrical Conductivity (EC)</td>
                      <td>0.42 dS/m</td>
                      <td>&lt; 1.0 dS/m</td>
                      <td><span className="soil-tag tag-opt">Normal</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="soil-expert-recommendation">
                <strong>Agronomist Recommendation:</strong>
                <p>Top-dress nitrogen in 2 equal splits. Soil organic carbon is below 0.75%; apply farm yard manure or pressmud before next sowing season to improve cation exchange capacity.</p>
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
          MODAL: PRODUCT CATALOG (VIEW ALL)
          ============================================================ */}
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
                    const isAdded = !!addedProducts[prodId];
                    const displayPrice = p.price !== undefined ? `₹${parseFloat(p.price).toFixed(2)}` : '₹266.50';
                    const packageNote = p.packageSizeKg ? `${p.packageSizeKg}${p.packageUnit || 'kg'}` : '50kg';
                    const typeNote = p.isOrganic ? 'Bio-Certified Organic' : 'Govt. Subsidized';

                    return (
                      <div key={p.id} className={`catalog-item-row ${isAdded ? 'item-selected' : ''}`}>
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
                            className={`btn-add-plan ${isAdded ? 'btn-added' : ''}`}
                            onClick={() => handleToggleProduct(prodId, p.name)}
                            id={`catalog-btn-select-${prodId}`}
                          >
                            {isAdded ? '✓ Added to Plan' : 'Add to Plan +'}
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
                <span>{Object.values(addedProducts).filter(Boolean).length} Products in Seasonal Plan</span>
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
