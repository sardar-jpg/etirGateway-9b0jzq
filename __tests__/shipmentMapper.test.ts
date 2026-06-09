/**
 * Unit tests for mapCheckpoint() and mapShipment() in services/shipmentMapper.ts
 *
 * Both are pure transformation functions with no Supabase/network calls.
 */
import { mapCheckpoint, mapShipment, RawCheckpoint, RawShipment } from '../services/shipmentMapper';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const RAW_CHECKPOINT: RawCheckpoint = {
  id: 'cp-1',
  shipment_id: 'ship-1',
  name: 'Turkish Border',
  location: 'Habur Gate',
  status: 'Cleared',
  sort_order: 1,
  timestamp: '2024-01-15T10:30:00Z',
};

const RAW_CHECKPOINT_NULL_TS: RawCheckpoint = {
  ...RAW_CHECKPOINT,
  id: 'cp-2',
  sort_order: 2,
  timestamp: null,
};

const RAW_SHIPMENT_MINIMAL: RawShipment = {
  id: 'ship-1',
  tir_number: 'TIR-2024-001',
  token: 'abc123',
  driver_id: 'driver-uuid',
  driver_name: 'Ahmed Hassan',
  plate_number: '34 ABC 001',
  origin: 'Istanbul',
  destination: 'Baghdad',
  cargo_description: 'Electronics',
  cargo_value: '50000',
  weight: '12000kg',
  status: 'In Transit',
  estimated_arrival: '2024-01-20',
  created_at: '2024-01-10T08:00:00Z',
  updated_at: '2024-01-15T12:00:00Z',
};

const RAW_SHIPMENT_FULL: RawShipment = {
  ...RAW_SHIPMENT_MINIMAL,
  lat: 37.5,
  lng: 44.2,
  shipment_type: 'Road',
  agreed_price: '3500',
  price_accepted: true,
  price_accepted_at: '2024-01-12T09:00:00Z',
  notes: 'Fragile cargo',
  checkpoints: [
    { ...RAW_CHECKPOINT, sort_order: 2 },
    { ...RAW_CHECKPOINT, id: 'cp-first', sort_order: 1 },
  ],
  additional_drivers: [
    { driver_name: 'Omar Ali', plate_number: '34 XYZ 999', truck_class: 'Box Truck' },
  ],
  client_id: 'client-uuid',
  client_name: 'ACME Imports',
};

const RAW_SHIPMENT_SEA: RawShipment = {
  ...RAW_SHIPMENT_MINIMAL,
  shipment_type: 'Sea',
  vessel_name: 'MV Tigris Star',
  voyage_number: 'V2024-01',
  bol_number: 'BOL-001',
  container_number: 'MSCU1234567',
  port_of_loading: 'Mersin',
  port_of_discharge: 'Umm Qasr',
  shipping_line: 'MSC',
  incoterms: 'CIF',
  containers: [
    { container_number: 'MSCU1234567', size: '40ft', type: 'Dry', weight: '18000kg' },
  ],
};

const RAW_SHIPMENT_AIR: RawShipment = {
  ...RAW_SHIPMENT_MINIMAL,
  shipment_type: 'Air',
  airline_carrier: 'Turkish Airlines',
  flight_number: 'TK501',
  mawb_number: 'MAWB-001',
  hawb_number: 'HAWB-001',
  airport_of_origin: 'IST',
  airport_of_destination: 'BGW',
  boarding_terminal: 'T1',
  status: 'In Flight',
};

// ── mapCheckpoint ─────────────────────────────────────────────────────────────

describe('mapCheckpoint', () => {
  it('maps all fields from a raw checkpoint row', () => {
    const cp = mapCheckpoint(RAW_CHECKPOINT);
    expect(cp.id).toBe('cp-1');
    expect(cp.name).toBe('Turkish Border');
    expect(cp.location).toBe('Habur Gate');
    expect(cp.status).toBe('Cleared');
    expect(cp.timestamp).toBe('2024-01-15T10:30:00Z');
  });

  it('converts null timestamp to undefined', () => {
    const cp = mapCheckpoint(RAW_CHECKPOINT_NULL_TS);
    expect(cp.timestamp).toBeUndefined();
  });

  it('does NOT include shipment_id or sort_order in the output', () => {
    const cp = mapCheckpoint(RAW_CHECKPOINT) as any;
    expect(cp.shipment_id).toBeUndefined();
    expect(cp.sort_order).toBeUndefined();
  });

  it('preserves the status string as-is (cast to Checkpoint status union)', () => {
    const raw: RawCheckpoint = { ...RAW_CHECKPOINT, status: 'Pending' };
    expect(mapCheckpoint(raw).status).toBe('Pending');
  });
});

