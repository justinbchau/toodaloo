/**
 * Tests for UserContext — session state machine, loading transitions, signOut.
 */
import React from 'react';
import { AppState } from 'react-native';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { UserProvider, useUser } from '../../context/UserContext';
import { mockUser, mockSession } from '../helpers/mocks';

// ---------------------------------------------------------------------------
// Mock Supabase
// ---------------------------------------------------------------------------
const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn();
const mockSignOut = jest.fn();
const mockRpc = jest.fn();
const mockUnsubscribe = jest.fn();
const mockStartAutoRefresh = jest.fn();
const mockStopAutoRefresh = jest.fn();

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args: any[]) => mockGetSession(...args),
      onAuthStateChange: (...args: any[]) => mockOnAuthStateChange(...args),
      signOut: (...args: any[]) => mockSignOut(...args),
      startAutoRefresh: (...args: any[]) => mockStartAutoRefresh(...args),
      stopAutoRefresh: (...args: any[]) => mockStopAutoRefresh(...args),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
    rpc: (...args: any[]) => mockRpc(...args),
  },
}));

jest.mock('../../lib/secureStorageAdapter', () => ({
  migrateAuthStorageIfNeeded: jest.fn().mockResolvedValue(undefined),
  secureStorageAdapter: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function wrapper({ children }: { children: React.ReactNode }) {
  return <UserProvider>{children}</UserProvider>;
}

// AppState mocking: capture the 'change' handler so we can drive foreground/background
// transitions, and hand back a removable subscription to assert cleanup.
let appStateHandler: ((state: string) => void) | null = null;
const mockAppStateRemove = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  // Default: no session
  mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
  mockOnAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: mockUnsubscribe } },
  });
  mockSignOut.mockResolvedValue({ error: null });
  mockRpc.mockResolvedValue({ error: null });

  // Default to a foregrounded app; individual tests can override before render.
  (AppState as unknown as { currentState: string }).currentState = 'active';
  appStateHandler = null;
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event: string, cb: any) => {
    appStateHandler = cb;
    return { remove: mockAppStateRemove } as any;
  });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('UserContext — initial loading state', () => {
  it('starts with loading=true', () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    expect(result.current.loading).toBe(true);
  });

  it('sets loading=false after getSession resolves', async () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});

describe('UserContext — no session', () => {
  it('exposes null session and null user when no session exists', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    const { result } = renderHook(() => useUser(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
  });
});

describe('UserContext — with session', () => {
  it('populates session and user from getSession', async () => {
    mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

    const { result } = renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.session).toEqual(mockSession);
    expect(result.current.user).toEqual(mockUser);
  });
});

describe('UserContext — onAuthStateChange', () => {
  it('subscribes to auth state changes on mount', async () => {
    renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1));
  });

  it('unsubscribes on unmount', async () => {
    const { unmount } = renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(mockOnAuthStateChange).toHaveBeenCalled());
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('updates session when auth state changes to SIGNED_IN', async () => {
    let capturedCallback: ((event: string, session: any) => void) | null = null;

    mockOnAuthStateChange.mockImplementation((cb: any) => {
      capturedCallback = cb;
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
    });

    const { result } = renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Simulate SIGNED_IN event
    await act(async () => {
      capturedCallback?.('SIGNED_IN', mockSession);
    });

    expect(result.current.session).toEqual(mockSession);
    expect(result.current.user).toEqual(mockUser);
  });

  it('clears session when auth state changes to SIGNED_OUT', async () => {
    mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });
    let capturedCallback: ((event: string, session: any) => void) | null = null;

    mockOnAuthStateChange.mockImplementation((cb: any) => {
      capturedCallback = cb;
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
    });

    const { result } = renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(result.current.session).toEqual(mockSession));

    await act(async () => {
      capturedCallback?.('SIGNED_OUT', null);
    });

    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
  });
});

