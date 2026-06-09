import React, { useRef } from 'react';
import { Pressable, Animated, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  size?: 'sm' | 'md';
}

export function ThemeToggle({ size = 'md' }: Props) {
  const { isDark, toggleTheme, colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const spin  = useRef(new Animated.Value(0)).current;

  const handlePress = async () => {
    // Bounce scale + 180° spin on press
    Animated.parallel([
      Animated.sequence([
        Animated.timing(scale, { toValue: 0.75, duration: 80,  useNativeDriver: true }),
        Animated.spring(scale,  { toValue: 1,    useNativeDriver: true, tension: 300, friction: 10 }),
      ]),
      Animated.timing(spin, {
        toValue: spin._value === 0 ? 1 : 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
    await toggleTheme();
  };

  const rotation = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const btnSize = size === 'sm' ? 32 : 36;
  const iconSize = size === 'sm' ? 16 : 18;
  // Active tint when in light mode so the moon icon has a subtle accent
  const iconColor = isDark ? colors.textSecondary : colors.primary;
  const bgColor   = isDark ? colors.card : colors.primaryGlow;
  const borderColor = isDark ? colors.border : colors.primaryBorder;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.btn,
        {
          width: btnSize, height: btnSize, borderRadius: btnSize / 2,
          backgroundColor: bgColor, borderColor,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      accessibilityRole="button"
      hitSlop={6}
    >
      <Animated.View style={{ transform: [{ scale }, { rotate: rotation }], alignItems: 'center', justifyContent: 'center' }}>
        <MaterialIcons
          name={isDark ? 'light-mode' : 'dark-mode'}
          size={iconSize}
          color={iconColor}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
