/**
 * Tests for Profile — the stats hero. Focus: a failed count query must surface
 * a retry affordance instead of silently rendering 0s (FAF-23).
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Profile } from '../../pages/Profile';
import { mockColors, mockUser } from '../helpers/mocks';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useIsFocused: () => true,
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});

jest.mock('../../components/SkeletonProfileHero', () => {
  const { View } = require('react-native');
  return { SkeletonProfileHero: () => <View testID="skeleton-hero" /> };
});

jest.mock('../../components/ui/MenuItem', () => {
  const { Text } = require('react-native');
  return { MenuItem: ({ label }: any) => <Text>{label}</Text> };
});

jest.mock('../../components/ui/SectionLabel', () => {
  const { Text } = require('react-native');
  return { SectionLabel: ({ label }: any) => <Text>{label}</Text> };
});

jest.mock('../../context/ThemeContext', () => ({
  useThemeContext: () => ({ colors: mockColors, isDark: false }),
}));

const mockRefreshProfile = jest.fn();
jest.mock('../../context/UserContext', () => ({
  useUser: () => ({
    user: mockUser,
    profile: { username: 'testuser' },
    signOut: jest.fn(),
    refreshProfile: mockRefreshProfile,
  }),
}));

const mockCountEq = jest.fn();

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: (...args: any[]) => mockCountEq(...args),
      })),
    })),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockCountEq.mockResolvedValue({ count: 3, error: null });
});

describe('Profile — stats', () => {
  it('renders the stat counts once loaded', async () => {
    render(<Profile />);
    await waitFor(() => expect(screen.getByText('SAVED')).toBeTruthy());
    expect(screen.getByText('REVIEWS')).toBeTruthy();
    expect(screen.getByText('ADDED')).toBeTruthy();
    // Every count resolved to 3.
    expect(screen.getAllByText('3')).toHaveLength(3);
  });

  it('shows a retry affordance instead of 0s when a count query fails', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // One of the three count queries returns an error result.
    mockCountEq.mockResolvedValueOnce({ count: null, error: { message: 'boom' } });

    render(<Profile />);
    await waitFor(() => expect(screen.getByText("Couldn't load your stats")).toBeTruthy());
    // Never render a misleading stats row on failure.
    expect(screen.queryByText('SAVED')).toBeNull();

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Retry loading stats'));
    });

    await waitFor(() => expect(screen.getByText('SAVED')).toBeTruthy());
    expect(screen.queryByText("Couldn't load your stats")).toBeNull();
    errSpy.mockRestore();
  });
});
