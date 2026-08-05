import { createClient } from '@supabase/supabase-js';

const runtimeEnv = import.meta.env || {};
const supabaseUrl =
  runtimeEnv.VITE_SUPABASE_URL ||
  'https://hcijxrakfrvcksuanrdy.supabase.co';

const supabaseAnonKey =
  runtimeEnv.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_A7SHtwE7jpKGcP6yaPmcGw_mTJeodrN';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;
