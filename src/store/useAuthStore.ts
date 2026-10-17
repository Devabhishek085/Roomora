import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { DbProfile, TokenBalance, AadhaarVerification } from '../types';

interface AuthState {
  user: User | null;
  session: Session | null;
  dbProfile: DbProfile | null;
  tokenBalance: TokenBalance | null;
  aadhaarStatus: AadhaarVerification | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  sendEmailOtp: (email: string, displayName?: string) => Promise<{ error: string | null }>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshTokenBalance: () => Promise<void>;
  updateProfile: (updates: Partial<DbProfile>) => Promise<{ error: string | null }>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  session: null,
  dbProfile: null,
  tokenBalance: null,
  aadhaarStatus: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: async () => {
    if (!isSupabaseConfigured) {
      set({ isInitialized: true });
      return;
    }

    set({ isLoading: true });

    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        set({ user: session.user, session });
        await get().refreshProfile();
        await get().refreshTokenBalance();
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (_event, session) => {
        set({ user: session?.user ?? null, session });
        if (session?.user) {
          await get().refreshProfile();
          await get().refreshTokenBalance();
        } else {
          set({ dbProfile: null, tokenBalance: null, aadhaarStatus: null });
        }
      });
    } catch (err) {
      console.error('[AuthStore] Initialize error:', err);
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  signUp: async (email, password, displayName) => {
    if (!isSupabaseConfigured) {
      return { error: 'Backend not configured. Please set up Supabase credentials.' };
    }

    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: { display_name: displayName }
        }
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return { error: error.message };
      }

      if (data.user) {
        set({ user: data.user, session: data.session });
        // Profile and tokens are auto-created via database trigger
        await get().refreshProfile();
        await get().refreshTokenBalance();
      }

      set({ isLoading: false });
      return { error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      set({ error: msg, isLoading: false });
      return { error: msg };
    }
  },

  signIn: async (email, password) => {
    if (!isSupabaseConfigured) {
      return { error: 'Backend not configured. Please set up Supabase credentials.' };
    }

    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return { error: error.message };
      }

      if (data.user) {
        set({ user: data.user, session: data.session });
        await get().refreshProfile();
        await get().refreshTokenBalance();
      }

      set({ isLoading: false });
      return { error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      set({ error: msg, isLoading: false });
      return { error: msg };
    }
  },

  sendEmailOtp: async (email, displayName) => {
    if (!isSupabaseConfigured) {
      return { error: 'Backend not configured. Please set up Supabase credentials.' };
    }

    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          shouldCreateUser: true,
          data: displayName ? { display_name: displayName } : undefined
        }
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return { error: error.message };
      }

      set({ isLoading: false });
      return { error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send OTP';
      set({ error: msg, isLoading: false });
      return { error: msg };
    }
  },

  verifyEmailOtp: async (email, token) => {
    if (!isSupabaseConfigured) {
      return { error: 'Backend not configured. Please set up Supabase credentials.' };
    }

    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.toLowerCase().trim(),
        token: token.trim(),
        type: 'email'
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return { error: error.message };
      }

      if (data.user) {
        set({ user: data.user, session: data.session });
        await get().refreshProfile();
        await get().refreshTokenBalance();
      }

      set({ isLoading: false });
      return { error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'OTP verification failed';
      set({ error: msg, isLoading: false });
      return { error: msg };
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    await supabase.auth.signOut();
    set({
      user: null,
      session: null,
      dbProfile: null,
      tokenBalance: null,
      aadhaarStatus: null,
      isLoading: false,
      error: null
    });
  },

  refreshProfile: async () => {
    const user = get().user;
    if (!user || !isSupabaseConfigured) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) {
      set({ dbProfile: profile as DbProfile });
    }

    // Aadhaar status
    const { data: aadhaar } = await supabase
      .from('aadhaar_verifications')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (aadhaar) {
      set({ aadhaarStatus: aadhaar as AadhaarVerification });
    }
  },

  refreshTokenBalance: async () => {
    const user = get().user;
    if (!user || !isSupabaseConfigured) return;

    const { data } = await supabase
      .from('token_balances')
      .select('balance, lifetime_granted')
      .eq('user_id', user.id)
      .single();

    if (data) {
      set({ tokenBalance: data as TokenBalance });
    }
  },

  updateProfile: async (updates) => {
    const user = get().user;
    if (!user) return { error: 'Not authenticated' };
    if (!isSupabaseConfigured) return { error: 'Backend not configured' };

    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) return { error: error.message };

    await get().refreshProfile();
    return { error: null };
  },

  clearError: () => set({ error: null })
}));
