/**
 * Tests for BathroomCard — rendering, star display, highlighted state.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { BathroomCard, BathroomCardData } from '../../components/BathroomCard';
import { mockColors, mockBathroomCard } from '../helpers/mocks';

jest.mock('../../context/ThemeContext', () => ({
  useThemeContext: () => ({ colors: mockColors, isDark: false }),
}));

const renderCard = (
  overrides: Partial<BathroomCardData> = {},
  props: { onPress?: () => void; highlighted?: boolean } = {},
) => {
  const data: BathroomCardData = { ...mockBathroomCard, ...overrides };
  return render(<BathroomCard data={data} {...props} />);
};

describe('BathroomCard — content rendering', () => {
  it('renders the bathroom name', () => {
    renderCard();
    expect(screen.getByText('Test Bathroom')).toBeTruthy();
  });

  it('renders the access icon', () => {
    renderCard({ icon: 'key' });
    expect(screen.getByTestId('bathroom-card-icon')).toBeTruthy();
  });

  it('renders the sub-text', () => {
    renderCard({ sub: 'Key Required' });
    expect(screen.getByText('Key Required')).toBeTruthy();
  });

  it('renders the score', () => {
    renderCard({ score: '4.2' });
    expect(screen.getByText('4.2')).toBeTruthy();
  });

  it('renders the review count', () => {
    renderCard({ reviewCount: '(12)' });
    expect(screen.getByText('(12)')).toBeTruthy();
  });

  it('renders the distance', () => {
    renderCard({ distance: '0.3 mi away' });
    expect(screen.getByText('0.3 mi away')).toBeTruthy();
  });
});

describe('BathroomCard — star display', () => {
  it('shows correct filled stars for rating 4 out of 5', () => {
    renderCard({ rating: 4 });
    // 4 filled + 1 empty = ★★★★☆
    expect(screen.getByText('★★★★☆')).toBeTruthy();
  });

  it('shows all filled stars for rating 5', () => {
    renderCard({ rating: 5 });
    expect(screen.getByText('★★★★★')).toBeTruthy();
  });

  it('shows all empty stars for rating 0', () => {
    renderCard({ rating: 0 });
    expect(screen.getByText('☆☆☆☆☆')).toBeTruthy();
  });

  it('shows 3 filled stars for rating 3', () => {
    renderCard({ rating: 3 });
    expect(screen.getByText('★★★☆☆')).toBeTruthy();
  });

  it('rounds fractional ratings before display', () => {
    renderCard({ rating: 3.6 }); // rounds to 4 → ★★★★☆
    expect(screen.getByText('★★★★☆')).toBeTruthy();
  });
});

describe('BathroomCard — press handler', () => {
  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    renderCard({}, { onPress });
    // The card is a TouchableOpacity — fire press on the outer element
    const pressable = screen.getByText('Test Bathroom').parent?.parent?.parent;
    if (pressable) fireEvent.press(pressable);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('BathroomCard — highlighted state', () => {
  it('renders without crashing when highlighted=true', () => {
    expect(() => renderCard({}, { highlighted: true })).not.toThrow();
  });

  it('renders without crashing when highlighted=false', () => {
    expect(() => renderCard({}, { highlighted: false })).not.toThrow();
  });
});
