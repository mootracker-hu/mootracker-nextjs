// src/lib/alerts/AlertRuleEngine.ts

export interface Alert {
  id: string;
  type: 'breeding' | 'health' | 'age' | 'capacity';
  priority: 1 | 2 | 3 | 4; // 1=alacsony, 4=kritikus
  animal_id?: number;
  pen_id?: string;
  enar?: string;
  title: string;
  message: string;
  due_date: Date;
  action_required: string;
  dismissible: boolean;
  auto_resolve: boolean;
  metadata: Record<string, any>;
}

export interface AnimalWithBreeding {
  id: number;
  enar: string;
  szuletesi_datum: string;
  ivar: 'nőivar' | 'hímivar';
  kategoria: string;
  statusz: string;
  current_pen_id?: number;
  current_pen_function?: string;
  breeding_record?: {
    id: number;
    status: string;
    moved_to_harem_date?: string;
    pregnancy_check_due_date?: string;
    pregnancy_check_date?: string;
    pregnancy_result?: string;
    expected_calving_date?: string;
    rcc_vaccination_due?: string;
    bovipast_vaccination_due?: string;
    feed_withdrawal_due?: string;
    move_to_birthing_due?: string;
    vaccination_status: Record<string, boolean>;
  };
}

export class AlertRuleEngine {
  private static calculateAge(birthDate: string): number {
    const birth = new Date(birthDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - birth.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private static isDateDue(dueDate: string | Date, bufferDays: number = 0): boolean {
    const due = new Date(dueDate);
    const today = new Date();
    const buffer = this.addDays(today, bufferDays);
    return due <= buffer;
  }

  // 🐄💕 TENYÉSZTÉSI RIASZTÁSOK
  static generateBreedingAlerts(animals: AnimalWithBreeding[]): Alert[] {
    const alerts: Alert[] = [];

    animals.forEach(animal => {
      const breeding = animal.breeding_record;
      if (!breeding) return;

      const baseAlert = {
        type: 'breeding' as const,
        animal_id: animal.id,
        enar: animal.enar,
        dismissible: true,
        auto_resolve: false,
        metadata: { animal_data: animal }
      };

      // VV esedékes (hárem után 2 hónap)
      if (breeding.status === 'harem' && 
          breeding.pregnancy_check_due_date && 
          !breeding.pregnancy_check_date &&
          this.isDateDue(breeding.pregnancy_check_due_date, 7)) {
        
        alerts.push({
          ...baseAlert,
          id: `vv-due-${animal.id}`,
          priority: 3, // Magas prioritás
          title: 'Vemhességvizsgálat esedékes',
          message: `${animal.enar} - VV esedékes: ${new Date(breeding.pregnancy_check_due_date).toLocaleDateString('hu-HU')}`,
          due_date: new Date(breeding.pregnancy_check_due_date),
          action_required: 'Vemhességvizsgálat elvégzése'
        });
      }

      // VV eredmény: csíra (selejt)
      if (breeding.pregnancy_result === 'csíra') {
        alerts.push({
          ...baseAlert,
          id: `reabsorbed-${animal.id}`,
          priority: 4, // Kritikus
          title: 'Selejt állat - Eladásra jelöl',
          message: `${animal.enar} - VV eredmény: csíra, SELEJT - eladásra jelöl`,
          due_date: new Date(),
          action_required: 'Értékesítési listára helyezés'
        });
      }

      // VV eredmény: nem vemhes
      if (breeding.pregnancy_result === 'nem vemhes') {
        alerts.push({
          ...baseAlert,
          id: `not-pregnant-${animal.id}`,
          priority: 2, // Közepes
          title: 'Sikertelen vemhesítés',
          message: `${animal.enar} - VV eredmény: nem vemhes, hárembe visszahelyezés`,
          due_date: new Date(),
          action_required: 'Hárem karámba mozgatás'
        });
      }

      // Ellési felkészülés riasztások (csak vemhes állatoknál)
      if (breeding.status === 'pregnant') {
        // RCC vakcina
        if (breeding.rcc_vaccination_due && 
            !breeding.vaccination_status?.rcc_done &&
            this.isDateDue(breeding.rcc_vaccination_due, 3)) {
          
          alerts.push({
            ...baseAlert,
            id: `rcc-due-${animal.id}`,
            priority: 3,
            title: 'RCC vakcina esedékes',
            message: `${animal.enar} - RCC vakcina esedékes (ellés előtt 60 nap)`,
            due_date: new Date(breeding.rcc_vaccination_due),
            action_required: 'RCC vakcinázás elvégzése'
          });
        }

        // BoviPast vakcina
        if (breeding.bovipast_vaccination_due && 
            !breeding.vaccination_status?.bovipast_done &&
            this.isDateDue(breeding.bovipast_vaccination_due, 3)) {
          
          alerts.push({
            ...baseAlert,
            id: `bovipast-due-${animal.id}`,
            priority: 3,
            title: 'BoviPast vakcina esedékes',
            message: `${animal.enar} - BoviPast esedékes (ellés előtt 17 nap)`,
            due_date: new Date(breeding.bovipast_vaccination_due),
            action_required: 'BoviPast vakcinázás elvégzése'
          });
        }

        // Abrak elvétel
        if (breeding.feed_withdrawal_due && 
            this.isDateDue(breeding.feed_withdrawal_due)) {
          
          alerts.push({
            ...baseAlert,
            id: `feed-withdrawal-${animal.id}`,
            priority: 2,
            title: 'Abrak elvétel esedékes',
            message: `${animal.enar} - Abrak elvétel (ellés előtt 60 nap)`,
            due_date: new Date(breeding.feed_withdrawal_due),
            action_required: 'Abrak megvonása'
          });
        }

        // Ellető karámba költöztetés
        if (breeding.move_to_birthing_due && 
            this.isDateDue(breeding.move_to_birthing_due, 7)) {
          
          alerts.push({
            ...baseAlert,
            id: `move-birthing-${animal.id}`,
            priority: 3,
            title: 'Ellető karámba költöztetés',
            message: `${animal.enar} - Ellető karámba költöztetés (6 hét az ellés előtt)`,
            due_date: new Date(breeding.move_to_birthing_due),
            action_required: 'Ellető karámba mozgatás'
          });
        }
      }
    });

    return alerts;
  }

  // ⏰ ÉLETKOR RIASZTÁSOK
  static generateAgeAlerts(animals: AnimalWithBreeding[]): Alert[] {
    const alerts: Alert[] = [];

    animals.forEach(animal => {
      const ageInDays = this.calculateAge(animal.szuletesi_datum);
      
      const baseAlert = {
        type: 'age' as const,
        animal_id: animal.id,
        enar: animal.enar,
        dismissible: true,
        auto_resolve: false,
        metadata: { age_in_days: ageInDays, animal_data: animal }
      };

      // 15 napos borjú - egészségügyi kezelések
      if (ageInDays >= 15 && ageInDays <= 30 && animal.kategoria === 'borjú') {
        alerts.push({
          ...baseAlert,
          id: `health-15day-${animal.id}`,
          priority: 3,
          title: '15 napos borjú kezelések',
          message: `${animal.enar} - 15 napos borjú: BoviPast + szarvtalanítás + fülszám`,
          due_date: new Date(),
          action_required: 'Egészségügyi kezelések elvégzése'
        });
      }

      // 6 hónapos borjú - választás
      if (ageInDays >= 180 && ageInDays <= 210 && animal.kategoria === 'borjú') {
        const action = animal.ivar === 'nőivar' 
          ? 'Bölcsi karámba mozgatás' 
          : 'Hízóbika karámba mozgatás';
        
        alerts.push({
          ...baseAlert,
          id: `weaning-6month-${animal.id}`,
          priority: 2,
          title: '6 hónapos választás',
          message: `${animal.enar} - 6 hónapos ${animal.ivar}: Választás, ${action.toLowerCase()}`,
          due_date: new Date(),
          action_required: action
        });
      }

      // 12 hónapos - óvi karámba
      if (ageInDays >= 365 && ageInDays <= 395 && 
          animal.current_pen_function === 'bölcsi') {
        
        alerts.push({
          ...baseAlert,
          id: `nursery-12month-${animal.id}`,
          priority: 2,
          title: '12 hónapos karám váltás',
          message: `${animal.enar} - 12 hónapos: Óvi karámba áthelyezés`,
          due_date: new Date(),
          action_required: 'Óvi karámba mozgatás'
        });
      }

      // 24 hónapos - hárem/értékesítés
      if (ageInDays >= 730 && ageInDays <= 760) {
        if (animal.ivar === 'nőivar') {
          alerts.push({
            ...baseAlert,
            id: `harem-24month-${animal.id}`,
            priority: 2,
            title: '24 hónapos hárem alkalmasság',
            message: `${animal.enar} - 24 hónapos nőivar: Hárem alkalmasság`,
            due_date: new Date(),
            action_required: 'Tenyésztésbe vonás mérlegelése'
          });
        } else {
          alerts.push({
            ...baseAlert,
            id: `sell-24month-${animal.id}`,
            priority: 2,
            title: '24 hónapos értékesítési döntés',
            message: `${animal.enar} - 24 hónapos hímivar: Értékesítési döntés`,
            due_date: new Date(),
            action_required: 'Értékesítési lehetőség mérlegelése'
          });
        }
      }
    });

    return alerts;
  }

  // 🚨 ÖSSZES RIASZTÁS AGGREGÁLÁSA
  static async generateAllAlerts(animals: AnimalWithBreeding[]): Promise<Alert[]> {
    const allAlerts: Alert[] = [
      ...this.generateBreedingAlerts(animals),
      ...this.generateAgeAlerts(animals)
    ];

    // Prioritás szerinti rendezés (4=kritikus először)
    return allAlerts.sort((a, b) => b.priority - a.priority);
  }

  // 📊 RIASZTÁS STATISZTIKÁK
  static getAlertStatistics(alerts: Alert[]) {
    const stats = {
      total: alerts.length,
      by_priority: {
        critical: alerts.filter(a => a.priority === 4).length,
        high: alerts.filter(a => a.priority === 3).length,
        medium: alerts.filter(a => a.priority === 2).length,
        low: alerts.filter(a => a.priority === 1).length
      },
      by_type: {
        breeding: alerts.filter(a => a.type === 'breeding').length,
        age: alerts.filter(a => a.type === 'age').length,
        capacity: alerts.filter(a => a.type === 'capacity').length,
        health: alerts.filter(a => a.type === 'health').length
      },
      urgent: alerts.filter(a => 
        a.priority === 4 || 
        (a.priority === 3 && a.due_date <= new Date())
      ).length
    };

    return stats;
  }
}