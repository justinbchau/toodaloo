/**
 * Shared mock factories for the TooDaLoo test suite.
 * Import what you need — don't rely on Jest automocking.
 */

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------
export const mockColors = {
  bg: '#0B0B0F',
  primary: '#F1F3F2',
  onPrimary: '#0B0D0D',
  onAccent: '#04211D',
  cardBorder: 'rgba(255,255,255,0.05)',
  surface1: '#111118',
  surface2: '#18181F',
  surface3: '#1E1E28',
  text1: '#EEEEF4',
  text2: '#8B8B9E',
  text3: '#44444F',
  accent: '#7B6EF6',
  accentDim: 'rgba(123,110,246,0.16)',
  accentText: '#A99FF9',
  accentGlow: 'rgba(123,110,246,0.35)',
  border: '#1E1E28',
  borderMed: '#2A2A35',
  green: '#34C77A',
  red: '#F05A5A',
  yellow: '#F5C542',
};

// ---------------------------------------------------------------------------
// Supabase chainable query builder
//
// The real Supabase client uses a PostgrestBuilder that is "thenable" — you
// can `await` the builder directly. This mock replicates that so that:
//   await supabase.from('x').select('*').eq('id', id)     → { data, error }
//   await supabase.from('x').delete().eq('id', id)         → { data, error }
//   await supabase.from('x').select('*').eq('id', id).single() → { data, error }
// ---------------------------------------------------------------------------
export function createQueryMock(
  response: { data: any; error: any } = { data: null, error: null },
) {
  const resolved = Promise.resolve(response);
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    // Terminating methods
    single: jest.fn().mockReturnValue(resolved),
    maybeSingle: jest.fn().mockReturnValue(resolved),
    // Make the chain itself awaitable (thenable)
    then: (onFulfilled: any, onRejected?: any) => resolved.then(onFulfilled, onRejected),
    catch: (onRejected: any) => resolved.catch(onRejected),
    finally: (onFinally: any) => resolved.finally(onFinally),
  };
  return chain;
}

// ---------------------------------------------------------------------------
// User / Session fixtures
// ---------------------------------------------------------------------------
export const mockUser = {
  id: 'test-user-id-123',
  email: 'test@example.com',
  user_metadata: { full_name: 'Test User' },
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00.000Z',
};

export const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: mockUser,
};

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------
export const mockNavigate = jest.fn();
export const mockGoBack = jest.fn();
export const mockGetParent = jest.fn(() => ({ navigate: mockNavigate, reset: jest.fn() }));

export const mockNavigation = {
  navigate: mockNavigate,
  goBack: mockGoBack,
  getParent: mockGetParent,
  push: jest.fn(),
  replace: jest.fn(),
  reset: jest.fn(),
};

// ---------------------------------------------------------------------------
// Bathroom fixtures
// ---------------------------------------------------------------------------
export const mockBathroomCard = {
  id: 'bathroom-1',
  name: 'Test Bathroom',
  icon: 'toilet',
  sub: 'Public · Open 24h',
  rating: 4,
  score: '4.2',
  reviewCount: '(12)',
  distance: '0.3 mi away',
  lat: 40.7128,
  lng: -74.006,
};

export const mockBathroomData = {
  id: 'bathroom-1',
  name: 'Test Bathroom',
  rating_avg: 4.2,
  review_count: 12,
  is_24_hours: true,
  tags: ['Accessible', 'Free'],
  lat: 40.7128,
  lng: -74.006,
};

export const mockReview = {
  id: 'review-1',
  user_id: 'test-user-id-123',
  bathroom_id: 'bathroom-1',
  rating: 4,
  body: 'Clean and accessible.',
  author_username: 'testuser',
  created_at: '2024-01-15T12:00:00.000Z',
};
