import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Client is safe to expose — protected by Supabase RLS policies
export const supabase = createClient(supabaseUrl, supabaseKey);
