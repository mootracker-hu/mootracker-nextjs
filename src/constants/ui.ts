// src/constants/ui.ts
/**
 * 🎨 MooTracker - UI Konstansok és Konfigurációk
 * Felhasználói felület elemek konfigurációja
 */

// 📱 Képernyő méret breakpointok
export const BREAKPOINTS = {
  /** Mobil eszközök max szélessége */
  MOBILE_MAX: 768,
  /** Tablet eszközök min/max szélessége */
  TABLET_MIN: 769,
  TABLET_MAX: 1024,
  /** Desktop eszközök min szélessége */
  DESKTOP_MIN: 1025
} as const;

// 📊 Táblázat konfigurációk
export const TABLE_CONFIG = {
  /** Alapértelmezett sorok száma oldalanként (dokumentum szerint 25-50 állat/karám) */
  DEFAULT_PAGE_SIZE: 25,
  /** Elérhető oldalméret opciók */
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100] as const,
  /** Mobil nézetben megjelenített oszlopok maximális száma */
  MOBILE_MAX_COLUMNS: 4,
  /** Sticky header z-index értéke */
  STICKY_HEADER_Z_INDEX: 10,
  /** Táblázat sorok minimális magassága (px) */
  ROW_MIN_HEIGHT: 48,
  /** Horizontal scroll indikátor szélessége */
  SCROLL_INDICATOR_WIDTH: 4
} as const;

// 🔍 Keresési konfiguráció
export const SEARCH_CONFIG = {
  /** Minimális karakterszám keresés indításához */
  MIN_SEARCH_LENGTH: 2,
  /** Keresési késleltetés (ms) - debounce */
  SEARCH_DEBOUNCE_MS: 300,
  /** Keresési eredmények maximális száma */
  MAX_SEARCH_RESULTS: 100,
  /** Placeholder szövegek */
  PLACEHOLDERS: {
    GENERAL: 'Keresés ENAR, név vagy kategória alapján...',
    ANIMAL: 'Állat keresése ENAR alapján...',
    PEN: 'Karám keresése szám vagy lokáció alapján...',
    BULL: 'Tenyészbika keresése név vagy ENAR alapján...'
  }
} as const;

// 📋 Form konfigurációk
export const FORM_CONFIG = {
  /** Input mezők alapértelmezett magassága */
  INPUT_HEIGHT: '2.5rem',
  /** Textarea alapértelmezett magassága */
  TEXTAREA_HEIGHT: '6rem',
  /** Select dropdown maximális magassága */
  SELECT_MAX_HEIGHT: '12rem',
  /** Form validáció késleltetés (ms) */
  VALIDATION_DEBOUNCE_MS: 500,
  /** Kötelező mező jelölő */
  REQUIRED_INDICATOR: '*',
  /** Sikeres mentés üzenet megjelenítési idő (ms) */
  SUCCESS_MESSAGE_DURATION: 3000
} as const;

// 🎭 Modal konfigurációk
export const MODAL_CONFIG = {
  /** Modal z-index értéke */
  Z_INDEX: 50,
  /** Overlay háttér opacitás */
  OVERLAY_OPACITY: 0.5,
  /** Animáció időtartam (ms) */
  ANIMATION_DURATION: 200,
  /** Maximális modal szélesség */
  MAX_WIDTH: '90vw',
  /** Maximális modal magasság */
  MAX_HEIGHT: '90vh',
  /** Modal padding belül */
  INNER_PADDING: '1.5rem'
} as const;

// 🚨 Értesítés konfigurációk  
export const NOTIFICATION_CONFIG = {
  /** Alapértelmezett megjelenítési idő (ms) */
  DEFAULT_DURATION: 4000,
  /** Típus specifikus időtartamok */
  DURATIONS: {
    success: 3000,
    info: 4000, 
    warning: 5000,
    error: 6000
  },
  /** Maximálisan megjelenített értesítések száma */
  MAX_NOTIFICATIONS: 5,
  /** Pozíció a képernyőn */
  POSITION: 'top-right' as const,
  /** Z-index értéke */
  Z_INDEX: 100
} as const;

