/**
 * Tests for BathroomDetail — save toggle, distance display,
 * review states, action button navigation/sharing.
 */
import React from 'react';
import { Share, Linking } from 'react-native';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { BathroomDetail } from '../../pages/BathroomDetail';
import { mockColors, mockBathroomData, mockReview, createQueryMock } from '../helpers/mocks';

// ---------------------------------------------------------------------------
// Static mocks (use only inline values — jest.mock factories are hoisted
// before any const declarations, so references to outer variables are unsafe
// unless they start with "mock" AND come from imports)
// ---------------------------------------------------------------------------
const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const ReactActual = require('react');
  return {
    useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate }),
    useRoute: () => ({
      params: { id: 'bathroom-1', name: 'Test Bathroom', lat: 40.7128, lng: -74.006 },
    }),
    // Run the focus callback once on mount, mirroring initial-focus behavior.
    useFocusEffect: (cb: () => void) => ReactActual.useEffect(cb, []),
  };
});

jest.mock('../../context/ThemeContext', () => ({
  useThemeContext: () => ({
    colors: {
      bg: '#0B0B0F', surface1: '#111118', surface2: '#18181F', surface3: '#1E1E28',
      text1: '#EEEEF4', text2: '#8B8B9E', text3: '#44444F',
      purple: '#7B6EF6', purpleDim: 'rgba(123,110,246,0.16)',
      purpleText: '#A99FF9', purpleGlow: 'rgba(123,110,246,0.35)',
      border: '#1E1E28', borderMed: '#2A2A35',
      green: '#34C77A', red: '#F05A5A', yellow: '#F5C542',
    },
    isDark: false,
  }),
}));

jest.mock('../../context/UserContext', () => ({
  useUser: () => ({
    user: { id: 'test-user-id-123', email: 'test@example.com' },
    session: null,
    loading: false,
    signOut: jest.fn(),
  }),
}));

jest.mock('../../context/context', () => {
  const React = require('react');
  return {
    LocationCtx: React.createContext({
      location: {
        coords: {
          latitude: 40.7128, longitude: -74.006,
          altitude: 0, accuracy: 10, altitudeAccuracy: 0, heading: 0, speed: 0,
        },
        timestamp: 0,
      },
      setLocation: jest.fn(),
    }),
  };
});

jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  const MockMapView = (props: any) => <View {...props} />;
  return { __esModule: true, default: MockMapView, Marker: View };
});

jest.mock('../../components/SkeletonReviewCard', () => ({
  SkeletonReviewCard: () => {
    const { View } = require('react-native');
    return <View testID="skeleton-review-card" />;
  },
}));

jest.mock('../../components/ui/Chip', () => ({
  Chip: ({ label }: any) => {
    const { Text } = require('react-native');
    return <Text>{label}</Text>;
  },
}));

jest.mock('../../components/ui/SectionLabel', () => ({
  SectionLabel: ({ label }: any) => {
    const { Text } = require('react-native');
    return <Text>{label}</Text>;
  },
}));

// Supabase mock
const mockFrom = jest.fn();

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
  },
}));

