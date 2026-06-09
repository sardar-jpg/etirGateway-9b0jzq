import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Dimensions, Animated, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useDrivers } from '@/hooks/useDrivers';
import { useAlert } from '@/template';
import { useLanguage } from '@/hooks/useLanguage';
import { LanguagePicker } from '@/components/ui/LanguagePicker';
import { useRouter } from 'expo-router';
import { Driver, TruckClass } from '@/types';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const TRUCK_ICONS: Record<TruckClass, keyof typeof MaterialIcons.glyphMap> = {
  'Refrigerated': 'ac-unit',
  'Flatbed': 'remove',
  'Box Truck': 'local-shipping',
  'Tanker': 'opacity',
  'Container': 'inventory-2',
};

// ── Driver card skeleton ─────────────────────────────────────────────────────
function DriverSkeleton() {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 850, useNativeDriver: false }),
        Animated.timing(shimmer, { toValue: 0, duration: 850, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const bg = shimmer.interpolate({ inputRange: [0, 1], outputRange: [Colors.surface, Colors.card] });

const pendingSt = StyleSheet.create({
  section: {
    marginHorizontal: Spacing.xl, marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg, overflow: 'hidden',
    borderWidth: 1.5, borderColor: `${Colors.warning}50`,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.warningBg,
    borderBottomWidth: 1, borderBottomColor: `${Colors.warning}30`,
    flexWrap: 'wrap', gap: Spacing.xs,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  iconWrap: {
    width: 24, height: 24, borderRadius: 7,
    backgroundColor: `${Colors.warning}20`, borderWidth: 1, borderColor: `${Colors.warning}40`,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 10, fontWeight: '800', color: Colors.warning, letterSpacing: 0.9 },
  badge: {
    backgroundColor: Colors.warning, borderRadius: 10,
    minWidth: 18, height: 18, paddingHorizontal: 5,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: Colors.bg },
  headerSub: { fontSize: FontSize.xs, color: Colors.warning, opacity: 0.75, marginLeft: 4 },
  card: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  accentBar: { width: 3, backgroundColor: Colors.warning, alignSelf: 'stretch' },
  cardInner: { flex: 1, padding: Spacing.lg, gap: Spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: `${Colors.warning}15`, borderWidth: 2, borderColor: `${Colors.warning}50`,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.warning },
  info: { flex: 1, gap: 4 },
  name: { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: FontSize.xs, color: Colors.textMuted },
  pendingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: `${Colors.warning}15`, borderRadius: BorderRadius.full,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: `${Colors.warning}40`, flexShrink: 0,
  },
  pendingPillDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.warning },
  pendingPillText: { fontSize: 9, fontWeight: '800', color: Colors.warning, letterSpacing: 0.6 },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.dangerBg, borderRadius: BorderRadius.md,
    paddingVertical: 10, borderWidth: 1, borderColor: `${Colors.danger}40`,
  },
  rejectBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.danger },
  approveBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.success, borderRadius: BorderRadius.md,
    paddingVertical: 10,
  },
  approveBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: '#fff' },
});
  const SkelBox = ({ w, h, radius = 6 }: { w: number | string; h: number; radius?: number }) => (
    <Animated.View style={{ width: w as any, height: h, borderRadius: radius, backgroundColor: bg }} />
  );
  return (
    <View style={skelStyles.card}>
      <View style={skelStyles.header}>
        <Animated.View style={[skelStyles.avatar, { backgroundColor: bg }]} />
        <View style={skelStyles.info}>
          <SkelBox w="55%" h={12} />
          <SkelBox w="35%" h={9} />
          <View style={skelStyles.pillRow}>
            <SkelBox w={52} h={18} radius={9} />
            <SkelBox w={42} h={18} radius={9} />
          </View>
        </View>
        <SkelBox w={18} h={18} radius={4} />
      </View>
    </View>
  );
}

const skelStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  info: { flex: 1, gap: 7 },
  pillRow: { flexDirection: 'row', gap: 6 },
});

