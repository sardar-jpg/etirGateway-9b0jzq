import React, { createContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Shipment, ShipmentStatus } from '@/types';
import { fetchAllShipments, updateShipmentStatus, updateShipmentETA, assignDriverToShipment, createShipment, acceptAgreedPrice, CreateShipmentInput } from '@/services/shipmentService';
import { fetchDriverPushToken, notifyDriverStatusChange } from '@/services/notificationService';

interface ShipmentsContextType {
  shipments: Shipment[];
  loading: boolean;
  error: string | null;
  pollError: string | null;
  clearPollError: () => void;
  refresh: () => Promise<void>;
  getByToken: (token: string) => Shipment | null;
  getById: (id: string) => Shipment | null;
  getByTirNumber: (tirNumber: string) => Shipment | null;
  updateStatus: (id: string, status: ShipmentStatus) => Promise<void>;
  assignDriver: (id: string, driverId: string | null, driverName: string, plateNumber: string) => Promise<void>;
  updateETA: (id: string, estimatedArrival: string) => Promise<void>;
  acceptPrice: (id: string) => Promise<void>;
  addShipment: (input: CreateShipmentInput) => Promise<{ error: string | null }>;
  getStats: () => { total: number; active: number; pending: number; arrived: number };
}

const POLL_TIMEOUT_MS = 10_000;

/** Races a promise against a 10-second AbortController timeout.
 *  Returns the resolved value or throws a timeout error. */
function withTimeout<T>(promise: Promise<T>, ms = POLL_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return promise.finally(() => clearTimeout(timer));
}

export const ShipmentsContext = createContext<ShipmentsContextType | undefined>(undefined);

export function ShipmentsProvider({ children }: { children: ReactNode }) {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const clearPollError = useCallback(() => setPollError(null), []);
  const pollAbortRef = useRef<AbortController | null>(null);
  // Guard: prevent poll from firing while initial load (or manual refresh) is in-flight
  const isLoadingRef = useRef(false);
  // Guard: pause polling while app is backgrounded
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const load = useCallback(async () => {
    if (isLoadingRef.current) return;   // deduplicate concurrent calls
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const { shipments: data, error: fetchError } = await withTimeout(fetchAllShipments());
      if (fetchError) {
        console.warn('[ShipmentsContext] fetch failed:', fetchError);
        setError(typeof fetchError === 'string' ? fetchError : 'Failed to load shipments.');
      } else {
        setShipments(data);
      }
    } catch (e) {
      const msg = (e as any)?.name === 'AbortError' ? 'Request timed out after 10s' : String(e);
      console.warn('[ShipmentsContext] load error:', msg);
      setError('Failed to load shipments. Please retry.');
    } finally {
      isLoadingRef.current = false;
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Track app foreground/background state so polls are skipped when backgrounded
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, []);

  // Poll every 15 s — skipped when backgrounded or a load is already in-flight
  useEffect(() => {
    const interval = setInterval(async () => {
      // Skip poll if app is backgrounded or a manual refresh/initial load is running
      if (appStateRef.current !== 'active' || isLoadingRef.current) return;

      const controller = new AbortController();
      pollAbortRef.current = controller;
      const timer = setTimeout(() => controller.abort(), POLL_TIMEOUT_MS);
      try {
        const { shipments: data, error: fetchError } = await fetchAllShipments();
        if (!controller.signal.aborted) {
          if (!fetchError) {
            setShipments(data);
            setPollError(null); // clear banner on successful poll
          } else {
            console.warn('[ShipmentsContext] poll error:', fetchError);
            setPollError('Connection lost — retrying...');
          }
        }
      } catch (e) {
        if ((e as any)?.name !== 'AbortError') {
          console.warn('[ShipmentsContext] poll threw:', e);
          if (!controller.signal.aborted) setPollError('Connection lost — retrying...');
        } else {
          console.warn('[ShipmentsContext] poll timed out after 10s — skipping update');
          setPollError('Connection lost — retrying...');
        }
      } finally {
        clearTimeout(timer);
        pollAbortRef.current = null;
      }
    }, 15_000);
    return () => {
      clearInterval(interval);
      pollAbortRef.current?.abort();
    };
  }, []);

  const getByToken = useCallback(
    (token: string) => shipments.find(s => s.token === token) ?? null,
    [shipments]
  );

  const getById = useCallback(
    (id: string) => shipments.find(s => s.id === id) ?? null,
    [shipments]
  );

  const getByTirNumber = useCallback(
    (tirNumber: string) => shipments.find(s => s.tirNumber.toLowerCase() === tirNumber.trim().toLowerCase()) ?? null,
    [shipments]
  );

  // Canonical timestamp formatter — ISO-based, locale-independent
  const nowTimestamp = () => new Date().toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const updateStatus = useCallback(async (id: string, status: ShipmentStatus) => {
    await updateShipmentStatus(id, status);
    setShipments(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, status, updatedAt: nowTimestamp() } : s);
      // Send push notification to driver
      const shipment = updated.find(s => s.id === id);
      if (shipment?.driverId) {
        fetchDriverPushToken(shipment.driverId).then(token => {
          notifyDriverStatusChange(shipment.tirNumber, status, token);
        }).catch(pushErr => {
          console.warn('[ShipmentsContext] push notification failed — driver may not receive status update:', pushErr);
        });
      }
      return updated;
    });
  }, []);

  const assignDriver = useCallback(async (id: string, driverId: string | null, driverName: string, plateNumber: string) => {
    await assignDriverToShipment(id, driverId, driverName, plateNumber);
    setShipments(prev =>
      prev.map(s => s.id === id ? { ...s, driverId: driverId ?? '', driverName, plateNumber, updatedAt: nowTimestamp() } : s)
    );
  }, []);

  const updateETA = useCallback(async (id: string, estimatedArrival: string) => {
    await updateShipmentETA(id, estimatedArrival);
    setShipments(prev =>
      prev.map(s => s.id === id ? { ...s, estimatedArrival, updatedAt: nowTimestamp() } : s)
    );
  }, []);

  const addShipment = useCallback(async (input: CreateShipmentInput) => {
    const { shipment, error } = await createShipment(input);
    if (error) return { error };
    if (shipment) setShipments(prev => [shipment, ...prev]);
    return { error: null };
  }, []);

  const acceptPrice = useCallback(async (id: string) => {
    await acceptAgreedPrice(id);
    const now = new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    setShipments(prev =>
      prev.map(s => s.id === id ? { ...s, priceAccepted: true, priceAcceptedAt: now } : s)
    );
  }, []);

  const getStats = useCallback(() => {
    const total = shipments.length;
    // 'active' = shipments actively moving (Customs Clearance excluded — it is
    // its own 'pending' category and must not be double-counted).
    const active = shipments.filter(s =>
      ['In Transit', 'Dispatched', 'Border Crossing'].includes(s.status)
    ).length;
    // 'pending' = shipments held at customs (Clearance + Pending)
    const pending = shipments.filter(s =>
      s.status === 'Customs Pending' || s.status === 'Customs Clearance'
    ).length;
    const arrived = shipments.filter(s => s.status === 'Arrived').length;
    return { total, active, pending, arrived };
  }, [shipments]);

  return (
    <ShipmentsContext.Provider value={{ shipments, loading, error, pollError, clearPollError, refresh: load, getByToken, getById, getByTirNumber, updateStatus, assignDriver, updateETA, acceptPrice, addShipment, getStats }}>
      {children}
    </ShipmentsContext.Provider>
  );
}
