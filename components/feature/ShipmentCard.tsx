import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Shipment, ShipmentStatus } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Colors, FontSize, Spacing, BorderRadius, Shadow, SHIPMENT_TYPE_COLORS } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  shipment: Shipment;
  onPress?: (s: Shipment) => void;
  compact?: boolean;
  selected?: boolean;
}

// Status → left-accent color
const STATUS_ACCENT: Record<ShipmentStatus, string> = {
  Loaded:                  Colors.statusLoaded,
  Dispatched:              Colors.statusDispatched,
  'In Transit':            Colors.statusInTransit,
  'Border Crossing':       Colors.statusDispatched,
  'Customs Clearance':     Colors.warning,
  'Customs Pending':       Colors.statusCustomsPending,
  Arrived:                 Colors.success,
  Detained:                Colors.danger,
  Booked:                  Colors.statusBooked,
  'At Port of Loading':    Colors.statusAtPort,
  'Vessel Departed':       Colors.statusVesselDeparted,
  'At Sea':                Colors.statusAtSea,
  'At Port of Discharge':  Colors.statusAtPort,
  'Port Customs':          Colors.warning,
  'Awaiting Flight':       Colors.statusAwaitingFlight,
  'In Flight':             Colors.statusInFlight,
  'Arrived at Hub':        Colors.statusArrivedHub,
};

function progressColor(ratio: number): string {
  if (ratio >= 1)   return Colors.success;
  if (ratio >= 0.6) return Colors.primary;
  if (ratio >= 0.3) return Colors.warning;
  return Colors.textMuted;
}

