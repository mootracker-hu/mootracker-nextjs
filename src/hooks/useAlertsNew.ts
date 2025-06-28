// src/hooks/useAlertsNew.ts
// Unified Alert Hook - Uses MagyarAlertEngine + PenQueries

import { useState, useEffect, useCallback, useMemo } from 'react';
import { MagyarAlertEngine, magyarAlertEngine, Alert, AlertPriority, AlertType, Animal, PenInfo } from '@/lib/alerts/MagyarAlertEngine';
import { getAllAnimalsWithPens, getPensWithCounts, clearCache } from '@/lib/data/PenQueries';

// ============================================
// HOOK INTERFACE
// ============================================

export interface UseAlertsReturn {
  // Data
  alerts: Alert[];
  animalAlerts: Alert[];
  penAlerts: Alert[];
  loading: boolean;
  error: string | null;
  
  // Stats
  stats: AlertStats;
  groupedByPriority: Record<AlertPriority, Alert[]>;
  groupedByType: Record<AlertType, Alert[]>;
  groupedByAnimal: Record<string, Alert[]>;
  
  // Actions
  refreshAlerts: () => Promise<void>;
  resolveAlert: (alertId: string) => void;
  snoozeAlert: (alertId: string, until: Date) => void;
  dismissAlert: (alertId: string) => void;
  
  // Filters
  getActiveAlerts: () => Alert[];
  getCriticalAlerts: () => Alert[];
  getOverdueAlerts: () => Alert[];
  getAlertsByPriority: (priority: AlertPriority) => Alert[];
  getAlertsByType: (type: AlertType) => Alert[];
}

interface SnoozedAlert {
  alertId: string;
  until: string;
}

export interface AlertStats {
  total: number;
  active: number;
  resolved: number;
  snoozed: number;
  overdue: number;
  critical: number;
  surgos: number;
  kritikus: number;
  magas: number;
  kozepes: number;
  alacsony: number;
}

// ============================================
// MAIN HOOK
// ============================================

