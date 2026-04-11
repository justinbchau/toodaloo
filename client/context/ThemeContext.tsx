import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';
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

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState<'dark' | 'light' | null>(null);

  const scheme = override ?? systemScheme ?? 'dark';
  const isDark = scheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const toggleTheme = () => {
    setOverride(prev => {
      if (prev === null) return isDark ? 'light' : 'dark';
      return prev === 'dark' ? 'light' : 'dark';
    });
  };

  return (
    <ThemeContext.Provider value={{ colors, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeContext);
