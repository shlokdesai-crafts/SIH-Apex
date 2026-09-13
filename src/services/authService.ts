/**
 * Auth Service
 * 
 * localStorage-based authentication for demo/SIH purposes.
 * Architecture is designed so you can swap in a real backend
 * (Firebase, Express, etc.) by changing only this file.
 */

import type { Language } from '../i18n/translations';

// ─── Types ───────────────────────────────────────────────────

export interface User {
  id: string;
  fullName: string;
  phone: string;
  passwordHash: string;
  location: string;
  language: Language;
  role?: string;
  createdAt: string;
}

export interface UserPublic {
  id: string;
  fullName: string;
  phone: string;
  location: string;
  language: Language;
  role?: string;
  createdAt: string;
}

export interface SignupData {
  fullName: string;
  phone: string;
  password: string;
  location: string;
  language: Language;
  role?: string;
}

export interface AuthResult {
  success: boolean;
  user?: UserPublic;
  error?: string;
}

// ─── Storage Keys ────────────────────────────────────────────

const USERS_KEY = 'cropguard_users';
const SESSION_KEY = 'cropguard_session';

// ─── Helpers ─────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getStoredUsers(): User[] {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function toPublicUser(user: User): UserPublic {
  return {
    id: user.id,
    fullName: user.fullName,
    phone: user.phone,
    location: user.location,
    language: user.language,
    role: user.role,
    createdAt: user.createdAt,
  };
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
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
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

// ─── Auth Operations ─────────────────────────────────────────

export async function signup(data: SignupData): Promise<AuthResult> {
  // Validate
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

  // Check for duplicate phone
  const users = getStoredUsers();
  const cleanedPhone = data.phone.replace(/\s|-/g, '');
  if (users.some(u => u.phone === cleanedPhone)) {
    return { success: false, error: 'An account with this phone number already exists' };
  }

  // Create user
  const user: User = {
    id: generateId(),
    fullName: data.fullName.trim(),
    phone: cleanedPhone,
    passwordHash: await hashPassword(data.password),
    location: data.location.trim(),
    language: data.language,
    role: data.role || 'farmer',
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  saveUsers(users);

  // Create session
  const publicUser = toPublicUser(user);
  localStorage.setItem(SESSION_KEY, JSON.stringify(publicUser));

  // If registering as Government Officer, sync record to PostgreSQL
  if (user.role === 'government') {
    await syncGovernmentOfficer({
      userId: user.id,
      name: user.fullName,
      phone: user.phone,
      location: user.location,
    });
  }

  return { success: true, user: publicUser };
}

export async function login(phone: string, password: string, role: string): Promise<AuthResult> {
  const phoneError = validatePhone(phone);
  if (phoneError) return { success: false, error: phoneError };

  const users = getStoredUsers();
  const cleanedPhone = phone.replace(/\s|-/g, '');
  const user = users.find(u => u.phone === cleanedPhone);

  if (!user) {
    return { success: false, error: 'No account found with this phone number' };
  }

  // Ensure role matches, defaulting to 'farmer' if role is undefined in legacy accounts
  const userRole = user.role || 'farmer';
  if (userRole !== role) {
    return { success: false, error: `Account exists but is not registered as a ${role}` };
  }

  const inputHash = await hashPassword(password);
  if (inputHash !== user.passwordHash) {
    return { success: false, error: 'Incorrect password' };
  }

  // Create session
  const publicUser = toPublicUser(user);
  localStorage.setItem(SESSION_KEY, JSON.stringify(publicUser));

  // If logging in as Government Officer, ensure record is synced in PostgreSQL
  if (userRole === 'government') {
    syncGovernmentOfficer({
      userId: user.id,
      name: user.fullName,
      phone: user.phone,
      location: user.location,
    }).catch((e) => console.warn('Background sync error on login:', e));
  }

  return { success: true, user: publicUser };
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser(): UserPublic | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}
