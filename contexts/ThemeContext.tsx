import React, { createContext, ReactNode } from 'react';
import { DarkColors, Shadow } from '@/constants/theme';

export type ThemeMode = 'dark';

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
  isReady: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const noop = async () => {};

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider value={{
      isDark: true,
      mode: 'dark',
      colors: DarkColors as ThemeColors,
      shadows: Shadow,
      isReady: true,
      setMode: noop,
      toggleTheme: noop,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}
