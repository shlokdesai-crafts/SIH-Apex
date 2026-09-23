import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { AuthContext } from '../auth/AuthContext';
import type { FarmState, FarmField, FarmCrop, CropScanRecord, CropStatus } from '../types/farm';
import {
  getFarmState,
  recordScan as recordScanService,
  addCropRecord as addCropRecordService,
  scheduleFieldVisit as scheduleFieldVisitService,
  resetFarmerFarm,
  type RecordScanInput,
} from '../services/farmService';
import { getScanHistory } from '../services/cropScanApi';
import { normalizeCropKey } from '../data/advisoryCropData';

export interface ScanTarget {
  fieldId?: string;
  crop?: string;
}

export interface AdvisoryTarget {
  fieldId?: string;
  fieldName?: string;
  crop?: string;
  cultivatedArea?: number;
  areaUnit?: 'Acres' | 'Hectares' | 'Guntha' | string;
  areaHa?: number;
  variety?: string;
  growthStage?: string;
  soilType?: string;
  irrigationMethod?: string;
  season?: string;
  sowingDate?: string;
  detectedDisease?: string;
  scanId?: string;
  from?: 'farm' | 'home' | 'scan';
}

export interface UserEligibleCrop {
  key: string;              // unique plot/crop key (e.g. `${canonicalKey}_${fieldId || 'unassigned'}`)
  canonicalKey: string;     // for ADVISORY_DATA / agronomic lookup (e.g. 'tomato')
  name: string;             // display name (e.g. 'Tomato')
  image: string;
  fieldId?: string;
  fieldName?: string;       // e.g. 'North Field - Plot A'
  cultivatedArea?: number;
  areaUnit?: string;
  areaHa?: number;
  areaDisplay: string;      // e.g. '2.5 Acres' or 'Not recorded'
  variety?: string;
  growthStage?: string;     // e.g. 'Flowering' or undefined
  sowingDate?: string;
  soilType?: string;
  irrigationMethod?: string;
  source: 'farm' | 'scanned' | 'both';
  sourceLabel: string;      // '🌾 My Farm' | '📷 Scanned Crop' | '🌾 My Farm & Scanned'
  latestScanSummary?: string;
  latestScanDate?: string;
  isTestFixture?: boolean;
}

/**
 * Gate test fixtures behind explicit development/test environment check.
 * NEVER returns true in production builds (import.meta.env.PROD === true).
 */
export const isDevTestEnvironment = (): boolean => {
  try {
    return Boolean(
      import.meta.env.DEV &&
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('mode') === 'test'
    );
  } catch {
    return false;
  }
};

const DEV_TEST_FIXTURES: UserEligibleCrop[] = [
  {
    key: 'test_tomato_plot_a',
    canonicalKey: 'tomato',
    name: 'Tomato (Demo Plot A)',
    image: '/images/crop_tomato.jpg',
    fieldId: 'test-field-1',
    fieldName: '[Test Data] North Block - Plot A',
    cultivatedArea: 2.5,
    areaUnit: 'Acres',
    areaDisplay: '2.5 Acres',
    growthStage: 'Flowering Stage',
    sowingDate: '15 Aug 2026',
    soilType: 'Black Clay Loam',
    irrigationMethod: 'Drip Irrigation',
    source: 'both',
    sourceLabel: '🧪 Test Fixture',
    latestScanSummary: 'Early Blight (Moderate severity, 94.2% confidence)',
    latestScanDate: '18 Sep 2026',
    isTestFixture: true,
  },
  {
    key: 'test_cotton_west',
    canonicalKey: 'cotton',
    name: 'Cotton (Demo Plot B)',
    image: '/images/crop_cotton.jpg',
    fieldId: 'test-field-2',
    fieldName: '[Test Data] West Block - Plot B',
    cultivatedArea: 4.0,
    areaUnit: 'Acres',
    areaDisplay: '4.0 Acres',
    growthStage: 'Vegetative Growth',
    sowingDate: '01 Jun 2026',
    soilType: 'Deep Black Cotton Soil',
    irrigationMethod: 'Furrow',
    source: 'farm',
    sourceLabel: '🧪 Test Fixture',
    latestScanSummary: 'Healthy Plant (96.5% confidence)',
    latestScanDate: '12 Sep 2026',
    isTestFixture: true,
  },
  {
    key: 'test_onion_demo',
    canonicalKey: 'onion',
    name: 'Onion (Demo Unsupported Model)',
    image: '/images/onion_crop.jpg',
    fieldId: 'test-field-3',
    fieldName: '[Test Data] South Plot C',
    cultivatedArea: 1.5,
    areaUnit: 'Acres',
    areaDisplay: '1.5 Acres',
    growthStage: 'Bulb Formation',
    sowingDate: '10 Jul 2026',
    soilType: 'Sandy Loam',
    irrigationMethod: 'Micro Sprinkler',
    source: 'farm',
    sourceLabel: '🧪 Test Fixture',
    isTestFixture: true,
  }
];

