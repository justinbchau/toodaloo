import React, { useId } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface Props {
  color: string;
  /** 'down' fades from solid at the top to clear at the bottom; 'up' the reverse. */
  direction?: 'down' | 'up';
  /** Opacity at the solid end. */
  from?: number;
  style?: StyleProp<ViewStyle>;
}

/** Vertical colour → transparent gradient, for legibility scrims over maps. */
export function Fade({ color, direction = 'down', from = 1, style }: Props) {
  const id = `fade-${useId().replace(/:/g, '')}`;
  const [top, bottom] = direction === 'down' ? [from, 0] : [0, from];
  return (
    <Svg style={style} width="100%" height="100%" preserveAspectRatio="none" pointerEvents="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={top} />
          <Stop offset="1" stopColor={color} stopOpacity={bottom} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}
