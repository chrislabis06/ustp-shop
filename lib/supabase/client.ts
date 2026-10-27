import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseConfig } from '@/lib/supabase/config'

export function createClient() {
  const config = getSupabaseConfig()
  if (!config) throw new Error('Authentication is not configured. Set the Supabase URL and publishable key.')

  return createBrowserClient(config.supabaseUrl, config.supabaseKey)
}