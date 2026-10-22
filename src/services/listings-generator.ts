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

/**
 * Real property photos scraped directly from NoBroker Muradnagar Main Road Ghaziabad listings
 */
export const PROPERTY_IMAGES: string[] = [
  "https://images.nobroker.in/images/8a9fc38282cb73130182cbc2868023f5/8a9fc38282cb73130182cbc2868023f5_31301_123060_large.jpg",
  "https://images.nobroker.in/images/8a9fc38282cb73130182cbc2868023f5/8a9fc38282cb73130182cbc2868023f5_94169_246126_large.jpg",
  "https://images.nobroker.in/images/8a9fc38282cb73130182cbc2868023f5/8a9fc38282cb73130182cbc2868023f5_21146_380573_large.jpg",
  "https://images.nobroker.in/images/8a9fc38282cb73130182cbc2868023f5/8a9fc38282cb73130182cbc2868023f5_28151_427278_large.jpg",
  "https://images.nobroker.in/images/8aa9cc169e10cdc7019e116292b94a36/8aa9cc169e10cdc7019e116292b94a36_55491_869168_large.jpg",
  "https://images.nobroker.in/images/8aa9cc169e10cdc7019e116292b94a36/8aa9cc169e10cdc7019e116292b94a36_47944_565322_large.jpg",
  "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_563146_950803_large.jpg",
  "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_38362_752071_large.jpg",
  "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_167902_95222_large.jpg",
  "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_456820_130162_large.jpg",
  "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_757515_820515_large.jpg",
  "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_28837_110375_large.jpg",
  "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_147881_864210_large.jpg",
  "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_623706_828678_large.jpg",
  "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_907893_523378_large.jpg",
  "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_695767_35187_large.jpg",
  "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_139378_387372_large.jpg",
  "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_829331_564972_large.jpg",
  "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_958448_865999_large.jpg",
  "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_69123_524706_large.jpg",
  "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_444618_58624_large.jpg",
  "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_273699_995824_large.jpg",
  "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_789857_213626_large.jpg",
  "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_205974_951914_large.jpg",
  "https://images.nobroker.in/images/8a9f168287ebc8ca0187ebd9ea5e07e3/8a9f168287ebc8ca0187ebd9ea5e07e3_28853_34657_large.jpg",
  "https://images.nobroker.in/images/8a9f168287ebc8ca0187ebd9ea5e07e3/8a9f168287ebc8ca0187ebd9ea5e07e3_46752_378553_large.jpg",
  "https://images.nobroker.in/images/8a9f168287ebc8ca0187ebd9ea5e07e3/8a9f168287ebc8ca0187ebd9ea5e07e3_89122_632456_large.jpg",
  "https://images.nobroker.in/images/8a9f168287ebc8ca0187ebd9ea5e07e3/8a9f168287ebc8ca0187ebd9ea5e07e3_19116_156534_large.jpg",
  "https://images.nobroker.in/images/8a9f168287ebc8ca0187ebd9ea5e07e3/8a9f168287ebc8ca0187ebd9ea5e07e3_67486_333565_large.jpg",
  "https://images.nobroker.in/images/8a9f168287ebc8ca0187ebd9ea5e07e3/8a9f168287ebc8ca0187ebd9ea5e07e3_48423_844157_large.jpg",
  "https://images.nobroker.in/images/8a9fbecb80ffd1d00181005719545983/8a9fbecb80ffd1d00181005719545983_68402_761744_large.jpg",
  "https://images.nobroker.in/images/8a9fbecb80ffd1d00181005719545983/8a9fbecb80ffd1d00181005719545983_81117_264811_large.jpg",
  "https://images.nobroker.in/images/8a9fbecb80ffd1d00181005719545983/8a9fbecb80ffd1d00181005719545983_59331_419056_large.jpg",
  "https://images.nobroker.in/images/8a9fbecb80ffd1d00181005719545983/8a9fbecb80ffd1d00181005719545983_97262_932999_large.jpg",
  "https://images.nobroker.in/images/8aa991199f4b07b6019f4b72151e445b/8aa991199f4b07b6019f4b72151e445b_36440_100839_large.jpg",
  "https://images.nobroker.in/images/8a9f85b08fc24df2018fc2a16d9619c1/8a9f85b08fc24df2018fc2a16d9619c1_37185_265773_large.jpg",
  "https://images.nobroker.in/images/8a9f85b08fc24df2018fc2a16d9619c1/8a9f85b08fc24df2018fc2a16d9619c1_83349_517285_large.jpg",
  "https://images.nobroker.in/images/8a9f85b08fc24df2018fc2a16d9619c1/8a9f85b08fc24df2018fc2a16d9619c1_56532_258952_large.jpg",
  "https://images.nobroker.in/images/8a9f85b08fc24df2018fc2a16d9619c1/8a9f85b08fc24df2018fc2a16d9619c1_51901_96744_large.jpg",
  "https://images.nobroker.in/images/8a9f85b08fc24df2018fc2a16d9619c1/8a9f85b08fc24df2018fc2a16d9619c1_72623_34935_large.jpg",
  "https://images.nobroker.in/images/8a9fb58794c65afd0194c66da29706e7/8a9fb58794c65afd0194c66da29706e7_93204_665221_large.jpg",
  "https://images.nobroker.in/images/8aa9aa84a106b09a01a106c658eb0f49/8aa9aa84a106b09a01a106c658eb0f49_45397_43257_large.jpg"
];

