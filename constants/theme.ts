// e-tir Gateway Design System

// ── Dark palette (original) ────────────────────────────────────────────────
export const DarkColors = {
  // Base surfaces
  bg: '#0D1117',
  surface: '#161B22',
  card: '#1C2333',
  cardHover: '#21293A',
  border: '#30363D',
  borderSubtle: '#21262D',

  // Brand accent
  primary: '#2F81F7',
  primaryDark: '#1F6FEB',
  primaryLight: '#58A6FF',
  primaryGlow: 'rgba(47, 129, 247, 0.15)',
  primaryBorder: 'rgba(47,129,247,0.35)',

  // Semantic
  success: '#3FB950',
  successBg: 'rgba(63, 185, 80, 0.1)',
  warning: '#D29922',
  warningBg: 'rgba(210, 153, 34, 0.12)',
  danger: '#F85149',
  dangerBg: 'rgba(248, 81, 73, 0.1)',
  info: '#58A6FF',
  infoBg: 'rgba(88, 166, 255, 0.1)',

  // Text
  textPrimary: '#E6EDF3',
  textSecondary: '#8B949E',
  textMuted: '#484F58',
  textInverse: '#0D1117',

  // Status colors
  statusLoaded: '#58A6FF',
  statusDispatched: '#D2A8FF',
  statusInTransit: '#79C0FF',
  statusCustomsClearance: '#D29922',
  statusCustomsPending: '#E3B341',
  statusArrived: '#3FB950',
  statusDetained: '#F85149',

  // Extended status palette — sea & air specific
  statusBooked: '#38BDF8',
  statusAtPort: '#818CF8',
  statusVesselDeparted: '#0EA5E9',
  statusAtSea: '#2F81F7',
  statusAwaitingFlight: '#7DD3FC',
  statusInFlight: '#38BDF8',
  statusArrivedHub: '#34D399',

  // Customer portal accent
  customerAccent: '#58A6FF',

  // Google OAuth brand colors (stable, intentionally hardcoded)
  googleBg: '#FFFFFF',
  googleText: '#1A1A1A',
  googleIcon: '#4285F4',
};

// ── Light palette ─────────────────────────────────────────────────────────────
export const LightColors = {
  // Base surfaces
  bg: '#F6F8FA',
  surface: '#FFFFFF',
  card: '#F0F3F7',
  cardHover: '#E8EDF4',
  border: '#D0D7DE',
  borderSubtle: '#E8EDF4',

  // Brand accent
  primary: '#0969DA',
  primaryDark: '#0550AE',
  primaryLight: '#1F7AE0',
  primaryGlow: 'rgba(9, 105, 218, 0.1)',
  primaryBorder: 'rgba(9,105,218,0.3)',

  // Semantic
  success: '#1A7F37',
  successBg: 'rgba(26, 127, 55, 0.1)',
  warning: '#9A6700',
  warningBg: 'rgba(154, 103, 0, 0.1)',
  danger: '#CF222E',
  dangerBg: 'rgba(207, 34, 46, 0.1)',
  info: '#0969DA',
  infoBg: 'rgba(9, 105, 218, 0.1)',

  // Text
  textPrimary: '#1F2328',
  textSecondary: '#57606A',
  textMuted: '#8C959F',
  textInverse: '#FFFFFF',

  // Status colors (adjusted for light backgrounds)
  statusLoaded: '#0969DA',
  statusDispatched: '#7C4CAE',
  statusInTransit: '#0969DA',
  statusCustomsClearance: '#9A6700',
  statusCustomsPending: '#C69026',
  statusArrived: '#1A7F37',
  statusDetained: '#CF222E',

  // Extended status palette
  statusBooked: '#0284C7',
  statusAtPort: '#6366F1',
  statusVesselDeparted: '#0369A1',
  statusAtSea: '#0969DA',
  statusAwaitingFlight: '#0284C7',
  statusInFlight: '#0284C7',
  statusArrivedHub: '#15803D',

  // Customer portal accent
  customerAccent: '#0969DA',

  // Google OAuth brand colors (stable, intentionally hardcoded)
  googleBg: '#FFFFFF',
  googleText: '#1A1A1A',
  googleIcon: '#4285F4',
};

// ── Static fallback (dark) — used in StyleSheet.create() calls ────────────────
// Components that use dynamic theming should import from useTheme() instead.
export const Colors = DarkColors;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 40,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  display: 34,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  full: 999,
};

/**
 * Canonical colors per shipment type — single source of truth.
 */
export const SHIPMENT_TYPE_COLORS: Record<'Road' | 'Air' | 'Sea', string> = {
  Road: '#2F81F7',
  Air:  '#58A6FF',
  Sea:  '#58C4DC',
};

export const SHIPMENT_TYPE_COLORS_LIGHT: Record<'Road' | 'Air' | 'Sea', string> = {
  Road: '#0969DA',
  Air:  '#0284C7',
  Sea:  '#0891B2',
};

export const SHIPMENT_TYPE_ICONS: Record<'Road' | 'Air' | 'Sea', string> = {
  Road: 'local-shipping',
  Air:  'flight',
  Sea:  'directions-boat',
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 20,
  },
};

export const ShadowLight = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
};
