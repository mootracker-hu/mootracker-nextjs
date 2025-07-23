// 🎨 ENAR DISPLAY FORMÁZÓ - src/utils/enar-formatter.ts
// Minden komponensben használható ENAR megjelenítési formázó

/**
 * ENAR megjelenítési formázó - olvasáshoz optimalizált
 * @param enar - Raw ENAR string (pl. "HU3603300092" vagy "HU 36033 0009 2")
 * @returns Formázott ENAR (pl. "HU 36033 0009 2")
 */
export const displayEnar = (enar: string | null | undefined): string => {
  if (!enar || typeof enar !== 'string') return '';
  
  // Ha már formázott (tartalmaz szóközt), visszaadjuk ahogy van
  if (enar.includes(' ')) return enar;
  
  // Ha összeragasztott HU + 10 számjegy formátum
  if (/^HU\d{10}$/.test(enar)) {
    return `${enar.substring(0, 2)} ${enar.substring(2, 7)} ${enar.substring(7, 11)} ${enar.substring(11, 12)}`;
  }
  
  // Egyéb esetben visszaadjuk ahogy van
  return enar;
};

/**
 * ENAR input formázó - bevitelhez optimalizált (gépelés közben)
 * @param input - User által gépelt string
 * @returns Fokozatosan formázott ENAR
 */
export const formatEnarInput = (input: string): string => {
  const cleanInput = input.replace(/\s+/g, '').toUpperCase();
  
  if (cleanInput.length >= 2 && cleanInput.startsWith('HU')) {
    const country = cleanInput.substring(0, 2);
    const rest = cleanInput.substring(2);
    
    if (rest.length === 0) return country;
    if (rest.length <= 5) return `${country} ${rest}`;
    if (rest.length <= 9) {
      const farm = rest.substring(0, 5);
      const animal = rest.substring(5);
      return `${country} ${farm} ${animal}`;
    }
    if (rest.length >= 10) {
      const farm = rest.substring(0, 5);
      const animal = rest.substring(5, 9);
      const check = rest.substring(9, 10);
      return `${country} ${farm} ${animal} ${check}`;
    }
  }
  
  return input.toUpperCase();
};

/**
 * ENAR tisztító - adatbázisba mentéshez
 * @param enar - Formázott vagy formázatlan ENAR
 * @returns Tisztított ENAR (pl. "HU3603300092")
 */
export const cleanEnarForDb = (enar: string): string => {
  return enar.replace(/\s+/g, '').toUpperCase();
};

/**
 * ENAR validátor
 * @param enar - Ellenőrizendő ENAR
 * @returns true ha valid HU + 10 számjegy formátum
 */
export const isValidEnar = (enar: string): boolean => {
  const cleaned = cleanEnarForDb(enar);
  return /^HU\d{10}$/.test(cleaned);
};