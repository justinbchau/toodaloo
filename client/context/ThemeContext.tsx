import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, Colors } from '../theme/colors';

/** 'system' follows the device (incl. iOS "Automatic" sunset switching). */
export type ThemePreference = 'system' | 'light' | 'dark';

type ThemeContextType = {
  colors: Colors;
  isDark: boolean;
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  /** Flip between explicit light/dark (kept for existing callers). */
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  colors: darkColors,
  isDark: true,
  preference: 'system',
  setPreference: () => {},
  toggleTheme: () => {},
});

const THEME_OVERRIDE_KEY = 'toodaloo.themeOverride';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  // Load the persisted preference once on mount. Older builds stored only
  // 'dark' | 'light'; anything else (or nothing) means follow the system.
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(THEME_OVERRIDE_KEY)
      .then((stored) => {
        if (active && (stored === 'dark' || stored === 'light' || stored === 'system')) {
          setPreferenceState(stored);
        }
      })
      .catch(() => {
        // Non-fatal: fall back to the system scheme.
      });
    return () => {
      active = false;
    };
  }, []);

  const scheme = preference === 'system' ? systemScheme ?? 'dark' : preference;
  const isDark = scheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const setPreference = (pref: ThemePreference) => {
    setPreferenceState(pref);
    AsyncStorage.setItem(THEME_OVERRIDE_KEY, pref).catch(() => {
      // Non-fatal: the in-memory preference still applies for this session.
    });
  };

  const toggleTheme = () => setPreference(isDark ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ colors, isDark, preference, setPreference, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeContext);