function extractGenuineCrops(farmState: FarmState | null): UserEligibleCrop[] {
  if (!farmState) return [];
  const result: UserEligibleCrop[] = [];
  const addedKeys = new Set<string>();

  const CROP_FALLBACK_IMAGES: Record<string, string> = {
    cotton: '/images/crop_cotton.jpg',
    soybean: '/images/crop_soybean.jpg',
    sugarcane: '/images/crop_sugarcane.jpg',
    rice: '/images/crop_rice.jpg',
    wheat: '/images/crop_wheat.jpg',
    tomato: '/images/crop_tomato.jpg',
    chickpea: '/images/crop_chickpea.jpg',
    onion: '/images/onion_crop.jpg',
    potato: '/images/potato_crop.jpg',
    maize: '/images/crop_maize.jpg',
    banana: '/images/crops/banana.png',
    mango: '/images/crops/mango.png',
  };

  const getCropImage = (canonKey: string, existingImg?: string): string => {
    if (existingImg && !existingImg.includes('crop_leaf') && !existingImg.includes('crop_healthy_leaf')) {
      return existingImg;
    }
    return CROP_FALLBACK_IMAGES[canonKey] || '/images/crop_tomato.jpg';
  };

  // 1. Process fields (explicit plots registered in My Farm)
  if (Array.isArray(farmState.fields)) {
    for (const field of farmState.fields) {
      if (!field.crop) continue;
      const canonKey = normalizeCropKey(field.crop);
      const key = `${canonKey}_${field.id}`;
      addedKeys.add(key);

      const matchedCrop = farmState.crops?.find(c =>
        c.id?.toLowerCase() === field.crop?.toLowerCase() ||
        c.name?.toLowerCase() === field.crop?.toLowerCase() ||
        normalizeCropKey(c.name || c.id) === canonKey
      );

      const fieldScans = (farmState.scans || []).filter(s =>
        s.fieldId === field.id ||
        (s.crop && normalizeCropKey(s.crop) === canonKey)
      );
      const latestScan = fieldScans.length > 0 ? fieldScans[0] : undefined;

      const areaVal = field.cultivatedArea ?? (field.areaHa ? Number((field.areaHa * 2.471).toFixed(1)) : undefined);
      const areaUnit = field.areaUnit || 'Acres';
      const areaDisplay = areaVal != null ? `${areaVal} ${areaUnit}` : (field.areaHa ? `${Number((field.areaHa * 2.471).toFixed(1))} Acres` : 'Not recorded');

      const hasScan = Boolean(latestScan);
      const source: 'farm' | 'both' = hasScan ? 'both' : 'farm';
      const sourceLabel = hasScan ? '🌾 My Farm & Scanned' : '🌾 My Farm';

      let latestScanSummary: string | undefined;
      let latestScanDate: string | undefined;
      if (latestScan) {
        latestScanSummary = latestScan.disease
          ? `${latestScan.disease}${latestScan.severity && latestScan.severity !== 'None' ? ` (${latestScan.severity})` : ''}`
          : 'Healthy Plant';
        if (latestScan.scannedAt) {
          latestScanDate = typeof latestScan.scannedAt === 'number'
            ? new Date(latestScan.scannedAt).toLocaleDateString('en-IN')
            : String(latestScan.scannedAt);
        }
      }

      result.push({
        key,
        canonicalKey: canonKey,
        name: field.crop,
        image: getCropImage(canonKey, matchedCrop?.image),
        fieldId: field.id,
        fieldName: field.name || 'Unassigned Plot',
        cultivatedArea: areaVal,
        areaUnit,
        areaHa: field.areaHa,
        areaDisplay,
        variety: field.variety || matchedCrop?.variety,
        growthStage: field.growthStage || matchedCrop?.growthStage,
        sowingDate: field.sowingDate || matchedCrop?.sowingDate,
        soilType: field.soilType,
        irrigationMethod: field.irrigationMethod,
        source,
        sourceLabel,
        latestScanSummary,
        latestScanDate,
      });
    }
  }

  // 2. Process crops from farmState.crops that were NOT linked to any field
  if (Array.isArray(farmState.crops)) {
    for (const crop of farmState.crops) {
      const canonKey = normalizeCropKey(crop.name || crop.id);
      const alreadyHasField = result.some(r => r.canonicalKey === canonKey);
      if (alreadyHasField) continue;

      const key = `${canonKey}_crop_${crop.id}`;
      if (addedKeys.has(key)) continue;
      addedKeys.add(key);

      const cropScans = (farmState.scans || []).filter(s =>
        s.crop && normalizeCropKey(s.crop) === canonKey
      );
      const latestScan = cropScans.length > 0 ? cropScans[0] : undefined;

      const areaVal = crop.cultivatedArea ?? (crop.areaHa ? Number((crop.areaHa * 2.471).toFixed(1)) : undefined);
      const areaUnit = crop.areaUnit || 'Acres';
      const areaDisplay = areaVal != null ? `${areaVal} ${areaUnit}` : (crop.areaHa ? `${Number((crop.areaHa * 2.471).toFixed(1))} Acres` : 'Not recorded');
      const hasScan = Boolean(latestScan);
      const source: 'farm' | 'both' = hasScan ? 'both' : 'farm';
      const sourceLabel = hasScan ? '🌾 My Farm & Scanned' : '🌾 My Farm';

      let latestScanSummary: string | undefined;
      let latestScanDate: string | undefined;
      if (latestScan) {
        latestScanSummary = latestScan.disease
          ? `${latestScan.disease}${latestScan.severity && latestScan.severity !== 'None' ? ` (${latestScan.severity})` : ''}`
          : 'Healthy Plant';
        if (latestScan.scannedAt) {
          latestScanDate = typeof latestScan.scannedAt === 'number'
            ? new Date(latestScan.scannedAt).toLocaleDateString('en-IN')
            : String(latestScan.scannedAt);
        }
      }

      result.push({
        key,
        canonicalKey: canonKey,
        name: crop.name,
        image: getCropImage(canonKey, crop.image),
        fieldName: 'Registered Farm Crop',
        cultivatedArea: areaVal,
        areaUnit,
        areaHa: crop.areaHa,
        areaDisplay,
        variety: crop.variety,
        growthStage: crop.growthStage,
        sowingDate: crop.sowingDate,
        source,
        sourceLabel,
        latestScanSummary,
        latestScanDate,
      });
    }
  }

  // 3. Process scans from farmState.scans that do not match any already included crop/field
  if (Array.isArray(farmState.scans)) {
    for (const scan of farmState.scans) {
      if (!scan.crop) continue;
      const canonKey = normalizeCropKey(scan.crop);
      const matchedEntry = result.find(r =>
        (scan.fieldId && r.fieldId === scan.fieldId) ||
        r.canonicalKey === canonKey
      );

      if (matchedEntry) {
        if (!matchedEntry.latestScanSummary && scan.disease) {
          matchedEntry.latestScanSummary = `${scan.disease}${scan.severity && scan.severity !== 'None' ? ` (${scan.severity})` : ''}`;
          matchedEntry.source = 'both';
          matchedEntry.sourceLabel = '🌾 My Farm & Scanned';
        }
      } else {
        const key = `scanned_${canonKey}_${scan.id}`;
        if (addedKeys.has(key)) continue;
        addedKeys.add(key);

        const areaVal = scan.cultivatedArea;
        const areaUnit = scan.areaUnit || 'Acres';
        const areaDisplay = areaVal != null ? `${areaVal} ${areaUnit}` : 'Not recorded';

        const scanSummary = scan.disease
          ? `${scan.disease}${scan.severity && scan.severity !== 'None' ? ` (${scan.severity})` : ''}`
          : 'Healthy Plant';
        const scanDate = scan.scannedAt
          ? (typeof scan.scannedAt === 'number' ? new Date(scan.scannedAt).toLocaleDateString('en-IN') : String(scan.scannedAt))
          : undefined;

        result.push({
          key,
          canonicalKey: canonKey,
          name: scan.crop,
          image: getCropImage(canonKey, scan.previewUrl || undefined),
          fieldName: 'Scanned Crop (Unassigned)',
          cultivatedArea: areaVal,
          areaUnit,
          areaHa: undefined,
          areaDisplay,
          variety: (scan as any).variety,
          growthStage: scan.growthStage,
          sowingDate: (scan as any).sowingDate,
          source: 'scanned',
          sourceLabel: '📷 Scanned Crop',
          latestScanSummary: scanSummary,
          latestScanDate: scanDate,
        });
      }
    }
  }

  return result;
}

