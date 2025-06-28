// src/app/dashboard/pens/hooks/usePenAlerts.ts
// VALÓS SUPABASE ADATOKKAL - Karám riasztások kezelése

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Riasztás típus definíciója
interface PenAlert {
  id: string;
  penId: string;
  penNumber: string;
  penType: string;
  alertType: 'calf_15days' | 'calf_6months' | 'age_limit' | 'vaccination' | 'cleaning';
  title: string;
  message: string;
  priority: 1 | 2 | 3 | 4; // 1=alacsony, 4=kritikus
  dueDate: string;
  animalCount: number; // hány állatot érint
  affectedAnimals?: string[]; // ENAR számok
}

// Supabase-ből származó állat adatok
interface AnimalData {
  id: number;
  enar: string;
  szuletesi_datum: string;
  ivar: 'male' | 'female' | 'hím' | 'nőstény';
  anya_enar?: string;
  jelenlegi_karam?: string;
}

// Supabase-ből származó karám adatok
interface PenData {
  id: string;
  pen_number: string;
  pen_type: string;
  capacity: number;
  location?: string;
}

export function usePenAlerts() {
  const [alerts, setAlerts] = useState<PenAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Életkor számítás hónapokban
  const calculateAgeInMonths = (birthDate: string): number => {
    const birth = new Date(birthDate);
    const today = new Date();
    const ageInMs = today.getTime() - birth.getTime();
    const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));
    return Math.floor(ageInDays / 30); // Közelítő hónapok
  };

  // Életkor számítás napokban
  const calculateAgeInDays = (birthDate: string): number => {
    const birth = new Date(birthDate);
    const today = new Date();
    const ageInMs = today.getTime() - birth.getTime();
    return Math.floor(ageInMs / (1000 * 60 * 60 * 24));
  };

  // Ivar normalizálása
  const normalizeGender = (gender: string): 'male' | 'female' => {
    const lowerGender = gender.toLowerCase();
    if (lowerGender === 'male' || lowerGender === 'hím') return 'male';
    if (lowerGender === 'female' || lowerGender === 'nőstény') return 'female';
    return 'female'; // default
  };

  // Riasztások generálása egy karámhoz
  const generateAlertsForPen = (pen: PenData, animals: AnimalData[]): PenAlert[] => {
    const penAlerts: PenAlert[] = [];

    // Karám állatok szűrése (akiknek ez a jelenlegi karámuk)
    const penAnimals = animals.filter(animal =>
      animal.jelenlegi_karam === pen.pen_number
    );

    if (penAnimals.length === 0) {
      // Üres karám riasztás
      if (pen.pen_type === 'outdoor' || pen.pen_type === 'barn') {
        penAlerts.push({
          id: `${pen.id}_empty`,
          penId: pen.id,
          penNumber: pen.pen_number,
          penType: pen.pen_type,
          alertType: 'cleaning',
          title: 'Üres karám',
          message: 'Fertőtlenítés státusz: Használatra kész',
          priority: 1,
          dueDate: new Date().toISOString(),
          animalCount: 0
        });
      }
      return penAlerts;
    }

    // BORJÚ RIASZTÁSOK (anyával együtt lévő borjak)
    const calvesWithMother = penAnimals.filter(animal => animal.anya_enar);

    // 15 napos borjak (BoviPast, szarvtalanítás, fülszám)
    const calves15Days = calvesWithMother.filter(animal => {
      const ageInDays = calculateAgeInDays(animal.szuletesi_datum);
      return ageInDays >= 15 && ageInDays <= 30; // 15-30 nap között
    });

    if (calves15Days.length > 0) {
      penAlerts.push({
        id: `${pen.id}_calf_15days`,
        penId: pen.id,
        penNumber: pen.pen_number,
        penType: pen.pen_type,
        alertType: 'calf_15days',
        title: 'Borjú kezelések esedékesek',
        message: `${calves15Days.length} borjú 15 napos - BoviPast, szarvtalanítás, fülszám`,
        priority: 4, // Kritikus
        dueDate: new Date().toISOString(),
        animalCount: calves15Days.length,
        affectedAnimals: calves15Days.map(animal => animal.enar)
      });
    }

    // 6 hónapos borjak (választás)
    const calves6Months = calvesWithMother.filter(animal => {
      const ageInMonths = calculateAgeInMonths(animal.szuletesi_datum);
      return ageInMonths >= 6 && ageInMonths <= 8; // Csak 6-8 hónapos borjakra
    });

    if (calves6Months.length > 0) {
      penAlerts.push({
        id: `${pen.id}_calf_6months`,
        penId: pen.id,
        penNumber: pen.pen_number,
        penType: pen.pen_type,
        alertType: 'calf_6months',
        title: 'Borjú választás szükséges',
        message: `${calves6Months.length} borjú 6 hónapos - választás szükséges`,
        priority: 4, // Kritikus
        dueDate: new Date().toISOString(),
        animalCount: calves6Months.length,
        affectedAnimals: calves6Months.map(animal => animal.enar)
      });
    }

    // ÖNÁLLÓ ÁLLATOK RIASZTÁSAI (választott állatok, anya nélkül)
    const independentAnimals = penAnimals.filter(animal => !animal.anya_enar);

    // 12 hónapos riasztás (bölcsi -> óvi)
    const animals12Months = independentAnimals.filter(animal => {
      const ageInMonths = calculateAgeInMonths(animal.szuletesi_datum);
      return ageInMonths >= 12 && ageInMonths < 24;
    });

    if (animals12Months.length > 0) {
      penAlerts.push({
        id: `${pen.id}_age_12months`,
        penId: pen.id,
        penNumber: pen.pen_number,
        penType: pen.pen_type,
        alertType: 'age_limit',
        title: 'Állatok elérik az óvi kort',
        message: `${animals12Months.length} állat közelíti a választási kort`,
        priority: 3, // Magas
        dueDate: new Date().toISOString(),
        animalCount: animals12Months.length,
        affectedAnimals: animals12Months.map(animal => animal.enar)
      });
    }

    // 24 hónapos riasztás (óvi -> hárem/hízó)
    const animals24Months = independentAnimals.filter(animal => {
      const ageInMonths = calculateAgeInMonths(animal.szuletesi_datum);
      return ageInMonths >= 24;
    });

    if (animals24Months.length > 0) {
      const femaleCount = animals24Months.filter(animal =>
        normalizeGender(animal.ivar) === 'female'
      ).length;
      const maleCount = animals24Months.length - femaleCount;

      if (femaleCount > 0) {
        penAlerts.push({
          id: `${pen.id}_females_24months`,
          penId: pen.id,
          penNumber: pen.pen_number,
          penType: pen.pen_type,
          alertType: 'age_limit',
          title: 'Nőivarok tenyészképesek',
          message: `${femaleCount} nőivar elérte a tenyészképes kort - hárem karám`,
          priority: 3, // Magas
          dueDate: new Date().toISOString(),
          animalCount: femaleCount,
          affectedAnimals: animals24Months
            .filter(animal => normalizeGender(animal.ivar) === 'female')
            .map(animal => animal.enar)
        });
      }

      if (maleCount > 0) {
        penAlerts.push({
          id: `${pen.id}_males_24months`,
          penId: pen.id,
          penNumber: pen.pen_number,
          penType: pen.pen_type,
          alertType: 'age_limit',
          title: 'Hímek eladásra készek',
          message: `${maleCount} hím elérte az eladási kort - 18-24 hónap`,
          priority: 2, // Közepes
          dueDate: new Date().toISOString(),
          animalCount: maleCount,
          affectedAnimals: animals24Months
            .filter(animal => normalizeGender(animal.ivar) === 'male')
            .map(animal => animal.enar)
        });
      }
    }

    return penAlerts;
  };

  // Valós adatok betöltése Supabase-ből
  const loadPenAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Karamok lekérdezése
      const { data: pens, error: pensError } = await supabase
        .from('pens')
        .select('id, pen_number, pen_type, capacity, location');

      if (pensError) {
        throw new Error(`Karamok lekérdezési hiba: ${pensError.message}`);
      }


      // 2. ✅ JAVÍTOTT - Állat-karám hozzárendelések lekérdezése
      const { data: assignments, error: assignmentsError } = await supabase
        .from('animal_pen_assignments')
        .select(`
    pen_id,
    animals!inner(
      id, enar, szuletesi_datum, ivar, anya_enar
    ),
    pens!inner(pen_number)
  `)
        .is('removed_at', null);

      if (assignmentsError) {
        throw new Error(`Állat hozzárendelések hiba: ${assignmentsError.message}`);
      }

      // Átalakítás animals formátumra
      const animals = (assignments || []).map((assignment: any) => ({
        ...assignment.animals,
        jelenlegi_karam: assignment.pens.pen_number
      }));



      // 3. Riasztások generálása minden karámhoz
      const allAlerts: PenAlert[] = [];
      pens?.forEach(pen => {
        const penAlerts = generateAlertsForPen(pen, animals || []);
        allAlerts.push(...penAlerts);
      });

      setAlerts(allAlerts);
      console.log(`Generált riasztások: ${allAlerts.length} db`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ismeretlen hiba';
      setError(errorMessage);
      console.error('Riasztások betöltési hiba:', err);
    } finally {
      setLoading(false);
    }
  };

  // Hook inicializálása
  useEffect(() => {
    loadPenAlerts();
  }, []);

  // Riasztások karám szerint csoportosítása
  const getAlertsForPen = (penId: string): PenAlert[] => {
    return alerts.filter(alert => alert.penId === penId);
  };

  // Prioritás szerint rendezett riasztások
  const getAlertsByPriority = (): PenAlert[] => {
    return [...alerts].sort((a, b) => b.priority - a.priority);
  };

  // Riasztások száma prioritás szerint
  const getAlertCounts = () => {
    return {
      critical: alerts.filter(alert => alert.priority === 4).length,
      high: alerts.filter(alert => alert.priority === 3).length,
      medium: alerts.filter(alert => alert.priority === 2).length,
      low: alerts.filter(alert => alert.priority === 1).length,
      total: alerts.length
    };
  };

  return {
    alerts,
    loading,
    error,
    getAlertsForPen,
    getAlertsByPriority,
    getAlertCounts,
    refreshAlerts: loadPenAlerts
  };
}