export const useAlertsNew = (): UseAlertsReturn => {
  // ============================================
  // STATE
  // ============================================
  
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // DATA LOADING
  // ============================================
  
  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading unified alerts...');
      
      // Load animals and pens
      const [animals, pens] = await Promise.all([
        getAllAnimalsWithPens(),
        getPensWithCounts()
      ]);
      
      console.log(`📊 Loaded ${animals.length} animals and ${pens.length} pens`);
      
      // Generate all alerts using MagyarAlertEngine
      const generatedAlerts = magyarAlertEngine.generateAllAlerts(animals, pens);
      
      console.log(`🚨 Generated ${generatedAlerts.length} alerts`);
      console.log('📈 Alert breakdown:', {
        animal_alerts: generatedAlerts.filter(a => a.animal_id).length,
        pen_alerts: generatedAlerts.filter(a => a.pen_id && !a.animal_id).length,
        total: generatedAlerts.length
      });
      
      // Load resolved alerts from localStorage
      const resolvedAlerts = getResolvedAlertsFromStorage();
      const snoozedAlerts = getSnoozedAlertsFromStorage();
      
      // Apply resolved/snoozed status
      const alertsWithStatus = generatedAlerts.map((alert: Alert) => ({
        ...alert,
        is_resolved: resolvedAlerts.includes(alert.id),
        is_snoozed: snoozedAlerts.some(s => s.alertId === alert.id && new Date(s.until) > new Date()),
        snoozed_until: snoozedAlerts.find(s => s.alertId === alert.id)?.until
      }));
      
      setAlerts(alertsWithStatus);
      
    } catch (err) {
      console.error('❌ Error loading alerts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // COMPUTED VALUES
  // ============================================
  
  const animalAlerts = useMemo(() => 
    alerts.filter(alert => alert.animal_id), 
    [alerts]
  );

  const penAlerts = useMemo(() => 
    alerts.filter(alert => alert.pen_id && !alert.animal_id), 
    [alerts]
  );

  const stats = useMemo((): AlertStats => {
    const activeAlerts = alerts.filter(a => !a.is_resolved && !a.is_snoozed);
    const now = new Date();
    
    return {
      total: alerts.length,
      active: activeAlerts.length,
      resolved: alerts.filter(a => a.is_resolved).length,
      snoozed: alerts.filter(a => a.is_snoozed).length,
      overdue: alerts.filter(a => 
        a.due_date && 
        new Date(a.due_date) < now && 
        !a.is_resolved
      ).length,
      critical: activeAlerts.filter(a => a.priority === 'surgos' || a.priority === 'kritikus').length,
      surgos: activeAlerts.filter(a => a.priority === 'surgos').length,
      kritikus: activeAlerts.filter(a => a.priority === 'kritikus').length,
      magas: activeAlerts.filter(a => a.priority === 'magas').length,
      kozepes: activeAlerts.filter(a => a.priority === 'kozepes').length,
      alacsony: activeAlerts.filter(a => a.priority === 'alacsony').length
    };
  }, [alerts]);

  const groupedByPriority = useMemo(() => {
    const groups: Record<AlertPriority, Alert[]> = {
      surgos: [],
      kritikus: [],
      magas: [],
      kozepes: [],
      alacsony: []
    };
    
    alerts.forEach(alert => {
      groups[alert.priority].push(alert);
    });
    
    return groups;
  }, [alerts]);

  const groupedByType = useMemo(() => {
    const groups: Record<string, Alert[]> = {};
    
    alerts.forEach(alert => {
      if (!groups[alert.type]) {
        groups[alert.type] = [];
      }
      groups[alert.type].push(alert);
    });
    
    return groups as Record<AlertType, Alert[]>;
  }, [alerts]);

  const groupedByAnimal = useMemo(() => {
    const groups: Record<string, Alert[]> = {};
    
    alerts.forEach(alert => {
      if (alert.animal_id && alert.enar) {
        if (!groups[alert.enar]) {
          groups[alert.enar] = [];
        }
        groups[alert.enar].push(alert);
      }
    });
    
    return groups;
  }, [alerts]);

  // ============================================
  // ACTIONS
  // ============================================
  
  const refreshAlerts = useCallback(async () => {
    console.log('🔄 Refreshing alerts...');
    clearCache(); // Clear PenQueries cache
    await loadAlerts();
  }, [loadAlerts]);

  const resolveAlert = useCallback((alertId: string) => {
    console.log('✅ Resolving alert:', alertId);
    
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, is_resolved: true, resolved_at: new Date().toISOString() }
        : alert
    ));
    
    // Save to localStorage
    const resolved = getResolvedAlertsFromStorage();
    resolved.push(alertId);
    localStorage.setItem('mootracker_resolved_alerts', JSON.stringify(resolved));
  }, []);

  const snoozeAlert = useCallback((alertId: string, until: Date) => {
    console.log('⏰ Snoozing alert:', alertId, 'until:', until);
    
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, is_snoozed: true, snoozed_until: until.toISOString() }
        : alert
    ));
    
    // Save to localStorage
    const snoozed = getSnoozedAlertsFromStorage();
    const existing = snoozed.findIndex(s => s.alertId === alertId);
    
    if (existing >= 0) {
      snoozed[existing] = { alertId, until: until.toISOString() };
    } else {
      snoozed.push({ alertId, until: until.toISOString() });
    }
    
    localStorage.setItem('mootracker_snoozed_alerts', JSON.stringify(snoozed));
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    console.log('🗑️ Dismissing alert:', alertId);
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  // ============================================
  // FILTERS
  // ============================================
  
  const getActiveAlerts = useCallback(() => {
    return alerts.filter(alert => !alert.is_resolved && !alert.is_snoozed);
  }, [alerts]);

  const getCriticalAlerts = useCallback(() => {
    return getActiveAlerts().filter(alert => 
      alert.priority === 'surgos' || alert.priority === 'kritikus'
    );
  }, [getActiveAlerts]);

  const getOverdueAlerts = useCallback(() => {
    const now = new Date();
    return getActiveAlerts().filter(alert => 
      alert.due_date && new Date(alert.due_date) < now
    );
  }, [getActiveAlerts]);

  const getAlertsByPriority = useCallback((priority: AlertPriority) => {
    return alerts.filter(alert => alert.priority === priority);
  }, [alerts]);

  const getAlertsByType = useCallback((type: AlertType) => {
    return alerts.filter(alert => alert.type === type);
  }, [alerts]);

  // ============================================
  // EFFECTS
  // ============================================
  
  // Load alerts on mount
  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('⏰ Auto-refreshing alerts...');
      loadAlerts();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [loadAlerts]);

  // Check snoozed alerts every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setAlerts(prev => prev.map(alert => {
        if (alert.is_snoozed && 
            alert.snoozed_until && 
            new Date(alert.snoozed_until) <= now) {
          console.log('⏰ Alert unsnoozed:', alert.id);
          return {
            ...alert,
            is_snoozed: false,
            snoozed_until: undefined
          };
        }
        return alert;
      }));
    }, 60 * 1000); // 1 minute

    return () => clearInterval(interval);
  }, []);

  // ============================================
  // RETURN
  // ============================================
  
  return {
    // Data
    alerts,
    animalAlerts,
    penAlerts,
    loading,
    error,
    
    // Stats
    stats,
    groupedByPriority,
    groupedByType,
    groupedByAnimal,
    
    // Actions
    refreshAlerts,
    resolveAlert,
    snoozeAlert,
    dismissAlert,
    
    // Filters
    getActiveAlerts,
    getCriticalAlerts,
    getOverdueAlerts,
    getAlertsByPriority,
    getAlertsByType
  };
};

// ============================================
// LOCALSTORAGE HELPERS
// ============================================

function getResolvedAlertsFromStorage(): string[] {
  try {
    const stored = localStorage.getItem('mootracker_resolved_alerts');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function getSnoozedAlertsFromStorage(): SnoozedAlert[] {
  try {
    const stored = localStorage.getItem('mootracker_snoozed_alerts');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// ============================================
// SPECIALIZED HOOKS
// ============================================

/**
 * Hook for only active alerts
 */
export const useActiveAlerts = () => {
  const { getActiveAlerts, loading, error, refreshAlerts } = useAlertsNew();
  
  const activeAlerts = useMemo(() => getActiveAlerts(), [getActiveAlerts]);
  
  return {
    alerts: activeAlerts,
    loading,
    error,
    refreshAlerts
  };
};

/**
 * Hook for only critical alerts
 */
export const useCriticalAlerts = () => {
  const { getCriticalAlerts, loading, error, refreshAlerts } = useAlertsNew();
  
  const criticalAlerts = useMemo(() => getCriticalAlerts(), [getCriticalAlerts]);
  
  return {
    alerts: criticalAlerts,
    loading,
    error,
    refreshAlerts
  };
};

/**
 * Hook for alerts by priority
 */
export const useAlertsByPriority = (priority: AlertPriority) => {
  const { getAlertsByPriority, loading, error, refreshAlerts } = useAlertsNew();
  
  const alerts = useMemo(() => getAlertsByPriority(priority), [getAlertsByPriority, priority]);
  
  return {
    alerts,
    loading,
    error,
    refreshAlerts
  };
};

// ============================================
// EXPORTS
// ============================================

export default useAlertsNew;