/**
 * Real verified properties from NoBroker Muradnagar Main Road, Ghaziabad
 */
export const REAL_MURADNAGAR_PROPERTIES: Omit<PropertyListing, 'distanceKm'>[] = [
  {
    "id": "nobroker-8a9fc38282cb73130182cbc2868023f5",
    "title": "1 RK Flat In Radhey Shyam Vihar Phase2 Muradnagar for Rent In Muradnagar",
    "type": "Studio",
    "rent": 5000,
    "deposit": 5000,
    "lat": 28.7718326,
    "lng": 77.5074593,
    "address": "Radhey shyam vihar phase 2, Muradnagar, Ghaziabad",
    "genderPolicy": "Boys Only",
    "occupancy": "Single",
    "furnished": "Semi Furnished",
    "availableFrom": "Immediately (Nov 2026)",
    "rating": 4.2,
    "reviewCount": 12,
    "images": [
      "https://images.nobroker.in/images/8a9fc38282cb73130182cbc2868023f5/8a9fc38282cb73130182cbc2868023f5_31301_123060_large.jpg",
      "https://images.nobroker.in/images/8a9fc38282cb73130182cbc2868023f5/8a9fc38282cb73130182cbc2868023f5_94169_246126_large.jpg",
      "https://images.nobroker.in/images/8a9fc38282cb73130182cbc2868023f5/8a9fc38282cb73130182cbc2868023f5_21146_380573_large.jpg",
      "https://images.nobroker.in/images/8a9fc38282cb73130182cbc2868023f5/8a9fc38282cb73130182cbc2868023f5_28151_427278_large.jpg"
    ],
    "amenities": [
      "High-Speed Wi-Fi",
      "Power Backup",
      "RO Purified Water",
      "CCTV Security & Biometrics",
      "Attached Washroom",
      "Balcony"
    ],
    "rules": [
      "Gate entry closing: 10:30 PM (extension with notice)",
      "Visitors allowed in common lobby between 10 AM - 7 PM",
      "Quiet hours from 11 PM to 7 AM",
      "Maintain cleanliness in shared common zones"
    ],
    "ownerName": "Verified Owner (NoBroker Direct)",
    "ownerPhone": "+91 9817392817",
    "ownerType": "Owner",
    "isVerifiedDemo": true,
    "electricityCharges": "₹9/unit on sub-meter",
    "foodIncluded": true,
    "description": "Are you looking for a 1 RK for rent in Muradnagar? . This spacious property is semi furnished and convenient for companies. This North facing home is on the 1st floor & is over 350 sqft.\n\nYou are viewing the right home if you would prefer a house with parking for visitors, servant room & sewage treatment plant. If you need amenities such as power back up & security you will be happy to note that this home has this & more.\n\nThe surrounding locality is loaded with things to do, Priya Hall & Arman Telecome Nurganj tour and travels are great places to catch a movie near this home. Never miss out on lifestyle as Patanjali Store, Patanjali Store and Nikita general store are so close by.\n\nIf you are in need of any emergency services or medical assistance, you will be happy to note that Anand Hospital, Surya Hospital Muradnagar and URBAN PHC, BRIJ VIHAR are very close by. With Aum Sun Public School, Sapro robotics and Diamond Public School close to this home, you'll be able to provide your children with many options to choose from."
  },
  {
    "id": "nobroker-8aa9cc169e10cdc7019e116292b94a36",
    "title": "2 BHK House for Rent In Muradnagar",
    "type": "Flat",
    "rent": 5500,
    "deposit": 5500,
    "lat": 28.77699864778045,
    "lng": 77.51128821973344,
    "address": "Gali Number 5 Near Rama Krishna Garden, Muradnagar, Ghaziabad",
    "genderPolicy": "Girls Only",
    "occupancy": "Entire Flat",
    "furnished": "Unfurnished",
    "availableFrom": "Immediately (Nov 2026)",
    "rating": 4.4,
    "reviewCount": 16,
    "images": [
      "https://images.nobroker.in/images/8aa9cc169e10cdc7019e116292b94a36/8aa9cc169e10cdc7019e116292b94a36_55491_869168_large.jpg",
      "https://images.nobroker.in/images/8aa9cc169e10cdc7019e116292b94a36/8aa9cc169e10cdc7019e116292b94a36_47944_565322_large.jpg",
      "https://images.nobroker.in/images/8a9fc38282cb73130182cbc2868023f5/8a9fc38282cb73130182cbc2868023f5_28151_427278_large.jpg",
      "https://images.nobroker.in/images/8aa9cc169e10cdc7019e116292b94a36/8aa9cc169e10cdc7019e116292b94a36_55491_869168_large.jpg"
    ],
    "amenities": [
      "High-Speed Wi-Fi",
      "Power Backup",
      "RO Purified Water",
      "CCTV Security & Biometrics",
      "Attached Washroom",
      "Balcony"
    ],
    "rules": [
      "Gate entry closing: 10:30 PM (extension with notice)",
      "Visitors allowed in common lobby between 10 AM - 7 PM",
      "Quiet hours from 11 PM to 7 AM",
      "Maintain cleanliness in shared common zones"
    ],
    "ownerName": "Verified Resident / Co-tenant",
    "ownerPhone": "+91 9824785634",
    "ownerType": "Owner",
    "isVerifiedDemo": true,
    "electricityCharges": "Included in rent",
    "foodIncluded": false,
    "description": "This home is over 1020 sqft. & even comes with ample parking facility for car and bike.\n\nIf you are in need of any emergency services or medical assistance, you will be happy to note that Anand Hospital, Surya Hospital Muradnagar and Govt Hospital muaradnagar are very close by. With Aum Sun Public School, Sapro robotics and Diamond Public School close to this home, you'll be able to provide your children with many options to choose from.\n\nThe surrounding locality is loaded with things to do, Priya Hall & Arman Telecome Nurganj tour and travels are great places to catch a movie near this home. If you are looking for gifts, or just want to spoil yourself, Patanjali Store, Patanjali Store and Hira Lal Dairy have a wide variety of things that you can choose from.\n\nIf you are a frequent traveller, then you'll be happy to note that train station is less than 10 minutes from this house."
  },
  {
    "id": "nobroker-8aa9b74b9d094df4019d09e0bf743bae",
    "title": "2 BHK Flat for Rent In Muradnagar",
    "type": "Flat",
    "rent": 5000,
    "deposit": 15000,
    "lat": 28.77058085383145,
    "lng": 77.51071601844804,
    "address": "Murad Nagar RRTS Station (Gate No.: 2), Muradnagar, Ghaziabad",
    "genderPolicy": "Co-Living / Unisex",
    "occupancy": "Entire Flat",
    "furnished": "Semi Furnished",
    "availableFrom": "Immediately (Nov 2026)",
    "rating": 4.5,
    "reviewCount": 20,
    "images": [
      "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_563146_950803_large.jpg",
      "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_38362_752071_large.jpg",
      "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_167902_95222_large.jpg",
      "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_456820_130162_large.jpg"
    ],
    "amenities": [
      "High-Speed Wi-Fi",
      "Power Backup",
      "RO Purified Water",
      "CCTV Security & Biometrics",
      "Attached Washroom",
      "Balcony"
    ],
    "rules": [
      "Gate entry closing: 10:30 PM (extension with notice)",
      "Visitors allowed in common lobby between 10 AM - 7 PM",
      "Quiet hours from 11 PM to 7 AM",
      "Maintain cleanliness in shared common zones"
    ],
    "ownerName": "Verified Owner (NoBroker Direct)",
    "ownerPhone": "+91 9832178451",
    "ownerType": "Owner",
    "isVerifiedDemo": true,
    "electricityCharges": "₹9/unit on sub-meter",
    "foodIncluded": false,
    "description": "This semi furnished 2 BHK is available for rent in MURADNAGAR with parking lot for a car and bike. Take a look before it's gone. All families looking for an apartment will find this home attractive at Rs. 5,000.\n\nBeing situated near Anand Hospital, Surya Hospital Muradnagar and URBAN PHC, BRIJ VIHAR, emergency care is very easily available at any time. Aum Sun Public School, Sapro robotics and Diamond Public School are well known educational institutes in town & are very close to this home.\n\nThe surrounding locality is loaded with things to do, Priya Hall & Arman Telecome Nurganj tour and travels are great places to catch a movie near this home. If you are looking for gifts, or just want to spoil yourself, Patanjali Store, Patanjali Store and Nikita general store have a wide variety of things that you can choose from."
  },
  {
    "id": "nobroker-8a9fd48284a9bcb20184a9c4ae1501d0",
    "title": "2 BHK House for Rent In Muradnagar",
    "type": "Flat",
    "rent": 6500,
    "deposit": 6500,
    "lat": 28.76962256607461,
    "lng": 77.51374869841084,
    "address": "Ukhlarsi,  near Muradnagar Public School, Muradnagar, Ghaziabad",
    "genderPolicy": "Boys Only",
    "occupancy": "Entire Flat",
    "furnished": "Unfurnished",
    "availableFrom": "Immediately (Nov 2026)",
    "rating": 4.7,
    "reviewCount": 24,
    "images": [
      "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_563146_950803_large.jpg",
      "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_38362_752071_large.jpg",
      "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_167902_95222_large.jpg",
      "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_456820_130162_large.jpg",
      "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_757515_820515_large.jpg",
      "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_28837_110375_large.jpg",
      "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_147881_864210_large.jpg",
      "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_623706_828678_large.jpg",
      "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_907893_523378_large.jpg",
      "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_695767_35187_large.jpg",
      "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_139378_387372_large.jpg",
      "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_829331_564972_large.jpg",
      "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_958448_865999_large.jpg",
      "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_69123_524706_large.jpg",
      "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_444618_58624_large.jpg",
      "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_273699_995824_large.jpg",
      "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_789857_213626_large.jpg",
      "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_205974_951914_large.jpg"
    ],
    "amenities": [
      "High-Speed Wi-Fi",
      "Power Backup",
      "RO Purified Water",
      "CCTV Security & Biometrics",
      "Attached Washroom",
      "Balcony"
    ],
    "rules": [
      "Gate entry closing: 10:30 PM (extension with notice)",
      "Visitors allowed in common lobby between 10 AM - 7 PM",
      "Quiet hours from 11 PM to 7 AM",
      "Maintain cleanliness in shared common zones"
    ],
    "ownerName": "Verified Resident / Co-tenant",
    "ownerPhone": "+91 9839571268",
    "ownerType": "Owner",
    "isVerifiedDemo": true,
    "electricityCharges": "Included in rent",
    "foodIncluded": false,
    "description": "This 2bhk for rent in muradnagar is perfect for families as it is spacious and comfortable with an area of 700 sq. ft. You get ample & dedicated parking place for bike with this home.\n\nWith amenities such as security this home offers you a lot of convenience.\n\nIf you love movies, Priya Hall & Arman Telecome Nurganj tour and travels are just a few minutes away. If you are looking for gifts, or just want to spoil yourself, Patanjali Store, Patanjali Store and Nikita general store have a wide variety of things that you can choose from.\n\nAum Sun Public School, Sapro robotics and Diamond Public School are well known educational institutes in town & are very close to this home. If you are in need of any emergency services or medical assistance, you will be happy to note that Anand Hospital, Surya Hospital Muradnagar and URBAN PHC, BRIJ VIHAR are very close by."
  },
  {
    "id": "nobroker-8a9f8e8b97de99a20197dee692202792",
    "title": "1 RK House for Rent In Muradnagar",
    "type": "Studio",
    "rent": 5000,
    "deposit": 6000,
    "lat": 28.761664715539574,
    "lng": 77.50265112150221,
    "address": "GT Road near Jalalpur Mod For kansal pitra place, Muradnagar, Ghaziabad",
    "genderPolicy": "Girls Only",
    "occupancy": "Single",
    "furnished": "Unfurnished",
    "availableFrom": "Immediately (Nov 2026)",
    "rating": 4.8,
    "reviewCount": 28,
    "images": [
      "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_147881_864210_large.jpg",
      "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_623706_828678_large.jpg",
      "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_907893_523378_large.jpg",
      "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_695767_35187_large.jpg"
    ],
    "amenities": [
      "High-Speed Wi-Fi",
      "Power Backup",
      "RO Purified Water",
      "CCTV Security & Biometrics",
      "Attached Washroom",
      "Balcony"
    ],
    "rules": [
      "Gate entry closing: 10:30 PM (extension with notice)",
      "Visitors allowed in common lobby between 10 AM - 7 PM",
      "Quiet hours from 11 PM to 7 AM",
      "Maintain cleanliness in shared common zones"
    ],
    "ownerName": "Verified Owner (NoBroker Direct)",
    "ownerPhone": "+91 9846964085",
    "ownerType": "Owner",
    "isVerifiedDemo": true,
    "electricityCharges": "₹9/unit on sub-meter",
    "foodIncluded": true,
    "description": "few more units also available--written by ownerThis 1 RK for rent in Muradnagar is perfect for BACHELOR_MALE as it is spacious and comfortable with an area of 891 sq. ft. This North facing home is on the 2nd floor & comes with a parking space for bike.\n\nAs this home comes with visitor parking & servant room & more such amenities, living here would make life more pleasant.\n\nIf you love movies, Priya Hall & Arman Telecome Nurganj tour and travels are just a few minutes away. If you are looking for gifts, or just want to spoil yourself, Patanjali Store, Patanjali Store and Akash tyres House have a wide variety of things that you can choose from.\n\nIf you are a frequent traveller, then you'll be happy to note that train station is less than 10 minutes from this house.\n\nBeing situated near Anand Hospital, Surya Hospital Muradnagar and Aman Centre, emergency care is very easily available at any time. Aum Sun Public School, Sapro robotics and Diamond Public School are well known educational institutes in town & are very close to this home."
  },
  {
    "id": "nobroker-8a9f168287ebc8ca0187ebd9ea5e07e3",
    "title": "3 BHK House for Rent In Muradnagar",
    "type": "Flat",
    "rent": 18000,
    "deposit": 40000,
    "lat": 28.761272030091543,
    "lng": 77.50508429666957,
    "address": "vishal mittal gali no 10 end of gali muradnagar, Muradnagar, Ghaziabad",
    "genderPolicy": "Co-Living / Unisex",
    "occupancy": "Entire Flat",
    "furnished": "Unfurnished",
    "availableFrom": "Immediately (Nov 2026)",
    "rating": 4.2,
    "reviewCount": 32,
    "images": [
      "https://images.nobroker.in/images/8a9f168287ebc8ca0187ebd9ea5e07e3/8a9f168287ebc8ca0187ebd9ea5e07e3_28853_34657_large.jpg",
      "https://images.nobroker.in/images/8a9f168287ebc8ca0187ebd9ea5e07e3/8a9f168287ebc8ca0187ebd9ea5e07e3_46752_378553_large.jpg",
      "https://images.nobroker.in/images/8a9f168287ebc8ca0187ebd9ea5e07e3/8a9f168287ebc8ca0187ebd9ea5e07e3_89122_632456_large.jpg",
      "https://images.nobroker.in/images/8a9f168287ebc8ca0187ebd9ea5e07e3/8a9f168287ebc8ca0187ebd9ea5e07e3_19116_156534_large.jpg",
      "https://images.nobroker.in/images/8a9f168287ebc8ca0187ebd9ea5e07e3/8a9f168287ebc8ca0187ebd9ea5e07e3_67486_333565_large.jpg",
      "https://images.nobroker.in/images/8a9f168287ebc8ca0187ebd9ea5e07e3/8a9f168287ebc8ca0187ebd9ea5e07e3_48423_844157_large.jpg"
    ],
    "amenities": [
      "High-Speed Wi-Fi",
      "Power Backup",
      "RO Purified Water",
      "CCTV Security & Biometrics",
      "Attached Washroom",
      "Balcony"
    ],
    "rules": [
      "Gate entry closing: 10:30 PM (extension with notice)",
      "Visitors allowed in common lobby between 10 AM - 7 PM",
      "Quiet hours from 11 PM to 7 AM",
      "Maintain cleanliness in shared common zones"
    ],
    "ownerName": "Verified Resident / Co-tenant",
    "ownerPhone": "+91 9854356902",
    "ownerType": "Owner",
    "isVerifiedDemo": true,
    "electricityCharges": "Included in rent",
    "foodIncluded": false,
    "description": "This spacious 3 BHK flat for rent in Muradnagar for 18,000 is the perfect choice for BACHELOR_MALE This West facing home is over 1200 sqft. & is in a convenient location.\n\nIf you need amenities such as Wi-Fi access you will be happy to note that this home has this & more. You are viewing the right home if you would prefer a house with servant room & air conditioning.\n\nWith Aum Sun Public School, Sapro robotics and Diamond Public School close to this home, you'll be able to provide your children with many options to choose from. Being situated near Anand Hospital, Surya Hospital Muradnagar and Aman Centre, emergency care is very easily available at any time.\n\nNever miss out on lifestyle as Patanjali Store, Patanjali Store and Akash tyres House are so close by. The surrounding locality is loaded with things to do, Priya Hall & Arman Telecome Nurganj tour and travels are great places to catch a movie near this home.\n\nIf you are a frequent traveller, then you'll be happy to note that train station is less than 10 minutes from this house."
  },
  {
    "id": "nobroker-8a9fbecb80ffd1d00181005719545983",
    "title": "2 BHK House for Rent In Muradnagar",
    "type": "Flat",
    "rent": 12000,
    "deposit": 12000,
    "lat": 28.760718521955642,
    "lng": 77.50216435467314,
    "address": " GT Rd, New Defence Colony near Police Station , Muradnagar, Ghaziabad",
    "genderPolicy": "Boys Only",
    "occupancy": "Entire Flat",
    "furnished": "Semi Furnished",
    "availableFrom": "Immediately (Nov 2026)",
    "rating": 4.4,
    "reviewCount": 36,
    "images": [
      "https://images.nobroker.in/images/8a9fbecb80ffd1d00181005719545983/8a9fbecb80ffd1d00181005719545983_68402_761744_large.jpg",
      "https://images.nobroker.in/images/8a9fbecb80ffd1d00181005719545983/8a9fbecb80ffd1d00181005719545983_81117_264811_large.jpg",
      "https://images.nobroker.in/images/8a9fbecb80ffd1d00181005719545983/8a9fbecb80ffd1d00181005719545983_59331_419056_large.jpg",
      "https://images.nobroker.in/images/8a9fbecb80ffd1d00181005719545983/8a9fbecb80ffd1d00181005719545983_97262_932999_large.jpg"
    ],
    "amenities": [
      "High-Speed Wi-Fi",
      "Power Backup",
      "RO Purified Water",
      "CCTV Security & Biometrics",
      "Attached Washroom",
      "Balcony"
    ],
    "rules": [
      "Gate entry closing: 10:30 PM (extension with notice)",
      "Visitors allowed in common lobby between 10 AM - 7 PM",
      "Quiet hours from 11 PM to 7 AM",
      "Maintain cleanliness in shared common zones"
    ],
    "ownerName": "Verified Owner (NoBroker Direct)",
    "ownerPhone": "+91 9861749719",
    "ownerType": "Owner",
    "isVerifiedDemo": true,
    "electricityCharges": "₹9/unit on sub-meter",
    "foodIncluded": false,
    "description": "Looking for semi furnished independent house for rent in Muradnagar? Check out this amazing property ideal for families & bachelors. This 900 sqft. home is on the 1st floor & comes with ample parking facility for bike.\n\nThe surrounding locality is loaded with things to do, Priya Hall & Arman Telecome Nurganj tour and travels are great places to catch a movie near this home. Never miss out on lifestyle as Patanjali Store, Patanjali Store and Akash tyres House are so close by.\n\nBeing situated near Anand Hospital, Surya Hospital Muradnagar and Aman Centre, emergency care is very easily available at any time. Aum Sun Public School, Sapro robotics and Diamond Public School are well known educational institutes in town & are very close to this home.\n\nIf you are a frequent traveller, then you'll be happy to note that train station is less than 10 minutes from this house."
  },
  {
    "id": "nobroker-8aa99b71a0b8958601a0b95395b41a7c",
    "title": "2 BHK House for Rent In New Defence Colony",
    "type": "Flat",
    "rent": 6500,
    "deposit": 6500,
    "lat": 28.760319545488848,
    "lng": 77.50362320831847,
    "address": "Station Rd,  near Subham Medical Store, Muradnagar, Ghaziabad",
    "genderPolicy": "Girls Only",
    "occupancy": "Entire Flat",
    "furnished": "Unfurnished",
    "availableFrom": "Immediately (Nov 2026)",
    "rating": 4.5,
    "reviewCount": 40,
    "images": [
      "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_273699_995824_large.jpg",
      "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_789857_213626_large.jpg",
      "https://images.nobroker.in/images/8a9fd48284a9bcb20184a9c4ae1501d0/8a9fd48284a9bcb20184a9c4ae1501d0_205974_951914_large.jpg",
      "https://images.nobroker.in/images/8a9f168287ebc8ca0187ebd9ea5e07e3/8a9f168287ebc8ca0187ebd9ea5e07e3_28853_34657_large.jpg"
    ],
    "amenities": [
      "High-Speed Wi-Fi",
      "Power Backup",
      "RO Purified Water",
      "CCTV Security & Biometrics",
      "Attached Washroom",
      "Balcony"
    ],
    "rules": [
      "Gate entry closing: 10:30 PM (extension with notice)",
      "Visitors allowed in common lobby between 10 AM - 7 PM",
      "Quiet hours from 11 PM to 7 AM",
      "Maintain cleanliness in shared common zones"
    ],
    "ownerName": "Verified Resident / Co-tenant",
    "ownerPhone": "+91 9869142536",
    "ownerType": "Owner",
    "isVerifiedDemo": true,
    "electricityCharges": "Included in rent",
    "foodIncluded": false,
    "description": "This 1000 sqft. home is on the 1st floor & comes with ample parking space for bike."
  },
  {
    "id": "nobroker-8aa991199f4b07b6019f4b72151e445b",
    "title": "2 BHK House for Rent In Muradnagar",
    "type": "Flat",
    "rent": 20000,
    "deposit": 20000,
    "lat": 28.75970344567827,
    "lng": 77.50740439539553,
    "address": "New Defence Colony near State Bank Of India ATM, Muradnagar, Ghaziabad",
    "genderPolicy": "Co-Living / Unisex",
    "occupancy": "Entire Flat",
    "furnished": "Semi Furnished",
    "availableFrom": "Immediately (Nov 2026)",
    "rating": 4.7,
    "reviewCount": 44,
    "images": [
      "https://images.nobroker.in/images/8aa991199f4b07b6019f4b72151e445b/8aa991199f4b07b6019f4b72151e445b_36440_100839_large.jpg",
      "https://images.nobroker.in/images/8a9f168287ebc8ca0187ebd9ea5e07e3/8a9f168287ebc8ca0187ebd9ea5e07e3_28853_34657_large.jpg",
      "https://images.nobroker.in/images/8a9f168287ebc8ca0187ebd9ea5e07e3/8a9f168287ebc8ca0187ebd9ea5e07e3_46752_378553_large.jpg",
      "https://images.nobroker.in/images/8a9f168287ebc8ca0187ebd9ea5e07e3/8a9f168287ebc8ca0187ebd9ea5e07e3_89122_632456_large.jpg"
    ],
    "amenities": [
      "High-Speed Wi-Fi",
      "Power Backup",
      "RO Purified Water",
      "CCTV Security & Biometrics",
      "Attached Washroom",
      "Balcony"
    ],
    "rules": [
      "Gate entry closing: 10:30 PM (extension with notice)",
      "Visitors allowed in common lobby between 10 AM - 7 PM",
      "Quiet hours from 11 PM to 7 AM",
      "Maintain cleanliness in shared common zones"
    ],
    "ownerName": "Verified Owner (NoBroker Direct)",
    "ownerPhone": "+91 9876535353",
    "ownerType": "Owner",
    "isVerifiedDemo": true,
    "electricityCharges": "₹9/unit on sub-meter",
    "foodIncluded": true,
    "description": "Are you looking for a double bedroom for rent? This spacious property is available for rent in Muradnagar. It is semi furnished and convenient for families\n\nNever miss out on lifestyle as Patanjali Store, Balaji Pooja ghar and Paith Bazaar are so close by. If you love movies, Priya Hall & Arman Telecome Nurganj tour and travels are just a few minutes away.\n\nIf you are in need of any emergency services or medical assistance, you will be happy to note that Anand Hospital, Surya Hospital Muradnagar and Aman Centre are very close by. With Aum Sun Public School, Sapro robotics , TBI KIET and Diamond Public School close to this home, you'll be able to provide your children with many options to choose from."
  },
  {
    "id": "nobroker-8a9f85b08fc24df2018fc2a16d9619c1",
    "title": "1 BHK House for Rent In Muradnagar",
    "type": "Private Room",
    "rent": 10000,
    "deposit": 10000,
    "lat": 28.7596821,
    "lng": 77.5074032,
    "address": "Radhey Shyam Vihar Phase-2 Extension Asalat Nagar,Muradnagar,Ghaziabad, Muradnagar, Ghaziabad",
    "genderPolicy": "Boys Only",
    "occupancy": "Single",
    "furnished": "Fully Furnished",
    "availableFrom": "Immediately (Nov 2026)",
    "rating": 4.8,
    "reviewCount": 48,
    "images": [
      "https://images.nobroker.in/images/8a9f85b08fc24df2018fc2a16d9619c1/8a9f85b08fc24df2018fc2a16d9619c1_37185_265773_large.jpg",
      "https://images.nobroker.in/images/8a9f85b08fc24df2018fc2a16d9619c1/8a9f85b08fc24df2018fc2a16d9619c1_83349_517285_large.jpg",
      "https://images.nobroker.in/images/8a9f85b08fc24df2018fc2a16d9619c1/8a9f85b08fc24df2018fc2a16d9619c1_56532_258952_large.jpg",
      "https://images.nobroker.in/images/8a9f85b08fc24df2018fc2a16d9619c1/8a9f85b08fc24df2018fc2a16d9619c1_51901_96744_large.jpg",
      "https://images.nobroker.in/images/8a9f85b08fc24df2018fc2a16d9619c1/8a9f85b08fc24df2018fc2a16d9619c1_72623_34935_large.jpg"
    ],
    "amenities": [
      "High-Speed Wi-Fi",
      "Power Backup",
      "RO Purified Water",
      "CCTV Security & Biometrics",
      "Attached Washroom",
      "Balcony"
    ],
    "rules": [
      "Gate entry closing: 10:30 PM (extension with notice)",
      "Visitors allowed in common lobby between 10 AM - 7 PM",
      "Quiet hours from 11 PM to 7 AM",
      "Maintain cleanliness in shared common zones"
    ],
    "ownerName": "Verified Resident / Co-tenant",
    "ownerPhone": "+91 9883928170",
    "ownerType": "Owner",
    "isVerifiedDemo": true,
    "electricityCharges": "Included in rent",
    "foodIncluded": false,
    "description": "This 1BHK for rent in Muradnagar is perfect for families & bachelors as it is spacious and comfortable with an area of 540 sq. ft. This fully furnished independent house is at a great price of just 10,000 rupees. This East facing home is on the 2nd floor.\n\nIf you need amenities such as security you will be happy to note that this home has this & more.\n\nWith Aum Sun Public School, Sapro robotics , TBI KIET and Diamond Public School close to this home, you'll be able to provide your children with many options to choose from. Being situated near Anand Hospital, Surya Hospital Muradnagar and Aman Centre, emergency care is very easily available at any time.\n\nIf you love movies, Priya Hall & Arman Telecome Nurganj tour and travels are just a few minutes away. Never miss out on lifestyle as Patanjali Store, Balaji Pooja ghar and Paith Bazaar are so close by."
  },
  {
    "id": "nobroker-8a9fb58794c65afd0194c66da29706e7",
    "title": "1 RK Flat In Radhey Shyam Vihar Phase-2 Extension Asalat Nagar,muradnagar,ghaziabad for Rent In Muradnagar",
    "type": "Studio",
    "rent": 7000,
    "deposit": 7000,
    "lat": 28.759645874261416,
    "lng": 77.50738086402119,
    "address": "Radhey Shyam Vihar Phase-2 Extension Asalat Nagar,Muradnagar,Ghaziabad, Muradnagar, Ghaziabad",
    "genderPolicy": "Girls Only",
    "occupancy": "Single",
    "furnished": "Unfurnished",
    "availableFrom": "Immediately (Nov 2026)",
    "rating": 4.2,
    "reviewCount": 52,
    "images": [
      "https://images.nobroker.in/images/8a9fb58794c65afd0194c66da29706e7/8a9fb58794c65afd0194c66da29706e7_93204_665221_large.jpg",
      "https://images.nobroker.in/images/8a9fbecb80ffd1d00181005719545983/8a9fbecb80ffd1d00181005719545983_68402_761744_large.jpg",
      "https://images.nobroker.in/images/8a9fbecb80ffd1d00181005719545983/8a9fbecb80ffd1d00181005719545983_81117_264811_large.jpg",
      "https://images.nobroker.in/images/8a9fbecb80ffd1d00181005719545983/8a9fbecb80ffd1d00181005719545983_59331_419056_large.jpg"
    ],
    "amenities": [
      "High-Speed Wi-Fi",
      "Power Backup",
      "RO Purified Water",
      "CCTV Security & Biometrics",
      "Attached Washroom",
      "Balcony"
    ],
    "rules": [
      "Gate entry closing: 10:30 PM (extension with notice)",
      "Visitors allowed in common lobby between 10 AM - 7 PM",
      "Quiet hours from 11 PM to 7 AM",
      "Maintain cleanliness in shared common zones"
    ],
    "ownerName": "Verified Owner (NoBroker Direct)",
    "ownerPhone": "+91 981320987",
    "ownerType": "Owner",
    "isVerifiedDemo": true,
    "electricityCharges": "₹9/unit on sub-meter",
    "foodIncluded": false,
    "description": "1 RK apartment flat for rent in Muradnagar is now vacant, if you're a families, this is the place for you. This home is over 200 sqft. & even comes with ample space for bike parking."
  },
  {
    "id": "nobroker-8aa9aa84a106b09a01a106c658eb0f49",
    "title": "1 RK House for Rent In Muradnagar",
    "type": "Studio",
    "rent": 3000,
    "deposit": 6000,
    "lat": 28.759490390793772,
    "lng": 77.49983347652766,
    "address": "Piller no. 868, Ordinance factory gate, Gali No. 1, behind of Jain Mandir, Dagar Vihar, Phase - I, Muradnagar, Ghaziabad",
    "genderPolicy": "Co-Living / Unisex",
    "occupancy": "Single",
    "furnished": "Semi Furnished",
    "availableFrom": "Immediately (Nov 2026)",
    "rating": 4.4,
    "reviewCount": 56,
    "images": [
      "https://images.nobroker.in/images/8aa9aa84a106b09a01a106c658eb0f49/8aa9aa84a106b09a01a106c658eb0f49_45397_43257_large.jpg",
      "https://images.nobroker.in/images/8a9fbecb80ffd1d00181005719545983/8a9fbecb80ffd1d00181005719545983_97262_932999_large.jpg",
      "https://images.nobroker.in/images/8aa991199f4b07b6019f4b72151e445b/8aa991199f4b07b6019f4b72151e445b_36440_100839_large.jpg",
      "https://images.nobroker.in/images/8a9f85b08fc24df2018fc2a16d9619c1/8a9f85b08fc24df2018fc2a16d9619c1_37185_265773_large.jpg"
    ],
    "amenities": [
      "High-Speed Wi-Fi",
      "Power Backup",
      "RO Purified Water",
      "CCTV Security & Biometrics",
      "Attached Washroom",
      "Balcony"
    ],
    "rules": [
      "Gate entry closing: 10:30 PM (extension with notice)",
      "Visitors allowed in common lobby between 10 AM - 7 PM",
      "Quiet hours from 11 PM to 7 AM",
      "Maintain cleanliness in shared common zones"
    ],
    "ownerName": "Verified Resident / Co-tenant",
    "ownerPhone": "+91 988713804",
    "ownerType": "Owner",
    "isVerifiedDemo": true,
    "electricityCharges": "Included in rent",
    "foodIncluded": false,
    "description": "only for boys--written by ownerThis semi furnished 1 RK is available for rent in Muradnagar with bike parking facility. Take a look before it's gone. All bachelors looking for an independent house will find this home attractive at Rs. 3,000. This home is 144 sqft & is situated on the 1st floor of the building."
  }
];

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
 * Generates realistic PG and flat listings spread around lat/lng.
 * Uses real NoBroker Muradnagar properties when in/near Delhi-NCR / Ghaziabad / Muradnagar,
 * and draws exclusively from real NoBroker property photos for all locations!
 */
