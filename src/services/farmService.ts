import type {
  FarmState,
  FarmDetails,
  FarmCrop,
  FarmField,
  CropScanRecord,
  FarmActivity,
  PriorityAction,
  FarmInsight,
  CropStatus,
  FieldStatus,
  PriorityLevel,
  ActivityStatus,
} from '../types/farm';

const STORAGE_PREFIX = 'cropguard_farm_';

export function getCanonicalCropKey(crop: string): string {
  if (!crop) return 'unknown';
  const c = crop.trim().toLowerCase();
  if (c.includes('maize') || c.includes('corn')) return 'maize';
  if (c.includes('tomato')) return 'tomato';
  if (c.includes('rice') || c.includes('paddy')) return 'rice';
  if (c.includes('wheat')) return 'wheat';
  if (c.includes('cotton') || c.includes('kapus')) return 'cotton';
  if (c.includes('soybean') || c.includes('soya')) return 'soybean';
  if (c.includes('sugarcane') || c.includes('cane') || c.includes('us')) return 'sugarcane';
  if (c.includes('chickpea') || c.includes('gram') || c.includes('chana') || c.includes('harbara')) return 'chickpea';
  if (c.includes('potato') || c.includes('batata')) return 'potato';
  if (c.includes('onion') || c.includes('kanda')) return 'onion';
  if (c.includes('pigeon') || c.includes('tur') || c.includes('arhar')) return 'pigeon_pea';
  if (c.includes('groundnut') || c.includes('peanut') || c.includes('bhuimug')) return 'groundnut';
  if (c.includes('pomegranate') || c.includes('dalimb')) return 'pomegranate';
  if (c.includes('grape') || c.includes('draksha')) return 'grapes';
  if (c.includes('banana') || c.includes('keli')) return 'banana';
  if (c.includes('mango') || c.includes('hapus') || c.includes('alphonso')) return 'mango';
  if (c.includes('orange') || c.includes('santra')) return 'orange';
  if (c.includes('sorghum') || c.includes('jowar')) return 'sorghum';
  if (c.includes('millet') || c.includes('bajra')) return 'pearl_millet';
  if (c.includes('turmeric') || c.includes('halad') || c.includes('haldi')) return 'turmeric';
  return c.replace(/[^a-z0-9]/g, '');
}

export const CROP_ICONS: Record<string, string> = {
  maize: '🌽',
  tomato: '🍅',
  rice: '🌾',
  wheat: '🌾',
  cotton: '☁️',
  soybean: '🌱',
  sugarcane: '🎋',
  chickpea: '🌿',
  potato: '🥔',
  onion: '🧅',
  pigeon_pea: '🫘',
  groundnut: '🥜',
  pomegranate: '🍎',
  grapes: '🍇',
  banana: '🍌',
  mango: '🥭',
  orange: '🍊',
  sorghum: '🌾',
  pearl_millet: '🌾',
  turmeric: '🫚',
};

