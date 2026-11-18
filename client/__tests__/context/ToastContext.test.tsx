/**
 * Tests for ToastProvider — the undo-window contract: the action and the
 * commit are mutually exclusive, and every toast settles exactly once.
 */
import React from 'react';
import { Pressable, Text } from 'react-native';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { mockColors } from '../helpers/mocks';

jest.mock('../../context/ThemeContext', () => ({
  useThemeContext: () => ({ colors: mockColors, isDark: false }),
}));

import { ToastProvider, useToast, ToastOptions } from '../../context/ToastContext';

let show: (o: ToastOptions) => void;
function Trigger() {
  show = useToast().showToast;
  return <Pressable><Text>host</Text></Pressable>;
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

const renderHost = () => render(<ToastProvider><Trigger /></ToastProvider>);

describe('ToastProvider', () => {
  it('shows the message and runs onAction (not onCommit) when the action is tapped', () => {
    renderHost();
    const onAction = jest.fn();
    const onCommit = jest.fn();
    act(() => show({ message: 'Review deleted', actionLabel: 'Undo', onAction, onCommit }));

    expect(screen.getByText('Review deleted')).toBeTruthy();
    fireEvent.press(screen.getByText('Undo'));
    act(() => { jest.runAllTimers(); });

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('commits once when the toast times out', () => {
    renderHost();
    const onCommit = jest.fn();
    act(() => show({ message: 'Removed', onCommit, durationMs: 1000 }));
    act(() => { jest.advanceTimersByTime(1000); });
    act(() => { jest.runAllTimers(); });
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it('commits the previous toast when a new one replaces it', () => {
    renderHost();
    const first = jest.fn();
    act(() => show({ message: 'First', onCommit: first }));
    act(() => show({ message: 'Second' }));
    expect(first).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Second')).toBeTruthy();
  });

  it('commits immediately when no provider is mounted', () => {
    let fallback: (o: ToastOptions) => void = () => {};
    function Bare() { fallback = useToast().showToast; return null; }
    render(<Bare />);
    const onCommit = jest.fn();
    fallback({ message: 'x', onCommit });
    expect(onCommit).toHaveBeenCalledTimes(1);
  });
});
