import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://hcijxrakfrvcksuanrdy.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
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

if (typeof window !== 'undefined' && supabase) {
  window.mayfitSupabase = supabase;
  import('../workout-plan-sync.js').catch(error =>
    console.error('Falha ao iniciar sincronização das fichas:', error)
  );
  import('../workout-assignment-ui.js').catch(error =>
    console.error('Falha ao iniciar atribuição de treinos:', error)
  );
}
