// src/hooks/useAlerts.ts
// MooTracker Alert rendszer - Tiszta verzió

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Alert, 
  AlertType, 
  AlertPriority, 
  AlertRule, 
  Animal, 
  UseAlertsReturn,
  CreateTaskRequest,
  DailyTaskSchedule,
  AlertStats
} from '@/types/alert-task-types';

// ============================================
// ALERT SZABÁLYOK
// ============================================

const ALERT_RULES: AlertRule[] = [
  {
    type: 'vaccination_due',
    priority: 'critical',
    title: 'BoviPast vakcinázás esedékes',
    description: '15 napos borjú vakcinázása szükséges',
    checkCondition: (animal) => {
      const birthDate = new Date(animal.szuletesi_datum);
      const daysSinceBirth = Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceBirth >= 15 && daysSinceBirth <= 30 && 
             animal.kategoria === 'borjú' && 
             animal.statusz === 'aktív';
    },
    daysFromBirth: 15,
    suggestedActions: [
      'BoviPast vakcina beadása',
      'Szarvtalanítás elvégzése',
      'Fülszám felhelyezése'
    ],
    canCreateTask: true,
    canPostpone: false
  },
  {
    type: 'weaning_time',
    priority: 'high',
    title: 'Választási idő',
    description: '6 hónapos borjú választása szükséges',
    checkCondition: (animal) => {
      const birthDate = new Date(animal.szuletesi_datum);
      const daysSinceBirth = Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceBirth >= 180 && daysSinceBirth <= 200 && 
             animal.kategoria === 'borjú' && 
             animal.statusz === 'aktív';
    },
    daysFromBirth: 180,
    suggestedActions: [
      'Borjú leválasztása anyjáról',
      'Külön karámba helyezés'
    ],
    canCreateTask: true,
    canPostpone: true
  },
  {
    type: 'pen_change_needed',
    priority: 'medium',
    title: 'Óvi karámba áthelyezés',
    description: '12 hónapos állat óvi karámba költöztetése',
    checkCondition: (animal) => {
      const birthDate = new Date(animal.szuletesi_datum);
      const daysSinceBirth = Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceBirth >= 365 && daysSinceBirth <= 380 && 
             animal.kategoria === 'borjú' && 
             animal.statusz === 'aktív';
    },
    daysFromBirth: 365,
    suggestedActions: [
      'Bölcsi karámból óvi karámba költöztetés'
    ],
    canCreateTask: true,
    canPostpone: true
  },
  {
    type: 'breeding_reminder',
    priority: 'high',
    title: 'Hárem karám alkalmasság',
    description: '24 hónapos nőivar hárem karámba helyezése',
    checkCondition: (animal) => {
      const birthDate = new Date(animal.szuletesi_datum);
      const daysSinceBirth = Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceBirth >= 730 && daysSinceBirth <= 750 && 
             animal.ivar === 'nőivar' && 
             animal.kategoria !== 'tehén' &&
             animal.statusz === 'aktív';
    },
    daysFromBirth: 730,
    suggestedActions: [
      'Hárem karámba költöztetés',
      'Tenyésztési program felülvizsgálata'
    ],
    canCreateTask: true,
    canPostpone: true
  },
  {
    type: 'market_opportunity',
    priority: 'medium',
    title: 'Értékesítési lehetőség',
    description: '24 hónapos hím állat értékesítésre kész',
    checkCondition: (animal) => {
      const birthDate = new Date(animal.szuletesi_datum);
      const daysSinceBirth = Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceBirth >= 730 && daysSinceBirth <= 750 && 
             animal.ivar === 'hím' && 
             animal.kategoria !== 'tenyészbika' &&
             animal.statusz === 'aktív';
    },
    daysFromBirth: 730,
    suggestedActions: [
      'Piaci ár ellenőrzése',
      'Vásár időpontok felderítése'
    ],
    canCreateTask: true,
    canPostpone: true
  },
  {
    type: 'pregnancy_check',
    priority: 'high',
    title: 'Vemhességvizsgálat esedékes',
    description: 'Párzás után 75 nappal VV vizsgálat szükséges',
    checkCondition: (animal) => {
      return (animal.kategoria === 'tehén' || animal.kategoria === 'üsző') && 
             animal.statusz === 'aktív';
    },
    suggestedActions: [
      'Állatorvos meghívása VV-ra',
      'Ultrahangos vizsgálat'
    ],
    canCreateTask: true,
    canPostpone: false
  },
  {
    type: 'birth_approaching',
    priority: 'critical',
    title: 'Ellés közeledik',
    description: '2-3 hét múlva várható ellés',
    checkCondition: (animal) => {
      return animal.kategoria === 'vemhes' && animal.statusz === 'aktív';
    },
    suggestedActions: [
      'Ellető karámba költöztetés',
      'Szülési felszerelés előkészítése'
    ],
    canCreateTask: true,
    canPostpone: false
  }
];

