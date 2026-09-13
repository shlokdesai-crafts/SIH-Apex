export type CropStatus = 'Healthy' | 'At Risk' | 'Diseased';
export type FieldStatus = 'Healthy' | 'At Risk' | 'Diseased';
export type ActivityType = 'Crop Scan' | 'Field Visit' | 'Advisory' | 'Crop Record';
export type ActivityStatus = 'Diseased' | 'Healthy' | 'Completed' | 'Advisory' | 'Updated';
export type PriorityLevel = 'High' | 'Medium' | 'Low';

export interface FarmDetails {
  id: string;
  farmerId: string;
  name: string;
  location: string;
  totalAreaHa: number;
  farmType: string;
  lastUpdated: string;
}

export interface FarmCrop {
  id: string;
  name: string;
  icon: string;
  image: string;
  status: CropStatus;
  healthScore: number;
  areaHa: number;
  expectedYieldQtHa: number;
  lastScanDate: string;
  detectedDisease?: string;
  severity?: string;
}

export interface FarmField {
  id: string;
  name: string;
  crop: string;
  areaHa: number;
  healthScore: number;
  status: FieldStatus;
  lastScanDate: string;
  detectedDisease?: string;
}

export interface CropScanRecord {
  id: string;
  farmerId: string;
  fieldId?: string;
  crop: string;
  disease: string;
  confidence: number;
  severity: string;
  scannedAt: string;
  recommendations: string[];
  previewUrl?: string | null;
  status: CropStatus;
}

export interface FarmActivity {
  id: string;
  date: string;
  activity: ActivityType;
  crop: string;
  details: string;
  status: ActivityStatus;
  timestamp: number;
}

export interface PriorityAction {
  id: string;
  crop: string;
  title: string;
  subtitle: string;
  priority: PriorityLevel;
  action: string;
  fieldId?: string;
  thumbnail?: string;
}

export interface FarmInsight {
  id: string;
  title: string;
  subtitle: string;
  source: string;
  iconType: 'leaf' | 'alert' | 'chart';
}

export interface FarmState {
  farmerId: string;
  farmDetails: FarmDetails;
  crops: FarmCrop[];
  fields: FarmField[];
  scans: CropScanRecord[];
  activities: FarmActivity[];
  priorityActions: PriorityAction[];
  farmInsights: FarmInsight[];
  overallHealthScore: number;
  lastUpdated: string;
}
