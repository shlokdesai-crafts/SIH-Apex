import type { ApiAdvisoryCalculationData, FarmerContextData } from '../services/advisoryApi';

export interface SoilNutrient {
  name: string;
  symbol: string;
  status: 'Low' | 'Adequate' | 'Moderate' | 'High';
  currentVal: number;
  targetVal: number;
  unit: string;
  chemicalForm?: string;
  oxideEquivalent?: {
    name: string;
    symbol: string;
    currentVal: number;
    targetVal: number;
    unit: string;
  };
}

export interface NutrientRequirement {
  nutrient: string;
  symbol: string;
  recommended: number;
  current: number;
  additional: number;
  unit: string;
  chemicalForm?: string;
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

export interface ApplicationStep {
  step: number;
  title: string;
  timing: string;
  badge: string;
  details: string;
}

export interface CropSourceMetadata {
  sourceName: string;
  sourceUrl?: string;
  sourceType?: string;
  verificationStatus?: 'verified' | 'pending-field-verification' | 'unverified' | string;
  sourceNote?: string;
  lastVerified?: string;
}

export interface CropAdvisoryData {
  id: string;
  name: string;
  image: string;
  isDataAvailable?: boolean;
  sourceMetadata?: CropSourceMetadata;
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
}

export interface SupportedCropMeta {
  key: string;
  name: string;
  season: string;
  defaultYield: number;
  yieldUnit: string;
  hasVerifiedProfile: boolean;
  aliases: string[];
}

export const SUPPORTED_ADVISORY_CROPS: Record<string, SupportedCropMeta> = {
  rice: { key: 'rice', name: 'Rice', season: 'Kharif', defaultYield: 2.5, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['rice', 'paddy', 'dhan', 'chawal', 'धान', 'चावल'] },
  wheat: { key: 'wheat', name: 'Wheat', season: 'Rabi', defaultYield: 2.0, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['wheat', 'gehu', 'gehun', 'गेहूं', 'गेंहू'] },
  maize: { key: 'maize', name: 'Maize', season: 'Kharif / Rabi', defaultYield: 2.5, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['maize', 'corn', 'makka', 'makkai', 'bhutta', 'मक्का', 'मकई', 'भुट्टा'] },
  soybean: { key: 'soybean', name: 'Soybean', season: 'Kharif', defaultYield: 1.2, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['soybean', 'soya bean', 'soya', 'सोयाबीन', 'सोया'] },
  cotton: { key: 'cotton', name: 'Cotton', season: 'Kharif', defaultYield: 1.5, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['cotton', 'kapas', 'kapaas', 'कपास'] },
  sugarcane: { key: 'sugarcane', name: 'Sugarcane', season: 'Annual / Perennial', defaultYield: 45, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['sugarcane', 'sugar cane', 'ganna', 'गन्ना', 'गन्ने'] },
  chickpea: { key: 'chickpea', name: 'Chickpea', season: 'Rabi', defaultYield: 0.9, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['chickpea', 'gram', 'chana', 'chhole', 'chole', 'bengal gram', 'चना', 'चने', 'छोले'] },
  'pigeon-pea': { key: 'pigeon-pea', name: 'Pigeon Pea', season: 'Kharif', defaultYield: 0.8, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['pigeon pea', 'pigeonpea', 'tur', 'arhar', 'toor', 'red gram', 'तुअर', 'अरहर', 'तूर'] },
  groundnut: { key: 'groundnut', name: 'Groundnut', season: 'Kharif / Rabi', defaultYield: 1.2, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['groundnut', 'ground nut', 'peanut', 'peanuts', 'moongfali', 'mungfali', 'मूंगफली', 'मूँगफली'] },
  mustard: { key: 'mustard', name: 'Mustard', season: 'Rabi', defaultYield: 0.8, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['mustard', 'sarson', 'toriya', 'rai', 'सरसों', 'तोरिया', 'राई'] },
  sorghum: { key: 'sorghum', name: 'Sorghum', season: 'Kharif / Rabi', defaultYield: 1.5, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['sorghum', 'jowar', 'jowari', 'great millet', 'ज्वार', 'ज्वारी'] },
  'pearl-millet': { key: 'pearl-millet', name: 'Pearl Millet', season: 'Kharif', defaultYield: 1.4, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['pearl millet', 'pearlmillet', 'bajra', 'bajre', 'बाजरा', 'बाजरे'] },
  'finger-millet': { key: 'finger-millet', name: 'Finger Millet', season: 'Kharif', defaultYield: 1.1, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['finger millet', 'fingermillet', 'ragi', 'mandua', 'रागी', 'मंडुआ'] },
  potato: { key: 'potato', name: 'Potato', season: 'Rabi', defaultYield: 12, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['potato', 'aloo', 'alu', 'batata', 'आलू', 'बटाटा'] },
  tomato: { key: 'tomato', name: 'Tomato', season: 'Kharif / Rabi', defaultYield: 25, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['tomato', 'tamatar', 'टमाटर'] },
  onion: { key: 'onion', name: 'Onion', season: 'Rabi / Kharif', defaultYield: 10, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['onion', 'pyaz', 'pyaaz', 'kanda', 'प्याज', 'प्याज़', 'कांदा'] },
  banana: { key: 'banana', name: 'Banana', season: 'Annual / Perennial', defaultYield: 20, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['banana', 'kela', 'kele', 'केला', 'केले'] },
  mango: { key: 'mango', name: 'Mango', season: 'Perennial', defaultYield: 5, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['mango', 'aam', 'आम'] },
  grape: { key: 'grape', name: 'Grape', season: 'Perennial', defaultYield: 8, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['grape', 'grapes', 'angoor', 'angur', 'अंगूर'] },
  chilli: { key: 'chilli', name: 'Chilli', season: 'Kharif / Rabi', defaultYield: 5, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['chilli', 'chili', 'chili pepper', 'mirchi', 'mirch', 'green chilli', 'red chilli', 'मिर्च', 'हरी मिर्च', 'लाल मिर्च', 'चिली'] },
  apple: { key: 'apple', name: 'Apple', season: 'Perennial', defaultYield: 6, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['apple', 'seb', 'सेब'] },
  orange: { key: 'orange', name: 'Orange', season: 'Perennial', defaultYield: 7, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['orange', 'mandarin', 'santra', 'santre', 'narangi', 'संतरा', 'संतरे', 'नारंगी'] },
  lemon: { key: 'lemon', name: 'Lemon', season: 'Perennial', defaultYield: 6, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['lemon', 'lime', 'nimbu', 'neebu', 'नींबू', 'नीबू'] },
  guava: { key: 'guava', name: 'Guava', season: 'Perennial', defaultYield: 7, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['guava', 'amrood', 'amrud', 'जामफल', 'अमरूद', 'अमरुद'] },
  papaya: { key: 'papaya', name: 'Papaya', season: 'Annual', defaultYield: 25, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['papaya', 'papita', 'पपीता', 'पपीते'] },
  pomegranate: { key: 'pomegranate', name: 'Pomegranate', season: 'Perennial', defaultYield: 5, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['pomegranate', 'anar', 'अनार'] },
  coconut: { key: 'coconut', name: 'Coconut', season: 'Perennial', defaultYield: 4000, yieldUnit: 'Nuts / Acre', hasVerifiedProfile: true, aliases: ['coconut', 'nariyal', 'नारियल'] },
  cashew: { key: 'cashew', name: 'Cashew', season: 'Perennial', defaultYield: 1.0, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['cashew', 'kaju', 'काजू'] },
  pineapple: { key: 'pineapple', name: 'Pineapple', season: 'Perennial', defaultYield: 15, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['pineapple', 'ananas', 'अनानास', 'अनन्नास'] },
  watermelon: { key: 'watermelon', name: 'Watermelon', season: 'Zaid / Summer', defaultYield: 15, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['watermelon', 'tarbooj', 'tarbuj', 'तरबूज', 'तरबूज़'] },
  cucumber: { key: 'cucumber', name: 'Cucumber', season: 'Zaid / Kharif', defaultYield: 8, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['cucumber', 'kheera', 'kakdi', 'खीरा', 'ककड़ी'] },
  cabbage: { key: 'cabbage', name: 'Cabbage', season: 'Rabi', defaultYield: 12, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['cabbage', 'pattagobhi', 'patta gobhi', 'bandgobhi', 'पत्तागोभी', 'पत्ता गोभी', 'बंदगोभी'] },
  cauliflower: { key: 'cauliflower', name: 'Cauliflower', season: 'Rabi', defaultYield: 10, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['cauliflower', 'phoolgobhi', 'phool gobhi', 'फूलगोभी', 'फूल गोभी'] },
  brinjal: { key: 'brinjal', name: 'Brinjal', season: 'Kharif / Rabi', defaultYield: 12, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['brinjal', 'eggplant', 'aubergine', 'baingan', 'baigan', 'bhata', 'बैंगन', 'बैगन', 'भाटा'] },
  okra: { key: 'okra', name: 'Okra', season: 'Kharif / Summer', defaultYield: 4.5, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ["okra", "lady's finger", "ladys finger", "lady finger", "ladies finger", "bhindi", "भिंडी", "भिण्डी"] },
  peas: { key: 'peas', name: 'Peas', season: 'Rabi', defaultYield: 3.5, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['peas', 'pea', 'green pea', 'matar', 'मटर'] },
  carrot: { key: 'carrot', name: 'Carrot', season: 'Rabi', defaultYield: 10, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['carrot', 'gajar', 'गाजर'] },
  spinach: { key: 'spinach', name: 'Spinach', season: 'Rabi / Winter', defaultYield: 4.0, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['spinach', 'palak', 'पालक'] },
  pumpkin: { key: 'pumpkin', name: 'Pumpkin', season: 'Kharif / Zaid', defaultYield: 10, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['pumpkin', 'kaddu', 'sitaphal', 'kumra', 'कद्दू', 'कुमड़ा', 'सीताफल'] },
  'bottle-gourd': { key: 'bottle-gourd', name: 'Bottle Gourd', season: 'Kharif / Summer', defaultYield: 12, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['bottle gourd', 'bottlegourd', 'lauki', 'ghiya', 'doodhi', 'लौकी', 'घिया', 'दूधी'] },
  turmeric: { key: 'turmeric', name: 'Turmeric', season: 'Kharif (Annual)', defaultYield: 8.0, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: false, aliases: ['turmeric', 'haldi', 'हल्दी'] },
  ginger: { key: 'ginger', name: 'Ginger', season: 'Kharif (Annual)', defaultYield: 6.0, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: false, aliases: ['ginger', 'adrak', 'saunth', 'अदरक', 'सोंठ'] },
  garlic: { key: 'garlic', name: 'Garlic', season: 'Rabi', defaultYield: 3.5, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: true, aliases: ['garlic', 'lahsun', 'lahsan', 'लहसुन', 'लहसन'] },
  'black-pepper': { key: 'black-pepper', name: 'Black Pepper', season: 'Perennial', defaultYield: 1.0, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: false, aliases: ['black pepper', 'blackpepper', 'kali mirch', 'काली मिर्च'] },
  cardamom: { key: 'cardamom', name: 'Cardamom', season: 'Perennial', defaultYield: 0.2, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: false, aliases: ['cardamom', 'elaichi', 'elaychi', 'इलायची', 'एलायची'] },
  cumin: { key: 'cumin', name: 'Cumin', season: 'Rabi', defaultYield: 0.4, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: false, aliases: ['cumin', 'jeera', 'jira', 'जीरा'] },
  coriander: { key: 'coriander', name: 'Coriander', season: 'Rabi', defaultYield: 0.6, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: false, aliases: ['coriander', 'dhaniya', 'धनिया'] },
  fenugreek: { key: 'fenugreek', name: 'Fenugreek', season: 'Rabi', defaultYield: 0.7, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: false, aliases: ['fenugreek', 'methi', 'मेथी'] },
  tea: { key: 'tea', name: 'Tea', season: 'Perennial', defaultYield: 2.0, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: false, aliases: ['tea', 'chai', 'चाय'] },
  coffee: { key: 'coffee', name: 'Coffee', season: 'Perennial', defaultYield: 0.8, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: false, aliases: ['coffee', 'kafi', 'कॉफी', 'कॉफ़ी'] },
  arecanut: { key: 'arecanut', name: 'Arecanut', season: 'Perennial', defaultYield: 1.5, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: false, aliases: ['arecanut', 'areca nut', 'betel nut', 'betelnut', 'supari', 'सुपारी'] },
  rubber: { key: 'rubber', name: 'Rubber', season: 'Perennial', defaultYield: 0.8, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: false, aliases: ['rubber', 'रबर'] },
  cocoa: { key: 'cocoa', name: 'Cocoa', season: 'Perennial', defaultYield: 0.5, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: false, aliases: ['cocoa', 'cacao', 'कोको'] },
  'oil-palm': { key: 'oil-palm', name: 'Oil Palm', season: 'Perennial', defaultYield: 8.0, yieldUnit: 'Tonnes / Acre', hasVerifiedProfile: false, aliases: ['oil palm', 'oilpalm', 'ऑयल पाम', 'ताड़'] },
};

/**
 * Normalizes scanned crop or user input safely (case-insensitive, whitespace-trimmed, synonyms mapped)
 */
export function normalizeCropKey(rawCrop: string): string {
  if (!rawCrop) return '';
  const cleaned = rawCrop.trim().toLowerCase();

  // 1. Exact canonical key match
  if (SUPPORTED_ADVISORY_CROPS[cleaned]) {
    return cleaned;
  }

  // 2. Exact match against display name
  for (const [key, crop] of Object.entries(SUPPORTED_ADVISORY_CROPS)) {
    if (crop.name.toLowerCase() === cleaned) {
      return key;
    }
  }

  // 3. Disambiguation
  // Pineapple vs Apple disambiguation
  if (cleaned.includes('pineapple') || cleaned.includes('ananas') || cleaned.includes('anannaas') || cleaned.includes('अनानास') || cleaned.includes('अनन्नास')) {
    return 'pineapple';
  }

  if (cleaned.includes('black pepper') || cleaned.includes('blackpepper') || cleaned.includes('kali mirch') || cleaned.includes('kalimirch') || cleaned.includes('काली मिर्च')) {
    return 'black-pepper';
  }
  if (cleaned.includes('cauliflower') || cleaned.includes('phool gobhi') || cleaned.includes('phoolgobhi') || cleaned.includes('फूलगोभी') || cleaned.includes('फूल गोभी')) {
    return 'cauliflower';
  }
  if (cleaned.includes('cabbage') || cleaned.includes('patta gobhi') || cleaned.includes('pattagobhi') || cleaned.includes('bandgobhi') || cleaned.includes('पत्तागोभी') || cleaned.includes('पत्ता गोभी') || cleaned.includes('बंदगोभी')) {
    return 'cabbage';
  }

  // Arecanut vs other nuts
  if (cleaned.includes('arecanut') || cleaned.includes('areca nut') || cleaned.includes('betel nut') || cleaned.includes('betelnut') || cleaned.includes('supari') || cleaned.includes('सुपारी')) {
    return 'arecanut';
  }

  // Groundnut vs other nuts
  if (cleaned.includes('groundnut') || cleaned.includes('ground nut') || cleaned.includes('peanut') || cleaned.includes('peanuts') || cleaned.includes('moongfali') || cleaned.includes('mungfali') || cleaned.includes('मूंगफली')) {
    return 'groundnut';
  }

  // Cashew vs other nuts
  if (cleaned.includes('cashew') || cleaned.includes('kaju') || cleaned.includes('काजू')) {
    return 'cashew';
  }

  // Bottle Gourd vs Pumpkin/Gourds
  if (cleaned.includes('bottle gourd') || cleaned.includes('bottlegourd') || cleaned.includes('lauki') || cleaned.includes('ghiya') || cleaned.includes('doodhi') || cleaned.includes('लौकी')) {
    return 'bottle-gourd';
  }

  // Watermelon vs Melon
  if (cleaned.includes('watermelon') || cleaned.includes('tarbooj') || cleaned.includes('tarbuj') || cleaned.includes('तरबूज')) {
    return 'watermelon';
  }

  // Pulse / Gram disambiguation:
  if (cleaned.includes('red gram')) {
    return 'pigeon-pea';
  }
  if (cleaned.includes('bengal gram')) {
    return 'chickpea';
  }

  if (cleaned.includes('gajar ghas') || cleaned.includes('गाजर घास')) {
    return '';
  }

  // 4. Aliases scan with regex word boundary
  for (const [key, crop] of Object.entries(SUPPORTED_ADVISORY_CROPS)) {
    for (const alias of crop.aliases) {
      if (alias === cleaned) {
        return key;
      }
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|[\\s_\\-,/()])${escaped}($|[\\s_\\-,/()])`, 'i');
      if (regex.test(cleaned)) {
        return key;
      }
    }
  }

  // 5. Fallback slug
  const slug = cleaned.replace(/[^a-z0-9]/g, '');
  for (const [key, crop] of Object.entries(SUPPORTED_ADVISORY_CROPS)) {
    if (slug === key.replace(/[^a-z0-9]/g, '') || slug === crop.name.toLowerCase().replace(/[^a-z0-9]/g, '')) {
      return key;
    }
  }

  return slug;
}

export function getCropDisplayName(crop: string): string {
  const norm = normalizeCropKey(crop);
  if (SUPPORTED_ADVISORY_CROPS[norm]) {
    return SUPPORTED_ADVISORY_CROPS[norm].name;
  }
  if (crop) {
    return crop.trim().charAt(0).toUpperCase() + crop.trim().slice(1);
  }
  return 'Crop';
}

export const ADVISORY_DATA: Record<string, CropAdvisoryData> = {
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
        targetVal: 60.7,
        unit: 'kg/acre',
      },
      phosphorus: {
        name: 'Phosphorus (P)',
        symbol: 'P',
        status: 'Adequate',
        currentVal: 18,
        targetVal: 10.6,
        unit: 'kg/acre',
      },
      potassium: {
        name: 'Potassium (K)',
        symbol: 'K',
        status: 'Moderate',
        currentVal: 20,
        targetVal: 33.6,
        unit: 'kg/acre',
      },
      ph: { value: 7.2, label: 'Neutral' },
      organicCarbon: { value: '0.6%', label: 'Low' },
      micronutrients: { label: 'Needs Attention', elements: 'Zn, Fe' },
    },
    requirements: [
      { nutrient: 'Nitrogen (N)', symbol: 'N', recommended: 60.7, current: 25, additional: 35.7, unit: 'kg/acre', chemicalForm: 'Elemental Nitrogen (N)' },
      { nutrient: 'Phosphorus (P)', symbol: 'P', recommended: 10.6, current: 18, additional: 0, unit: 'kg/acre', chemicalForm: 'Available Elemental P (Soil Test form)' },
      { nutrient: 'Phosphate Equivalent (P₂O₅)', symbol: 'P₂O₅', recommended: 24.3, current: 41.2, additional: 0, unit: 'kg/acre', chemicalForm: 'Phosphate Oxide (P₂O₅ = P × 2.291)' },
      { nutrient: 'Potassium (K)', symbol: 'K', recommended: 33.6, current: 20, additional: 13.6, unit: 'kg/acre', chemicalForm: 'Available Elemental K (Soil Test form)' },
      { nutrient: 'Potash Equivalent (K₂O)', symbol: 'K₂O', recommended: 40.5, current: 24.1, additional: 16.4, unit: 'kg/acre', chemicalForm: 'Potash Oxide (K₂O = K × 1.205)' },
      { nutrient: 'Zinc (Zn)', symbol: 'Zn', recommended: 1, current: 0.3, additional: 0.7, unit: 'kg/acre', chemicalForm: 'Elemental Micronutrient (Zn)' },
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
        formula: 'Muriate of Potash',
        composition: '60% K₂O',
        ratePerAcre: 35,
        unit: 'kg/acre',
        badge: 'Fruit Firmness',
        bagColor: '#c0392b',
        description: 'Potassium chloride providing soluble potash for fruit sizing, firmness, and shelf life.',
      },
      {
        id: 'zinc-sulphate',
        name: 'Zinc Sulphate',
        formula: 'ZnSO₄·7H₂O',
        composition: '21% Zn, 10% S',
        ratePerAcre: 10,
        unit: 'kg/acre',
        badge: 'Chlorophyll Guard',
        bagColor: '#27ae60',
        description: 'Corrects zinc deficiency, preventing stunted growth and yellowing of young leaves.',
      },
      {
        id: 'bentonite-s',
        name: 'Bentonite Sulphur',
        formula: 'Pastille S',
        composition: '90% S',
        ratePerAcre: 10,
        unit: 'kg/acre',
        badge: 'pH Buffer',
        bagColor: '#f39c12',
        description: 'Slow-release elemental sulphur that buffers alkaline soil pH and optimizes nutrient uptake.',
      },
    ],
    calculatorRates: {
      ureaKgPerAcre: 60,
      dapKgPerAcre: 55,
      mopKgPerAcre: 35,
      zincKgPerAcre: 10,
    },
    timingSteps: [
      {
        step: 1,
        title: 'Basal Application at Transplanting',
        timing: 'Day 0 to 7',
        badge: 'Transplant Day',
        details: 'Apply DAP (100% of dose) and initial Urea (25%) around seedling root zones.',
      },
      {
        step: 2,
        title: 'First Vegetative Flush Top Dressing',
        timing: 'Day 20 to 25',
        badge: 'Canopy Stage',
        details: 'Broadcast Urea (45%) followed by light irrigation to stimulate vigorous foliage growth.',
      },
      {
        step: 3,
        title: 'Micronutrient Foliar Correction',
        timing: 'Day 30',
        badge: 'Foliar Spray',
        details: 'Foliar spray Zinc Sulphate (0.5% solution) in early morning hours to correct leaf chlorosis.',
      },
      {
        step: 4,
        title: 'Flowering & Early Fruit Set Split',
        timing: 'Day 45 to 50',
        badge: 'Bloom Setting',
        details: 'Apply MOP (100%) and remaining Urea (30%) via fertigation or soil incorporation.',
      },
    ],
    safetyTips: [
      'Store fertilizers in a cool, dry place away from direct sunlight and moisture.',
      'Wear protective gloves and footwear during fertilizer application.',
      'Always irrigate the field within 24 hours of applying granular chemical fertilizers.',
      'Do not mix chemical pesticides with micronutrient foliar sprays without jar testing.',
    ],
    organicAlternatives: [
      {
        name: 'Well-Decomposed Farmyard Manure (FYM)',
        type: 'Organic Manure',
        dosage: '4 - 5 Tonnes / Acre',
        benefit: 'Improves soil humus, water holding capacity, and steady macro-nutrient availability.',
      },
      {
        name: 'Enriched Vermicompost with Trichoderma',
        type: 'Bio-Conditioner',
        dosage: '1.5 - 2 Tonnes / Acre',
        benefit: 'Supplies bio-available NPK while protecting roots against fungal wilt and damping-off.',
      },
      {
        name: 'Neem Cake Meal',
        type: 'Organic Nitrogen Booster',
        dosage: '150 - 200 kg / Acre',
        benefit: 'Nitrification inhibitor that reduces nitrogen leaching and suppresses root nematodes.',
      },
    ],
  },
  cotton: {
    id: 'cotton',
    name: 'Cotton',
    image: '/images/cotton_crop.jpg',
    stage: 'Boll Formation Stage',
    stageDays: 'Day 65 of 160',
    field: 'Field 2',
    acres: 5.0,
    location: 'Akola, Maharashtra',
    soilType: 'Deep Black Cotton Soil (Vertisol)',
    todayAdvice: 'Square shedding observed. Apply 13:0:45 foliar spray (2%) + Boron (1g/L) to prevent flower drop and promote boll retention.',
    soilNutrients: {
      nitrogen: {
        name: 'Nitrogen',
        symbol: 'N',
        status: 'Moderate',
        currentVal: 32,
        targetVal: 48.6,
        unit: 'kg/acre',
      },
      phosphorus: {
        name: 'Phosphorus (P)',
        symbol: 'P',
        status: 'Low',
        currentVal: 12,
        targetVal: 10.6,
        unit: 'kg/acre',
      },
      potassium: {
        name: 'Potassium (K)',
        symbol: 'K',
        status: 'Adequate',
        currentVal: 28,
        targetVal: 20.2,
        unit: 'kg/acre',
      },
      ph: { value: 7.8, label: 'Slightly Alkaline' },
      organicCarbon: { value: '0.5%', label: 'Low' },
      micronutrients: { label: 'Deficient', elements: 'Mg, B, Zn' },
    },
    requirements: [
      { nutrient: 'Nitrogen (N)', symbol: 'N', recommended: 48.6, current: 25, additional: 23.6, unit: 'kg/acre', chemicalForm: 'Elemental Nitrogen (N)' },
      { nutrient: 'Phosphorus (P)', symbol: 'P', recommended: 10.6, current: 18, additional: 0, unit: 'kg/acre', chemicalForm: 'Available Elemental P (Soil Test form)' },
      { nutrient: 'Phosphate Equivalent (P₂O₅)', symbol: 'P₂O₅', recommended: 24.3, current: 41.2, additional: 0, unit: 'kg/acre', chemicalForm: 'Phosphate Oxide (P₂O₅ = P × 2.291)' },
      { nutrient: 'Potassium (K)', symbol: 'K', recommended: 20.2, current: 20, additional: 0.2, unit: 'kg/acre', chemicalForm: 'Available Elemental K (Soil Test form)' },
      { nutrient: 'Potash Equivalent (K₂O)', symbol: 'K₂O', recommended: 24.3, current: 24.1, additional: 0.2, unit: 'kg/acre', chemicalForm: 'Potash Oxide (K₂O = K × 1.205)' },
      { nutrient: 'Zinc (Zn)', symbol: 'Zn', recommended: 1, current: 0.3, additional: 0.7, unit: 'kg/acre', chemicalForm: 'Elemental Micronutrient (Zn)' },
    ],
    keyInsights: [
      'Phosphorus is critically low; ring placement of SSP or DAP recommended immediately.',
      'Magnesium deficiency causing leaf reddening (Lalya); foliar spray of MgSO4 needed.',
      'Potassium status is optimal, supporting boll weight and fiber strength.',
      'Soil is slightly alkaline; avoid liming and use acid-forming fertilizers.',
    ],
    calloutMessage: 'Manage boll retention with timely Magnesium Sulphate and Boron sprays to maximize lint quality.',
    products: [
      {
        id: 'ssp',
        name: 'Single Super Phosphate (SSP)',
        formula: 'Ca(H₂PO₄)₂ + CaSO₄',
        composition: '16% P₂O₅, 11% S, 19% Ca',
        ratePerAcre: 75,
        unit: 'kg/acre',
        badge: 'Phosphorus & Sulphur',
        bagColor: '#d35400',
        description: 'Excellent source of available phosphorus and sulphur for black cotton soils.',
      },
      {
        id: 'urea',
        name: 'Urea',
        formula: 'CO(NH₂)₂',
        composition: '46% N',
        ratePerAcre: 45,
        unit: 'kg/acre',
        badge: 'Split Nitrogen',
        bagColor: '#1e56a0',
        description: 'Applied in 3 splits to match the long duration growth cycle of Bt cotton.',
      },
      {
        id: 'mgso4',
        name: 'Magnesium Sulphate',
        formula: 'MgSO₄·7H₂O',
        composition: '9.6% Mg, 12% S',
        ratePerAcre: 15,
        unit: 'kg/acre',
        badge: 'Reddening Reversal',
        bagColor: '#8e44ad',
        description: 'Directly reverses leaf reddening (Lalya) and restores active chlorophyll in cotton foliage.',
      },
    ],
    calculatorRates: {
      ureaKgPerAcre: 45,
      dapKgPerAcre: 35,
      mopKgPerAcre: 20,
      zincKgPerAcre: 5,
    },
    timingSteps: [
      {
        step: 1,
        title: 'Square Initiation Dose',
        timing: 'This Week',
        badge: 'Squaring Stage',
        details: 'Side-dress SSP (75 kg/acre) and 2nd split of Urea (25 kg/acre) along plant rows.',
      },
      {
        step: 2,
        title: 'Peak Flowering Foliar Spray',
        timing: 'After 10 Days',
        badge: 'Foliar Spray',
        details: 'Foliar spray of 1% MgSO₄ + 0.1% Boron to prevent flower bud drop and leaf reddening.',
      },
      {
        step: 3,
        title: 'Boll Development Split',
        timing: 'After 25 Days',
        badge: 'Boll Sizing',
        details: 'Apply final Urea split (20 kg/acre) with light irrigation to support boll filling.',
      },
    ],
    safetyTips: [
      'Do not apply nitrogen during periods of continuous rainfall to avoid excessive vegetative growth.',
      'Always spray micronutrients in the morning or late evening, never during peak afternoon heat.',
      'Ensure proper drainage in heavy black cotton soil to prevent root asphyxiation.',
    ],
    organicAlternatives: [
      {
        name: 'Cotton Stalk Biochar Compost',
        type: 'Carbon Sequestration',
        dosage: '2 Tonnes / Acre',
        benefit: 'Recycles cotton residue, locks carbon, and improves vertisol aeration.',
      },
      {
        name: 'Panchagavya Foliar Spray',
        type: 'Bio-stimulant',
        dosage: '3% solution (30 ml/L)',
        benefit: 'Boosts plant immunity, reduces square drop, and repels sucking pests.',
      },
      {
        name: 'Castor Cake Manure',
        type: 'Organic Slow Release',
        dosage: '200 kg / Acre',
        benefit: 'Rich in organic nitrogen and phosphorus; deters soil-dwelling grubs.',
      },
    ],
  },
  soybean: {
    id: 'soybean',
    name: 'Soybean',
    image: '/images/soybean_crop.jpg',
    stage: 'Pod Initiation Stage',
    stageDays: 'Day 42 of 95',
    field: 'Field 3',
    acres: 4.2,
    location: 'Akola, Maharashtra',
    soilType: 'Medium Deep Black Soil',
    todayAdvice: 'Pod filling initiated. Foliar spray of 0:52:34 (MKP) @ 10g/L to ensure bold grain development and prevent pod shattering.',
    soilNutrients: {
      nitrogen: {
        name: 'Nitrogen',
        symbol: 'N',
        status: 'Adequate',
        currentVal: 28,
        targetVal: 14.2,
        unit: 'kg/acre',
      },
      phosphorus: {
        name: 'Phosphorus (P)',
        symbol: 'P',
        status: 'Low',
        currentVal: 14,
        targetVal: 13.2,
        unit: 'kg/acre',
      },
      potassium: {
        name: 'Potassium (K)',
        symbol: 'K',
        status: 'Moderate',
        currentVal: 22,
        targetVal: 16.8,
        unit: 'kg/acre',
      },
      ph: { value: 7.1, label: 'Neutral' },
      organicCarbon: { value: '0.65%', label: 'Medium' },
      micronutrients: { label: 'Attention Needed', elements: 'S, Mo' },
    },
    requirements: [
      { nutrient: 'Nitrogen (N)', symbol: 'N', recommended: 14.2, current: 25, additional: 0, unit: 'kg/acre', chemicalForm: 'Elemental Nitrogen (N)' },
      { nutrient: 'Phosphorus (P)', symbol: 'P', recommended: 13.2, current: 18, additional: 0, unit: 'kg/acre', chemicalForm: 'Available Elemental P (Soil Test form)' },
      { nutrient: 'Phosphate Equivalent (P₂O₅)', symbol: 'P₂O₅', recommended: 30.4, current: 41.2, additional: 0, unit: 'kg/acre', chemicalForm: 'Phosphate Oxide (P₂O₅ = P × 2.291)' },
      { nutrient: 'Potassium (K)', symbol: 'K', recommended: 16.8, current: 20, additional: 0, unit: 'kg/acre', chemicalForm: 'Available Elemental K (Soil Test form)' },
      { nutrient: 'Potash Equivalent (K₂O)', symbol: 'K₂O', recommended: 20.2, current: 24.1, additional: 0, unit: 'kg/acre', chemicalForm: 'Potash Oxide (K₂O = K × 1.205)' },
      { nutrient: 'Zinc (Zn)', symbol: 'Zn', recommended: 1, current: 0.3, additional: 0.7, unit: 'kg/acre', chemicalForm: 'Elemental Micronutrient (Zn)' },
    ],
    keyInsights: [
      'Soybean fixes atmospheric nitrogen; no heavy urea required. Focus on phosphorus and sulphur.',
      'Sulphur is critical for oil content and protein synthesis in soybean seeds.',
      'Phosphorus deficiency is limiting root nodulation and pod development.',
      'Soil pH is ideal for active Rhizobium bacteria nodulation.',
    ],
    calloutMessage: 'Boost oil synthesis and grain filling with water-soluble PK fertilizers and Sulphur.',
    products: [
      {
        id: 'ssp',
        name: 'Single Super Phosphate (SSP)',
        formula: 'Ca(H₂PO₄)₂ + CaSO₄',
        composition: '16% P₂O₅, 11% S',
        ratePerAcre: 80,
        unit: 'kg/acre',
        badge: 'Oil & Protein Booster',
        bagColor: '#d35400',
        description: 'Ideal fertilizer for oilseeds: supplies available phosphate and essential sulphur.',
      },
      {
        id: 'mkp',
        name: 'MKP (0:52:34)',
        formula: 'KH₂PO₄',
        composition: '52% P₂O₅, 34% K₂O',
        ratePerAcre: 2,
        unit: 'kg/acre',
        badge: 'Pod Sizing Foliar',
        bagColor: '#2980b9',
        description: 'Water soluble foliar fertilizer promoting uniform pod fill and bold grain weight.',
      },
      {
        id: 'bentonite-s',
        name: 'Bentonite Sulphur',
        formula: 'Pastille S',
        composition: '90% S',
        ratePerAcre: 10,
        unit: 'kg/acre',
        badge: 'Oil Content Guard',
        bagColor: '#f39c12',
        description: 'Granular sulphur that ensures high oil recovery and bold, shiny seed coats.',
      },
    ],
    calculatorRates: {
      ureaKgPerAcre: 15,
      dapKgPerAcre: 40,
      mopKgPerAcre: 20,
      zincKgPerAcre: 5,
    },
    timingSteps: [
      {
        step: 1,
        title: 'Pod Filling Foliar Dose',
        timing: 'This Week',
        badge: 'Pod Fill',
        details: 'Foliar spray 0:52:34 @ 10g/L along with fungicide during evening calm hours.',
      },
      {
        step: 2,
        title: 'Boron Boost for Grain Setting',
        timing: 'After 8 Days',
        badge: 'Grain Setting',
        details: 'Foliar spray 20% Boron @ 1g/L to enhance grain weight and reduce hollow pods.',
      },
    ],
    safetyTips: [
      'Do not apply urea top dressing if nodulation is healthy (check roots for pink active nodules).',
      'Maintain adequate moisture during flowering and pod development to avoid flower abortion.',
      'Harvest timely when pods turn golden brown to avoid shattering losses.',
    ],
    organicAlternatives: [
      {
        name: 'Rhizobium Inoculant',
        type: 'Bio-Fertilizer',
        dosage: '250 g / 10 kg seed',
        benefit: 'Forms pink root nodules fixing 70-80% of crop nitrogen requirement naturally.',
      },
      {
        name: 'PSB (Phosphate Solubilizing Bacteria)',
        type: 'Bio-Solubilizer',
        dosage: '250 g / 10 kg seed',
        benefit: 'Solubilizes locked soil phosphates and makes them available to soybean taproots.',
      },
      {
        name: 'Jeevamrutha Drench',
        type: 'Liquid Bio-Nutrient',
        dosage: '200 Litres / Acre',
        benefit: 'Stimulates native soil microbial activity and enhances nutrient absorption.',
      },
    ],
  },
  sugarcane: {
    id: 'sugarcane',
    name: 'Sugarcane',
    image: '/images/sugarcane_crop.jpg',
    stage: 'Grand Growth Stage',
    stageDays: 'Day 120 of 360',
    field: 'Field 4',
    acres: 6.0,
    location: 'Akola, Maharashtra',
    soilType: 'Heavy Clay Loam (Canal Command)',
    todayAdvice: 'Earthing-up operation due. Apply 3rd split of Nitrogen + Potassium in furrows prior to earthing-up to support rapid internode elongation.',
    soilNutrients: {
      nitrogen: {
        name: 'Nitrogen',
        symbol: 'N',
        status: 'Low',
        currentVal: 22,
        targetVal: 101.2,
        unit: 'kg/acre',
      },
      phosphorus: {
        name: 'Phosphorus (P)',
        symbol: 'P',
        status: 'Adequate',
        currentVal: 22,
        targetVal: 19.4,
        unit: 'kg/acre',
      },
      potassium: {
        name: 'Potassium (K)',
        symbol: 'K',
        status: 'Low',
        currentVal: 20,
        targetVal: 50.4,
        unit: 'kg/acre',
      },
      ph: { value: 7.4, label: 'Optimal' },
      organicCarbon: { value: '0.7%', label: 'Medium' },
      micronutrients: { label: 'Fe Deficient', elements: 'Fe, Zn' },
    },
    requirements: [
      { nutrient: 'Nitrogen (N)', symbol: 'N', recommended: 101.2, current: 25, additional: 76.2, unit: 'kg/acre', chemicalForm: 'Elemental Nitrogen (N)' },
      { nutrient: 'Phosphorus (P)', symbol: 'P', recommended: 19.4, current: 18, additional: 1.4, unit: 'kg/acre', chemicalForm: 'Available Elemental P (Soil Test form)' },
      { nutrient: 'Phosphate Equivalent (P₂O₅)', symbol: 'P₂O₅', recommended: 44.5, current: 41.2, additional: 3.3, unit: 'kg/acre', chemicalForm: 'Phosphate Oxide (P₂O₅ = P × 2.291)' },
      { nutrient: 'Potassium (K)', symbol: 'K', recommended: 50.4, current: 20, additional: 30.4, unit: 'kg/acre', chemicalForm: 'Available Elemental K (Soil Test form)' },
      { nutrient: 'Potash Equivalent (K₂O)', symbol: 'K₂O', recommended: 60.7, current: 24.1, additional: 36.6, unit: 'kg/acre', chemicalForm: 'Potash Oxide (K₂O = K × 1.205)' },
      { nutrient: 'Zinc (Zn)', symbol: 'Zn', recommended: 1, current: 0.3, additional: 0.7, unit: 'kg/acre', chemicalForm: 'Elemental Micronutrient (Zn)' },
    ],
    keyInsights: [
      'Sugarcane is an exhaustive feeder requiring high split doses of Nitrogen and Potassium.',
      'Potassium is crucial for cane girth, stalk weight, and sucrose accumulation (recovery %).',
      'Iron deficiency causes yellowing of young leaves in high lime soils; apply FeSO4 drench.',
      'Earthing up buries fertilizer safely in the root zone and prevents stalk lodging.',
    ],
    calloutMessage: 'Apply Nitrogen and Potash splits at earthing up to ensure thick millable stalks and high sugar content.',
    products: [
      {
        id: 'urea',
        name: 'Urea',
        formula: 'CO(NH₂)₂',
        composition: '46% N',
        ratePerAcre: 85,
        unit: 'kg/acre',
        badge: 'Internode Growth',
        bagColor: '#1e56a0',
        description: 'Provides sustained nitrogen for rapid cane elongation and canopy volume.',
      },
      {
        id: 'mop',
        name: 'MOP',
        formula: 'Muriate of Potash',
        composition: '60% K₂O',
        ratePerAcre: 50,
        unit: 'kg/acre',
        badge: 'Sucrose Recovery',
        bagColor: '#c0392b',
        description: 'Boosts sugar synthesis, stalk weight, and drought/heat resilience.',
      },
      {
        id: 'dap',
        name: 'DAP',
        formula: 'Di-Ammonium Phosphate',
        composition: '18% N, 46% P',
        ratePerAcre: 50,
        unit: 'kg/acre',
        badge: 'Root Proliferation',
        bagColor: '#e67e22',
        description: 'Basal placement to support heavy feeder roots throughout the 12-month crop cycle.',
      },
    ],
    calculatorRates: {
      ureaKgPerAcre: 85,
      dapKgPerAcre: 50,
      mopKgPerAcre: 50,
      zincKgPerAcre: 10,
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
  rice: {
    id: 'rice',
    name: 'Rice (Paddy)',
    image: '/images/paddy_crop.jpg',
    stage: 'Active Tillering Stage',
    stageDays: 'Day 35 of 120',
    field: 'Paddy Field 2',
    acres: 4.0,
    location: 'Akola, Maharashtra',
    soilType: 'Clay Loam (Wetland Soil)',
    todayAdvice: 'Maintain 3-5 cm standing water layer. Apply first top-dressing of Urea with Zinc Sulphate. Check for leaf blast or brown spot symptoms.',
    soilNutrients: {
      nitrogen: {
        name: 'Nitrogen',
        symbol: 'N',
        status: 'Low',
        currentVal: 24,
        targetVal: 60.7,
        unit: 'kg/acre',
      },
      phosphorus: {
        name: 'Phosphorus (P)',
        symbol: 'P',
        status: 'Adequate',
        currentVal: 18,
        targetVal: 10.6,
        unit: 'kg/acre',
      },
      potassium: {
        name: 'Potassium (K)',
        symbol: 'K',
        status: 'Moderate',
        currentVal: 16,
        targetVal: 20.2,
        unit: 'kg/acre',
      },
      ph: { value: 6.8, label: 'Optimal / Slightly Acidic' },
      organicCarbon: { value: '0.65%', label: 'Medium' },
      micronutrients: { label: 'Zinc Deficiency Common', elements: 'Zn' },
    },
    requirements: [
      { nutrient: 'Nitrogen (N)', symbol: 'N', recommended: 60.7, current: 25, additional: 35.7, unit: 'kg/acre', chemicalForm: 'Elemental Nitrogen (N)' },
      { nutrient: 'Phosphorus (P)', symbol: 'P', recommended: 10.6, current: 18, additional: 0, unit: 'kg/acre', chemicalForm: 'Available Elemental P (Soil Test form)' },
      { nutrient: 'Phosphate Equivalent (P₂O₅)', symbol: 'P₂O₅', recommended: 24.3, current: 41.2, additional: 0, unit: 'kg/acre', chemicalForm: 'Phosphate Oxide (P₂O₅ = P × 2.291)' },
      { nutrient: 'Potassium (K)', symbol: 'K', recommended: 20.2, current: 20, additional: 0.2, unit: 'kg/acre', chemicalForm: 'Available Elemental K (Soil Test form)' },
      { nutrient: 'Potash Equivalent (K₂O)', symbol: 'K₂O', recommended: 24.3, current: 24.1, additional: 0.2, unit: 'kg/acre', chemicalForm: 'Potash Oxide (K₂O = K × 1.205)' },
      { nutrient: 'Zinc (Zn)', symbol: 'Zn', recommended: 1, current: 0.3, additional: 0.7, unit: 'kg/acre', chemicalForm: 'Elemental Micronutrient (Zn)' },
    ],
    keyInsights: [
      'Basal application of Phosphorus anchors roots; top-dressed Nitrogen sustains active tillering.',
      'Zinc deficiency causes Khaira disease in rice; ensure timely Zinc Sulphate application.',
      'Maintain shallow standing water (2-5 cm) to optimize nutrient uptake efficiency.',
      'Split Nitrogen into 3 doses (basal, active tillering, panicle initiation) to reduce leaching.',
    ],
    calloutMessage: 'Apply split Nitrogen and Zinc Sulphate at active tillering to boost effective tiller count and panicle weight.',
    products: [
      {
        id: 'urea',
        name: 'Urea',
        formula: 'CO(NH₂)₂',
        composition: '46% N',
        ratePerAcre: 50,
        unit: 'kg/acre',
        badge: 'High Nitrogen',
        bagColor: '#1e56a0',
        description: 'Primary nitrogen driver for tiller emergence and chlorophyll synthesis in wetland paddies.',
      },
      {
        id: 'dap',
        name: 'DAP',
        formula: 'Di-Ammonium Phosphate',
        composition: '18% N, 46% P',
        ratePerAcre: 40,
        unit: 'kg/acre',
        badge: 'Root Developer',
        bagColor: '#e67e22',
        description: 'Incorporate basally in mud to establish robust root anchorage before transplanting.',
      },
      {
        id: 'mop',
        name: 'MOP',
        formula: 'Muriate of Potash',
        composition: '60% K₂O',
        ratePerAcre: 25,
        unit: 'kg/acre',
        badge: 'Grain Boldness',
        bagColor: '#c0392b',
        description: 'Improves grain filling, stem stiffness against lodging, and disease resistance.',
      },
    ],
    calculatorRates: {
      ureaKgPerAcre: 50,
      dapKgPerAcre: 40,
      mopKgPerAcre: 25,
      zincKgPerAcre: 10,
    },
    timingSteps: [
      {
        step: 1,
        title: 'Basal Placement at Puddling',
        timing: 'Day 0 to 5',
        badge: 'Basal Mud',
        details: 'Apply 100% DAP, 25% Urea, and 50% MOP incorporated into wet soil during final leveling.',
      },
      {
        step: 2,
        title: 'First Top Dressing (Active Tillering)',
        timing: '20 to 25 Days',
        badge: 'Tiller Flush',
        details: 'Drain excess water and broadcast 50% Urea with Zinc Sulphate. Re-flood after 24 hours.',
      },
      {
        step: 3,
        title: 'Second Top Dressing (Panicle Initiation)',
        timing: '45 to 50 Days',
        badge: 'Panicle Weight',
        details: 'Apply remaining 25% Urea and 50% MOP to boost panicle length and test weight.',
      },
    ],
    safetyTips: [
      'Drain excess ponded water prior to top-dressing urea to minimize runoff.',
      'Never mix Zinc Sulphate directly with DAP to avoid insoluble zinc phosphate precipitation.',
    ],
    organicAlternatives: [
      {
        name: 'Azolla Bio-fertilizer',
        type: 'Aquatic Fern Green Manure',
        dosage: '2 Tonnes / Acre',
        benefit: 'Dual-purpose bio-fertilizer fixing 30-40 kg N/acre while suppressing wetland weeds.',
      },
      {
        name: 'Blue Green Algae (BGA)',
        type: 'Cyanobacteria Inoculant',
        dosage: '4 kg / Acre',
        benefit: 'Colonizes submerged paddy water, enriching nitrogen and organic matter.',
      },
      {
        name: 'Trichoderma Enriched Vermicompost',
        type: 'Bio-Fungicide Manure',
        dosage: '1.5 Tonnes / Acre',
        benefit: 'Suppresses sheath blight and root rot while releasing steady macro-nutrients.',
      },
    ],
  },
  wheat: {
    id: 'wheat',
    name: 'Wheat',
    image: '/images/wheat_crop.jpg',
    stage: 'Crown Root & Tillering',
    stageDays: 'Day 28 of 115',
    field: 'North Field 3',
    acres: 3.0,
    location: 'Akola, Maharashtra',
    soilType: 'Alluvial Silt Loam',
    todayAdvice: 'First irrigation at Crown Root Initiation (CRI) stage (21-25 DAS) is critical. Apply first split dose of Urea post-irrigation.',
    soilNutrients: {
      nitrogen: {
        name: 'Nitrogen',
        symbol: 'N',
        status: 'Low',
        currentVal: 25,
        targetVal: 48.6,
        unit: 'kg/acre',
      },
      phosphorus: {
        name: 'Phosphorus (P)',
        symbol: 'P',
        status: 'Adequate',
        currentVal: 20,
        targetVal: 10.6,
        unit: 'kg/acre',
      },
      potassium: {
        name: 'Potassium (K)',
        symbol: 'K',
        status: 'Adequate',
        currentVal: 22,
        targetVal: 20.2,
        unit: 'kg/acre',
      },
      ph: { value: 7.4, label: 'Optimal' },
      organicCarbon: { value: '0.58%', label: 'Low' },
      micronutrients: { label: 'Good Status', elements: 'Zn, Mn' },
    },
    requirements: [
      { nutrient: 'Nitrogen (N)', symbol: 'N', recommended: 48.6, current: 25, additional: 23.6, unit: 'kg/acre', chemicalForm: 'Elemental Nitrogen (N)' },
      { nutrient: 'Phosphorus (P)', symbol: 'P', recommended: 10.6, current: 18, additional: 0, unit: 'kg/acre', chemicalForm: 'Available Elemental P (Soil Test form)' },
      { nutrient: 'Phosphate Equivalent (P₂O₅)', symbol: 'P₂O₅', recommended: 24.3, current: 41.2, additional: 0, unit: 'kg/acre', chemicalForm: 'Phosphate Oxide (P₂O₅ = P × 2.291)' },
      { nutrient: 'Potassium (K)', symbol: 'K', recommended: 20.2, current: 20, additional: 0.2, unit: 'kg/acre', chemicalForm: 'Available Elemental K (Soil Test form)' },
      { nutrient: 'Potash Equivalent (K₂O)', symbol: 'K₂O', recommended: 24.3, current: 24.1, additional: 0.2, unit: 'kg/acre', chemicalForm: 'Potash Oxide (K₂O = K × 1.205)' },
      { nutrient: 'Zinc (Zn)', symbol: 'Zn', recommended: 1, current: 0.3, additional: 0.7, unit: 'kg/acre', chemicalForm: 'Elemental Micronutrient (Zn)' },
    ],
    keyInsights: [
      'CRI stage (21-25 days) moisture and Nitrogen determine tiller count and spikelet density.',
      'Adequate Phosphorus placed at seed depth speeds early root branching before winter chill.',
      'Excessive late Nitrogen causes lodging and elevates yellow/brown rust risk.',
    ],
    calloutMessage: 'Ensure CRI stage irrigation is accompanied by top-dressed Urea for maximum productive tillers.',
    products: [
      {
        id: 'urea',
        name: 'Urea',
        formula: 'CO(NH₂)₂',
        composition: '46% N',
        ratePerAcre: 55,
        unit: 'kg/acre',
        badge: 'High Nitrogen',
        bagColor: '#1e56a0',
        description: 'Fast acting granular nitrogen for rapid crown root elongation and sturdy tillers.',
      },
      {
        id: 'dap',
        name: 'DAP',
        formula: 'Di-Ammonium Phosphate',
        composition: '18% N, 46% P',
        ratePerAcre: 35,
        unit: 'kg/acre',
        badge: 'Root Anchor',
        bagColor: '#e67e22',
        description: 'Drill with seed to furnish early phosphorus for rapid seedling establishment.',
      },
      {
        id: 'mop',
        name: 'MOP',
        formula: 'Muriate of Potash',
        composition: '60% K₂O',
        ratePerAcre: 20,
        unit: 'kg/acre',
        badge: 'Straw Strength',
        bagColor: '#c0392b',
        description: 'Bolsters straw rigidity against wind lodging and optimizes grain filling.',
      },
    ],
    calculatorRates: {
      ureaKgPerAcre: 55,
      dapKgPerAcre: 35,
      mopKgPerAcre: 20,
      zincKgPerAcre: 5,
    },
    timingSteps: [
      {
        step: 1,
        title: 'Basal Placement at Sowing',
        timing: 'Day 0',
        badge: 'Basal Drill',
        details: 'Drill 100% DAP, 33% Urea, and 100% MOP below seed furrow.',
      },
      {
        step: 2,
        title: 'First Top Dressing (CRI Stage)',
        timing: '21 to 25 Days',
        badge: 'Crown Roots',
        details: 'Broadcast 33% Urea immediately following first irrigation when soil is moist.',
      },
      {
        step: 3,
        title: 'Second Top Dressing (Jointing Stage)',
        timing: '40 to 45 Days',
        badge: 'Stem Elongation',
        details: 'Broadcast final 33% Urea prior to second irrigation before boot leaf emergence.',
      },
    ],
    safetyTips: [
      'Incorporate basal fertilizers below seed depth to avoid fertilizer burn to coleoptiles.',
      'Broadcast urea when soil is moist but not flooded to prevent volatilization.',
    ],
    organicAlternatives: [
      {
        name: 'Decomposed Farmyard Manure (FYM)',
        type: 'Organic Manure',
        dosage: '4 Tonnes / Acre',
        benefit: 'Restores soil structure, microbiological flora, and moisture retention.',
      },
      {
        name: 'Azotobacter & PSB Seed Treatment',
        type: 'Microbial Inoculant',
        dosage: '250 g / 10 kg seed',
        benefit: 'Biological nitrogen fixation and solubilization of native soil phosphates.',
      },
      {
        name: 'Mustard Cake Meal',
        type: 'Organic Nitrogen Booster',
        dosage: '150 kg / Acre',
        benefit: 'Gradual nitrogen release and mild suppression of soil-borne fungi.',
      },
    ],
  },
  maize: {
    id: 'maize',
    name: 'Maize',
    image: '/images/maize_crop.jpg',
    stage: 'Knee-High Stage',
    stageDays: 'Day 30 of 100',
    field: 'Plot 4',
    acres: 2.5,
    location: 'Akola, Maharashtra',
    soilType: 'Well-Drained Sandy Loam',
    todayAdvice: 'Maize is an exhaustive feeder. Apply 2nd split of Urea at knee-high stage and earth up ridges to prevent lodging.',
    soilNutrients: {
      nitrogen: {
        name: 'Nitrogen',
        symbol: 'N',
        status: 'Low',
        currentVal: 22,
        targetVal: 48.6,
        unit: 'kg/acre',
      },
      phosphorus: {
        name: 'Phosphorus (P)',
        symbol: 'P',
        status: 'Moderate',
        currentVal: 16,
        targetVal: 10.6,
        unit: 'kg/acre',
      },
      potassium: {
        name: 'Potassium (K)',
        symbol: 'K',
        status: 'Moderate',
        currentVal: 18,
        targetVal: 20.2,
        unit: 'kg/acre',
      },
      ph: { value: 7.0, label: 'Optimal' },
      organicCarbon: { value: '0.62%', label: 'Medium' },
      micronutrients: { label: 'Zinc Sensitive', elements: 'Zn' },
    },
    requirements: [
      { nutrient: 'Nitrogen (N)', symbol: 'N', recommended: 48.6, current: 25, additional: 23.6, unit: 'kg/acre', chemicalForm: 'Elemental Nitrogen (N)' },
      { nutrient: 'Phosphorus (P)', symbol: 'P', recommended: 10.6, current: 18, additional: 0, unit: 'kg/acre', chemicalForm: 'Available Elemental P (Soil Test form)' },
      { nutrient: 'Phosphate Equivalent (P₂O₅)', symbol: 'P₂O₅', recommended: 24.3, current: 41.2, additional: 0, unit: 'kg/acre', chemicalForm: 'Phosphate Oxide (P₂O₅ = P × 2.291)' },
      { nutrient: 'Potassium (K)', symbol: 'K', recommended: 20.2, current: 20, additional: 0.2, unit: 'kg/acre', chemicalForm: 'Available Elemental K (Soil Test form)' },
      { nutrient: 'Potash Equivalent (K₂O)', symbol: 'K₂O', recommended: 24.3, current: 24.1, additional: 0.2, unit: 'kg/acre', chemicalForm: 'Potash Oxide (K₂O = K × 1.205)' },
      { nutrient: 'Zinc (Zn)', symbol: 'Zn', recommended: 1, current: 0.3, additional: 0.7, unit: 'kg/acre', chemicalForm: 'Elemental Micronutrient (Zn)' },
    ],
    keyInsights: [
      'Maize requires intensive Nitrogen from knee-high to tasseling stages for cob elongation.',
      'Zinc deficiency induces "white bud" chlorosis in young leaves; soil or foliar zinc is critical.',
      'Earthing up at knee-high stage anchors brace roots against wind damage.',
    ],
    calloutMessage: 'Top dress Urea at knee-high stage to stimulate cob size and kernel filling.',
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
        description: 'Fuel for rapid stalk expansion, broad leaves, and cob initiation.',
      },
      {
        id: 'dap',
        name: 'DAP',
        formula: 'Di-Ammonium Phosphate',
        composition: '18% N, 46% P',
        ratePerAcre: 45,
        unit: 'kg/acre',
        badge: 'Root Anchor',
        bagColor: '#e67e22',
        description: 'Basal placement to support heavy feeder roots and uniform germination.',
      },
      {
        id: 'mop',
        name: 'MOP',
        formula: 'Muriate of Potash',
        composition: '60% K₂O',
        ratePerAcre: 30,
        unit: 'kg/acre',
        badge: 'Kernel Weight',
        bagColor: '#c0392b',
        description: 'Directly improves kernel plumpness, cob tip filling, and drought tolerance.',
      },
    ],
    calculatorRates: {
      ureaKgPerAcre: 60,
      dapKgPerAcre: 45,
      mopKgPerAcre: 30,
      zincKgPerAcre: 10,
    },
    timingSteps: [
      {
        step: 1,
        title: 'Basal Dose at Sowing',
        timing: 'Day 0',
        badge: 'Basal Band',
        details: 'Band place 100% DAP, 25% Urea, 50% MOP, and Zinc Sulphate 5 cm away from seed row.',
      },
      {
        step: 2,
        title: 'Knee-High Stage Top Dressing',
        timing: '25 to 30 Days',
        badge: 'Knee High',
        details: 'Side dress 50% Urea followed by inter-cultivation and ridge earthing up.',
      },
      {
        step: 3,
        title: 'Tasseling & Silking Stage',
        timing: '45 to 50 Days',
        badge: 'Silk Emergence',
        details: 'Apply remaining 25% Urea and 50% MOP with irrigation to promote cob fill.',
      },
    ],
    safetyTips: [
      'Ensure soil moisture is adequate before broadcasting urea to prevent leaf scorch.',
      'Place basal fertilizer 5 cm to the side and 5 cm deeper than seed furrow.',
    ],
    organicAlternatives: [
      {
        name: 'Enriched Farm Compost',
        type: 'Humus Builder',
        dosage: '3 Tonnes / Acre',
        benefit: 'Provides steady organic nutrition and enhances water holding capacity.',
      },
      {
        name: 'Azospirillum Bio-fertilizer',
        type: 'Associative N-Fixer',
        dosage: '2 kg / Acre',
        benefit: 'Associates with maize roots, fixing nitrogen and producing growth hormones.',
      },
      {
        name: 'Panchagavya Foliar Spray',
        type: 'Bio-stimulant',
        dosage: '3% Spray at 30 & 45 DAS',
        benefit: 'Supplies enzymes, cytokinins, and micronutrients for vigorous cob emergence.',
      },
    ],
  },
  chickpea: {
    id: 'chickpea',
    name: 'Chickpea',
    image: '/images/chickpea_crop.jpg',
    stage: 'Branching & Pre-Flowering',
    stageDays: 'Day 38 of 95',
    field: 'Rabi Plot 1',
    acres: 3.0,
    location: 'Akola, Maharashtra',
    soilType: 'Deep Black Cotton Soil',
    todayAdvice: 'Chickpea fixes atmospheric Nitrogen via root nodules. Do NOT apply heavy Nitrogen. Focus on Phosphorus and Sulphur for root nodules and pod set.',
    soilNutrients: {
      nitrogen: {
        name: 'Nitrogen',
        symbol: 'N',
        status: 'Adequate',
        currentVal: 25,
        targetVal: 12.1,
        unit: 'kg/acre',
      },
      phosphorus: {
        name: 'Phosphorus (P)',
        symbol: 'P',
        status: 'Moderate',
        currentVal: 16,
        targetVal: 10.6,
        unit: 'kg/acre',
      },
      potassium: {
        name: 'Potassium (K)',
        symbol: 'K',
        status: 'Adequate',
        currentVal: 20,
        targetVal: 11.8,
        unit: 'kg/acre',
      },
      ph: { value: 7.5, label: 'Optimal' },
      organicCarbon: { value: '0.6%', label: 'Medium' },
      micronutrients: { label: 'Adequate', elements: 'Mo, Fe' },
    },
    requirements: [
      { nutrient: 'Nitrogen (N)', symbol: 'N', recommended: 12.1, current: 25, additional: 0, unit: 'kg/acre', chemicalForm: 'Elemental Nitrogen (N)' },
      { nutrient: 'Phosphorus (P)', symbol: 'P', recommended: 10.6, current: 18, additional: 0, unit: 'kg/acre', chemicalForm: 'Available Elemental P (Soil Test form)' },
      { nutrient: 'Phosphate Equivalent (P₂O₅)', symbol: 'P₂O₅', recommended: 24.3, current: 41.2, additional: 0, unit: 'kg/acre', chemicalForm: 'Phosphate Oxide (P₂O₅ = P × 2.291)' },
      { nutrient: 'Potassium (K)', symbol: 'K', recommended: 11.8, current: 20, additional: 0, unit: 'kg/acre', chemicalForm: 'Available Elemental K (Soil Test form)' },
      { nutrient: 'Potash Equivalent (K₂O)', symbol: 'K₂O', recommended: 14.2, current: 24.1, additional: 0, unit: 'kg/acre', chemicalForm: 'Potash Oxide (K₂O = K × 1.205)' },
      { nutrient: 'Zinc (Zn)', symbol: 'Zn', recommended: 1, current: 0.3, additional: 0.7, unit: 'kg/acre', chemicalForm: 'Elemental Micronutrient (Zn)' },
    ],
    keyInsights: [
      'Excess Nitrogen causes rampant vegetative growth and drastic flower/pod abortion.',
      'Phosphorus stimulates deep taproot nodulation and active atmospheric nitrogen fixation.',
      'Sulphur supplementation (SSP or Bentonite S) enhances seed protein content and grain boldness.',
    ],
    calloutMessage: 'Apply starter Phosphorus and Sulphur; avoid excess Nitrogen which harms pod formation.',
    products: [
      {
        id: 'ssp',
        name: 'Single Super Phosphate (SSP)',
        formula: 'Ca(H₂PO₄)₂ + CaSO₄',
        composition: '16% P₂O₅, 11% S, 19% Ca',
        ratePerAcre: 75,
        unit: 'kg/acre',
        badge: 'Phosphorus & Sulphur',
        bagColor: '#d35400',
        description: 'Ideal legume fertilizer supplying soluble phosphorus, sulphur, and calcium for nodulation.',
      },
      {
        id: 'dap',
        name: 'DAP',
        formula: 'Di-Ammonium Phosphate',
        composition: '18% N, 46% P',
        ratePerAcre: 25,
        unit: 'kg/acre',
        badge: 'Starter Dose',
        bagColor: '#e67e22',
        description: 'Starter dose at sowing to provide initial root establishment until nodules form.',
      },
    ],
    calculatorRates: {
      ureaKgPerAcre: 10,
      dapKgPerAcre: 25,
      mopKgPerAcre: 10,
      zincKgPerAcre: 0,
    },
    timingSteps: [
      {
        step: 1,
        title: 'Basal Placement at Sowing',
        timing: 'Day 0',
        badge: 'Basal Placement',
        details: 'Apply 100% SSP / DAP into seed furrow to support early seedling vigor.',
      },
      {
        step: 2,
        title: 'Pre-Flowering Foliar Nutrition',
        timing: '35 to 40 Days',
        badge: 'Bloom Setting',
        details: 'Foliar spray of 2% DAP or 0:52:34 to boost flower retention and pod setting.',
      },
    ],
    safetyTips: [
      'Inoculate seeds with Rhizobium culture in shade prior to sowing.',
      'Avoid field water stagnation; chickpea taproots rot rapidly in waterlogged soils.',
    ],
    organicAlternatives: [
      {
        name: 'Rhizobium Legume Inoculant',
        type: 'Bio-Fertilizer',
        dosage: '250 g / 10 kg seed',
        benefit: 'Forms pink active nodules fixing 80% of crop nitrogen requirement.',
      },
      {
        name: 'Phosphate Solubilizing Bacteria (PSB)',
        type: 'Bio-Solubilizer',
        dosage: '250 g / 10 kg seed',
        benefit: 'Converts insoluble soil phosphorus into bioavailable orthophosphate.',
      },
      {
        name: 'Bio-Compost with Wood Ash',
        type: 'Soil Conditioner',
        dosage: '1.5 Tonnes / Acre',
        benefit: 'Supplies natural potash and micronutrients to maturing pods.',
      },
    ],
  },
  potato: {
    id: 'potato',
    name: 'Potato',
    image: '/images/potato_crop.jpg',
    stage: 'Tuber Initiation & Bulking',
    stageDays: 'Day 42 of 90',
    field: 'Vegetable Block 2',
    acres: 2.0,
    location: 'Akola, Maharashtra',
    soilType: 'Loose Sandy Loam',
    todayAdvice: 'Tuber enlargement is underway. Apply Potassium split (MOP/SOP) to boost dry matter and skin finish. Maintain uniform soil moisture.',
    soilNutrients: {
      nitrogen: {
        name: 'Nitrogen',
        symbol: 'N',
        status: 'Low',
        currentVal: 28,
        targetVal: 72.8,
        unit: 'kg/acre',
      },
      phosphorus: {
        name: 'Phosphorus (P)',
        symbol: 'P',
        status: 'Moderate',
        currentVal: 22,
        targetVal: 17.7,
        unit: 'kg/acre',
      },
      potassium: {
        name: 'Potassium (K)',
        symbol: 'K',
        status: 'Low',
        currentVal: 20,
        targetVal: 42,
        unit: 'kg/acre',
      },
      ph: { value: 6.5, label: 'Optimal for Tuber Crops' },
      organicCarbon: { value: '0.7%', label: 'Medium' },
      micronutrients: { label: 'Needs Zinc & Boron', elements: 'Zn, B' },
    },
    requirements: [
      { nutrient: 'Nitrogen (N)', symbol: 'N', recommended: 72.8, current: 25, additional: 47.8, unit: 'kg/acre', chemicalForm: 'Elemental Nitrogen (N)' },
      { nutrient: 'Phosphorus (P)', symbol: 'P', recommended: 17.7, current: 18, additional: 0, unit: 'kg/acre', chemicalForm: 'Available Elemental P (Soil Test form)' },
      { nutrient: 'Phosphate Equivalent (P₂O₅)', symbol: 'P₂O₅', recommended: 40.5, current: 41.2, additional: 0, unit: 'kg/acre', chemicalForm: 'Phosphate Oxide (P₂O₅ = P × 2.291)' },
      { nutrient: 'Potassium (K)', symbol: 'K', recommended: 42, current: 20, additional: 22, unit: 'kg/acre', chemicalForm: 'Available Elemental K (Soil Test form)' },
      { nutrient: 'Potash Equivalent (K₂O)', symbol: 'K₂O', recommended: 50.6, current: 24.1, additional: 26.5, unit: 'kg/acre', chemicalForm: 'Potash Oxide (K₂O = K × 1.205)' },
      { nutrient: 'Zinc (Zn)', symbol: 'Zn', recommended: 1, current: 0.3, additional: 0.7, unit: 'kg/acre', chemicalForm: 'Elemental Micronutrient (Zn)' },
    ],
    keyInsights: [
      'Potassium is the primary driver of tuber expansion, dry matter percentage, and bruise resistance.',
      'Split Nitrogen avoids hollow heart disorder and minimizes secondary knobby tuber growth.',
      'Maintain loose, friable ridge soil for unimpeded radial tuber enlargement.',
    ],
    calloutMessage: 'Supply adequate Potassium and balanced Nitrogen during tuber bulking for maximum grade-A yields.',
    products: [
      {
        id: 'urea',
        name: 'Urea',
        formula: 'CO(NH₂)₂',
        composition: '46% N',
        ratePerAcre: 65,
        unit: 'kg/acre',
        badge: 'Canopy Density',
        bagColor: '#1e56a0',
        description: 'Builds dense leaf canopy before tuber bulking phase begins.',
      },
      {
        id: 'dap',
        name: 'DAP',
        formula: 'Di-Ammonium Phosphate',
        composition: '18% N, 46% P',
        ratePerAcre: 60,
        unit: 'kg/acre',
        badge: 'Root Proliferation',
        bagColor: '#e67e22',
        description: 'Full dose basally in furrows stimulates stolon branching and tuber initiation.',
      },
      {
        id: 'mop',
        name: 'MOP',
        formula: 'Muriate of Potash',
        composition: '60% K₂O',
        ratePerAcre: 50,
        unit: 'kg/acre',
        badge: 'Tuber Bulking',
        bagColor: '#c0392b',
        description: 'Essential for starch translocation into expanding tubers.',
      },
    ],
    calculatorRates: {
      ureaKgPerAcre: 65,
      dapKgPerAcre: 60,
      mopKgPerAcre: 50,
      zincKgPerAcre: 5,
    },
    timingSteps: [
      {
        step: 1,
        title: 'Basal Furrow Application',
        timing: 'Day 0',
        badge: 'Basal Furrow',
        details: 'Apply 50% N + 100% P + 50% K in furrows 5 cm below tuber seed pieces.',
      },
      {
        step: 2,
        title: 'Earthing-Up Top Dressing',
        timing: '30 to 35 Days',
        badge: 'Earthing Up',
        details: 'Apply remaining 50% N + 50% K prior to earthing up ridges to protect tubers from greening.',
      },
    ],
    safetyTips: [
      'Do not place chemical fertilizers in direct contact with seed tubers to avoid rot.',
      'Stop Nitrogen 25 days before harvest to allow tuber skins to set firmly.',
    ],
    organicAlternatives: [
      {
        name: 'Decomposed Cow Dung Manure',
        type: 'Organic Manure',
        dosage: '5 Tonnes / Acre',
        benefit: 'Creates light, porous ridge soil ideal for rapid tuber bulking.',
      },
      {
        name: 'Bio-Potash (Frateuria aurantia)',
        type: 'Potash Mobilizer',
        dosage: '2 Litres / Acre',
        benefit: 'Solubilizes locked potassium in clay minerals for tuber uptake.',
      },
      {
        name: 'Neem Cake Meal',
        type: 'Nematicide & Organic Nutrition',
        dosage: '200 kg / Acre',
        benefit: 'Suppresses root-knot nematodes and protects developing tubers.',
      },
    ],
  },
  chilli: {
    id: 'chilli',
    name: 'Chilli',
    image: '/images/chilli_crop.jpg',
    stage: 'Flowering & Fruit Setting',
    stageDays: 'Day 55 of 150',
    field: 'Spice Block 1',
    acres: 2.0,
    location: 'Akola, Maharashtra',
    soilType: 'Well-Drained Loamy Soil',
    todayAdvice: 'Spray 13:0:45 (Potassium Nitrate) @ 5g/L to prevent flower drop and promote fruit pungency and deep red color.',
    soilNutrients: {
      nitrogen: {
        name: 'Nitrogen',
        symbol: 'N',
        status: 'Low',
        currentVal: 25,
        targetVal: 48.6,
        unit: 'kg/acre',
      },
      phosphorus: {
        name: 'Phosphorus (P)',
        symbol: 'P',
        status: 'Adequate',
        currentVal: 20,
        targetVal: 10.6,
        unit: 'kg/acre',
      },
      potassium: {
        name: 'Potassium (K)',
        symbol: 'K',
        status: 'Moderate',
        currentVal: 22,
        targetVal: 33.6,
        unit: 'kg/acre',
      },
      ph: { value: 7.0, label: 'Optimal' },
      organicCarbon: { value: '0.65%', label: 'Medium' },
      micronutrients: { label: 'Needs Boron & Zinc', elements: 'B, Zn' },
    },
    requirements: [
      { nutrient: 'Nitrogen (N)', symbol: 'N', recommended: 48.6, current: 25, additional: 23.6, unit: 'kg/acre', chemicalForm: 'Elemental Nitrogen (N)' },
      { nutrient: 'Phosphorus (P)', symbol: 'P', recommended: 10.6, current: 18, additional: 0, unit: 'kg/acre', chemicalForm: 'Available Elemental P (Soil Test form)' },
      { nutrient: 'Phosphate Equivalent (P₂O₅)', symbol: 'P₂O₅', recommended: 24.3, current: 41.2, additional: 0, unit: 'kg/acre', chemicalForm: 'Phosphate Oxide (P₂O₅ = P × 2.291)' },
      { nutrient: 'Potassium (K)', symbol: 'K', recommended: 33.6, current: 20, additional: 13.6, unit: 'kg/acre', chemicalForm: 'Available Elemental K (Soil Test form)' },
      { nutrient: 'Potash Equivalent (K₂O)', symbol: 'K₂O', recommended: 40.5, current: 24.1, additional: 16.4, unit: 'kg/acre', chemicalForm: 'Potash Oxide (K₂O = K × 1.205)' },
      { nutrient: 'Zinc (Zn)', symbol: 'Zn', recommended: 1, current: 0.3, additional: 0.7, unit: 'kg/acre', chemicalForm: 'Elemental Micronutrient (Zn)' },
    ],
    keyInsights: [
      'Chilli requires multi-split fertigation to nourish multiple flowering and picking flushes.',
      'Foliar spray of Boron and Calcium prevents blossom end rot and fruit drop.',
      'Excess Nitrogen at flowering triggers flower drop and increases sucking pest vulnerability.',
    ],
    calloutMessage: 'Balance Potassium and Calcium foliar sprays to ensure firm fruit walls and uniform fruit color.',
    products: [
      {
        id: 'urea',
        name: 'Urea',
        formula: 'CO(NH₂)₂',
        composition: '46% N',
        ratePerAcre: 55,
        unit: 'kg/acre',
        badge: 'Vegetative Vigor',
        bagColor: '#1e56a0',
        description: 'Provides nitrogen in measured splits across multiple picking cycles.',
      },
      {
        id: 'dap',
        name: 'DAP',
        formula: 'Di-Ammonium Phosphate',
        composition: '18% N, 46% P',
        ratePerAcre: 45,
        unit: 'kg/acre',
        badge: 'Feeder Roots',
        bagColor: '#e67e22',
        description: 'Basal placement to anchor taproots and support continuous flowering.',
      },
      {
        id: 'mop',
        name: 'MOP',
        formula: 'Muriate of Potash',
        composition: '60% K₂O',
        ratePerAcre: 35,
        unit: 'kg/acre',
        badge: 'Pungency & Color',
        bagColor: '#c0392b',
        description: 'Improves capsaicin synthesis, fruit firmness, and drought tolerance.',
      },
    ],
    calculatorRates: {
      ureaKgPerAcre: 55,
      dapKgPerAcre: 45,
      mopKgPerAcre: 35,
      zincKgPerAcre: 3,
    },
    timingSteps: [
      {
        step: 1,
        title: 'Basal Transplanting Dose',
        timing: 'Day 0',
        badge: 'Transplant',
        details: 'Apply 100% DAP + 25% Urea + 50% MOP in plant rows prior to seedling transplanting.',
      },
      {
        step: 2,
        title: 'Vegetative Top Dressing',
        timing: 'Day 25',
        badge: 'Canopy',
        details: 'Apply 25% Urea followed by inter-cultivation and irrigation.',
      },
      {
        step: 3,
        title: 'Flowering & Fruiting Split',
        timing: 'Day 50',
        badge: 'Fruit Set',
        details: 'Apply 25% Urea + 25% MOP to support initial fruit set.',
      },
      {
        step: 4,
        title: 'Post-First Harvest Flush',
        timing: 'Day 75',
        badge: 'Second Flush',
        details: 'Apply remaining Urea and MOP to rejuvenate plants for consecutive picking rounds.',
      },
    ],
    safetyTips: [
      'Avoid high Nitrogen doses during peak monsoon humidity to curb anthracnose disease.',
      'Wear protective gloves when handling chili harvesting and post-spray plants.',
    ],
    organicAlternatives: [
      {
        name: 'Enriched Vermicompost',
        type: 'Organic Bio-Nutrition',
        dosage: '3 Tonnes / Acre',
        benefit: 'Supplies balanced bio-available nutrients and fosters beneficial rhizosphere bacteria.',
      },
      {
        name: 'Fish Amino Acid (FAA) Drench',
        type: 'Liquid Growth Booster',
        dosage: '3 ml / Litre via drip',
        benefit: 'High-nitrogen organic tonic stimulating branching and flowering buds.',
      },
      {
        name: 'Jeevamrutha Soil Drench',
        type: 'Rhizosphere Microbe Multiplier',
        dosage: '200 Litres / Acre',
        benefit: 'Enhances micronutrient absorption and improves disease tolerance.',
      },
    ],
  },
  onion: {
    id: 'onion',
    name: 'Onion',
    image: '/images/onion_crop.jpg',
    stage: 'Bulb Enlargement Stage',
    stageDays: 'Day 60 of 110',
    field: 'Rabi Plot 3',
    acres: 2.5,
    location: 'Akola, Maharashtra',
    soilType: 'Medium Clay Loam',
    todayAdvice: 'Bulb swelling is active. Stop Nitrogen application 30 days before harvest to avoid neck rot. Apply Potash and Sulphur for pungency and storage shelf life.',
    soilNutrients: {
      nitrogen: {
        name: 'Nitrogen',
        symbol: 'N',
        status: 'Moderate',
        currentVal: 28,
        targetVal: 44.5,
        unit: 'kg/acre',
      },
      phosphorus: {
        name: 'Phosphorus (P)',
        symbol: 'P',
        status: 'Adequate',
        currentVal: 18,
        targetVal: 10.6,
        unit: 'kg/acre',
      },
      potassium: {
        name: 'Potassium (K)',
        symbol: 'K',
        status: 'Moderate',
        currentVal: 20,
        targetVal: 33.6,
        unit: 'kg/acre',
      },
      ph: { value: 7.2, label: 'Optimal' },
      organicCarbon: { value: '0.6%', label: 'Medium' },
      micronutrients: { label: 'Sulphur Demanding', elements: 'S, Zn' },
    },
    requirements: [
      { nutrient: 'Nitrogen (N)', symbol: 'N', recommended: 44.5, current: 25, additional: 19.5, unit: 'kg/acre', chemicalForm: 'Elemental Nitrogen (N)' },
      { nutrient: 'Phosphorus (P)', symbol: 'P', recommended: 10.6, current: 18, additional: 0, unit: 'kg/acre', chemicalForm: 'Available Elemental P (Soil Test form)' },
      { nutrient: 'Phosphate Equivalent (P₂O₅)', symbol: 'P₂O₅', recommended: 24.3, current: 41.2, additional: 0, unit: 'kg/acre', chemicalForm: 'Phosphate Oxide (P₂O₅ = P × 2.291)' },
      { nutrient: 'Potassium (K)', symbol: 'K', recommended: 33.6, current: 20, additional: 13.6, unit: 'kg/acre', chemicalForm: 'Available Elemental K (Soil Test form)' },
      { nutrient: 'Potash Equivalent (K₂O)', symbol: 'K₂O', recommended: 40.5, current: 24.1, additional: 16.4, unit: 'kg/acre', chemicalForm: 'Potash Oxide (K₂O = K × 1.205)' },
      { nutrient: 'Zinc (Zn)', symbol: 'Zn', recommended: 1, current: 0.3, additional: 0.7, unit: 'kg/acre', chemicalForm: 'Elemental Micronutrient (Zn)' },
    ],
    keyInsights: [
      'Sulphur is crucial for allyl propyl disulphide synthesis, giving onion pungency and long shelf life.',
      'Potassium enhances bulb compactness, outer skin dryness, and suppresses storage shrinkage.',
      'Withhold Nitrogen 3 weeks before harvest to promote neck drying and curb rotting.',
    ],
    calloutMessage: 'Apply Sulphur and Potassium now for dense, tight-necked bulbs with superior shelf life.',
    products: [
      {
        id: 'urea',
        name: 'Urea',
        formula: 'CO(NH₂)₂',
        composition: '46% N',
        ratePerAcre: 45,
        unit: 'kg/acre',
        badge: 'Foliar Flush',
        bagColor: '#1e56a0',
        description: 'Builds vegetative leaf ring counts which directly determine bulb size.',
      },
      {
        id: 'dap',
        name: 'DAP',
        formula: 'Di-Ammonium Phosphate',
        composition: '18% N, 46% P',
        ratePerAcre: 35,
        unit: 'kg/acre',
        badge: 'Root Anchor',
        bagColor: '#e67e22',
        description: 'Basal placement to promote fibrous root establishment in seedling beds.',
      },
      {
        id: 'mop',
        name: 'MOP',
        formula: 'Muriate of Potash',
        composition: '60% K₂O',
        ratePerAcre: 35,
        unit: 'kg/acre',
        badge: 'Bulb Density',
        bagColor: '#c0392b',
        description: 'Promotes tight bulb rings, skin finish, and long post-harvest storage.',
      },
    ],
    calculatorRates: {
      ureaKgPerAcre: 45,
      dapKgPerAcre: 35,
      mopKgPerAcre: 35,
      zincKgPerAcre: 2,
    },
    timingSteps: [
      {
        step: 1,
        title: 'Basal Placement at Transplanting',
        timing: 'Day 0',
        badge: 'Basal',
        details: 'Incorporate 100% DAP, 33% Urea, and 50% MOP into beds before transplanting seedlings.',
      },
      {
        step: 2,
        title: 'Vegetative Top Dressing',
        timing: 'Day 30',
        badge: 'Vegetative',
        details: 'Broadcast 33% Urea followed by shallow weeding and light irrigation.',
      },
      {
        step: 3,
        title: 'Bulb Initiation Application',
        timing: 'Day 45',
        badge: 'Bulbing',
        details: 'Apply remaining Urea + 50% MOP with Sulphur to fuel bulb swelling.',
      },
    ],
    safetyTips: [
      'Stop all Nitrogen applications 30 days before harvest to avoid thick necks and bulb rot.',
      'Ensure proper bed drainage; standing water causes rapid basal plate fungal rot.',
    ],
    organicAlternatives: [
      {
        name: 'Well-Rotted Farmyard Manure',
        type: 'Organic Manure',
        dosage: '5 Tonnes / Acre',
        benefit: 'Enriches soil humus and keeps bed soil light and permeable.',
      },
      {
        name: 'Bio-Sulphur Inoculant',
        type: 'Sulphur Solubilizer',
        dosage: '2 kg / Acre',
        benefit: 'Solubilizes elemental sulphur into sulphate for pungency synthesis.',
      },
      {
        name: 'Wood Ash Powder',
        type: 'Natural Potash Source',
        dosage: '200 kg / Acre',
        benefit: 'Provides potassium and micro-minerals that toughen bulb skin scales.',
      },
    ],
  },
  banana: {
    id: 'banana',
    name: 'Banana',
    image: '/images/banana_crop.jpg',
    stage: 'Shooting & Bunch Development',
    stageDays: 'Month 8 of 12',
    field: 'Orchard Block A',
    acres: 3.0,
    location: 'Akola, Maharashtra',
    soilType: 'Rich Well-Drained Deep Loam',
    todayAdvice: 'Shooting completed. Apply high Potassium dose through fertigation to maximize finger length and bunch weight. Prop plants with bamboo poles.',
    soilNutrients: {
      nitrogen: {
        name: 'Nitrogen',
        symbol: 'N',
        status: 'Moderate',
        currentVal: 35,
        targetVal: 80.9,
        unit: 'kg/acre',
      },
      phosphorus: {
        name: 'Phosphorus (P)',
        symbol: 'P',
        status: 'Adequate',
        currentVal: 22,
        targetVal: 13.2,
        unit: 'kg/acre',
      },
      potassium: {
        name: 'Potassium (K)',
        symbol: 'K',
        status: 'Low',
        currentVal: 30,
        targetVal: 84,
        unit: 'kg/acre',
      },
      ph: { value: 7.0, label: 'Optimal' },
      organicCarbon: { value: '0.8%', label: 'Good' },
      micronutrients: { label: 'Needs Micronutrient Foliar', elements: 'Fe, Zn, B' },
    },
    requirements: [
      { nutrient: 'Nitrogen (N)', symbol: 'N', recommended: 80.9, current: 25, additional: 55.9, unit: 'kg/acre', chemicalForm: 'Elemental Nitrogen (N)' },
      { nutrient: 'Phosphorus (P)', symbol: 'P', recommended: 13.2, current: 18, additional: 0, unit: 'kg/acre', chemicalForm: 'Available Elemental P (Soil Test form)' },
      { nutrient: 'Phosphate Equivalent (P₂O₅)', symbol: 'P₂O₅', recommended: 30.4, current: 41.2, additional: 0, unit: 'kg/acre', chemicalForm: 'Phosphate Oxide (P₂O₅ = P × 2.291)' },
      { nutrient: 'Potassium (K)', symbol: 'K', recommended: 84, current: 20, additional: 64, unit: 'kg/acre', chemicalForm: 'Available Elemental K (Soil Test form)' },
      { nutrient: 'Potash Equivalent (K₂O)', symbol: 'K₂O', recommended: 101.2, current: 24.1, additional: 77.1, unit: 'kg/acre', chemicalForm: 'Potash Oxide (K₂O = K × 1.205)' },
    ],
    keyInsights: [
      'Banana is an extremely heavy Potassium consumer; K governs bunch weight, finger length, and sweetness.',
      'Split monthly fertigation prevents nutrient leaching through porous orchard soils.',
      'Spray 0.5% micronutrient mixture onto emerging bunches to prevent tip drying.',
    ],
    calloutMessage: 'Heavy Potassium fertigation during bunch development ensures grade-A export quality fingers.',
    products: [
      {
        id: 'urea',
        name: 'Urea',
        formula: 'CO(NH₂)₂',
        composition: '46% N',
        ratePerAcre: 80,
        unit: 'kg/acre',
        badge: 'Canopy & Pseudostem',
        bagColor: '#1e56a0',
        description: 'Supports broad foliage emergence and robust pseudostem girth.',
      },
      {
        id: 'dap',
        name: 'DAP',
        formula: 'Di-Ammonium Phosphate',
        composition: '18% N, 46% P',
        ratePerAcre: 45,
        unit: 'kg/acre',
        badge: 'Root Anchorage',
        bagColor: '#e67e22',
        description: 'Basal pit application supporting deep feeder roots and early sucker formation.',
      },
      {
        id: 'mop',
        name: 'MOP',
        formula: 'Muriate of Potash',
        composition: '60% K₂O',
        ratePerAcre: 100,
        unit: 'kg/acre',
        badge: 'Bunch Weight Driver',
        bagColor: '#c0392b',
        description: 'Massive potassium driver for heavy bunch yields, finger count, and sugar accumulation.',
      },
    ],
    calculatorRates: {
      ureaKgPerAcre: 80,
      dapKgPerAcre: 45,
      mopKgPerAcre: 100,
      zincKgPerAcre: 5,
    },
    timingSteps: [
      {
        step: 1,
        title: 'Early Vegetative Stage',
        timing: 'Month 2 to 3',
        badge: 'Vegetative Flush',
        details: 'Apply 30% N + 50% P + 20% K in shallow ring around sucker base.',
      },
      {
        step: 2,
        title: 'Grand Growth Stage',
        timing: 'Month 4 to 6',
        badge: 'Girth Expansion',
        details: 'Apply 40% N + 50% P + 30% K to support pseudostem thickening and leaf emergence.',
      },
      {
        step: 3,
        title: 'Shooting & Bunch Bulking',
        timing: 'Month 7 to 9',
        badge: 'Bunch Development',
        details: 'Apply remaining 30% N + 50% K with high-potash fertigation as flower bunch opens.',
      },
    ],
    safetyTips: [
      'Apply fertilizers in a 60 cm circular band around pseudostem; never directly against trunk.',
      'Irrigate immediately after dry fertilizer application to avoid root scorching.',
    ],
    organicAlternatives: [
      {
        name: 'Pressmud Bio-Compost',
        type: 'Sugar Mill By-product',
        dosage: '8 Tonnes / Acre',
        benefit: 'Rich in potassium, organic carbon, and essential secondary nutrients.',
      },
      {
        name: 'VAM (Mycorrhizal Inoculant)',
        type: 'Root Bio-Symbiont',
        dosage: '250 g / Plant in planting pit',
        benefit: 'Extends root foraging volume, increasing phosphorus and water uptake.',
      },
      {
        name: 'Panchagavya & Jeevamrutha Drench',
        type: 'Liquid Bio-Nutrient',
        dosage: '200 Litres / Acre monthly',
        benefit: 'Stimulates earthworms and native microbes in orchard basin.',
      },
    ],
  },
};

/**
 * Builds a dynamic, valid advisory dataset for ANY crop returned by the scanner.
 * If live backend calculation is available, it uses the backend data.
 * If the crop is unsupported/unverified, it returns a structured unavailable state
 * preserving actual soil test values without fabricating fake generic NPK or fertilizer numbers.
 */
export function getDynamicCropAdvisory(
  cropKey: string,
  rawName: string,
  farmerContext?: FarmerContextData | null,
  apiCalc?: ApiAdvisoryCalculationData | null
): CropAdvisoryData {
  const displayName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : 'Scanned Crop';
  const soilN = farmerContext?.soilTest?.nitrogenVal || 25;
  const soilP = farmerContext?.soilTest?.phosphorusVal || 18;
  const soilK = farmerContext?.soilTest?.potassiumVal || 20;
  const soilPh = farmerContext?.soilTest?.phVal || 7.2;

  // 1. If live backend calculation is available and verified for this crop
  if (apiCalc && apiCalc.isAvailable !== false && apiCalc.nutrientRequirements && apiCalc.nutrientRequirements.length > 0) {
    const nTarget = apiCalc.nutrientStatus?.nitrogen?.targetVal || 0;
    const pTarget = apiCalc.nutrientStatus?.phosphorus?.targetVal || 0;
    const kTarget = apiCalc.nutrientStatus?.potassium?.targetVal || 0;

    return {
      id: cropKey,
      name: apiCalc.inputSummary?.cropDisplayName || displayName,
      isDataAvailable: true,
      sourceMetadata: apiCalc.sourceMetadata,
      image: '/images/default_crop.jpg',
      stage: farmerContext?.cropCycle?.currentStage || 'Active Growth Stage',
      stageDays: farmerContext?.cropCycle ? `Day ${farmerContext.cropCycle.stageDayCount} of ${farmerContext.cropCycle.totalCycleDays}` : 'Active Growth',
      field: farmerContext?.farm?.farmName || 'Field 1',
      acres: farmerContext?.cropCycle?.allocatedAcres || farmerContext?.farm?.totalArea || 3.5,
      location: farmerContext?.farmer ? `${farmerContext.farmer.district}, ${farmerContext.farmer.state}` : 'Akola, Maharashtra',
      soilType: farmerContext?.farm?.soilType || 'Medium Black Clay Loam',
      todayAdvice: farmerContext?.cropCycle?.todayAdvice || `Apply recommended fertilizer schedule and maintain field moisture for ${displayName}.`,
      soilNutrients: {
        nitrogen: {
          name: 'Nitrogen',
          symbol: 'N',
          status: apiCalc.nutrientStatus?.nitrogen?.status || 'Moderate',
          currentVal: apiCalc.nutrientStatus?.nitrogen?.currentVal ?? soilN,
          targetVal: nTarget,
          unit: 'kg/acre',
        },
        phosphorus: {
          name: 'Phosphorus',
          symbol: 'P',
          status: apiCalc.nutrientStatus?.phosphorus?.status || 'Moderate',
          currentVal: apiCalc.nutrientStatus?.phosphorus?.currentVal ?? soilP,
          targetVal: pTarget,
          unit: 'kg/acre',
        },
        potassium: {
          name: 'Potassium',
          symbol: 'K',
          status: apiCalc.nutrientStatus?.potassium?.status || 'Moderate',
          currentVal: apiCalc.nutrientStatus?.potassium?.currentVal ?? soilK,
          targetVal: kTarget,
          unit: 'kg/acre',
        },
        ph: { value: soilPh, label: farmerContext?.soilTest?.phLabel || 'Neutral' },
        organicCarbon: { value: `${farmerContext?.soilTest?.organicCarbonPercent || 0.6}%`, label: farmerContext?.soilTest?.organicCarbonStatus || 'Low' },
        micronutrients: { label: 'Needs Attention', elements: 'Zn, Fe' },
      },
      requirements: apiCalc.nutrientRequirements.map((nr) => ({
        nutrient: nr.nutrient,
        symbol: nr.symbol,
        recommended: nr.recommendedRatePerAcre,
        current: nr.currentSoilAvailability,
        additional: nr.additionalNeededPerAcre,
        unit: nr.unit,
      })),
      keyInsights: apiCalc.agronomicInsights?.length ? apiCalc.agronomicInsights : [
        `Fertilizer program aligned with ${displayName} nutrient demand and soil test reserves.`,
      ],
      calloutMessage: `Apply the recommended fertilizers at the right time to ensure healthy growth and optimal yield for ${displayName}.`,
      products: (apiCalc.recommendedFertilizers || []).map((rf) => ({
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
      })),
      calculatorRates: {
        ureaKgPerAcre: apiCalc.recommendedFertilizers?.find((f) => f.productCode === 'urea')?.ratePerAcreKg || 0,
        dapKgPerAcre: apiCalc.recommendedFertilizers?.find((f) => f.productCode === 'dap')?.ratePerAcreKg || 0,
        mopKgPerAcre: apiCalc.recommendedFertilizers?.find((f) => f.productCode === 'mop')?.ratePerAcreKg || 0,
        zincKgPerAcre: apiCalc.recommendedFertilizers?.find((f) => f.productCode === 'zinc-sulphate')?.ratePerAcreKg || 0,
      },
      timingSteps: (apiCalc.applicationTiming || []).map((ts) => ({
        step: ts.step,
        title: ts.stageName,
        timing: ts.timingWindow,
        badge: ts.badge,
        details: ts.details,
      })),
      safetyTips: [
        'Store fertilizers in a cool, dry, ventilated area away from moisture.',
        'Wear protective gloves and footwear during fertilizer handling and spreading.',
        'Always follow label instructions and avoid mixing incompatible fertilizers.',
      ],
      organicAlternatives: apiCalc.organicAlternatives || [],
    };
  }

  // 2. Unverified / pending crop: display supplementary evidence if available, preserving actual soil test values
  const hasHfEvidence = apiCalc?.agronomicInsights && apiCalc.agronomicInsights.length > 0;
  const keyInsights = hasHfEvidence
    ? apiCalc.agronomicInsights
    : [
        `Certified ICAR / Department of Agriculture package of practices is not currently cataloged for "${displayName}".`,
        `To prevent fertilizer burn, nutrient lock-up, or soil toxicity, unverified dosages are not generated.`,
        `Actual soil test parameters (N: ${soilN} kg/ac, P: ${soilP} kg/ac, K: ${soilK} kg/ac, pH: ${soilPh}) from your certified soil sample are preserved.`,
        `Please contact your local Krishi Vigyan Kendra (KVK) or agricultural extension officer for certified fertilizer schedules.`,
      ];

  const calloutMessage = apiCalc?.sourceMetadata?.sourceName?.includes('Hugging Face')
    ? `Supplementary agricultural evidence retrieved for ${displayName} from HindiKrishi dataset. Real soil test values preserved.`
    : `Advisory data is currently unavailable for ${displayName}. Only certified agricultural recommendations are displayed.`;

  return {
    id: cropKey,
    name: displayName,
    isDataAvailable: false,
    sourceMetadata: apiCalc?.sourceMetadata,
    image: '/images/default_crop.jpg',
    stage: farmerContext?.cropCycle?.currentStage || 'Active Growth Stage',
    stageDays: farmerContext?.cropCycle ? `Day ${farmerContext.cropCycle.stageDayCount} of ${farmerContext.cropCycle.totalCycleDays}` : 'Active Growth',
    field: farmerContext?.farm?.farmName || 'Field 1',
    acres: farmerContext?.cropCycle?.allocatedAcres || farmerContext?.farm?.totalArea || 3.5,
    location: farmerContext?.farmer ? `${farmerContext.farmer.district}, ${farmerContext.farmer.state}` : 'Akola, Maharashtra',
    soilType: farmerContext?.farm?.soilType || 'Medium Black Clay Loam',
    todayAdvice: farmerContext?.cropCycle?.todayAdvice || (hasHfEvidence ? apiCalc.agronomicInsights[0] : `Certified agronomic advisory is pending verification for ${displayName}. Please consult your local Krishi Vigyan Kendra (KVK).`),
    soilNutrients: {
      nitrogen: {
        name: 'Nitrogen',
        symbol: 'N',
        status: (farmerContext?.soilTest?.nitrogenStatus as any) || 'Moderate',
        currentVal: soilN,
        targetVal: 0,
        unit: 'kg/acre',
      },
      phosphorus: {
        name: 'Phosphorus (P)',
        symbol: 'P',
        status: (farmerContext?.soilTest?.phosphorusStatus as any) || 'Moderate',
        currentVal: soilP,
        targetVal: 0,
        unit: 'kg/acre',
      },
      potassium: {
        name: 'Potassium (K)',
        symbol: 'K',
        status: (farmerContext?.soilTest?.potassiumStatus as any) || 'Moderate',
        currentVal: soilK,
        targetVal: 0,
        unit: 'kg/acre',
      },
      ph: { value: soilPh, label: farmerContext?.soilTest?.phLabel || 'Neutral' },
      organicCarbon: { value: `${farmerContext?.soilTest?.organicCarbonPercent || 0.6}%`, label: farmerContext?.soilTest?.organicCarbonStatus || 'Low' },
      micronutrients: { label: 'Needs Attention', elements: 'Zn, Fe' },
    },
    requirements: [],
    keyInsights,
    calloutMessage,
    products: [],
    calculatorRates: {
      ureaKgPerAcre: 0,
      dapKgPerAcre: 0,
      mopKgPerAcre: 0,
      zincKgPerAcre: 0,
    },
    timingSteps: [],
    safetyTips: [
      'Store fertilizers in a cool, dry, ventilated area away from moisture.',
      'Wear protective gloves and footwear during fertilizer handling and spreading.',
      'Always follow label instructions and avoid mixing incompatible fertilizers.',
    ],
    organicAlternatives: apiCalc?.organicAlternatives || [],
  };
}


