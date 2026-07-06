/**
 * Tests for Confirmation — empty-email guard, 6-digit code validation,
 * verifyOtp payload, and friendly resend rate-limit messaging.
 */
import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Confirmation } from '../../pages/Confirmation';
import { mockColors, mockNavigation } from '../helpers/mocks';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
jest.mock('../../context/ThemeContext', () => ({
  useThemeContext: () => ({ colors: mockColors, isDark: false }),
}));

// The Page template renders a BackButton that calls useNavigation(). Confirmation
// itself uses the `navigation` prop, not the hook — this stub only keeps BackButton
// from throwing outside a NavigationContainer.
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}));

const mockVerifyOtp = jest.fn();
const mockSignInWithOtp = jest.fn();

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      verifyOtp: (...args: any[]) => mockVerifyOtp(...args),
      signInWithOtp: (...args: any[]) => mockSignInWithOtp(...args),
    },
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockVerifyOtp.mockResolvedValue({ error: null });
  mockSignInWithOtp.mockResolvedValue({ error: null });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
// Pass `null` to simulate a missing email (undefined would trigger the default).
function renderConfirmation(email: string | null = 'test@example.com') {
  const route = { params: email ? { email } : {} } as any;
  return render(<Confirmation route={route} navigation={mockNavigation as any} />);
}

async function submitCode(code: string) {
  fireEvent.changeText(screen.getByTestId('otp-code'), code);
  await act(async () => {
    fireEvent.press(screen.getByTestId('verify-otp'));
  });
}

// ---------------------------------------------------------------------------
// Empty-email guard
// ---------------------------------------------------------------------------
describe('Confirmation — empty-email guard', () => {
  it('shows an Alert, redirects to Login, and renders no form when email is missing', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    renderConfirmation(null);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Something went wrong', 'Please sign in again to continue.');
    });
    expect(mockNavigation.replace).toHaveBeenCalledWith('Login');
    expect(screen.queryByTestId('otp-code')).toBeNull();

    alertSpy.mockRestore();
  });

  it('renders the form and does NOT redirect when email is present', () => {
    renderConfirmation('user@example.com');

    expect(screen.getByTestId('otp-code')).toBeTruthy();
    expect(mockNavigation.replace).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Code validation
// ---------------------------------------------------------------------------
describe('Confirmation — code validation', () => {
  it('shows an error and does NOT call verifyOtp for a too-short code', async () => {
    renderConfirmation();
    await submitCode('123');

    await waitFor(() => {
      expect(screen.getByText('Enter the 6-digit code')).toBeTruthy();
    });
    expect(mockVerifyOtp).not.toHaveBeenCalled();
  });

  it('shows an error and does NOT call verifyOtp for a non-numeric code', async () => {
    renderConfirmation();
    await submitCode('abcdef');

    await waitFor(() => {
      expect(screen.getByText('Enter the 6-digit code')).toBeTruthy();
    });
    expect(mockVerifyOtp).not.toHaveBeenCalled();
  });

  it('calls verifyOtp with the email/token/type payload for a valid 6-digit code', async () => {
    renderConfirmation('user@example.com');
    await submitCode('123456');

    await waitFor(() => {
      expect(mockVerifyOtp).toHaveBeenCalledWith({
        email: 'user@example.com',
        token: '123456',
        type: 'email',
      });
    });
  });
});

// ---------------------------------------------------------------------------
// Resend rate-limit messaging
// ---------------------------------------------------------------------------
describe('Confirmation — resend rate limiting', () => {
  it('shows the friendly message when resend returns a 429', async () => {
    mockSignInWithOtp.mockResolvedValueOnce({ error: { status: 429, message: 'Too Many Requests' } });

    renderConfirmation();
    await act(async () => {
      fireEvent.press(screen.getByText('Resend code'));
    });

    await waitFor(() => {
      expect(
        screen.getByText("You're requesting codes too quickly. Please wait a bit and try again."),
      ).toBeTruthy();
    });
  });

  it('shows the raw error message for a non-rate-limit resend error', async () => {
    mockSignInWithOtp.mockResolvedValueOnce({ error: { status: 500, message: 'Server exploded' } });

    renderConfirmation();
    await act(async () => {
      fireEvent.press(screen.getByText('Resend code'));
    });

    await waitFor(() => {
      expect(screen.getByText('Server exploded')).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// Verify rate-limit messaging — the verifyOtp error path must go through the
// same friendlyAuthError mapping as resend/Login/SignUp.
// ---------------------------------------------------------------------------
describe('Confirmation — verify rate limiting', () => {
  it('shows the friendly message when verifyOtp returns a 429', async () => {
    mockVerifyOtp.mockResolvedValueOnce({ error: { status: 429, message: 'Too Many Requests' } });

    renderConfirmation('user@example.com');
    await submitCode('123456');

    await waitFor(() => {
      expect(
        screen.getByText("You're requesting codes too quickly. Please wait a bit and try again."),
      ).toBeTruthy();
    });
  });

  it('shows the raw error message for a non-rate-limit verify error', async () => {
    mockVerifyOtp.mockResolvedValueOnce({ error: { status: 403, message: 'Token has expired' } });

    renderConfirmation('user@example.com');
    await submitCode('123456');

    await waitFor(() => {
      expect(screen.getByText('Token has expired')).toBeTruthy();
    });
  });
});
