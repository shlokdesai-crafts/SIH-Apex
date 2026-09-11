/**
 * Location Service
 * 
 * Uses the browser Geolocation API to get coordinates,
 * then calls LocationIQ reverse geocoding to get a human-readable address.
 */

// No token required for Nominatim free tier

export interface LocationResult {
  lat: number;
  lng: number;
  district: string;
  state: string;
  fullAddress: string;
}

export interface LocationError {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'API_ERROR';
  message: string;
}

/**
 * Get the user's current position via the browser Geolocation API.
 */
export function getBrowserPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({ code: 'POSITION_UNAVAILABLE', message: 'Geolocation is not supported by this browser' });
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, (error) => {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          reject({ code: 'PERMISSION_DENIED', message: 'Location permission was denied. Please allow location access.' });
          break;
        case error.POSITION_UNAVAILABLE:
          reject({ code: 'POSITION_UNAVAILABLE', message: 'Location information is unavailable.' });
          break;
        case error.TIMEOUT:
          reject({ code: 'TIMEOUT', message: 'Location request timed out.' });
          break;
        default:
          reject({ code: 'POSITION_UNAVAILABLE', message: 'An unknown error occurred.' });
      }
    }, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000, // Cache for 5 minutes
    });
  });
}

/**
 * Reverse geocode coordinates using Nominatim API (Free).
 */
export async function reverseGeocode(lat: number, lng: number): Promise<LocationResult> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json'
    }
  });
  if (!response.ok) {
    throw { code: 'API_ERROR', message: `Reverse Geocoding API error: ${response.status}` } as LocationError;
  }

  const data = await response.json();
  const address = data.address || {};

  const district = address.county || address.city || address.town || address.village || '';
  const state = address.state || '';
  const parts: string[] = [];
  
  if (address.village || address.town) parts.push(address.village || address.town);
  if (address.county || address.city) parts.push(address.county || address.city);
  if (address.state_district) parts.push(address.state_district);
  if (state) parts.push(state);

  const fullAddress = parts.length > 0 ? parts.join(', ') : data.display_name || `${lat}, ${lng}`;

  return {
    lat,
    lng,
    district,
    state,
    fullAddress,
  };
}

/**
 * Detect the user's location: GPS → reverse geocode → human-readable address.
 */
export async function detectLocation(): Promise<LocationResult> {
  const position = await getBrowserPosition();
  const { latitude, longitude } = position.coords;
  return reverseGeocode(latitude, longitude);
}
