/**
 * Tests for AddBathroom — form render, submit guards, geocode flow,
 * Supabase insert payload, success navigation, form reset, and amenity/access state.
 */
import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { AddBathroom } from '../../pages/AddBathroom';
import { mockColors, mockUser } from '../helpers/mocks';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('../../context/ThemeContext', () => ({
  useThemeContext: () => ({ colors: mockColors, isDark: false }),
}));

// mockCurrentUser starts with "mock" so Babel hoists it alongside jest.mock factories
let mockCurrentUser: typeof mockUser | null = mockUser;

jest.mock('../../context/UserContext', () => ({
  useUser: () => ({ user: mockCurrentUser, session: null, loading: false, signOut: jest.fn() }),
}));

const mockGeocodeAsync = jest.fn();

jest.mock('expo-location', () => ({
  geocodeAsync: (...args: any[]) => mockGeocodeAsync(...args),
}));

const mockInsert = jest.fn();
const mockRpc = jest.fn();

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: (...args: any[]) => mockInsert(...args),
    })),
    rpc: (...args: any[]) => mockRpc(...args),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockCurrentUser = mockUser;
  // Default: geocode succeeds with a single result
  mockGeocodeAsync.mockResolvedValue([{ latitude: 40.7128, longitude: -74.006 }]);
  // Default: insert succeeds
  mockInsert.mockResolvedValue({ error: null });
  // Default: no nearby bathrooms (no duplicate)
  mockRpc.mockResolvedValue({ data: [], error: null });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function renderAddBathroom() {
  return render(<AddBathroom />);
}

