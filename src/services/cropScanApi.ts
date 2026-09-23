/**
 * src/services/cropScanApi.ts
 * ────────────────────────────
 * Typed API client for CropGuard backend services:
 * - POST   /api/scan
 * - GET    /api/scans/history
 * - GET    /api/scans/history/:id
 * - DELETE /api/scans/history/:id
 * - GET    /api/health
 */

export interface PredictionCandidate {
  crop: string;
  condition: string;
  confidence: number;
  probability?: number;
}

export interface CropScanAnalysis {
  summary: string;
  symptoms: string[];
  recommendedActions: string[];
  prevention: string[];
  pesticideNote?: string;
}

export interface VerificationDetail {
  isVerified: boolean;
  accuracyPercentage: number;
  confidencePercentage: number;
  reliabilityLevel: string;
  referenceSource: string;
  referenceProtocol: string;
  datasetAttribution: string;
  scientificCitation: string;
}

export interface ScanResponseData {
  scanId?: string;
  status: 'valid' | 'success' | 'uncertain' | 'invalid' | 'invalid_image' | 'unsupported_crop' | 'server_error';
  message: string;
  timestamp?: string;
  imageUrl?: string;

  // Structured diagnosis
  crop?: {
    name: string;
    confidence: number;
  };
  diagnosis?: {
    condition: string;
    type: string;
    healthStatus: string;
    confidence: number;
    severity: string;
  };
  topPredictions?: PredictionCandidate[];
  analysis?: CropScanAnalysis;
  metadata?: {
    model: string;
    modelVersion: string;
    datasetSources: string[];
  };
  verification?: VerificationDetail;

  // Backward-compatibility fields
  validation?: {
    passed: boolean;
    errors: string[];
    warnings: string[];
  };
  crop_analysis?: {
    is_relevant: boolean;
    confidence: number;
    detected_category: string;
    label: string;
    rejection_reason?: string;
    crop_identification?: {
      crop_name: string;
      confidence: number;
      is_identified: boolean;
      message?: string;
    };
  };
  disease_detection?: {
    crop: string;
    disease: string;
    confidence: number;
    severity: string;
    status: string;
    explanation?: string;
    symptoms: string[];
    recommended_actions: string[];
    prevention: string[];
    expert_verification_required?: boolean;
    abstain_reason?: string;
  };
  severity?: string;
}

export interface ScanHistoryItem {
  id: string;
  farmerId?: string;
  crop: string;
  cropName?: string;
  condition: string;
  disease?: string;
  conditionType?: string;
  cropConfidence: number;
  diseaseConfidence: number;
  confidence: number;
  severity: string;
  status: string;
  healthStatus?: string;
  imagePath?: string;
  previewUrl?: string;
  imageUrl?: string;
  diagnosisSummary?: string;
  description?: string;
  symptoms: string[];
  recommendedActions: string[];
  recommended_actions?: string[];
  prevention: string[];
  modelName?: string;
  modelVersion?: string;
  dataSource?: string;
  verification?: VerificationDetail;
  referenceSource?: string;
  accuracyPercentage?: number;
  createdAt: string;
  scannedAt?: string;
  date?: string | number;
}

export interface BackendHealth {
  status: string;
  modelLoaded: boolean;
  modelVersion: string;
  database: string;
  supportedCrops?: string[];
}

/**
 * Check backend connectivity & ML model status.
 */
export async function checkBackendHealth(): Promise<BackendHealth | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('/api/health', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('[CropGuard API] Health check failed:', err);
    return null;
  }
}

/**
 * Upload an image for full crop identification and disease diagnosis.
 */
export async function scanCropImage(
  file: File,
  options?: {
    latitude?: number | null;
    longitude?: number | null;
    farmerName?: string;
    farmerId?: string;
    crop?: string;
  }
): Promise<ScanResponseData> {
  const form = new FormData();
  form.append('file', file);
  if (options?.crop) form.append('crop', options.crop);
  if (options?.farmerName) form.append('farmer_name', options.farmerName);
  if (options?.farmerId) form.append('farmer_id', options.farmerId);
  if (options?.latitude != null && options?.longitude != null) {
    form.append('latitude', options.latitude.toString());
    form.append('longitude', options.longitude.toString());
    form.append('location', `Lat: ${options.latitude.toFixed(4)}, Lng: ${options.longitude.toFixed(4)}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s max for neural inference

  try {
    const res = await fetch('/api/scan', {
      method: 'POST',
      body: form,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      let errText = `Server responded with status ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson.message) errText = errJson.message;
        else if (errJson.detail) {
          errText = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
        }
      } catch (_) {}
      const httpErr = new Error(errText);
      (httpErr as any).status = res.status;
      (httpErr as any).isHttpError = true;
      throw httpErr;
    }

    try {
      return await res.json();
    } catch (_) {
      const parseErr = new Error('Backend returned an invalid non-JSON response.');
      (parseErr as any).isInvalidResponse = true;
      throw parseErr;
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const abortErr = new Error('Analysis timed out. Please check your network connection and try again.');
      (abortErr as any).isTimeout = true;
      throw abortErr;
    }
    if (
      err.name === 'TypeError' ||
      (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')))
    ) {
      const connErr = new Error(
        'Backend AI service is unavailable. No disease diagnosis was produced. Start the backend service and try again.'
      );
      (connErr as any).isConnectionError = true;
      throw connErr;
    }
    throw err;
  }
}

/**
 * Fetch persistent scan history from backend (ordered newest first).
 */
export async function getScanHistory(farmerId?: string): Promise<ScanHistoryItem[]> {
  try {
    const url = farmerId
      ? `/api/scans/history?farmer_id=${encodeURIComponent(farmerId)}`
      : '/api/scans/history';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`History fetch failed with status ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[CropGuard API] Failed to fetch remote scan history, falling back to local storage:', err);
    try {
      const stored = localStorage.getItem('cropguard_history');
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return [];
  }
}

/**
 * Fetch a single scan record with full details by ID.
 */
export async function getScanById(scanId: string): Promise<ScanHistoryItem | null> {
  try {
    const res = await fetch(`/api/scans/history/${encodeURIComponent(scanId)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn(`[CropGuard API] Failed to fetch scan details for ${scanId}:`, err);
    return null;
  }
}

/**
 * Delete a scan record by ID.
 */
export async function deleteScan(scanId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/scans/history/${encodeURIComponent(scanId)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn(`[CropGuard API] Failed to delete scan ${scanId}:`, err);
    return false;
  }
}
