import React, { createContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Driver } from '@/types';
import { fetchAllDrivers } from '@/services/driverService';

interface DriversContextType {
  drivers: Driver[];
  loading: boolean;
  refresh: () => Promise<void>;
}

export const DriversContext = createContext<DriversContextType | undefined>(undefined);

const POLL_TIMEOUT_MS = 10_000;

export function DriversProvider({ children }: { children: ReactNode }) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const pollAbortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), POLL_TIMEOUT_MS);
    try {
      const { drivers: data } = await fetchAllDrivers();
      if (!controller.signal.aborted) setDrivers(data);
    } catch (e: any) {
      if (e?.name !== 'AbortError') console.warn('[DriversContext] load error:', e);
      else console.warn('[DriversContext] initial load timed out after 10s');
    } finally {
      clearTimeout(timer);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Poll every 30 s with a 10-second abort guard
  useEffect(() => {
    const interval = setInterval(async () => {
      const controller = new AbortController();
      pollAbortRef.current = controller;
      const timer = setTimeout(() => controller.abort(), POLL_TIMEOUT_MS);
      try {
        const { drivers: data } = await fetchAllDrivers();
        if (!controller.signal.aborted) setDrivers(data);
      } catch (e: any) {
        if (e?.name !== 'AbortError') console.warn('[DriversContext] poll error:', e);
        else console.warn('[DriversContext] poll timed out after 10s — skipping update');
      } finally {
        clearTimeout(timer);
        pollAbortRef.current = null;
      }
    }, 30_000);
    return () => {
      clearInterval(interval);
      pollAbortRef.current?.abort();
    };
  }, []);

  return (
    <DriversContext.Provider value={{ drivers, loading, refresh: load }}>
      {children}
    </DriversContext.Provider>
  );
}
