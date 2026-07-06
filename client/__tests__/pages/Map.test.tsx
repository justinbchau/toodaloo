/**
 * Tests for the Map screen's location/fetch wiring (FAF-28).
 *
 * The MapView, geocoding, and the LocationSearch box are mocked; what's asserted
 * is the orchestration that has no other coverage:
 *   - initial fetch happens around the GPS fix
 *   - a search fetches around the searched center and repoints the ctx anchor,
 *     while the GPS fix (used by the ◎ FAB / reset) is untouched
 *   - Retry after a *failed* search targets the searched center, not the last
 *     successful one (the lastRequestedCenter fix)
 *   - the ◎ recenter FAB runs the full reset (refetch GPS + restore anchor) and
 *     bumps the search box's resetSignal
 *
 * The permission effect resolves through a chain of awaited promises, so we drain
 * the microtask queue inside act() (setImmediate) to commit the granted map before
 * querying/interacting. supabase.rpc is invoked synchronously inside the fetch, so
 * its call is recorded the moment a handler fires; the flush after a press only
 * settles the post-await state (e.g. the error banner) and silences act warnings.
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { Map } from '../../pages/Map';
import { mockColors } from '../helpers/mocks';

const GPS = { lat: 40.75, lng: -73.98 };
const SEARCH = { lat: 41.0, lng: -73.0 };

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('../../context/ThemeContext', () => ({
  useThemeContext: () => ({ colors: mockColors, isDark: false }),
}));

const mockSetCenter = jest.fn();
jest.mock('../../context/context', () => {
  const React = require('react');
  // Delegate (don't capture mockSetCenter here — createContext runs before the
  // `const` initializes, which would freeze `setCenter` as undefined).
  return { LocationCtx: React.createContext({ center: null, setCenter: (...a: any[]) => mockSetCenter(...a) }) };
});

const mockRequestPerms = jest.fn();
const mockGetPosition = jest.fn();
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: () => mockRequestPerms(),
  getCurrentPositionAsync: () => mockGetPosition(),
}));

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  // forwardRef + imperative handle so mapRef.current.animateToRegion is a no-op fn.
  const MockMapView = React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({ animateToRegion: jest.fn() }));
    return <View {...props} />;
  });
  return { __esModule: true, default: MockMapView, Marker: View };
});
jest.mock('lottie-react-native', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: (props: any) => <View {...props} /> };
});
jest.mock('../../components/BathroomSheet', () => ({
  BathroomSheet: () => {
    const { View } = require('react-native');
    return <View testID="bathroom-sheet" />;
  },
}));
jest.mock('../../components/ui/Chip', () => ({
  Chip: ({ label }: any) => {
    const { Text } = require('react-native');
    return <Text>{label}</Text>;
  },
}));

// LocationSearch: expose test handles for the callbacks + the resetSignal it receives.
jest.mock('../../components/LocationSearch', () => {
  const { View, Text, Pressable } = require('react-native');
  return {
    __esModule: true,
    default: (props: any) => (
      <View>
        <Pressable testID="ls-search" onPress={() => props.onLocationSelected(41.0, -73.0)}>
          <Text>search</Text>
        </Pressable>
        <Pressable testID="ls-reset" onPress={() => props.onReset()}>
          <Text>reset</Text>
        </Pressable>
        <Text testID="ls-reset-signal">{String(props.resetSignal)}</Text>
      </View>
    ),
  };
});

const mockRpc = jest.fn();
jest.mock('../../lib/supabase', () => ({
  supabase: { rpc: (...args: any[]) => mockRpc(...args) },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockRequestPerms.mockResolvedValue({ status: 'granted' });
  mockGetPosition.mockResolvedValue({
    coords: { latitude: GPS.lat, longitude: GPS.lng },
    timestamp: 0,
  });
  mockRpc.mockResolvedValue({ data: [], error: null });
});

const nearbyArgs = (lat: number, lng: number) =>
  expect.objectContaining({ user_lat: lat, user_lng: lng });

// Drain the microtask queue inside act() so the async permission effect + any
// pending fetch commit their state before we query/interact.
const flush = async () => {
  for (let i = 0; i < 6; i++) {
    await act(async () => { await new Promise<void>((r) => setImmediate(() => r())); });
  }
};

// Render and advance to the granted map with its initial GPS fetch done.
async function renderMap() {
  render(<Map />);
  await flush();
  screen.getByTestId('ls-search'); // granted map committed
  expect(mockRpc).toHaveBeenCalledWith('bathrooms_nearby', nearbyArgs(GPS.lat, GPS.lng));
}

describe('Map — initial fetch', () => {
  it('fetches bathrooms_nearby around the GPS fix once location is acquired', async () => {
    await renderMap();
  });
});

describe('Map — search wiring', () => {
  it('fetches around the searched center and repoints the ctx anchor there', async () => {
    await renderMap();
    mockRpc.mockClear();

    fireEvent.press(screen.getByTestId('ls-search'));
    await flush();

    expect(mockRpc).toHaveBeenCalledWith('bathrooms_nearby', nearbyArgs(SEARCH.lat, SEARCH.lng));
    expect(mockSetCenter).toHaveBeenCalledWith({ lat: SEARCH.lat, lng: SEARCH.lng });
  });

  it('reset returns the fetch + anchor to the GPS fix', async () => {
    await renderMap();
    fireEvent.press(screen.getByTestId('ls-search'));
    await flush();
    mockRpc.mockClear();

    fireEvent.press(screen.getByTestId('ls-reset'));
    await flush();

    expect(mockRpc).toHaveBeenCalledWith('bathrooms_nearby', nearbyArgs(GPS.lat, GPS.lng));
    expect(mockSetCenter).toHaveBeenLastCalledWith({ lat: GPS.lat, lng: GPS.lng });
  });
});

describe('Map — retry targets the searched center', () => {
  it('retries a failed search fetch against the searched center, not the last success', async () => {
    await renderMap();

    // The search-triggered fetch fails → the error banner appears (state set post-await).
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'network' } });
    fireEvent.press(screen.getByTestId('ls-search'));
    await flush();
    expect(screen.getByText(/Couldn't load nearby bathrooms/i)).toBeTruthy();

    mockRpc.mockClear();
    fireEvent.press(screen.getByText('Retry'));
    await flush();

    expect(mockRpc).toHaveBeenCalledWith('bathrooms_nearby', nearbyArgs(SEARCH.lat, SEARCH.lng));
  });
});

describe('Map — recenter (◎) FAB', () => {
  it('runs the full reset (refetch GPS + restore anchor) and bumps the search resetSignal', async () => {
    await renderMap();
    fireEvent.press(screen.getByTestId('ls-search'));
    await flush();
    const signalBefore = Number(screen.getByTestId('ls-reset-signal').props.children);
    mockRpc.mockClear();

    fireEvent.press(screen.getByText('◎'));
    await flush();

    expect(mockRpc).toHaveBeenCalledWith('bathrooms_nearby', nearbyArgs(GPS.lat, GPS.lng));
    expect(mockSetCenter).toHaveBeenLastCalledWith({ lat: GPS.lat, lng: GPS.lng });
    expect(Number(screen.getByTestId('ls-reset-signal').props.children)).toBe(signalBefore + 1);
  });
});