// 📊 Dashboard widget konfigurációk
export const WIDGET_CONFIG = {
  /** Widget alapértelmezett magassága */
  DEFAULT_HEIGHT: '12rem',
  /** Grid oszlopok száma különböző képernyőméreteken */
  GRID_COLUMNS: {
    mobile: 1,
    tablet: 2, 
    desktop: 3
  },
  /** Widget közötti távolság */
  GAP: '1rem',
  /** Frissítési intervallum (ms) */
  REFRESH_INTERVAL: 30000
} as const;

// 🎨 Ikonok és emoji-k (MooTracker Professzionális Emoji Rendszer)
export const ICONS = {
  // Karám funkciók (dokumentum szerinti 12 típus + VALÓS HASZNÁLATI GYAKORISÁG)
  FUNCTIONS: {
    // 🔥 GYAKORI FUNKCIÓK (használat: 10+)
    'hárem': '💕',      // 28 használat - leggyakoribb
    'ellető': '🍼',     // 22 használat  
    'üres': '⭕',       // 15 használat
    'óvi': '🐄',        // 14 használat
    'bölcsi': '🐮',     // 12 használat
    
    // 🟡 KÖZEPES FUNKCIÓK (használat: 5-9)  
    'tehén': '🐄🍼',    // 6 használat
    'vemhes': '🐄💕',   // 5 használat
    'hízóbika': '🐂',   // 5 használat
    
    // 🔵 RITKA FUNKCIÓK (használat: 1-4)
    'átmeneti': '🔄',   // 3 használat
    'kórház': '🏥',     // 1 használat - ritka
    'selejt': '📦'      // 1 használat - ritka
    // 'karantén' funkció nincs még használatban, de előkészítve:
    // 'karantén': '🔒'
  },
  
  // Általános akciók
  ACTIONS: {
    add: '➕',
    edit: '✏️',
    delete: '🗑️',
    save: '💾',
    cancel: '❌',
    search: '🔍',
    filter: '🔽',
    sort: '🔀',
    refresh: '🔄',
    export: '📤',
    import: '📥',
    print: '🖨️',
    settings: '⚙️'
  },
  
  // Státusz indikátorok
  STATUS: {
    success: '✅',
    error: '❌', 
    warning: '⚠️',
    info: 'ℹ️',
    loading: '⏳',
    pending: '⏸️'
  },
  
  // Állat kapcsolódó
  ANIMALS: {
    bull: '🐂',
    cow: '🐄',
    calf: '🐮',
    male: '♂️',
    female: '♀️',
    weight: '⚖️',
    age: '📅',
    health: '🏥',
    vv: '🔬',
    birth: '🍼',
    pairing: '💕'
  },
  
  // VV és szaporodási folyamat
  BREEDING: {
    pairing: '💕',
    vv_test: '🔬',
    pregnant: '🤰',
    birth: '🍼',
    calf: '🐮'
  },
  
  // Riasztások és feladatok (3 szintű rendszer)
  ALERTS: {
    KEZDETE: '🔵', // Kék - információs
    AJANLOTT: '🟡', // Sárga - figyelmeztetés  
    SURGOS: '🟠', // Narancs - sürgős
    OVERDUE: '🔴' // Piros - túllépett
  },
  
  // UI elemek
  UI: {
    menu: '☰',
    close: '❌',
    expand: '📖',
    collapse: '📕',
    next: '▶️',
    previous: '◀️',
    up: '🔼',
    down: '🔽',
    dashboard: '📊',
    calendar: '📅',
    history: '📚'
  }
} as const;

// 📏 Méret konstansok
export const SIZES = {
  /** Gomb magasságok */
  BUTTON_HEIGHTS: {
    small: '2rem',
    medium: '2.5rem', 
    large: '3rem'
  },
  
  /** Avatar/profil kép méretek */
  AVATAR_SIZES: {
    small: '2rem',
    medium: '3rem',
    large: '4rem'
  },
  
  /** Border radius értékek */
  BORDER_RADIUS: {
    small: '0.25rem',
    medium: '0.5rem',
    large: '0.75rem', 
    full: '9999px'
  },
  
  /** Árnyék szintek */
  SHADOWS: {
    none: 'shadow-none',
    small: 'shadow-sm',
    medium: 'shadow-md', 
    large: 'shadow-lg',
    extra_large: 'shadow-xl'
  }
} as const;

