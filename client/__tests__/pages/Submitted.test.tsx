/**
 * Tests for Submitted — populated list, empty state, and the retryable error
 * state (a failed fetch must not read as "nothing submitted").
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Submitted } from '../../pages/Submitted';
import { mockColors, mockUser } from '../helpers/mocks';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const ReactActual = require('react');
  return {
    useNavigation: () => ({ navigate: mockNavigate }),
    useFocusEffect: (cb: () => void) => ReactActual.useEffect(cb, []),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});

jest.mock('@shopify/flash-list', () => {
  const ReactActual = require('react');
  const { View } = require('react-native');
  return {
    FlashList: ({ data, renderItem, keyExtractor }: any) => (
      <View>
        {data.map((item: any) =>
          ReactActual.cloneElement(renderItem({ item }), { key: keyExtractor(item) }),
        )}
      </View>
    ),
  };
});

jest.mock('../../components/BathroomCard', () => {
  const { Text, Pressable } = require('react-native');
  return {
    BathroomCard: ({ data, onPress }: any) => (
      <Pressable onPress={onPress}>
        <Text>{data.name}</Text>
      </Pressable>
    ),
  };
});

jest.mock('../../components/BackButton', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: () => <View testID="back-button" /> };
});

jest.mock('../../context/ThemeContext', () => ({
  useThemeContext: () => ({ colors: mockColors, isDark: false }),
}));

jest.mock('../../context/UserContext', () => ({
  useUser: () => ({ user: mockUser, session: null, loading: false }),
}));

const mockSelectResult = jest.fn();

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: (...args: any[]) => mockSelectResult(...args),
        })),
      })),
    })),
  },
}));

const bathroomRows = [
  {
    id: 'bathroom-1',
    name: 'Test Bathroom',
    access_type: 'public',
    is_24_hours: true,
    rating_avg: 4.2,
    review_count: 12,
    lat: 40.7128,
    lng: -74.006,
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockSelectResult.mockResolvedValue({ data: bathroomRows, error: null });
});

describe('Submitted', () => {
  it('renders a card for each submitted bathroom', async () => {
    render(<Submitted />);
    await waitFor(() => expect(screen.getByText('Test Bathroom')).toBeTruthy());
  });

  it('shows the empty state when nothing is submitted', async () => {
    mockSelectResult.mockResolvedValue({ data: [], error: null });
    render(<Submitted />);
    await waitFor(() => expect(screen.getByText('Nothing submitted yet')).toBeTruthy());
  });

  it('shows a retryable error when the fetch fails, then recovers on retry', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockSelectResult.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });

    render(<Submitted />);
    await waitFor(() =>
      expect(screen.getByText("Couldn't load your submissions")).toBeTruthy(),
    );
    expect(screen.queryByText('Nothing submitted yet')).toBeNull();

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Retry loading submitted bathrooms'));
    });

    await waitFor(() => expect(screen.getByText('Test Bathroom')).toBeTruthy());
    errSpy.mockRestore();
  });
});
