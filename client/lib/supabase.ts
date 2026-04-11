// Install required packages before using this file:
//   npx expo install @supabase/supabase-js
//   npx expo install @react-native-async-storage/async-storage

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace these with your actual Supabase project values
// Found at: https://app.supabase.com → Project Settings → API
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
