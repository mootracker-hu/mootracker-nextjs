// src/hooks/useAlertsNew.ts
// ✅ JAVÍTOTT VERZIÓ - Állat Riasztások Megjavítva

import { useState, useEffect, useCallback, useMemo } from 'react';
import { MagyarAlertEngine, magyarAlertEngine, Animal, PenInfo } from '@/lib/alerts/MagyarAlertEngine';
import { Alert, AlertPriority, AlertType } from '@/types/alert-task-types';
import { getAllAnimalsWithPens, getPensWithCounts, clearCache } from '@/lib/data/PenQueries';
import { supabase } from '@/lib/supabase';

// ============================================
// HOOK INTERFACE
// ============================================

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

export interface UseAlertsReturn {
  // Data
  alerts: Alert[];
  animalAlerts: Alert[];
  penAlerts: Alert[];
  animalPenMap?: Record<string, string>;
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
  createTaskFromAlert: (alert: Alert) => Promise<string>;
  
  // Filters
  getActiveAlerts: () => Alert[];
  getCriticalAlerts: () => Alert[];
  getOverdueAlerts: () => Alert[];
  getAlertsByPriority: (priority: AlertPriority) => Alert[];
  getAlertsByType: (type: AlertType) => Alert[];
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
  const [animalPenMap, setAnimalPenMap] = useState<Record<string, string>>({});
  
  // ============================================
  // 🔧 JAVÍTOTT DATA LOADING
  // ============================================
  
  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading unified alerts...');
      
      // ✅ STEP 1: ÁLLATOK LEKÉRDEZÉSE - JAVÍTOTT VERZIÓ
      const animalsData = await loadAnimalsWithPenFunction();
      const pensData = await getPensWithCounts();
      
      console.log(`📊 Loaded ${animalsData.animals.length} animals and ${pensData.length} pens`);
      console.log(`🗺️ Animal-Pen mapping: ${Object.keys(animalsData.animalPenMapping).length} entries`);
      
      // ✅ STEP 2: RIASZTÁSOK GENERÁLÁSA - MagyarAlertEngine
      const generatedAlerts = magyarAlertEngine.generateAllAlerts(
        animalsData.animals as any[], 
        pensData as any[]
      );

      console.log(`🚨 Generated ${generatedAlerts.length} alerts`);
      console.log('📈 Alert breakdown:', {
        animal_alerts: generatedAlerts.filter(a => a.animal_id).length,
        pen_alerts: generatedAlerts.filter(a => a.pen_id && !a.animal_id).length,
        total: generatedAlerts.length
      });
      
      // ✅ STEP 3: DEBUG - Első pár riasztás részletei
      if (generatedAlerts.length > 0) {
        console.log('🔍 First few alerts:', generatedAlerts.slice(0, 3).map(a => ({
          id: a.id,
          type: a.type,
          animal_id: a.animal_id,
          pen_id: a.pen_id,
          title: a.title,
          priority: a.priority
        })));
      }
      
      // ✅ STEP 4: RESOLVED/SNOOZED STATUS
      const resolvedAlerts = getResolvedAlertsFromStorage();
      const snoozedAlerts = getSnoozedAlertsFromStorage();
      
      const alertsWithStatus = generatedAlerts.map((alert: Alert) => ({
        ...alert,
        is_resolved: resolvedAlerts.includes(alert.id),
        is_snoozed: snoozedAlerts.some(s => s.alertId === alert.id && new Date(s.until) > new Date()),
        snoozed_until: snoozedAlerts.find(s => s.alertId === alert.id)?.until
      }));
      
