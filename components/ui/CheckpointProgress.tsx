import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Checkpoint } from '@/types';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  checkpoints: Checkpoint[];
  compact?: boolean;
}

interface CpStyle {
  iconColor: string;
  circleColor: string;
  borderColor: string;
  lineColor: string;
  textColor: string;
}

function getCheckpointStyle(status: Checkpoint['status']): CpStyle {
  switch (status) {
    case 'Cleared':
      return {
        iconColor: Colors.success,
        circleColor: Colors.successBg,
        borderColor: `${Colors.success}50`,
        lineColor: `${Colors.success}40`,
        textColor: Colors.textPrimary,
      };
    case 'Current':
      return {
        iconColor: Colors.primary,
        circleColor: Colors.primaryGlow,
        borderColor: Colors.primary,
        lineColor: Colors.border,
        textColor: Colors.primary,
      };
    case 'Pending':
      return {
        iconColor: Colors.warning,
        circleColor: Colors.warningBg,
        borderColor: `${Colors.warning}50`,
        lineColor: Colors.border,
        textColor: Colors.textSecondary,
      };
    case 'Upcoming':
    default:
      return {
        iconColor: Colors.textMuted,
        circleColor: Colors.surface,
        borderColor: Colors.border,
        lineColor: Colors.borderSubtle,
        textColor: Colors.textMuted,
      };
  }
}

export function CheckpointProgress({ checkpoints, compact = false }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {checkpoints.map((cp, index) => {
        const st = getCheckpointStyle(cp.status);
        const isLast = index === checkpoints.length - 1;

        return (
          <View key={cp.id} style={styles.row}>
            {/* Left column: circle + connector line */}
            <View style={styles.leftCol}>
              <View style={[styles.circle, { backgroundColor: st.circleColor, borderColor: st.borderColor }]}>
                {cp.status === 'Cleared' ? (
                  <MaterialIcons name="check" size={11} color={st.iconColor} />
                ) : cp.status === 'Current' ? (
                  <View style={[styles.innerDotPulse, { backgroundColor: st.iconColor }]} />
                ) : (
                  <View style={[styles.innerDot, { backgroundColor: st.iconColor, opacity: 0.45 }]} />
                )}
              </View>
              {!isLast && (
                <View style={[styles.line, { backgroundColor: st.lineColor }]} />
              )}
            </View>

            {/* Right column: content */}
            <View style={[styles.content, compact && styles.contentCompact]}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: st.textColor }]}>{cp.name}</Text>
                {cp.status === 'Cleared' && (
                  <View style={styles.clearedPill}>
                    <Text style={styles.clearedPillText}>DONE</Text>
                  </View>
                )}
                {cp.status === 'Current' && (
                  <View style={styles.currentPill}>
                    <View style={styles.currentPillDot} />
                    <Text style={styles.currentPillText}>NOW</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.location, { color: colors.textMuted }]}>{cp.location}</Text>
              {cp.timestamp && !compact && (
                <Text style={styles.timestamp}>{cp.timestamp}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: Spacing.xs },
  row: { flexDirection: 'row', gap: Spacing.md },
  leftCol: { alignItems: 'center', width: 26 },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  innerDotPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 14,
    marginTop: 2,
    borderRadius: 1,
  },
  content: {
    flex: 1,
    paddingBottom: Spacing.lg,
    gap: 3,
  },
  contentCompact: {
    paddingBottom: Spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  name: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  clearedPill: {
    backgroundColor: Colors.successBg,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: `${Colors.success}30`,
  },
  clearedPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.success,
    letterSpacing: 0.5,
  },
  currentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primaryGlow,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  currentPillDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  currentPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  location: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  timestamp: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    marginTop: 1,
  },
});
