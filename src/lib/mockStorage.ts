// Mock adatbázis localStorage-ban
// src/lib/mockStorage.ts

const STORAGE_KEY = 'mootracker_animals';

// Alapértelmezett mock adatok
const defaultAnimals = [
  { enar: 'HU004001', szuletesi_datum: '2023-04-15', ivar: 'hímivar', kategoria: 'hízóbika', jelenlegi_karam: 'Karám #1', statusz: 'aktív', anya_enar: 'HU001234', apa_enar: 'HU001111' },
  { enar: 'HU002004', szuletesi_datum: '2022-12-10', ivar: 'nőivar', kategoria: 'vemhes_üsző', jelenlegi_karam: 'Hárem #2', statusz: 'aktív', anya_enar: 'HU001235', apa_enar: 'HU001112' },
  { enar: 'HU003021', szuletesi_datum: '2020-03-22', ivar: 'nőivar', kategoria: 'tehén', jelenlegi_karam: 'Karám #4', statusz: 'aktív', anya_enar: 'HU001236', apa_enar: 'HU001113' },
  { enar: 'HU005012', szuletesi_datum: '2023-08-05', ivar: 'nőivar', kategoria: 'növarú_borjú', jelenlegi_karam: 'Bölcsi #1', statusz: 'aktív', anya_enar: 'HU002004', apa_enar: 'HU001114' },
  { enar: 'HU006033', szuletesi_datum: '2022-06-18', ivar: 'nőivar', kategoria: 'szűz_üsző', jelenlegi_karam: 'Óvi #2', statusz: 'aktív', anya_enar: 'HU001237', apa_enar: 'HU001115' },
  { enar: 'HU007044', szuletesi_datum: '2021-01-30', ivar: 'hímivar', kategoria: 'tenyészbika', jelenlegi_karam: 'Hárem #1', statusz: 'aktív', anya_enar: 'HU001238', apa_enar: 'HU001116' },
  { enar: 'HU008055', szuletesi_datum: '2023-05-12', ivar: 'hímivar', kategoria: 'hízóbika', jelenlegi_karam: 'Karám #3', statusz: 'aktív', anya_enar: 'HU001239', apa_enar: 'HU001117' },
  { enar: 'HU009066', szuletesi_datum: '2022-11-25', ivar: 'nőivar', kategoria: 'vemhesülés_alatt', jelenlegi_karam: 'Hárem #3', statusz: 'aktív', anya_enar: 'HU001240', apa_enar: 'HU001118' },
];

export interface Animal {
  enar: string;
  szuletesi_datum: string;
  ivar: 'hímivar' | 'nőivar';
  kategoria: string;
  jelenlegi_karam: string;
  statusz: string;
  anya_enar?: string;
  apa_enar?: string;
  kplsz?: string;
  bekerules_datum?: string;
  szuletesi_suly?: string;
  fotok?: string[];
  utolso_modositas?: string;
  létrehozva?: string;
}

// Mock adatbázis műveletek
export const mockStorage = {
  // Összes állat lekérdezése
  getAllAnimals: (): Animal[] => {
    if (typeof window === 'undefined') return defaultAnimals; // SSR safe
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      } else {
        // Első indításkor alapértelmezett adatok betöltése
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultAnimals));
        return defaultAnimals;
      }
    } catch (error) {
      console.error('Error loading animals from localStorage:', error);
      return defaultAnimals;
    }
  },

  // Egy állat lekérdezése ENAR alapján
  getAnimalByEnar: (enar: string): Animal | null => {
    const animals = mockStorage.getAllAnimals();
    return animals.find(animal => animal.enar === enar) || null;
  },

  // Új állat hozzáadása
  addAnimal: (animal: Animal): boolean => {
    if (typeof window === 'undefined') return false; // SSR safe
    
    try {
      const animals = mockStorage.getAllAnimals();
      
      // Ellenőrizzük, hogy nincs-e már ilyen ENAR
      if (animals.some(a => a.enar === animal.enar)) {
        throw new Error(`Állat ezzel az ENAR-ral már létezik: ${animal.enar}`);
      }
      
      // Hozzáadjuk az új állatot
      const newAnimal = {
        ...animal,
        utolso_modositas: new Date().toISOString(),
        létrehozva: new Date().toISOString(),
        statusz: animal.statusz || 'aktív'
      };
      
      animals.push(newAnimal);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(animals));
      
      console.log('✅ Állat sikeresen hozzáadva localStorage-hoz:', newAnimal);
      return true;
    } catch (error) {
      console.error('❌ Hiba állat hozzáadásakor:', error);
      alert(`❌ Hiba: ${error}`);
      return false;
    }
  },

  // Állat frissítése
  updateAnimal: (enar: string, updates: Partial<Animal>): boolean => {
    if (typeof window === 'undefined') return false; // SSR safe
    
    try {
      const animals = mockStorage.getAllAnimals();
      const index = animals.findIndex(animal => animal.enar === enar);
      
      if (index === -1) {
        throw new Error(`Állat nem található: ${enar}`);
      }
      
      animals[index] = {
        ...animals[index],
        ...updates,
        utolso_modositas: new Date().toISOString()
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(animals));
      console.log('✅ Állat frissítve:', animals[index]);
      return true;
    } catch (error) {
      console.error('❌ Hiba állat frissítésekor:', error);
      return false;
    }
  },

  // Állat törlése
  deleteAnimal: (enar: string): boolean => {
    if (typeof window === 'undefined') return false; // SSR safe
    
    try {
      const animals = mockStorage.getAllAnimals();
      const filteredAnimals = animals.filter(animal => animal.enar !== enar);
      
      if (filteredAnimals.length === animals.length) {
        throw new Error(`Állat nem található: ${enar}`);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredAnimals));
      console.log('✅ Állat törölve:', enar);
      return true;
    } catch (error) {
      console.error('❌ Hiba állat törlésekor:', error);
      return false;
    }
  },

  // Összes adat törlése (reset)
  resetData: (): boolean => {
    if (typeof window === 'undefined') return false; // SSR safe
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultAnimals));
      console.log('✅ Adatok visszaállítva alapértelmezettre');
      return true;
    } catch (error) {
      console.error('❌ Hiba adatok reset-elésekor:', error);
      return false;
    }
  }
};
