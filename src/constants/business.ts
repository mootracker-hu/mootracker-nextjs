// src/constants/business.ts
/**
 * 🐄 MooTracker - Üzleti Szabályok és Konstansok
 * Minden üzleti logikához kapcsolódó konstans egy helyen
 */

// 🔬 VV (Vemhességvizsgálat) konstansok
export const VV_CONSTANTS = {
  /** VV esedékessége a párzás kezdete után (napokban) */
  DAYS_AFTER_PAIRING: 75,
  
  /** Minimális életkor VV-hez (hónapokban) */
  MIN_AGE_MONTHS: 24,
  
  /** VV eredmény típusok */
  RESULTS: ['vemhes', 'ures', 'csira'] as const
} as const;

// 🍼 Borjú kezelési konstansok
export const CALF_CONSTANTS = {
  /** Borjú protokoll határideje (napokban) - BoviPast + fülszám + szarvtalanítás */
  PROTOCOL_DEADLINE_DAYS: 15,
  
  /** Választási életkor (hónapokban) */
  WEANING_AGE_MONTHS: 6,
  
  /** Temp ID prefix */
  TEMP_ID_PREFIX: 'temp-'
} as const;

// 📅 Életkor kategória határok
export const AGE_CONSTANTS = {
  /** Fiatal állat határ (hónapokban) - színkódoláshoz */
  YOUNG_ANIMAL_MONTHS: 12,
  
  /** Tenyészérettség határ (hónapokban) */
  BREEDING_AGE_MONTHS: 18,
  
  /** VV minimális életkor (hónapokban) */
  VV_MIN_AGE_MONTHS: 24
} as const;

// 🏠 Karám konstansok (VALÓS ADATOK ALAPJÁN)
export const PEN_CONSTANTS = {
  /** Karám típusok (valós használat alapján) */
  PEN_TYPES: {
    OUTDOOR: 'outdoor',   // 17 karám - külső karamok
    BIRTHING: 'birthing'  // 12 karám - ellető istállók
  },
  
  /** Standard hárem kapacitás (25 nőivar + 2 tenyészbika) */
  HAREM_CAPACITY: 27,
  
  /** Hárem tenyészbika konfiguráció (valós metadata alapján) */
  HAREM_BULL_CONFIG: {
    TYPICAL_COUNT: 1,     // 18 esetben 1 bika
    MAX_COUNT: 2,         // 2 esetben 2 bika  
    MIN_COUNT: 0          // 1 esetben 0 bika
  },
  
  /** Standard vemhes kapacitás */
  PREGNANT_CAPACITY: 30,
  
  /** Tehén karám kapacitás (20 tehén + borjak + 2 tenyészbika) */
  COW_CAPACITY: 40,
  
  /** Nagy karamok kapacitása (14, 15) */
  LARGE_PEN_CAPACITY: 50,
  
  /** Konténer karamok kapacitása (12A, 12B) */
  CONTAINER_PEN_CAPACITY: 15,
  
  /** Kórház karám maximális kapacitás */
  HOSPITAL_MAX_CAPACITY: 5,
  
  /** Karantén karám maximális kapacitás */
  QUARANTINE_MAX_CAPACITY: 10
} as const;

// 🎯 Kategória konstansok (VALÓS ADATOK ALAPJÁN)
export const CATEGORY_CONSTANTS = {
  /** Tenyészbika kategória */
  BREEDING_BULL: 'tenyészbika',
  
  /** Borjú kategóriák (64 állat) */
  CALF_CATEGORIES: ['hímivarú_borjú', 'nőivarú_borjú'] as const,
  
  /** Nőivar kategóriák (231 állat) */
  FEMALE_CATEGORIES: ['tehén', 'szűz_üsző', 'vemhes_üsző'] as const,
  
  /** Hímivar kategóriák (32 állat) */
  MALE_CATEGORIES: ['tenyészbika', 'hízóbika'] as const,
  
  /** Összes kategória fontossági sorrendben */
  ALL_CATEGORIES: [
    'szűz_üsző',      // 195 állat - legnagyobb kategória
    'hímivarú_borjú', // 37 állat
    'tehén',          // 31 állat  
    'nőivarú_borjú',  // 27 állat
    'hízóbika',       // 24 állat
    'tenyészbika',    // 8 állat
    'vemhes_üsző'     // 5 állat
  ] as const
} as const;

