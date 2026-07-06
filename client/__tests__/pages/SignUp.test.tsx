/**
 * Tests for SignUp — friendly rate-limit message on a 429 OTP send.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { SignUp } from '../../pages/SignUp';
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
  mockSignInWithOtp.mockResolvedValue({ error: null });
});

async function submitEmail(email: string) {
  fireEvent.changeText(screen.getByTestId('signup-email'), email);
  await act(async () => {
    fireEvent.press(screen.getByTestId('signup-send'));
  });
}

describe('SignUp — send rate limiting', () => {
  it('shows the friendly message when the OTP send returns a 429', async () => {
    mockSignInWithOtp.mockResolvedValueOnce({ error: { status: 429, message: 'Too Many Requests' } });

    render(<SignUp />);
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

    render(<SignUp />);
    await submitEmail('user@example.com');

    await waitFor(() => {
      expect(screen.getByText('Server exploded')).toBeTruthy();
    });
  });
});
