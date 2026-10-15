import type { LocationCoordinates } from '../types';

export const CURATED_INDIAN_HUBS: LocationCoordinates[] = [
  {
    name: 'North Campus, Delhi University',
    lat: 28.6923,
    lng: 77.2117,
    city: 'New Delhi',
    displayName: 'University of Delhi North Campus, Vishwavidyalaya, Delhi'
  },
  {
    name: 'Koramangala, Bengaluru',
    lat: 12.9352,
    lng: 77.6245,
    city: 'Bengaluru, Karnataka',
    displayName: 'Koramangala 4th Block, Bengaluru, Karnataka'
  },
  {
    name: 'Sector 62, Noida',
    lat: 28.6258,
    lng: 77.3653,
    city: 'Noida, Uttar Pradesh',
    displayName: 'Sector 62, Institutional Area, Noida, Delhi-NCR'
  },
  {
    name: 'Raj Nagar & Muradnagar',
    lat: 28.7531,
    lng: 77.4975,
    city: 'Ghaziabad, Uttar Pradesh',
    displayName: 'Raj Nagar & Muradnagar Student Corridor, Ghaziabad, Delhi-NCR'
  },
  {
    name: 'Knowledge Park, Greater Noida',
    lat: 28.4682,
    lng: 77.5029,
    city: 'Greater Noida, Uttar Pradesh',
    displayName: 'Knowledge Park III, Greater Noida, Gautam Buddha Nagar'
  },
  {
    name: 'North Campus, Delhi University',
    lat: 28.6923,
    lng: 77.2117,
    city: 'New Delhi',
    displayName: 'University of Delhi North Campus, Vishwavidyalaya, Delhi'
  },
  {
    name: 'Sector 62, Noida',
    lat: 28.6258,
    lng: 77.3653,
    city: 'Noida, Uttar Pradesh',
    displayName: 'Sector 62, Institutional Area, Noida, Delhi-NCR'
  },
  {
    name: 'Koramangala, Bengaluru',
    lat: 12.9352,
    lng: 77.6245,
    city: 'Bengaluru, Karnataka',
    displayName: 'Koramangala 4th Block, Bengaluru, Karnataka'
  },
  {
    name: 'HSR Layout, Bengaluru',
    lat: 12.9121,
    lng: 77.6446,
    city: 'Bengaluru, Karnataka',
    displayName: 'HSR Layout Sector 1, Bengaluru, Karnataka'
  },
  {
    name: 'Hinjewadi Phase 1, Pune',
    lat: 18.5913,
    lng: 73.7389,
    city: 'Pune, Maharashtra',
    displayName: 'Hinjewadi Infotech Park Phase 1, Pune, Maharashtra'
  },
  {
    name: 'Kothrud, Pune',
    lat: 18.5074,
    lng: 73.8077,
    city: 'Pune, Maharashtra',
    displayName: 'Kothrud, MIT College Road, Pune, Maharashtra'
  },
  {
    name: 'Powai, Mumbai',
    lat: 19.1176,
    lng: 72.9060,
    city: 'Mumbai, Maharashtra',
    displayName: 'Powai, Near IIT Bombay Main Gate, Mumbai, Maharashtra'
  },
  {
    name: 'Mathura Junction',
    lat: 27.4924,
    lng: 77.6737,
    city: 'Mathura, Uttar Pradesh',
    displayName: 'Mathura Cantonment / GLA University Corridor, Mathura, Uttar Pradesh'
  },
  {
    name: 'Gomti Nagar, Lucknow',
    lat: 26.8530,
    lng: 80.9983,
    city: 'Lucknow, Uttar Pradesh',
    displayName: 'Gomti Nagar Extension, Lucknow, Uttar Pradesh'
  },
  {
    name: 'Gachibowli, Hyderabad',
    lat: 17.4401,
    lng: 78.3489,
    city: 'Hyderabad, Telangana',
    displayName: 'Gachibowli Financial District, Hyderabad, Telangana'
  }
];

// Memory cache
const memoryCache = new Map<string, LocationCoordinates[]>();

// Rate limiting state: OSM Nominatim requires max 1 req per second
let lastRequestTime = 0;

