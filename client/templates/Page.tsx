import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../components/BackButton';
import { useThemeContext } from '../context/ThemeContext';

type Props = {
  children?: React.ReactNode;
  hideBack?: boolean;
};

export function Page({ children, hideBack }: Props) {
  const { colors } = useThemeContext();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {!hideBack && <BackButton />}
      {children}
    </SafeAreaView>
  );
}
