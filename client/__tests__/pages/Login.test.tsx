/**
 * Tests for Login — session-expired notice (from UserContext) and the friendly
 * rate-limit message on a 429 OTP send.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Login } from '../../pages/Login';
import { mockColors } from '../helpers/mocks';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
jest.mock('../../context/ThemeContext', () => ({
  useThemeContext: () => ({ colors: mockColors, isDark: false }),
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

// Controllable UserContext — tests flip `sessionExpired` per case.
const mockClearSessionExpired = jest.fn();
let mockSessionExpired = false;
jest.mock('../../context/UserContext', () => ({
  useUser: () => ({
    sessionExpired: mockSessionExpired,
    clearSessionExpired: mockClearSessionExpired,
  }),
}));

const mockSignInWithOtp = jest.fn();
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOtp: (...args: any[]) => mockSignInWithOtp(...args),
    },
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockSessionExpired = false;
  mockSignInWithOtp.mockResolvedValue({ error: null });
});

async function submitEmail(email: string) {
  fireEvent.changeText(screen.getByTestId('login-email'), email);
  await act(async () => {
    fireEvent.press(screen.getByTestId('send-code'));
  });
}

// ---------------------------------------------------------------------------
// Session-expired notice
// ---------------------------------------------------------------------------
describe('Login — session-expired notice', () => {
  it('renders the notice when sessionExpired is true', () => {
    mockSessionExpired = true;
    render(<Login />);
    expect(screen.getByTestId('session-expired-notice')).toBeTruthy();
    expect(screen.getByText('Your session expired. Please sign in again.')).toBeTruthy();
  });

  it('hides the notice when sessionExpired is false', () => {
    mockSessionExpired = false;
    render(<Login />);
    expect(screen.queryByTestId('session-expired-notice')).toBeNull();
  });

  it('clears the expired flag when the user submits a fresh OTP send', async () => {
    mockSessionExpired = true;
    render(<Login />);
    await submitEmail('user@example.com');
    expect(mockClearSessionExpired).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Rate-limit messaging
// ---------------------------------------------------------------------------
describe('Login — send rate limiting', () => {
  it('shows the friendly message when the OTP send returns a 429', async () => {
    mockSignInWithOtp.mockResolvedValueOnce({ error: { status: 429, message: 'Too Many Requests' } });

    render(<Login />);
    await submitEmail('user@example.com');

    await waitFor(() => {
      expect(
        screen.getByText("You're requesting codes too quickly. Please wait a bit and try again."),
      ).toBeTruthy();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows the raw error message for a non-rate-limit send error', async () => {
    mockSignInWithOtp.mockResolvedValueOnce({ error: { status: 500, message: 'Server exploded' } });

    render(<Login />);
    await submitEmail('user@example.com');

    await waitFor(() => {
      expect(screen.getByText('Server exploded')).toBeTruthy();
    });
  });
});
