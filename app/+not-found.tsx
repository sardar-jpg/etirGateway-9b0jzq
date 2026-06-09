import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLanguage } from '@/hooks/useLanguage';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '@/constants/theme';

export default function NotFoundScreen() {
  const router = useRouter();
  const { t, isRTL } = useLanguage();

  // Entrance animation
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 220, friction: 14 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 220, friction: 14 }),
    ]).start();
  }, []);

  // Pulse animation on the 404 number
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1400, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleHome = () => {
    router.replace('/(tabs)' as any);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        {/* ── Brand mark ── */}
        <View style={[styles.brandRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.brandIcon}>
            <MaterialIcons name="swap-horiz" size={16} color={Colors.primary} />
          </View>
          <Text style={styles.brandText}>e-TIR</Text>
          <View style={styles.brandDivider} />
          <Text style={styles.brandSub}>by MARAS GROUP</Text>
        </View>

        {/* ── Illustration card ── */}
        <View style={styles.illustrationCard}>
          {/* Decorative grid lines */}
          <View style={styles.gridOverlay} pointerEvents="none">
            {[0, 1, 2, 3].map(i => (
              <View key={i} style={[styles.gridLine, { left: `${25 * i}%` as any }]} />
            ))}
          </View>

          {/* 404 number */}
          <Animated.Text style={[styles.errorCode, { transform: [{ scale: pulseAnim }] }]}>
            {t('notFound.subtitle')}
          </Animated.Text>

          {/* Icon cluster */}
          <View style={styles.iconCluster}>
            <View style={[styles.iconOrbit, styles.iconOrbitLeft]}>
              <MaterialIcons name="local-shipping" size={18} color={`${Colors.primary}80`} />
            </View>
            <View style={styles.iconCenter}>
              <MaterialIcons name="search-off" size={36} color={Colors.primary} />
            </View>
            <View style={[styles.iconOrbit, styles.iconOrbitRight]}>
              <MaterialIcons name="route" size={18} color={`${Colors.info}80`} />
            </View>
          </View>

          {/* Status strip */}
          <View style={styles.statusStrip}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>ROUTE NOT FOUND</Text>
          </View>
        </View>

        {/* ── Copy ── */}
        <View style={styles.copy}>
          <Text style={styles.title}>{t('notFound.title')}</Text>
          <Text style={styles.message}>{t('notFound.message')}</Text>
        </View>

        {/* ── Actions ── */}
        <View style={[styles.actions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable
            style={({ pressed }) => [styles.btnSecondary, pressed && { opacity: 0.75 }]}
            onPress={handleBack}
            accessibilityLabel={t('notFound.goBack')}
            accessibilityRole="button"
          >
            <MaterialIcons
              name={isRTL ? 'arrow-forward' : 'arrow-back'}
              size={16}
              color={Colors.textSecondary}
            />
            <Text style={styles.btnSecondaryText}>{t('notFound.goBack')}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.88 }]}
            onPress={handleHome}
            accessibilityLabel={t('notFound.goHome')}
            accessibilityRole="button"
          >
            <MaterialIcons name="dashboard" size={16} color="#fff" />
            <Text style={styles.btnPrimaryText}>{t('notFound.goHome')}</Text>
          </Pressable>
        </View>

        {/* ── Footer ── */}
        <Text style={styles.footer}>e-tir Gateway · MARAS Group Logistics</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
    gap: Spacing.xl,
  },

  // ── Brand ──────────────────────────────────────────────────────────────────
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  brandIcon: {
    width: 28, height: 28, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1, borderColor: 'rgba(47,129,247,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  brandText: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  brandDivider: {
    width: 1, height: 12,
    backgroundColor: Colors.border,
  },
  brandSub: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.6,
  },

  // ── Illustration ───────────────────────────────────────────────────────────
  illustrationCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.lg,
    overflow: 'hidden',
    ...Shadow.card,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  gridLine: {
    position: 'absolute',
    top: 0, bottom: 0,
    width: 1,
    backgroundColor: Colors.borderSubtle,
  },
  errorCode: {
    fontSize: 72,
    fontWeight: '800',
    color: Colors.primaryGlow,
    letterSpacing: -2,
    fontFamily: 'monospace',
    // Text uses color as a CSS-like tint — stroke via shadow
    textShadowColor: Colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  iconCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  iconOrbit: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  iconOrbitLeft: {
    transform: [{ translateY: -8 }],
  },
  iconOrbitRight: {
    transform: [{ translateY: 8 }],
  },
  iconCenter: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1.5, borderColor: 'rgba(47,129,247,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  statusStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.border,
  },
  statusDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.danger,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.2,
    fontFamily: 'monospace',
  },

  // ── Copy ──────────────────────────────────────────────────────────────────
  copy: {
    alignItems: 'center',
    gap: Spacing.sm,
    maxWidth: 320,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Actions ───────────────────────────────────────────────────────────────
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
    maxWidth: 360,
  },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    paddingVertical: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  btnSecondaryText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  btnPrimary: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: 14,
  },
  btnPrimaryText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: '#fff',
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    letterSpacing: 0.4,
    marginTop: Spacing.sm,
  },
});
