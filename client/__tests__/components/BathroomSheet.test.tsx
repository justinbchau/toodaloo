/**
 * Tests for BathroomSheet — the 3 render states (loading / empty / populated).
 * PanResponder and Animated animations are not tested here (they require
 * native interaction events beyond RNTL's scope).
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { BathroomSheet } from '../../components/BathroomSheet';
import { mockColors, mockBathroomCard } from '../helpers/mocks';

jest.mock('../../context/ThemeContext', () => ({
  useThemeContext: () => ({ colors: mockColors, isDark: false }),
}));

// The real sheet runs on reanimated/gesture-handler natives; use the libraries' mocks.
// (reanimated's own mock still boots the native worklets runtime, so stub the
// handful of APIs the sheet uses.)
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View },
    useSharedValue: (v: number) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    interpolate: () => 1,
    Extrapolation: { CLAMP: 'clamp' },
  };
});
jest.mock('@gorhom/bottom-sheet', () => ({ __esModule: true, ...require('@gorhom/bottom-sheet/mock') }));

jest.mock('../../components/NearestCard', () => ({
  NearestCard: ({ data, onDirections }: any) => {
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable testID={`nearest-card-${data.id}`} onPress={onDirections}>
        <Text>{data.name}</Text>
      </Pressable>
    );
  },
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

  it('renders the first (nearest) result as the Nearest hero card', () => {
    render(
      <BathroomSheet
        bathrooms={singleBathroom}
        isLoading={false}
        onCardPress={noop}
      />,
    );
    expect(screen.getByTestId('nearest-card-bathroom-1')).toBeTruthy();
    expect(screen.queryByTestId('bathroom-card-bathroom-1')).toBeNull();
    expect(screen.queryByText('More nearby')).toBeNull();
  });

  it('renders the remaining results as list rows under "More nearby"', () => {
    render(
      <BathroomSheet
        bathrooms={multipleBathrooms}
        isLoading={false}
        onCardPress={noop}
      />,
    );
    expect(screen.getByTestId('nearest-card-bathroom-1')).toBeTruthy();
    expect(screen.getByText('More nearby')).toBeTruthy();
    expect(screen.getByTestId('bathroom-card-bathroom-2')).toBeTruthy();
  });

  it('wires the Nearest card to onDirections with that bathroom', () => {
    const onDirections = jest.fn();
    render(
      <BathroomSheet
        bathrooms={multipleBathrooms}
        isLoading={false}
        onCardPress={noop}
        onDirections={onDirections}
      />,
    );
    fireEvent.press(screen.getByTestId('nearest-card-bathroom-1'));
    expect(onDirections).toHaveBeenCalledWith(expect.objectContaining({ id: 'bathroom-1' }));
  });

  it('supports a custom empty state (e.g. before any location is known)', () => {
    render(
      <BathroomSheet
        bathrooms={[]}
        isLoading={false}
        emptyTitle="Search an area"
        emptyMessage="Find bathrooms anywhere."
      />,
    );
    expect(screen.getByText('Search an area')).toBeTruthy();
    expect(screen.queryByText('No bathrooms nearby yet.')).toBeNull();
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
