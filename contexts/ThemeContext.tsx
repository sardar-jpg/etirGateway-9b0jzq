import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkColors, LightColors, Shadow, ShadowLight } from '@/constants/theme';

export type ThemeMode = 'dark' | 'light' | 'system';

const STORAGE_KEY = 'etir_theme_mode';

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
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(saved => {
      if (saved === 'dark' || saved === 'light' || saved === 'system') {
        setModeState(saved);
      }
    }).catch(() => {});
  }, []);

  const setMode = useCallback(async (newMode: ThemeMode) => {
    setModeState(newMode);
    await AsyncStorage.setItem(STORAGE_KEY, newMode);
  }, []);

  const toggleTheme = useCallback(async () => {
    const next: ThemeMode = mode === 'dark' ? 'light' : mode === 'light' ? 'dark' : (systemScheme === 'dark' ? 'light' : 'dark');
    await setMode(next);
  }, [mode, setMode, systemScheme]);

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
  const colors = isDark ? DarkColors : LightColors;
  const shadows = isDark ? Shadow : ShadowLight;

  return (
    <ThemeContext.Provider value={{ isDark, mode, colors, shadows, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
