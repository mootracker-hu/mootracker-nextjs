// src/lib/alerts/MagyarAlertEngine.ts
// Egységes Magyar Alert Motor - Lecseréli az AlertRuleEngine.ts és useAlerts.ts alert logikáit

export interface Alert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  animal_id?: string;
  pen_id?: string;
  enar?: string;
  title: string;
  message: string;
  description: string;
  due_date: string;
  created_at: string;
  action_required: string;
  suggested_actions: string[];
  dismissible: boolean;
  auto_resolve: boolean;
  can_create_task: boolean;
  can_postpone: boolean;
  is_resolved: boolean;
  is_snoozed: boolean;
  snoozed_until?: string;
  resolved_at?: string;
  related_task_id?: string;
  metadata: Record<string, any>;
  animal?: {
    id: number;
    enar: string;
  };
}

export type AlertType = 
  | 'vakcinazas_esedékes'
  | 'valasztas_ideje'
  | 'karam_valtas_szukseges'
  | 'tenyesztesi_emlekezeto'
  | 'piaci_lehetoseg'
  | 'vemhessegvizsgalat'
  | 'rcc_vakcina_esedékes'
  | 'bovipast_vakcina_esedékes'
  | 'abrak_elvetel_esedékes'
  | 'elleto_karam_athelyezes'
  | 'elles_kozeledik'
  | 'elles_kesesben'
  | 'vemhessegvizsgalat_ismetles'
  | 'selejtezesi_javaslat'
  | 'kapacitas_tullepes'
  | 'kapacitas_alulhasznaltsag';

export type AlertPriority = 'surgos' | 'kritikus' | 'magas' | 'kozepes' | 'alacsony';

export interface Animal {
  id: string;
  enar: string;
  szuletesi_datum: string;
  ivar: 'nő' | 'hím';
  kategoria: string;
  statusz: string;
  kplsz?: string;
  pairing_date?: string;
  vv_date?: string;
  vv_result_days?: number;
  pregnancy_status?: 'vemhes' | 'ures' | 'csira';
  expected_birth_date?: string;
  pen_id?: string;
  anya_enar?: string;
  apa_enar?: string;
  has_given_birth?: boolean;
  last_birth_date?: string;
  notes?: string;
  birth_location?: string;
  breed?: string;
  acquisition_date?: string;
  current_pen_function?: string;
}

export interface PenInfo {
  id: string;
  name: string;
  pen_number: string;
  pen_type: 'outdoor' | 'barn' | 'birthing';
  capacity: number;
  current_count: number;
  location?: string;
}

export interface AlertRule {
  type: AlertType;
  priority: AlertPriority;
  title: string;
  description: string;
  checkCondition: (animal: Animal) => boolean;
  daysFromBirth?: number;
  suggestedActions: string[];
  canCreateTask: boolean;
  canPostpone: boolean;
  appliesTo: string[]; // kategóriák vagy ivarok
  excludes?: string[]; // kizárt kategóriák
}

// ============================================
// HELYES MAGYAR RIASZTÁSI SZABÁLYOK
// ============================================