export function ShipmentCard({ shipment, onPress, compact = false, selected = false }: Props) {
  const { colors } = useTheme();
  const checkpoints = shipment.checkpoints ?? [];
  const total      = checkpoints.length;
  const cleared    = checkpoints.filter(c => c.status === 'Cleared').length;
  const ratio      = total > 0 ? cleared / total : 0;
  const pct        = Math.round(ratio * 100);
  const accentColor = STATUS_ACCENT[shipment.status] ?? Colors.primary;
  const barColor    = progressColor(ratio);
  const typeColor   = SHIPMENT_TYPE_COLORS[shipment.shipmentType as 'Road' | 'Air' | 'Sea'] ?? SHIPMENT_TYPE_COLORS.Road;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        selected && { borderColor: Colors.primary, backgroundColor: colors.cardHover },
        pressed && styles.pressed,
      ]}
      onPress={() => onPress?.(shipment)}
      accessibilityRole="button"
      accessibilityLabel={`Shipment ${shipment.tirNumber}`}
    >
      {/* Colored left-accent stripe */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      <View style={styles.inner}>
        {/* Top row: TIR + status badge */}
        <View style={styles.topRow}>
          <View style={styles.tirChip}>
            <View style={[styles.typeIconWrap, { backgroundColor: `${typeColor}18` }]}>
              <MaterialIcons
                name={shipment.shipmentType === 'Air' ? 'flight' : shipment.shipmentType === 'Sea' ? 'directions-boat' : 'local-shipping'}
                size={10}
                color={typeColor}
              />
            </View>
            <Text style={[styles.tirNumber, { color: colors.textSecondary }]} numberOfLines={1}>
              {shipment.tirNumber}
            </Text>
          </View>
          <StatusBadge status={shipment.status} size="sm" />
        </View>

        {/* Route row */}
        <View style={styles.routeWrap}>
          <View style={styles.routeEndpoint}>
            <View style={[styles.routeDot, { backgroundColor: Colors.primary, borderColor: `${Colors.primary}40` }]} />
            <Text style={[styles.routeCity, { color: colors.textPrimary }]} numberOfLines={1}>
              {shipment.origin}
            </Text>
          </View>

          <View style={styles.routeMid}>
            <View style={[styles.routeDash, { backgroundColor: `${accentColor}25` }]} />
            <View style={[styles.truckIconWrap, { backgroundColor: `${accentColor}15`, borderColor: `${accentColor}30` }]}>
              <MaterialIcons
                name={shipment.shipmentType === 'Air' ? 'flight' : shipment.shipmentType === 'Sea' ? 'directions-boat' : 'local-shipping'}
                size={10}
                color={accentColor}
              />
            </View>
            <View style={[styles.routeDash, { backgroundColor: `${accentColor}25` }]} />
          </View>

          <View style={[styles.routeEndpoint, styles.routeEndpointRight]}>
            <Text style={[styles.routeCity, styles.routeCityRight, { color: colors.textPrimary }]} numberOfLines={1}>
              {shipment.destination}
            </Text>
            <View style={[styles.routeDot, { backgroundColor: Colors.success, borderColor: `${Colors.success}40` }]} />
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressSection}>
          <View style={[styles.progressTrack, { backgroundColor: colors.surface }]}>
            <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: barColor }]} />
            {/* Glow cap at end of fill */}
            {pct > 5 && (
              <View style={[styles.progressGlow, { left: `${pct}%` as any, backgroundColor: barColor }]} />
            )}
          </View>
          <View style={styles.progressMeta}>
            <Text style={styles.progressLabel}>
              <Text style={{ color: barColor, fontWeight: '700' }}>{cleared}</Text>
              <Text style={styles.progressSlash}>/{total}</Text>
              <Text> checkpoints</Text>
            </Text>
            <Text style={[styles.progressPct, { color: barColor }]}>{pct}%</Text>
          </View>
        </View>

        {/* Footer meta */}
        {!compact && (
          <View style={[styles.footer, { borderTopColor: colors.borderSubtle }]}>
            <View style={styles.metaItem}>
              <MaterialIcons name="person" size={10} color={Colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
                {shipment.driverName}
              </Text>
            </View>

            {(shipment.shipmentType === 'Road' || !shipment.shipmentType) &&
             shipment.additionalDrivers && shipment.additionalDrivers.length > 0 ? (
              <View style={styles.fleetBadge}>
                <MaterialIcons name="local-shipping" size={9} color={Colors.primary} />
                <Text style={styles.fleetBadgeText}>{shipment.additionalDrivers.length + 1} trucks</Text>
              </View>
            ) : null}

            <View style={styles.metaDivider} />

            <View style={styles.metaItem}>
              <MaterialIcons name="pin" size={10} color={Colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {shipment.plateNumber}
              </Text>
            </View>

            <View style={styles.metaDivider} />

            <View style={styles.metaItem}>
              <MaterialIcons
                name={shipment.shipmentType === 'Sea' ? 'directions-boat' : 'schedule'}
                size={10}
                color={shipment.shipmentType === 'Sea' ? typeColor : Colors.textMuted}
              />
              <Text style={[
                styles.metaText,
                { color: colors.textSecondary },
                shipment.shipmentType === 'Sea' && { color: typeColor, fontWeight: '600' },
              ]}>
                {shipment.shipmentType === 'Sea'
                  ? `Port ETA: ${shipment.estimatedArrival}`
                  : (shipment.estimatedArrival || 'TBD')}
              </Text>
            </View>

            {shipment.agreedPrice ? (
              <View style={[
                styles.priceBadge,
                shipment.priceAccepted ? styles.priceBadgeAccepted : styles.priceBadgePending,
              ]}>
                <MaterialIcons
                  name={shipment.priceAccepted ? 'verified' : 'handshake'}
                  size={9}
                  color={shipment.priceAccepted ? Colors.success : Colors.warning}
                />
                <Text style={[
                  styles.priceBadgeText,
                  { color: shipment.priceAccepted ? Colors.success : Colors.warning },
                ]}>
                  {shipment.agreedPrice}
                </Text>
              </View>
            ) : null}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
    ...Shadow.card,
  },
  pressed: { opacity: 0.80 },

  accentBar: {
    width: 3,
    borderTopLeftRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.lg,
  },

  inner: {
    flex: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },

  // Top row
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  tirChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  typeIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tirNumber: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    letterSpacing: 0.5,
    flex: 1,
    fontWeight: '600',
  },

  // Route
  routeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeEndpoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    minWidth: 0,
  },
  routeEndpointRight: {
    justifyContent: 'flex-end',
  },
  routeDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 2,
    flexShrink: 0,
  },
  routeCity: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  routeCityRight: {
    textAlign: 'right',
  },
  routeMid: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 5,
  },
  routeDash: {
    flex: 1,
    height: 1.5,
    borderRadius: 1,
  },
  truckIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
  },

  // Progress bar
  progressSection: {
    gap: 5,
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: 5,
    borderRadius: 3,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  progressGlow: {
    position: 'absolute',
    width: 4,
    height: 5,
    opacity: 0.6,
    marginLeft: -4,
    borderRadius: 2,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  progressSlash: {
    color: Colors.textMuted,
    fontWeight: '400',
  },
  progressPct: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    fontFamily: 'monospace',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    maxWidth: 90,
  },
  metaDivider: {
    width: 1,
    height: 9,
    backgroundColor: Colors.borderSubtle,
  },

  fleetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primaryBorder,
  },
  fleetBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.primary,
  },

  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    marginLeft: 'auto',
  },
  priceBadgeAccepted: {
    backgroundColor: Colors.successBg,
    borderColor: `${Colors.success}35`,
  },
  priceBadgePending: {
    backgroundColor: Colors.warningBg,
    borderColor: `${Colors.warning}35`,
  },
  priceBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
});
