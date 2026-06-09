// e-tir Gateway Design System — v2.0

// ── Dark palette ────────────────────────────────────────────────────────────
export const DarkColors = {
  // Base surfaces — refined depth hierarchy
  bg:           '#090E17',        // Deepest background — near-black navy
  surface:      '#0F1623',        // App bars, tabs, panels
  card:         '#162032',        // Card surfaces
  cardHover:    '#1C2A40',        // Card pressed/hover
  border:       '#1E2D44',        // Standard border
  borderSubtle: '#131E2F',        // Very subtle separator

  // Brand accent — electric blue
  primary:       '#3B82F6',       // Primary brand blue
  primaryDark:   '#2563EB',       // Pressed states
  primaryLight:  '#60A5FA',       // Lighter variant
  primaryGlow:   'rgba(59,130,246,0.12)',
  primaryBorder: 'rgba(59,130,246,0.30)',

  // Semantic colors — more vivid and distinct
  success:    '#22C55E',
  successBg:  'rgba(34,197,94,0.10)',
  warning:    '#F59E0B',
  warningBg:  'rgba(245,158,11,0.10)',
  danger:     '#EF4444',
  dangerBg:   'rgba(239,68,68,0.10)',
  info:       '#38BDF8',
  infoBg:     'rgba(56,189,248,0.10)',

  // Text hierarchy
  textPrimary:   '#F0F6FF',       // Near-white, cooler tone
  textSecondary: '#8BA3C0',       // Muted blue-grey
  textMuted:     '#445670',       // Faint/disabled
  textInverse:   '#090E17',

  // Status colors — distinct per type
  statusLoaded:           '#60A5FA',
  statusDispatched:       '#C084FC',
  statusInTransit:        '#38BDF8',
  statusCustomsClearance: '#F59E0B',
  statusCustomsPending:   '#FBBF24',
  statusArrived:          '#22C55E',
  statusDetained:         '#EF4444',

  // Sea & Air extended
  statusBooked:         '#22D3EE',
  statusAtPort:         '#818CF8',
  statusVesselDeparted: '#06B6D4',
  statusAtSea:          '#3B82F6',
  statusAwaitingFlight: '#7DD3FC',
  statusInFlight:       '#22D3EE',
  statusArrivedHub:     '#10B981',

  // Customer portal accent
  customerAccent: '#60A5FA',

  // Google OAuth brand (intentionally hardcoded)
  googleBg:   '#FFFFFF',
  googleText: '#1A1A1A',
  googleIcon: '#4285F4',
};

// ── Static alias ────────────────────────────────────────────────────────────
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
  xs:      11,
  sm:      13,
  base:    15,
  md:      16,
  lg:      18,
  xl:      20,
  xxl:     24,
  xxxl:    28,
  display: 34,
};

export const FontWeight = {
  regular:  '400' as const,
  medium:   '500' as const,
  semibold: '600' as const,
  bold:     '700' as const,
};

export const BorderRadius = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   18,
  xxl:  24,
  full: 999,
};

/**
 * Canonical colors per shipment type — single source of truth.
 */
export const SHIPMENT_TYPE_COLORS: Record<'Road' | 'Air' | 'Sea', string> = {
  Road: '#3B82F6',
  Air:  '#38BDF8',
  Sea:  '#06B6D4',
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
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.65,
    shadowRadius: 28,
    elevation: 22,
  },
};
