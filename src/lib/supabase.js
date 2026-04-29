import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jzytphmoigscthbhefor.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_9gnSsGpYHDbGdtEWfeEMwA_7zSWzf9w'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
