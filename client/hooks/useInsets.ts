import { useContext } from 'react';
import { SafeAreaInsetsContext, EdgeInsets } from 'react-native-safe-area-context';

const FALLBACK: EdgeInsets = { top: 0, bottom: 0, left: 0, right: 0 };

/**
 * Safe-area insets that degrade to zeros when no SafeAreaProvider is mounted
 * (unit tests, isolated previews) instead of throwing like useSafeAreaInsets.
 */
export function useInsets(): EdgeInsets {
  return useContext(SafeAreaInsetsContext) ?? FALLBACK;
}