export function getUserEligibleCrops(farmState: FarmState | null): UserEligibleCrop[] {
  if (isDevTestEnvironment()) {
    const genuine = extractGenuineCrops(farmState);
    if (genuine.length > 0) {
      return [...genuine, ...DEV_TEST_FIXTURES];
    }
    return DEV_TEST_FIXTURES;
  }
  return extractGenuineCrops(farmState);
}

interface FarmContextType {
  farmState: FarmState | null;
  isLoading: boolean;
  scanTarget: ScanTarget | null;
  setScanTarget: (target: ScanTarget | null) => void;
  startScanForField: (field: FarmField) => void;
  startScanForCrop: (cropName: string) => void;
  clearScanTarget: () => void;
  advisoryTarget: AdvisoryTarget | null;
  setAdvisoryTarget: (target: AdvisoryTarget | null) => void;
  startAdvisoryForField: (field: FarmField) => void;
  startAdvisoryForCrop: (crop: FarmCrop | string, field?: FarmField, extra?: Partial<AdvisoryTarget>) => void;
  clearAdvisoryTarget: () => void;
  recordScan: (input: RecordScanInput) => Promise<FarmState>;
  addCropRecord: (record: { cropName: string; areaHa: number; stage?: string }) => Promise<FarmState>;
  scheduleFieldVisit: (visit: { crop: string; date: string; officerVillage?: string }) => Promise<FarmState>;
  refreshFarm: () => void;
  resetFarm: () => void;
}

