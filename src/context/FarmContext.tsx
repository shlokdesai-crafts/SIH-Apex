import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { AuthContext } from '../auth/AuthContext';
import type { FarmState } from '../types/farm';
import {
  getFarmState,
  recordScan as recordScanService,
  addCropRecord as addCropRecordService,
  scheduleFieldVisit as scheduleFieldVisitService,
  resetFarmerFarm,
  type RecordScanInput,
} from '../services/farmService';

interface FarmContextType {
  farmState: FarmState | null;
  isLoading: boolean;
  recordScan: (input: RecordScanInput) => Promise<FarmState>;
  addCropRecord: (record: { cropName: string; areaHa: number; stage?: string }) => Promise<FarmState>;
  scheduleFieldVisit: (visit: { crop: string; date: string; officerVillage?: string }) => Promise<FarmState>;
  refreshFarm: () => void;
  resetFarm: () => void;
}

export const FarmContext = createContext<FarmContextType>({
  farmState: null,
  isLoading: true,
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

  const loadFarm = useCallback(() => {
    setIsLoading(true);
    const state = getFarmState(farmerId, defaultLocation);
    setFarmState(state);
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
