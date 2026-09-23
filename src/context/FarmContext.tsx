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
  detectedDisease?: string;
  from?: 'farm' | 'home' | 'scan';
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
  startAdvisoryForCrop: (crop: FarmCrop | string, field?: FarmField) => void;
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

  const startAdvisoryForCrop = useCallback((crop: FarmCrop | string, field?: FarmField) => {
    if (typeof crop === 'string') {
      setAdvisoryTarget({
        crop,
        fieldId: field?.id,
        fieldName: field?.name,
        cultivatedArea: field?.cultivatedArea ?? (field?.areaHa ? Number((field.areaHa * 2.471).toFixed(1)) : undefined),
        areaUnit: (field?.areaUnit as any) || 'Acres',
        areaHa: field?.areaHa,
        variety: field?.variety,
        growthStage: field?.growthStage,
        soilType: field?.soilType,
        irrigationMethod: field?.irrigationMethod,
        season: field?.season,
        detectedDisease: field?.detectedDisease,
        from: 'farm',
      });
    } else {
      setAdvisoryTarget({
        fieldId: field?.id,
        fieldName: field?.name,
        crop: crop.name,
        cultivatedArea: crop.cultivatedArea ?? (crop.areaHa ? Number((crop.areaHa * 2.471).toFixed(1)) : undefined),
        areaUnit: (crop.areaUnit as any) || 'Acres',
        areaHa: crop.areaHa,
        variety: crop.variety || field?.variety,
        growthStage: crop.growthStage || field?.growthStage,
        soilType: crop.soilType || field?.soilType,
        irrigationMethod: crop.irrigationMethod || field?.irrigationMethod,
        season: crop.season || field?.season,
        detectedDisease: crop.detectedDisease || field?.detectedDisease,
        from: 'farm',
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

