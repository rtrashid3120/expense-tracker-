import { createClient } from '@supabase/supabase-js'

// Supabase public (anon) credentials - safe for frontend embedding
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fmnahchdscuosazwaatx.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_4baC_Dz1BdTUCnkhy2u_AA_D6REU5Zr'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
