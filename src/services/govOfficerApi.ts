/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Government Officer Settings API Client Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles all PostgreSQL-backed API communications for Government Officer
 * settings, profile updates, notifications, and jurisdiction mappings.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── TypeScript Interfaces ──
export interface GovOfficerProfile {
  name: string;
  designation: string;
  department: string;
  stateDepartment: string;
  employeeId: string;
  email: string | null;
  district: string;
  phone: string;
  avatarInitials?: string;
}

export interface GovOfficerJurisdiction {
  assignedState: string;
  stateCode: string;
  administrativeDivision: string;
  agroClimaticZone: string;
  assignedDistrict: string;
  districtHq: string;
  jurisdictionCode: string;
  coveredTalukas: string;
  agriculturalCircles: string;
  reportingAuthority: string;
  regionalDirectorate: string;
}

export interface GovOfficerNotifications {
  highRiskOutbreaks: boolean;
  farmerSubmissions: boolean;
  weeklySurveillance: boolean;
  urgentFieldVisits: boolean;
  stateCirculars: boolean;
  appSoundAlerts?: boolean;
}

export interface GovOfficerAiPreferences {
  autoPreFilter: boolean;
  gradCamHeatmap: boolean;
  icarRemedies: boolean;
  confidenceThreshold: number;
  languageMarathi: boolean;
  invasiveAnomalyFlagging: boolean;
}

export interface GovOfficerSecurity {
  twoFactorAuth: string;
  twoFactorMethod: string;
  accessClearanceLevel: string;
  accessScope: string;
  farmerDataScope: string;
  farmerDataScopeDesc: string;
  lastPasswordChange: string;
  passwordPolicy: string;
  activeWorkstationSession: string;
  sessionSecurity: string;
  dataRetentionCompliance: string;
  retentionDescription: string;
}

export interface GovOfficerSettingsData {
  profile: GovOfficerProfile;
  jurisdiction: GovOfficerJurisdiction;
  notifications: GovOfficerNotifications;
  aiPreferences: GovOfficerAiPreferences;
  security: GovOfficerSecurity;
  metadata?: {
    lastUpdated?: string;
    version?: string;
    databaseConnected?: boolean;
    storageEngine?: string;
  };
}

// ── API Configuration ──
const API_BASE = '/api/officer';
const API_FALLBACK = 'http://localhost:5000/api/officer';

/**
 * Universal API helper with Vite proxy, localhost fallback, and triple-channel userId propagation
 */
