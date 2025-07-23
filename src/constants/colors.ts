// src/constants/colors.ts
/**
 * 🎨 MooTracker - Színkódok és Design System
 * Minden szín konstans egy helyen - konzisztens megjelenés
 */

import { AGE_CONSTANTS } from './business';

// 🏠 Karám funkció színek (Tailwind osztályok)
export const PEN_FUNCTION_COLORS = {
  'bölcsi': 'bg-green-100 text-green-800 border-green-200',
  'óvi': 'bg-blue-100 text-blue-800 border-blue-200', 
  'hárem': 'bg-pink-100 text-pink-800 border-pink-200',
  'vemhes': 'bg-purple-100 text-purple-800 border-purple-200',
  'ellető': 'bg-orange-100 text-orange-800 border-orange-200',
  'tehén': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'hízóbika': 'bg-red-100 text-red-800 border-red-200',
  'üres': 'bg-gray-100 text-gray-800 border-gray-200',
  'átmeneti': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'kórház': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'karantén': 'bg-amber-100 text-amber-800 border-amber-200',
  'selejt': 'bg-slate-100 text-slate-800 border-slate-200'
} as const;

// 📊 Státusz színek
export const STATUS_COLORS = {
  // Általános státuszok
  'active': 'bg-green-100 text-green-800 border-green-200',
  'inactive': 'bg-gray-100 text-gray-800 border-gray-200',
  'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'error': 'bg-red-100 text-red-800 border-red-200',
  
  // VV eredmények
  'vemhes': 'bg-green-100 text-green-800 border-green-200',
  'ures': 'bg-red-100 text-red-800 border-red-200', 
  'csira': 'bg-orange-100 text-orange-800 border-orange-200',
  
  // Ellési státuszok
  'born': 'bg-blue-100 text-blue-800 border-blue-200',
  'expected': 'bg-purple-100 text-purple-800 border-purple-200',
  'overdue': 'bg-red-100 text-red-800 border-red-200'
} as const;

// 🎯 Prioritás színek
export const PRIORITY_COLORS = {
  'low': 'bg-blue-100 text-blue-800 border-blue-200',
  'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200', 
  'high': 'bg-orange-100 text-orange-800 border-orange-200',
  'critical': 'bg-red-100 text-red-800 border-red-200'
} as const;

// 📅 Életkor színek
export const AGE_COLORS = {
  // < 12 hónap: fiatal állat
  'young': 'text-blue-600',
  // >= 12 hónap: felnőtt állat  
  'adult': 'text-gray-600',
  // Speciális esetek
  'newborn': 'text-green-600', // < 1 hónap
  'elderly': 'text-orange-600'  // > 8 év
} as const;

// 🐄 Ivar színek
export const GENDER_COLORS = {
  'hím': 'text-blue-600',
  'hímivar': 'text-blue-600',
  'nő': 'text-pink-600', 
  'nőivar': 'text-pink-600',
  'unknown': 'text-gray-500'
} as const;

// 🏥 Kezelési típus színek (VALÓS ADATOK ALAPJÁN)
export const TREATMENT_COLORS = {
  'megfigyeles': 'bg-blue-100 text-blue-800 border-blue-200'  // Egyetlen használt típus
  // Ezen kívül még nincsenek használatban:
  // 'gyogykezeles': 'bg-green-100 text-green-800 border-green-200',
  // 'vakcinazas': 'bg-purple-100 text-purple-800 border-purple-200',
  // 'sebezes': 'bg-red-100 text-red-800 border-red-200'
} as const;

// 🔒 Karantén ok színek (MÉG NINCS HASZNÁLATBAN)
export const QUARANTINE_COLORS = {
  // Jelenleg üres - nincs karantén metadata a rendszerben
  'uj_allat': 'bg-blue-100 text-blue-800 border-blue-200',
  'betegseg_gyanuja': 'bg-orange-100 text-orange-800 border-orange-200',
  'fertozo_betegseg': 'bg-red-100 text-red-800 border-red-200', 
  'megfigyelés': 'bg-yellow-100 text-yellow-800 border-yellow-200'
} as const;

// 📦 Selejt ok színek (VALÓS ADATOK ALAPJÁN)
export const CULLING_COLORS = {
  'reprodukcios_problema': 'bg-orange-100 text-orange-800 border-orange-200'  // Egyetlen használt ok
  // Ezen kívül még nincsenek használatban:
  // 'egeszsegugyi_ok': 'bg-red-100 text-red-800 border-red-200',
  // 'alacsony_termekenyseg': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  // 'gazdasagi_ok': 'bg-blue-100 text-blue-800 border-blue-200'
} as const;

// 🔄 Átmeneti karám ok színek (VALÓS ADATOK ALAPJÁN)  
export const TRANSITIONAL_COLORS = {
  'besorolás_alatt': 'bg-indigo-100 text-indigo-800 border-indigo-200'  // Egyetlen használt ok
  // Ezen kívül még nincsenek használatban:
  // 'funkció_váltás_alatt': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  // 'vizsgálat_alatt': 'bg-blue-100 text-blue-800 border-blue-200'
} as const;