// ⏱️ Animáció konstansok
export const ANIMATIONS = {
  /** Transition időtartamok */
  DURATIONS: {
    fast: '150ms',
    medium: '200ms',
    slow: '300ms'
  },
  
  /** Easing függvények */
  EASINGS: {
    ease_in: 'ease-in',
    ease_out: 'ease-out', 
    ease_in_out: 'ease-in-out'
  },
  
  /** Hover effektek */
  HOVER_EFFECTS: {
    scale: 'transform hover:scale-105',
    lift: 'transform hover:-translate-y-1', 
    fade: 'transition-opacity hover:opacity-80'
  }
} as const;

// 🎯 Accessibility (a11y) konstansok
export const A11Y_CONFIG = {
  /** Screen reader szövegek */
  SCREEN_READER: {
    loading: 'Tartalom betöltése folyamatban',
    menu_open: 'Menü megnyitása',
    menu_close: 'Menü bezárása', 
    search: 'Keresés indítása',
    sort_ascending: 'Növekvő sorrend',
    sort_descending: 'Csökkenő sorrend'
  },
  
  /** Focus ring stílusok */
  FOCUS_STYLES: {
    default: 'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    danger: 'focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
    success: 'focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
  },
  
  /** Színkontraszt követelmények */
  CONTRAST_RATIOS: {
    normal_text: 4.5,
    large_text: 3.0,
    ui_components: 3.0
  }
} as const;

// 🏠 Karám specifikus UI konstansok (dokumentum alapján)
export const PEN_UI_CONFIG = {
  /** Karám kapacitás színkódolás */
  CAPACITY_COLORS: {
    low: 'text-green-600', // < 50% kapacitás
    medium: 'text-yellow-600', // 50-80% kapacitás
    high: 'text-orange-600', // 80-100% kapacitás
    over: 'text-red-600' // > 100% túlkapacitás
  },
  
  /** Karám típus specifikus oszlopok (mind a 12 funkció) */
  TABLE_COLUMNS: {
    'bölcsi': ['enar', 'birth_date', 'age', 'protocol_status', 'weight', 'notes'],
    'óvi': ['enar', 'kategoria', 'age', 'weight', 'transition_status', 'notes'],
    'hárem': ['enar', 'kategoria', 'pairing_date', 'vv_due', 'weight', 'age'],
    'vemhes': ['enar', 'vv_date', 'expected_birth', 'weight', 'days_pregnant', 'notes'],
    'ellető': ['enar', 'expected_birth', 'birth_status', 'weight', 'preparation', 'notes'],
    'tehén': ['enar', 'last_birth', 'calf_info', 'weight', 'next_breeding', 'notes'],
    'hízóbika': ['enar', 'age', 'weight', 'target_weight', 'sales_plan', 'notes'],
    'üres': ['enar', 'kategoria', 'age', 'weight', 'reason', 'notes'],
    'átmeneti': ['enar', 'kategoria', 'reason', 'decision_deadline', 'target_pen', 'notes'],
    'kórház': ['enar', 'treatment_type', 'start_date', 'expected_recovery', 'veterinarian', 'notes'],
    'karantén': ['enar', 'quarantine_reason', 'start_date', 'expected_end', 'observation', 'notes'],
    'selejt': ['enar', 'culling_reason', 'planned_disposal', 'disposal_date', 'estimated_value', 'notes'],
    'default': ['enar', 'kategoria', 'age', 'weight', 'notes']
  } as Record<string, string[]>,
  
  /** Dashboard widget prioritás */
  WIDGET_PRIORITY: {
    alerts: 1,
    capacity: 2,
    recent_events: 3,
    statistics: 4
  }
} as const;

