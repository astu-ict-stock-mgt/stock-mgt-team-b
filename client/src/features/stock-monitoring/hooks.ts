import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchStockAlerts, fetchStockSummaryStats } from './api';
import type { StockAlertFilter } from './types';

export const STOCK_MONITORING_QUERY_KEYS = {
  all: ['stock-monitoring'] as const,
  alerts: (filter?: StockAlertFilter) => ['stock-monitoring', 'alerts', filter] as const,
  stats: ['stock-monitoring', 'stats'] as const,
};

interface UseStockAlertsOptions {
  /**
   * Refetch interval in milliseconds (e.g. 15000 for 15s polling).
   * Defaults to 30000ms (30 seconds) for real-time monitoring.
   * Pass false to disable polling.
   */
  refetchInterval?: number | false;
  enabled?: boolean;
}

export function useStockAlerts(filter: StockAlertFilter = {}, options: UseStockAlertsOptions = {}) {
  const { refetchInterval = 30000, enabled = true } = options;
  const queryClient = useQueryClient();

  // Listen for global stock update / transaction events across the system
  useEffect(() => {
    const handleStockUpdate = () => {
      queryClient.invalidateQueries({ queryKey: STOCK_MONITORING_QUERY_KEYS.all });
    };

    window.addEventListener('stock:transaction:created', handleStockUpdate);
    window.addEventListener('stock:updated', handleStockUpdate);

    return () => {
      window.removeEventListener('stock:transaction:created', handleStockUpdate);
      window.removeEventListener('stock:updated', handleStockUpdate);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: STOCK_MONITORING_QUERY_KEYS.alerts(filter),
    queryFn: () => fetchStockAlerts(filter),
    refetchInterval,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 5000,
    enabled,
  });
}

export function useStockSummaryStats(options: UseStockAlertsOptions = {}) {
  const { refetchInterval = 30000, enabled = true } = options;

  return useQuery({
    queryKey: STOCK_MONITORING_QUERY_KEYS.stats,
    queryFn: fetchStockSummaryStats,
    refetchInterval,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 5000,
    enabled,
  });
}

/**
 * Hook to manually trigger a system-wide stock alerts cache invalidation
 * (e.g. after receiving, issuing, or transferring items)
 */
export function useInvalidateStockAlerts() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: STOCK_MONITORING_QUERY_KEYS.all });
    window.dispatchEvent(new CustomEvent('stock:transaction:created'));
  };
}
