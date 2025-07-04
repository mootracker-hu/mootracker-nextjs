// src/hooks/useAlerts.ts
// MooTracker Alert rendszer - FRISSÍTETT VERZIÓ v8.1

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
  AlertStats,
  ALERT_TYPE_LABELS,
  PregnancyStatus,
  VVResult
} from '@/types/alert-task-types';

// ============================================
// MAGYAR ALERT SZABÁLYOK - VV PROTOKOLLAL
// ============================================

const MAGYAR_ALERT_SZABALYOK: AlertRule[] = [
  {
    type: 'vakcinazas_esedékes',
    priority: 'kritikus',
    title: 'BoviPast vakcinázás esedékes',
    description: '15 napos borjú vakcinázása szükséges - ENAR: {enar}',
    checkCondition: (animal) => {
      const birthDate = new Date(animal.szuletesi_datum);
      const daysSinceBirth = Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceBirth >= 15 && daysSinceBirth <= 30 && 
             animal.kategoria.includes('borjú') && 
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
    type: 'valasztas_ideje',
    priority: 'magas',
    title: 'Választási idő',
    description: '6 hónapos borjú választása szükséges - ENAR: {enar}',
    checkCondition: (animal) => {
      const birthDate = new Date(animal.szuletesi_datum);
      const daysSinceBirth = Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceBirth >= 180 && daysSinceBirth <= 200 && 
             animal.kategoria.includes('borjú') && 
             animal.statusz === 'aktív';
    },
    daysFromBirth: 180,
    suggestedActions: [
      'Borjú leválasztása anyjáról',
      'Bölcsi karámból óvi karámba áthelyezés'
    ],
    canCreateTask: true,
    canPostpone: true
  },
  {
    type: 'karam_valtas_szukseges',
    priority: 'kozepes',
    title: 'Óvi karámba áthelyezés',
    description: '12 hónapos állat óvi karámba költöztetése - ENAR: {enar}',
    checkCondition: (animal) => {
      const birthDate = new Date(animal.szuletesi_datum);
      const daysSinceBirth = Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceBirth >= 365 && daysSinceBirth <= 380 && 
             animal.kategoria.includes('borjú') && 
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
    type: 'tenyesztesi_emlekezeto',
    priority: 'magas',
    title: 'Hárem karám alkalmasság',
    description: '24 hónapos nőivar hárem karámba helyezése - ENAR: {enar}',
    checkCondition: (animal) => {
      const birthDate = new Date(animal.szuletesi_datum);
      const daysSinceBirth = Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceBirth >= 730 && daysSinceBirth <= 750 && 
             animal.ivar === 'nőivar' && 
             !animal.kategoria.includes('tehén') &&
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
    type: 'piaci_lehetoseg',
    priority: 'kozepes',
    title: 'Értékesítési lehetőség',
    description: '24 hónapos hím állat értékesítésre kész - ENAR: {enar}',
    checkCondition: (animal) => {
      const birthDate = new Date(animal.szuletesi_datum);
      const daysSinceBirth = Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceBirth >= 730 && daysSinceBirth <= 750 && 
             animal.ivar === 'hím' && 
             !animal.kategoria.includes('tenyészbika') &&
             animal.statusz === 'aktív';
    },
    daysFromBirth: 730,
    suggestedActions: [
      'Piaci ár ellenőrzése',
      'Vásár időpontok felderítése',
      'Selejt karámba áthelyezés mérlegelése'
    ],
    canCreateTask: true,
    canPostpone: true
  },
  
  // ✅ JAVÍTOTT VV VIZSGÁLAT - CSAK HÁREM KARÁMBAN LÉVŐ ÁLLATOKRA
  {
    type: 'vemhessegvizsgalat',
    priority: 'magas',
    title: 'Vemhességvizsgálat esedékes',
    description: 'Háremben 75 napja lévő állat VV vizsgálata - ENAR: {enar}',
    checkCondition: (animal) => {
      // CSAK akkor riaszt, ha:
      // 1. Hárem karámban van (pairing_date megvan)
      // 2. 75+ nap telt el párzás kezdete óta  
      // 3. Még nincs VV eredmény
      if (!animal.pairing_date || animal.vv_date) return false;
      
      const pairingDate = new Date(animal.pairing_date);
      const daysSincePairing = Math.floor((Date.now() - pairingDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return daysSincePairing >= 75 && 
             (animal.kategoria.includes('tehén') || animal.kategoria.includes('üsző')) && 
             animal.statusz === 'aktív';
    },
    suggestedActions: [
      'Állatorvos meghívása VV vizsgálatra',
      'Ultrahangos vizsgálat elvégzése',
      'VV eredmény rögzítése a rendszerben'
    ],
    canCreateTask: true,
    canPostpone: false
  },

  // ✅ ÚJ VV PROTOKOLL ALERTEK
  {
    type: 'rcc_vakcina_esedékes',
    priority: 'kritikus',
    title: 'RCC vakcina esedékes',
    description: 'RCC vakcina beadása ellés előtt 6 héttel - ENAR: {enar}',
    checkCondition: (animal) => {
      if (!animal.expected_birth_date || animal.pregnancy_status !== 'vemhes') return false;
      
      const expectedBirth = new Date(animal.expected_birth_date);
      const rccDueDate = new Date(expectedBirth.getTime() - (42 * 24 * 60 * 60 * 1000)); // 6 hét előtte
      const today = new Date();
      
      return today >= rccDueDate && today <= new Date(rccDueDate.getTime() + (7 * 24 * 60 * 60 * 1000));
    },
    suggestedActions: [
      'RCC (Rotavirus-Coronavirus-E.coli) vakcina beadása',
      'Állatorvosi konzultáció',
      'Vakcinázás dátumának rögzítése'
    ],
    canCreateTask: true,
    canPostpone: false
  },
  {
    type: 'bovipast_vakcina_esedékes',
    priority: 'kritikus',
    title: 'BoviPast vakcina esedékes',
    description: 'BoviPast vakcina beadása ellés előtt 4 héttel - ENAR: {enar}',
    checkCondition: (animal) => {
      if (!animal.expected_birth_date || animal.pregnancy_status !== 'vemhes') return false;
      
      const expectedBirth = new Date(animal.expected_birth_date);
      const boviDueDate = new Date(expectedBirth.getTime() - (28 * 24 * 60 * 60 * 1000)); // 4 hét előtte
      const today = new Date();
      
      return today >= boviDueDate && today <= new Date(boviDueDate.getTime() + (7 * 24 * 60 * 60 * 1000));
    },
    suggestedActions: [
      'BoviPast vakcina beadása vemhes állatnak',
      'Ellés előkészítés megkezdése',
      'Vakcinázás dokumentálása'
    ],
    canCreateTask: true,
    canPostpone: false
  },
  {
    type: 'abrak_elvetel_esedékes',
    priority: 'magas',
    title: 'Abrak elvétel szükséges',
    description: 'Vemhes állat abrakjának megvonása ellés előtt 2 héttel - ENAR: {enar}',
    checkCondition: (animal) => {
      if (!animal.expected_birth_date || animal.pregnancy_status !== 'vemhes') return false;
      
      const expectedBirth = new Date(animal.expected_birth_date);
      const feedStopDate = new Date(expectedBirth.getTime() - (14 * 24 * 60 * 60 * 1000)); // 2 hét előtte
      const today = new Date();
      
      return today >= feedStopDate && today <= new Date(feedStopDate.getTime() + (3 * 24 * 60 * 60 * 1000));
    },
    suggestedActions: [
      'Abrak teljesen megvonása',
      'Csak szalma etetése',
      'Vízellátás biztosítása'
    ],
    canCreateTask: true,
    canPostpone: false
  },
  {
    type: 'elleto_karam_athelyezes',
    priority: 'kritikus',
    title: 'Ellető karámba áthelyezés',
    description: 'Állat ellető karámba mozgatása ellés előtt 1 héttel - ENAR: {enar}',
    checkCondition: (animal) => {
      if (!animal.expected_birth_date || animal.pregnancy_status !== 'vemhes') return false;
      
      const expectedBirth = new Date(animal.expected_birth_date);
      const moveDate = new Date(expectedBirth.getTime() - (7 * 24 * 60 * 60 * 1000)); // 1 hét előtte
      const today = new Date();
      
      return today >= moveDate && today <= new Date(moveDate.getTime() + (2 * 24 * 60 * 60 * 1000));
    },
    suggestedActions: [
      'Ellető karámba (E1-E12) áthelyezés',
      'Szülési felszerelés előkészítése',
      'Fokozott megfigyelés indítása'
    ],
    canCreateTask: true,
    canPostpone: false
  },
  {
    type: 'elles_kozeledik',
    priority: 'kritikus',
    title: 'Ellés közeledik',
    description: 'Állat ellése napokban várható - ENAR: {enar}',
    checkCondition: (animal) => {
      if (!animal.expected_birth_date || animal.pregnancy_status !== 'vemhes') return false;
      
      const expectedBirth = new Date(animal.expected_birth_date);
      const today = new Date();
      const daysUntilBirth = Math.ceil((expectedBirth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      return daysUntilBirth >= 0 && daysUntilBirth <= 3;
    },
    suggestedActions: [
      'Fokozott megfigyelés',
      'Ellési felszerelés készenlétben',
      '24 órás monitoring'
    ],
    canCreateTask: true,
    canPostpone: false
  },
  {
    type: 'elles_kesesben',
    priority: 'surgos',
    title: 'TÚLHORDÁS - Állatorvosi beavatkozás szükséges',
    description: 'Ellés határideje túllépve - azonnali vizsgálat - ENAR: {enar}',
    checkCondition: (animal) => {
      if (!animal.expected_birth_date || animal.pregnancy_status !== 'vemhes') return false;
      
      const expectedBirth = new Date(animal.expected_birth_date);
      const today = new Date();
      const daysOverdue = Math.floor((today.getTime() - expectedBirth.getTime()) / (1000 * 60 * 60 * 24));
      
      return daysOverdue >= 7; // 1 hét túlhordás
    },
    suggestedActions: [
      'AZONNALI állatorvosi vizsgálat',
      'Császármetszés mérlegelése',
      'Intenzív monitoring'
    ],
    canCreateTask: true,
    canPostpone: false
  },

  // ✅ VV UTÓKÖVETÉS ALERTEK
  {
    type: 'vemhessegvizsgalat_ismetles',
    priority: 'kozepes',
    title: 'VV vizsgálat ismétlése',
    description: 'Üres állat újbóli vemhességvizsgálata 2 hónap után - ENAR: {enar}',
    checkCondition: (animal) => {
      if (!animal.vv_date || animal.pregnancy_status !== 'ures') return false;
      
      const vvDate = new Date(animal.vv_date);
      const daysSinceVV = Math.floor((Date.now() - vvDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return daysSinceVV >= 60 && daysSinceVV <= 70; // 2 hónap után
    },
    suggestedActions: [
      'Újbóli VV vizsgálat ütemezése',
      'Állat reprodukciós állapotának értékelése',
      'Tenyésztési stratégia felülvizsgálata'
    ],
    canCreateTask: true,
    canPostpone: true
  },
  {
    type: 'selejtezesi_javaslat',
    priority: 'magas',
    title: 'Selejtezés szükséges',
    description: 'Reprodukciós probléma - állat nem tenyésztésre alkalmas - ENAR: {enar}',
    checkCondition: (animal) => {
      return animal.pregnancy_status === 'csira' && animal.statusz === 'aktív';
    },
    suggestedActions: [
      'Értékesítés előkészítése',
      'Selejt karámba áthelyezés',
      'Piaci lehetőségek felmérése'
    ],
    canCreateTask: true,
    canPostpone: false
  }
];

// ============================================
// ALERT ENGINE - JAVÍTOTT VERZIÓ
// ============================================

class AlertRuleEngine {
  private rules: AlertRule[] = MAGYAR_ALERT_SZABALYOK;

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
            rule_type: rule.type,
            vv_date: animal.vv_date,
            vv_result_days: animal.vv_result_days,
            expected_birth_date: animal.expected_birth_date
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
    // VV protokoll alertek pontos dátumokkal
    if (animal.expected_birth_date) {
      const expectedBirth = new Date(animal.expected_birth_date);
      
      switch (rule.type) {
        case 'rcc_vakcina_esedékes':
          return new Date(expectedBirth.getTime() - (42 * 24 * 60 * 60 * 1000)).toISOString();
        case 'bovipast_vakcina_esedékes':
          return new Date(expectedBirth.getTime() - (28 * 24 * 60 * 60 * 1000)).toISOString();
        case 'abrak_elvetel_esedékes':
          return new Date(expectedBirth.getTime() - (14 * 24 * 60 * 60 * 1000)).toISOString();
        case 'elleto_karam_athelyezes':
          return new Date(expectedBirth.getTime() - (7 * 24 * 60 * 60 * 1000)).toISOString();
        case 'elles_kozeledik':
          return expectedBirth.toISOString();
      }
    }
    
    // Alapértelmezett dátumok
    if (rule.type === 'vakcinazas_esedékes' || rule.type === 'elles_kesesben') {
      return new Date(Date.now() + (3 * 24 * 60 * 60 * 1000)).toISOString();
    }
    
    if (rule.type === 'vemhessegvizsgalat') {
      return new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString();
    }
    
    return new Date(Date.now() + (14 * 24 * 60 * 60 * 1000)).toISOString();
  }
}

// ============================================
// ALERT AGGREGATOR - MAGYAR VERZIÓ
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
    const osszes = alerts.length;
    const aktiv = alerts.filter(a => !a.is_resolved && !a.is_snoozed).length;
    const megoldott = alerts.filter(a => a.is_resolved).length;
    const halasztott = alerts.filter(a => a.is_snoozed).length;
    const lejart = alerts.filter(a => 
      a.due_date && 
      new Date(a.due_date) < new Date() && 
      !a.is_resolved
    ).length;

    const priorities = AlertAggregator.groupByPriority(alerts);
    
    return {
      osszes,
      aktiv,
      megoldott,
      halasztott,
      lejart,
      kritikus: priorities.kritikus?.length || 0,
      surgos: priorities.surgos?.length || 0,
      magas: priorities.magas?.length || 0,
      kozepes: priorities.kozepes?.length || 0,
      alacsony: priorities.alacsony?.length || 0
    };
  }
}

// ============================================
// VV EREDMÉNY FELDOLGOZÓ
// ============================================

export const processVVResult = async (vvResult: VVResult): Promise<void> => {
  try {
    console.log('🔬 VV eredmény feldolgozása:', vvResult);
    
    if (vvResult.pregnancy_status === 'vemhes' && vvResult.vv_result_days) {
      // 1. Fogantatás dátum visszaszámítása
      const vvDate = new Date(vvResult.vv_date);
      const conceptionDate = new Date(vvDate.getTime() - (vvResult.vv_result_days * 24 * 60 * 60 * 1000));
      
      // 2. Várható ellés számítása (285 nap)
      const expectedBirth = new Date(conceptionDate.getTime() + (285 * 24 * 60 * 60 * 1000));
      
      // 3. Animal rekord frissítése
      const { error } = await supabase
        .from('animals')
        .update({
          vv_date: vvResult.vv_date,
          vv_result_days: vvResult.vv_result_days,
          pregnancy_status: 'vemhes',
          expected_birth_date: expectedBirth.toISOString(),
          kategoria: 'vemhes_üsző' // vagy 'vemhes_tehén'
        })
        .eq('enar', vvResult.animal_enar);
        
      if (error) throw error;
      
      console.log(`✅ ${vvResult.animal_enar} vemhes - ellés: ${expectedBirth.toLocaleDateString('hu-HU')}`);
      
    } else if (vvResult.pregnancy_status === 'ures') {
      // Üres állat kezelése
      const { error } = await supabase
        .from('animals')
        .update({
          vv_date: vvResult.vv_date,
          pregnancy_status: 'ures',
          kategoria: 'üres_üsző'
        })
        .eq('enar', vvResult.animal_enar);
        
      if (error) throw error;
      
      console.log(`⚠️ ${vvResult.animal_enar} üres - újra VV 2 hónap múlva`);
      
    } else if (vvResult.pregnancy_status === 'csira') {
      // Csíra állat kezelése
      const { error } = await supabase
        .from('animals')
        .update({
          vv_date: vvResult.vv_date,
          pregnancy_status: 'csira',
          kategoria: 'csíra'
        })
        .eq('enar', vvResult.animal_enar);
        
      if (error) throw error;
      
      console.log(`❌ ${vvResult.animal_enar} csíra - selejtezendő`);
    }
    
  } catch (error) {
    console.error('❌ VV eredmény feldolgozási hiba:', error);
    throw error;
  }
};

// ============================================
// REACT HOOK - FRISSÍTETT VERZIÓ
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

      // ✅ BŐVÍTETT ÁLLAT LEKÉRDEZÉS - VV MEZŐKKEL
      const { data: animals, error: animalsError } = await supabase
        .from('animals')
        .select(`
          id, enar, kategoria, ivar, statusz, szuletesi_datum,
          pairing_date, vv_date, vv_result_days, pregnancy_status, expected_birth_date, notes
        `)
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
      
      // ✅ SZŰRÉS - CSAK AKTÍV ALERTEK (nem megoldottak)
      const activeAlerts = alertsWithStatus.filter(alert => !alert.is_resolved);
      
      setAlerts(activeAlerts);
      
    } catch (err) {
      console.error('Alert loading error:', err);
      setError(err instanceof Error ? err.message : 'Ismeretlen hiba történt');
    } finally {
      setLoading(false);
    }
  }, []);

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
      
      return updatedAlerts.filter(alert => !alert.is_resolved); // Aktív alertek megtartása
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