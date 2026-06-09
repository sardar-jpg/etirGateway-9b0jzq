/**
 * Chip — unified filter/type chip component.
 *
 * variant="filter"  → pill shape (borderRadius ≈ height/2), renders optional count badge
 * variant="type"    → rounded rectangle (borderRadius md), no badge
 *
 * Both variants animate background, border, and label colors on selection.
 */
import React, { useRef, useEffect } from 'react';
import { Animated, Pressable, View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontSize, BorderRadius } from '@/constants/theme';

interface ChipProps {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  selected: boolean;
  onPress: () => void;
  /** Only shown for variant="filter" */
  count?: number;
  variant?: 'filter' | 'type';
  /** Forwarded directly to the Pressable for custom screen-reader label */
  accessibilityLabel?: string;
  /** Forwarded directly to the Pressable */
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

  useEffect(() => {
    Animated.timing(progress, {
      toValue: selected ? 1 : 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
  }, [selected]);

  const bgColor     = progress.interpolate({ inputRange: [0, 1], outputRange: [variant === 'filter' ? Colors.card : Colors.surface, `${color}1E`] });
  const borderColor = progress.interpolate({ inputRange: [0, 1], outputRange: [Colors.border, color] });
  const labelColor  = progress.interpolate({ inputRange: [0, 1], outputRange: [Colors.textSecondary, color] });

  const isFilter = variant === 'filter';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState ?? { selected }}
    >
      <Animated.View style={[
        styles.base,
        isFilter ? styles.filterShape : styles.typeShape,
        { backgroundColor: bgColor, borderColor },
      ]}>
        <MaterialIcons
          name={icon}
          size={isFilter ? 12 : 13}
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
            { backgroundColor: selected ? `${color}28` : Colors.surface },
          ]}>
            <Text style={[styles.badgeText, { color: selected ? color : Colors.textMuted }]}>
              {count}
            </Text>
          </View>
        )}
      </Animated.View>
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
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    minHeight: 34,
  },
  typeShape: {
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    minHeight: 34,
  },
  label: {
    fontWeight: '600',
  },
  filterLabel: {
    fontSize: 12,
  },
  typeLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
