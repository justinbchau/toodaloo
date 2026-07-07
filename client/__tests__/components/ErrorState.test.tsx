/**
 * Tests for the shared ErrorState component — title/message rendering and the
 * Retry affordance that every list screen relies on.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ErrorState } from '../../components/ErrorState';
import { mockColors } from '../helpers/mocks';

jest.mock('../../context/ThemeContext', () => ({
  useThemeContext: () => ({ colors: mockColors, isDark: false }),
}));

describe('ErrorState', () => {
  it('renders the title and the default connection message', () => {
    render(<ErrorState title="Couldn't load your saved places" onRetry={jest.fn()} />);
    expect(screen.getByText("Couldn't load your saved places")).toBeTruthy();
    expect(screen.getByText('Check your connection and try again.')).toBeTruthy();
  });

  it('fires onRetry when the retry button is pressed', () => {
    const onRetry = jest.fn();
    render(<ErrorState title="x" onRetry={onRetry} />);
    fireEvent.press(screen.getByLabelText('Retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('supports a custom message, retry label, and a11y label', () => {
    render(
      <ErrorState
        title="x"
        message="Custom message"
        retryLabel="Try again"
        retryAccessibilityLabel="Retry loading things"
        onRetry={jest.fn()}
      />,
    );
    expect(screen.getByText('Custom message')).toBeTruthy();
    expect(screen.getByText('Try again')).toBeTruthy();
    expect(screen.getByLabelText('Retry loading things')).toBeTruthy();
  });
});