/** Fill the minimum required fields and submit the form. */
async function fillAndSubmit({
  title = 'Test Bathroom',
  address = '123 Main St',
} = {}) {
  const titleInput = screen.getByPlaceholderText('e.g. Starbucks on 5th Ave');
  const addressInput = screen.getByPlaceholderText('Street address or area');
  fireEvent.changeText(titleInput, title);
  fireEvent.changeText(addressInput, address);
  await act(async () => {
    fireEvent.press(screen.getByText('Submit bathroom →'));
  });
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------
describe('AddBathroom — initial render', () => {
  it('renders the page heading', () => {
    renderAddBathroom();
    expect(screen.getByText('add a bathroom')).toBeTruthy();
  });

  it('renders title and address inputs', () => {
    renderAddBathroom();
    expect(screen.getByPlaceholderText('e.g. Starbucks on 5th Ave')).toBeTruthy();
    expect(screen.getByPlaceholderText('Street address or area')).toBeTruthy();
  });

  it('renders the submit button', () => {
    renderAddBathroom();
    expect(screen.getByText('Submit bathroom →')).toBeTruthy();
  });

  it('renders all three access type chips', () => {
    renderAddBathroom();
    expect(screen.getByText('Public')).toBeTruthy();
    expect(screen.getByText('Key Required')).toBeTruthy();
    expect(screen.getByText('Purchase Required')).toBeTruthy();
  });

  it('renders the Open 24 hours toggle section', () => {
    renderAddBathroom();
    // SectionLabel renders label text uppercased
    expect(screen.getByText('OPEN 24 HOURS')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Submit disabled state
// ---------------------------------------------------------------------------
describe('AddBathroom — submit disabled during submission', () => {
  it('shows Submitting... and disables button while in-flight', async () => {
    let resolveInsert!: (val: any) => void;
    mockInsert.mockReturnValueOnce(new Promise((res) => { resolveInsert = res; }));

    renderAddBathroom();
    const titleInput = screen.getByPlaceholderText('e.g. Starbucks on 5th Ave');
    const addressInput = screen.getByPlaceholderText('Street address or area');
    fireEvent.changeText(titleInput, 'Test Bathroom');
    fireEvent.changeText(addressInput, '123 Main St');

    act(() => {
      fireEvent.press(screen.getByText('Submit bathroom →'));
    });

    // react-hook-form handleSubmit is async — wait for the state update
    await waitFor(() => expect(screen.getByText('Submitting...')).toBeDisabled());

    await act(async () => { resolveInsert({ error: null }); });
  });
});

// ---------------------------------------------------------------------------
// Geocode failure
// ---------------------------------------------------------------------------
describe('AddBathroom — geocode failure', () => {
  it('shows inline geocode error when no results are returned', async () => {
    mockGeocodeAsync.mockResolvedValueOnce([]);

    renderAddBathroom();
    await fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByText("Couldn't find that address. Try being more specific.")).toBeTruthy();
    });
  });

  it('does NOT call supabase.insert when geocode returns empty', async () => {
    mockGeocodeAsync.mockResolvedValueOnce([]);

    renderAddBathroom();
    await fillAndSubmit();

    await waitFor(() => {
      expect(mockInsert).not.toHaveBeenCalled();
    });
  });

  it('clears geocode error on retry with a valid address', async () => {
    mockGeocodeAsync.mockResolvedValueOnce([]);

    renderAddBathroom();
    await fillAndSubmit({ address: 'bad address' });

    await waitFor(() => {
      expect(screen.getByText("Couldn't find that address. Try being more specific.")).toBeTruthy();
    });

    // Second attempt with geocode succeeding
    mockGeocodeAsync.mockResolvedValueOnce([{ latitude: 40.7128, longitude: -74.006 }]);
    await fillAndSubmit({ address: '123 Main St' });

    await waitFor(() => {
      expect(screen.queryByText("Couldn't find that address. Try being more specific.")).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// Duplicate detection
// ---------------------------------------------------------------------------
describe('AddBathroom — duplicate detection', () => {
  it('checks for nearby bathrooms via the bathrooms_nearby RPC before inserting', async () => {
    renderAddBathroom();
    await fillAndSubmit();

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith(
        'bathrooms_nearby',
        expect.objectContaining({ user_lat: 40.7128, user_lng: -74.006 }),
      );
    });
  });

  it('does NOT insert immediately when a duplicate is found (prompts instead)', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [{ id: 'dupe-1', name: 'Existing Loo', lat: 40.7128, lng: -74.006 }],
      error: null,
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    renderAddBathroom();
    await fillAndSubmit();

    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    expect(alertSpy.mock.calls[0][0]).toBe('Possible duplicate');
    expect(mockInsert).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it('inserts when the user chooses "Add anyway" in the duplicate prompt', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [{ id: 'dupe-1', name: 'Existing Loo', lat: 40.7128, lng: -74.006 }],
      error: null,
    });
    // Auto-press the "Add anyway" button when the alert is shown.
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      const addAnyway = (buttons ?? []).find((b: any) => b.text === 'Add anyway');
      addAnyway?.onPress?.();
    });

    renderAddBathroom();
    await act(async () => {
      await fillAndSubmit();
    });

    await waitFor(() => expect(mockInsert).toHaveBeenCalled());
    alertSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Supabase insert — correct payload
// ---------------------------------------------------------------------------
describe('AddBathroom — Supabase insert payload', () => {
  it('calls insert with correct payload including lat/lng, tags, access_type, is_24_hours, and created_by', async () => {
    renderAddBathroom();

    // Select a tag
    fireEvent.press(screen.getByText('Handicap'));
    // is_24_hours stays false (default)

    await fillAndSubmit({ title: 'Corner Stall', address: '456 Broadway' });

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith({
        name: 'Corner Stall',
        address: '456 Broadway',
        lat: 40.7128,
        lng: -74.006,
        tags: ['Handicap'],
        access_type: 'public',
        is_24_hours: false,
        created_by: mockUser.id,
      });
    });
  });

  it('sends is_24_hours: true when toggle is switched on', async () => {
    renderAddBathroom();

    const toggle = screen.getByTestId('is-24-hours-toggle');
    fireEvent(toggle, 'valueChange', true);

    await fillAndSubmit();

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ is_24_hours: true }),
      );
    });
  });

  it('sends the selected access_type when chip is changed', async () => {
    renderAddBathroom();
    fireEvent.press(screen.getByText('Key Required'));

    await fillAndSubmit();

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ access_type: 'key_required' }),
      );
    });
  });
});

// ---------------------------------------------------------------------------
// Success path — navigation + form reset
// ---------------------------------------------------------------------------
describe('AddBathroom — success path', () => {
  it('navigates to Success screen on successful submit', async () => {
    renderAddBathroom();
    await fillAndSubmit();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Success');
    });
  });

  it('does NOT navigate when insert returns an error', async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: 'DB error' } });

    renderAddBathroom();
    await fillAndSubmit();

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// Insert error — Alert
// ---------------------------------------------------------------------------
describe('AddBathroom — insert error', () => {
  it('shows an Alert when Supabase insert returns an error', async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: 'constraint violation' } });
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');

    renderAddBathroom();
    await fillAndSubmit();

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Failed to submit bathroom. Please try again.');
    });
  });
});