export async function officerApiCall<T>(
  path: string,
  options: RequestInit = {},
  userId?: string
): Promise<T> {
  const finalPath = userId
    ? `${path}${path.includes('?') ? '&' : '?'}userId=${encodeURIComponent(userId)}`
    : path;

  let body = options.body;
  if (userId && body && typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      if (parsed && typeof parsed === 'object' && !parsed.userId) {
        parsed.userId = userId;
        body = JSON.stringify(parsed);
      }
    } catch {
      // not JSON, keep original body
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(userId ? { 'x-user-id': userId } : {}),
    ...(options.headers || {}),
  };

  const reqOptions: RequestInit = {
    ...options,
    body,
    headers,
  };

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${finalPath}`, reqOptions);
  } catch {
    res = await fetch(`${API_FALLBACK}${finalPath}`, reqOptions);
  }

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(errorText || `API call to ${path} failed with status ${res.status}`);
  }

  const json = await res.json();
  return (json.data !== undefined ? json.data : json) as T;
}

// ── Dedicated API Client Functions ──

export async function fetchOfficerSettings(userId?: string): Promise<GovOfficerSettingsData> {
  return officerApiCall<GovOfficerSettingsData>('/settings', {}, userId);
}

export async function patchOfficerProfile(
  updates: Partial<GovOfficerProfile>,
  userId?: string
): Promise<GovOfficerProfile> {
  return officerApiCall<GovOfficerProfile>(
    '/profile',
    {
      method: 'PATCH',
      body: JSON.stringify(updates),
    },
    userId
  );
}

export async function patchOfficerNotifications(
  updates: Partial<GovOfficerNotifications>,
  userId?: string
): Promise<GovOfficerNotifications> {
  return officerApiCall<GovOfficerNotifications>(
    '/notifications',
    {
      method: 'PATCH',
      body: JSON.stringify(updates),
    },
    userId
  );
}

export async function patchOfficerAiPreferences(
  updates: Partial<GovOfficerAiPreferences>,
  userId?: string
): Promise<GovOfficerAiPreferences> {
  return officerApiCall<GovOfficerAiPreferences>(
    '/ai-preferences',
    {
      method: 'PATCH',
      body: JSON.stringify(updates),
    },
    userId
  );
}

export async function patchOfficerSettings(
  updates: Partial<GovOfficerSettingsData>,
  userId?: string
): Promise<GovOfficerSettingsData> {
  return officerApiCall<GovOfficerSettingsData>(
    '/settings',
    {
      method: 'PATCH',
      body: JSON.stringify(updates),
    },
    userId
  );
}

export async function resetOfficerSettings(userId?: string): Promise<GovOfficerSettingsData> {
  return officerApiCall<GovOfficerSettingsData>(
    '/settings/reset',
    {
      method: 'POST',
    },
    userId
  );
}

/**
 * Safely read active user session from localStorage synchronously on mount
 */
export function getStoredUser(): { id?: string; fullName?: string; location?: string; phone?: string } | null {
  try {
    const session = typeof window !== 'undefined' ? localStorage.getItem('cropguard_session') : null;
    return session ? JSON.parse(session) : null;
  } catch {
    return null;
  }
}

/**
 * Map Maharashtra district to its official Administrative Division
 */
export function getAdministrativeDivision(rawDistrict?: string): string {
  if (!rawDistrict) return 'Amravati Division';

  const d = rawDistrict.toLowerCase().replace(/district/gi, '').trim();

  // Mumbai Division (per explicit specification: Mumbai City / Mumbai Suburban -> Mumbai Division)
  if (d.includes('mumbai')) {
    return 'Mumbai Division';
  }

  // Konkan Division (Thane, Palghar, Raigad, Ratnagiri, Sindhudurg)
  if (
    d.includes('thane') ||
    d.includes('palghar') ||
    d.includes('raigad') ||
    d.includes('ratnagiri') ||
    d.includes('sindhudurg')
  ) {
    return 'Konkan Division';
  }

  // Pune Division (Western Maharashtra: Pune, Kolhapur, Satara, Sangli, Solapur)
  if (
    d.includes('pune') ||
    d.includes('kolhapur') ||
    d.includes('satara') ||
    d.includes('sangli') ||
    d.includes('solapur')
  ) {
    return 'Pune Division';
  }

  // Nashik Division (North Maharashtra: Nashik, Dhule, Jalgaon, Nandurbar, Ahmednagar)
  if (
    d.includes('nashik') ||
    d.includes('nasik') ||
    d.includes('dhule') ||
    d.includes('jalgaon') ||
    d.includes('nandurbar') ||
    d.includes('ahmednagar') ||
    d.includes('ahilyanagar')
  ) {
    return 'Nashik Division';
  }

  // Amravati Division (Western Vidarbha: Yavatmal, Amravati, Akola, Buldhana, Washim)
  if (
    d.includes('yavatmal') ||
    d.includes('amravati') ||
    d.includes('akola') ||
    d.includes('buldhana') ||
    d.includes('washim')
  ) {
    return 'Amravati Division';
  }

  // Nagpur Division (Eastern Vidarbha: Nagpur, Wardha, Bhandara, Gondia, Chandrapur, Gadchiroli)
  if (
    d.includes('nagpur') ||
    d.includes('wardha') ||
    d.includes('bhandara') ||
    d.includes('gondia') ||
    d.includes('chandrapur') ||
    d.includes('gadchiroli')
  ) {
    return 'Nagpur Division';
  }

  // Chhatrapati Sambhajinagar (Aurangabad) Division (Marathwada)
  if (
    d.includes('sambhajinagar') ||
    d.includes('aurangabad') ||
    d.includes('jalna') ||
    d.includes('beed') ||
    d.includes('parbhani') ||
    d.includes('nanded') ||
    d.includes('osmanabad') ||
    d.includes('dharashiv') ||
    d.includes('latur') ||
    d.includes('hingoli')
  ) {
    return 'Chhatrapati Sambhajinagar Division';
  }

  // Fallback: capitalized district + " Division"
  const cleaned = rawDistrict.replace(/district/gi, '').trim();
  if (cleaned.length > 0) {
    return `${cleaned.charAt(0).toUpperCase() + cleaned.slice(1)} Division`;
  }
  return 'Amravati Division';
}

/**
 * Map district/division to its Agro-Climatic Zone
 */
export function getAgroClimaticZone(rawDistrict?: string): string {
  const division = getAdministrativeDivision(rawDistrict);
  switch (division) {
    case 'Mumbai Division':
    case 'Konkan Division':
      return 'South Konkan Coastal Zone';
    case 'Pune Division':
      return 'Western Maharashtra Ghat Zone';
    case 'Nashik Division':
      return 'North Maharashtra Scarcity Zone';
    case 'Amravati Division':
      return 'Vidarbha Agro-Climatic Zone';
    case 'Nagpur Division':
      return 'Central Vidarbha Zone';
    case 'Chhatrapati Sambhajinagar Division':
      return 'Marathwada Agro-Climatic Zone';
    default:
      return 'Vidarbha Agro-Climatic Zone';
  }
}