// 🔄 Funkció váltási konstansok (VALÓS ADATOK ALAPJÁN)
export const FUNCTION_CONSTANTS = {
  /** Automatikus snapshot típusok */
  SNAPSHOT_TYPES: ['function_changed', 'manual_entry', 'scheduled'] as const,
  
  /** Assignment reason típusok (gyakorisági sorrendben) */
  ASSIGNMENT_REASONS: {
    // Automatikus rendszer generált
    PERIOD_SYNC_EDIT: 'Szerkesztett periódus szinkronizáció',
    PERIOD_SYNC_ONGOING: 'Folyamatban lévő periódus szinkronizáció', 
    HAREM_SYNC: 'Hárem metadata szinkronizáció',
    BULL_ADDITION: 'tenyészbika_hozzáadás',
    
    // Manual műveletek
    MANUAL_EDIT: 'manual_edit',
    FUNCTION_CHANGE: 'Funkció váltás',
    PEN_CHANGE: 'Karám váltás', 
    PEN_ASSIGNMENT: 'Karám hozzárendelés',
    
    // Speciális esetek
    BREEDING: 'breeding',
    RESTORATION: 'Visszaállítva esemény törlése miatt',
    CORRECTION: 'Javítás - helyes karám',
    INITIAL: 'initial_assignment',
    TEST: 'teszt'
  },
  
  /** Karám funkciók gyakorisági sorrendben (112 összes használat) */
  FUNCTION_USAGE_ORDER: [
    'hárem',    // 28 használat - leggyakoribb
    'ellető',   // 22 használat
    'üres',     // 15 használat  
    'óvi',      // 14 használat
    'bölcsi',   // 12 használat
    'tehén',    // 6 használat
    'vemhes',   // 5 használat
    'hízóbika', // 5 használat
    'átmeneti', // 3 használat
    'kórház',   // 1 használat - ritka
    'selejt'    // 1 használat - ritka
  ] as const
} as const;

// 📊 Súly konstansok
export const WEIGHT_CONSTANTS = {
  /** Súly megjelenítési küszöb (kg alatt nincs megjelenítés) */
  MIN_DISPLAY_WEIGHT: 10,
  
  /** Maximális reális súly (kg) */
  MAX_REALISTIC_WEIGHT: 1000,
  
  /** Súly mérés gyakoriság (napokban) */
  MEASUREMENT_FREQUENCY_DAYS: 30
} as const;

// 📱 UI konstansok (business logikához kötött)
export const UI_BUSINESS_CONSTANTS = {
  /** Táblázat lapozási méret */
  TABLE_PAGE_SIZE: 50,
  
  /** Keresési minimum karakterek */
  SEARCH_MIN_CHARS: 2,
  
  /** Automatikus mentés időköz (ms) */
  AUTOSAVE_INTERVAL_MS: 30000
} as const;

// 🚨 Riasztási szintek (3 fokozatos rendszer a dokumentum alapján)
export const ALERT_THRESHOLDS = {
  /** VV riasztási szintek (napokban pairing_date után) */
  VV_LEVELS: {
    KEZDETE: 60,   // Első figyelmeztetés
    AJANLOTT: 75,  // Javasolt időpont (ezt használjuk alapértelmezettként)
    SURGOS: 90     // Sürgős határidő
  },
  
  /** Fülszámozási szintek (napokban születés után) */
  EAR_TAG_LEVELS: {
    KEZDETE: 10,
    AJANLOTT: 15,  // Ezt használjuk alapértelmezettként
    SURGOS: 20
  },
  
  /** Választási szintek (hónapokban) */
  WEANING_LEVELS: {
    KEZDETE: 6,
    AJANLOTT: 7,
    SURGOS: 8
  },
  
  /** Kategória átmeneti szintek */
  TRANSITION_LEVELS: {
    /** Bölcsi → Óvi (hónapokban) */
    BOLCSI_TO_OVI: {
      KEZDETE: 11,
      AJANLOTT: 12,
      SURGOS: 14
    },
    /** Óvi → Hárem (hónapokban) */
    OVI_TO_HAREM: {
      KEZDETE: 22,
      AJANLOTT: 24,
      SURGOS: 26
    },
    /** Hízóbika értékesítés (hónapokban) */
    HIZBIKA_SALES: {
      KEZDETE: 18,
      AJANLOTT: 20,
      SURGOS: 24
    }
  }
} as const;

// 🔗 Export típusok a type safety-hez (FRISSÍTETT)
export type VVResult = typeof VV_CONSTANTS.RESULTS[number];
export type CalfCategory = typeof CATEGORY_CONSTANTS.CALF_CATEGORIES[number];
export type FemaleCategory = typeof CATEGORY_CONSTANTS.FEMALE_CATEGORIES[number];
export type MaleCategory = typeof CATEGORY_CONSTANTS.MALE_CATEGORIES[number];
export type AnimalCategory = typeof CATEGORY_CONSTANTS.ALL_CATEGORIES[number];
export type SnapshotType = typeof FUNCTION_CONSTANTS.SNAPSHOT_TYPES[number];
export type PenType = typeof PEN_CONSTANTS.PEN_TYPES[keyof typeof PEN_CONSTANTS.PEN_TYPES];

