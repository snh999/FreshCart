import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vrhpittnhrpooppzgvco.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_nVDgMLtIhRVqUmQ2O3J6PQ_GtVm0ud5';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
