import type { PropertyListing, GenderPolicy, AccommodationType } from '../types';

/**
 * Calculates distance between two coordinates in kilometers using Haversine formula
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Deterministic Pseudo-Random Number Generator based on seed
function createSeededRandom(seed: number) {
  let s = Math.abs(seed);
  if (s === 0) s = 123456789;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const PG_NAMES_PREFIX = [
  'Zolo Starlight',
  'Stanza Living',
  'PG Raja',
  'Surya Niwas',
  'Bharat PG',
  'Green Valley',
  'Shanti Niketan',
  'KIET Boys Residency',
  'Lotus Garden',
  'Aashiyana',
  'Urban Terrace',
  'Harmony Haven'
];

const PG_NAMES_SUFFIX = [
  'Student PG',
  'Co-Living Rooms',
  'Student Residence',
  'Flatshare',
  'Boys Hostel',
  'Girls PG',
  'Living Space'
];

const PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'
];

const ALL_AMENITIES = [
  'High-Speed Wi-Fi',
  'Air Conditioning',
  'Power Backup',
  'RO Purified Water',
  '3 Times Meals Included',
  'Daily Housekeeping',
  'CCTV Security & Biometrics',
  'Washing Machine / Laundry',
  'Attached Washroom',
  'Study Desk & Ergonomic Chair',
  'Fridge',
  'Gym Access',
  '24/7 Hot Water (Geyser)',
  'Balcony'
];

const RULES_POOL = [
  'Gate entry closing: 10:30 PM (extension with parent notice)',
  'Visitors allowed in common lobby between 10 AM - 7 PM',
  'Strict quiet study hours from 11 PM to 7 AM',
  'No smoking or alcohol on premises',
  'Maintain hygiene in shared dining and pantry zones',
  'Advance notice of 30 days before vacating'
];

const OWNER_NAMES = [
  'Rajesh Kumar (Owner)',
  'Sandeep Verma (Property Manager)',
  'Meenakshi Gupta (Warden/Host)',
  'Vikramjeet Singh (Caregiver)',
  'Anuradha Sharma (Owner)'
];

/**
 * Deterministically generates realistic KIET-area PG and flat listings spread around lat/lng.
 */