export const MAGYAR_ALERT_SZABALYOK: AlertRule[] = [
  // 🍼 BORJÚ VAKCINÁZÁS (15 napos)
  {
    type: 'vakcinazas_esedékes',
    priority: 'kritikus',
    title: 'BoviPast vakcinázás esedékes',
    description: '15 napos borjú vakcinázása szükséges - ENAR: {enar}',
    checkCondition: (animal) => {
      const ageInDays = calculateAgeInDays(animal.szuletesi_datum);
      return ageInDays >= 15 && ageInDays <= 30 && 
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
    canPostpone: false,
    appliesTo: ['nőivarú_borjú', 'hímivarú_borjú']
  },

  // 🐄 VÁLASZTÁS (6 hónapos) - IVAR-SPECIFIKUS KARÁM VÁLTÁS
  {
    type: 'valasztas_ideje',
    priority: 'magas',
    title: 'Választási idő - Karám szétválasztás',
    description: '6 hónapos borjú választása és karám szétválasztása - ENAR: {enar}',
    checkCondition: (animal) => {
      const ageInMonths = calculateAgeInMonths(animal.szuletesi_datum);
      return ageInMonths >= 6 && ageInMonths <= 6.5 && 
             animal.kategoria.includes('borjú') && 
             animal.statusz === 'aktív';
    },
    daysFromBirth: 180,
    suggestedActions: [
      'Borjú leválasztása anyjáról',
      'NŐIVAR → Bölcsi karámba áthelyezés',
      'HÍMIVAR → Hízóbika karámba áthelyezés'
    ],
    canCreateTask: true,
    canPostpone: true,
    appliesTo: ['nőivarú_borjú', 'hímivarú_borjú']
  },

  // 🐮 BÖLCSI ELHAGYÁS (12 hónapos) - CSAK NŐIVAR!
  {
    type: 'karam_valtas_szukseges',
    priority: 'kozepes',
    title: 'Óvi karámba áthelyezés',
    description: '12 hónapos nőivar óvi karámba költöztetése - ENAR: {enar}',
    checkCondition: (animal) => {
      const ageInMonths = calculateAgeInMonths(animal.szuletesi_datum);
      return ageInMonths >= 12 && ageInMonths <= 12.5 && 
             animal.ivar === 'nő' &&
             (animal.kategoria.includes('borjú') || animal.current_pen_function === 'bölcsi') &&
             animal.statusz === 'aktív';
    },
    daysFromBirth: 365,
    suggestedActions: [
      'Bölcsi karámból óvi karámba költöztetés',
      'Kategória frissítés: szűz_üsző'
    ],
    canCreateTask: true,
    canPostpone: true,
    appliesTo: ['nőivarú_borjú'],
    excludes: ['hímivarú_borjú']
  },

  // 🐄💕 HÁREM ALKALMASSÁG (24 hónapos NŐIVAR)
  {
    type: 'tenyesztesi_emlekezeto',
    priority: 'magas',
    title: 'Hárem karám alkalmasság',
    description: '24 hónapos nőivar hárem karámba helyezése - ENAR: {enar}',
    checkCondition: (animal) => {
      const ageInMonths = calculateAgeInMonths(animal.szuletesi_datum);
      return ageInMonths >= 24 && ageInMonths <= 25 && 
             animal.ivar === 'nő' && 
             !animal.kategoria.includes('tehén') &&
             animal.statusz === 'aktív';
    },
    daysFromBirth: 730,
    suggestedActions: [
      'Hárem karámba költöztetés',
      'Tenyésztési program felülvizsgálata',
      'Kategória frissítés: háremben_lévő_üsző'
    ],
    canCreateTask: true,
    canPostpone: true,
    appliesTo: ['szűz_üsző'],
    excludes: ['tehén', 'hímivarú_borjú', 'hízóbika']
  },

  // 🐂 HÍZÓBIKA ÉRTÉKESÍTÉS (18-24 hónapos) - TENYÉSZBIKA KIVÉTELLEL!
  {
    type: 'piaci_lehetoseg',
    priority: 'kozepes',
    title: 'Értékesítési lehetőség',
    description: '18-24 hónapos hízóbika értékesítésre kész - ENAR: {enar}',
    checkCondition: (animal) => {
      const ageInMonths = calculateAgeInMonths(animal.szuletesi_datum);
      return ageInMonths >= 18 && ageInMonths <= 24 && 
             animal.ivar === 'hím' && 
             animal.kategoria === 'hízóbika' && // EXPLICIT hízóbika
             !animal.kplsz && // NINCS KPLSZ = nem tenyészbika
             animal.statusz === 'aktív';
    },
    daysFromBirth: 550, // 18 hónap
    suggestedActions: [
      'Piaci ár ellenőrzése',
      'Vásár időpontok felderítése',
      'Selejt karámba áthelyezés mérlegelése'
    ],
    canCreateTask: true,
    canPostpone: true,
    appliesTo: ['hízóbika'],
    excludes: ['tenyészbika'] // TENYÉSZBIKA KIVÉTEL!
  },

  // 🔬 VV ESEDÉKESSÉG (75 nap hárem után)
  {
    type: 'vemhessegvizsgalat',
    priority: 'magas',
    title: 'Vemhességvizsgálat esedékes',
    description: 'Háremben 75 napja lévő állat VV vizsgálata - ENAR: {enar}',
    checkCondition: (animal) => {
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
    canPostpone: false,
    appliesTo: ['háremben_lévő_üsző', 'tehén']
  },

  // 💉 RCC VAKCINA (2 hónap ellés előtt)
  {
    type: 'rcc_vakcina_esedékes',
    priority: 'kritikus',
    title: 'RCC vakcina esedékes',
    description: 'RCC vakcina beadása ellés előtt 2 hónappal - ENAR: {enar}',
    checkCondition: (animal) => {
      if (!animal.expected_birth_date || animal.pregnancy_status !== 'vemhes') return false;
      
      const expectedBirth = new Date(animal.expected_birth_date);
      const rccDueDate = new Date(expectedBirth.getTime() - (60 * 24 * 60 * 60 * 1000)); // 2 hónap előtte
      const today = new Date();
      
      return today >= rccDueDate && today <= new Date(rccDueDate.getTime() + (7 * 24 * 60 * 60 * 1000));
    },
    suggestedActions: [
      'RCC (Rotavirus-Coronavirus-E.coli) vakcina beadása',
      'Állatorvosi konzultáció',
      'Vakcinázás dátumának rögzítése'
    ],
    canCreateTask: true,
    canPostpone: false,
    appliesTo: ['vemhes_üsző', 'vemhes_tehén']
  },

  // 💉 BOVIPAST VAKCINA (4 hét ellés előtt)
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
    canPostpone: false,
    appliesTo: ['vemhes_üsző', 'vemhes_tehén']
  },

  // 🥗 ABRAK ELVÉTEL (2 HÓNAP ellés előtt) - JAVÍTOTT!
  {
    type: 'abrak_elvetel_esedékes',
    priority: 'magas',
    title: 'Abrak elvétel szükséges',
    description: 'Vemhes állat abrakjának megvonása ellés előtt 2 hónappal - ENAR: {enar}',
    checkCondition: (animal) => {
      if (!animal.expected_birth_date || animal.pregnancy_status !== 'vemhes') return false;
      
      const expectedBirth = new Date(animal.expected_birth_date);
      const feedStopDate = new Date(expectedBirth.getTime() - (60 * 24 * 60 * 60 * 1000)); // 2 HÓNAP előtte!
      const today = new Date();
      
      return today >= feedStopDate && today <= new Date(feedStopDate.getTime() + (3 * 24 * 60 * 60 * 1000));
    },
    suggestedActions: [
      'Abrak teljesen megvonása',
      'Csak szalma etetése',
      'Vízellátás biztosítása'
    ],
    canCreateTask: true,
    canPostpone: false,
    appliesTo: ['vemhes_üsző', 'vemhes_tehén']
  },

  // 🏠 ELLETŐ KARÁM ÁTHELYEZÉS (1 hét ellés előtt)
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
    canPostpone: false,
    appliesTo: ['vemhes_üsző', 'vemhes_tehén']
  },

  // 🍼 ELLÉS KÖZELEDIK (0-3 nap)
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
    canPostpone: false,
    appliesTo: ['vemhes_üsző', 'vemhes_tehén']
  },

  // 🚨 TÚLHORDÁS (7+ nap késés)
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
    canPostpone: false,
    appliesTo: ['vemhes_üsző', 'vemhes_tehén']
  },

  // 🔄 VV ISMÉTLÉS (üres állatok 2 hónap után)
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
    canPostpone: true,
    appliesTo: ['üres_üsző', 'üres_tehén']
  },

  // ❌ SELEJTEZÉS (csíra állatok)
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
    canPostpone: false,
    appliesTo: ['csíra']
  }
];