function formatTodayDate(): string {
  const d = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function computeOverallHealthScore(fields: FarmField[], crops: FarmCrop[]): number {
  if (fields.length > 0) {
    const totalArea = fields.reduce((sum, f) => sum + (f.areaHa || 0), 0);
    if (totalArea > 0) {
      const weightedHealth = fields.reduce((sum, f) => sum + (f.areaHa || 0) * (f.healthScore || 0), 0);
      return Math.round(weightedHealth / totalArea);
    }
    const simpleAvg = fields.reduce((sum, f) => sum + (f.healthScore || 0), 0) / fields.length;
    return Math.round(simpleAvg);
  }
  if (crops.length > 0) {
    const simpleAvg = crops.reduce((sum, c) => sum + (c.healthScore || 0), 0) / crops.length;
    return Math.round(simpleAvg);
  }
  return 0;
}

export function createInitialFarmState(farmerId: string, location?: string): FarmState {
  const farmDetails: FarmDetails = {
    id: `farm-${farmerId}`,
    farmerId,
    name: 'My Farm',
    location: location || 'Mumbai Suburban, Maharashtra',
    totalAreaHa: 2.5,
    farmType: 'Mixed Cropping',
    lastUpdated: `${formatTodayDate()}, 05:30 PM`,
  };

  const crops: FarmCrop[] = [
    {
      id: 'cotton',
      name: 'Cotton',
      icon: '☁️',
      image: '/images/cotton_crop.jpg',
      status: 'Healthy',
      healthScore: 88,
      areaHa: 0.8,
      expectedYieldQtHa: 12.5,
      lastScanDate: '07 Sep 2026',
    },
    {
      id: 'soybean',
      name: 'Soybean',
      icon: '🌱',
      image: '/images/soybean_crop.jpg',
      status: 'At Risk',
      healthScore: 70,
      areaHa: 0.6,
      expectedYieldQtHa: 10.2,
      lastScanDate: '06 Sep 2026',
      detectedDisease: 'Stem Rot Risk',
      severity: 'Moderate',
    },
    {
      id: 'onion',
      name: 'Onion',
      icon: '🧅',
      image: '/images/onion_crop.jpg',
      status: 'Healthy',
      healthScore: 92,
      areaHa: 0.4,
      expectedYieldQtHa: 18.7,
      lastScanDate: '05 Sep 2026',
    },
    {
      id: 'tomato',
      name: 'Tomato',
      icon: '🍅',
      image: '/images/tomato_crop.jpg',
      status: 'Diseased',
      healthScore: 58,
      areaHa: 0.3,
      expectedYieldQtHa: 8.4,
      lastScanDate: '09 Sep 2026',
      detectedDisease: 'Early Blight',
      severity: 'Moderate',
    },
    {
      id: 'potato',
      name: 'Potato',
      icon: '🥔',
      image: '/images/potato_crop.jpg',
      status: 'At Risk',
      healthScore: 74,
      areaHa: 0.4,
      expectedYieldQtHa: 14.1,
      lastScanDate: '04 Sep 2026',
      detectedDisease: 'Late Blight Risk',
      severity: 'Mild',
    },
  ];

  const fields: FarmField[] = [
    {
      id: 'field-1',
      name: 'Field 1 - Cotton',
      crop: 'Cotton',
      areaHa: 1.2,
      healthScore: 88,
      status: 'Healthy',
      lastScanDate: '07 Sep 2026',
    },
    {
      id: 'field-2',
      name: 'Field 2 - Soybean',
      crop: 'Soybean',
      areaHa: 0.8,
      healthScore: 70,
      status: 'At Risk',
      lastScanDate: '06 Sep 2026',
      detectedDisease: 'Stem Rot Risk',
    },
    {
      id: 'field-3',
      name: 'Field 3 - Tomato',
      crop: 'Tomato',
      areaHa: 0.5,
      healthScore: 58,
      status: 'Diseased',
      lastScanDate: '09 Sep 2026',
      detectedDisease: 'Early Blight',
    },
    {
      id: 'field-4',
      name: 'Field 4 - Potato',
      crop: 'Potato',
      areaHa: 0.4,
      healthScore: 88,
      status: 'Healthy',
      lastScanDate: '04 Sep 2026',
    },
  ];

  const activities: FarmActivity[] = [
    {
      id: 'act-1',
      date: '09 Sep 2026',
      activity: 'Crop Scan',
      crop: 'Tomato',
      details: 'Blight detected (AI)',
      status: 'Diseased',
      timestamp: Date.now() - 172800000,
    },
    {
      id: 'act-2',
      date: '08 Sep 2026',
      activity: 'Field Visit',
      crop: 'Cotton',
      details: 'Visit completed - Village A',
      status: 'Completed',
      timestamp: Date.now() - 259200000,
    },
    {
      id: 'act-3',
      date: '06 Sep 2026',
      activity: 'Advisory',
      crop: 'Soybean',
      details: 'Pest control measures recommended',
      status: 'Advisory',
      timestamp: Date.now() - 432000000,
    },
    {
      id: 'act-4',
      date: '05 Sep 2026',
      activity: 'Crop Record',
      crop: 'Onion',
      details: 'Updated growth stage',
      status: 'Updated',
      timestamp: Date.now() - 518400000,
    },
  ];

  const priorityActions: PriorityAction[] = [
    {
      id: 'pa-1',
      crop: 'Tomato',
      title: 'Inspect tomato field within 24 hours',
      subtitle: 'Early blight detected',
      priority: 'High',
      action: 'Follow advisory spray: Mancozeb (2g/L) or copper oxychloride.',
      fieldId: 'field-3',
      thumbnail: '/images/tomato_crop.jpg',
    },
    {
      id: 'pa-2',
      crop: 'Cotton',
      title: 'Check tomato field for pests',
      subtitle: 'Pest pressure increasing',
      priority: 'Medium',
      action: 'Inspect cotton leaf undersides and monitor yellow sticky traps.',
      fieldId: 'field-1',
      thumbnail: '/images/cotton_crop.jpg',
    },
    {
      id: 'pa-3',
      crop: 'Onion',
      title: 'Update growth stage - Onion',
      subtitle: 'Missing data for 2 fields',
      priority: 'Low',
      action: 'Record current bulb diameter and irrigation interval in Farm Record.',
      fieldId: 'field-2',
      thumbnail: '/images/onion_crop.jpg',
    },
    {
      id: 'pa-4',
      crop: 'Potato',
      title: 'Schedule field visit - Potato',
      subtitle: 'Recommended by AI',
      priority: 'Low',
      action: 'Request extension officer evaluation before tuber bulking phase.',
      fieldId: 'field-4',
      thumbnail: '/images/potato_crop.jpg',
    },
  ];

  const farmInsights: FarmInsight[] = [
    {
      id: 'fi-1',
      title: 'Cotton yield may increase by 12% with proper soil moisture.',
      subtitle: 'Based on recent rainfall data (Government)',
      source: 'IMD / DES data.gov.in',
      iconType: 'leaf',
    },
    {
      id: 'fi-2',
      title: 'High pest risk detected in Tomato (early blight).',
      subtitle: 'Check advisory for control measures.',
      source: 'AI Disease Detector',
      iconType: 'alert',
    },
    {
      id: 'fi-3',
      title: 'Soybean production stable in your region.',
      subtitle: 'Based on district-wise crop data (Government).',
      source: 'DES data.gov.in',
      iconType: 'chart',
    },
  ];

  const overallHealthScore = computeOverallHealthScore(fields, crops);

  return {
    farmerId,
    farmDetails,
    crops,
    fields,
    scans: [],
    activities,
    priorityActions,
    farmInsights,
    overallHealthScore,
    lastUpdated: farmDetails.lastUpdated,
  };
}

export function createEmptyFarmState(farmerId: string, location?: string): FarmState {
  const farmDetails: FarmDetails = {
    id: `farm-${farmerId}`,
    farmerId,
    name: 'My Farm',
    location: location || 'Maharashtra, India',
    totalAreaHa: 0,
    farmType: 'General Farming',
    lastUpdated: formatTodayDate(),
  };

  return {
    farmerId,
    farmDetails,
    crops: [],
    fields: [],
    scans: [],
    activities: [],
    priorityActions: [],
    farmInsights: [],
    overallHealthScore: 0,
    lastUpdated: farmDetails.lastUpdated,
  };
}

export function sanitizeFarmState(state: FarmState, defaultLocation?: string): { state: FarmState; modified: boolean } {
  if (defaultLocation && (!state.farmDetails.location || state.farmDetails.location === 'Maharashtra, India')) {
    state.farmDetails.location = defaultLocation;
  }
  if (!state.farmDetails.location) {
    state.farmDetails.location = 'Mumbai Suburban, Maharashtra';
  }

  const cropImageMap: Record<string, string> = {
    cotton: '/images/cotton_crop.jpg',
    soybean: '/images/soybean_crop.jpg',
    onion: '/images/onion_crop.jpg',
    tomato: '/images/tomato_crop.jpg',
    potato: '/images/potato_crop.jpg',
    maize: '/images/crop_maize.jpg',
    rice: '/images/crop_rice.jpg',
    wheat: '/images/crop_wheat.jpg',
    sugarcane: '/images/crop_sugarcane.jpg',
    chickpea: '/images/crop_chickpea.jpg',
  };

  let modified = false;

  // If there are no genuine saved scans, purge any hardcoded demonstration crops, fields, and actions
  if (!state.scans || state.scans.length === 0) {
    const mockCropIds = new Set(['cotton', 'soybean', 'onion', 'tomato', 'potato']);
    const mockFieldIds = new Set(['field-1', 'field-2', 'field-3', 'field-4']);
    const mockActionIds = new Set(['pa-1', 'pa-2', 'pa-3', 'pa-4']);
    const mockActivityIds = new Set(['act-1', 'act-2', 'act-3', 'act-4']);

    if (Array.isArray(state.crops) && state.crops.some((c) => mockCropIds.has(c.id))) {
      state.crops = state.crops.filter((c) => !mockCropIds.has(c.id));
      modified = true;
    }
    if (Array.isArray(state.fields) && state.fields.some((f) => mockFieldIds.has(f.id))) {
      state.fields = state.fields.filter((f) => !mockFieldIds.has(f.id));
      modified = true;
    }
    if (Array.isArray(state.priorityActions) && state.priorityActions.some((pa) => mockActionIds.has(pa.id))) {
      state.priorityActions = state.priorityActions.filter((pa) => !mockActionIds.has(pa.id));
      modified = true;
    }
    if (Array.isArray(state.activities) && state.activities.some((act) => mockActivityIds.has(act.id))) {
      state.activities = state.activities.filter((act) => !mockActivityIds.has(act.id));
      modified = true;
    }
    if (state.overallHealthScore !== 0) {
      state.overallHealthScore = 0;
      modified = true;
    }
    const realArea = Math.round((state.fields || []).reduce((sum, f) => sum + (f.areaHa || 0), 0) * 100) / 100;
    if (state.farmDetails.totalAreaHa !== realArea) {
      state.farmDetails.totalAreaHa = realArea;
      modified = true;
    }
  }

  if (Array.isArray(state.crops)) {
    state.crops = state.crops.map((c) => {
      const key = getCanonicalCropKey(c.id || c.name);
      if (cropImageMap[key] && (!c.image || c.image.includes('crop_leaf') || c.image.includes('crop_healthy_leaf'))) {
        modified = true;
        return { ...c, image: cropImageMap[key] };
      }
      return c;
    });
  }

  if (Array.isArray(state.priorityActions)) {
    state.priorityActions = state.priorityActions.map((pa) => {
      const key = pa.crop.toLowerCase();
      if (cropImageMap[key] && (!pa.thumbnail || pa.thumbnail.includes('crop_leaf') || pa.thumbnail.includes('crop_healthy_leaf'))) {
        modified = true;
        return { ...pa, thumbnail: cropImageMap[key] };
      }
      return pa;
    });
  }

  if (state.fields && state.crops && state.scans && state.scans.length > 0) {
    const recalculated = computeOverallHealthScore(state.fields, state.crops);
    if (state.overallHealthScore !== recalculated && recalculated > 0) {
      state.overallHealthScore = recalculated;
      modified = true;
    }
  }

  return { state, modified };
}

export function getFarmState(farmerId: string, defaultLocation?: string): FarmState {
  if (!farmerId) {
    farmerId = 'default_farmer';
  }
  const key = `${STORAGE_PREFIX}${farmerId}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed: FarmState = JSON.parse(raw);
      if (defaultLocation && (!parsed.farmDetails.location || parsed.farmDetails.location === 'Mumbai Suburban, Maharashtra')) {
        parsed.farmDetails.location = defaultLocation;
      }
      const { state: sanitized, modified } = sanitizeFarmState(parsed, defaultLocation);
      if (modified) {
        saveFarmState(farmerId, sanitized);
      }
      return sanitized;
    }
  } catch (err) {
    console.error('Failed to load farm state from localStorage:', err);
  }

  // If no saved state, initialize with clean empty farm state
  const initial = createEmptyFarmState(farmerId, defaultLocation);
  saveFarmState(farmerId, initial);
  return initial;
}

function sanitizeUrlForStorage(url?: string | null): string | null {
  if (!url) return null;
  // Never persist large base64 data URLs in localStorage (which causes QuotaExceededError)
  if (url.startsWith('data:image/') && url.length > 500) {
    return null;
  }
  return url;
}

export function saveFarmState(farmerId: string, state: FarmState): void {
  if (!farmerId) farmerId = 'default_farmer';
  const key = `${STORAGE_PREFIX}${farmerId}`;
  try {
    // Sanitize state so large base64 images don't exceed the 5MB browser quota
    const sanitizedState: FarmState = {
      ...state,
      scans: (state.scans || []).slice(0, 20).map((s: CropScanRecord) => ({
        ...s,
        previewUrl: sanitizeUrlForStorage(s.previewUrl),
      })),
    };
    localStorage.setItem(key, JSON.stringify(sanitizedState));
  } catch (err) {
    console.warn('Failed to save farm state to localStorage (quota exceeded), pruning old records...');
    try {
      const trimmedState: FarmState = {
        ...state,
        scans: (state.scans || []).slice(0, 5).map((s: CropScanRecord) => ({
          ...s,
          previewUrl: null,
        })),
      };
      localStorage.setItem(key, JSON.stringify(trimmedState));
    } catch (e) {
      console.error('Failed fallback saving farm state:', e);
    }
  }
}

export interface RecordScanInput {
  crop: string;
  fieldId?: string;
  fieldName?: string;
  cultivatedArea?: number;
  areaUnit?: 'Acres' | 'Hectares' | 'Guntha' | string;
  areaHa?: number;
  sowingDate?: string;
  variety?: string;
  irrigationMethod?: string;
  soilType?: string;
  season?: string;
  notes?: string;
  growthStage?: string;
  location?: string;
  disease: string;
  confidence: number;
  severity: string;
  recommendations: string[];
  previewUrl?: string | null;
}

export function recordScan(farmerId: string, input: RecordScanInput): FarmState {
  const currentState = getFarmState(farmerId);
  const now = new Date();
  const todayStr = formatTodayDate();
  const scanTimeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const scanId = `scan-${Date.now()}`;

  // Standardize areaHa
  let computedAreaHa = input.areaHa;
  if (computedAreaHa === undefined || computedAreaHa === null) {
    if (input.cultivatedArea !== undefined && input.cultivatedArea > 0) {
      if (input.areaUnit === 'Hectares') {
        computedAreaHa = input.cultivatedArea;
      } else if (input.areaUnit === 'Guntha') {
        computedAreaHa = Math.round(input.cultivatedArea * 0.0101 * 100) / 100;
      } else {
        // Default to Acres
        computedAreaHa = Math.round((input.cultivatedArea / 2.471) * 100) / 100;
      }
    } else {
      computedAreaHa = 0.5;
    }
  }

  const isHealthy =
    input.disease.toLowerCase().includes('healthy') ||
    input.severity.toLowerCase() === 'none' ||
    input.disease === 'Healthy Plant';

  let cropStatus: CropStatus = 'Healthy';
  let fieldStatus: FieldStatus = 'Healthy';
  let cropHealth = 92;

  if (!isHealthy) {
    if (input.severity.toLowerCase() === 'severe') {
      cropStatus = 'Diseased';
      fieldStatus = 'Diseased';
      cropHealth = 45;
    } else if (input.severity.toLowerCase() === 'moderate') {
      cropStatus = 'Diseased';
      fieldStatus = 'Diseased';
      cropHealth = 58;
    } else {
      cropStatus = 'At Risk';
      fieldStatus = 'At Risk';
      cropHealth = 72;
    }
  }

  // 1. Create CropScanRecord
  const scanRecord: CropScanRecord = {
    id: scanId,
    farmerId,
    fieldId: input.fieldId,
    crop: input.crop,
    disease: input.disease,
    confidence: input.confidence,
    severity: input.severity,
    scannedAt: `${todayStr}, ${scanTimeFormatted}`,
    recommendations: input.recommendations || [],
    previewUrl: input.previewUrl,
    status: cropStatus,
    cultivatedArea: input.cultivatedArea,
    areaUnit: input.areaUnit || 'Acres',
    growthStage: input.growthStage || undefined,
    location: input.location || undefined,
  };

  const updatedScans = [scanRecord, ...(currentState.scans || [])];

  // 2. Update Crop (with canonical deduplication)
  let cropFound = false;
  const normalizedInputCrop = input.crop.trim().toLowerCase();
  const inputCropKey = getCanonicalCropKey(input.crop);

  const updatedCrops = currentState.crops.map((c) => {
    const cKey = getCanonicalCropKey(c.id || c.name);
    if (cKey === inputCropKey || c.name.toLowerCase() === normalizedInputCrop) {
      cropFound = true;
      return {
        ...c,
        status: cropStatus,
        healthScore: cropHealth,
        lastScanDate: todayStr,
        detectedDisease: input.disease,
        severity: input.severity,
        image: input.previewUrl || c.image,
        cultivatedArea: input.cultivatedArea !== undefined ? input.cultivatedArea : c.cultivatedArea,
        areaUnit: input.areaUnit || c.areaUnit,
        areaHa: computedAreaHa !== undefined ? computedAreaHa : c.areaHa,
        sowingDate: input.sowingDate || c.sowingDate,
        variety: input.variety || c.variety,
        irrigationMethod: input.irrigationMethod || c.irrigationMethod,
        soilType: input.soilType || c.soilType,
        season: input.season || c.season,
        notes: input.notes || c.notes,
        growthStage: input.growthStage || c.growthStage,
      };
    }
    return c;
  });

  if (!cropFound) {
    // Add new genuine crop dynamically
    const displayCrop = input.crop;
    const cropIcon = CROP_ICONS[inputCropKey] || '🌿';
    const newCrop: FarmCrop = {
      id: inputCropKey,
      name: displayCrop,
      icon: cropIcon,
      image: input.previewUrl || `/images/crop_${inputCropKey}.jpg`,
      status: cropStatus,
      healthScore: cropHealth,
      areaHa: computedAreaHa,
      cultivatedArea: input.cultivatedArea,
      areaUnit: input.areaUnit || 'Acres',
      sowingDate: input.sowingDate,
      variety: input.variety,
      irrigationMethod: input.irrigationMethod,
      soilType: input.soilType,
      season: input.season,
      notes: input.notes,
      growthStage: input.growthStage,
      expectedYieldQtHa: 10.0,
      lastScanDate: todayStr,
      detectedDisease: input.disease,
      severity: input.severity,
    };
    updatedCrops.push(newCrop);
  }

  // 3. Update or create Field
  let targetFieldId = input.fieldId;
  let updatedFields = [...currentState.fields];

  if (targetFieldId) {
    updatedFields = updatedFields.map((f) => {
      if (f.id === targetFieldId) {
        return {
          ...f,
          status: fieldStatus,
          healthScore: cropHealth,
          lastScanDate: todayStr,
          detectedDisease: input.disease,
          areaHa: computedAreaHa || f.areaHa,
          cultivatedArea: input.cultivatedArea !== undefined ? input.cultivatedArea : f.cultivatedArea,
          areaUnit: input.areaUnit || f.areaUnit,
          sowingDate: input.sowingDate || f.sowingDate,
          variety: input.variety || f.variety,
          irrigationMethod: input.irrigationMethod || f.irrigationMethod,
          soilType: input.soilType || f.soilType,
          season: input.season || f.season,
          notes: input.notes || f.notes,
          growthStage: input.growthStage || f.growthStage,
        };
      }
      return f;
    });
  } else {
    // Check if an existing field matches this crop
    const matchingFieldIndex = updatedFields.findIndex(
      (f) => getCanonicalCropKey(f.crop) === inputCropKey || f.crop.toLowerCase() === normalizedInputCrop
    );
    if (matchingFieldIndex >= 0) {
      targetFieldId = updatedFields[matchingFieldIndex].id;
      updatedFields[matchingFieldIndex] = {
        ...updatedFields[matchingFieldIndex],
        status: fieldStatus,
        healthScore: cropHealth,
        lastScanDate: todayStr,
        detectedDisease: input.disease,
        areaHa: computedAreaHa || updatedFields[matchingFieldIndex].areaHa,
        cultivatedArea: input.cultivatedArea !== undefined ? input.cultivatedArea : updatedFields[matchingFieldIndex].cultivatedArea,
        areaUnit: input.areaUnit || updatedFields[matchingFieldIndex].areaUnit,
        sowingDate: input.sowingDate || updatedFields[matchingFieldIndex].sowingDate,
        variety: input.variety || updatedFields[matchingFieldIndex].variety,
        irrigationMethod: input.irrigationMethod || updatedFields[matchingFieldIndex].irrigationMethod,
        soilType: input.soilType || updatedFields[matchingFieldIndex].soilType,
        season: input.season || updatedFields[matchingFieldIndex].season,
        notes: input.notes || updatedFields[matchingFieldIndex].notes,
        growthStage: input.growthStage || updatedFields[matchingFieldIndex].growthStage,
      };
    } else {
      // Create new genuine field record for this first-time scanned crop
      targetFieldId = `field-${Date.now()}`;
      const fieldDisplayName = input.fieldName?.trim() || `Field ${updatedFields.length + 1} - ${input.crop}`;
      const newField: FarmField = {
        id: targetFieldId,
        name: fieldDisplayName,
        crop: input.crop,
        areaHa: computedAreaHa,
        cultivatedArea: input.cultivatedArea,
        areaUnit: input.areaUnit || 'Acres',
        healthScore: cropHealth,
        status: fieldStatus,
        lastScanDate: todayStr,
        detectedDisease: input.disease,
        sowingDate: input.sowingDate,
        variety: input.variety,
        irrigationMethod: input.irrigationMethod,
        soilType: input.soilType,
        season: input.season,
        notes: input.notes,
        growthStage: input.growthStage,
      };
      updatedFields.push(newField);
    }
  }

  // Ensure scan record links to the correct fieldId
  scanRecord.fieldId = targetFieldId;

  // 4. Recalculate Overall Farm Health Score & Total Farm Area
  const overallHealthScore = computeOverallHealthScore(updatedFields, updatedCrops);
  const totalFarmAreaHa = Math.round(updatedFields.reduce((sum, f) => sum + (f.areaHa || 0), 0) * 100) / 100;

  // 5. Update Recent Activity (Newest First)
  const activityStatus: ActivityStatus = isHealthy ? 'Healthy' : 'Diseased';
  const newActivity: FarmActivity = {
    id: `act-${Date.now()}`,
    date: todayStr,
    activity: 'Crop Scan',
    crop: input.crop,
    details: `${input.disease} detected (AI)`,
    status: activityStatus,
    timestamp: Date.now(),
  };

  const updatedActivities = [newActivity, ...(currentState.activities || [])].slice(0, 15);

  // 6. Generate Dynamic Priority Action
  const remainingPriorityActions = (currentState.priorityActions || []).filter(
    (pa) => pa.crop.toLowerCase() !== normalizedInputCrop
  );

  let newPriorityActions = [...remainingPriorityActions];
  if (!isHealthy) {
    const priorityLevel: PriorityLevel =
      input.severity.toLowerCase() === 'severe' || input.confidence > 85 ? 'High' : 'Medium';
    const topRec =
      input.recommendations?.[0] || `Follow advisory treatment for ${input.disease}.`;

    const newPA: PriorityAction = {
      id: `pa-scan-${Date.now()}`,
      crop: input.crop,
      title: `Inspect ${input.crop.toLowerCase()} field within 24 hours`,
      subtitle: `${input.disease} detected`,
      priority: priorityLevel,
      action: topRec,
      fieldId: targetFieldId,
      thumbnail: input.previewUrl || `/images/crop_${input.crop.toLowerCase()}.jpg`,
    };
    newPriorityActions = [newPA, ...remainingPriorityActions];
  }

  // 7. Generate Farm Insights
  let updatedInsights = [...(currentState.farmInsights || [])];
  if (!isHealthy) {
    const diseaseInsight: FarmInsight = {
      id: `fi-scan-${Date.now()}`,
      title: `High risk detected in ${input.crop} (${input.disease}).`,
      subtitle: input.recommendations?.[0] || 'Check advisory for control measures.',
      source: 'AI Disease Detector',
      iconType: 'alert',
    };
    updatedInsights = [diseaseInsight, ...updatedInsights.filter((fi) => !fi.title.includes(input.crop))].slice(0, 5);
  }

  // 8. Assemble Updated Farm State
  const updatedState: FarmState = {
    ...currentState,
    crops: updatedCrops,
    fields: updatedFields,
    scans: updatedScans,
    activities: updatedActivities,
    priorityActions: newPriorityActions,
    farmInsights: updatedInsights,
    overallHealthScore,
    lastUpdated: `${todayStr}, ${scanTimeFormatted}`,
    farmDetails: {
      ...currentState.farmDetails,
      location: input.location?.trim() || currentState.farmDetails.location,
      totalAreaHa: totalFarmAreaHa,
      lastUpdated: `${todayStr}, ${scanTimeFormatted}`,
    },
  };

  // Persist to farm storage
  saveFarmState(farmerId, updatedState);

  // Backwards compatibility with legacy cropguard_history
  try {
    const rawLegacy = localStorage.getItem('cropguard_history');
    let legacyHistory: any[] = [];
    if (rawLegacy) {
      try {
        legacyHistory = JSON.parse(rawLegacy);
      } catch (_) {
        legacyHistory = [];
      }
    }
    const safePreview = sanitizeUrlForStorage(input.previewUrl);
    const newLegacyItem = {
      id: scanId,
      date: Date.now(),
      crop: input.crop,
      disease: input.disease,
      severity: input.severity,
      confidence: input.confidence,
      previewUrl: safePreview,
    };
    const sanitizedLegacy = [newLegacyItem, ...legacyHistory].slice(0, 25).map((item) => ({
      ...item,
      previewUrl: sanitizeUrlForStorage(item.previewUrl),
    }));
    localStorage.setItem('cropguard_history', JSON.stringify(sanitizedLegacy));
  } catch (e) {
    console.warn('Failed to sync to cropguard_history:', e);
    try {
      localStorage.removeItem('cropguard_history');
    } catch (_) {}
  }

  return updatedState;
}

export function addCropRecord(
  farmerId: string,
  record: { cropName: string; areaHa: number; stage?: string }
): FarmState {
  const currentState = getFarmState(farmerId);
  const todayStr = formatTodayDate();
  const cropId = record.cropName.toLowerCase().replace(/\s+/g, '-');

  const newCrop: FarmCrop = {
    id: cropId,
    name: record.cropName,
    icon: '🌿',
    image: '/images/crop_healthy_leaf.jpg',
    status: 'Healthy',
    healthScore: 90,
    areaHa: record.areaHa,
    expectedYieldQtHa: 12.0,
    lastScanDate: 'Awaiting scan',
  };

  const newField: FarmField = {
    id: `field-${Date.now()}`,
    name: `Field ${currentState.fields.length + 1} - ${record.cropName}`,
    crop: record.cropName,
    areaHa: record.areaHa,
    healthScore: 90,
    status: 'Healthy',
    lastScanDate: 'Awaiting scan',
  };

  const newActivity: FarmActivity = {
    id: `act-${Date.now()}`,
    date: todayStr,
    activity: 'Crop Record',
    crop: record.cropName,
    details: `Added ${record.cropName} (${record.areaHa} Ha)`,
    status: 'Updated',
    timestamp: Date.now(),
  };

  const updatedCrops = [...currentState.crops, newCrop];
  const updatedFields = [...currentState.fields, newField];
  const updatedActivities = [newActivity, ...currentState.activities];
  const overallHealthScore = computeOverallHealthScore(updatedFields, updatedCrops);
  const totalAreaHa = Number((currentState.farmDetails.totalAreaHa + record.areaHa).toFixed(1));

  const updatedState: FarmState = {
    ...currentState,
    crops: updatedCrops,
    fields: updatedFields,
    activities: updatedActivities,
    overallHealthScore,
    farmDetails: {
      ...currentState.farmDetails,
      totalAreaHa,
      lastUpdated: `${todayStr}, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    },
  };

  saveFarmState(farmerId, updatedState);
  return updatedState;
}