export const FarmContext = createContext<FarmContextType>({
  farmState: null,
  isLoading: true,
  scanTarget: null,
  setScanTarget: () => {},
  startScanForField: () => {},
  startScanForCrop: () => {},
  clearScanTarget: () => {},
  advisoryTarget: null,
  setAdvisoryTarget: () => {},
  startAdvisoryForField: () => {},
  startAdvisoryForCrop: () => {},
  clearAdvisoryTarget: () => {},
  recordScan: async () => { throw new Error('FarmContext not initialized'); },
  addCropRecord: async () => { throw new Error('FarmContext not initialized'); },
  scheduleFieldVisit: async () => { throw new Error('FarmContext not initialized'); },
  refreshFarm: () => {},
  resetFarm: () => {},
});

export function FarmProvider({ children }: { children: ReactNode }) {
  const { user } = useContext(AuthContext);
  const farmerId = user?.id || 'default_farmer';
  const defaultLocation = user?.location || 'Mumbai Suburban, Maharashtra';

  const [farmState, setFarmState] = useState<FarmState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scanTarget, setScanTarget] = useState<ScanTarget | null>(null);
  const [advisoryTarget, setAdvisoryTarget] = useState<AdvisoryTarget | null>(null);

  const startScanForField = useCallback((field: FarmField) => {
    setScanTarget({ fieldId: field.id, crop: field.crop });
  }, []);

  const startScanForCrop = useCallback((cropName: string) => {
    setScanTarget({ crop: cropName });
  }, []);

  const clearScanTarget = useCallback(() => {
    setScanTarget(null);
  }, []);

  const startAdvisoryForField = useCallback((field: FarmField) => {
    setAdvisoryTarget({
      fieldId: field.id,
      fieldName: field.name,
      crop: field.crop,
      cultivatedArea: field.cultivatedArea ?? (field.areaHa ? Number((field.areaHa * 2.471).toFixed(1)) : undefined),
      areaUnit: (field.areaUnit as any) || 'Acres',
      areaHa: field.areaHa,
      variety: field.variety,
      growthStage: field.growthStage,
      soilType: field.soilType,
      irrigationMethod: field.irrigationMethod,
      season: field.season,
      detectedDisease: field.detectedDisease,
      from: 'farm',
    });
  }, []);

  const startAdvisoryForCrop = useCallback((
    crop: FarmCrop | string,
    field?: FarmField,
    extra?: Partial<AdvisoryTarget>
  ) => {
    if (typeof crop === 'string') {
      setAdvisoryTarget({
        crop,
        fieldId: field?.id || extra?.fieldId,
        fieldName: field?.name || extra?.fieldName,
        cultivatedArea: extra?.cultivatedArea ?? field?.cultivatedArea ?? (field?.areaHa ? Number((field.areaHa * 2.471).toFixed(1)) : undefined),
        areaUnit: (extra?.areaUnit || field?.areaUnit || 'Acres') as any,
        areaHa: extra?.areaHa ?? field?.areaHa,
        variety: extra?.variety || field?.variety,
        growthStage: extra?.growthStage || field?.growthStage,
        soilType: extra?.soilType || field?.soilType,
        irrigationMethod: extra?.irrigationMethod || field?.irrigationMethod,
        season: extra?.season || field?.season,
        detectedDisease: extra?.detectedDisease || field?.detectedDisease,
        scanId: extra?.scanId,
        from: extra?.from || 'farm',
      });
    } else {
      setAdvisoryTarget({
        fieldId: field?.id || extra?.fieldId,
        fieldName: field?.name || extra?.fieldName,
        crop: crop.name,
        cultivatedArea: extra?.cultivatedArea ?? crop.cultivatedArea ?? field?.cultivatedArea ?? (crop.areaHa ? Number((crop.areaHa * 2.471).toFixed(1)) : undefined),
        areaUnit: (extra?.areaUnit || crop.areaUnit || field?.areaUnit || 'Acres') as any,
        areaHa: extra?.areaHa ?? crop.areaHa ?? field?.areaHa,
        variety: extra?.variety || crop.variety || field?.variety,
        growthStage: extra?.growthStage || crop.growthStage || field?.growthStage,
        soilType: extra?.soilType || crop.soilType || field?.soilType,
        irrigationMethod: extra?.irrigationMethod || crop.irrigationMethod || field?.irrigationMethod,
        season: extra?.season || crop.season || field?.season,
        detectedDisease: extra?.detectedDisease || crop.detectedDisease || field?.detectedDisease,
        scanId: extra?.scanId,
        from: extra?.from || 'farm',
      });
    }
  }, []);

  const clearAdvisoryTarget = useCallback(() => {
    setAdvisoryTarget(null);
  }, []);

  const loadFarm = useCallback(async () => {
    setIsLoading(true);
    let local = getFarmState(farmerId, defaultLocation);

    // Hydrate farm state with persistent scans from backend database
    try {
      const remoteScans = await getScanHistory(farmerId !== 'default_farmer' ? farmerId : undefined);
      if (remoteScans && remoteScans.length > 0) {
        const remoteMapped: CropScanRecord[] = remoteScans.map((r) => {
          const isHealthy = (r.disease || r.condition || '').toLowerCase().includes('healthy') ||
            (r.severity || '').toLowerCase() === 'none';
          let status: CropStatus = 'Healthy';
          if (!isHealthy) {
            const sev = (r.severity || '').toLowerCase();
            status = (sev === 'severe' || sev === 'moderate') ? 'Diseased' : 'At Risk';
          }
          return {
            id: r.id,
            farmerId: r.farmerId || farmerId,
            fieldId: r.fieldId,
            crop: r.cropName || r.crop,
            disease: r.disease || r.condition || 'Healthy Plant',
            confidence: r.confidence || r.diseaseConfidence || r.cropConfidence || 0,
            severity: r.severity || 'Unknown',
            scannedAt: r.scannedAt || r.createdAt || (typeof r.date === 'string' ? r.date : new Date().toLocaleDateString()),
            recommendations: r.recommendedActions || r.recommended_actions || [],
            previewUrl: r.previewUrl || r.imageUrl || r.imagePath || null,
            status,
          };
        });

        // Deduplicate: remote takes precedence over localStorage
        const remoteIds = new Set(remoteMapped.map((s) => s.id));
        const localRemaining = (local.scans || []).filter((s) => !remoteIds.has(s.id));
        const unifiedScans = [...remoteMapped, ...localRemaining];
        local = { ...local, scans: unifiedScans };
      }
    } catch (err) {
      console.warn('Failed to hydrate farm state with remote scans:', err);
    }

    setFarmState(local);
    setIsLoading(false);
  }, [farmerId, defaultLocation]);

  useEffect(() => {
    loadFarm();
  }, [loadFarm]);

  const recordScan = useCallback(
    async (input: RecordScanInput): Promise<FarmState> => {
      const updated = recordScanService(farmerId, input);
      setFarmState(updated);
      return updated;
    },
    [farmerId]
  );

  const addCropRecord = useCallback(
    async (record: { cropName: string; areaHa: number; stage?: string }): Promise<FarmState> => {
      const updated = addCropRecordService(farmerId, record);
      setFarmState(updated);
      return updated;
    },
    [farmerId]
  );

  const scheduleFieldVisit = useCallback(
    async (visit: { crop: string; date: string; officerVillage?: string }): Promise<FarmState> => {
      const updated = scheduleFieldVisitService(farmerId, visit);
      setFarmState(updated);
      return updated;
    },
    [farmerId]
  );

  const resetFarm = useCallback(() => {
    resetFarmerFarm(farmerId);
    loadFarm();
  }, [farmerId, loadFarm]);

  return (
    <FarmContext.Provider
      value={{
        farmState,
        isLoading,
        scanTarget,
        setScanTarget,
        startScanForField,
        startScanForCrop,
        clearScanTarget,
        advisoryTarget,
        setAdvisoryTarget,
        startAdvisoryForField,
        startAdvisoryForCrop,
        clearAdvisoryTarget,
        recordScan,
        addCropRecord,
        scheduleFieldVisit,
        refreshFarm: loadFarm,
        resetFarm,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm(): FarmContextType {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
}

