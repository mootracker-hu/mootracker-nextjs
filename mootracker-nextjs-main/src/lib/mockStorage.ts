// Mock adatbázis localStorage-ban
// src/lib/mockStorage.ts

const STORAGE_KEY = 'mootracker_animals';

// Animal interface
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
  fotok?: string[];
  utolso_modositas: string;
  letrehozva: string;
}

// Alapértelmezett mock adatok explicit típussal
const defaultAnimals: Animal[] = [
  {
    enar: 'HU004001',
    szuletesi_datum: '2023-04-15',
    ivar: 'hímivar',
    kategoria: 'hízóbika',
    jelenlegi_karam: 'Karám #1',
    statusz: 'aktív',
    anya_enar: 'HU002001',
    apa_enar: 'HU001001',
    kplsz: 'K001',
    bekerules_datum: '2023-04-15',
    fotok: [],
    utolso_modositas: '2025-06-14T10:30:00Z',
    letrehozva: '2023-04-15T08:00:00Z'
  },
  {
    enar: 'HU002004',
    szuletesi_datum: '2022-08-22',
    ivar: 'nőivar',
    kategoria: 'tehén',
    jelenlegi_karam: 'Hárem #1',
    statusz: 'aktív',
    anya_enar: 'HU001002',
    apa_enar: 'HU001001',
    bekerules_datum: '2022-08-22',
    fotok: [],
    utolso_modositas: '2025-06-14T09:45:00Z',
    letrehozva: '2022-08-22T07:30:00Z'
  },
  {
    enar: 'HU003021',
    szuletesi_datum: '2023-11-10',
    ivar: 'nőivar',
    kategoria: 'növarú_borjú',
    jelenlegi_karam: 'Bölcsi #1',
    statusz: 'aktív',
    anya_enar: 'HU002004',
    apa_enar: 'HU001001',
    bekerules_datum: '2023-11-10',
    fotok: [],
    utolso_modositas: '2025-06-14T11:15:00Z',
    letrehozva: '2023-11-10T06:45:00Z'
  },
  {
    enar: 'HU005012',
    szuletesi_datum: '2022-05-18',
    ivar: 'nőivar',
    kategoria: 'szűz_üsző',
    jelenlegi_karam: 'Óvi #2',
    statusz: 'aktív',
    anya_enar: 'HU001003',
    apa_enar: 'HU001002',
    bekerules_datum: '2022-05-18',
    fotok: [],
    utolso_modositas: '2025-06-14T08:20:00Z',
    letrehozva: '2022-05-18T09:10:00Z'
  }
];

// Mock Storage API
export const mockStorage = {
  // Összes állat lekérdezése
  getAllAnimals: (): Animal[] => {
    if (typeof window === 'undefined') return defaultAnimals; // SSR safe

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      // Ha nincs adat, alapértelmezetteket mentjük és visszaadjuk
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultAnimals));
      return defaultAnimals;
    } catch (error) {
      console.error('Hiba az állatok betöltésekor:', error);
      return defaultAnimals;
    }
  },

  // Egy állat lekérdezése ENAR alapján
  getAnimalByEnar: (enar: string): Animal | null => {
    const animals = mockStorage.getAllAnimals();
    return animals.find(animal => animal.enar === enar) || null;
  },

  // Új állat hozzáadása
  addAnimal: (animal: Omit<Animal, 'utolso_modositas' | 'letrehozva'>): Animal => {
    const animals = mockStorage.getAllAnimals();
    
    // Ellenőrizzük, hogy már létezik-e
    if (animals.some(a => a.enar === animal.enar)) {
      throw new Error(`Állat ${animal.enar} ENAR-ral már létezik!`);
    }

    const now = new Date().toISOString();
    const newAnimal: Animal = {
      ...animal,
      utolso_modositas: now,
      letrehozva: now
    };
// Mentés localStorage-ba
animals.push(newAnimal);
localStorage.setItem('animals', JSON.stringify(animals));

return newAnimal;
    animals.push(newAnimal);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(animals));
    
    return newAnimal;
  },

  // Állat frissítése
  updateAnimal: (enar: string, updates: Partial<Animal>): Animal | null => {
    const animals = mockStorage.getAllAnimals();
    const index = animals.findIndex(animal => animal.enar === enar);
    
    if (index === -1) return null;

    const updatedAnimal = {
      ...animals[index],
      ...updates,
      utolso_modositas: new Date().toISOString()
    };

    animals[index] = updatedAnimal;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(animals));
    
    return updatedAnimal;
  },

  // Állat törlése
  deleteAnimal: (enar: string): boolean => {
    const animals = mockStorage.getAllAnimals();
    const filteredAnimals = animals.filter(animal => animal.enar !== enar);
    
    if (filteredAnimals.length === animals.length) return false; // Nem találta
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredAnimals));
    return true;
  },

  // Adatok alaphelyzetbe állítása
  resetToDefaults: (): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultAnimals));
  }
};