// ✅ VALÓS ADATOK ALAPJÁN - Születési helyek
export const BIRTH_LOCATIONS = {
  PURCHASED: 'vásárolt',  // 262 állat - többség
  BORN_HERE: 'nálunk',    // 65 állat
  // 'ismeretlen' - nincs használatban
} as const;

// ✅ VALÓS ADATOK ALAPJÁN - Ivar konstansok (JAVÍTOTT)
export const GENDER_CONSTANTS = {
  /** Nőivar jelölések */
  FEMALE: 'nő',          // 257 állat - ez a standard adatbázisban
  
  /** Hímivar jelölések */
  MALE: 'hím',           // 69 állat - ez a standard adatbázisban
  
  /** Frontend display mapping (a form miatt) */
  DISPLAY_MAPPING: {
    'nő': 'nőivar',      // Adatbázis → Frontend megjelenítés
    'hím': 'hímivar'     // Adatbázis → Frontend megjelenítés
  },
  
  /** Reverse mapping (form → adatbázis) */
  FORM_TO_DB_MAPPING: {
    'nőivar': 'nő',      // Form érték → Adatbázis érték
    'hímivar': 'hím'     // Form érték → Adatbázis érték
  }
} as const;

// ✅ VALÓS ADATOK ALAPJÁN - Esemény típusok
export const EVENT_TYPES = {
  FUNCTION_CHANGE: 'function_change',  // 9 esemény
  PEN_ASSIGNMENT: 'pen_assignment',    // 9 esemény  
  PEN_MOVEMENT: 'pen_movement',        // 8 esemény
  HEALTH_EVENT: 'health_event'         // 1 esemény
} as const;

// ✅ VALÓS ADATOK ALAPJÁN - Metadata konstansok
export const METADATA_CONSTANTS = {
  /** Kórház kezelési típusok */
  TREATMENT_TYPES: {
    OBSERVATION: 'megfigyeles'  // Egyetlen használt típus
  },
  
  /** Átmeneti karám okok */
  TRANSITIONAL_REASONS: {
    CLASSIFICATION: 'besorolás_alatt'  // Egyetlen használt ok
  },
  
  /** Selejt okok */
  CULLING_REASONS: {
    REPRODUCTIVE_PROBLEM: 'reprodukcios_problema'  // Egyetlen használt ok
  }
} as const;

