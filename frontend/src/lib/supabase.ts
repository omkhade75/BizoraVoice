import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vsmlvtrwgkpwxwhatbhx.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_rbGRKU6uSNzFJBZNBxPnbQ_QjdNbWVZ';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'implicit',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'bv_sb_auth_token',
      },
    });
  }
  return supabaseInstance;
}

export const supabase = getSupabase();
