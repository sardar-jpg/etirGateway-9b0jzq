import React, { createContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Driver } from '@/types';
import { fetchAllDrivers, fetchPendingDrivers, approveDriver, rejectDriver, PendingDriver } from '@/services/driverService';

interface DriversContextType {
  drivers: Driver[];
  pendingDrivers: PendingDriver[];
  loading: boolean;
  approvalLoading: Record<string, boolean>;
  approve: (id: string) => Promise<string | null>;
  reject: (id: string) => Promise<string | null>;
  refresh: () => Promise<void>;
}

export const DriversContext = createContext<DriversContextType | undefined>(undefined);

const POLL_TIMEOUT_MS = 10_000;

export function DriversProvider({ children }: { children: ReactNode }) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [pendingDrivers, setPendingDrivers] = useState<PendingDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalLoading, setApprovalLoading] = useState<Record<string, boolean>>({});
  const pollAbortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), POLL_TIMEOUT_MS);
    try {
      const [{ drivers: data }, { drivers: pending }] = await Promise.all([
        fetchAllDrivers(),
        fetchPendingDrivers(),
      ]);
      if (!controller.signal.aborted) {
        // Main list: only show approved (or legacy rows without approval_status)
        setDrivers(data.filter((d: any) => !(d as any).approvalStatus || (d as any).approvalStatus !== 'pending'));
        setPendingDrivers(pending);
      }
    } catch (e) {
      if ((e as any)?.name !== 'AbortError') console.warn('[DriversContext] load error:', e);
      else console.warn('[DriversContext] initial load timed out after 10s');
    } finally {
      clearTimeout(timer);
    }
    setLoading(false);
  }, []);

  const approve = useCallback(async (id: string): Promise<string | null> => {
    setApprovalLoading(prev => ({ ...prev, [id]: true }));
    const err = await approveDriver(id);
    if (!err) {
      setPendingDrivers(prev => prev.filter(d => d.id !== id));
      await load();
    }
    setApprovalLoading(prev => { const n = { ...prev }; delete n[id]; return n; });
    return err;
  }, [load]);

  const reject = useCallback(async (id: string): Promise<string | null> => {
    setApprovalLoading(prev => ({ ...prev, [id]: true }));
    const err = await rejectDriver(id);
    if (!err) {
      setPendingDrivers(prev => prev.filter(d => d.id !== id));
    }
    setApprovalLoading(prev => { const n = { ...prev }; delete n[id]; return n; });
    return err;
  }, []);

  useEffect(() => { load(); }, [load]);

  // Poll every 30 s with a 10-second abort guard
  useEffect(() => {
    const interval = setInterval(async () => {
      const controller = new AbortController();
      pollAbortRef.current = controller;
      const timer = setTimeout(() => controller.abort(), POLL_TIMEOUT_MS);
      try {
        const [{ drivers: data }, { drivers: pending }] = await Promise.all([
          fetchAllDrivers(),
          fetchPendingDrivers(),
        ]);
        if (!controller.signal.aborted) {
          setDrivers(data);
          setPendingDrivers(pending);
        }
      } catch (e) {
        if ((e as any)?.name !== 'AbortError') console.warn('[DriversContext] poll error:', e);
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
    <DriversContext.Provider value={{ drivers, pendingDrivers, loading, approvalLoading, approve, reject, refresh: load }}>
      {children}
    </DriversContext.Provider>
  );
}
