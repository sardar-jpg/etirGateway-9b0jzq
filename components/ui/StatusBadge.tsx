import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShipmentStatus } from '@/types';
import { Colors, FontSize, BorderRadius, Spacing } from '@/constants/theme';

interface Props {
  status: ShipmentStatus | string;
  size?: 'sm' | 'md';
}

interface StatusStyle {
  bg: string;
  text: string;
  dot: string;
  border: string;
}

function getStatusColors(status: string): StatusStyle {
  switch (status) {
    // ── Universal ───────────────────────────────────────────────────────────
    case 'Loaded':
      return { bg: `${Colors.statusLoaded}18`, text: Colors.statusLoaded, dot: Colors.statusLoaded, border: `${Colors.statusLoaded}30` };
    case 'Dispatched':
      return { bg: `${Colors.statusDispatched}15`, text: Colors.statusDispatched, dot: Colors.statusDispatched, border: `${Colors.statusDispatched}28` };
    case 'Customs Clearance':
      return { bg: Colors.warningBg, text: Colors.warning, dot: Colors.warning, border: `${Colors.warning}30` };
    case 'Customs Pending':
      return { bg: `${Colors.statusCustomsPending}15`, text: Colors.statusCustomsPending, dot: Colors.statusCustomsPending, border: `${Colors.statusCustomsPending}28` };
    case 'Arrived':
      return { bg: Colors.successBg, text: Colors.success, dot: Colors.success, border: `${Colors.success}30` };
    case 'Detained':
      return { bg: Colors.dangerBg, text: Colors.danger, dot: Colors.danger, border: `${Colors.danger}30` };
    // ── Road ───────────────────────────────────────────────────────────────
    case 'In Transit':
      return { bg: `${Colors.statusInTransit}18`, text: Colors.statusInTransit, dot: Colors.statusInTransit, border: `${Colors.statusInTransit}30` };
    case 'Border Crossing':
      return { bg: `${Colors.statusDispatched}15`, text: Colors.statusDispatched, dot: Colors.statusDispatched, border: `${Colors.statusDispatched}28` };
    // ── Sea ────────────────────────────────────────────────────────────────
    case 'Booked':
      return { bg: `${Colors.statusBooked}15`, text: Colors.statusBooked, dot: Colors.statusBooked, border: `${Colors.statusBooked}28` };
    case 'At Port of Loading':
      return { bg: `${Colors.statusAtPort}15`, text: Colors.statusAtPort, dot: Colors.statusAtPort, border: `${Colors.statusAtPort}28` };
    case 'Vessel Departed':
      return { bg: `${Colors.statusVesselDeparted}15`, text: Colors.statusVesselDeparted, dot: Colors.statusVesselDeparted, border: `${Colors.statusVesselDeparted}28` };
    case 'At Sea':
      return { bg: `${Colors.statusAtSea}18`, text: Colors.statusAtSea, dot: Colors.statusAtSea, border: `${Colors.statusAtSea}30` };
    case 'At Port of Discharge':
      return { bg: `${Colors.statusAtPort}15`, text: Colors.statusAtPort, dot: Colors.statusAtPort, border: `${Colors.statusAtPort}28` };
    case 'Port Customs':
      return { bg: Colors.warningBg, text: Colors.warning, dot: Colors.warning, border: `${Colors.warning}30` };
    // ── Air ────────────────────────────────────────────────────────────────
    case 'Awaiting Flight':
      return { bg: `${Colors.statusAwaitingFlight}15`, text: Colors.statusAwaitingFlight, dot: Colors.statusAwaitingFlight, border: `${Colors.statusAwaitingFlight}28` };
    case 'In Flight':
      return { bg: `${Colors.statusInFlight}15`, text: Colors.statusInFlight, dot: Colors.statusInFlight, border: `${Colors.statusInFlight}28` };
    case 'Arrived at Hub':
      return { bg: `${Colors.statusArrivedHub}15`, text: Colors.statusArrivedHub, dot: Colors.statusArrivedHub, border: `${Colors.statusArrivedHub}28` };
    default:
      return { bg: Colors.card, text: Colors.textSecondary, dot: Colors.textSecondary, border: Colors.border };
  }
}

export function StatusBadge({ status, size = 'md' }: Props) {
  const { bg, text, dot, border } = getStatusColors(status);
  const isSmall = size === 'sm';

  return (
    <View style={[
      styles.badge,
      { backgroundColor: bg, borderColor: border },
      isSmall && styles.badgeSm,
    ]}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text
        style={[styles.text, { color: text }, isSmall && styles.textSm]}
        numberOfLines={1}
      >
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 5,
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    flexShrink: 0,
  },
  text: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  textSm: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});
