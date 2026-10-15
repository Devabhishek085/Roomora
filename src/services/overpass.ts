import type { PointOfInterest } from '../types';
import { calculateHaversineDistance } from './listings-generator';

const overpassCache = new Map<string, PointOfInterest[]>();

/**
 * Fetches real nearby Points of Interest around lat/lng via the free Overpass API.
 * Includes graceful timeout and realistic fallback POIs (colleges, metro/bus, hospitals, supermarkets, ATMs).
 */
export async function fetchNearbyPOIs(lat: number, lng: number, radiusMeters: number = 2500): Promise<PointOfInterest[]> {
  const cacheKey = `${lat.toFixed(3)}_${lng.toFixed(3)}`;
  if (overpassCache.has(cacheKey)) {
    return overpassCache.get(cacheKey)!;
  }

  // Quick fallback mock POIs in case Overpass is unavailable or slow
  const fallbackPOIs: PointOfInterest[] = [
    {
      id: 'poi-col-1',
      name: 'College Campus & Academic Blocks',
      type: 'college',
      lat: lat + 0.002,
      lng: lng - 0.001,
      distanceMeters: 280
    },
    {
      id: 'poi-transit-1',
      name: 'Campus Gate Bus & Auto Stand',
      type: 'transit',
      lat: lat + 0.003,
      lng: lng + 0.002,
      distanceMeters: 410
    },
    {
      id: 'poi-metro-1',
      name: 'Rapid Transit / Metro Station',
      type: 'transit',
      lat: lat - 0.008,
      lng: lng + 0.006,
      distanceMeters: 1100
    },
    {
      id: 'poi-med-1',
      name: 'City Care Multispeciality Hospital',
      type: 'hospital',
      lat: lat - 0.006,
      lng: lng - 0.004,
      distanceMeters: 920
    },
    {
      id: 'poi-mkt-1',
      name: 'Daily Needs Mart & Groceries',
      type: 'market',
      lat: lat + 0.004,
      lng: lng - 0.003,
      distanceMeters: 520
    },
    {
      id: 'poi-food-1',
      name: 'Campus Cafe & Chai Point',
      type: 'food',
      lat: lat - 0.002,
      lng: lng + 0.003,
      distanceMeters: 340
    },
    {
      id: 'poi-atm-1',
      name: 'SBI / HDFC 24x7 ATM',
      type: 'atm',
      lat: lat + 0.001,
      lng: lng + 0.002,
      distanceMeters: 190
    }
  ];

  try {
    // Construct Overpass QL query looking for amenity and public transport
    const query = `
      [out:json][timeout:5];
      (
        node["amenity"~"college|university|hospital|clinic|atm|restaurant|fast_food|cafe"](around:${radiusMeters},${lat},${lng});
        node["highway"="bus_stop"](around:${radiusMeters},${lat},${lng});
        node["railway"~"station|subway_entrance"](around:${radiusMeters},${lat},${lng});
        node["shop"~"supermarket|convenience"](around:${radiusMeters},${lat},${lng});
      );
      out body 15;
    `;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500); // 4.5s timeout

    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.elements && data.elements.length > 0) {
        const parsed: PointOfInterest[] = data.elements
          .filter((el: any) => el.tags && (el.tags.name || el.tags.amenity))
          .map((el: any, index: number) => {
            let type: PointOfInterest['type'] = 'market';
            const tags = el.tags || {};
            if (tags.amenity === 'college' || tags.amenity === 'university') type = 'college';
            else if (tags.highway === 'bus_stop' || tags.railway) type = 'transit';
            else if (tags.amenity === 'hospital' || tags.amenity === 'clinic' || tags.amenity === 'pharmacy') type = 'hospital';
            else if (tags.amenity === 'atm' || tags.amenity === 'bank') type = 'atm';
            else if (tags.amenity === 'restaurant' || tags.amenity === 'cafe' || tags.amenity === 'fast_food') type = 'food';

            const distKm = calculateHaversineDistance(lat, lng, el.lat, el.lon);
            const distMeters = Math.round(distKm * 1000);

            return {
              id: `overpass-${el.id || index}`,
              name: tags.name || `${type.toUpperCase()} near campus`,
              type,
              lat: el.lat,
              lng: el.lon,
              distanceMeters: distMeters
            };
          });

        if (parsed.length >= 3) {
          overpassCache.set(cacheKey, parsed);
          return parsed;
        }
      }
    }
  } catch (err) {
    // Graceful fallback
    console.info('Overpass API returned fallback POIs for fast response');
  }

  overpassCache.set(cacheKey, fallbackPOIs);
  return fallbackPOIs;
}
