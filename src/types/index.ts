/**
 * Extended TypeScript types for Roomora full-stack platform.
 * Extends existing types/index.ts with database-backed entities.
 */

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

export interface MatchingWeights {
  sleepWeight: number;
  cleanlinessWeight: number;
  foodWeight: number;
  guestWeight: number;
  noiseWeight: number;
  habitsWeight: number;
}

export interface UserOnboardingProfile {
  name: string;
  avatarUrl?: string;
  flatImages?: string[];
  age: number;
  gender: 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say';
  occupation: 'College Student' | 'Working Professional' | 'Intern' | 'Freelancer';
  institution: string;
  city: string;
  budgetMin: number;
  budgetMax: number;
  moveInDate: string;
  accommodationType: AccommodationType;
  sharingPreference: 'Single Room' | 'Twin Sharing' | 'Triple Sharing' | 'Flexible';
  sleepSchedule: SleepSchedule;
  cleanliness: number;
  foodPreference: FoodPreference;
  smokingDrinking: SmokingDrinking;
  noiseTolerance: NoiseTolerance;
  guestPolicy: GuestPolicy;
  privacyNeeds: 'High' | 'Moderate' | 'Low';
  bio: string;
  weights: MatchingWeights;
  strictBudget: boolean;
  strictMoveInDate: boolean;
  strictGenderPolicy: boolean;
  showBudgetPublicly: boolean;
  showSleepSchedulePublicly: boolean;
  showContactPublicly: boolean;
}

/** Database-backed profile (maps to public.profiles table) */
export interface DbProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  age: number | null;
  gender: string | null;
  occupation: string | null;
  institution: string | null;
  city: string | null;
  budget_min: number | null;
  budget_max: number | null;
  move_in_date: string | null;
  accommodation_type: string | null;
  sharing_preference: string | null;
  sleep_schedule: string | null;
  cleanliness: number | null;
  food_preference: string | null;
  smoking_drinking: string | null;
  noise_tolerance: string | null;
  guest_policy: string | null;
  privacy_needs: string | null;
  bio: string | null;
  target_localities: string[];
  hobbies: string[];
  flat_images?: string[] | null;
  is_demo: boolean;
  demo_label: string | null;
  profile_visibility: 'public' | 'connections_only' | 'private';
  show_budget_publicly: boolean;
  show_sleep_schedule_publicly: boolean;
  show_contact_publicly: boolean;
  weights: MatchingWeights | null;
  strict_budget: boolean;
  strict_move_in_date: boolean;
  strict_gender_policy: boolean;
  profile_completed_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Roommate profile for matching display (maps to RoommateProfile but DB-backed) */
export interface RoommateProfile {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Non-binary';
  avatarUrl: string;
  flatImages?: string[];
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
  cleanliness: number;
  foodPreference: FoodPreference;
  smokingDrinking: SmokingDrinking;
  noiseTolerance: NoiseTolerance;
  guestPolicy: GuestPolicy;
  privacyNeeds: 'High' | 'Moderate' | 'Low';
  hobbies: string[];
  bio: string;
  isVerifiedDemo: boolean;
  /** 'AI-generated demo profile' for synthetic profiles */
  demoLabel: string | null;
  socialBadge?: string;
  /** Whether this profile has passed Aadhaar verification */
  isAadhaarVerified?: boolean;
}

export interface CompatibilityReport {
  score: number;
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

/** Token balance from database */
export interface TokenBalance {
  balance: number;
  lifetime_granted: number;
}

/** Connection between two users */
export interface RoommateConnection {
  id: string;
  initiator_id: string;
  recipient_id: string;
  status: 'active' | 'blocked';
  created_at: string;
}

/** Message in a conversation */
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

/** Subscription plan */
export type SubscriptionPlan = 'free' | 'monthly' | 'premium';

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  tokens_per_period: number | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
}

/** Aadhaar verification status */
export type AadhaarStatus = 'not_started' | 'in_progress' | 'verified' | 'failed' | 'unavailable';

export interface AadhaarVerification {
  id: string;
  user_id: string;
  status: AadhaarStatus;
  provider_reference: string | null;
  verified_at: string | null;
  failed_reason: string | null;
  is_mock: boolean;
  consent_given_at: string | null;
  created_at: string;
}

/** Plan configuration */
export interface PlanConfig {
  id: SubscriptionPlan;
  name: string;
  priceMonthly: number; // in INR
  pricePaise: number; // in paise (for Razorpay)
  description: string;
  features: string[];
  connectionsPerMonth: number | 'unlimited';
  highlighted: boolean;
}