// ---------------------------------------------------------------------------
// Geocode thrown exception (catch block)
// ---------------------------------------------------------------------------
describe('AddBathroom — geocode thrown exception', () => {
  it('shows "Something went wrong" Alert when geocodeAsync throws', async () => {
    mockGeocodeAsync.mockRejectedValueOnce(new Error('geocoding service unavailable'));
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');

    renderAddBathroom();
    await fillAndSubmit();

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Something went wrong. Please try again.');
    });
  });

  it('does NOT call supabase.insert when geocodeAsync throws', async () => {
    mockGeocodeAsync.mockRejectedValueOnce(new Error('geocoding service unavailable'));

    renderAddBathroom();
    await fillAndSubmit();

    await waitFor(() => {
      expect(mockInsert).not.toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// Form reset after success
// ---------------------------------------------------------------------------
describe('AddBathroom — form reset after success', () => {
  it('clears title and address fields after successful submit', async () => {
    renderAddBathroom();
    await fillAndSubmit({ title: 'Corner Stall', address: '456 Broadway' });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Success');
    });

    // Fields should be empty after reset()
    expect(screen.getByPlaceholderText('e.g. Starbucks on 5th Ave').props.value).toBe('');
    expect(screen.getByPlaceholderText('Street address or area').props.value).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Button re-enabled after error (finally block)
// ---------------------------------------------------------------------------
describe('AddBathroom — button re-enabled after error', () => {
  it('re-enables submit button after insert error', async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: 'DB error' } });

    renderAddBathroom();
    await fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByText('Submit bathroom →')).not.toBeDisabled();
    });
  });

  it('re-enables submit button after geocode throws', async () => {
    mockGeocodeAsync.mockRejectedValueOnce(new Error('geocode failed'));

    renderAddBathroom();
    await fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByText('Submit bathroom →')).not.toBeDisabled();
    });
  });
});

// ---------------------------------------------------------------------------
// Amenity toggle
// ---------------------------------------------------------------------------
describe('AddBathroom — amenity toggle', () => {
  it('selects an amenity tag when pressed', () => {
    renderAddBathroom();
    fireEvent.press(screen.getByText('Gender Neutral'));
    // Pressing again should deselect — no error thrown
    fireEvent.press(screen.getByText('Gender Neutral'));
  });

  it('sends selected tags in insert payload', async () => {
    renderAddBathroom();
    fireEvent.press(screen.getByText('Mirrors'));
    fireEvent.press(screen.getByText('Handicap'));

    await fillAndSubmit();

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ tags: expect.arrayContaining(['Mirrors', 'Handicap']) }),
      );
    });
  });
});

// ---------------------------------------------------------------------------
// Auth guard
// ---------------------------------------------------------------------------
describe('AddBathroom — auth guard', () => {
  it('shows "Session expired" Alert and does not call insert when user is null', async () => {
    mockCurrentUser = null;
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');

    renderAddBathroom();
    await fillAndSubmit();

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Session expired', 'Please sign in again.');
      expect(mockInsert).not.toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// Geocode timeout
// ---------------------------------------------------------------------------
describe('AddBathroom — geocode timeout', () => {
  // doNotFake nextTick so microtask flushing via `await new Promise(process.nextTick)`
  // works while setTimeout is still fake — lets async onSubmit reach Promise.race
  // before we advance the clock.
  beforeEach(() => { jest.useFakeTimers({ doNotFake: ['nextTick'] }); });
  afterEach(() => { jest.useRealTimers(); });

  async function submitAndTimeout() {
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Starbucks on 5th Ave'), 'Test Bathroom');
    fireEvent.changeText(screen.getByPlaceholderText('Street address or area'), '123 Main St');
    // Start submit — react-hook-form handleSubmit is async; don't await here
    act(() => { fireEvent.press(screen.getByText('Submit bathroom →')); });
    // Drain microtasks so onSubmit reaches the Promise.race await
    await new Promise(process.nextTick);
    // Fire the 10-second timer
    await act(async () => { jest.advanceTimersByTime(10001); });
  }

  it('shows "Something went wrong" Alert when geocodeAsync hangs past 10 seconds', async () => {
    mockGeocodeAsync.mockReturnValueOnce(new Promise(() => {}));
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');

    renderAddBathroom();
    await submitAndTimeout();

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Something went wrong. Please try again.');
    });
  });

  it('does NOT call insert when geocodeAsync times out', async () => {
    mockGeocodeAsync.mockReturnValueOnce(new Promise(() => {}));

    renderAddBathroom();
    await submitAndTimeout();

    await waitFor(() => {
      expect(mockInsert).not.toHaveBeenCalled();
    });
  });
});
