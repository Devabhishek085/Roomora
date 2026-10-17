import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  UserOnboardingProfile, 
  LocationCoordinates, 
  Inquiry, 
  RoommateRequest, 
  SafetyReport 
} from '../types';

export const DEFAULT_LOCATION: LocationCoordinates = {
  name: 'North Campus, Delhi University',
  lat: 28.6923,
  lng: 77.2117,
  city: 'New Delhi',
  displayName: 'University of Delhi North Campus, Vishwavidyalaya, Delhi'
};

export const createEmptyUserProfile = (name = ''): UserOnboardingProfile => ({
  name,
  avatarUrl: '',
  age: 20,
  gender: 'Male',
  occupation: 'College Student',
  institution: '',
  city: '',
  budgetMin: 5000,
  budgetMax: 15000,
  moveInDate: '',
  accommodationType: 'PG',
  sharingPreference: 'Twin Sharing',
  sleepSchedule: 'Flexible',
  cleanliness: 3,
  foodPreference: 'Vegetarian',
  smokingDrinking: 'Never',
  noiseTolerance: 'Moderate',
  guestPolicy: 'Rarely',
  privacyNeeds: 'Moderate',
  bio: '',
  weights: {
    sleepWeight: 3,
    cleanlinessWeight: 3,
    foodWeight: 3,
    guestWeight: 3,
    noiseWeight: 3,
    habitsWeight: 3
  },
  strictBudget: false,
  strictMoveInDate: false,
  strictGenderPolicy: false,
  showBudgetPublicly: true,
  showSleepSchedulePublicly: true,
  showContactPublicly: false
});

export const DEFAULT_USER_PROFILE: UserOnboardingProfile = createEmptyUserProfile('');

interface AppState {
  // Theme
  darkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (val: boolean) => void;

  // Location & Explorer State
  selectedLocation: LocationCoordinates;
  setSelectedLocation: (loc: LocationCoordinates) => void;
  radiusKm: number;
  setRadiusKm: (radius: number) => void;
  selectedListingId: string | null;
  setSelectedListingId: (id: string | null) => void;

  // Onboarding & Profile
  userProfile: UserOnboardingProfile;
  isOnboarded: boolean;
  updateUserProfile: (profile: Partial<UserOnboardingProfile>) => void;
  completeOnboarding: (profile: UserOnboardingProfile) => void;
  resetUserProfile: (name?: string) => void;

  // Favorites & Interactions
  savedProperties: string[];
  toggleSaveProperty: (id: string) => void;
  savedRoommates: string[];
  toggleSaveRoommate: (id: string) => void;

  // Inquiries & Connection requests
  inquiries: Inquiry[];
  addInquiry: (inquiry: Omit<Inquiry, 'id' | 'createdAt' | 'status'>) => void;
  roommateRequests: RoommateRequest[];
  addRoommateRequest: (roommateId: string, roommateName: string, message: string) => void;

  // Recent Searches
  recentSearches: LocationCoordinates[];
  addRecentSearch: (loc: LocationCoordinates) => void;
  clearRecentSearches: () => void;

  // Safety & Reports
  safetyReports: SafetyReport[];
  addSafetyReport: (report: Omit<SafetyReport, 'id' | 'createdAt'>) => void;

  // Account Scoped Data
  currentUserId: string | null;
  loadUserScopedData: (userId: string | null) => void;
  resetAccountData: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      darkMode: true,
      toggleDarkMode: () => {
        const next = !get().darkMode;
        if (next) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        set({ darkMode: next });
      },
      setDarkMode: (val: boolean) => {
        if (val) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        set({ darkMode: val });
      },

      selectedLocation: DEFAULT_LOCATION,
      setSelectedLocation: (loc) => {
        set({ selectedLocation: loc });
        get().addRecentSearch(loc);
      },

      radiusKm: 5,
      setRadiusKm: (radiusKm) => set({ radiusKm }),

      selectedListingId: null,
      setSelectedListingId: (selectedListingId) => set({ selectedListingId }),

      userProfile: DEFAULT_USER_PROFILE,
      isOnboarded: false,
      updateUserProfile: (updated) =>
        set((state) => ({
          userProfile: { ...state.userProfile, ...updated }
        })),
      completeOnboarding: (profile) =>
        set({
          userProfile: profile,
          isOnboarded: true
        }),
      resetUserProfile: (name = '') =>
        set({
          userProfile: createEmptyUserProfile(name),
          isOnboarded: false
        }),

      currentUserId: null,

      savedProperties: [],
      toggleSaveProperty: (id) =>
        set((state) => {
          const exists = state.savedProperties.includes(id);
          const next = exists
            ? state.savedProperties.filter((item) => item !== id)
            : [...state.savedProperties, id];
          if (state.currentUserId) {
            try {
              localStorage.setItem(`roomora_saved_props_${state.currentUserId}`, JSON.stringify(next));
            } catch {}
          }
          return { savedProperties: next };
        }),