const pendingSt = StyleSheet.create({
  section: {
    marginHorizontal: Spacing.xl, marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg, overflow: 'hidden',
    borderWidth: 1.5, borderColor: `${Colors.warning}50`,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.warningBg,
    borderBottomWidth: 1, borderBottomColor: `${Colors.warning}30`,
    flexWrap: 'wrap', gap: Spacing.xs,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  iconWrap: {
    width: 24, height: 24, borderRadius: 7,
    backgroundColor: `${Colors.warning}20`, borderWidth: 1, borderColor: `${Colors.warning}40`,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 10, fontWeight: '800', color: Colors.warning, letterSpacing: 0.9 },
  badge: {
    backgroundColor: Colors.warning, borderRadius: 10,
    minWidth: 18, height: 18, paddingHorizontal: 5,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: Colors.bg },
  headerSub: { fontSize: FontSize.xs, color: Colors.warning, opacity: 0.75, marginLeft: 4 },
  card: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  accentBar: { width: 3, backgroundColor: Colors.warning, alignSelf: 'stretch' },
  cardInner: { flex: 1, padding: Spacing.lg, gap: Spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: `${Colors.warning}15`, borderWidth: 2, borderColor: `${Colors.warning}50`,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.warning },
  info: { flex: 1, gap: 4 },
  name: { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: FontSize.xs, color: Colors.textMuted },
  pendingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: `${Colors.warning}15`, borderRadius: BorderRadius.full,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: `${Colors.warning}40`, flexShrink: 0,
  },
  pendingPillDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.warning },
  pendingPillText: { fontSize: 9, fontWeight: '800', color: Colors.warning, letterSpacing: 0.6 },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.dangerBg, borderRadius: BorderRadius.md,
    paddingVertical: 10, borderWidth: 1, borderColor: `${Colors.danger}40`,
  },
  rejectBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.danger },
  approveBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.success, borderRadius: BorderRadius.md,
    paddingVertical: 10,
  },
  approveBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: '#fff' },
});

// ── Stat skeleton ─────────────────────────────────────────────────────────────
function StatSkeleton() {
  const { colors } = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 850, useNativeDriver: false }),
        Animated.timing(shimmer, { toValue: 0, duration: 850, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const bg = shimmer.interpolate({ inputRange: [0, 1], outputRange: [colors.surface, colors.card] });

const pendingSt = StyleSheet.create({
  section: {
    marginHorizontal: Spacing.xl, marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg, overflow: 'hidden',
    borderWidth: 1.5, borderColor: `${Colors.warning}50`,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.warningBg,
    borderBottomWidth: 1, borderBottomColor: `${Colors.warning}30`,
    flexWrap: 'wrap', gap: Spacing.xs,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  iconWrap: {
    width: 24, height: 24, borderRadius: 7,
    backgroundColor: `${Colors.warning}20`, borderWidth: 1, borderColor: `${Colors.warning}40`,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 10, fontWeight: '800', color: Colors.warning, letterSpacing: 0.9 },
  badge: {
    backgroundColor: Colors.warning, borderRadius: 10,
    minWidth: 18, height: 18, paddingHorizontal: 5,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: Colors.bg },
  headerSub: { fontSize: FontSize.xs, color: Colors.warning, opacity: 0.75, marginLeft: 4 },
  card: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  accentBar: { width: 3, backgroundColor: Colors.warning, alignSelf: 'stretch' },
  cardInner: { flex: 1, padding: Spacing.lg, gap: Spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: `${Colors.warning}15`, borderWidth: 2, borderColor: `${Colors.warning}50`,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.warning },
  info: { flex: 1, gap: 4 },
  name: { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: FontSize.xs, color: Colors.textMuted },
  pendingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: `${Colors.warning}15`, borderRadius: BorderRadius.full,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: `${Colors.warning}40`, flexShrink: 0,
  },
  pendingPillDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.warning },
  pendingPillText: { fontSize: 9, fontWeight: '800', color: Colors.warning, letterSpacing: 0.6 },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.dangerBg, borderRadius: BorderRadius.md,
    paddingVertical: 10, borderWidth: 1, borderColor: `${Colors.danger}40`,
  },
  rejectBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.danger },
  approveBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.success, borderRadius: BorderRadius.md,
    paddingVertical: 10,
  },
  approveBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: '#fff' },
});
  return (
    <View style={[styles.statItem, { backgroundColor: colors.card, gap: 6, borderColor: colors.border }]}>
      <Animated.View style={{ width: 28, height: 22, borderRadius: 4, backgroundColor: bg }} />
      <Animated.View style={{ width: 44, height: 10, borderRadius: 4, backgroundColor: bg }} />
    </View>
  );
}