// ============================================
// KARÁM-SPECIFIKUS ALERT SZABÁLYOK
// ============================================

export const KARAM_ALERT_SZABALYOK = [
  {
    type: 'kapacitas_tullepes',
    priority: 'kritikus',
    title: 'Karám túlzsúfolt',
    description: 'Kapacitás túllépve - {current}/{capacity} állat',
    checkCondition: (pen: PenInfo) => {
      return pen.current_count > pen.capacity;
    },
    suggestedActions: [
      'Állatok áthelyezése másik karámba',
      'Kapacitás ellenőrzése',
      'Állomány újraszervezése'
    ]
  },
  {
    type: 'kapacitas_alulhasznaltsag',
    priority: 'alacsony',
    title: 'Karám alulhasznált',
    description: 'Kapacitás kihasználatlan - {current}/{capacity} állat',
    checkCondition: (pen: PenInfo) => {
      return pen.current_count < pen.capacity * 0.3 && pen.current_count > 0;
    },
    suggestedActions: [
      'További állatok áthelyezése',
      'Karám funkció felülvizsgálata',
      'Optimalizációs lehetőségek'
    ]
  }
];

// ============================================
// SEGÉDFÜGGVÉNYEK
// ============================================

function calculateAgeInDays(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - birth.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function calculateAgeInMonths(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  
  let months = (today.getFullYear() - birth.getFullYear()) * 12;
  months -= birth.getMonth();
  months += today.getMonth();
  
  return months;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ============================================
// MAGYAR ALERT ENGINE - FŐOSZTÁLY
// ============================================

export class MagyarAlertEngine {
  private rules: AlertRule[] = MAGYAR_ALERT_SZABALYOK;

  /**
   * Riasztások generálása egy állatra
   */
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
          message: `${rule.title} - ${animal.enar}`,
          animal_id: animal.id,
          enar: animal.enar,
          animal: {
  id: parseInt(animal.id) || 0,  // ← konverzió string→number
  enar: animal.enar
},
          created_at: new Date().toISOString(),
          due_date: this.calculateDueDate(rule, animal),
          action_required: rule.suggestedActions.join(', '),
          suggested_actions: rule.suggestedActions,
          dismissible: true,
          auto_resolve: false,
          can_create_task: rule.canCreateTask,
          can_postpone: rule.canPostpone,
          is_resolved: false,
          is_snoozed: false,
          metadata: {
            animal_age_days: rule.daysFromBirth ? 
              calculateAgeInDays(animal.szuletesi_datum) : undefined,
            animal_age_months: calculateAgeInMonths(animal.szuletesi_datum),
            rule_type: rule.type,
            applies_to: rule.appliesTo,
            excludes: rule.excludes,
            vv_date: animal.vv_date,
            vv_result_days: animal.vv_result_days,
            expected_birth_date: animal.expected_birth_date,
            pregnancy_status: animal.pregnancy_status,
            pairing_date: animal.pairing_date
          }
        };

        alerts.push(alert);
      }
    }

    return alerts;
  }

  /**
   * Riasztások generálása állatok listájára
   */
  generateAlertsForAnimals(animals: Animal[]): Alert[] {
    const allAlerts: Alert[] = [];
    
    for (const animal of animals) {
      const animalAlerts = this.generateAlertsForAnimal(animal);
      allAlerts.push(...animalAlerts);
    }

    // Prioritás szerinti rendezés (surgos -> kritikus -> magas -> kozepes -> alacsony)
    const priorityOrder: AlertPriority[] = ['surgos', 'kritikus', 'magas', 'kozepes', 'alacsony'];
    
    return allAlerts.sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a.priority);
      const bIndex = priorityOrder.indexOf(b.priority);
      return aIndex - bIndex;
    });
  }

  /**
   * Kombinált alertek generálása (állatok + karamok)
   */
  generateAllAlerts(animals: Animal[], pens: PenInfo[]): Alert[] {
    const alerts: Alert[] = [];
    
    // Állat alertek
    const animalAlerts = this.generateAlertsForAnimals(animals);
    alerts.push(...animalAlerts);
    
    // Karám alertek
    for (const pen of pens) {
      for (const rule of KARAM_ALERT_SZABALYOK) {
        if (rule.checkCondition(pen)) {
          const alert: Alert = {
            id: `pen-alert-${pen.id}-${rule.type}-${Date.now()}`,
            type: rule.type as AlertType,
            priority: rule.priority as AlertPriority,
            pen_id: pen.id,
            title: rule.title,
            description: rule.description
              .replace('{current}', pen.current_count.toString())
              .replace('{capacity}', pen.capacity.toString()),
            message: `${rule.title} - Karám ${pen.pen_number}`,
            created_at: new Date().toISOString(),
            due_date: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString(),
            action_required: rule.suggestedActions.join(', '),
            suggested_actions: rule.suggestedActions,
            dismissible: true,
            auto_resolve: false,
            can_create_task: true,
            can_postpone: true,
            is_resolved: false,
            is_snoozed: false,
            metadata: {
              pen_number: pen.pen_number,
              capacity: pen.capacity,
              animal_count: pen.current_count
            }
          };
          
          alerts.push(alert);
        }
      }
    }
    
    return alerts.sort((a, b) => {
      const priorityOrder: AlertPriority[] = ['surgos', 'kritikus', 'magas', 'kozepes', 'alacsony'];
      const aIndex = priorityOrder.indexOf(a.priority);
      const bIndex = priorityOrder.indexOf(b.priority);
      return aIndex - bIndex;
    });
  }

  /**
   * Esedékesség dátum számítása
   */
  private calculateDueDate(rule: AlertRule, animal: Animal): string {
    // VV protokoll alertek pontos dátumokkal
    if (animal.expected_birth_date) {
      const expectedBirth = new Date(animal.expected_birth_date);
      
      switch (rule.type) {
        case 'rcc_vakcina_esedékes':
          return new Date(expectedBirth.getTime() - (60 * 24 * 60 * 60 * 1000)).toISOString(); // 2 hónap
        case 'bovipast_vakcina_esedékes':
          return new Date(expectedBirth.getTime() - (28 * 24 * 60 * 60 * 1000)).toISOString(); // 4 hét
        case 'abrak_elvetel_esedékes':
          return new Date(expectedBirth.getTime() - (60 * 24 * 60 * 60 * 1000)).toISOString(); // 2 hónap
        case 'elleto_karam_athelyezes':
          return new Date(expectedBirth.getTime() - (7 * 24 * 60 * 60 * 1000)).toISOString(); // 1 hét
        case 'elles_kozeledik':
          return expectedBirth.toISOString();
      }
    }
    
    // VV esedékesség (75 nap párzás után)
    if (rule.type === 'vemhessegvizsgalat' && animal.pairing_date) {
      const pairingDate = new Date(animal.pairing_date);
      return addDays(pairingDate, 75).toISOString();
    }
    
    // Sürgős riasztások
    if (rule.type === 'vakcinazas_esedékes' || rule.type === 'elles_kesesben') {
      return new Date(Date.now() + (3 * 24 * 60 * 60 * 1000)).toISOString();
    }
    
    // Alapértelmezett esedékesség
    return new Date(Date.now() + (14 * 24 * 60 * 60 * 1000)).toISOString();
  }

  /**
   * Alert statisztikák számítása
   */
  static getAlertStatistics(alerts: Alert[]) {
    const stats = {
      osszes: alerts.length,
      aktiv: alerts.filter(a => !a.is_resolved && !a.is_snoozed).length,
      megoldott: alerts.filter(a => a.is_resolved).length,
      halasztott: alerts.filter(a => a.is_snoozed).length,
      lejart: alerts.filter(a => 
        a.due_date && 
        new Date(a.due_date) < new Date() && 
        !a.is_resolved
      ).length,
      surgos: alerts.filter(a => a.priority === 'surgos').length,
      kritikus: alerts.filter(a => a.priority === 'kritikus').length,
      magas: alerts.filter(a => a.priority === 'magas').length,
      kozepes: alerts.filter(a => a.priority === 'kozepes').length,
      alacsony: alerts.filter(a => a.priority === 'alacsony').length
    };

    return stats;
  }

  /**
   * Alertek csoportosítása prioritás szerint
   */
  static groupByPriority(alerts: Alert[]): Record<AlertPriority, Alert[]> {
    return alerts.reduce((groups, alert) => {
      if (!groups[alert.priority]) {
        groups[alert.priority] = [];
      }
      groups[alert.priority].push(alert);
      return groups;
    }, {} as Record<AlertPriority, Alert[]>);
  }

  /**
   * Alertek csoportosítása típus szerint
   */
  static groupByType(alerts: Alert[]): Record<AlertType, Alert[]> {
    return alerts.reduce((groups, alert) => {
      if (!groups[alert.type]) {
        groups[alert.type] = [];
      }
      groups[alert.type].push(alert);
      return groups;
    }, {} as Record<AlertType, Alert[]>);
  }

  /**
   * Alertek csoportosítása állat szerint
   */
  static groupByAnimal(alerts: Alert[]): Record<string, Alert[]> {
    return alerts.reduce((groups, alert) => {
      const key = alert.animal?.enar || alert.enar || 'unknown';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(alert);
      return groups;
    }, {} as Record<string, Alert[]>);
  }

  /**
   * Alertek csoportosítása karám szerint
   */
  static groupByPen(alerts: Alert[]): Record<string, Alert[]> {
    return alerts.reduce((groups, alert) => {
      if (alert.pen_id) {
        const key = alert.pen_id;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(alert);
      }
      return groups;
    }, {} as Record<string, Alert[]>);
  }

  /**
   * Specifikus alert típusok szűrése
   */
  static getPenSpecificAlerts(alerts: Alert[]): Alert[] {
    return alerts.filter(alert => alert.pen_id && !alert.animal_id);
  }

  static getAnimalSpecificAlerts(alerts: Alert[]): Alert[] {
    return alerts.filter(alert => alert.animal_id);
  }

  static getCapacityAlerts(alerts: Alert[]): Alert[] {
    return alerts.filter(alert => 
      alert.type === 'kapacitas_tullepes' || 
      alert.type === 'kapacitas_alulhasznaltsag'
    );
  }
}

// Export default instance
export const magyarAlertEngine = new MagyarAlertEngine();