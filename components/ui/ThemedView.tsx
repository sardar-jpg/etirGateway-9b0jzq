import React from 'react';
import { View, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  children: React.ReactNode;
  edges?: Edge[];
  style?: ViewStyle;
}

/** Drop-in replacement for SafeAreaView that auto-applies the current theme background. */
export function ThemedSafeArea({ children, edges = ['top'], style }: Props) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: colors.bg }, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

/** Plain View wrapper with the current theme background. */
export function ThemedView({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { colors } = useTheme();
  return (
    <View style={[{ backgroundColor: colors.bg }, style]}>
      {children}
    </View>
  );
}
