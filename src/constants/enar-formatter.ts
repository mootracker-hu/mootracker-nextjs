// 🎨 ENAR DISPLAY FORMÁZÓ - src/constants/enar-formatter.ts
// Minden komponensben használható ENAR megjelenítési formázó

/**
 * ENAR megjelenítési formázó - olvasáshoz optimalizált
 * @param enar - Raw ENAR string (pl. "HU3605000212" vagy "HU 36050 0021 2")
 * @returns Formázott ENAR (pl. "HU 36050 0021 2")
 */
export const displayEnar = (enar: string | null | undefined): string => {
  if (!enar || typeof enar !== 'string') return '';
  
  // Tisztítás: szóközök eltávolítása és nagybetűsítés
  const cleanEnar = enar.replace(/\s+/g, '').toUpperCase();
  
  // ✅ HELYES: Magyar ENAR = HU + 10 számjegy
  if (/^HU\d{10}$/.test(cleanEnar)) {
    // HU3605000212 -> HU 36050 0021 2
    // Részek: HU (2) + gazdaság (5) + állat (4) + ellenőrző (1)
    return `${cleanEnar.substring(0, 2)} ${cleanEnar.substring(2, 7)} ${cleanEnar.substring(7, 11)} ${cleanEnar.substring(11, 12)}`;
  }
  
  // Ha már formázott és helyes, visszaadjuk
  if (/^HU \d{5} \d{4} \d{1}$/.test(enar)) {
    return enar;
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
      const check = rest.substring(9, 10); // ✅ HELYES: 1 számjegy ellenőrző
      return `${country} ${farm} ${animal} ${check}`;
    }
  }
  
  return input.toUpperCase();
};

/**
 * ENAR tisztító - adatbázisba mentéshez
 * @param enar - Formázott vagy formázatlan ENAR
 * @returns Tisztított ENAR (pl. "HU3605000212")
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
  return /^HU\d{10}$/.test(cleaned); // ✅ HELYES: 10 számjegy
};

/**
 * Debug ENAR formázó - fejlesztéshez
 * @param enar - Tesztelendő ENAR
 * @returns Formázott ENAR + debug info
 */
export const displayEnarDebug = (enar: string | null | undefined): string => {
  console.log('🔍 ENAR Debug:', {
    input: enar,
    type: typeof enar,
    length: enar?.length,
    cleaned: enar ? cleanEnarForDb(enar) : null,
    isValid: enar ? isValidEnar(enar) : false,
    regex_test: enar ? /^HU\d{10}$/.test(cleanEnarForDb(enar)) : false
  });
  
  const result = displayEnar(enar);
  console.log('✅ ENAR Formázott:', result);
  return result;
};

// 🧪 TESZT PÉLDÁK
/*
Tesztelendő értékek a konzolban:
displayEnar("HU3605000212") // -> "HU 36050 0021 2" ✅
displayEnar("HU 36050 0021 2") // -> "HU 36050 0021 2" ✅
displayEnar("hu3605000212") // -> "HU 36050 0021 2" ✅ 
displayEnar("HU 36050  0021  2") // -> "HU 36050 0021 2" ✅
displayEnar("3605000212") // -> "3605000212" (nem változik)
displayEnar("") // -> "" (üres)
displayEnar(null) // -> "" (üres)
*/