// ============================================
// ALERT ENGINE
// ============================================

class AlertRuleEngine {
  private rules: AlertRule[] = ALERT_RULES;

  generateAlertsForAnimal(animal: Animal): Alert[] {
    const alerts: Alert[] = [];

    for (const rule of this.rules) {
      if (rule.checkCondition(animal)) {
        const alert: Alert = {
          id: `alert-${animal.id}-${rule.type}-${Date.now()}`,
          type: rule.type,
          priority: rule.priority,
          title: rule.title,
          description: rule.description.replace('{enar}', animal.enar),
          animal_id: animal.id,
          animal: {
            id: animal.id,
            enar: animal.enar
          },
          created_at: new Date().toISOString(),
          due_date: this.calculateDueDate(rule, animal),
          is_resolved: false,
          is_snoozed: false,
          action_required: rule.suggestedActions.join(', '),
          suggested_actions: rule.suggestedActions,
          can_create_task: rule.canCreateTask,
          can_postpone: rule.canPostpone,
          metadata: {
            animal_age_days: rule.daysFromBirth ? 
              Math.floor((Date.now() - new Date(animal.szuletesi_datum).getTime()) / (1000 * 60 * 60 * 24)) :
              undefined,
            rule_type: rule.type
          }
        };

        alerts.push(alert);
      }
    }

    return alerts;
  }

  generateAlertsForAnimals(animals: Animal[]): Alert[] {
    const allAlerts: Alert[] = [];
    
    for (const animal of animals) {
      const animalAlerts = this.generateAlertsForAnimal(animal);
      allAlerts.push(...animalAlerts);
    }

    return allAlerts;
  }

  private calculateDueDate(rule: AlertRule, animal: Animal): string {
    if (rule.type === 'vaccination_due' || rule.type === 'birth_approaching') {
      return new Date(Date.now() + (3 * 24 * 60 * 60 * 1000)).toISOString();
    }
    
    if (rule.type === 'pregnancy_check') {
      return new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString();
    }
    
    return new Date(Date.now() + (14 * 24 * 60 * 60 * 1000)).toISOString();
  }
}

// ============================================
// ALERT AGGREGATOR
// ============================================

class AlertAggregator {
  static groupByPriority(alerts: Alert[]): Record<AlertPriority, Alert[]> {
    return alerts.reduce((groups, alert) => {
      if (!groups[alert.priority]) {
        groups[alert.priority] = [];
      }
      groups[alert.priority].push(alert);
      return groups;
    }, {} as Record<AlertPriority, Alert[]>);
  }

  static groupByType(alerts: Alert[]): Record<AlertType, Alert[]> {
    return alerts.reduce((groups, alert) => {
      if (!groups[alert.type]) {
        groups[alert.type] = [];
      }
      groups[alert.type].push(alert);
      return groups;
    }, {} as Record<AlertType, Alert[]>);
  }

  static groupByAnimal(alerts: Alert[]): Record<string, Alert[]> {
    return alerts.reduce((groups, alert) => {
      const key = alert.animal.enar;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(alert);
      return groups;
    }, {} as Record<string, Alert[]>);
  }

  static getStats(alerts: Alert[]): AlertStats {
    const total = alerts.length;
    const active = alerts.filter(a => !a.is_resolved && !a.is_snoozed).length;
    const resolved = alerts.filter(a => a.is_resolved).length;
    const snoozed = alerts.filter(a => a.is_snoozed).length;
    const overdue = alerts.filter(a => 
      a.due_date && 
      new Date(a.due_date) < new Date() && 
      !a.is_resolved
    ).length;

    const priorities = AlertAggregator.groupByPriority(alerts);
    
    return {
      total,
      active,
      resolved,
      snoozed,
      overdue,
      critical: priorities.critical?.length || 0,
      urgent: priorities.urgent?.length || 0,
      high: priorities.high?.length || 0,
      medium: priorities.medium?.length || 0,
      low: priorities.low?.length || 0
    };
  }
}

// ============================================
// REACT HOOK
// ============================================

