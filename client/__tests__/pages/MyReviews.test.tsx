/**
 * Tests for MyReviews — list rendering, empty state, and the
 * edit / delete actions on each review card.
 */
import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { MyReviews } from '../../pages/MyReviews';
import { mockColors, mockUser } from '../helpers/mocks';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const ReactActual = require('react');
  return {
    useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate }),
    // Run the focus callback once on mount, mirroring initial-focus behavior.
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

jest.mock('../../components/BackButton', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: () => <View testID="back-button" /> };
});

jest.mock('../../context/ThemeContext', () => ({
  useThemeContext: () => ({ colors: mockColors, isDark: false }),
}));

jest.mock('../../context/UserContext', () => ({
  useUser: () => ({ user: mockUser, session: null, loading: false, signOut: jest.fn() }),
}));

const mockSelectResult = jest.fn();
const mockDeleteEq = jest.fn();

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      // Fetch: .select().eq().order()
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: (...args: any[]) => mockSelectResult(...args),
        })),
      })),
      // Delete: .delete().eq('id', ...)
      delete: jest.fn(() => ({
        eq: (...args: any[]) => mockDeleteEq(...args),
      })),
    })),
  },
}));

const reviewRows = [
  {
    id: 'review-1',
    rating: 4,
    body: 'Clean and accessible.',
    created_at: '2024-01-15T12:00:00.000Z',
    bathroom: { id: 'bathroom-1', name: 'Test Bathroom', lat: 40.7128, lng: -74.006 },
  },
  {
    id: 'review-2',
    rating: 2,
    body: null,
    created_at: '2024-02-20T12:00:00.000Z',
    bathroom: { id: 'bathroom-2', name: 'Other Bathroom', lat: 40.72, lng: -74.01 },
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockSelectResult.mockResolvedValue({ data: reviewRows, error: null });
  mockDeleteEq.mockResolvedValue({ error: null });
});

async function renderMyReviews() {
  const result = render(<MyReviews />);
  await waitFor(() => expect(screen.getByText('Test Bathroom')).toBeTruthy());
  return result;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('MyReviews — list rendering', () => {
  it('renders one card per review with bathroom names', async () => {
    await renderMyReviews();
    expect(screen.getByText('Test Bathroom')).toBeTruthy();
    expect(screen.getByText('Other Bathroom')).toBeTruthy();
  });

  it('renders the review body when present', async () => {
    await renderMyReviews();
    expect(screen.getByText('Clean and accessible.')).toBeTruthy();
  });

  it('shows the empty state when there are no reviews', async () => {
    mockSelectResult.mockResolvedValue({ data: [], error: null });
    render(<MyReviews />);
    await waitFor(() => expect(screen.getByText('No reviews yet')).toBeTruthy());
  });

  it('navigates to BathroomDetail when a card is pressed', async () => {
    await renderMyReviews();
    fireEvent.press(screen.getByText('Test Bathroom'));
    expect(mockNavigate).toHaveBeenCalledWith('BathroomDetail', {
      id: 'bathroom-1',
      name: 'Test Bathroom',
      lat: 40.7128,
      lng: -74.006,
    });
  });
});

describe('MyReviews — error state', () => {
  it('shows a retryable error when the fetch fails, then recovers on retry', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // First (focus) fetch fails; the default success mock covers the retry.
    mockSelectResult.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });

    render(<MyReviews />);
    await waitFor(() => expect(screen.getByText("Couldn't load your reviews")).toBeTruthy());
    // Not the empty state — the failure must not read as "no reviews".
    expect(screen.queryByText('No reviews yet')).toBeNull();

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Retry loading reviews'));
    });

    await waitFor(() => expect(screen.getByText('Test Bathroom')).toBeTruthy());
    expect(screen.queryByText("Couldn't load your reviews")).toBeNull();
    errSpy.mockRestore();
  });
});

describe('MyReviews — edit action', () => {
  it('navigates to WriteReview with the bathroom params', async () => {
    await renderMyReviews();

    fireEvent.press(screen.getAllByText('Edit')[0]);

    expect(mockNavigate).toHaveBeenCalledWith('WriteReview', {
      bathroomId: 'bathroom-1',
      bathroomName: 'Test Bathroom',
    });
  });
});

describe('MyReviews — delete action', () => {
  it('asks for confirmation before deleting', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    await renderMyReviews();

    fireEvent.press(screen.getAllByText('Delete')[0]);

    expect(alertSpy).toHaveBeenCalledWith(
      'Delete review?',
      expect.stringContaining('Test Bathroom'),
      expect.any(Array),
    );
    expect(mockDeleteEq).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('deletes the review and removes it from the list on confirm', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      const confirm = buttons?.find((b) => b.style === 'destructive');
      confirm?.onPress?.();
    });

    await renderMyReviews();

    await act(async () => {
      fireEvent.press(screen.getAllByText('Delete')[0]);
    });

    expect(mockDeleteEq).toHaveBeenCalledWith('id', 'review-1');
    await waitFor(() => expect(screen.queryByText('Test Bathroom')).toBeNull());
    expect(screen.getByText('Other Bathroom')).toBeTruthy();
    alertSpy.mockRestore();
  });

  it('keeps the review and shows an error alert when the delete fails', async () => {
    mockDeleteEq.mockResolvedValue({ error: { message: 'DB error' } });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, _m, buttons) => {
      // Auto-confirm only the initial confirmation dialog.
      if (title === 'Delete review?') {
        buttons?.find((b) => b.style === 'destructive')?.onPress?.();
      }
    });

    await renderMyReviews();

    await act(async () => {
      fireEvent.press(screen.getAllByText('Delete')[0]);
    });

    expect(mockDeleteEq).toHaveBeenCalled();
    expect(screen.getByText('Test Bathroom')).toBeTruthy();
    expect(alertSpy).toHaveBeenCalledWith('Error', expect.any(String));
    alertSpy.mockRestore();
  });
});
