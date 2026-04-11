/**
 * Tests for the Success screen — render and navigation.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Success } from '../../pages/Success';
import { mockColors } from '../helpers/mocks';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('../../context/ThemeContext', () => ({
  useThemeContext: () => ({ colors: mockColors, isDark: false }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Success — render', () => {
  it('renders the "Bathroom added!" heading', () => {
    render(<Success />);
    expect(screen.getByText('Bathroom added!')).toBeTruthy();
  });

  it('renders the "Back to Map" button', () => {
    render(<Success />);
    expect(screen.getByText('Back to Map')).toBeTruthy();
  });
});

describe('Success — navigation', () => {
  it('navigates to MainTabs with screen: Map when "Back to Map" is pressed', () => {
    render(<Success />);
    fireEvent.press(screen.getByText('Back to Map'));
    expect(mockNavigate).toHaveBeenCalledWith('MainTabs', { screen: 'Map' });
  });
});
