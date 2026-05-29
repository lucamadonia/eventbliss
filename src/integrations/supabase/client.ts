// Auth-token storage uses Capacitor Preferences on native, localStorage on web.
// See storage-adapter.ts for the privacy/security rationale (GDPR Art. 32).
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { getAuthStorage } from './storage-adapter';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: getAuthStorage(),
    persistSession: true,
    autoRefreshToken: true,
    flowType: 'pkce',
  }
});