/**
 * Chip — unified filter/type chip component.
 *
 * variant="filter"  → pill shape, optional count badge
 * variant="type"    → rounded rectangle, no badge
 *
 * Both variants animate smoothly on selection.
 */
import React, { useRef, useEffect } from 'react';
import { Animated, Pressable, View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontSize, BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface ChipProps {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  selected: boolean;
  onPress: () => void;
  count?: number;
  variant?: 'filter' | 'type';
  accessibilityLabel?: string;
  accessibilityState?: { selected?: boolean; disabled?: boolean; checked?: boolean | 'mixed'; busy?: boolean; expanded?: boolean };
}

export function Chip({
  label,
  icon,
  color,
  selected,
  onPress,
  count,
  variant = 'filter',
  accessibilityLabel,
  accessibilityState,
}: ChipProps) {
  const progress = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const { colors } = useTheme();

  useEffect(() => {
    Animated.timing(progress, {
      toValue: selected ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [selected]);

  const bgColor     = progress.interpolate({ inputRange: [0, 1], outputRange: [variant === 'filter' ? colors.card : colors.surface, `${color}1A`] });
  const borderColor = progress.interpolate({ inputRange: [0, 1], outputRange: [colors.border, color] });
  const labelColor  = progress.interpolate({ inputRange: [0, 1], outputRange: [colors.textSecondary, color] });

  const isFilter = variant === 'filter';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState ?? { selected }}
    >
      {({ pressed }) => (
        <Animated.View style={[
          styles.base,
          isFilter ? styles.filterShape : styles.typeShape,
          { backgroundColor: bgColor, borderColor },
          pressed && { opacity: 0.82 },
        ]}>
          <MaterialIcons
            name={icon}
            size={isFilter ? 11 : 12}
            color={selected ? color : Colors.textMuted}
          />
          <Animated.Text style={[
            styles.label,
            isFilter ? styles.filterLabel : styles.typeLabel,
            { color: labelColor },
          ]}>
            {label}
          </Animated.Text>
          {isFilter && typeof count === 'number' && count > 0 && (
            <View style={[
              styles.badge,
              { backgroundColor: selected ? `${color}22` : Colors.surface },
            ]}>
              <Text style={[styles.badgeText, { color: selected ? color : Colors.textMuted }]}>
                {count}
              </Text>
            </View>
          )}
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  filterShape: {
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    minHeight: 32,
  },
  typeShape: {
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    minHeight: 34,
  },
  label: {
    fontWeight: '600',
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  typeLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  badge: {
    borderRadius: 9,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 17,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
});