export function scheduleFieldVisit(
  farmerId: string,
  visit: { crop: string; date: string; officerVillage?: string }
): FarmState {
  const currentState = getFarmState(farmerId);
  const todayStr = formatTodayDate();

  const newActivity: FarmActivity = {
    id: `act-${Date.now()}`,
    date: todayStr,
    activity: 'Field Visit',
    crop: visit.crop || 'Farm',
    details: `Field visit requested for ${visit.date} (${visit.officerVillage || 'Extension Officer'})`,
    status: 'Completed',
    timestamp: Date.now(),
  };

  const updatedState: FarmState = {
    ...currentState,
    activities: [newActivity, ...currentState.activities],
  };

  saveFarmState(farmerId, updatedState);

  // Sync to government portal
  try {
    const govCases = JSON.parse(localStorage.getItem('gov_portal_needs_visit') || '[]');
    const newGovCase = {
      id: `FV-${Date.now().toString().slice(-5)}`,
      name: currentState.farmDetails.name,
      location: currentState.farmDetails.location,
      district: currentState.farmDetails.location.split(',')[0],
      status: 'Pending Visit',
      priority: 'High',
      date: new Date(visit.date).toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      assignedOfficer: visit.officerVillage || 'Unassigned',
      crop: visit.crop
    };
    localStorage.setItem('gov_portal_needs_visit', JSON.stringify([newGovCase, ...govCases]));
  } catch (e) {
    console.error('Failed to sync field visit to gov portal', e);
  }

  return updatedState;
}

export function resetFarmerFarm(farmerId: string): void {
  if (!farmerId) farmerId = 'default_farmer';
  localStorage.removeItem(`${STORAGE_PREFIX}${farmerId}`);
}
