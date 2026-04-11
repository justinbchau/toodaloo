import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHUNK_SIZE = 1800;

function sanitizeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9\-.]/g, '-').slice(0, 255);
}

// --- Web fallback (localStorage) ---
const webAdapter = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};

// --- Native adapter with chunking ---
const nativeAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const sk = sanitizeKey(key);
    const chunkCountStr = await SecureStore.getItemAsync(`${sk}.chunks`);
    if (chunkCountStr === null) {
      return SecureStore.getItemAsync(sk);
    }
    const chunkCount = parseInt(chunkCountStr, 10);
    const chunks: string[] = [];
    for (let i = 0; i < chunkCount; i++) {
      const chunk = await SecureStore.getItemAsync(`${sk}.chunk.${i}`);
      if (chunk === null) return null;
      chunks.push(chunk);
    }
    return chunks.join('');
  },

  setItem: async (key: string, value: string): Promise<void> => {
    const sk = sanitizeKey(key);
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(sk, value);
      // Clean up any old chunks from a previous large value
      await SecureStore.deleteItemAsync(`${sk}.chunks`).catch(() => {});
    } else {
      const chunkCount = Math.ceil(value.length / CHUNK_SIZE);
      for (let i = 0; i < chunkCount; i++) {
        await SecureStore.setItemAsync(
          `${sk}.chunk.${i}`,
          value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
        );
      }
      await SecureStore.setItemAsync(`${sk}.chunks`, String(chunkCount));
      // Clean up any old non-chunked entry
      await SecureStore.deleteItemAsync(sk).catch(() => {});
    }
  },

  removeItem: async (key: string): Promise<void> => {
    const sk = sanitizeKey(key);
    await SecureStore.deleteItemAsync(sk).catch(() => {});
    const chunkCountStr = await SecureStore.getItemAsync(`${sk}.chunks`);
    if (chunkCountStr !== null) {
      const chunkCount = parseInt(chunkCountStr, 10);
      for (let i = 0; i < chunkCount; i++) {
        await SecureStore.deleteItemAsync(`${sk}.chunk.${i}`).catch(() => {});
      }
      await SecureStore.deleteItemAsync(`${sk}.chunks`).catch(() => {});
    }
  },
};

// --- One-time migration from AsyncStorage → SecureStore ---
// Runs once on native after an update. Users with existing sessions stored
// in AsyncStorage will have them transparently migrated instead of being
// silently logged out.
export async function migrateAuthStorageIfNeeded(supabaseUrl: string): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    // Derive the Supabase storage key from the project URL
    // Supabase key format: sb-<project-ref>-auth-token
    const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
    const legacyKey = `sb-${projectRef}-auth-token`;

    const legacyValue = await AsyncStorage.getItem(legacyKey);
    if (legacyValue === null) return; // Nothing to migrate

    // Check if SecureStore already has this key (migration already ran)
    const sk = sanitizeKey(legacyKey);
    const existing = await SecureStore.getItemAsync(sk);
    if (existing !== null) {
      // Already migrated — clean up AsyncStorage copy
      await AsyncStorage.removeItem(legacyKey);
      return;
    }

    // Migrate: write to SecureStore, then remove from AsyncStorage
    await nativeAdapter.setItem(legacyKey, legacyValue);
    await AsyncStorage.removeItem(legacyKey);
  } catch {
    // Migration failure is non-fatal — user will just need to re-authenticate
  }
}

export const secureStorageAdapter = Platform.OS === 'web' ? webAdapter : nativeAdapter;
