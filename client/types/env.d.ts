declare namespace NodeJS {
    interface ProcessEnv {
        // Inlined by Expo at build time (see lib/supabase.ts).
        EXPO_PUBLIC_SUPABASE_URL?: string;
        EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
    }
}

declare const __DEV__: boolean;