export const useAlerts = (): UseAlertsReturn => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Állatok lekérdezése és riasztások generálása
  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: animals, error: animalsError } = await supabase
        .from('animals')
        .select('*')
        .eq('statusz', 'aktív');

      if (animalsError) {
        throw new Error(`Állatok betöltése sikertelen: ${animalsError.message}`);
      }

      if (!animals || animals.length === 0) {
        console.log('Nincsenek aktív állatok');
        setAlerts([]);
        return;
      }

      console.log(`${animals.length} aktív állat betöltve`);

      const alertEngine = new AlertRuleEngine();
      const generatedAlerts = alertEngine.generateAlertsForAnimals(animals);
      
      // Alert-Task kapcsolatok helyreállítása
      let connections: Record<string, string> = {};
      let resolvedAlerts: string[] = [];
      try {
        connections = JSON.parse(localStorage.getItem('mootracker_alert_tasks') || '{}');
        resolvedAlerts = JSON.parse(localStorage.getItem('mootracker_resolved_alerts') || '[]');
      } catch (error) {
        console.warn('localStorage betöltési hiba:', error);
      }
      
      const alertsWithStatus = generatedAlerts.map(alert => ({
        ...alert,
        related_task_id: connections[alert.id] || undefined,
        is_resolved: resolvedAlerts.includes(alert.id),
        resolved_at: resolvedAlerts.includes(alert.id) ? new Date().toISOString() : undefined
      }));
      
      console.log(`${alertsWithStatus.length} riasztás generálva`);
      
      setAlerts(alertsWithStatus);
    } catch (err) {
      console.error('Alert loading error:', err);
      setError(err instanceof Error ? err.message : 'Ismeretlen hiba történt');
    } finally {
      setLoading(false);
    }
  }, []); // ← ÜRES DEPENDENCY ARRAY!

  // Komponens mount-kor betöltés
  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Riasztás lezárása (localStorage perzisztálással)
  const resolveAlert = useCallback(async (alertId: string) => {
    setAlerts(prev => {
      const updatedAlerts = prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, is_resolved: true, resolved_at: new Date().toISOString() }
          : alert
      );
      
      // localStorage-ba mentés
      const resolvedAlerts = JSON.parse(localStorage.getItem('mootracker_resolved_alerts') || '[]');
      if (!resolvedAlerts.includes(alertId)) {
        resolvedAlerts.push(alertId);
        localStorage.setItem('mootracker_resolved_alerts', JSON.stringify(resolvedAlerts));
      }
      
      return updatedAlerts;
    });
  }, []);

  // Riasztás halasztása
  const snoozeAlert = useCallback(async (alertId: string, until: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, is_snoozed: true, snoozed_until: until }
        : alert
    ));
  }, []);

  // Task létrehozása riasztásból
  const createTaskFromAlert = useCallback(async (
    alert: Alert, 
    taskData?: Partial<CreateTaskRequest>
  ): Promise<string> => {
    try {
      const taskId = `task-${Date.now()}`;
      
      console.log('Creating task from alert:', {
        alertId: alert.id,
        taskId,
        customData: taskData
      });
      
      // Alert frissítése a kapcsolt task ID-val
      setAlerts(prev => prev.map(a => 
        a.id === alert.id 
          ? { ...a, related_task_id: taskId }
          : a
      ));

      // LocalStorage-ba mentés
      try {
        const alertTaskConnections = JSON.parse(localStorage.getItem('mootracker_alert_tasks') || '{}');
        alertTaskConnections[alert.id] = taskId;
        localStorage.setItem('mootracker_alert_tasks', JSON.stringify(alertTaskConnections));
        console.log('✅ Alert-Task kapcsolat mentve localStorage-ba');
      } catch (storageError) {
        console.warn('LocalStorage mentési hiba:', storageError);
      }
      
      return taskId;
    } catch (error) {
      console.error('Task creation error:', error);
      throw error;
    }
  }, []);

  // Számítások
  const alertStats = AlertAggregator.getStats(alerts);
  const alertsByPriority = AlertAggregator.groupByPriority(alerts);
  const alertsByType = AlertAggregator.groupByType(alerts);
  const alertsByAnimal = AlertAggregator.groupByAnimal(alerts);

  return {
    alerts,
    loading,
    error,
    alertStats,
    alertsByPriority,
    alertsByType,
    alertsByAnimal,
    refreshAlerts: loadAlerts,
    resolveAlert,
    snoozeAlert,
    createTaskFromAlert
  };
};