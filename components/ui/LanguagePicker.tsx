import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { FontSize, Spacing, BorderRadius } from '@/constants/theme';

interface Props {
  compact?: boolean;
}

export function LanguagePicker({ compact = false }: Props) {
  const { language, setLanguage, languages, t } = useLanguage();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [toastLang, setToastLang] = useState<string | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;

  const showToast = (nativeLabel: string) => {
    setToastLang(nativeLabel);
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.delay(1400),
      Animated.timing(toastAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start(() => setToastLang(null));
  };

  const current = languages.find(l => l.code === language)!;

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.trigger,
          compact && styles.triggerCompact,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: pressed ? 0.75 : 1,
          },
        ]}
        onPress={() => setOpen(true)}
      >
        <MaterialIcons name="language" size={compact ? 18 : 15} color={colors.textSecondary} />
        {!compact && (
          <>
            <Text style={[styles.triggerText, { color: colors.textSecondary }]}>{current.nativeLabel}</Text>
            <MaterialIcons name="expand-more" size={14} color={colors.textMuted} />
          </>
        )}
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={e => e.stopPropagation()}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <MaterialIcons name="language" size={18} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('nav.language')}</Text>
            </View>
            {languages.map((lang, i) => (
              <Pressable
                key={lang.code}
                style={({ pressed }) => [
                  styles.option,
                  i < languages.length - 1 && [styles.optionBorder, { borderBottomColor: colors.borderSubtle }],
                  language === lang.code && { backgroundColor: colors.primaryGlow },
                  pressed && { backgroundColor: colors.card },
                ]}
                onPress={async () => {
                  await setLanguage(lang.code);
                  setOpen(false);
                  if (lang.code !== language) showToast(lang.nativeLabel);
                }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.optionNative, { color: colors.textPrimary }, language === lang.code && { color: colors.primary }]}>
                    {lang.nativeLabel}
                  </Text>
                  <Text style={[styles.optionEnglish, { color: colors.textMuted }]}>{lang.label}</Text>
                </View>
                {lang.rtl && (
                  <View style={[styles.rtlTag, { backgroundColor: colors.warningBg, borderColor: colors.warning }]}>
                    <Text style={[styles.rtlTagText, { color: colors.warning }]}>RTL</Text>
                  </View>
                )}
                {language === lang.code && (
                  <MaterialIcons name="check-circle" size={18} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {toastLang ? (
        <Animated.View
          style={[
            styles.toast,
            {
              backgroundColor: colors.card,
              borderColor: `${colors.success}40`,
              opacity: toastAnim,
              transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
            },
          ]}
          pointerEvents="none"
        >
          <MaterialIcons name="check-circle" size={14} color={colors.success} />
          <Text style={[styles.toastText, { color: colors.success }]}>{toastLang}</Text>
        </Animated.View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: BorderRadius.md, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1,
  },
  triggerCompact: {
    width: 34, height: 34, borderRadius: 17, paddingHorizontal: 0, justifyContent: 'center',
  },
  triggerText: { fontSize: FontSize.xs, fontWeight: '500' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  sheet: { width: '100%', maxWidth: 340, borderRadius: BorderRadius.xl, borderWidth: 1, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.xl, borderBottomWidth: 1 },
  headerTitle: { fontSize: FontSize.base, fontWeight: '700' },
  option: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  optionBorder: { borderBottomWidth: 1 },
  optionNative: { fontSize: FontSize.base, fontWeight: '600' },
  optionEnglish: { fontSize: FontSize.xs },
  rtlTag: { borderRadius: BorderRadius.sm, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1 },
  rtlTagText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  toast: {
    position: 'absolute', top: 44, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: BorderRadius.md, paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, zIndex: 999,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 6,
  },
  toastText: { fontSize: FontSize.xs, fontWeight: '700' },
});