// 🚀 Helper függvények UI-hoz
export const UIHelpers = {
  /**
   * Képernyőméret típus meghatározása
   * @param width - Képernyő szélessége
   * @returns Eszköz típus
   */
  getDeviceType: (width: number): 'mobile' | 'tablet' | 'desktop' => {
    if (width <= BREAKPOINTS.MOBILE_MAX) return 'mobile';
    if (width <= BREAKPOINTS.TABLET_MAX) return 'tablet';
    return 'desktop';
  },

  /**
   * Táblázat oszlopszám meghatározása eszköz szerint
   * @param deviceType - Eszköz típus
   * @returns Oszlopok száma
   */
  getTableColumns: (deviceType: 'mobile' | 'tablet' | 'desktop'): number => {
    return WIDGET_CONFIG.GRID_COLUMNS[deviceType];
  },

  /**
   * Loading állapot indikátor
   * @param isLoading - Loading állapot
   * @returns Icon vagy üres string
   */
  getLoadingIcon: (isLoading: boolean): string => {
    return isLoading ? ICONS.STATUS.loading : '';
  },

  /**
   * Státusz ikon lekérése
   * @param status - Státusz típus
   * @returns Megfelelő emoji ikon
   */
  getStatusIcon: (status: keyof typeof ICONS.STATUS): string => {
    return ICONS.STATUS[status] || ICONS.STATUS.info;
  },

  /**
   * Karám funkció ikon lekérése
   * @param functionType - Karám funkció típusa
   * @returns Megfelelő emoji ikon
   */
  getFunctionIcon: (functionType: keyof typeof ICONS.FUNCTIONS): string => {
    return ICONS.FUNCTIONS[functionType] || ICONS.FUNCTIONS['üres'];
  },

  /**
   * Riasztási szint ikon lekérése (3 fokozatos rendszer)
   * @param level - Riasztási szint
   * @returns Megfelelő emoji ikon
   */
  getAlertIcon: (level: 'KEZDETE' | 'AJANLOTT' | 'SURGOS' | 'OVERDUE'): string => {
    return ICONS.ALERTS[level] || ICONS.ALERTS.AJANLOTT;
  },

  /**
   * Kapacitás színének meghatározása
   * @param current - Jelenlegi állatlétszám
   * @param capacity - Maximális kapacitás
   * @returns CSS szín osztály
   */
  getCapacityColor: (current: number, capacity: number): string => {
    const percentage = (current / capacity) * 100;
    if (percentage > 100) return PEN_UI_CONFIG.CAPACITY_COLORS.over;
    if (percentage >= 80) return PEN_UI_CONFIG.CAPACITY_COLORS.high;
    if (percentage >= 50) return PEN_UI_CONFIG.CAPACITY_COLORS.medium;
    return PEN_UI_CONFIG.CAPACITY_COLORS.low;
  },

  /**
   * Karám specifikus táblázat oszlopok lekérése
   * @param functionType - Karám funkció típusa
   * @returns Oszlopnevek tömbje
   */
  getPenTableColumns: (functionType: string): string[] => {
    const columns = PEN_UI_CONFIG.TABLE_COLUMNS[functionType as keyof typeof PEN_UI_CONFIG.TABLE_COLUMNS];
    return columns || PEN_UI_CONFIG.TABLE_COLUMNS.default;
  }
} as const;

// 📱 Responsive design konstansok
export const RESPONSIVE = {
  /** Container maximális szélességek */
  CONTAINER_MAX_WIDTHS: {
    sm: '640px',
    md: '768px', 
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  
  /** Grid oszlop konfigurációk */
  GRID_CONFIGS: {
    mobile: 'grid-cols-1',
    tablet: 'grid-cols-2 md:grid-cols-3',
    desktop: 'grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
  },
  
  /** Padding értékek különböző méreteken */
  PADDING: {
    mobile: 'px-4 py-2',
    tablet: 'px-6 py-3', 
    desktop: 'px-8 py-4'
  }
} as const;

// 🚀 Export típusok
export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type PageSizeOption = typeof TABLE_CONFIG.PAGE_SIZE_OPTIONS[number];
export type NotificationPosition = typeof NOTIFICATION_CONFIG.POSITION;
export type IconCategory = keyof typeof ICONS;
export type FunctionType = keyof typeof ICONS.FUNCTIONS;
export type AlertLevel = keyof typeof ICONS.ALERTS;