function useScreenWidth() {
  const [width, setWidth] = useState(() => Dimensions.get('window').width);
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setWidth(window.width));
    return () => sub?.remove();
  }, []);
  return width;
}

export default function DriversScreen() {
  const router = useRouter();
  const { drivers, pendingDrivers, loading, approvalLoading, approve, reject } = useDrivers();
  const { showAlert } = useAlert();
  const [selected, setSelected] = useState<Driver | null>(null);
  const { t, isRTL } = useLanguage();
  const { colors, isDark } = useTheme();
  const screenWidth = useScreenWidth();
  const isDesktop = screenWidth >= 1024;

  const activeCount = drivers.filter(d => d.status === 'Active').length;
  const idleCount = drivers.filter(d => d.status === 'Idle').length;
  const offlineCount = drivers.filter(d => d.status === 'Offline').length;
  const unverifiedCount = drivers.filter(d => !d.emailVerified).length;

  const handleApprove = async (id: string, name: string) => {
    const err = await approve(id);
    if (err) showAlert('Approval failed', err);
    else showAlert('Driver Approved', `${name} can now log in and receive shipments.`);
  };

  const handleReject = async (id: string, name: string) => {
    showAlert(
      `Reject ${name}?`,
      'Their registration will be marked as rejected and they will not be able to access the driver app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject', style: 'destructive',
          onPress: async () => {
            const err = await reject(id);
            if (err) showAlert('Rejection failed', err);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t('drivers.title')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {loading ? t('drivers.loading') : `${drivers.length} ${t('drivers.registeredDrivers')}`}
          </Text>
        </View>
        <View style={[styles.headerActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {!isDesktop && <LanguagePicker compact />}
          <Pressable style={styles.addBtn} onPress={() => router.push('/') }>
            <MaterialIcons name="person-add" size={16} color="#fff" />
            <Text style={styles.addBtnText}>{t('drivers.inviteDriver')}</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Pending Approval Section ── */}
      {pendingDrivers.length > 0 && (
        <View style={[pendingSt.section, { backgroundColor: colors.bg }]}>
          <View style={[pendingSt.headerRow, { borderBottomColor: colors.border }]}>
            <View style={pendingSt.headerLeft}>
              <View style={pendingSt.iconWrap}>
                <MaterialIcons name="pending-actions" size={14} color={Colors.warning} />
              </View>
              <Text style={pendingSt.headerTitle}>PENDING APPROVAL</Text>
              <View style={pendingSt.badge}>
                <Text style={pendingSt.badgeText}>{pendingDrivers.length}</Text>
              </View>
            </View>
            <Text style={pendingSt.headerSub}>New driver registrations awaiting review</Text>
          </View>

          <ScrollView horizontal={false} showsVerticalScrollIndicator={false}>
            {pendingDrivers.map((driver, idx) => {
              const isLoading = !!approvalLoading[driver.id];
              return (
                <View
                  key={driver.id}
                  style={[
                    pendingSt.card,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    idx < pendingDrivers.length - 1 && { borderBottomColor: colors.border },
                  ]}
                >
                  {/* Left warning accent */}
                  <View style={pendingSt.accentBar} />

                  <View style={pendingSt.cardInner}>
                    {/* Avatar + info */}
                    <View style={[pendingSt.topRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <View style={pendingSt.avatar}>
                        <Text style={pendingSt.avatarText}>{driver.avatarInitials}</Text>
                      </View>
                      <View style={pendingSt.info}>
                        <Text style={[pendingSt.name, { color: colors.textPrimary }]}>{driver.fullName}</Text>
                        <View style={[pendingSt.metaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                          <MaterialIcons name="local-shipping" size={10} color={Colors.textMuted} />
                          <Text style={[pendingSt.meta, { color: colors.textMuted }]} numberOfLines={1}>
                            {driver.plateNumber} · {driver.truckClass}
                          </Text>
                        </View>
                        {driver.email ? (
                          <View style={[pendingSt.metaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <MaterialIcons name="mail-outline" size={10} color={Colors.textMuted} />
                            <Text style={[pendingSt.meta, { color: colors.textMuted }]} numberOfLines={1}>{driver.email}</Text>
                          </View>
                        ) : null}
                        {driver.phone ? (
                          <View style={[pendingSt.metaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <MaterialIcons name="phone" size={10} color={Colors.textMuted} />
                            <Text style={[pendingSt.meta, { color: colors.textMuted }]}>{driver.phone}</Text>
                          </View>
                        ) : null}
                      </View>
                      <View style={pendingSt.pendingPill}>
                        <View style={pendingSt.pendingPillDot} />
                        <Text style={pendingSt.pendingPillText}>PENDING</Text>
                      </View>
                    </View>

                    {/* Action buttons */}
                    <View style={[pendingSt.actions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <Pressable
                        style={({ pressed }) => [
                          pendingSt.rejectBtn,
                          (pressed || isLoading) && { opacity: 0.7 },
                        ]}
                        onPress={() => handleReject(driver.id, driver.fullName)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <ActivityIndicator size="small" color={Colors.danger} />
                        ) : (
                          <>
                            <MaterialIcons name="close" size={14} color={Colors.danger} />
                            <Text style={pendingSt.rejectBtnText}>Reject</Text>
                          </>
                        )}
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [
                          pendingSt.approveBtn,
                          (pressed || isLoading) && { opacity: 0.7 },
                        ]}
                        onPress={() => handleApprove(driver.id, driver.fullName)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <MaterialIcons name="check" size={14} color="#fff" />
                            <Text style={pendingSt.approveBtnText}>Approve</Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Stats strip */}
      {loading ? (
        <View style={[styles.statsStrip, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          {[0, 1, 2, 3].map(i => <StatSkeleton key={i} />)}
        </View>
      ) : (
        <View style={[styles.statsStrip, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          {[
            { label: t('drivers.active'), count: activeCount, color: Colors.success, bg: Colors.successBg },
            { label: t('drivers.idle'), count: idleCount, color: Colors.warning, bg: Colors.warningBg },
            { label: t('drivers.offline'), count: offlineCount, color: colors.textMuted, bg: colors.card },
            { label: t('drivers.unverified'), count: unverifiedCount, color: Colors.danger, bg: Colors.dangerBg },
          ].map(stat => (
            <View key={stat.label} style={[styles.statItem, { backgroundColor: stat.bg, borderColor: colors.border }]}>
              <Text style={[styles.statCount, { color: stat.color }]}>{stat.count}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={isDesktop ? styles.desktopBody : { flex: 1 }}>
        {/* Drivers list */}
        <ScrollView
          style={isDesktop ? [styles.desktopList, { width: Math.max(300, Math.min(400, screenWidth * 0.34)), borderRightColor: colors.border }] : styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.list, isDesktop && styles.listDesktop]}>
            {loading
              ? [0, 1, 2, 3].map(i => <DriverSkeleton key={i} />)
              : drivers.map(driver => (
              <Pressable
                key={driver.id}
                style={({ pressed }) => [
                  styles.driverCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  pressed && { opacity: 0.88 },
                  Shadow.card,
                  isDesktop && selected?.id === driver.id && styles.driverCardSelected,
                ]}
                onPress={() => setSelected(selected?.id === driver.id ? null : driver)}
              >
                <View style={[styles.driverHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.avatar, {
                    borderColor: driver.status === 'Active' ? Colors.success : driver.status === 'Idle' ? Colors.warning : colors.border,
                  }]}>
                    <Text style={styles.avatarText}>{driver.avatarInitials}</Text>
                    <View style={[styles.statusDot, {
                      backgroundColor: driver.status === 'Active' ? Colors.success : driver.status === 'Idle' ? Colors.warning : colors.textMuted,
                      borderColor: colors.card,
                    }]} />
                  </View>

                  <View style={styles.driverInfo}>
                    <View style={[styles.nameRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <Text style={[styles.driverName, { color: colors.textPrimary }]}>{driver.fullName}</Text>
                      {!driver.emailVerified && (
                        <View style={styles.unverifiedBadge}>
                          <MaterialIcons name="warning" size={10} color={Colors.warning} />
                          <Text style={styles.unverifiedText}>Unverified</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.driverPlate, { color: colors.textMuted }]}>{driver.plateNumber}</Text>
                    <View style={[styles.truckRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <MaterialIcons name={TRUCK_ICONS[driver.truckClass] ?? 'local-shipping'} size={12} color={colors.textMuted} />
                      <Text style={[styles.truckText, { color: colors.textSecondary }]}>{driver.truckClass}</Text>
                      <View style={[styles.statusPill, {
                        backgroundColor: driver.status === 'Active' ? Colors.successBg : driver.status === 'Idle' ? Colors.warningBg : colors.card,
                      }]}>
                        <Text style={[styles.statusPillText, {
                          color: driver.status === 'Active' ? Colors.success : driver.status === 'Idle' ? Colors.warning : colors.textMuted,
                        }]}>{driver.status}</Text>
                      </View>
                    </View>
                  </View>

                  {!isDesktop && (
                    <MaterialIcons
                      name={selected?.id === driver.id ? 'expand-less' : 'expand-more'}
                      size={20}
                      color={colors.textMuted}
                      accessibilityLabel={selected?.id === driver.id ? 'Collapse driver details' : 'Expand driver details'}
                      accessibilityHint="Double-tap to expand driver details"
                    />
                  )}
                  {isDesktop && (
                    <MaterialIcons name="chevron-right" size={18} color={colors.textMuted} />
                  )}
                </View>

                {/* Mobile expanded details */}
                {!isDesktop && selected?.id === driver.id && (
                  <View style={styles.expandedSection}>
                    <View style={[styles.expandedDivider, { backgroundColor: colors.border }]} />
                    {[
                      { icon: 'alternate-email' as const, label: t('drivers.username'), value: driver.username },
                      { icon: 'mail-outline' as const, label: t('drivers.emailLabel'), value: driver.email },
                      { icon: 'phone' as const, label: t('drivers.phoneLabel'), value: driver.phone },
                      { icon: 'verified-user' as const, label: t('drivers.emailVerified'), value: driver.emailVerified ? t('drivers.yes') : t('drivers.noPending') },
                    ].map(row => (
                      <View key={row.label} style={styles.expandedRow}>
                        <MaterialIcons name={row.icon} size={14} color={colors.textMuted} />
                        <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>{row.label}</Text>
                        <Text style={[styles.expandedValue, { color: colors.textPrimary }, row.label === 'Email Verified' && { color: driver.emailVerified ? Colors.success : Colors.danger }]}>
                          {row.value}
                        </Text>
                      </View>
                    ))}
                    <View style={[styles.actionRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <Pressable
                        style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.75 }]}
                        onPress={() => router.push('/(tabs)/chat' as any)}
                      >
                        <MaterialIcons name="chat" size={14} color={Colors.primary} />
                        <Text style={styles.actionBtnText}>{t('drivers.message')}</Text>
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.75 }]}
                        onPress={() => router.push('/(tabs)/shipments' as any)}
                      >
                        <MaterialIcons name="local-shipping" size={14} color={Colors.primary} />
                        <Text style={styles.actionBtnText}>{t('drivers.viewShipments')}</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Desktop detail panel */}
        {isDesktop && (
          <View style={[styles.detailPanel, { backgroundColor: colors.bg }]}>
            {selected ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailContent}>
                  {/* Driver hero */}
                  <View style={styles.detailHero}>
                    <View style={[styles.detailAvatar, {
                      borderColor: selected.status === 'Active' ? Colors.success : selected.status === 'Idle' ? Colors.warning : colors.border,
                    }]}>
                      <Text style={styles.detailAvatarText}>{selected.avatarInitials}</Text>
                    </View>
                    <Text style={[styles.detailName, { color: colors.textPrimary }]}>{selected.fullName}</Text>
                    <View style={[styles.statusPill, {
                      backgroundColor: selected.status === 'Active' ? Colors.successBg : selected.status === 'Idle' ? Colors.warningBg : colors.card,
                      paddingHorizontal: 14, paddingVertical: 5,
                    }]}>
                      <Text style={[styles.statusPillText, {
                        fontSize: FontSize.sm,
                        color: selected.status === 'Active' ? Colors.success : selected.status === 'Idle' ? Colors.warning : colors.textMuted,
                      }]}>{selected.status}</Text>
                    </View>
                  </View>

                  {/* Info rows */}
                  <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.detailSectionLabel, { color: colors.textMuted }]}>{t('drivers.driverDetails')}</Text>
                    {[
                      { icon: 'local-shipping' as const, label: t('drivers.plateNumber'), value: selected.plateNumber },
                      { icon: 'directions-car' as const, label: t('drivers.truckClass'), value: selected.truckClass },
                      { icon: 'alternate-email' as const, label: t('drivers.username'), value: selected.username || '—' },
                      { icon: 'mail-outline' as const, label: t('drivers.emailLabel'), value: selected.email || '—' },
                      { icon: 'phone' as const, label: t('drivers.phoneLabel'), value: selected.phone || '—' },
                      { icon: 'verified-user' as const, label: t('drivers.emailVerified'), value: selected.emailVerified ? t('drivers.verified') : t('drivers.notVerified') },
                    ].map((row, i, arr) => (
                      <View key={row.label} style={[styles.detailRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }]}>
                        <View style={styles.detailRowIcon}>
                          <MaterialIcons name={row.icon} size={15} color={colors.textMuted} />
                        </View>
                        <Text style={[styles.detailRowLabel, { color: colors.textSecondary }]}>{row.label}</Text>
                        <Text style={[
                          styles.detailRowValue, { color: colors.textPrimary },
                          row.label === 'Email Verified' && { color: selected.emailVerified ? Colors.success : Colors.danger },
                        ]}>{row.value}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Actions */}
                  <View style={styles.detailActions}>
                    <Pressable
                      style={({ pressed }) => [styles.detailActionBtn, pressed && { opacity: 0.75 }]}
                      onPress={() => router.push('/(tabs)/chat' as any)}
                    >
                      <MaterialIcons name="chat" size={16} color={Colors.primary} />
                      <Text style={styles.detailActionText}>{t('drivers.openChat')}</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [styles.detailActionBtn, pressed && { opacity: 0.75 }]}
                      onPress={() => router.push('/(tabs)/shipments' as any)}
                    >
                      <MaterialIcons name="local-shipping" size={16} color={Colors.primary} />
                      <Text style={styles.detailActionText}>{t('drivers.viewShipments')}</Text>
                    </Pressable>
                    <Pressable style={[styles.detailActionBtn, { borderColor: Colors.danger, backgroundColor: Colors.dangerBg }]}>
                      <MaterialIcons name="block" size={16} color={Colors.danger} />
                      <Text style={[styles.detailActionText, { color: Colors.danger }]}>{t('drivers.suspend')}</Text>
                    </Pressable>
                  </View>
                </View>
              </ScrollView>
            ) : (
              <View style={styles.detailEmpty}>
                <MaterialIcons name="person-outline" size={48} color={colors.border} />
                <Text style={[styles.detailEmptyTitle, { color: colors.textSecondary }]}>{t('drivers.selectDriver')}</Text>
                <Text style={[styles.detailEmptySub, { color: colors.textMuted }]}>{t('drivers.selectDriverSub')}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  addBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: '#fff' },

  statsStrip: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  statItem: {
    flex: 1, alignItems: 'center', gap: 3,
    borderRadius: BorderRadius.md, paddingVertical: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  statCount: { fontSize: FontSize.xl, fontWeight: '700' },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '500' },

  desktopBody: { flex: 1, flexDirection: 'row' },
  desktopList: { borderRightWidth: 1, borderRightColor: Colors.border },
  scroll: { flex: 1 },
  list: { padding: Spacing.xl, gap: Spacing.md },
  listDesktop: { padding: Spacing.lg, gap: Spacing.sm },

  driverCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  driverCardSelected: {
    borderColor: Colors.primary, backgroundColor: Colors.primaryGlow,
  },
  driverHeader: {
    alignItems: 'center', gap: Spacing.md,
    padding: Spacing.lg,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primaryGlow, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  avatarText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  statusDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, borderColor: Colors.card,
  },
  driverInfo: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  driverName: { fontSize: FontSize.base, fontWeight: '600', color: Colors.textPrimary, flexShrink: 1 },
  unverifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.warningBg, borderRadius: BorderRadius.full,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  unverifiedText: { fontSize: 10, color: Colors.warning, fontWeight: '600' },
  driverPlate: { fontSize: FontSize.xs, color: Colors.textMuted, fontFamily: 'monospace' },
  truckRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  truckText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  statusPill: { borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 2 },
  statusPillText: { fontSize: 10, fontWeight: '600' },

  expandedSection: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  expandedDivider: { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.lg },
  expandedRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm,
  },
  expandedLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  expandedValue: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '500', textAlign: 'right' },
  actionRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.primaryGlow, borderRadius: BorderRadius.md,
    paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(47,129,247,0.2)',
  },
  actionBtnText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },

  // Desktop detail panel
  detailPanel: { flex: 1, backgroundColor: Colors.bg },
  detailContent: { padding: Spacing.xxxl, gap: Spacing.xl },
  detailHero: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xl },
  detailAvatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primaryGlow, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  detailAvatarText: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.primary },
  detailName: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.textPrimary },
  detailCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  detailSectionLabel: {
    fontSize: 10, fontWeight: '700', color: Colors.textMuted,
    letterSpacing: 1.2, textTransform: 'uppercase',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: 12,
  },
  detailRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  detailRowIcon: { width: 22, alignItems: 'center' },
  detailRowLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  detailRowValue: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '500' },
  detailActions: { flexDirection: 'row', gap: Spacing.md },
  detailActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.primaryGlow, borderRadius: BorderRadius.md,
    paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(47,129,247,0.25)',
  },
  detailActionText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  detailEmpty: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, padding: 60,
  },
  detailEmptyTitle: { fontSize: FontSize.xl, fontWeight: '600', color: Colors.textSecondary },
  detailEmptySub: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 22, maxWidth: 320 },
});

const pendingSt = StyleSheet.create({
  section: {
    marginHorizontal: Spacing.xl, marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg, overflow: 'hidden',
    borderWidth: 1.5, borderColor: `${Colors.warning}50`,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.warningBg,
    borderBottomWidth: 1, borderBottomColor: `${Colors.warning}30`,
    flexWrap: 'wrap', gap: Spacing.xs,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  iconWrap: {
    width: 24, height: 24, borderRadius: 7,
    backgroundColor: `${Colors.warning}20`, borderWidth: 1, borderColor: `${Colors.warning}40`,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 10, fontWeight: '800', color: Colors.warning, letterSpacing: 0.9 },
  badge: {
    backgroundColor: Colors.warning, borderRadius: 10,
    minWidth: 18, height: 18, paddingHorizontal: 5,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: Colors.bg },
  headerSub: { fontSize: FontSize.xs, color: Colors.warning, opacity: 0.75, marginLeft: 4 },
  card: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  accentBar: { width: 3, backgroundColor: Colors.warning, alignSelf: 'stretch' },
  cardInner: { flex: 1, padding: Spacing.lg, gap: Spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: `${Colors.warning}15`, borderWidth: 2, borderColor: `${Colors.warning}50`,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.warning },
  info: { flex: 1, gap: 4 },
  name: { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: FontSize.xs, color: Colors.textMuted },
  pendingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: `${Colors.warning}15`, borderRadius: BorderRadius.full,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: `${Colors.warning}40`, flexShrink: 0,
  },
  pendingPillDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.warning },
  pendingPillText: { fontSize: 9, fontWeight: '800', color: Colors.warning, letterSpacing: 0.6 },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.dangerBg, borderRadius: BorderRadius.md,
    paddingVertical: 10, borderWidth: 1, borderColor: `${Colors.danger}40`,
  },
  rejectBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.danger },
  approveBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.success, borderRadius: BorderRadius.md,
    paddingVertical: 10,
  },
  approveBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: '#fff' },
});