// ── mapShipment ───────────────────────────────────────────────────────────────

describe('mapShipment', () => {
  // ── Core scalar fields ─────────────────────────────────────────────────────
  describe('core field mapping', () => {
    it('maps id, tirNumber, token correctly', () => {
      const s = mapShipment(RAW_SHIPMENT_MINIMAL);
      expect(s.id).toBe('ship-1');
      expect(s.tirNumber).toBe('TIR-2024-001');
      expect(s.token).toBe('abc123');
    });

    it('maps driverName and plateNumber', () => {
      const s = mapShipment(RAW_SHIPMENT_MINIMAL);
      expect(s.driverName).toBe('Ahmed Hassan');
      expect(s.plateNumber).toBe('34 ABC 001');
    });

    it('converts null driver_id to empty string', () => {
      const s = mapShipment({ ...RAW_SHIPMENT_MINIMAL, driver_id: null });
      expect(s.driverId).toBe('');
    });

    it('maps a non-null driver_id', () => {
      const s = mapShipment(RAW_SHIPMENT_MINIMAL);
      expect(s.driverId).toBe('driver-uuid');
    });

    it('maps status as ShipmentStatus', () => {
      const s = mapShipment(RAW_SHIPMENT_MINIMAL);
      expect(s.status).toBe('In Transit');
    });

    it('maps estimatedArrival verbatim', () => {
      const s = mapShipment(RAW_SHIPMENT_MINIMAL);
      expect(s.estimatedArrival).toBe('2024-01-20');
    });
  });

  // ── Date formatting ─────────────────────────────────────────────────────────
  describe('date formatting', () => {
    it('converts ISO created_at to a non-empty locale string', () => {
      const s = mapShipment(RAW_SHIPMENT_MINIMAL);
      // Should include the year and be non-empty
      expect(s.createdAt).toBeTruthy();
      expect(s.createdAt).toContain('2024');
    });

    it('converts ISO updated_at to a non-empty locale string', () => {
      const s = mapShipment(RAW_SHIPMENT_MINIMAL);
      expect(s.updatedAt).toBeTruthy();
      expect(s.updatedAt).toContain('2024');
    });

    it('returns empty string for null created_at', () => {
      const s = mapShipment({ ...RAW_SHIPMENT_MINIMAL, created_at: null });
      expect(s.createdAt).toBe('');
    });

    it('returns empty string for null updated_at', () => {
      const s = mapShipment({ ...RAW_SHIPMENT_MINIMAL, updated_at: null });
      expect(s.updatedAt).toBe('');
    });
  });

  // ── Optional GPS coords ────────────────────────────────────────────────────
  describe('GPS coordinates', () => {
    it('maps lat and lng when present', () => {
      const s = mapShipment(RAW_SHIPMENT_FULL);
      expect(s.lat).toBe(37.5);
      expect(s.lng).toBe(44.2);
    });

    it('sets lat/lng to undefined when null', () => {
      const s = mapShipment({ ...RAW_SHIPMENT_MINIMAL, lat: null, lng: null });
      expect(s.lat).toBeUndefined();
      expect(s.lng).toBeUndefined();
    });
  });

  // ── Shipment type default ─────────────────────────────────────────────────
  describe('shipmentType default', () => {
    it('defaults shipmentType to "Road" when field is null', () => {
      const s = mapShipment({ ...RAW_SHIPMENT_MINIMAL, shipment_type: null });
      expect(s.shipmentType).toBe('Road');
    });

    it('preserves "Sea" shipment type', () => {
      expect(mapShipment(RAW_SHIPMENT_SEA).shipmentType).toBe('Sea');
    });

    it('preserves "Air" shipment type', () => {
      expect(mapShipment(RAW_SHIPMENT_AIR).shipmentType).toBe('Air');
    });
  });

  // ── Checkpoint sorting ─────────────────────────────────────────────────────
  describe('checkpoint ordering', () => {
    it('sorts checkpoints by sort_order ascending', () => {
      const s = mapShipment(RAW_SHIPMENT_FULL);
      expect(s.checkpoints[0].id).toBe('cp-first'); // sort_order: 1
      expect(s.checkpoints[1].id).toBe('cp-1');      // sort_order: 2
    });

    it('returns an empty array when checkpoints is undefined', () => {
      const s = mapShipment(RAW_SHIPMENT_MINIMAL); // no checkpoints key
      expect(s.checkpoints).toEqual([]);
    });
  });

  // ── Array defaults ─────────────────────────────────────────────────────────
  describe('array field defaults', () => {
    it('defaults containers to empty array when undefined', () => {
      const s = mapShipment(RAW_SHIPMENT_MINIMAL);
      expect(s.containers).toEqual([]);
    });

    it('defaults additionalDrivers to empty array when undefined', () => {
      const s = mapShipment(RAW_SHIPMENT_MINIMAL);
      expect(s.additionalDrivers).toEqual([]);
    });

    it('maps containers from Sea shipment', () => {
      const s = mapShipment(RAW_SHIPMENT_SEA);
      expect(s.containers).toHaveLength(1);
      expect(s.containers[0].container_number).toBe('MSCU1234567');
    });

    it('maps additionalDrivers from full shipment', () => {
      const s = mapShipment(RAW_SHIPMENT_FULL);
      expect(s.additionalDrivers).toHaveLength(1);
      expect(s.additionalDrivers![0].driver_name).toBe('Omar Ali');
    });
  });

  // ── Optional scalar defaults ───────────────────────────────────────────────
  describe('optional scalar defaults', () => {
    it('converts null notes to undefined', () => {
      const s = mapShipment(RAW_SHIPMENT_MINIMAL);
      expect(s.notes).toBeUndefined();
    });

    it('maps notes when present', () => {
      const s = mapShipment(RAW_SHIPMENT_FULL);
      expect(s.notes).toBe('Fragile cargo');
    });

    it('defaults priceAccepted to false when undefined', () => {
      const s = mapShipment(RAW_SHIPMENT_MINIMAL);
      expect(s.priceAccepted).toBe(false);
    });

    it('maps priceAccepted: true', () => {
      const s = mapShipment(RAW_SHIPMENT_FULL);
      expect(s.priceAccepted).toBe(true);
    });
  });

  // ── Air-specific fields ────────────────────────────────────────────────────
  describe('Air shipment fields', () => {
    it('maps airlineCarrier', () => {
      expect(mapShipment(RAW_SHIPMENT_AIR).airlineCarrier).toBe('Turkish Airlines');
    });

    it('maps flightNumber', () => {
      expect(mapShipment(RAW_SHIPMENT_AIR).flightNumber).toBe('TK501');
    });

    it('maps mawbNumber and hawbNumber', () => {
      const s = mapShipment(RAW_SHIPMENT_AIR);
      expect(s.mawbNumber).toBe('MAWB-001');
      expect(s.hawbNumber).toBe('HAWB-001');
    });

    it('maps airport codes', () => {
      const s = mapShipment(RAW_SHIPMENT_AIR);
      expect(s.airportOfOrigin).toBe('IST');
      expect(s.airportOfDestination).toBe('BGW');
    });

    it('maps boardingTerminal', () => {
      expect(mapShipment(RAW_SHIPMENT_AIR).boardingTerminal).toBe('T1');
    });
  });

  // ── Sea-specific fields ────────────────────────────────────────────────────
  describe('Sea shipment fields', () => {
    it('maps vesselName and voyageNumber', () => {
      const s = mapShipment(RAW_SHIPMENT_SEA);
      expect(s.vesselName).toBe('MV Tigris Star');
      expect(s.voyageNumber).toBe('V2024-01');
    });

    it('maps bolNumber and containerNumber', () => {
      const s = mapShipment(RAW_SHIPMENT_SEA);
      expect(s.bolNumber).toBe('BOL-001');
      expect(s.containerNumber).toBe('MSCU1234567');
    });

    it('maps portOfLoading and portOfDischarge', () => {
      const s = mapShipment(RAW_SHIPMENT_SEA);
      expect(s.portOfLoading).toBe('Mersin');
      expect(s.portOfDischarge).toBe('Umm Qasr');
    });

    it('maps shippingLine and incoterms', () => {
      const s = mapShipment(RAW_SHIPMENT_SEA);
      expect(s.shippingLine).toBe('MSC');
      expect(s.incoterms).toBe('CIF');
    });
  });

  // ── Client fields ──────────────────────────────────────────────────────────
  describe('client fields', () => {
    it('maps clientId and clientName', () => {
      const s = mapShipment(RAW_SHIPMENT_FULL);
      expect(s.clientId).toBe('client-uuid');
      expect(s.clientName).toBe('ACME Imports');
    });

    it('leaves clientId undefined when null', () => {
      const s = mapShipment(RAW_SHIPMENT_MINIMAL);
      expect(s.clientId).toBeUndefined();
    });
  });
});
