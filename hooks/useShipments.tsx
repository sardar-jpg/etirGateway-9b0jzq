import { useContext } from 'react';
import { ShipmentsContext } from '@/contexts/ShipmentsContext';

export function useShipments(driverId?: string) {
  const context = useContext(ShipmentsContext);
  if (!context) throw new Error('useShipments must be used within ShipmentsProvider');

  // Guard: context.shipments may be undefined/null during the brief window
  // between provider mount and first fetch completing. Fall back to [] to
  // prevent a runtime crash on .filter() when the context is not yet populated.
  const allShipments = context.shipments ?? [];
  const shipments = driverId
    ? allShipments.filter(s => s.driverId === driverId)
    : allShipments;

  return {
    shipments,
    loading: context.loading,
    error: context.error,
    pollError: context.pollError,
    clearPollError: context.clearPollError,
    refresh: context.refresh,
    getByToken: context.getByToken,
    getById: context.getById,
    getByTirNumber: context.getByTirNumber,
    updateStatus: context.updateStatus,
    assignDriver: context.assignDriver,
    updateETA: context.updateETA,
    acceptPrice: context.acceptPrice,
    addShipment: context.addShipment,
    getStats: context.getStats,
    selectedShipment: null,
    setSelectedShipment: () => {},
  };
}
