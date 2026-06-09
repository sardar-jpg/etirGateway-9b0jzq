/**
 * shipmentMapper.ts
 * Pure data-transformation layer — no Supabase calls, no side effects.
 * Converts raw DB rows → typed Shipment / Checkpoint domain objects.
 */
import { Shipment, Checkpoint, ShipmentStatus, ContainerEntry, AdditionalDriver } from '@/types';

// ── Raw DB shapes ─────────────────────────────────────────────────────────────

export interface RawCheckpoint {
  id: string;
  shipment_id: string;
  name: string;
  location: string;
  status: string;
  sort_order: number;
  timestamp: string | null;
}

export interface RawShipment {
  id: string;
  tir_number: string;
  token: string;
  driver_id: string | null;
  driver_name: string;
  plate_number: string;
  origin: string;
  destination: string;
  cargo_description: string;
  cargo_value: string;
  weight: string;
  status: string;
  estimated_arrival: string;
  created_at: string | null;
  updated_at: string | null;
  lat?: number | null;
  lng?: number | null;
  shipment_type?: string | null;
  checkpoints?: RawCheckpoint[];
  agreed_price?: string | null;
  price_accepted?: boolean;
  price_accepted_at?: string | null;
  notes?: string | null;
  // Air
  airline_carrier?: string | null;
  flight_number?: string | null;
  mawb_number?: string | null;
  hawb_number?: string | null;
  airport_of_origin?: string | null;
  airport_of_destination?: string | null;
  boarding_terminal?: string | null;
  // Sea
  vessel_name?: string | null;
  voyage_number?: string | null;
  bol_number?: string | null;
  container_number?: string | null;
  containers?: ContainerEntry[] | null;
  port_of_loading?: string | null;
  port_of_discharge?: string | null;
  shipping_line?: string | null;
  incoterms?: string | null;
  // Multi-truck
  additional_drivers?: AdditionalDriver[] | null;
  // Client
  client_id?: string | null;
  client_name?: string | null;
}

// ── Mappers ───────────────────────────────────────────────────────────────────

export function mapCheckpoint(raw: RawCheckpoint): Checkpoint {
  return {
    id: raw.id,
    name: raw.name,
    location: raw.location,
    status: raw.status as Checkpoint['status'],
    timestamp: raw.timestamp ?? undefined,
  };
}

export function mapShipment(raw: RawShipment): Shipment {
  return {
    id: raw.id,
    tirNumber: raw.tir_number,
    token: raw.token,
    driverId: raw.driver_id ?? '',
    driverName: raw.driver_name,
    plateNumber: raw.plate_number,
    origin: raw.origin,
    destination: raw.destination,
    cargoDescription: raw.cargo_description,
    cargoValue: raw.cargo_value,
    weight: raw.weight,
    status: raw.status as ShipmentStatus,
    estimatedArrival: raw.estimated_arrival,
    createdAt: raw.created_at
      ? new Date(raw.created_at).toLocaleDateString('en-GB', {
          day: 'numeric', month: 'short', year: 'numeric',
        })
      : '',
    updatedAt: raw.updated_at
      ? new Date(raw.updated_at).toLocaleString('en-GB', {
          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
        })
      : '',
    lat: raw.lat ?? undefined,
    lng: raw.lng ?? undefined,
    agreedPrice: raw.agreed_price ?? undefined,
    priceAccepted: raw.price_accepted ?? false,
    priceAcceptedAt: raw.price_accepted_at ?? undefined,
    notes: raw.notes ?? undefined,
    shipmentType: (raw.shipment_type as Shipment['shipmentType']) ?? 'Road',
    // Air
    airlineCarrier: raw.airline_carrier ?? undefined,
    flightNumber: raw.flight_number ?? undefined,
    mawbNumber: raw.mawb_number ?? undefined,
    hawbNumber: raw.hawb_number ?? undefined,
    airportOfOrigin: raw.airport_of_origin ?? undefined,
    airportOfDestination: raw.airport_of_destination ?? undefined,
    boardingTerminal: raw.boarding_terminal ?? undefined,
    // Sea
    vesselName: raw.vessel_name ?? undefined,
    voyageNumber: raw.voyage_number ?? undefined,
    bolNumber: raw.bol_number ?? undefined,
    containerNumber: raw.container_number ?? undefined,
    containers: raw.containers ?? [],
    portOfLoading: raw.port_of_loading ?? undefined,
    portOfDischarge: raw.port_of_discharge ?? undefined,
    shippingLine: raw.shipping_line ?? undefined,
    incoterms: raw.incoterms ?? undefined,
    additionalDrivers: raw.additional_drivers ?? [],
    clientId: raw.client_id ?? undefined,
    clientName: raw.client_name ?? undefined,
    checkpoints: (raw.checkpoints ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(mapCheckpoint),
  };
}