// 🚨 Riasztás színek
export const ALERT_COLORS = {
  // Riasztás típusok
  'vv_due': 'bg-purple-100 text-purple-800 border-purple-200',
  'birth_expected': 'bg-orange-100 text-orange-800 border-orange-200',
  'weight_check': 'bg-blue-100 text-blue-800 border-blue-200',
  'treatment_due': 'bg-green-100 text-green-800 border-green-200',
  'protocol_overdue': 'bg-red-100 text-red-800 border-red-200',
  
  // Sürgősségi szintek (3 fokozatos rendszer)
  'KEZDETE': 'bg-blue-50 text-blue-700 border-blue-200',
  'AJANLOTT': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'SURGOS': 'bg-orange-50 text-orange-700 border-orange-200',
  'OVERDUE': 'bg-red-50 text-red-700 border-red-200',
  
  // Legacy támogatás
  'info': 'bg-blue-50 text-blue-700 border-blue-200',
  'warning': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'urgent': 'bg-orange-50 text-orange-700 border-orange-200',
  'critical': 'bg-red-50 text-red-700 border-red-200'
} as const;

// 🎨 UI elem színek
export const UI_COLORS = {
  // Gombok
  'primary_button': 'bg-green-600 hover:bg-green-700 text-white',
  'secondary_button': 'bg-gray-600 hover:bg-gray-700 text-white',
  'danger_button': 'bg-red-600 hover:bg-red-700 text-white',
  'success_button': 'bg-green-600 hover:bg-green-700 text-white',
  
  // Hátterek
  'modal_overlay': 'bg-black bg-opacity-50',
  'card_background': 'bg-white border border-gray-200',
  'section_background': 'bg-gray-50 border border-gray-200',
  
  // Szövegek
  'primary_text': 'text-gray-900',
  'secondary_text': 'text-gray-600', 
  'muted_text': 'text-gray-400',
  'error_text': 'text-red-600',
  'success_text': 'text-green-600'
} as const;

// 📱 Responsive színek (mobil optimalizálás)
export const RESPONSIVE_COLORS = {
  // Mobil sticky header
  'mobile_header': 'bg-white border-b border-gray-200 shadow-sm',
  // Tablet nézet
  'tablet_sidebar': 'bg-gray-50 border-r border-gray-200',
  // Desktop hover effektek
  'desktop_hover': 'hover:bg-gray-50 transition-colors'
} as const;

// 🔧 Helper függvények színkezeléshez
export const ColorHelpers = {
  /**
   * Karám funkció színének lekérdezése
   * @param functionType - Karám funkció típusa
   * @returns Tailwind CSS osztályok stringje
   */
  getPenFunctionColor: (functionType: keyof typeof PEN_FUNCTION_COLORS): string => {
    return PEN_FUNCTION_COLORS[functionType] || PEN_FUNCTION_COLORS['üres'];
  },

  /**
   * Életkor alapú szín meghatározása  
   * @param ageInMonths - Életkor hónapokban
   * @returns CSS szín osztály
   */
  getAgeColor: (ageInMonths: number): string => {
    if (ageInMonths < 1) return AGE_COLORS.newborn;
    if (ageInMonths < AGE_CONSTANTS.YOUNG_ANIMAL_MONTHS) return AGE_COLORS.young; // < 12 hónap
    if (ageInMonths > 96) return AGE_COLORS.elderly; // > 8 év
    return AGE_COLORS.adult;
  },

  /**
   * VV eredmény színének lekérdezése
   * @param result - VV eredmény
   * @returns Tailwind CSS osztályok
   */
  getVVResultColor: (result: 'vemhes' | 'ures' | 'csira'): string => {
    return STATUS_COLORS[result] || STATUS_COLORS.pending;
  },

  /**
   * Riasztás prioritás színének meghatározása (3 szintű rendszer)
   * @param level - Riasztási szint
   * @returns Prioritás szín osztály
   */
  getAlertLevelColor: (level: 'KEZDETE' | 'AJANLOTT' | 'SURGOS' | 'OVERDUE'): string => {
    return ALERT_COLORS[level] || ALERT_COLORS.info;
  },

  /**
   * Legacy: Riasztás prioritás színének meghatározása napok alapján
   * @param daysUntilDue - Hátralévő napok
   * @returns Prioritás szín osztály
   */
  getAlertPriorityColor: (daysUntilDue: number): string => {
    if (daysUntilDue < 0) return ALERT_COLORS.critical;
    if (daysUntilDue <= 3) return ALERT_COLORS.urgent;
    if (daysUntilDue <= 7) return ALERT_COLORS.warning;
    return ALERT_COLORS.info;
  },

  /**
   * Ivar alapú szín
   * @param gender - Állat ivara
   * @returns CSS szín osztály
   */
  getGenderColor: (gender: string): string => {
    const normalizedGender = gender.toLowerCase() as keyof typeof GENDER_COLORS;
    return GENDER_COLORS[normalizedGender] || GENDER_COLORS.unknown;
  },

  /**
   * Protokoll státusz szín (business.ts-ből átjövő objektumhoz)
   * @param protocolStatus - BusinessHelpers.getCalfProtocolStatus() eredménye
   * @returns A megfelelő szín osztály
   */
  getProtocolStatusColor: (protocolStatus: { level: 'KEZDETE' | 'AJANLOTT' | 'SURGOS' | 'OVERDUE' }): string => {
    return ColorHelpers.getAlertLevelColor(protocolStatus.level);
  }
} as const;

// 🚀 Export típusok
export type PenFunctionColorKey = keyof typeof PEN_FUNCTION_COLORS;
export type StatusColorKey = keyof typeof STATUS_COLORS;
export type PriorityColorKey = keyof typeof PRIORITY_COLORS;
export type AlertColorKey = keyof typeof ALERT_COLORS;
export type AlertLevel = 'KEZDETE' | 'AJANLOTT' | 'SURGOS' | 'OVERDUE';