export function generateDemoListings(
  centerLat: number,
  centerLng: number,
  radiusKm: number = 8
): PropertyListing[] {
  // Generate deterministic integer seed from coordinates (down to 3 decimal places)
  const seed = Math.floor(Math.abs(centerLat * 1000 + centerLng * 1000));
  const rng = createSeededRandom(seed);

  const count = 16; // Generate 16 realistic listings around this location
  const listings: PropertyListing[] = [];

  for (let i = 0; i < count; i++) {
    // Generate deterministic angle and distance offset within radius
    const angle = rng() * Math.PI * 2;
    // Distribute with natural clustering closer to center
    const distFactor = Math.pow(rng(), 0.8);
    const dist = Math.max(0.4, distFactor * radiusKm);

    // Approximate delta in lat/lng (1 deg lat ~ 111 km, 1 deg lon ~ 111 * cos(lat))
    const latOffset = (dist * Math.cos(angle)) / 111;
    const lngOffset = (dist * Math.sin(angle)) / (111 * Math.cos((centerLat * Math.PI) / 180));

    const listingLat = centerLat + latOffset;
    const listingLng = centerLng + lngOffset;
    const realDistKm = calculateHaversineDistance(centerLat, centerLng, listingLat, listingLng);

    const prefix = PG_NAMES_PREFIX[Math.floor(rng() * PG_NAMES_PREFIX.length)];
    const suffix = PG_NAMES_SUFFIX[Math.floor(rng() * PG_NAMES_SUFFIX.length)];
    const title = `${prefix} ${suffix}`;

    const types: AccommodationType[] = ['PG', 'PG', 'Flat', 'Studio', 'Private Room', 'Shared Room'];
    const propType = types[Math.floor(rng() * types.length)];

    const genderPolicies: GenderPolicy[] = [
      'Boys Only',
      'Girls Only',
      'Co-Living / Unisex',
      'Boys Only',
      'Girls Only'
    ];
    const genderPolicy = genderPolicies[Math.floor(rng() * genderPolicies.length)];

    const occupancies: ('Single' | 'Double' | 'Triple' | 'Entire Flat')[] = [
      'Single',
      'Double',
      'Double',
      'Triple',
      'Entire Flat'
    ];
    const occupancy = propType === 'Flat' ? 'Entire Flat' : occupancies[Math.floor(rng() * occupancies.length)];

    // Realistic rent calculation in INR
    let baseRent = 6500;
    if (occupancy === 'Single') baseRent = 10500;
    if (occupancy === 'Triple') baseRent = 5500;
    if (propType === 'Flat') baseRent = 18000;
    if (propType === 'Studio') baseRent = 13500;

    const rentRandomness = Math.floor(rng() * 7) * 500;
    const rent = baseRent + rentRandomness;
    const deposit = rent * (rng() > 0.5 ? 2 : 1);

    // Pick 5 to 9 amenities
    const shuffledAmenities = [...ALL_AMENITIES].sort(() => rng() - 0.5);
    const selectedAmenities = shuffledAmenities.slice(0, 5 + Math.floor(rng() * 5));

    // Images
    const imgIndex1 = Math.floor(rng() * PROPERTY_IMAGES.length);
    const imgIndex2 = (imgIndex1 + 1) % PROPERTY_IMAGES.length;
    const imgIndex3 = (imgIndex1 + 2) % PROPERTY_IMAGES.length;
    const images = [
      PROPERTY_IMAGES[imgIndex1],
      PROPERTY_IMAGES[imgIndex2],
      PROPERTY_IMAGES[imgIndex3]
    ];

    const rating = Math.round((4.0 + rng() * 0.9) * 10) / 10;
    const reviewCount = 8 + Math.floor(rng() * 45);

    const furnishedTypes: ('Fully Furnished' | 'Semi Furnished' | 'Unfurnished')[] = [
      'Fully Furnished',
      'Fully Furnished',
      'Semi Furnished'
    ];
    const furnished = furnishedTypes[Math.floor(rng() * furnishedTypes.length)];

    const ownerName = OWNER_NAMES[Math.floor(rng() * OWNER_NAMES.length)];
    const ownerPhone = `+91 98${Math.floor(10000000 + rng() * 89999999)}`;

    const descriptionsPool = [
      `Bright and airy ${occupancy.toLowerCase()} ${propType} just ${realDistKm} km from KIET campus gate. Peaceful residential lane with grocery stores and chai stalls right downstairs. Wi-Fi is fast and reliable.`,
      `Well-kept ${occupancy.toLowerCase()} ${propType} near KIET with cross-ventilation and quiet evening hours. Landlord stays on ground floor and handles maintenance quickly. Ideal for KIET students.`,
      `Comfortable ${occupancy.toLowerCase()} ${propType} close to KIET Group of Institutions with home-style food, power backup, and clean common washrooms. Room includes private wardrobe and study desk.`,
      `Modern ${occupancy.toLowerCase()} flatshare with a sunlit balcony and shared kitchen — popular with KIET final-year students. Friendly flatmates, clean chore rotation, and no random curfew rules.`
    ];
    const description = descriptionsPool[i % descriptionsPool.length];

    const streets = ['Block B, Lane 4, Near KIET Gate', 'Pocket 2, Muradnagar', 'Main Market Road, Ghaziabad', 'Sector 4, Govindpuram', 'Civil Lines, Near KIET'];
    const address = `${streets[i % streets.length]}, ${realDistKm} km from KIET`;

    listings.push({
      id: `prop-seed-${seed}-${i + 1}`,
      title,
      type: propType,
      rent,
      deposit,
      lat: Number(listingLat.toFixed(5)),
      lng: Number(listingLng.toFixed(5)),
      address,
      distanceKm: realDistKm,
      genderPolicy,
      occupancy,
      furnished,
      availableFrom: 'Immediately (Nov 2026)',
      rating,
      reviewCount,
      images,
      amenities: selectedAmenities,
      rules: RULES_POOL.slice(0, 4),
      ownerName,
      ownerPhone,
      ownerType: rng() > 0.4 ? 'Owner' : 'Property Manager',
      isVerifiedDemo: true,
      electricityCharges: rng() > 0.5 ? '₹9/unit on sub-meter' : 'Included in rent',
      foodIncluded: selectedAmenities.includes('3 Times Meals Included'),
      description
    });
  }

  // Sort by distance by default
  return listings.sort((a, b) => a.distanceKm - b.distanceKm);
}

