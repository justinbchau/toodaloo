/**
 * Tests for Home (landing) — the pre-auth footer links out to the hosted
 * Terms & Privacy page via Linking, and the CTAs navigate into Auth.
 */
import React from 'react';
import { Alert, Linking } from 'react-native';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { Home } from '../../pages/Home';
import { LEGAL_URL } from '../../lib/legalUrl';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('../../context/ThemeContext', () => ({
  useThemeContext: () => ({
    colors: {
      bg: '#0B0B0F', surface1: '#111118', surface3: '#1E1E28',
      text1: '#EEEEF4', text2: '#8B8B9E', text3: '#44444F',
      purple: '#7B6EF6', purpleDim: 'rgba(123,110,246,0.16)',
      purpleText: '#A99FF9', purpleGlow: 'rgba(123,110,246,0.35)',
    },
    isDark: false,
  }),
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Home — footer Terms & Privacy', () => {
  it('opens the hosted legal URL when pressed', async () => {
    const openSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    render(<Home />);

    await act(async () => {
      fireEvent.press(screen.getByText('Terms & Privacy'));
    });

    expect(openSpy).toHaveBeenCalledWith(LEGAL_URL);
    openSpy.mockRestore();
  });

  it('alerts when the URL cannot be opened', async () => {
    const openSpy = jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('no handler'));
    const alertSpy = jest.spyOn(Alert, 'alert');
    render(<Home />);

    await act(async () => {
      fireEvent.press(screen.getByText('Terms & Privacy'));
    });

    expect(alertSpy).toHaveBeenCalledWith('Error', 'Could not open the Terms & Privacy page.');
    openSpy.mockRestore();
    alertSpy.mockRestore();
  });
});

describe('Home — landing CTAs', () => {
  it('navigates to the sign-up flow on Get started', () => {
    render(<Home />);
    fireEvent.press(screen.getByText('Get started →'));
    expect(mockNavigate).toHaveBeenCalledWith('Auth', { screen: 'SignUp' });
  });

  it('navigates to the login flow on Log in', () => {
    render(<Home />);
    fireEvent.press(screen.getByText('Log in'));
    expect(mockNavigate).toHaveBeenCalledWith('Auth', { screen: 'Login' });
  });
});
