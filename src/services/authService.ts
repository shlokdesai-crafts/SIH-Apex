/**
 * Auth Service
 * 
 * MongoDB Atlas-backed authentication with JWT/HMAC token persistence.
 * Connects to /api/auth/signup, /api/auth/login, /api/auth/me, /api/auth/profile.
 */

import type { Language } from '../i18n/translations';

// ─── Types ───────────────────────────────────────────────────

export interface User {
  id: string;
  fullName: string;
  phone: string;
  passwordHash?: string;
  location: string;
  language: Language;
  role?: string;
  email?: string | null;
  district?: string;
  createdAt: string;
}

export interface UserPublic {
  id: string;
  fullName: string;
  phone: string;
  location: string;
  language: Language;
  role?: string;
  email?: string | null;
  district?: string;
  createdAt: string;
}

export interface SignupData {
  fullName: string;
  phone: string;
  password: string;
  location: string;
  language: Language;
  role?: string;
  email?: string | null;
  district?: string;
}

export interface AuthResult {
  success: boolean;
  user?: UserPublic;
  token?: string;
  error?: string;
}

// ─── Storage Keys ────────────────────────────────────────────

const SESSION_KEY = 'cropguard_session';
const TOKEN_KEY = 'cropguard_auth_token';

// ─── Token & Header Helpers ─────────────────────────────────

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (err) {
    console.error('Failed to store auth token:', err);
  }
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ─── Session Helpers ─────────────────────────────────────────

export function getCurrentUser(): UserPublic | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null && getAuthToken() !== null;
}

// ─── Validation ──────────────────────────────────────────────

export function validatePhone(phone: string): string | null {
  const cleaned = phone.replace(/\s|-/g, '');
  if (!/^\d{10}$/.test(cleaned)) {
    return 'Phone number must be exactly 10 digits';
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 4) {
    return 'Password must be at least 4 characters';
  }
  return null;
}

export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return 'weak';
  if (score <= 3) return 'medium';
  return 'strong';
}

// ─── Government Officer PostgreSQL Sync ──────────────────────

export interface GovSyncData {
  userId: string;
  name: string;
  phone: string;
  location?: string;
  district?: string;
}

export async function syncGovernmentOfficer(data: GovSyncData): Promise<void> {
  try {
    let res: Response;
    try {
      res = await fetch('/api/officer/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {
      res = await fetch('http://localhost:5000/api/officer/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }

    if (!res.ok) {
      console.warn(`Officer sync returned status ${res.status}`);
    }
  } catch (err) {
    console.warn('Network error syncing government officer to PostgreSQL:', err);
  }
}

// ─── Real MongoDB Auth Operations ────────────────────────────

export async function signup(data: SignupData): Promise<AuthResult> {
  const phoneError = validatePhone(data.phone);
  if (phoneError) return { success: false, error: phoneError };

  const passwordError = validatePassword(data.password);
  if (passwordError) return { success: false, error: passwordError };

  if (!data.fullName.trim()) {
    return { success: false, error: 'Full name is required' };
  }

  if (!data.location.trim()) {
    return { success: false, error: 'Location is required' };
  }

  const cleanedPhone = data.phone.replace(/\s|-/g, '');

  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: cleanedPhone,
        password: data.password,
        fullName: data.fullName.trim(),
        location: data.location.trim(),
        language: data.language || 'en',
        role: data.role || 'Farmer',
        email: data.email || null,
        district: data.district || null,
      }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.detail || json.message || 'Registration failed' };
    }

    const user: UserPublic = json.user;
    const token: string = json.token;

    setAuthToken(token);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));

    // If registering as Government Officer, sync record
    if (user.role?.toLowerCase() === 'government') {
      syncGovernmentOfficer({
        userId: user.id,
        name: user.fullName,
        phone: user.phone,
        location: user.location,
        district: user.district,
      }).catch((e) => console.warn('Background sync error on signup:', e));
    }

    return { success: true, user, token };
  } catch (err: any) {
    console.error('Signup network error:', err);
    return { success: false, error: 'Network error connecting to CropGuard server.' };
  }
}

export async function login(phone: string, password: string, role: string): Promise<AuthResult> {
  const phoneError = validatePhone(phone);
  if (phoneError) return { success: false, error: phoneError };

  const cleanedPhone = phone.replace(/\s|-/g, '');

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: cleanedPhone,
        password,
        role: role || 'Farmer',
      }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.detail || json.message || 'Invalid phone or password' };
    }

    const user: UserPublic = json.user;
    const token: string = json.token;

    setAuthToken(token);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));

    if (user.role?.toLowerCase() === 'government') {
      syncGovernmentOfficer({
        userId: user.id,
        name: user.fullName,
        phone: user.phone,
        location: user.location,
        district: user.district,
      }).catch((e) => console.warn('Background sync error on login:', e));
    }

    return { success: true, user, token };
  } catch (err: any) {
    console.error('Login network error:', err);
    return { success: false, error: 'Network error connecting to CropGuard server.' };
  }
}

export async function fetchCurrentProfile(): Promise<UserPublic | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      if (res.status === 401) {
        logout();
      }
      return null;
    }
    const json = await res.json();
    if (json.success && json.user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(json.user));
      return json.user;
    }
    return null;
  } catch (err) {
    console.error('Failed to fetch profile from MongoDB:', err);
    return getCurrentUser();
  }
}

export function updateStoredUser(updates: Partial<UserPublic>): UserPublic | null {
  const current = getCurrentUser();
  const token = getAuthToken();

  const updatedLocal: UserPublic = { ...(current || ({} as UserPublic)), ...updates };
  localStorage.setItem(SESSION_KEY, JSON.stringify(updatedLocal));

  if (token) {
    fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fullName: updates.fullName,
        location: updates.location,
        district: updates.district,
        language: updates.language,
        email: updates.email,
      }),
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
      })
      .then((json) => {
        if (json?.success && json?.user) {
          localStorage.setItem(SESSION_KEY, JSON.stringify(json.user));
        }
      })
      .catch((err) => console.warn('Could not update profile on backend:', err));
  }

  return updatedLocal;
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TOKEN_KEY);
}