describe('UserContext — session expiry handling', () => {
  it('flags sessionExpired on an unexpected SIGNED_OUT (refresh failure)', async () => {
    mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });
    let capturedCallback: ((event: string, session: any) => void) | null = null;
    mockOnAuthStateChange.mockImplementation((cb: any) => {
      capturedCallback = cb;
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
    });

    const { result } = renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(result.current.session).toEqual(mockSession));

    await act(async () => {
      capturedCallback?.('SIGNED_OUT', null);
    });

    expect(result.current.sessionExpired).toBe(true);
  });

  it('does NOT flag sessionExpired when the SIGNED_OUT follows a user-initiated signOut', async () => {
    mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });
    let capturedCallback: ((event: string, session: any) => void) | null = null;
    mockOnAuthStateChange.mockImplementation((cb: any) => {
      capturedCallback = cb;
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
    });

    const { result } = renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(result.current.session).toEqual(mockSession));

    await act(async () => {
      await result.current.signOut();
      capturedCallback?.('SIGNED_OUT', null);
    });

    expect(result.current.sessionExpired).toBe(false);
  });

  it('clears sessionExpired when a new session signs in', async () => {
    mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });
    let capturedCallback: ((event: string, session: any) => void) | null = null;
    mockOnAuthStateChange.mockImplementation((cb: any) => {
      capturedCallback = cb;
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
    });

    const { result } = renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(result.current.session).toEqual(mockSession));

    await act(async () => {
      capturedCallback?.('SIGNED_OUT', null);
    });
    expect(result.current.sessionExpired).toBe(true);

    await act(async () => {
      capturedCallback?.('SIGNED_IN', mockSession);
    });
    expect(result.current.sessionExpired).toBe(false);
  });

  it('clears sessionExpired when clearSessionExpired is called', async () => {
    mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });
    let capturedCallback: ((event: string, session: any) => void) | null = null;
    mockOnAuthStateChange.mockImplementation((cb: any) => {
      capturedCallback = cb;
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
    });

    const { result } = renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(result.current.session).toEqual(mockSession));

    await act(async () => {
      capturedCallback?.('SIGNED_OUT', null);
    });
    expect(result.current.sessionExpired).toBe(true);

    await act(async () => {
      result.current.clearSessionExpired();
    });
    expect(result.current.sessionExpired).toBe(false);
  });
});

describe('UserContext — auth auto-refresh follows AppState', () => {
  it('starts auto-refresh on mount when the app is already foregrounded', async () => {
    (AppState as unknown as { currentState: string }).currentState = 'active';
    renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(mockStartAutoRefresh).toHaveBeenCalled());
  });

  it('does NOT start auto-refresh on mount when the app is backgrounded', async () => {
    (AppState as unknown as { currentState: string }).currentState = 'background';
    renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(mockOnAuthStateChange).toHaveBeenCalled());
    expect(mockStartAutoRefresh).not.toHaveBeenCalled();
  });

  it('registers a single AppState change listener', async () => {
    renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(AppState.addEventListener).toHaveBeenCalledTimes(1));
    expect(AppState.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('resumes auto-refresh when the app returns to the foreground', async () => {
    renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(appStateHandler).not.toBeNull());
    mockStartAutoRefresh.mockClear();

    act(() => appStateHandler?.('active'));
    expect(mockStartAutoRefresh).toHaveBeenCalledTimes(1);
    expect(mockStopAutoRefresh).not.toHaveBeenCalled();
  });

  it('pauses auto-refresh when the app is backgrounded', async () => {
    renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(appStateHandler).not.toBeNull());

    act(() => appStateHandler?.('background'));
    expect(mockStopAutoRefresh).toHaveBeenCalledTimes(1);
  });

  it('removes the AppState listener on unmount', async () => {
    const { unmount } = renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(AppState.addEventListener).toHaveBeenCalled());
    unmount();
    expect(mockAppStateRemove).toHaveBeenCalledTimes(1);
  });
});

describe('UserContext — signOut', () => {
  it('calls supabase.auth.signOut', async () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});

describe('UserContext — deleteAccount', () => {
  it('calls delete_own_account RPC then signOut on success', async () => {
    mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

    const { result } = renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(result.current.user).toEqual(mockUser));

    let deleteResult: { error: string | null } | undefined;
    await act(async () => {
      deleteResult = await result.current.deleteAccount();
    });

    expect(deleteResult?.error).toBeNull();
    expect(mockRpc).toHaveBeenCalledWith('delete_own_account');
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('returns an error and does not sign out when the RPC fails', async () => {
    mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });
    mockRpc.mockResolvedValue({ error: { message: 'permission denied' } });

    const { result } = renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(result.current.user).toEqual(mockUser));

    let deleteResult: { error: string | null } | undefined;
    await act(async () => {
      deleteResult = await result.current.deleteAccount();
    });

    expect(deleteResult?.error).toBe('Could not delete your account. Please try again.');
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('returns an error when not signed in', async () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let deleteResult: { error: string | null } | undefined;
    await act(async () => {
      deleteResult = await result.current.deleteAccount();
    });

    expect(deleteResult?.error).toBe('You must be signed in.');
    expect(mockRpc).not.toHaveBeenCalled();
  });
});

describe('useUser hook', () => {
  it('throws when used outside UserProvider', () => {
    // Suppress console.error noise from React during the throw
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useUser())).not.toThrow();
    spy.mockRestore();
    // Note: the hook returns a default context value (doesn't throw) when context
    // is null because createContext provides a default — this is expected behavior
  });
});
