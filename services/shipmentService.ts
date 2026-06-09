/**
 * shipmentService.ts
 * API layer only — Supabase calls, no data transformation.
 * All row → domain mapping is delegated to shipmentMapper.ts.
 *
 * Cache strategy: stale-while-revalidate via AsyncStorage.
 *   - On fetch success: write result to cache with a timestamp.
 *   - On fetch failure: return cached data (if available) + surface the error.
 *   - Cache is considered fresh for 5 minutes; after that it is stale but still
 *     returned as a fallback while the fresh fetch is in-flight or failed.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';
import { Shipment, ShipmentStatus, ContainerEntry, AdditionalDriver } from '@/types';
import { mapShipment, RawShipment } from './shipmentMapper';

const CACHE_KEY = '@etir_shipments_cache';
const CACHE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

interface ShipmentsCache {
  shipments: Shipment[];
  cachedAt: number;
}

async function readCache(): Promise<ShipmentsCache | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ShipmentsCache;
  } catch {
    return null;
  }
}

async function writeCache(shipments: Shipment[]): Promise<void> {
  try {
    const entry: ShipmentsCache = { shipments, cachedAt: Date.now() };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch (e) {
    console.warn('[shipmentService] cache write failed:', e);
  }
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

/** Fetch all shipments with their checkpoints — stale-while-revalidate */
export async function fetchAllShipments(): Promise<{ shipments: Shipment[]; error: string | null; fromCache?: boolean }> {
  const { data, error } = await supabase
    .from('shipments')
    .select(`*, checkpoints(*)`)
    .order('created_at', { ascending: false });

  if (error) {
    // Network / DB failure — serve cache if available
    const cache = await readCache();
    if (cache) {
      const ageMs = Date.now() - cache.cachedAt;
      console.warn(`[shipmentService] fetch failed (${error.message}); serving ${ageMs > CACHE_MAX_AGE_MS ? 'stale' : 'fresh'} cache (${Math.round(ageMs / 1000)}s old)`);
      return { shipments: cache.shipments, error: error.message, fromCache: true };
    }
    return { shipments: [], error: error.message };
  }

  const shipments = (data as RawShipment[]).map(mapShipment);
  // Persist to cache asynchronously — never blocks the caller
  writeCache(shipments);
  return { shipments, error: null };
}

/**
 * Fetch shipments for a specific driver.
 * Includes both primary assignments and additional-driver (JSONB) assignments.
 */
export async function fetchDriverShipments(driverId: string): Promise<{ shipments: Shipment[]; error: string | null }> {
  const { data: primaryData, error: primaryError } = await supabase
    .from('shipments')
    .select(`*, checkpoints(*)`)
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false });

  if (primaryError) return { shipments: [], error: primaryError.message };

  const { data: additionalData, error: additionalError } = await supabase
    .from('shipments')
    .select(`*, checkpoints(*)`)
    .contains('additional_drivers', JSON.stringify([{ driver_id: driverId }]))
    .order('created_at', { ascending: false });

  if (additionalError) {
    console.warn('[shipmentService] fetchDriverShipments additional_drivers query failed:', additionalError.message);
    return { shipments: (primaryData as RawShipment[]).map(mapShipment), error: null };
  }

  const allRaw = [...(primaryData as RawShipment[]), ...(additionalData as RawShipment[])];
  const seen = new Set<string>();
  const deduped = allRaw.filter(s => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
  deduped.sort((a, b) =>
    new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
  );
  return { shipments: deduped.map(mapShipment), error: null };
}

/** Fetch a single shipment by tracking token */
export async function fetchShipmentByToken(token: string): Promise<{ shipment: Shipment | null; error: string | null }> {
  const { data, error } = await supabase
    .from('shipments')
    .select(`*, checkpoints(*)`)
    .eq('token', token)
    .single();

  if (error) return { shipment: null, error: error.message };
  return { shipment: mapShipment(data as RawShipment), error: null };
}

/** Fetch a single shipment by UUID */
export async function fetchShipmentById(id: string): Promise<{ shipment: Shipment | null; error: string | null }> {
  const { data, error } = await supabase
    .from('shipments')
    .select(`*, checkpoints(*)`)
    .eq('id', id)
    .single();

  if (error) return { shipment: null, error: error.message };
  return { shipment: mapShipment(data as RawShipment), error: null };
}

/** Fetch a single shipment by ETR number (case-insensitive) */
export async function fetchShipmentByTirNumber(tirNumber: string): Promise<{ shipment: Shipment | null; error: string | null }> {
  const { data, error } = await supabase
    .from('shipments')
    .select(`*, checkpoints(*)`)
    .ilike('tir_number', tirNumber.trim())
    .maybeSingle();

  if (error) return { shipment: null, error: error.message };
  if (!data) return { shipment: null, error: null };
  return { shipment: mapShipment(data as RawShipment), error: null };
}

// ── Mutation helpers ──────────────────────────────────────────────────────────

/** Update shipment GPS coordinates */
export async function updateShipmentLocation(id: string, lat: number, lng: number): Promise<string | null> {
  const { error } = await supabase
    .from('shipments')
    .update({ lat, lng, updated_at: new Date().toISOString() })
    .eq('id', id);
  return error?.message ?? null;
}