// ---------------------------------------------------------------------------
// Default mock setup
// ---------------------------------------------------------------------------
function setupDefaultMocks(overrides: { bathroom?: any; reviews?: any[]; saved?: any } = {}) {
  const bathroom = overrides.bathroom ?? mockBathroomData;
  const reviews = overrides.reviews ?? [mockReview];
  const saved = overrides.saved ?? null;

  mockFrom.mockImplementation((table: string) => {
    if (table === 'bathrooms') return createQueryMock({ data: bathroom, error: null });
    if (table === 'reviews_with_authors') return createQueryMock({ data: reviews, error: null });
    if (table === 'saved_bathrooms') return createQueryMock({ data: saved, error: null });
    return createQueryMock({ data: null, error: null });
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  setupDefaultMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('BathroomDetail — populated state', () => {
  it('renders the bathroom name after data loads', async () => {
    render(<BathroomDetail />);
    await waitFor(() => expect(screen.getByText('Test Bathroom')).toBeTruthy());
  });

  it('shows the Open badge when is_24_hours=true', async () => {
    render(<BathroomDetail />);
    await waitFor(() => expect(screen.getByText('Open')).toBeTruthy());
  });

  it('hides the Open badge when is_24_hours=false', async () => {
    setupDefaultMocks({ bathroom: { ...mockBathroomData, is_24_hours: false } });
    render(<BathroomDetail />);
    await waitFor(() => expect(screen.getByText('Test Bathroom')).toBeTruthy());
    expect(screen.queryByText('Open')).toBeNull();
  });

  it('shows distance computed from haversine when location matches route coords', async () => {
    // Same coords as route params (40.7128, -74.006) → 0 ft
    render(<BathroomDetail />);
    await waitFor(() => expect(screen.getByText('Test Bathroom')).toBeTruthy());
    expect(screen.getByText('0 ft away')).toBeTruthy();
  });

  it('shows star rating from bathroom data', async () => {
    // rating_avg=4.2 → rounded to 4 → ★★★★☆
    // Both the header rating AND the review card use star strings, so multiple may match
    render(<BathroomDetail />);
    await waitFor(() => expect(screen.getAllByText('★★★★☆').length).toBeGreaterThanOrEqual(1));
  });

  it('shows review count from bathroom data', async () => {
    render(<BathroomDetail />);
    await waitFor(() => expect(screen.getByText(/12 reviews/)).toBeTruthy());
  });
});

describe('BathroomDetail — review states', () => {
  it('shows review body text when reviews are loaded', async () => {
    render(<BathroomDetail />);
    await waitFor(() => expect(screen.getByText('Clean and accessible.')).toBeTruthy());
  });

  it('shows "No reviews yet." when reviews is empty', async () => {
    setupDefaultMocks({ reviews: [] });
    render(<BathroomDetail />);
    await waitFor(() => expect(screen.getByText('No reviews yet.')).toBeTruthy());
  });

  it('shows the "Be the first!" sub-text in empty reviews state', async () => {
    setupDefaultMocks({ reviews: [] });
    render(<BathroomDetail />);
    await waitFor(() => expect(screen.getByText('Be the first!')).toBeTruthy());
  });

  it('shows "Write First Review" CTA in empty reviews state', async () => {
    setupDefaultMocks({ reviews: [] });
    render(<BathroomDetail />);
    await waitFor(() => expect(screen.getByText('Write First Review')).toBeTruthy());
  });

  it('"Write First Review" navigates to WriteReview screen', async () => {
    setupDefaultMocks({ reviews: [] });
    render(<BathroomDetail />);
    await waitFor(() => expect(screen.getByText('Write First Review')).toBeTruthy());

    fireEvent.press(screen.getByText('Write First Review'));
    expect(mockNavigate).toHaveBeenCalledWith('WriteReview', {
      bathroomId: 'bathroom-1',
      bathroomName: 'Test Bathroom',
    });
  });
});

describe('BathroomDetail — action buttons', () => {
  it('navigates to WriteReview when Review button is pressed', async () => {
    render(<BathroomDetail />);
    await waitFor(() => expect(screen.getByText('Test Bathroom')).toBeTruthy());

    fireEvent.press(screen.getByText('Review'));

    expect(mockNavigate).toHaveBeenCalledWith('WriteReview', {
      bathroomId: 'bathroom-1',
      bathroomName: 'Test Bathroom',
    });
  });

  it('calls Share.share when Share button is pressed', async () => {
    const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as any);
    render(<BathroomDetail />);
    await waitFor(() => expect(screen.getByText('Test Bathroom')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByText('Share'));
    });

    expect(shareSpy).toHaveBeenCalledWith({
      message: 'Check out Test Bathroom on TooDaLoo!',
    });
    shareSpy.mockRestore();
  });

  it('calls Linking.openURL with mailto when Report is pressed', async () => {
    const linkingSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    render(<BathroomDetail />);
    await waitFor(() => expect(screen.getByText('Test Bathroom')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByText('Report'));
    });

    expect(linkingSpy).toHaveBeenCalledWith(
      expect.stringContaining('mailto:'),
    );
    linkingSpy.mockRestore();
  });

  it('calls navigation.goBack when back button is pressed', async () => {
    render(<BathroomDetail />);
    await waitFor(() => expect(screen.getByText('Test Bathroom')).toBeTruthy());

    fireEvent.press(screen.getByText('‹'));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});

describe('BathroomDetail — save toggle', () => {
  it('renders the Save button', async () => {
    render(<BathroomDetail />);
    await waitFor(() => expect(screen.getByText('Save')).toBeTruthy());
  });

  it('calls saved_bathrooms.insert when Save is pressed (unsaved state)', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    const mockDelete = jest.fn().mockResolvedValue({ error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'bathrooms') return createQueryMock({ data: mockBathroomData, error: null });
      if (table === 'reviews_with_authors') return createQueryMock({ data: [], error: null });
      if (table === 'saved_bathrooms') {
        // For checkSaved (maybeSingle) — not saved
        // For insert — track call
        const chain: any = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          insert: mockInsert,
          delete: jest.fn(() => ({
            eq: jest.fn().mockReturnThis(),
            then: (r: any) => Promise.resolve({ data: null, error: null }).then(r),
            catch: (r: any) => Promise.resolve({ data: null, error: null }).catch(r),
            finally: (r: any) => Promise.resolve({ data: null, error: null }).finally(r),
          })),
          then: (r: any) => Promise.resolve({ data: null, error: null }).then(r),
          catch: (r: any) => Promise.resolve({ data: null, error: null }).catch(r),
          finally: (r: any) => Promise.resolve({ data: null, error: null }).finally(r),
        };
        return chain;
      }
      return createQueryMock({ data: null, error: null });
    });

    render(<BathroomDetail />);
    await waitFor(() => expect(screen.getByText('Test Bathroom')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByText('Save'));
    });

    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'test-user-id-123',
      bathroom_id: 'bathroom-1',
    });
  });
});
