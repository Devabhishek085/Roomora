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

      savedProperties: ['prop-du-1', 'prop-du-3'],
      toggleSaveProperty: (id) =>
        set((state) => {
          const exists = state.savedProperties.includes(id);
          return {
            savedProperties: exists
              ? state.savedProperties.filter((item) => item !== id)
              : [...state.savedProperties, id]
          };
        }),

      savedRoommates: ['rm-1', 'rm-3'],
      toggleSaveRoommate: (id) =>
        set((state) => {
          const exists = state.savedRoommates.includes(id);
          return {
            savedRoommates: exists
              ? state.savedRoommates.filter((item) => item !== id)
              : [...state.savedRoommates, id]
          };
        }),

      inquiries: [
        {
          id: 'inq-demo-1',
          propertyId: 'prop-du-1',
          propertyTitle: 'Zolo Starlight Student PG (Near North Campus)',
          senderName: 'Aarav Sharma',
          senderPhone: '+91 98765 43210',
          senderEmail: 'aarav.sharma@gmail.com',
          message: 'Hello, looking for a twin-sharing room for the upcoming college semester. Can I visit this Saturday?',
          moveInDate: '2026-11-01',
          createdAt: '2026-10-12',
          status: 'Inquiry Sent'
        }
      ],
      addInquiry: (inquiryData) =>
        set((state) => ({
          inquiries: [
            {
              ...inquiryData,
              id: 'inq-' + Date.now(),
              createdAt: new Date().toISOString().split('T')[0],
              status: 'Inquiry Sent'
            },
            ...state.inquiries
          ]
        })),

      roommateRequests: [
        {
          id: 'req-demo-1',
          roommateId: 'rm-1',
          roommateName: 'Rohan Verma',
          message: 'Hey Rohan, saw your profile on Roommate.com! We have the same sleep schedule — up for grabbing a coffee sometime?',
          createdAt: '2026-10-13',
          status: 'Sent'
        }
      ],
      addRoommateRequest: (roommateId, roommateName, message) =>
        set((state) => ({
          roommateRequests: [
            {
              id: 'req-' + Date.now(),
              roommateId,
              roommateName,
              message,
              createdAt: new Date().toISOString().split('T')[0],
              status: 'Sent'
            },
            ...state.roommateRequests
          ]
        })),

      recentSearches: [
        DEFAULT_LOCATION,
        {
          name: 'Koramangala, Bengaluru',
          lat: 12.9352,
          lng: 77.6245,
          city: 'Bengaluru, Karnataka',
          displayName: 'Koramangala, Bengaluru, Karnataka, India'
        },
        {
          name: 'Delhi University North Campus',
          lat: 28.6923,
          lng: 77.2117,
          city: 'New Delhi',
          displayName: 'North Campus, University of Delhi, New Delhi'
        }
      ],
      addRecentSearch: (loc) =>
        set((state) => {
          const filtered = state.recentSearches.filter(
            (item) => item.name.toLowerCase() !== loc.name.toLowerCase()
          );
          return {
            recentSearches: [loc, ...filtered].slice(0, 6)
          };
        }),
      clearRecentSearches: () => set({ recentSearches: [] }),

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
        }))
    }),
    {
      name: 'roommate_platform_state_v1',
      partialize: (state) => ({
        darkMode: state.darkMode,
        selectedLocation: state.selectedLocation,
        radiusKm: state.radiusKm,
        userProfile: state.userProfile,
        isOnboarded: state.isOnboarded,
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
