import React from 'react';
import { Text, AppState } from 'react-native';
import { render, screen, act } from '@testing-library/react-native';
import { useNow } from '../../hooks/useNow';

function Clock() {
  return <Text testID="t">{String(useNow(60_000).getTime())}</Text>;
}

describe('useNow', () => {
  beforeEach(() => jest.useFakeTimers({ now: new Date(2026, 10, 18, 20, 59) }));
  afterEach(() => jest.useRealTimers());

  it('ticks forward on its interval', () => {
    render(<Clock />);
    const before = Number(screen.getByTestId('t').props.children);
    act(() => { jest.advanceTimersByTime(60_000); });
    expect(Number(screen.getByTestId('t').props.children)).toBe(before + 60_000);
  });

  it('refreshes when the app returns to the foreground', () => {
    const listeners: ((s: string) => void)[] = [];
    const spy = jest.spyOn(AppState, 'addEventListener').mockImplementation((_t: any, fn: any) => {
      listeners.push(fn);
      return { remove: jest.fn() } as any;
    });
    render(<Clock />);
    const before = Number(screen.getByTestId('t').props.children);
    jest.setSystemTime(new Date(2026, 10, 18, 23, 0));
    act(() => listeners.forEach((fn) => fn('active')));
    expect(Number(screen.getByTestId('t').props.children)).toBeGreaterThan(before);
    spy.mockRestore();
  });
});