      savedRoommates: [],
      toggleSaveRoommate: (id) =>
        set((state) => {
          const exists = state.savedRoommates.includes(id);
          const next = exists
            ? state.savedRoommates.filter((item) => item !== id)
            : [...state.savedRoommates, id];
          if (state.currentUserId) {
            try {
              localStorage.setItem(`roomora_saved_rms_${state.currentUserId}`, JSON.stringify(next));
            } catch {}
          }
          return { savedRoommates: next };
        }),

      inquiries: [],
      addInquiry: (inquiryData) =>
        set((state) => {
          const next = [
            {
              ...inquiryData,
              id: 'inq-' + Date.now(),
              createdAt: new Date().toISOString().split('T')[0],
              status: 'Inquiry Sent' as const
            },
            ...state.inquiries
          ];
          if (state.currentUserId) {
            try {
              localStorage.setItem(`roomora_inquiries_${state.currentUserId}`, JSON.stringify(next));
            } catch {}
          }
          return { inquiries: next };
        }),

      roommateRequests: [],
      addRoommateRequest: (roommateId, roommateName, message) =>
        set((state) => {
          const next = [
            {
              id: 'req-' + Date.now(),
              roommateId,
              roommateName,
              message,
              createdAt: new Date().toISOString().split('T')[0],
              status: 'Sent' as const
            },
            ...state.roommateRequests
          ];
          if (state.currentUserId) {
            try {
              localStorage.setItem(`roomora_requests_${state.currentUserId}`, JSON.stringify(next));
            } catch {}
          }
          return { roommateRequests: next };
        }),

      recentSearches: [],
      addRecentSearch: (loc) =>
        set((state) => {
          const filtered = state.recentSearches.filter(
            (item) => item.name.toLowerCase() !== loc.name.toLowerCase()
          );
          const next = [loc, ...filtered].slice(0, 6);
          if (state.currentUserId) {
            try {
              localStorage.setItem(`roomora_searches_${state.currentUserId}`, JSON.stringify(next));
            } catch {}
          }
          return { recentSearches: next };
        }),
      clearRecentSearches: () => {
        const uid = get().currentUserId;
        if (uid) {
          try {
            localStorage.removeItem(`roomora_searches_${uid}`);
          } catch {}
        }
        set({ recentSearches: [] });
      },

      safetyReports: [],
      addSafetyReport: (reportData) =>
        set((state) => ({
          safetyReports: [
            {
              ...reportData,
              id: 'rep-' + Date.now(),
              createdAt: new Date().toISOString()
            },
            ...state.safetyReports
          ]
        })),

      loadUserScopedData: (userId: string | null) => {
        if (!userId) {
          get().resetAccountData();
          return;
        }

        try {
          const savedProps = JSON.parse(localStorage.getItem(`roomora_saved_props_${userId}`) || '[]');
          const savedRms = JSON.parse(localStorage.getItem(`roomora_saved_rms_${userId}`) || '[]');
          const inqs = JSON.parse(localStorage.getItem(`roomora_inquiries_${userId}`) || '[]');
          const reqs = JSON.parse(localStorage.getItem(`roomora_requests_${userId}`) || '[]');
          const searches = JSON.parse(localStorage.getItem(`roomora_searches_${userId}`) || '[]');

          set({
            currentUserId: userId,
            savedProperties: Array.isArray(savedProps) ? savedProps : [],
            savedRoommates: Array.isArray(savedRms) ? savedRms : [],
            inquiries: Array.isArray(inqs) ? inqs : [],
            roommateRequests: Array.isArray(reqs) ? reqs : [],
            recentSearches: Array.isArray(searches) ? searches : []
          });
        } catch {
          set({
            currentUserId: userId,
            savedProperties: [],
            savedRoommates: [],
            inquiries: [],
            roommateRequests: [],
            recentSearches: []
          });
        }
      },

      resetAccountData: () =>
        set({
          currentUserId: null,
          savedProperties: [],
          savedRoommates: [],
          inquiries: [],
          roommateRequests: [],
          recentSearches: [],
          userProfile: DEFAULT_USER_PROFILE,
          isOnboarded: false
        })
    }),
    {
      name: 'roommate_platform_state_v2',
      partialize: (state) => ({
        darkMode: state.darkMode,
        selectedLocation: state.selectedLocation,
        radiusKm: state.radiusKm,
        userProfile: state.userProfile,
        isOnboarded: state.isOnboarded,
        currentUserId: state.currentUserId,
        savedProperties: state.savedProperties,
        savedRoommates: state.savedRoommates,
        inquiries: state.inquiries,
        roommateRequests: state.roommateRequests,
        recentSearches: state.recentSearches,
        safetyReports: state.safetyReports
      })
    }
  )
);
