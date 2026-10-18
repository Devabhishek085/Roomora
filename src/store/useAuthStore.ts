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
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null; needsOtp?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  sendEmailOtp: (email: string, displayName?: string) => Promise<{ error: string | null }>;
  resendSignupOtp: (email: string) => Promise<{ error: string | null }>;
  verifyEmailOtp: (email: string, token: string, password?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<{ error: string | null }>;
  verifyPasswordResetOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
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

      // If user session is returned immediately (e.g. email confirmation disabled in Supabase)
      if (data.session && data.user) {
        set({ user: data.user, session: data.session });
        await get().refreshProfile();
        await get().refreshTokenBalance();
        set({ isLoading: false });
        return { error: null, needsOtp: false };
      }

      // If user created but session is null, an OTP verification code was emailed
      set({ isLoading: false });
      return { error: null, needsOtp: true };
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

  resendSignupOtp: async (email) => {
    if (!isSupabaseConfigured) {
      return { error: 'Backend not configured. Please set up Supabase credentials.' };
    }

    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.toLowerCase().trim()
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return { error: error.message };
      }

      set({ isLoading: false });
      return { error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to resend code';
      set({ error: msg, isLoading: false });
      return { error: msg };
    }
  },

  verifyEmailOtp: async (email, token, password) => {
    if (!isSupabaseConfigured) {
      return { error: 'Backend not configured. Please set up Supabase credentials.' };
    }

    set({ isLoading: true, error: null });

    try {
      // First try signup type (from registration with password)
      let { data, error } = await supabase.auth.verifyOtp({
        email: email.toLowerCase().trim(),
        token: token.trim(),
        type: 'signup'
      });

      // If error, retry with email type (from signInWithOtp / magic link)
      if (error) {
        const fallback = await supabase.auth.verifyOtp({
          email: email.toLowerCase().trim(),
          token: token.trim(),
          type: 'email'
        });
        if (!fallback.error) {
          data = fallback.data;
          error = null;
        }
      }

      if (error) {
        set({ error: error.message, isLoading: false });
        return { error: error.message };
      }

      // If a password was provided at registration, set it now so they can log in via password
      if (password) {
        try {
          const { error: pwdError } = await supabase.auth.updateUser({ password });
          if (pwdError) {
            console.warn('[AuthStore] Warning setting password on verification:', pwdError.message);
          }
        } catch (e) {
          console.warn('[AuthStore] Exception setting password:', e);
        }
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

  sendPasswordResetEmail: async (email) => {
    if (!isSupabaseConfigured) {
      return { error: 'Backend not configured. Please set up Supabase credentials.' };
    }

    set({ isLoading: true, error: null });

    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
        redirectTo: redirectUrl
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return { error: error.message };
      }

      set({ isLoading: false });
      return { error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send reset email';
      set({ error: msg, isLoading: false });
      return { error: msg };
    }
  },

  verifyPasswordResetOtp: async (email, token) => {
    if (!isSupabaseConfigured) {
      return { error: 'Backend not configured. Please set up Supabase credentials.' };
    }

    set({ isLoading: true, error: null });

    try {
      let { data, error } = await supabase.auth.verifyOtp({
        email: email.toLowerCase().trim(),
        token: token.trim(),
        type: 'recovery'
      });

      if (error) {
        const fallback = await supabase.auth.verifyOtp({
          email: email.toLowerCase().trim(),
          token: token.trim(),
          type: 'email'
        });
        if (!fallback.error) {
          data = fallback.data;
          error = null;
        }
      }

      if (error) {
        set({ error: error.message, isLoading: false });
        return { error: error.message };
      }

      if (data.user) {
        set({ user: data.user, session: data.session });
        await get().refreshProfile();
      }

      set({ isLoading: false });
      return { error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'OTP verification failed';
      set({ error: msg, isLoading: false });
      return { error: msg };
    }
  },

  updatePassword: async (password) => {
    if (!isSupabaseConfigured) {
      return { error: 'Backend not configured. Please set up Supabase credentials.' };
    }

    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        set({ error: error.message, isLoading: false });
        return { error: error.message };
      }

      set({ isLoading: false });
      return { error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update password';
      set({ error: msg, isLoading: false });
      return { error: msg };
    }
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

    if (error) {
      // If flat_images column does not exist yet in Supabase, retry without it
      if (error.message && error.message.includes('flat_images')) {
        const { flat_images, ...fallbackUpdates } = updates as any;
        const fallback = await supabase
          .from('profiles')
          .update({ ...fallbackUpdates, updated_at: new Date().toISOString() })
          .eq('id', user.id);
        if (fallback.error) return { error: fallback.error.message };
        await get().refreshProfile();
        return { error: null };
      }
      return { error: error.message };
    }

    await get().refreshProfile();
    return { error: null };
  },

  clearError: () => set({ error: null })
}));
