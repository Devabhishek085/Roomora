export type GenderPolicy = 'Boys Only' | 'Girls Only' | 'Co-Living / Unisex';
export type AccommodationType = 'PG' | 'Flat' | 'Studio' | 'Private Room' | 'Shared Room';
export type FoodPreference = 'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian' | 'Vegan';
export type SleepSchedule = 'Early Bird' | 'Night Owl' | 'Flexible';
export type NoiseTolerance = 'Low/Quiet' | 'Moderate' | 'High/Lively';
export type GuestPolicy = 'Rarely' | 'Weekends Only' | 'Flexible';
export type SmokingDrinking = 'Never' | 'Occasionally' | 'Fine';

export interface LocationCoordinates {
  name: string;
  lat: number;
  lng: number;
  displayName?: string;
  city?: string;
}

export interface Amenity {
  id: string;
  name: string;
  icon: string;
}

export interface PropertyListing {
  id: string;
  title: string;
  type: AccommodationType;
  rent: number;
  deposit: number;
  lat: number;
  lng: number;
  address: string;
  distanceKm: number;
  genderPolicy: GenderPolicy;
  occupancy: 'Single' | 'Double' | 'Triple' | 'Entire Flat';
  furnished: 'Fully Furnished' | 'Semi Furnished' | 'Unfurnished';
  availableFrom: string;
  rating: number;
  reviewCount: number;
  images: string[];
  amenities: string[];
  rules: string[];
  ownerName: string;
  ownerPhone: string;
  ownerType: 'Owner' | 'Property Manager' | 'Current Tenant';
  isVerifiedDemo: boolean;
  electricityCharges: string;
  foodIncluded: boolean;
  description: string;
}

export interface PointOfInterest {
  id: string;
  name: string;
  type: 'college' | 'transit' | 'hospital' | 'market' | 'food' | 'atm';
  lat: number;
  lng: number;
  distanceMeters: number;
}

export interface UserOnboardingProfile {
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say';
  occupation: 'College Student' | 'Working Professional' | 'Intern' | 'Freelancer';
  institution: string; // e.g. "Delhi University", "NSUT", "DTU"
  city: string;
  budgetMin: number;
  budgetMax: number;
  moveInDate: string;
  accommodationType: AccommodationType;
  sharingPreference: 'Single Room' | 'Twin Sharing' | 'Triple Sharing' | 'Flexible';

  // Lifestyle traits
  sleepSchedule: SleepSchedule;
  cleanliness: number; // 1 to 5
  foodPreference: FoodPreference;
  smokingDrinking: SmokingDrinking;
  noiseTolerance: NoiseTolerance;
  guestPolicy: GuestPolicy;
  privacyNeeds: 'High' | 'Moderate' | 'Low';
  bio: string;

  // Weights (1 to 5)
  weights: {
    sleepWeight: number;
    cleanlinessWeight: number;
    foodWeight: number;
    guestWeight: number;
    noiseWeight: number;
    habitsWeight: number;
  };

  // Hard constraints
  strictBudget: boolean;
  strictMoveInDate: boolean;
  strictGenderPolicy: boolean;

  // Privacy toggles
  showBudgetPublicly: boolean;
  showSleepSchedulePublicly: boolean;
  showContactPublicly: boolean;
}

export interface RoommateProfile {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Non-binary';
  avatarUrl: string;
  occupation: string;
  institution: string;
  city: string;
  targetLocalities: string[];
  budgetMin: number;
  budgetMax: number;
  moveInDate: string;
  accommodationType: AccommodationType;
  sharingPreference: 'Single Room' | 'Twin Sharing' | 'Triple Sharing' | 'Flexible';
  sleepSchedule: SleepSchedule;
  cleanliness: number; // 1-5
  foodPreference: FoodPreference;
  smokingDrinking: SmokingDrinking;
  noiseTolerance: NoiseTolerance;
  guestPolicy: GuestPolicy;
  privacyNeeds: 'High' | 'Moderate' | 'Low';
  hobbies: string[];
  bio: string;
  isVerifiedDemo: boolean;
  socialBadge?: string;
}

export interface CompatibilityReport {
  score: number; // 0 to 100
  hardConstraintPassed: boolean;
  hardConstraintReason?: string;
  strengths: string[];
  considerations: string[];
  categoryBreakdown: {
    category: string;
    label: string;
    matchPercentage: number;
    explanation: string;
  }[];
  summaryText: string;
}

export interface Inquiry {
  id: string;
  propertyId: string;
  propertyTitle: string;
  senderName: string;
  senderPhone: string;
  senderEmail: string;
  message: string;
  moveInDate: string;
  createdAt: string;
  status: 'Inquiry Sent' | 'Follow-up Expected';
}

export interface RoommateRequest {
  id: string;
  roommateId: string;
  roommateName: string;
  message: string;
  createdAt: string;
  status: 'Sent' | 'Connected';
}

export interface SafetyReport {
  id: string;
  targetId: string;
  targetType: 'listing' | 'roommate';
  targetTitle: string;
  reason: string;
  details: string;
  createdAt: string;
}