/** Assign a driver to a shipment */
export async function assignDriverToShipment(
  id: string,
  driverId: string | null,
  driverName: string,
  plateNumber: string,
): Promise<string | null> {
  const { error } = await supabase
    .from('shipments')
    .update({
      driver_id: driverId || null,
      driver_name: driverName,
      plate_number: plateNumber,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  return error?.message ?? null;
}

/** Update shipment estimated arrival */
export async function updateShipmentETA(id: string, estimatedArrival: string): Promise<string | null> {
  const { error } = await supabase
    .from('shipments')
    .update({ estimated_arrival: estimatedArrival, updated_at: new Date().toISOString() })
    .eq('id', id);
  return error?.message ?? null;
}

/** Update shipment status */
export async function updateShipmentStatus(id: string, status: ShipmentStatus): Promise<string | null> {
  const { error } = await supabase
    .from('shipments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  return error?.message ?? null;
}

/** Driver accepts the agreed price */
export async function acceptAgreedPrice(id: string): Promise<string | null> {
  const now = new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const { error } = await supabase
    .from('shipments')
    .update({ price_accepted: true, price_accepted_at: now, updated_at: new Date().toISOString() })
    .eq('id', id);
  return error?.message ?? null;
}

// ── Create ────────────────────────────────────────────────────────────────────

export interface NewCheckpointInput {
  name: string;
  location: string;
}

export interface CreateShipmentInput {
  tirNumber: string;
  origin: string;
  destination: string;
  driverId: string | null;
  driverName: string;
  plateNumber: string;
  cargoDescription: string;
  cargoValue?: string;
  weight: string;
  estimatedArrival: string;
  agreedPrice?: string;
  notes?: string;
  shipmentType?: 'Road' | 'Air' | 'Sea';
  checkpoints: NewCheckpointInput[];
  // Air
  airlineCarrier?: string;
  flightNumber?: string;
  mawbNumber?: string;
  hawbNumber?: string;
  airportOfOrigin?: string;
  airportOfDestination?: string;
  boardingTerminal?: string;
  // Sea
  vesselName?: string;
  voyageNumber?: string;
  bolNumber?: string;
  containerNumber?: string;
  containers?: ContainerEntry[];
  portOfLoading?: string;
  portOfDischarge?: string;
  shippingLine?: string;
  incoterms?: string;
  // Multi-truck
  additionalDrivers?: AdditionalDriver[];
  // Arrival driver (sea freight port pickup)
  arrivalDriverId?: string;
  arrivalDriverName?: string;
  arrivalDriverPlate?: string;
  clientId?: string;
  clientName?: string;
}

function generateToken(): string {
  return `token-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

/** Fetch the next sequential ETR shipment number (ETR-001, ETR-002, …) */
export async function getNextEtrNumber(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('shipments')
      .select('tir_number')
      .like('tir_number', 'ETR-%')
      .order('tir_number', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0 || !data[0]) return 'ETR-001';
    const lastNum = parseInt((data[0].tir_number as string).replace('ETR-', ''), 10);
    if (isNaN(lastNum)) return 'ETR-001';
    return `ETR-${String(lastNum + 1).padStart(3, '0')}`;
  } catch {
    return 'ETR-001';
  }
}

/** Create a new shipment with optional checkpoints */
export async function createShipment(
  input: CreateShipmentInput,
): Promise<{ shipment: Shipment | null; error: string | null }> {
  const token = generateToken();

  const { data: shipmentData, error: shipmentError } = await supabase
    .from('shipments')
    .insert({
      tir_number: input.tirNumber,
      token,
      driver_id: input.driverId || null,
      driver_name: input.driverName,
      plate_number: input.plateNumber,
      origin: input.origin,
      destination: input.destination,
      cargo_description: input.cargoDescription,
      cargo_value: input.cargoValue?.trim() || '',
      weight: input.weight,
      status: input.shipmentType === 'Sea' ? 'Booked' : 'Loaded',
      shipment_type: input.shipmentType ?? 'Road',
      estimated_arrival: input.estimatedArrival,
      agreed_price: input.agreedPrice?.trim() || null,
      price_accepted: false,
      // Air
      airline_carrier: input.airlineCarrier?.trim() || null,
      flight_number: input.flightNumber?.trim() || null,
      mawb_number: input.mawbNumber?.trim() || null,
      hawb_number: input.hawbNumber?.trim() || null,
      airport_of_origin: input.airportOfOrigin?.trim() || null,
      airport_of_destination: input.airportOfDestination?.trim() || null,
      boarding_terminal: input.boardingTerminal?.trim() || null,
      // Sea
      vessel_name: input.vesselName?.trim() || null,
      voyage_number: input.voyageNumber?.trim() || null,
      bol_number: input.bolNumber?.trim() || null,
      container_number: input.containerNumber?.trim() || null,
      containers: input.containers && input.containers.length > 0 ? input.containers : [],
      additional_drivers: input.additionalDrivers && input.additionalDrivers.length > 0 ? input.additionalDrivers : [],
      port_of_loading: input.portOfLoading?.trim() || null,
      port_of_discharge: input.portOfDischarge?.trim() || null,
      shipping_line: input.shippingLine?.trim() || null,
      incoterms: input.incoterms?.trim() || null,
      notes: input.notes?.trim() || null,
      client_id: input.clientId || null,
      client_name: input.clientName?.trim() || null,
    })
    .select()
    .single();

  if (shipmentError) return { shipment: null, error: shipmentError.message };

  const shipmentId = (shipmentData as { id: string }).id;

  if (input.checkpoints.length > 0) {
    const cpRows = input.checkpoints.map((cp, i) => ({
      shipment_id: shipmentId,
      name: cp.name,
      location: cp.location,
      status: i === 0 ? 'Current' : 'Upcoming',
      sort_order: i + 1,
    }));
    const { error: cpError } = await supabase.from('checkpoints').insert(cpRows);
    if (cpError) console.warn('[shipmentService] checkpoint insert error:', cpError.message);
  }

  return fetchShipmentByToken(token);
}
