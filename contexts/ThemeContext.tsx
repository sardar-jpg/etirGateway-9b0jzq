import React, { createContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useColorScheme, Animated, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkColors, LightColors, Shadow, ShadowLight } from '@/constants/theme';

export type ThemeMode = 'dark' | 'light' | 'system';

const STORAGE_KEY = 'etir_theme_mode';

// Default to system preference (or dark if unavailable) to avoid incorrect initial render
function getDefaultMode(): ThemeMode { return 'dark'; }

export interface ThemeColors {
  bg: string; surface: string; card: string; cardHover: string;
  border: string; borderSubtle: string;
  primary: string; primaryDark: string; primaryLight: string;
  primaryGlow: string; primaryBorder: string;
  success: string; successBg: string;
  warning: string; warningBg: string;
  danger: string; dangerBg: string;
  info: string; infoBg: string;
  textPrimary: string; textSecondary: string; textMuted: string; textInverse: string;
  statusLoaded: string; statusDispatched: string; statusInTransit: string;
  statusCustomsClearance: string; statusCustomsPending: string;
  statusArrived: string; statusDetained: string;
  statusBooked: string; statusAtPort: string; statusVesselDeparted: string;
  statusAtSea: string; statusAwaitingFlight: string; statusInFlight: string; statusArrivedHub: string;
  customerAccent: string;
  googleBg: string; googleText: string; googleIcon: string;
}

export interface ThemeShadows {
  card: object; elevated: object; modal: object;
}

interface ThemeContextType {
  isDark: boolean;
  mode: ThemeMode;
  colors: ThemeColors;
  shadows: ThemeShadows;
  /** Set to null while the stored preference is being read from AsyncStorage on boot */
  isReady: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  // Start with null so we know when AsyncStorage read is complete
  const [mode, setModeState] = useState<ThemeMode | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Transition overlay opacity — fades in on theme switch then fades back out
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const isFirstMount = useRef(true);

  // ── Read persisted preference on boot ────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(saved => {
        if (saved === 'dark' || saved === 'light' || saved === 'system') {
          setModeState(saved);
        } else {
          // No saved preference — fall back to device system scheme or dark
          setModeState(systemScheme === 'light' ? 'system' : 'dark');
        }
      })
      .catch(() => {
        setModeState(getDefaultMode());
      })
      .finally(() => {
        setIsReady(true);
        isFirstMount.current = false;
      });
  // Only runs once on mount; systemScheme intentionally omitted
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setMode = useCallback(async (newMode: ThemeMode) => {
    // Animate a quick flash overlay so the color change isn't a jarring snap
    Animated.sequence([
      Animated.timing(flashOpacity, { toValue: 0.18, duration: 80, useNativeDriver: true }),
      Animated.timing(flashOpacity, { toValue: 0,    duration: 220, useNativeDriver: true }),
    ]).start();

    setModeState(newMode);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newMode);
    } catch { /* non-critical — preference simply won't persist */ }
  }, [flashOpacity]);

  const toggleTheme = useCallback(async () => {
    const current = mode ?? 'dark';
    const next: ThemeMode =
      current === 'dark' ? 'light' :
      current === 'light' ? 'dark' :
      (systemScheme === 'dark' ? 'light' : 'dark');
    await setMode(next);
  }, [mode, setMode, systemScheme]);

  const resolvedMode = mode ?? getDefaultMode();
  const isDark = resolvedMode === 'system' ? systemScheme === 'dark' : resolvedMode === 'dark';
  const colors = isDark ? DarkColors : LightColors;
  const shadows = isDark ? Shadow : ShadowLight;

  // Flash color: neutral mid-gray to blend gracefully between light and dark
  const flashColor = isDark ? '#FFFFFF' : '#000000';

  return (
    <ThemeContext.Provider value={{ isDark, mode: resolvedMode, colors, shadows, isReady, setMode, toggleTheme }}>
      {children}
      {/* Transition overlay — briefly flashes on theme switch */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: flashColor, opacity: flashOpacity, zIndex: 9999 }]}
      />
    </ThemeContext.Provider>
  );
}
