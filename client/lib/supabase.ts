import { createClient } from '@supabase/supabase-js';
import { secureStorageAdapter } from './secureStorageAdapter';

// Fail fast on missing config: a build without these env vars is completely
// broken, and silently falling back to placeholders only surfaces later as
// confusing network errors. Throw at module init with an actionable message
// instead. Values are EXPO_PUBLIC_-prefixed so Expo inlines them at build time.
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const missing = [
  ['EXPO_PUBLIC_SUPABASE_URL', SUPABASE_URL],
  ['EXPO_PUBLIC_SUPABASE_ANON_KEY', SUPABASE_ANON_KEY],
]
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    `Missing required Supabase env var(s): ${missing.join(', ')}. ` +
      'Set them in .env (see .env.example) for local/dev builds, or as EAS ' +
      'environment variables for production builds. Without them the app ' +
      'cannot reach Supabase and would ship bootable but non-functional.',
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: secureStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