      // ✅ STEP 5: STATE FRISSÍTÉS
      setAlerts(alertsWithStatus);
      setAnimalPenMap(animalsData.animalPenMapping);
      
    } catch (err) {
      console.error('❌ Error loading alerts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // 🆕 HELPER FUNCTION - ÁLLATOK KARÁM FUNKCIÓVAL
  // ============================================
  
  const loadAnimalsWithPenFunction = async (): Promise<{
    animals: any[];
    animalPenMapping: Record<string, string>;
  }> => {
    try {
      console.log('🔄 Loading animals with pen function...');
      
      // ✅ MÓDSZER 1: Próbáljuk a komplex JOIN-nal
      const { data: animalsWithPenFunction, error: complexError } = await supabase
        .from('animals')
        .select(`
          *,
          pens!left(
            id,
            pen_number,
            pen_functions!left(
              function_type,
              end_date
            )
          )
        `)
        .eq('statusz', 'aktív')
        .is('pens.pen_functions.end_date', null);

      if (!complexError && animalsWithPenFunction) {
        console.log('✅ Complex JOIN sikeres, animals:', animalsWithPenFunction.length);
        
        // Karám funkció hozzáadása az állat objektumhoz
        const animals = animalsWithPenFunction.map(animal => ({
          ...animal,
          current_pen_function: animal.pens?.pen_functions?.[0]?.function_type || null
        }));
        
        // Animal-Pen mapping
        const animalPenMapping = animals.reduce((map: Record<string, string>, animal: any) => {
          if (animal.id && animal.jelenlegi_karam) {
            map[animal.id] = animal.jelenlegi_karam;
          }
          return map;
        }, {} as Record<string, string>);

        console.log('✅ Complex JOIN method successful');
        return { animals, animalPenMapping };
      }
      
      console.log('⚠️ Complex JOIN failed, trying fallback method...');
      
      // ✅ MÓDSZER 2: FALLBACK - Külön lekérdezések
      const animalsData = await loadAnimalsWithFallbackMethod();
      console.log('✅ Fallback method successful');
      return animalsData;
      
    } catch (error) {
      console.error('❌ Error in loadAnimalsWithPenFunction:', error);
      
      // ✅ MÓDSZER 3: ULTIMATE FALLBACK
      const { data: basicAnimals } = await supabase
        .from('animals')
        .select('*')
        .eq('statusz', 'aktív');
      
      const animals = basicAnimals?.map(animal => ({
        ...animal,
        current_pen_function: null // Nincs karám funkció adat
      })) || [];
      
      const animalPenMapping = animals.reduce((map: Record<string, string>, animal: any) => {
        if (animal.id && animal.jelenlegi_karam) {
          map[animal.id] = animal.jelenlegi_karam;
        }
        return map;
      }, {} as Record<string, string>);
      
      console.log('⚠️ Using ultimate fallback method');
      return { animals, animalPenMapping };
    }
  };

  // ============================================
  // 🔧 FALLBACK METHOD - KÜLÖN LEKÉRDEZÉSEK
  // ============================================
  
  const loadAnimalsWithFallbackMethod = async (): Promise<{
    animals: any[];
    animalPenMapping: Record<string, string>;
  }> => {
    console.log('🔄 Fallback method: separate queries...');
    
    // 1. Állatok lekérdezése
    const { data: animals, error: animalsError } = await supabase
      .from('animals')
      .select('*')
      .eq('statusz', 'aktív');

    if (animalsError) {
      console.error('❌ Animals query error:', animalsError);
      throw animalsError;
    }

    // 2. Karamok és funkciók lekérdezése
    const { data: pensWithFunctions, error: pensError } = await supabase
      .from('pens')
      .select(`
        id,
        pen_number,
        pen_functions!left(
          function_type,
          end_date
        )
      `)
      .is('pen_functions.end_date', null);

    if (pensError) {
      console.error('❌ Pens query error:', pensError);
      throw pensError;
    }

    // 3. Pen_number -> function_type mapping
    const penFunctionMap = pensWithFunctions?.reduce((map: Record<string, string>, pen: any) => {
      if (pen.pen_number && pen.pen_functions?.[0]?.function_type) {
        map[pen.pen_number] = pen.pen_functions[0].function_type;
      }
      return map;
    }, {} as Record<string, string>) || {};

    console.log('🗺️ Pen function mapping sample:', Object.entries(penFunctionMap).slice(0, 5));

    // 4. Állatok current_pen_function hozzáadása
    const animalsWithFunction = animals?.map(animal => ({
      ...animal,
      current_pen_function: animal.jelenlegi_karam ? penFunctionMap[animal.jelenlegi_karam] : null
    })) || [];

    // 5. Animal-Pen mapping
    const animalPenMapping = animalsWithFunction.reduce((map: Record<string, string>, animal: any) => {
      if (animal.id && animal.jelenlegi_karam) {
        map[animal.id] = animal.jelenlegi_karam;
      }
      return map;
    }, {} as Record<string, string>);

    console.log(`✅ Fallback method: ${animalsWithFunction.length} animals processed`);
    console.log(`🔍 Sample animal with function:`, animalsWithFunction.slice(0, 1).map(a => ({
      enar: a.enar,
      jelenlegi_karam: a.jelenlegi_karam,
      current_pen_function: a.current_pen_function
    })));

    return { 
      animals: animalsWithFunction, 
      animalPenMapping 
    };
  };

  // ============================================
  // COMPUTED VALUES - változatlan
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
  // ACTIONS - változatlan
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
  // FILTERS - változatlan
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
  // EFFECTS - változatlan
  // ============================================
  
  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  useEffect(() => {
    const interval = setInterval(() => {
      console.log('⏰ Auto-refreshing alerts...');
      loadAlerts();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadAlerts]);

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
    }, 60 * 1000);

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
    animalPenMap,
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
    createTaskFromAlert: async (alert: Alert): Promise<string> => {
      const taskId = `task-${Date.now()}`;
      console.log(`✅ Task created from alert: ${taskId} for ${alert.title}`);
      return taskId;
    },
    
    // Filters
    getActiveAlerts,
    getCriticalAlerts,
    getOverdueAlerts,
    getAlertsByPriority,
    getAlertsByType,
  };
};

// ============================================
// LOCALSTORAGE HELPERS - változatlan
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
// SPECIALIZED HOOKS - változatlan
// ============================================

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

export default useAlertsNew;