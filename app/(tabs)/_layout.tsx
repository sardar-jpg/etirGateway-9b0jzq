import { MaterialIcons } from '@expo/vector-icons';
import { Tabs, Slot } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, Dimensions, View, Text, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { BorderRadius } from '@/constants/theme';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { useChat } from '@/hooks/useChat';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => Dimensions.get('window').width >= 1024);
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setIsDesktop(window.width >= 1024);
    });
    return () => sub?.remove();
  }, []);
  return isDesktop;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const isDesktop = useIsDesktop();
  const { totalUnread } = useChat();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();

  if (isDesktop) {
    return (
      <View style={styles.desktopRoot}>
        <AdminSidebar />
        <View style={[styles.desktopContent, { backgroundColor: colors.bg }]}>
          <Slot />
        </View>
      </View>
    );
  }

  const tabBarHeight = Platform.select({ ios: insets.bottom + 62, android: insets.bottom + 62, default: 72 });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: tabBarHeight,
          paddingTop: 8,
          paddingBottom: Platform.select({ ios: insets.bottom + 8, android: insets.bottom + 8, default: 10 }),
          paddingHorizontal: 4,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.dashboard'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[tabStyles.iconWrap, focused && { backgroundColor: isDark ? 'rgba(47,129,247,0.15)' : 'rgba(9,105,218,0.1)' }]}>
              <MaterialIcons name="dashboard" size={20} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="shipments"
        options={{
          title: t('nav.shipments'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[tabStyles.iconWrap, focused && { backgroundColor: isDark ? 'rgba(47,129,247,0.15)' : 'rgba(9,105,218,0.1)' }]}>
              <MaterialIcons name="local-shipping" size={20} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="drivers"
        options={{
          title: t('nav.drivers'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[tabStyles.iconWrap, focused && { backgroundColor: isDark ? 'rgba(47,129,247,0.15)' : 'rgba(9,105,218,0.1)' }]}>
              <MaterialIcons name="people" size={20} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: t('nav.clients'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[tabStyles.iconWrap, focused && { backgroundColor: isDark ? 'rgba(47,129,247,0.15)' : 'rgba(9,105,218,0.1)' }]}>
              <MaterialIcons name="business" size={20} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t('nav.chat'),
          tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.danger, fontSize: 9, minWidth: 16, height: 16 },
          tabBarIcon: ({ color, focused }) => (
            <View style={[tabStyles.iconWrap, focused && { backgroundColor: isDark ? 'rgba(47,129,247,0.15)' : 'rgba(9,105,218,0.1)' }]}>
              <MaterialIcons name="chat" size={20} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    width: 36, height: 28, borderRadius: BorderRadius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
});

const styles = StyleSheet.create({
  desktopRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  desktopContent: {
    flex: 1,
    overflow: 'hidden',
  },
});
