import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { RoommateProfile, DbProfile } from '../types';

/**
 * Maps a database profile row to the RoommateProfile format used by UI components.
 * Only exposes fields permitted by the profile's privacy settings.
 */
export function dbProfileToRoommateProfile(profile: DbProfile): RoommateProfile {
  return {
    id: profile.id,
    name: profile.display_name || 'Anonymous',
    age: profile.age ?? 0,
    gender: (profile.gender as RoommateProfile['gender']) || 'Non-binary',
    avatarUrl: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`,
    occupation: profile.occupation || 'Student',
    institution: profile.institution || '',
    city: profile.city || '',
    targetLocalities: profile.target_localities || [],
    budgetMin: profile.show_budget_publicly ? (profile.budget_min ?? 0) : 0,
    budgetMax: profile.show_budget_publicly ? (profile.budget_max ?? 0) : 0,
    moveInDate: profile.move_in_date || '',
    accommodationType: (profile.accommodation_type as RoommateProfile['accommodationType']) || 'PG',
    sharingPreference: (profile.sharing_preference as RoommateProfile['sharingPreference']) || 'Flexible',
    sleepSchedule: profile.show_sleep_schedule_publicly
      ? ((profile.sleep_schedule as RoommateProfile['sleepSchedule']) || 'Flexible')
      : 'Flexible',
    cleanliness: profile.cleanliness ?? 3,
    foodPreference: (profile.food_preference as RoommateProfile['foodPreference']) || 'Vegetarian',
    smokingDrinking: (profile.smoking_drinking as RoommateProfile['smokingDrinking']) || 'Never',
    noiseTolerance: (profile.noise_tolerance as RoommateProfile['noiseTolerance']) || 'Moderate',
    guestPolicy: (profile.guest_policy as RoommateProfile['guestPolicy']) || 'Rarely',
    privacyNeeds: (profile.privacy_needs as RoommateProfile['privacyNeeds']) || 'Moderate',
    hobbies: profile.hobbies || [],
    bio: profile.bio || '',
    flatImages: profile.flat_images || [],
    isVerifiedDemo: profile.is_demo,
    demoLabel: profile.demo_label,
  };
}

export interface RoommateFilter {
  city?: string;
  budgetMin?: number;
  budgetMax?: number;
  gender?: string;
  accommodationType?: string;
  sleepSchedule?: string;
  foodPreference?: string;
  searchQuery?: string;
  verifiedOnly?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * Fetches real roommate profiles from the database with optional filters.
 * Only returns actual registered users who completed their onboarding profile.
 * AI demo profiles and uncompleted/test accounts are strictly excluded.
 */
export async function fetchRoommateProfiles(
  currentUserId: string | null,
  filter: RoommateFilter = {}
): Promise<{ profiles: RoommateProfile[]; total: number; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { profiles: [], total: 0, error: null };
  }

  const page = filter.page ?? 1;
  const pageSize = filter.pageSize ?? 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .eq('profile_visibility', 'public')
    .eq('is_demo', false)
    .not('profile_completed_at', 'is', null)
    .not('city', 'is', null)
    .not('age', 'is', null)
    .gt('age', 0)
    .range(from, to);

  // Exclude current user from results
  if (currentUserId) {
    query = query.neq('id', currentUserId);
  }

  if (filter.city) {
    query = query.ilike('city', `%${filter.city}%`);
  }

  if (filter.budgetMin !== undefined) {
    query = query.gte('budget_max', filter.budgetMin);
  }

  if (filter.budgetMax !== undefined) {
    query = query.lte('budget_min', filter.budgetMax);
  }

  if (filter.gender && filter.gender !== 'All') {
    query = query.eq('gender', filter.gender);
  }

  if (filter.accommodationType && filter.accommodationType !== 'All') {
    query = query.eq('accommodation_type', filter.accommodationType);
  }

  if (filter.sleepSchedule && filter.sleepSchedule !== 'All') {
    query = query.eq('sleep_schedule', filter.sleepSchedule);
  }

  if (filter.foodPreference && filter.foodPreference !== 'All') {
    query = query.eq('food_preference', filter.foodPreference);
  }

  if (filter.searchQuery?.trim()) {
    const q = filter.searchQuery.trim();
    query = query.or(`display_name.ilike.%${q}%,institution.ilike.%${q}%,city.ilike.%${q}%`);
  }

  // Order: newest registered profiles first
  query = query.order('created_at', { ascending: false });

  const { data, count, error } = await query;

  if (error) {
    return { profiles: [], total: 0, error: error.message };
  }

  // Strict sanitization: only keep registered profiles with genuine profile details
  const validProfiles = (data as DbProfile[]).filter((p) => {
    return (
      !p.is_demo &&
      Boolean(p.profile_completed_at) &&
      p.age !== null &&
      p.age !== undefined &&
      p.age > 0 &&
      Boolean(p.city && p.city.trim() !== '') &&
      !p.display_name?.startsWith('test_')
    );
  });

  const profiles = validProfiles.map(dbProfileToRoommateProfile);
  return { profiles, total: count ?? profiles.length, error: null };
}

/**
 * Fetches a single profile by ID.
 */
export async function fetchProfileById(profileId: string): Promise<DbProfile | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;
  return data as DbProfile;
}

/**
 * Checks if a user's profile is complete enough to appear in search results.
 */
export function isProfileComplete(profile: DbProfile | null): boolean {
  if (!profile) return false;
  return Boolean(
    profile.display_name &&
    profile.age &&
    profile.city &&
    profile.budget_min &&
    profile.budget_max &&
    profile.accommodation_type &&
    profile.move_in_date &&
    profile.sleep_schedule &&
    profile.food_preference
  );
}

/**
 * Calculates a profile completion percentage (0–100).
 */
export function getProfileCompletion(profile: DbProfile | null): number {
  if (!profile) return 0;
  const fields = [
    profile.display_name,
    profile.age,
    profile.gender,
    profile.occupation,
    profile.institution,
    profile.city,
    profile.budget_min,
    profile.budget_max,
    profile.move_in_date,
    profile.accommodation_type,
    profile.sleep_schedule,
    profile.food_preference,
    profile.smoking_drinking,
    profile.cleanliness,
    profile.bio,
    profile.target_localities?.length > 0 ? true : null,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}
