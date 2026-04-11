import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  useReducedMotion,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface Options {
  minOpacity?: number;
  maxOpacity?: number;
  duration?: number;
}

export function useSkeletonOpacity({
  minOpacity = 0.4,
  maxOpacity = 0.9,
  duration = 800,
}: Options = {}) {
  const opacity = useSharedValue(minOpacity);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = maxOpacity;
      return;
    }
    opacity.value = withRepeat(
      withSequence(
        withTiming(maxOpacity, { duration }),
        withTiming(minOpacity, { duration }),
      ),
      -1,
      false,
    );
  }, [opacity, minOpacity, maxOpacity, duration, reducedMotion]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
}
