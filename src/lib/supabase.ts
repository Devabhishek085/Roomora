import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Roomora] Supabase environment variables are not set. ' +
    'Copy .env.example to .env.local and fill in your Supabase project URL and anon key. ' +
    'The app will run in offline/demo mode until configured.'
  );
}

/**
 * Supabase client — uses anon key for client-side operations.
 * Row-Level Security is enforced at the database level.
 * Never expose the service_role key to the frontend.
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

/** Whether Supabase is actually configured */
export const isSupabaseConfigured =
  Boolean(supabaseUrl && !supabaseUrl.includes('placeholder') &&
           supabaseAnonKey && !supabaseAnonKey.includes('placeholder'));
