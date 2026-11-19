/**
 * Tests for LocationSearch (FAF-28) — the minimal geocode search box.
 * Covers the submit (success), no-result, and error paths, plus the clear/reset
 * affordance. The map recentering/refetch it triggers is exercised via the
 * onLocationSelected / onReset callbacks (owned by the Map screen).
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import LocationSearch from '../../components/LocationSearch';
import { mockColors } from '../helpers/mocks';

jest.mock('../../context/ThemeContext', () => ({
  useThemeContext: () => ({ colors: mockColors, isDark: false }),
}));

const mockGeocodeAsync = jest.fn();

// In-memory AsyncStorage so recents persist within a test.
const mockStore: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (k: string) => mockStore[k] ?? null),
    setItem: jest.fn(async (k: string, v: string) => { mockStore[k] = v; }),
    removeItem: jest.fn(async (k: string) => { delete mockStore[k]; }),
  },
}));

jest.mock('expo-location', () => ({
  geocodeAsync: (...args: any[]) => mockGeocodeAsync(...args),
}));

const submit = (query: string) => {
  const input = screen.getByPlaceholderText('Search location');
  fireEvent.changeText(input, query);
  fireEvent(input, 'submitEditing');
};

beforeEach(() => {
  jest.clearAllMocks();
  for (const k of Object.keys(mockStore)) delete mockStore[k];
  // Default: geocode resolves to a single NYC result
  mockGeocodeAsync.mockResolvedValue([{ latitude: 40.7359, longitude: -73.9911 }]);
});

describe('LocationSearch — submit (success)', () => {
  it('geocodes the trimmed query and forwards the first result coordinates', async () => {
    const onLocationSelected = jest.fn();
    render(<LocationSearch onLocationSelected={onLocationSelected} onReset={jest.fn()} />);

    submit('  Union Square NYC  ');

    await waitFor(() => expect(onLocationSelected).toHaveBeenCalledWith(40.7359, -73.9911));
    expect(mockGeocodeAsync).toHaveBeenCalledWith('Union Square NYC');
  });

  it('does not show a no-result message on success', async () => {
    render(<LocationSearch onLocationSelected={jest.fn()} onReset={jest.fn()} />);

    submit('Union Square NYC');

    await waitFor(() => expect(mockGeocodeAsync).toHaveBeenCalled());
    expect(screen.queryByText(/Couldn't find that location/i)).toBeNull();
  });
});

describe('LocationSearch — no result', () => {
  it('shows an inline message and does not call onLocationSelected when geocode returns []', async () => {
    const onLocationSelected = jest.fn();
    mockGeocodeAsync.mockResolvedValueOnce([]);
    render(<LocationSearch onLocationSelected={onLocationSelected} onReset={jest.fn()} />);

    submit('asdfqwer nowhere');

    expect(await screen.findByText(/Couldn't find that location/i)).toBeTruthy();
    expect(onLocationSelected).not.toHaveBeenCalled();
  });
});

describe('LocationSearch — error path', () => {
  it('shows a retry message and does not call onLocationSelected when geocode throws', async () => {
    const onLocationSelected = jest.fn();
    mockGeocodeAsync.mockRejectedValueOnce(new Error('geocoding service unavailable'));
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<LocationSearch onLocationSelected={onLocationSelected} onReset={jest.fn()} />);

    submit('Union Square NYC');

    expect(await screen.findByText(/Couldn't search right now/i)).toBeTruthy();
    expect(onLocationSelected).not.toHaveBeenCalled();
    errSpy.mockRestore();
  });
});

describe('LocationSearch — empty query guard', () => {
  it('does not geocode when the query is only whitespace', () => {
    const onLocationSelected = jest.fn();
    render(<LocationSearch onLocationSelected={onLocationSelected} onReset={jest.fn()} />);

    submit('   ');

    expect(mockGeocodeAsync).not.toHaveBeenCalled();
    expect(onLocationSelected).not.toHaveBeenCalled();
  });
});

describe('LocationSearch — clear / reset', () => {
  it('has no clear button before typing', () => {
    render(<LocationSearch onLocationSelected={jest.fn()} onReset={jest.fn()} />);
    expect(screen.queryByLabelText('Clear search')).toBeNull();
  });

  it('reveals a clear button once text is entered', () => {
    render(<LocationSearch onLocationSelected={jest.fn()} onReset={jest.fn()} />);
    fireEvent.changeText(screen.getByPlaceholderText('Search location'), 'Brooklyn');
    expect(screen.getByLabelText('Clear search')).toBeTruthy();
  });

  it('calls onReset and clears the input after an active search is cleared', async () => {
    const onReset = jest.fn();
    render(<LocationSearch onLocationSelected={jest.fn()} onReset={onReset} />);

    submit('Union Square NYC');
    await waitFor(() => expect(mockGeocodeAsync).toHaveBeenCalled());

    fireEvent.press(screen.getByLabelText('Clear search'));

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(screen.getByPlaceholderText('Search location').props.value).toBe('');
  });

  it('does not call onReset when clearing un-searched text', () => {
    const onReset = jest.fn();
    render(<LocationSearch onLocationSelected={jest.fn()} onReset={onReset} />);

    fireEvent.changeText(screen.getByPlaceholderText('Search location'), 'typo');
    fireEvent.press(screen.getByLabelText('Clear search'));

    expect(onReset).not.toHaveBeenCalled();
  });
});

describe('LocationSearch — external reset (resetSignal)', () => {
  it('clears the box when resetSignal changes, without calling onReset', async () => {
    const onReset = jest.fn();
    const { rerender } = render(
      <LocationSearch onLocationSelected={jest.fn()} onReset={onReset} resetSignal={0} />,
    );
    submit('Union Square NYC');
    await waitFor(() => expect(screen.getByLabelText('Clear search')).toBeTruthy());

    // Parent bumps the signal (e.g. the ◎ recenter FAB reset). The box should clear,
    // but onReset must NOT fire — the parent already handled the map reset.
    rerender(<LocationSearch onLocationSelected={jest.fn()} onReset={onReset} resetSignal={1} />);

    expect(screen.getByPlaceholderText('Search location').props.value).toBe('');
    expect(screen.queryByLabelText('Clear search')).toBeNull();
    expect(onReset).not.toHaveBeenCalled();
  });
});

describe('LocationSearch — recent searches', () => {
  const focusEmpty = () => {
    const input = screen.getByPlaceholderText('Search location');
    fireEvent.changeText(input, '');
    fireEvent(input, 'focus');
  };

  it('remembers a successful search and offers it when the empty field is focused', async () => {
    render(<LocationSearch onLocationSelected={jest.fn()} onReset={jest.fn()} />);
    submit('Union Square');
    await waitFor(() => expect(mockStore['toodaloo.recentSearches']).toContain('Union Square'));

    focusEmpty();
    expect(screen.getByTestId('recent-searches')).toBeTruthy();
    expect(screen.getByLabelText('Search Union Square')).toBeTruthy();
  });

  it('loads persisted recents and re-runs one when tapped', async () => {
    mockStore['toodaloo.recentSearches'] = JSON.stringify(['Brooklyn', 'Soho']);
    const onLocationSelected = jest.fn();
    render(<LocationSearch onLocationSelected={onLocationSelected} onReset={jest.fn()} />);
    await waitFor(() => {
      focusEmpty();
      expect(screen.getByLabelText('Search Soho')).toBeTruthy();
    });

    fireEvent.press(screen.getByLabelText('Search Soho'));

    await waitFor(() => expect(onLocationSelected).toHaveBeenCalled());
    expect(mockGeocodeAsync).toHaveBeenCalledWith('Soho');
  });

  it('does not record failed searches, and Clear empties the list', async () => {
    mockStore['toodaloo.recentSearches'] = JSON.stringify(['Brooklyn']);
    mockGeocodeAsync.mockResolvedValueOnce([]);
    render(<LocationSearch onLocationSelected={jest.fn()} onReset={jest.fn()} />);
    submit('asdfgh');
    await screen.findByText(/Couldn't find that location/i);
    expect(mockStore['toodaloo.recentSearches']).not.toContain('asdfgh');

    focusEmpty();
    fireEvent.press(screen.getByLabelText('Clear recent searches'));
    await waitFor(() => expect(screen.queryByTestId('recent-searches')).toBeNull());
    expect(mockStore['toodaloo.recentSearches']).toBeUndefined();
  });
});
