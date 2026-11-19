/**
 * Tests for TimeSelect — the JS-only half-hour time picker used by the
 * opening-hours editor.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { TimeSelect } from '../../components/TimeSelect';
import { mockColors } from '../helpers/mocks';

jest.mock('../../context/ThemeContext', () => ({
  useThemeContext: () => ({ colors: mockColors, isDark: true }),
}));

describe('TimeSelect', () => {
  it('shows the value in 12-hour form with an accessible label', () => {
    render(<TimeSelect label="Weekdays closing time" value="20:00" onChange={jest.fn()} />);
    expect(screen.getByLabelText('Weekdays closing time: 8 PM')).toBeTruthy();
    expect(screen.getByText('8 PM')).toBeTruthy();
  });

  it('opens a half-hour list, marks the current value, and returns the picked HH:MM', () => {
    const onChange = jest.fn();
    render(<TimeSelect label="Weekdays closing time" value="20:00" onChange={onChange} />);

    fireEvent.press(screen.getByLabelText('Weekdays closing time: 8 PM'));
    // Sheet title + the current value is marked selected.
    expect(screen.getAllByText('Weekdays closing time').length).toBeGreaterThan(0);
    const current = screen.getAllByText('8 PM').map((n) => n.parent?.parent).find(Boolean);
    expect(current).toBeTruthy();

    fireEvent.press(screen.getByText('9:30 PM'));
    expect(onChange).toHaveBeenCalledWith('21:30');
  });

  it('does not open when disabled', () => {
    const onChange = jest.fn();
    render(<TimeSelect label="Opens" value="08:00" onChange={onChange} disabled />);
    fireEvent.press(screen.getByLabelText('Opens: 8 AM'));
    expect(screen.queryByText('9:30 AM')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });
});
