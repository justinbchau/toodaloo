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
