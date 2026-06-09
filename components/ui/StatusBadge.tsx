import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShipmentStatus } from '@/types';
import { Colors, FontSize, BorderRadius, Spacing } from '@/constants/theme';

interface Props {
  status: ShipmentStatus | string;
  size?: 'sm' | 'md';
}

function getStatusColors(status: string) {
  switch (status) {
    // ── Universal ────────────────────────────────────────
    case 'Loaded':
      return { bg: Colors.infoBg, text: Colors.statusInTransit, dot: Colors.statusInTransit };
    case 'Dispatched':
      return { bg: `${Colors.statusDispatched}1A`, text: Colors.statusDispatched, dot: Colors.statusDispatched };
    case 'Customs Clearance':
      return { bg: Colors.warningBg, text: Colors.warning, dot: Colors.warning };
    case 'Customs Pending':
      return { bg: `${Colors.statusCustomsPending}1F`, text: Colors.statusCustomsPending, dot: Colors.statusCustomsPending };
    case 'Arrived':
      return { bg: Colors.successBg, text: Colors.success, dot: Colors.success };
    case 'Detained':
      return { bg: Colors.dangerBg, text: Colors.danger, dot: Colors.danger };
    // ── Road-specific ────────────────────────────────────
    case 'In Transit':
      return { bg: Colors.infoBg, text: Colors.info, dot: Colors.info };
    case 'Border Crossing':
      return { bg: `${Colors.statusDispatched}1F`, text: Colors.statusDispatched, dot: Colors.statusDispatched };
    // ── Sea-specific ─────────────────────────────────────
    case 'Booked':
      return { bg: `${Colors.statusBooked}1A`, text: Colors.statusBooked, dot: Colors.statusBooked };
    case 'At Port of Loading':
      return { bg: `${Colors.statusAtPort}1F`, text: Colors.statusAtPort, dot: Colors.statusAtPort };
    case 'Vessel Departed':
      return { bg: `${Colors.statusVesselDeparted}1F`, text: Colors.statusVesselDeparted, dot: Colors.statusVesselDeparted };
    case 'At Sea':
      return { bg: `${Colors.statusAtSea}1F`, text: Colors.statusAtSea, dot: Colors.statusAtSea };
    case 'At Port of Discharge':
      return { bg: `${Colors.statusAtPort}1F`, text: Colors.statusAtPort, dot: Colors.statusAtPort };
    case 'Port Customs':
      return { bg: Colors.warningBg, text: Colors.warning, dot: Colors.warning };
    // ── Air-specific ─────────────────────────────────────
    case 'Awaiting Flight':
      return { bg: `${Colors.statusAwaitingFlight}1A`, text: Colors.statusAwaitingFlight, dot: Colors.statusAwaitingFlight };
    case 'In Flight':
      return { bg: `${Colors.statusInFlight}1F`, text: Colors.statusInFlight, dot: Colors.statusInFlight };
    case 'Arrived at Hub':
      return { bg: `${Colors.statusArrivedHub}1F`, text: Colors.statusArrivedHub, dot: Colors.statusArrivedHub };
    default:
      return { bg: Colors.card, text: Colors.textSecondary, dot: Colors.textSecondary };
  }
}

export function StatusBadge({ status, size = 'md' }: Props) {
  const { bg, text, dot } = getStatusColors(status);
  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: bg }, isSmall && styles.badgeSm]}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text style={[styles.text, { color: text }, isSmall && styles.textSm]}>{status}</Text>
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
    gap: 6,
  },
  badgeSm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  textSm: {
    fontSize: FontSize.xs,
  },
});
