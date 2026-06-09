import React, { useRef } from 'react';
import { Pressable, Animated, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius } from '@/constants/theme';

interface Props {
  size?: 'sm' | 'md';
}

export function ThemeToggle({ size = 'md' }: Props) {
  const { isDark, toggleTheme, colors } = useTheme();
  const rotate = useRef(new Animated.Value(isDark ? 0 : 1)).current;

  const handlePress = async () => {
    Animated.timing(rotate, {
      toValue: isDark ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    await toggleTheme();
  };

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const btnSize = size === 'sm' ? 32 : 36;
  const iconSize = size === 'sm' ? 16 : 18;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.btn,
        {
          width: btnSize,
          height: btnSize,
          borderRadius: btnSize / 2,
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      accessibilityRole="button"
    >
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        {isDark ? (
          <View style={styles.iconWrap}>
            <MaterialIcons name="light-mode" size={iconSize} color={colors.textSecondary} />
          </View>
        ) : (
          <View style={styles.iconWrap}>
            <MaterialIcons name="dark-mode" size={iconSize} color={colors.textSecondary} />
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