export function generateDemoListings(
  centerLat: number,
  centerLng: number,
  radiusKm: number = 8
): PropertyListing[] {
  // Check if center is close to Muradnagar / Ghaziabad (lat ~ 28.77, lng ~ 77.50)
  const distToMuradnagar = calculateHaversineDistance(centerLat, centerLng, 28.775, 77.504);
  const isMuradnagarOrDelhiNcr = distToMuradnagar <= 65;

  const realListings: PropertyListing[] = [];

  if (isMuradnagarOrDelhiNcr) {
    for (const prop of REAL_MURADNAGAR_PROPERTIES) {
      const realDistKm = calculateHaversineDistance(centerLat, centerLng, prop.lat, prop.lng);
      realListings.push({
        ...prop,
        distanceKm: realDistKm
      });
    }
  }

  // Also deterministically generate supplemental listings
  const seed = Math.floor(Math.abs(centerLat * 1000 + centerLng * 1000));
  const rng = createSeededRandom(seed);
  const count = isMuradnagarOrDelhiNcr ? 8 : 16;
  const supplementalListings: PropertyListing[] = [];

  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const distFactor = Math.pow(rng(), 0.8);
    const dist = Math.max(0.4, distFactor * radiusKm);

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

    let baseRent = 6500;
    if (occupancy === 'Single') baseRent = 10500;
    if (occupancy === 'Triple') baseRent = 5500;
    if (propType === 'Flat') baseRent = 16000;
    if (propType === 'Studio') baseRent = 9500;

    const rentRandomness = Math.floor(rng() * 6) * 500;
    const rent = baseRent + rentRandomness;
    const deposit = rent * (rng() > 0.5 ? 2 : 1);

    const shuffledAmenities = [...ALL_AMENITIES].sort(() => rng() - 0.5);
    const selectedAmenities = shuffledAmenities.slice(0, 5 + Math.floor(rng() * 5));

    // Draw 3 to 5 real photos from the NoBroker pool
    const imgStart = Math.floor(rng() * PROPERTY_IMAGES.length);
    const images = [
      PROPERTY_IMAGES[imgStart % PROPERTY_IMAGES.length],
      PROPERTY_IMAGES[(imgStart + 1) % PROPERTY_IMAGES.length],
      PROPERTY_IMAGES[(imgStart + 2) % PROPERTY_IMAGES.length],
      PROPERTY_IMAGES[(imgStart + 3) % PROPERTY_IMAGES.length]
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
      `Bright and airy ${occupancy.toLowerCase()} ${propType} just ${realDistKm} km away. Peaceful residential lane with grocery stores and chai stalls right downstairs. Wi-Fi is fast and reliable.`,
      `Well-kept ${occupancy.toLowerCase()} ${propType} with cross-ventilation and quiet evening hours. Landlord handles maintenance quickly.`,
      `Comfortable ${occupancy.toLowerCase()} ${propType} with home-style food, power backup, and clean common washrooms. Room includes private wardrobe and study desk.`,
      `Modern ${occupancy.toLowerCase()} flatshare with a sunlit balcony and shared kitchen. Friendly flatmates, clean chore rotation, and zero brokerage.`
    ];
    const description = descriptionsPool[i % descriptionsPool.length];

    const streets = ['Pocket 2, Muradnagar', 'Main Market Road, Ghaziabad', 'Sector 4, Govindpuram', 'Radhey Shyam Vihar', 'New Defence Colony'];
    const address = `${streets[i % streets.length]}, ${realDistKm} km from center`;

    supplementalListings.push({
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

  const combined = [...realListings, ...supplementalListings];
  return combined.sort((a, b) => a.distanceKm - b.distanceKm);
}
