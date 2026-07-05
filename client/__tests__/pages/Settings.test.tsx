/**
 * Tests for Settings — username save, read-only email, delete account flow.
 */
import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Settings } from '../../pages/Settings';
import { mockColors, mockUser } from '../helpers/mocks';

const mockUpdateUsername = jest.fn();
const mockDeleteAccount = jest.fn();

jest.mock('../../context/ThemeContext', () => ({
  useThemeContext: () => ({
    colors: mockColors,
    isDark: false,
    toggleTheme: jest.fn(),
  }),
}));

jest.mock('../../context/UserContext', () => ({
  useUser: () => ({
    user: mockUser,
    profile: { id: mockUser.id, username: 'testuser' },
    updateUsername: (...args: any[]) => mockUpdateUsername(...args),
    deleteAccount: (...args: any[]) => mockDeleteAccount(...args),
  }),
}));

jest.mock('../../components/BackButton', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: () => <View testID="back-button" /> };
});

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});

beforeEach(() => {
  jest.clearAllMocks();
  mockUpdateUsername.mockResolvedValue({ error: null });
  mockDeleteAccount.mockResolvedValue({ error: null });
});

describe('Settings — profile section', () => {
  it('shows the signed-in email as read-only', () => {
    render(<Settings />);
    expect(screen.getByTestId('email-display')).toHaveTextContent('test@example.com');
  });

  it('prefills the username from the profile', () => {
    render(<Settings />);
    expect(screen.getByTestId('username-input').props.value).toBe('testuser');
  });
});

describe('Settings — delete account', () => {
  it('shows the delete account button in the danger zone', () => {
    render(<Settings />);
    expect(screen.getByText('Delete my account')).toBeTruthy();
  });

  it('asks for confirmation before deleting', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    render(<Settings />);

    fireEvent.press(screen.getByText('Delete my account'));

    expect(alertSpy).toHaveBeenCalledWith(
      'Delete account?',
      expect.stringContaining('permanently'),
      expect.any(Array),
    );
    expect(mockDeleteAccount).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('calls deleteAccount when the user confirms', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      buttons?.find((b) => b.style === 'destructive')?.onPress?.();
    });

    render(<Settings />);

    await act(async () => {
      fireEvent.press(screen.getByText('Delete my account'));
    });

    await waitFor(() => expect(mockDeleteAccount).toHaveBeenCalledTimes(1));
    alertSpy.mockRestore();
  });

  it('shows an error alert when deleteAccount fails', async () => {
    mockDeleteAccount.mockResolvedValue({ error: 'Could not delete your account. Please try again.' });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, _m, buttons) => {
      if (title === 'Delete account?') {
        buttons?.find((b) => b.style === 'destructive')?.onPress?.();
      }
    });

    render(<Settings />);

    await act(async () => {
      fireEvent.press(screen.getByText('Delete my account'));
    });

    await waitFor(() => {
      expect(mockDeleteAccount).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Could not delete your account. Please try again.');
    });
    alertSpy.mockRestore();
  });
});
