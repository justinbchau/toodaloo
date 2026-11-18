/**
 * Tests for ThemeProvider — System / Light / Dark preference resolution and
 * persistence (including the legacy 'dark' | 'light' stored values).
 */
import React from 'react';
import { Text } from 'react-native';
import { render, screen, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let mockScheme: 'light' | 'dark' | null = 'light';
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockScheme,
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn() },
}));

import { ThemeProvider, useThemeContext } from '../../context/ThemeContext';

let api: ReturnType<typeof useThemeContext>;
function Probe() {
  api = useThemeContext();
  return <Text testID="state">{`${api.preference}:${api.isDark ? 'dark' : 'light'}`}</Text>;
}

const renderProvider = async () => {
  render(<ThemeProvider><Probe /></ThemeProvider>);
  await act(async () => {});
};

beforeEach(() => {
  jest.clearAllMocks();
  mockScheme = 'light';
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
});

describe('ThemeProvider', () => {
  it('follows the device scheme by default', async () => {
    mockScheme = 'dark';
    await renderProvider();
    expect(screen.getByTestId('state')).toHaveTextContent('system:dark');
  });

  it('restores a legacy explicit preference', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('dark');
    await renderProvider();
    expect(screen.getByTestId('state')).toHaveTextContent('dark:dark');
  });

  it('persists and applies an explicit choice, and can return to system', async () => {
    await renderProvider();
    act(() => api.setPreference('dark'));
    expect(screen.getByTestId('state')).toHaveTextContent('dark:dark');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('toodaloo.themeOverride', 'dark');

    act(() => api.setPreference('system'));
    expect(screen.getByTestId('state')).toHaveTextContent('system:light');
    expect(AsyncStorage.setItem).toHaveBeenLastCalledWith('toodaloo.themeOverride', 'system');
  });
});
