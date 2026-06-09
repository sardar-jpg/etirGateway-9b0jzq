import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { useShipments } from '@/hooks/useShipments';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { ControlPanel } from '@/components/feature/ControlPanel';
import { LanguagePicker } from '@/components/ui/LanguagePicker';
import { FontSize, Spacing, BorderRadius } from '@/constants/theme';

interface NavItem {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route: string;
  badge?: number;
  color?: string;
}

export function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { totalUnread } = useChat();
  const { shipments } = useShipments();
  const [controlPanelOpen, setControlPanelOpen] = useState(false);
  const { t } = useLanguage();
  const { colors } = useTheme();

  const customsCount = shipments.filter(s =>
    s.status === 'Customs Clearance' || s.status === 'Customs Pending'
  ).length;

  const navItems: NavItem[] = [
    { label: t('nav.dashboard'),    icon: 'dashboard',       route: '/(tabs)',           color: colors.primary },
    { label: t('nav.shipments'),    icon: 'local-shipping',  route: '/(tabs)/shipments', color: colors.info,
      badge: customsCount > 0 ? customsCount : undefined },
    { label: t('nav.drivers'),      icon: 'people',          route: '/(tabs)/drivers',   color: colors.success },
    { label: 'Clients',             icon: 'business',        route: '/(tabs)/clients',   color: '#D2A8FF' },
    { label: t('nav.chat'),         icon: 'chat',            route: '/(tabs)/chat',      color: colors.warning,
      badge: totalUnread > 0 ? totalUnread : undefined },
  ];

  const isActive = (route: string) => {
    if (route === '/(tabs)') return pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index';
    return pathname.includes(route.replace('/(tabs)', ''));
  };

  const initials = user?.displayName?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() ?? 'AD';

  return (
    <>
      <View style={{
        width: 256, height: '100%',
        backgroundColor: colors.surface,
        borderRightWidth: 1, borderRightColor: colors.border,
        flexDirection: 'column', paddingBottom: Spacing.lg,
      }}>
        {/* ── Brand ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg }}>
          <View style={{
            width: 44, height: 44, borderRadius: BorderRadius.lg,
            backgroundColor: colors.primaryGlow, borderWidth: 1.5, borderColor: colors.primaryBorder,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <MaterialIcons name="shield" size={22} color={colors.primary} />
          </View>
          <View>
            <Text style={{ fontSize: FontSize.base, fontWeight: '700', color: colors.textPrimary, letterSpacing: 0.2 }}>e-TIR Gateway</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: colors.success }} />
              <Text style={{ fontSize: 10, color: colors.textMuted }}>MARAS Group · v2.0</Text>
            </View>
          </View>
        </View>

        {/* ── User Card ── */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
          marginHorizontal: Spacing.md, backgroundColor: colors.card,
          borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: colors.border,
          paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
        }}>
          <View style={{ position: 'relative' }}>
            <View style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: colors.primaryGlow, borderWidth: 1.5, borderColor: colors.primary,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: FontSize.xs, fontWeight: '700', color: colors.primary }}>{initials}</Text>
            </View>
            <View style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 9, height: 9, borderRadius: 5,
              backgroundColor: colors.success, borderWidth: 1.5, borderColor: colors.surface,
            }} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.textPrimary }} numberOfLines={1}>{user?.displayName ?? 'Admin'}</Text>
            <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 1 }} numberOfLines={1}>{user?.email ?? ''}</Text>
          </View>
          <Pressable
            style={({ pressed }) => ({
              width: 28, height: 28, borderRadius: 14,
              backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.7 : 1,
            })}
            onPress={async () => { await logout(); router.replace('/' as any); }}
            hitSlop={8}
          >
            <MaterialIcons name="logout" size={15} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: Spacing.xl, marginVertical: Spacing.md }} />

        {/* ── Navigation ── */}
        <View style={{ paddingHorizontal: Spacing.md, gap: 2, marginBottom: Spacing.xs }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 1.2, marginBottom: 6, marginLeft: Spacing.sm }}>
            {t('nav.adminPanel')}
          </Text>
          {navItems.map(item => {
            const active = isActive(item.route);
            const iconColor = active ? (item.color ?? colors.primary) : colors.textSecondary;
            return (
              <Pressable
                key={item.route}
                style={({ pressed }) => ({
                  flexDirection: 'row' as const, alignItems: 'center' as const, gap: Spacing.sm,
                  paddingHorizontal: Spacing.sm, paddingVertical: 9,
                  borderRadius: BorderRadius.md, position: 'relative' as const, overflow: 'hidden' as const,
                  minHeight: 44,
                  backgroundColor: active ? colors.primaryGlow : pressed ? colors.card : 'transparent',
                })}
                onPress={() => router.push(item.route as any)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                {active && (
                  <View style={{
                    position: 'absolute', left: 0, top: 8, bottom: 8,
                    width: 3, borderRadius: 2, backgroundColor: item.color ?? colors.primary,
                  }} />
                )}
                <View style={{
                  width: 32, height: 32, borderRadius: BorderRadius.sm,
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: active ? `${item.color ?? colors.primary}30` : 'transparent',
                  backgroundColor: active ? `${item.color ?? colors.primary}18` : 'transparent',
                }}>
                  <MaterialIcons name={item.icon} size={17} color={iconColor} />
                </View>
                <Text style={{ flex: 1, fontSize: FontSize.sm, fontWeight: active ? '700' : '500', color: active ? (item.color ?? colors.primary) : colors.textSecondary }}>
                  {item.label}
                </Text>
                {item.badge ? (
                  <View style={{
                    backgroundColor: active ? (item.color ?? colors.danger) : colors.danger,
                    borderRadius: 10, minWidth: 18, height: 18, paddingHorizontal: 4,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 10, color: '#fff', fontWeight: '700' }}>{item.badge > 99 ? '99+' : item.badge}</Text>
                  </View>
                ) : (
                  active ? <MaterialIcons name="chevron-right" size={14} color={item.color ?? colors.primary} /> : null
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: Spacing.xl, marginVertical: Spacing.md }} />

        {/* ── Quick Access ── */}
        <View style={{ paddingHorizontal: Spacing.md, gap: 2 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 1.2, marginBottom: 6, marginLeft: Spacing.sm }}>
            {t('nav.quickAccess')}
          </Text>
          <Pressable
            style={({ pressed }) => ({
              flexDirection: 'row' as const, alignItems: 'center' as const, gap: Spacing.sm,
              paddingHorizontal: Spacing.sm, paddingVertical: 10,
              borderRadius: BorderRadius.md, backgroundColor: colors.primaryGlow,
              borderWidth: 1, borderColor: colors.primaryBorder,
              marginBottom: 4, opacity: pressed ? 0.85 : 1,
            })}
            onPress={() => setControlPanelOpen(true)}
          >
            <View style={{
              width: 32, height: 32, borderRadius: BorderRadius.sm,
              backgroundColor: `${colors.primary}30`, alignItems: 'center', justifyContent: 'center',
            }}>
              <MaterialIcons name="tune" size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: FontSize.sm, fontWeight: '700', color: colors.primary }}>{t('nav.adminPanel')}</Text>
              <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 1 }}>Operations · Alerts · Fleet</Text>
            </View>
            <MaterialIcons name="launch" size={13} color={colors.primary} />
          </Pressable>

          <Pressable
            style={({ pressed }) => ({
              flexDirection: 'row' as const, alignItems: 'center' as const, gap: Spacing.sm,
              paddingHorizontal: Spacing.sm, paddingVertical: 9,
              borderRadius: BorderRadius.md, minHeight: 44,
              backgroundColor: pressed ? colors.card : 'transparent',
            })}
            onPress={() => router.push('/tracking' as any)}
          >
            <View style={{ width: 32, height: 32, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' }}>
              <MaterialIcons name="my-location" size={17} color={colors.textSecondary} />
            </View>
            <Text style={{ flex: 1, fontSize: FontSize.sm, fontWeight: '500', color: colors.textSecondary }}>{t('nav.publicTracking')}</Text>
            <MaterialIcons name="open-in-new" size={12} color={colors.textMuted} />
          </Pressable>
        </View>

        <View style={{ flex: 1 }} />

        {/* ── Language + Theme ── */}
        <View style={{ paddingHorizontal: Spacing.xl, paddingBottom: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <View style={{ flex: 1 }}>
            <LanguagePicker />
          </View>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: Spacing.xl, marginVertical: Spacing.md }} />

        {/* ── Status ── */}
        <View style={{
          marginHorizontal: Spacing.md, backgroundColor: colors.card,
          borderRadius: BorderRadius.md, borderWidth: 1, borderColor: colors.border,
          padding: Spacing.md, gap: 4,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success }} />
            <Text style={{ fontSize: FontSize.xs, fontWeight: '600', color: colors.success }}>{t('app.allSystemsOk')}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MaterialIcons name="cloud-done" size={11} color={colors.textMuted} />
            <Text style={{ fontSize: 10, color: colors.textMuted }}>{t('app.backendConnected')}</Text>
          </View>
        </View>
      </View>

      <ControlPanel visible={controlPanelOpen} onClose={() => setControlPanelOpen(false)} />
    </>
  );
}
