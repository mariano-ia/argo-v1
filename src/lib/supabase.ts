import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL  as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Falls back to placeholder values when env vars are not configured yet.
// The client will simply fail silently on any network call.
export const supabase = createClient(
    supabaseUrl  ?? 'https://placeholder.supabase.co',
    supabaseKey  ?? 'placeholder-key',
);

export const supabaseConfigured = Boolean(supabaseUrl && supabaseKey);