async function throttleNominatim(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 1100) {
    const waitMs = 1100 - elapsed;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  lastRequestTime = Date.now();
}

/**
 * Searches locations using OpenStreetMap Nominatim with caching, throttling, and offline/error fallbacks.
 */
export async function searchLocations(query: string): Promise<LocationCoordinates[]> {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return [];

  // Check in-memory cache
  if (memoryCache.has(cleanQuery)) {
    return memoryCache.get(cleanQuery)!;
  }

  // Check localStorage cache
  try {
    const stored = localStorage.getItem(`osm_geo_${cleanQuery}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      memoryCache.set(cleanQuery, parsed);
      return parsed;
    }
  } catch {
    // Ignore localStorage parse errors
  }

  // Check matching in local curated hubs first for instant feedback
  const localMatches = CURATED_INDIAN_HUBS.filter(
    (hub) =>
      hub.name.toLowerCase().includes(cleanQuery) ||
      (hub.displayName && hub.displayName.toLowerCase().includes(cleanQuery)) ||
      (hub.city && hub.city.toLowerCase().includes(cleanQuery))
  );

  try {
    await throttleNominatim();

    // Call Nominatim API (with countrycodes=in for high relevance)
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=in&limit=5&q=${encodeURIComponent(
      query
    )}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'RoommateDotCom-App/1.0'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Nominatim returned status ${res.status}`);
    }

    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const formatted: LocationCoordinates[] = data.map((item: any) => ({
        name: item.name || item.display_name.split(',')[0],
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: item.display_name,
        city: item.address?.city || item.address?.state_district || item.address?.state || 'India'
      }));

      // Merge unique local matches
      const merged = [...formatted];
      for (const loc of localMatches) {
        if (!merged.some((m) => Math.abs(m.lat - loc.lat) < 0.05 && Math.abs(m.lng - loc.lng) < 0.05)) {
          merged.push(loc);
        }
      }

      // Cache result
      memoryCache.set(cleanQuery, merged);
      try {
        localStorage.setItem(`osm_geo_${cleanQuery}`, JSON.stringify(merged));
      } catch {
        // quota exceeded
      }

      return merged;
    }
  } catch (err) {
    console.warn('Nominatim network/rate-limit error. Falling back to curated database.', err);
  }

  // Fallback to local matches or curated hubs
  if (localMatches.length > 0) {
    return localMatches;
  }

  // Fuzzy filter on curated hubs
  const tokens = cleanQuery.split(' ');
  const fuzzy = CURATED_INDIAN_HUBS.filter((hub) =>
    tokens.some((token) => hub.name.toLowerCase().includes(token) || hub.displayName?.toLowerCase().includes(token))
  );

  return fuzzy.length > 0 ? fuzzy : [CURATED_INDIAN_HUBS[0]];
}

/**
 * Reverse geocodes coordinates to a human-readable location name
 */
export async function reverseGeocode(lat: number, lng: number): Promise<LocationCoordinates> {
  const cacheKey = `rev_${lat.toFixed(4)}_${lng.toFixed(4)}`;
  try {
    const stored = localStorage.getItem(cacheKey);
    if (stored) return JSON.parse(stored);
  } catch {}

  try {
    await throttleNominatim();
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'RoommateDotCom-App/1.0'
      }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const loc: LocationCoordinates = {
        name: data.name || data.address?.suburb || data.address?.city || 'My Location',
        lat,
        lng,
        displayName: data.display_name,
        city: data.address?.city || data.address?.town || data.address?.state || 'Nearby'
      };
      try {
        localStorage.setItem(cacheKey, JSON.stringify(loc));
      } catch {}
      return loc;
    }
  } catch (err) {
    console.warn('Reverse geocode failed, using coordinates fallback.', err);
  }

  return {
    name: 'Current Location',
    lat,
    lng,
    displayName: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
    city: 'Local Area'
  };
}

/**
 * Gets user's current GPS position via navigator.geolocation with graceful error messages
 */
export function getCurrentBrowserLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      (err) => {
        let msg = 'Could not access GPS location.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission was denied. You can select your campus from the search bar.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Location info is unavailable. Defaulting to Delhi NCR.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Location request timed out. Please try again.';
        }
        reject(new Error(msg));
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  });
}