// 🚀 Helper függvények (egyszerű számítások)
export const BusinessHelpers = {
  /**
   * VV esedékességének számítása (alapértelmezett AJANLOTT szint)
   * @param pairingDate - Párzás kezdete (YYYY-MM-DD)
   * @param level - Riasztási szint ('KEZDETE' | 'AJANLOTT' | 'SURGOS')
   * @returns VV esedékesség dátuma (YYYY-MM-DD)
   */
  calculateVVDueDate: (pairingDate: string, level: 'KEZDETE' | 'AJANLOTT' | 'SURGOS' = 'AJANLOTT'): string => {
    const pairing = new Date(pairingDate);
    const days = ALERT_THRESHOLDS.VV_LEVELS[level];
    const vvDate = new Date(pairing.getTime() + (days * 24 * 60 * 60 * 1000));
    return vvDate.toISOString().split('T')[0];
  },

  /**
   * Állat életkor számítása hónapokban
   * @param birthDate - Születési dátum (YYYY-MM-DD)
   * @returns Életkor hónapokban
   */
  calculateAgeInMonths: (birthDate: string): number => {
    const birth = new Date(birthDate);
    const today = new Date();
    const ageInMs = today.getTime() - birth.getTime();
    return Math.floor(ageInMs / (1000 * 60 * 60 * 24 * 30.44)); // 30.44 = átlagos hónap napjai
  },

  /**
   * Állat életkor számítása napokban (borjú protokollhoz)
   * @param birthDate - Születési dátum (YYYY-MM-DD)
   * @returns Életkor napokban
   */
  calculateAgeInDays: (birthDate: string): number => {
    const birth = new Date(birthDate);
    const today = new Date();
    return Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
  },

  /**
   * Borjú protokoll státuszának ellenőrzése (3 szintű)
   * @param birthDate - Születési dátum (YYYY-MM-DD)
   * @returns Protokoll státusz objektum
   */
  getCalfProtocolStatus: (birthDate: string): { 
    level: 'KEZDETE' | 'AJANLOTT' | 'SURGOS' | 'OVERDUE';
    overdue: boolean; 
    daysLeft: number;
    message: string;
    color: string;
  } => {
    const ageInDays = BusinessHelpers.calculateAgeInDays(birthDate);
    const thresholds = ALERT_THRESHOLDS.EAR_TAG_LEVELS;
    
    if (ageInDays <= thresholds.KEZDETE) {
      return {
        level: 'KEZDETE',
        overdue: false,
        daysLeft: thresholds.AJANLOTT - ageInDays,
        message: `${thresholds.AJANLOTT - ageInDays} nap múlva: BoviPast + fülszám`,
        color: 'bg-blue-100 text-blue-800 border-blue-200'
      };
    } else if (ageInDays <= thresholds.AJANLOTT) {
      return {
        level: 'AJANLOTT',
        overdue: false,
        daysLeft: thresholds.AJANLOTT - ageInDays,
        message: `${thresholds.AJANLOTT - ageInDays} nap múlva: BoviPast + fülszám`,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      };
    } else if (ageInDays <= thresholds.SURGOS) {
      return {
        level: 'SURGOS',
        overdue: false,
        daysLeft: thresholds.SURGOS - ageInDays,
        message: `SÜRGŐS: ${thresholds.SURGOS - ageInDays} nap a határidőig!`,
        color: 'bg-orange-100 text-orange-800 border-orange-200'
      };
    } else {
      return {
        level: 'OVERDUE',
        overdue: true,
        daysLeft: ageInDays - thresholds.SURGOS,
        message: `${ageInDays - thresholds.SURGOS} napja túllépte: Sürgős protokoll!`,
        color: 'bg-red-100 text-red-800 border-red-200'
      };
    }
  },

  /**
   * Állat VV alkalmasságának ellenőrzése
   * @param birthDate - Születési dátum
   * @param gender - Állat ivara
   * @returns true ha alkalmas VV-re
   */
  isEligibleForVV: (birthDate: string, gender: string): boolean => {
    const ageInMonths = BusinessHelpers.calculateAgeInMonths(birthDate);
    const isFemale = gender === 'nő' || gender === 'nőivar';
    return isFemale && ageInMonths >= VV_CONSTANTS.MIN_AGE_MONTHS;
  },

  /**
   * Kategória átmenet ellenőrzése
   * @param birthDate - Születési dátum
   * @param currentCategory - Jelenlegi kategória
   * @returns Átmenet információk
   */
  getCategoryTransitionStatus: (birthDate: string, currentCategory: string): {
    shouldTransition: boolean;
    recommendedCategory: string | null;
    ageInMonths: number;
    level: 'KEZDETE' | 'AJANLOTT' | 'SURGOS' | null;
  } => {
    const ageInMonths = BusinessHelpers.calculateAgeInMonths(birthDate);
    
    // Bölcsi → Óvi átmenet
    if (currentCategory.includes('borjú') && ageInMonths >= ALERT_THRESHOLDS.TRANSITION_LEVELS.BOLCSI_TO_OVI.KEZDETE) {
      let level: 'KEZDETE' | 'AJANLOTT' | 'SURGOS' = 'KEZDETE';
      if (ageInMonths >= ALERT_THRESHOLDS.TRANSITION_LEVELS.BOLCSI_TO_OVI.SURGOS) level = 'SURGOS';
      else if (ageInMonths >= ALERT_THRESHOLDS.TRANSITION_LEVELS.BOLCSI_TO_OVI.AJANLOTT) level = 'AJANLOTT';
      
      return {
        shouldTransition: true,
        recommendedCategory: currentCategory.includes('nőivar') ? 'szűz_üsző' : 'hízóbika',
        ageInMonths,
        level
      };
    }
    
    // Óvi → Hárem átmenet (csak nőivarok)
    if (currentCategory.includes('üsző') && ageInMonths >= ALERT_THRESHOLDS.TRANSITION_LEVELS.OVI_TO_HAREM.KEZDETE) {
      let level: 'KEZDETE' | 'AJANLOTT' | 'SURGOS' = 'KEZDETE';
      if (ageInMonths >= ALERT_THRESHOLDS.TRANSITION_LEVELS.OVI_TO_HAREM.SURGOS) level = 'SURGOS';
      else if (ageInMonths >= ALERT_THRESHOLDS.TRANSITION_LEVELS.OVI_TO_HAREM.AJANLOTT) level = 'AJANLOTT';
      
      return {
        shouldTransition: true,
        recommendedCategory: 'háremben_lévő_üsző', 
        ageInMonths,
        level
      };
    }
    
    return {
      shouldTransition: false,
      recommendedCategory: null,
      ageInMonths,
      level: null
    };
  }
} as const;