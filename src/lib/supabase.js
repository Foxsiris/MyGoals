import { createClient } from '@supabase/supabase-js'

// Publishable (anon) key — safe for the client; access is governed by RLS.
// Falls back to the project's real values so the app runs without env setup.
const url =
  import.meta.env.VITE_SUPABASE_URL || 'https://pmfhvsbhfbwnbkhkhhga.supabase.co'
const key =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_3u-72x9aAEzlOGyFdn7Aow_GB9NrjAf'

export const supabase = createClient(url, key)
