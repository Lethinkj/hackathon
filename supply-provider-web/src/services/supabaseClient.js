import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const hasSupabaseConfig = Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
)

if (!hasSupabaseConfig) {
    console.warn('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not found. Set them in .env for realtime data.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
