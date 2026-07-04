import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, Colors } from '../theme/colors';

type ThemeContextType = {
  colors: Colors;
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  colors: darkColors,
  isDark: true,
  toggleTheme: () => {},
});

const THEME_OVERRIDE_KEY = 'toodaloo.themeOverride';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState<'dark' | 'light' | null>(null);

  // Load the persisted override once on mount.
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(THEME_OVERRIDE_KEY)
      .then((stored) => {
        if (active && (stored === 'dark' || stored === 'light')) {
          setOverride(stored);
        }
      })
      .catch(() => {
        // Non-fatal: fall back to the system scheme.
      });
    return () => {
      active = false;
    };
  }, []);

  const scheme = override ?? systemScheme ?? 'dark';
  const isDark = scheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const toggleTheme = () => {
    setOverride((prev) => {
      const next = prev === null ? (isDark ? 'light' : 'dark') : prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(THEME_OVERRIDE_KEY, next).catch(() => {
        // Non-fatal: the in-memory override still applies for this session.
      });
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ colors, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeContext);
