/**
 * Tests for BathroomSheet — the 3 render states (loading / empty / populated).
 * PanResponder and Animated animations are not tested here (they require
 * native interaction events beyond RNTL's scope).
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { BathroomSheet } from '../../components/BathroomSheet';
import { mockColors, mockBathroomCard } from '../helpers/mocks';

jest.mock('../../context/ThemeContext', () => ({
  useThemeContext: () => ({ colors: mockColors, isDark: false }),
}));

jest.mock('../../components/SkeletonBathroomCard', () => ({
  SkeletonBathroomCard: () => {
    const { View } = require('react-native');
    return <View testID="skeleton-bathroom-card" />;
  },
}));

jest.mock('../../components/BathroomCard', () => ({
  BathroomCard: ({ data }: any) => {
    const { Text } = require('react-native');
    return <Text testID={`bathroom-card-${data.id}`}>{data.name}</Text>;
  },
}));

const noop = jest.fn();

describe('BathroomSheet — loading state', () => {
  it('renders 3 skeleton cards when isLoading=true', () => {
    render(
      <BathroomSheet bathrooms={[]} isLoading={true} onCardPress={noop} />,
    );
    const skeletons = screen.getAllByTestId('skeleton-bathroom-card');
    expect(skeletons).toHaveLength(3);
  });

  it('does not render real bathroom cards when loading', () => {
    render(
      <BathroomSheet
        bathrooms={[mockBathroomCard]}
        isLoading={true}
        onCardPress={noop}
      />,
    );
    expect(screen.queryByTestId('bathroom-card-bathroom-1')).toBeNull();
  });

  it('does not show the empty state when loading', () => {
    render(
      <BathroomSheet bathrooms={[]} isLoading={true} onCardPress={noop} />,
    );
    expect(screen.queryByText('No bathrooms nearby yet.')).toBeNull();
  });
});

describe('BathroomSheet — empty state', () => {
  it('shows the empty state message when bathrooms=[]] and not loading', () => {
    render(
      <BathroomSheet bathrooms={[]} isLoading={false} onCardPress={noop} />,
    );
    expect(screen.getByText('No bathrooms nearby yet.')).toBeTruthy();
  });

  it('shows the add CTA in empty state', () => {
    render(
      <BathroomSheet bathrooms={[]} isLoading={false} onCardPress={noop} />,
    );
    expect(screen.getByText('Add the first one!')).toBeTruthy();
  });

  it('shows the access icon in empty state', () => {
    render(
      <BathroomSheet bathrooms={[]} isLoading={false} onCardPress={noop} />,
    );
    expect(screen.getByTestId('empty-state-icon')).toBeTruthy();
  });

  it('does not render skeleton cards in empty state', () => {
    render(
      <BathroomSheet bathrooms={[]} isLoading={false} onCardPress={noop} />,
    );
    expect(screen.queryByTestId('skeleton-bathroom-card')).toBeNull();
  });

  it('does not show "0 locations" count text', () => {
    render(
      <BathroomSheet bathrooms={[]} isLoading={false} onCardPress={noop} />,
    );
    expect(screen.queryByText(/0 location/i)).toBeNull();
  });
});

describe('BathroomSheet — populated state', () => {
  const singleBathroom = [mockBathroomCard];
  const multipleBathrooms = [
    mockBathroomCard,
    { ...mockBathroomCard, id: 'bathroom-2', name: 'Second Bathroom' },
  ];

  it('renders real bathroom cards when data is present', () => {
    render(
      <BathroomSheet
        bathrooms={singleBathroom}
        isLoading={false}
        onCardPress={noop}
      />,
    );
    expect(screen.getByTestId('bathroom-card-bathroom-1')).toBeTruthy();
  });

  it('renders all bathroom cards', () => {
    render(
      <BathroomSheet
        bathrooms={multipleBathrooms}
        isLoading={false}
        onCardPress={noop}
      />,
    );
    expect(screen.getByTestId('bathroom-card-bathroom-1')).toBeTruthy();
    expect(screen.getByTestId('bathroom-card-bathroom-2')).toBeTruthy();
  });

  it('shows the NEARBY heading', () => {
    render(
      <BathroomSheet
        bathrooms={singleBathroom}
        isLoading={false}
        onCardPress={noop}
      />,
    );
    expect(screen.getByText(/NEARBY/i)).toBeTruthy();
  });

  it('shows singular "location" for 1 bathroom', () => {
    render(
      <BathroomSheet
        bathrooms={singleBathroom}
        isLoading={false}
        onCardPress={noop}
      />,
    );
    expect(screen.getByText(/1 location/i)).toBeTruthy();
  });

  it('shows plural "locations" for 2+ bathrooms', () => {
    render(
      <BathroomSheet
        bathrooms={multipleBathrooms}
        isLoading={false}
        onCardPress={noop}
      />,
    );
    expect(screen.getByText(/2 locations/i)).toBeTruthy();
  });

  it('does not show skeleton cards when data is present', () => {
    render(
      <BathroomSheet
        bathrooms={singleBathroom}
        isLoading={false}
        onCardPress={noop}
      />,
    );
    expect(screen.queryByTestId('skeleton-bathroom-card')).toBeNull();
  });

  it('does not show the empty state message when data is present', () => {
    render(
      <BathroomSheet
        bathrooms={singleBathroom}
        isLoading={false}
        onCardPress={noop}
      />,
    );
    expect(screen.queryByText('No bathrooms nearby yet.')).toBeNull();
  });
});
