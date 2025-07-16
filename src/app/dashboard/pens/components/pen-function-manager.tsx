// src/app/dashboard/pens/components/pen-function-manager.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';  // ← ADD HOZZÁ EZT!
import { PenFunctionType, PEN_FUNCTION_LABELS, NOTES_TEMPLATES, KorhazMetadata, AtmenetiMetadata, KarantenMetadata, SelejtMetadata } from '@/types/alert-task-types';

// 🔹 HÁREM SZINKRONIZÁCIÓ - INLINE MEGOLDÁS
// Töröld ki az import sort és illeszd be ezt:

// 🔹 INTERFACES
interface Bull {
  id: string;
  name: string;
  enar: string;
  kplsz?: string;
  active: boolean;
  source?: 'metadata' | 'physical' | 'both';
}

interface SyncResult {
  success: boolean;
  message: string;
  data?: any;
}

// 🔹 KÖZPONTI SZINKRONIZÁCIÓ FUNKCIÓ
const syncHaremData = async (penId: string): Promise<SyncResult> => {
  try {
    console.log('🔄 Hárem szinkronizáció kezdése:', penId);

    // 1. Karám aktuális funkciójának lekérdezése
    const { data: penFunction, error: functionError } = await supabase
      .from('pen_functions')
      .select('*')
      .eq('pen_id', penId)
      .is('end_date', null)
      .order('start_date', { ascending: false })
      .limit(1);

    if (functionError) {
      console.error('❌ Karám funkció lekérdezési hiba:', functionError);
      return { success: false, message: 'Karám funkció lekérdezési hiba' };
    }

    const currentFunction = penFunction?.[0];
    
    if (!currentFunction || currentFunction.function_type !== 'hárem') {
      console.log('ℹ️ Karám nem hárem funkciójú, szinkronizáció kihagyva');
      return { success: true, message: 'Karám nem hárem funkciójú' };
    }

    // 2. Hárem metadata-ból tenyészbikák
    const metadataBulls = currentFunction.metadata?.bulls || [];
    console.log('📊 Metadata tenyészbikák:', metadataBulls);

    // 3. Fizikailag karámban lévő tenyészbikák
    const physicalBulls = await getPhysicalBulls(penId);
    console.log('🐂 Fizikai tenyészbikák:', physicalBulls);

    // 4. METADATA → FIZIKAI szinkronizáció
    for (const metadataBull of metadataBulls) {
      const isPhysicallyPresent = physicalBulls.some((pb: Bull) => pb.enar === metadataBull.enar);
      
      if (!isPhysicallyPresent) {
        console.log('🔄 Metadata bika nincs fizikailag jelen:', metadataBull.name);
        
        // Tenyészbika ID megkeresése az animals táblában
        const animalId = await findAnimalIdByEnar(metadataBull.enar);
        
        if (animalId) {
          await moveAnimalToKaram(animalId, penId, 'Hárem metadata szinkronizáció');
          console.log('✅ Metadata bika áthelyezve fizikailag:', metadataBull.name);
        } else {
          console.warn('⚠️ Metadata bika nem található az animals táblában:', metadataBull.enar);
        }
      }
    }

    // 5. FIZIKAI → METADATA szinkronizáció
    for (const physicalBull of physicalBulls) {
      const isInMetadata = metadataBulls.some((mb: Bull) => mb.enar === physicalBull.enar);
      
      if (!isInMetadata) {
        console.log('🔄 Fizikai bika nincs metadata-ban:', physicalBull.enar);
        
        // Tenyészbika hozzáadása a metadata-hoz
        await addBullToHaremMetadata(penId, physicalBull);
        console.log('✅ Fizikai bika hozzáadva metadata-hoz:', physicalBull.enar);
      }
    }

    return { 
      success: true, 
      message: 'Hárem szinkronizáció sikeres',
      data: { metadataBulls, physicalBulls }
    };

  } catch (error) {
    console.error('❌ Hárem szinkronizációs hiba:', error);
    return { 
      success: false, 
      message: (error as Error).message || 'Ismeretlen hiba' 
    };
  }
};

// 🔹 FIZIKAI TENYÉSZBIKÁK LEKÉRDEZÉSE
const getPhysicalBulls = async (penId: string): Promise<Bull[]> => {
  try {
    const { data: assignments, error } = await supabase
      .from('animal_pen_assignments')
      .select(`
        animal_id,
        animals!inner(
          id,
          enar,
          kategoria
        )
      `)
      .eq('pen_id', penId)
      .is('removed_at', null);

    if (error) {
      console.error('❌ Fizikai tenyészbikák lekérdezési hiba:', error);
      return [];
    }

    // Csak tenyészbikák szűrése
    const bulls = assignments
      ?.filter((assignment: any) => assignment.animals?.kategoria === 'tenyészbika')
      .map((assignment: any) => ({
        id: assignment.animals.id.toString(),
        name: assignment.animals.enar.split(' ').pop() || 'Névtelen',
        enar: assignment.animals.enar,
        active: true
      })) || [];

    return bulls;
  } catch (error) {
    console.error('❌ Fizikai tenyészbikák lekérdezési exception:', error);
    return [];
  }
};

// 🔹 ÁLLAT ID KERESÉSE ENAR ALAPJÁN
const findAnimalIdByEnar = async (enar: string): Promise<number | null> => {
  try {
    const { data: animal, error } = await supabase
      .from('animals')
      .select('id')
      .eq('enar', enar)
      .single();

    if (error || !animal) {
      console.error('❌ Állat nem található ENAR alapján:', enar, error);
      return null;
    }

    return animal.id;
  } catch (error) {
    console.error('❌ Állat ID keresési exception:', error);
    return null;
  }
};

// 🔹 ÁLLAT FIZIKAI ÁTHELYEZÉSE KARÁMBA
const moveAnimalToKaram = async (
  animalId: number, 
  penId: string, 
  reason: string = 'Hárem szinkronizáció'
): Promise<SyncResult> => {
  try {
    console.log('🔄 Állat áthelyezése:', animalId, '→', penId);

    // 1. Régi hozzárendelések lezárása
    const { error: removeError } = await supabase
      .from('animal_pen_assignments')
      .update({ removed_at: new Date().toISOString() })
      .eq('animal_id', animalId)
      .is('removed_at', null);

    if (removeError) {
      console.error('❌ Régi hozzárendelések lezárási hiba:', removeError);
    }

    // 2. Új hozzárendelés létrehozása
    const { error: assignError } = await supabase
      .from('animal_pen_assignments')
      .insert({
        animal_id: animalId,
        pen_id: penId,
        assigned_at: new Date().toISOString(),
        assignment_reason: reason
      });

    if (assignError) {
      console.error('❌ Új hozzárendelés létrehozási hiba:', assignError);
      return { success: false, message: 'Fizikai áthelyezés sikertelen' };
    }

    // 3. Animals tábla frissítése
    const { data: penData } = await supabase
      .from('pens')
      .select('pen_number')
      .eq('id', penId)
      .single();

    if (penData) {
      await supabase
        .from('animals')
        .update({ jelenlegi_karam: penData.pen_number })
        .eq('id', animalId);
    }

    // 4. Esemény rögzítése
    await supabase
      .from('animal_events')
      .insert({
        animal_id: animalId,
        event_type: 'pen_movement',
        event_date: new Date().toISOString().split('T')[0],
        event_time: new Date().toISOString().split('T')[1].substring(0, 8),
        pen_id: penId,
        reason: reason,
        notes: 'Automatikus hárem szinkronizáció',
        is_historical: false
      });

    console.log('✅ Állat sikeresen áthelyezve:', animalId, '→', penId);
    return { success: true, message: 'Állat sikeresen áthelyezve' };

  } catch (error) {
    console.error('❌ Állat áthelyezési exception:', error);
    return { success: false, message: (error as Error).message };
  }
};

// 🔹 TENYÉSZBIKA HOZZÁADÁSA HÁREM METADATA-HOZ
const addBullToHaremMetadata = async (
  penId: string, 
  bull: Bull
): Promise<SyncResult> => {
  try {
    console.log('🔄 Tenyészbika hozzáadása metadata-hoz:', bull.name);

    // 1. Aktuális karám funkció lekérdezése
    const { data: penFunction, error: functionError } = await supabase
      .from('pen_functions')
      .select('*')
      .eq('pen_id', penId)
      .is('end_date', null)
      .order('start_date', { ascending: false })
      .limit(1);

    if (functionError || !penFunction?.[0]) {
      console.error('❌ Karám funkció lekérdezési hiba:', functionError);
      return { success: false, message: 'Karám funkció nem található' };
    }

    const currentFunction = penFunction[0];
    
    // 2. Metadata frissítése
    const currentMetadata = currentFunction.metadata || {};
    const currentBulls = currentMetadata.bulls || [];
    
    // Ellenőrzés: már benne van-e?
    const bullExists = currentBulls.some((b: Bull) => b.enar === bull.enar);
    
    if (!bullExists) {
      const updatedBulls = [...currentBulls, bull];
      
      const { error: updateError } = await supabase
        .from('pen_functions')
        .update({
          metadata: {
            ...currentMetadata,
            bulls: updatedBulls
          }
        })
        .eq('id', currentFunction.id);

      if (updateError) {
        console.error('❌ Metadata frissítési hiba:', updateError);
        return { success: false, message: 'Metadata frissítés sikertelen' };
      }

      console.log('✅ Tenyészbika hozzáadva metadata-hoz:', bull.name);
    } else {
      console.log('ℹ️ Tenyészbika már benne van a metadata-ban:', bull.name);
    }

    return { success: true, message: 'Metadata frissítve' };

  } catch (error) {
    console.error('❌ Metadata frissítési exception:', error);
    return { success: false, message: (error as Error).message };
  }
};

interface Pen {
  id: string;
  pen_number: string;
  pen_type: 'outdoor' | 'barn' | 'birthing';
  capacity: number;
  location?: string;
  current_function?: PenFunction;
  animal_count: number;
}

interface PenFunction {
  id: string;
  function_type: PenFunctionType;
  start_date: string;
  metadata: any;
  notes?: string;
}

interface PenFunctionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  pen: Pen;
  onFunctionChange: any;       // Egyszerűsített
  editMode?: boolean;          // ÚJ - edit mód flag
  editPeriod?: any;           // ÚJ - szerkesztendő periódus adatai
  onPeriodUpdate?: any;       // ÚJ - update callback
}

export default function PenFunctionManager({
  isOpen,
  onClose,
  pen,
  onFunctionChange,
  editMode = false,           // ÚJ
  editPeriod = null,          // ÚJ  
  onPeriodUpdate              // ÚJ         // ÚJ
}: PenFunctionManagerProps) {
  const [newFunction, setNewFunction] = useState<PenFunctionType>(pen.current_function?.function_type || 'üres');
  const [notes, setNotes] = useState(pen.current_function?.notes || '');
  const [customNotes, setCustomNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Hárem specifikus mezők
  const [selectedBulls, setSelectedBulls] = useState<Array<{ id: string, name: string, enar: string, kplsz: string }>>([]);
  const [showBullSelector, setShowBullSelector] = useState(false);
  const [parozasKezdete, setParozasKezdete] = useState(pen.current_function?.metadata?.parozas_kezdete || '');
  const [vvEsedekessege, setVvEsedekessege] = useState(pen.current_function?.metadata?.vv_esedekssege || '');

  // Bulls adatbázis
  const [availableBulls, setAvailableBulls] = useState<Array<{ id: string, name: string, enar: string, kplsz: string }>>([]);

  // Kórház specifikus mezők
  const [treatmentType, setTreatmentType] = useState<KorhazMetadata['treatment_type']>('megfigyeles');
  const [veterinarian, setVeterinarian] = useState('');
  const [expectedRecovery, setExpectedRecovery] = useState('');
  const [returnPenId, setReturnPenId] = useState('');

  // Átmeneti specifikus mezők
  const [atmenetiReason, setAtmenetiReason] = useState<AtmenetiMetadata['reason']>('besorolás_alatt');
  const [decisionDeadline, setDecisionDeadline] = useState('');
  const [decisionCriteria, setDecisionCriteria] = useState('');

  // Karantén specifikus mezők
  const [quarantineReason, setQuarantineReason] = useState<KarantenMetadata['quarantine_reason']>('uj_allat');
  const [expectedEndDate, setExpectedEndDate] = useState('');
  const [releaseCriteria, setReleaseCriteria] = useState('');

  // Selejt specifikus mezők
  const [selejtReason, setSelejtReason] = useState<SelejtMetadata['reason']>('reprodukcios_problema');
  const [plannedDisposal, setPlannedDisposal] = useState<SelejtMetadata['planned_disposal']>('ertekesites');
  const [disposalDeadline, setDisposalDeadline] = useState('');

  // ÚJ: Történeti periódus state-ek
  const [isHistoricalEntry, setIsHistoricalEntry] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  // ÚJ: Nőivarok történeti rögzítése
  const [historicalFemales, setHistoricalFemales] = useState<string>('');
  const [useCurrentFemales, setUseCurrentFemales] = useState(true);
  const [currentAnimals, setCurrentAnimals] = useState<any[]>([]);

  useEffect(() => {
    fetchBulls();
  }, []);

  // ÚJ: Jelenlegi állatok betöltése
  useEffect(() => {
    if (isOpen && pen?.id) {
      fetchCurrentAnimals();
    }
  }, [isOpen, pen?.id]);

  const fetchCurrentAnimals = async () => {
    try {
      const animals = await getCurrentAnimalsInPen(pen.id);
      setCurrentAnimals(animals);
      console.log('🐄 Jelenlegi állatok betöltve:', animals.length);
    } catch (error) {
      console.error('❌ Állatok betöltési hiba:', error);
      setCurrentAnimals([]);
    }
  };

  // ✅ Hárem metadata inicializálása
  useEffect(() => {
    if (pen.current_function?.metadata?.bulls && Array.isArray(pen.current_function.metadata.bulls)) {
      setSelectedBulls(pen.current_function.metadata.bulls);
    }
  }, [pen.current_function]);

  // ÚJ: Edit mód inicializálása
useEffect(() => {
  if (editMode && editPeriod) {
    console.log('🔧 Edit mód inicializálása:', editPeriod);
    
    // Funkció típus beállítása
    setNewFunction(editPeriod.function_type);
    
    // Dátumok beállítása
    setStartDate(editPeriod.start_date.split('T')[0]);
    setEndDate(editPeriod.end_date ? editPeriod.end_date.split('T')[0] : '');
    setIsHistoricalEntry(!!editPeriod.end_date);
    
    // Hárem specifikus adatok
    if (editPeriod.function_type === 'hárem' && editPeriod.metadata) {
      if (editPeriod.metadata.bulls) {
        setSelectedBulls(editPeriod.metadata.bulls);
      }
      if (editPeriod.metadata.parozas_kezdete) {
        setParozasKezdete(editPeriod.metadata.parozas_kezdete);
      }
      if (editPeriod.metadata.vv_esedekssege) {
        setVvEsedekessege(editPeriod.metadata.vv_esedekssege);
      }
      if (editPeriod.metadata.females) {
        const femaleENARs = editPeriod.metadata.females.map((f: any) => f.enar).join(', ');
        setHistoricalFemales(femaleENARs);
      }
    }
    
    // Megjegyzések
    if (editPeriod.notes) {
      setNotes(editPeriod.notes);
    }
  }
}, [editMode, editPeriod]);

  const fetchBulls = async () => {
    console.log('🚀 fetchBulls started');
    try {
      console.log('📡 Querying bulls table...');
      const { data, error } = await supabase
        .from('bulls')
        .select('id, name, enar, kplsz')
        .eq('active', true)
        .order('name');

      console.log('📊 Query result:', { data, error });
      if (error) throw error;
      console.log('🐂 Fetched bulls:', data);
      setAvailableBulls(data || []); // ← EZ ITT JÓ!
    } catch (error) {
      console.error('Error fetching bulls:', error);
    }
  };

  const getCurrentAnimalsInPen = async (penId: string): Promise<Array<{
    enar: string;
    kategoria: string;
    ivar: string;
    szuletesi_datum: string;
    birth_location?: string;
  }>> => {
    try {
      console.log('📸 Snapshot készítés: jelenlegi állatok lekérdezése...', penId);

      // 1. Valódi állatok (animal_pen_assignments)
      const { data: assignments, error: assignError } = await supabase
        .from('animal_pen_assignments')
        .select(`
        animals!inner(
          enar,
          kategoria,
          ivar,
          szuletesi_datum,
          birth_location
        )
      `)
        .eq('pen_id', penId)
        .is('removed_at', null);

      if (assignError) {
        console.error('❌ Állatok lekérdezése hiba:', assignError);
        return [];
      }

      // 2. Temp ID borjak (calves tábla)
      const { data: calves, error: calvesError } = await supabase
        .from('calves')
        .select('temp_id, gender, birth_date, created_at')
        .eq('current_pen_id', penId)
        .eq('is_alive', true)
        .is('enar', null);

      if (calvesError) {
        console.warn('⚠️ Borjak lekérdezése hiba:', calvesError);
      }

      // 3. Adatok egyesítése
      const animals = assignments?.map((a: any) => a.animals) || [];
      const calvesAsAnimals = calves?.map(calf => ({
        enar: calf.temp_id || `temp-${Date.now()}`,
        kategoria: calf.gender === 'hímivar' ? 'hímivarú_borjú' : 'nőivarú_borjú',
        ivar: calf.gender === 'hímivar' ? 'hím' : 'nő',
        szuletesi_datum: calf.birth_date || calf.created_at,
        birth_location: 'nálunk' as const
      })) || [];

      const allAnimals = [...animals, ...calvesAsAnimals];

      console.log(`📸 Snapshot: ${allAnimals.length} állat találva (${animals.length} állat + ${calvesAsAnimals.length} borjú)`);
      return allAnimals;

    } catch (error) {
      console.error('💥 getCurrentAnimalsInPen hiba:', error);
      return [];
    }
  };

  const createHaremSnapshot = async (penId: string, selectedBulls: any[], parozasKezdete: string, vvEsedekssege: string) => {
    try {
      console.log('📸 Hárem snapshot készítése...', { penId, bullCount: selectedBulls.length, isHistorical: isHistoricalEntry });

      let females = [];

      if (isHistoricalEntry && historicalFemales.trim()) {
        // Történeti mód: manual ENAR lista használata
        console.log('📚 Történeti mód: manual nőivarok használata');

        const manualFemales = historicalFemales
          .split(',')
          .map(enar => enar.trim())
          .filter(enar => enar.length > 0)
          .map(enar => ({
            enar: enar,
            kategoria: 'historical_entry',
            birth_date: null,
            birth_location: 'historical'
          }));

        females = manualFemales;
        console.log('📝 Manual nőivarok:', females.length);

      } else {
        // Normál mód: jelenlegi állatok lekérdezése
        console.log('🔄 Normál mód: jelenlegi állatok lekérdezése');

        const currentAnimals = await getCurrentAnimalsInPen(penId);

        females = currentAnimals
          .filter(animal => animal.ivar === 'nő' || animal.ivar === 'nőivar')
          .map(animal => ({
            enar: animal.enar,
            kategoria: animal.kategoria,
            birth_date: animal.szuletesi_datum,
            birth_location: animal.birth_location || 'ismeretlen'
          }));
      }

      // Snapshot metadata összeállítása
      const snapshot = {
        // Tenyészbikák
        bulls: selectedBulls,
        bull_count: selectedBulls.length,

        // Nőivarok
        females: females,
        female_count: females.length,

        // Hárem adatok
        parozas_kezdete: parozasKezdete,
        vv_esedekssege: vvEsedekssege,

        // Snapshot metaadatok
        snapshot_created_at: new Date().toISOString(),
        total_animals: females.length + selectedBulls.length,
        pen_id: penId,
        historical: isHistoricalEntry || false
      };

      console.log('✅ Hárem snapshot kész:', {
        bulls: snapshot.bull_count,
        females: snapshot.female_count,
        total: snapshot.total_animals,
        historical: snapshot.historical
      });

      return snapshot;

    } catch (error) {
      console.error('💥 createHaremSnapshot hiba:', error);
      return {
        bulls: selectedBulls,
        bull_count: selectedBulls.length,
        parozas_kezdete: parozasKezdete,
        vv_esedekssege: vvEsedekssege,
        snapshot_created_at: new Date().toISOString(),
        snapshot_error: 'Pillanatkép készítése sikertelen'
      };
    }
  };

  // ✅ Bull kezelő funkciók
  const addBullToHarem = (bull: { id: string, name: string, enar: string, kplsz: string }) => {
    if (!selectedBulls.find(b => b.id === bull.id)) {
      setSelectedBulls([...selectedBulls, bull]);
    }
    setShowBullSelector(false);
  };

  const removeBullFromHarem = (bullId: string) => {
    setSelectedBulls(selectedBulls.filter(b => b.id !== bullId));
  };

  const addCustomBull = () => {
    const customBull = {
      id: 'custom-' + Date.now(),
      name: prompt('Tenyészbika neve:') || '',
      enar: prompt('ENAR szám:') || '',
      kplsz: prompt('KPLSZ szám:') || ''
    };

    if (customBull.name && customBull.enar) {
      addBullToHarem(customBull);
    }
  };

  // ✅ BŐVÍTETT FUNKCIÓ TÍPUSOK - EMOJI IKONOKKAL
  const functionTypes = [
    { value: 'bölcsi' as PenFunctionType, label: '🐮 Bölcsi', description: '0-12 hónapos borjak nevelése', color: 'bg-green-100 text-green-800 border-green-200' },
    { value: 'óvi' as PenFunctionType, label: '🐄 Óvi', description: '12-24 hónapos üszők nevelése', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'hárem' as PenFunctionType, label: '💕 Hárem', description: 'Tenyésztésben lévő üszők/tehenek', color: 'bg-pink-100 text-pink-800 border-pink-200' },
    { value: 'vemhes' as PenFunctionType, label: '🤰 Vemhes', description: 'Vemhes állatok ellésre várva', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { value: 'hízóbika' as PenFunctionType, label: '🐂 Hízóbika', description: 'Hústermelés céljából tartott bikák', color: 'bg-red-100 text-red-800 border-red-200' },
    { value: 'ellető' as PenFunctionType, label: '🍼 Ellető', description: 'Ellés körül lévő tehenek', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    { value: 'tehén' as PenFunctionType, label: '🐄🍼 Tehén', description: 'Borjával együtt tartott tehenek', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { value: 'üres' as PenFunctionType, label: '⭕ Üres', description: 'Jelenleg nincs használatban', color: 'bg-gray-100 text-gray-800 border-gray-200' },

    // ✅ ÚJ KARÁM TÍPUSOK
    { value: 'átmeneti' as PenFunctionType, label: '🔄 Átmeneti', description: 'Ideiglenes elhelyezés, döntés alatt', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    { value: 'kórház' as PenFunctionType, label: '🏥 Kórház', description: 'Kezelés alatt lévő állatok', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    { value: 'karantén' as PenFunctionType, label: '🔒 Karantén', description: 'Elkülönített állatok', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    { value: 'selejt' as PenFunctionType, label: '📦 Selejt', description: 'Értékesítésre/vágásra váró állatok', color: 'bg-slate-100 text-slate-800 border-slate-200' }
  ];

  // Ellető karamokra csak ellető és üres funkció
  const getAvailableFunctions = () => {
    if (pen.pen_type === 'birthing') {
      return functionTypes.filter(func => ['ellető', 'üres', 'kórház'].includes(func.value));
    }
    // Ellető csak ellető karamokban, de kórház bárhol lehet
    return functionTypes.filter(func => func.value !== 'ellető');
  };

  // ✅ RUGALMAS KAPACITÁS SZÁMÍTÁS
  const calculateNewCapacity = (functionType: PenFunctionType): number => {
    // Ellető istálló kapacitások
    if (pen.pen_number.startsWith('E')) {
      if (['E1', 'E2', 'E7', 'E8'].includes(pen.pen_number)) return 25;
      return 2; // EB boxok: 1 mama + 1 borjú = 2 kapacitás
    }

    // Külső karamok funkció-alapú kapacitása
    const isLargePen = ['14', '15'].includes(pen.pen_number);
    const isContainerPen = ['12A', '12B'].includes(pen.pen_number);

    if (isLargePen) return 50;
    if (isContainerPen) return 15;

    // Standard karamok funkció szerint
    switch (functionType) {
      case 'hárem': return 27; // 25 nőivar + 2 tenyészbika
      case 'vemhes': return 30;
      case 'tehén': return 40; // 20 tehén + borjak + 2 tenyészbika
      case 'bölcsi': return 25;
      case 'óvi': return 25;
      case 'hízóbika': return 20;

      // ✅ ÚJ TÍPUSOK - RUGALMAS KAPACITÁS
      case 'kórház': return Math.min(5, pen.capacity); // Max 5, de alkalmazkodik
      case 'átmeneti': return pen.capacity; // Rugalmas, eredeti kapacitás
      case 'karantén': return Math.min(10, pen.capacity); // Max 10 elkülönítésre
      case 'selejt': return pen.capacity; // Rugalmas

      default: return 25;
    }
  };

  // Kapacitás figyelmeztetés
  const getCapacityWarning = (): string | null => {
    if (!newFunction) return null;

    const newCapacity = calculateNewCapacity(newFunction);
    const currentAnimals = pen.animal_count;

    // Speciális üzenetek az új típusokhoz
    if (newFunction === 'kórház' && currentAnimals > 5) {
      return 'Kórház karám: Maximum 5 állat ajánlott intenzív megfigyeléshez.';
    }

    if (newFunction === 'átmeneti') {
      return 'Átmeneti karám: Rugalmas kapacitás, időben korlátozott használat.';
    }

    if (currentAnimals > newCapacity) {
      return `Figyelem: ${currentAnimals - newCapacity} állattal túllépi az új kapacitást! Állatok áthelyezése szükséges.`;
    }
    if (currentAnimals === newCapacity) {
      return 'A karám tele lesz az új funkcióval.';
    }
    return null;
  };

  // ✅ METADATA ÖSSZEÁLLÍTÁSA
  const buildMetadata = (): any => {
    const baseMetadata: any = {};

    switch (newFunction) {
      case 'hárem':
        // ✅ ÚJ STRUKTÚRA - több bika támogatás
        if (selectedBulls.length > 0) {
          baseMetadata.bulls = selectedBulls;
          baseMetadata.bull_count = selectedBulls.length;
        }
        if (parozasKezdete) baseMetadata.parozas_kezdete = parozasKezdete;
        if (vvEsedekessege) baseMetadata.vv_esedekssege = vvEsedekessege;

        // LEGACY SUPPORT - ha nincs új struktúra, használj egyiket
        if (selectedBulls.length === 1) {
          baseMetadata.tenyeszbika_name = selectedBulls[0].name;
          baseMetadata.tenyeszbika_enar = selectedBulls[0].enar;
        }
        break;

      case 'kórház':
        const korhazMeta: KorhazMetadata = {
          treatment_type: treatmentType,
          treatment_start_date: new Date().toISOString(),
          expected_recovery_date: expectedRecovery || undefined,
          veterinarian: veterinarian || undefined,
          return_pen_id: returnPenId || undefined,
          treatment_notes: customNotes || undefined
        };
        Object.assign(baseMetadata, korhazMeta);
        break;

      case 'átmeneti':
        const atmenetiMeta: AtmenetiMetadata = {
          reason: atmenetiReason,
          temporary_since: new Date().toISOString(),
          decision_deadline: decisionDeadline || undefined,
          decision_criteria: decisionCriteria || undefined,
          notes: customNotes || undefined
        };
        Object.assign(baseMetadata, atmenetiMeta);
        break;

      case 'karantén':
        const karantenMeta: KarantenMetadata = {
          quarantine_reason: quarantineReason,
          quarantine_start_date: new Date().toISOString(),
          expected_end_date: expectedEndDate || undefined,
          release_criteria: releaseCriteria || undefined,
          notes: customNotes || undefined
        };
        Object.assign(baseMetadata, karantenMeta);
        break;

      case 'selejt':
        const selejtMeta: SelejtMetadata = {
          reason: selejtReason,
          planned_disposal: plannedDisposal,
          disposal_deadline: disposalDeadline || undefined,
          notes: customNotes || undefined
        };
        Object.assign(baseMetadata, selejtMeta);
        break;
    }

    return baseMetadata;
  };

  // Funkció változtatás - TÖRTÉNETI TÁMOGATÁSSAL
const handleFunctionChange = async () => {
  if (!newFunction) return;

  // Validáció
  if (isHistoricalEntry && !endDate) {
    alert('⚠️ Történeti periódushoz záró dátum szükséges!');
    return;
  }

  setLoading(true);
  try {
    console.log('🔄 Funkció váltás kezdése...', {
      newFunction,
      penId: pen.id,
      isHistoricalEntry,
      startDate,
      endDate
    });

    let finalMetadata = buildMetadata();

    // ✅ HÁREM SPECIFIKUS SNAPSHOT KÉSZÍTÉS
    if (newFunction === 'hárem' && (selectedBulls.length > 0 || parozasKezdete)) {
      console.log('📸 Hárem snapshot készítése...');

      const haremSnapshot = await createHaremSnapshot(
        pen.id,
        selectedBulls,
        parozasKezdete,
        vvEsedekessege
      );

      finalMetadata = {
        ...finalMetadata,
        ...haremSnapshot
      };

      console.log('✅ Hárem snapshot hozzáadva a metadata-hoz');
    }

    const finalNotes = notes + (customNotes ? `\n\n${customNotes}` : '');

    // ✅ ÚJ LOGIKA: Dátumok kezelése
    const insertData = {
      pen_id: pen.id,
      function_type: newFunction,
      start_date: startDate + 'T00:00:00.000Z',
      end_date: isHistoricalEntry
        ? (endDate + 'T23:59:59.999Z')
        : (endDate ? (endDate + 'T23:59:59.999Z') : null),
      metadata: finalMetadata,
      notes: finalNotes
    };

    console.log('📋 Beszúrandó adat:', insertData);

    // ✅ RÉGI FUNKCIÓ LEZÁRÁSA - csak ha NEM történeti
    if (!isHistoricalEntry) {
      console.log('🔒 Régi aktív funkció lezárása...');

      const { error: closeError } = await supabase
        .from('pen_functions')
        .update({ end_date: new Date().toISOString() })
        .eq('pen_id', pen.id)
        .is('end_date', null);

      if (closeError) {
        console.error('❌ Régi funkció lezárási hiba:', closeError);
        throw closeError;
      }

      console.log('✅ Régi funkció lezárva');
    } else {
      console.log('📚 Történeti mód - régi funkció nem érintett');
    }

    // ✅ EDIT MÓD vs ÚJ FUNKCIÓ LOGIKA
if (editMode && editPeriod) {
  // EDIT MÓD: Meglévő periódus frissítése
  console.log('🔧 Edit mód: periódus frissítése...', editPeriod.id);
  
  const { data: updatedPenFunction, error: updateError } = await supabase
    .from('pen_functions')
    .update({
      function_type: newFunction,
      start_date: insertData.start_date,
      end_date: insertData.end_date,
      metadata: insertData.metadata,
      notes: insertData.notes
    })
    .eq('id', editPeriod.id)
    .select()
    .single();

  if (updateError) {
    console.error('❌ Periódus frissítési hiba:', updateError);
    throw updateError;
  }

  console.log('✅ Periódus sikeresen frissítve:', updatedPenFunction);
  
} else {
  // NORMÁL MÓD: Új funkció beszúrása
  console.log('➕ Normál mód: új funkció beszúrása...');
  
  const { data: newPenFunction, error: insertError } = await supabase
    .from('pen_functions')
    .insert(insertData)
    .select()
    .single();

  if (insertError) {
    console.error('❌ Új funkció beszúrási hiba:', insertError);
    throw insertError;
  }

  console.log('✅ Új funkció sikeresen létrehozva:', newPenFunction);
}

// ✅ SIKERES MENTÉS
const successMessage = editMode 
  ? `✅ ${newFunction.toUpperCase()} periódus frissítve!\n📅 ${startDate} - ${endDate}`
  : isHistoricalEntry
    ? `✅ Történeti ${newFunction} periódus rögzítve!\n📅 ${startDate} - ${endDate}`
    : `✅ Karám funkció váltás sikeres!\n🔄 Új funkció: ${newFunction}`;

alert(successMessage);

onClose();

// UI frissítés
setTimeout(() => {
  window.location.reload();
}, 1000);

    } catch (error) {
      console.error('💥 Funkció váltási hiba:', error);
      alert('❌ Hiba történt: ' + (error instanceof Error ? error.message : 'Ismeretlen hiba'));
    } finally {
      setLoading(false);
    }
  };
  if (!isOpen) return null;

  const availableFunctions = functionTypes;
  const capacityWarning = getCapacityWarning();
  const newCapacity = newFunction ? calculateNewCapacity(newFunction) : pen.capacity;
  const selectedTemplate = NOTES_TEMPLATES[newFunction];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-0 border max-w-4xl shadow-lg rounded-lg bg-white">
        {/* Header - DESIGN SYSTEM MODERNIZED */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⚙️</span>
            <h3 className="text-lg font-medium text-gray-900">
              Karám {pen.pen_number} - Funkció Kezelés
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="text-xl">❌</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {/* Jelenlegi állapot */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <span className="text-lg mr-2">📊</span>
              Jelenlegi Állapot:
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">🏠 Funkció:</span>
                <p className="font-medium">{PEN_FUNCTION_LABELS[pen.current_function?.function_type || 'üres']}</p>
              </div>
              <div>
                <span className="text-gray-600">📊 Kapacitás:</span>
                <p className="font-medium">{pen.animal_count}/{pen.capacity} állat</p>
              </div>
              <div>
                <span className="text-gray-600">📅 Funkció kezdete:</span>
                <p className="font-medium">
                  {pen.current_function?.start_date ?
                    new Date(pen.current_function.start_date).toLocaleDateString('hu-HU') :
                    'Nincs adat'
                  }
                </p>
              </div>
              <div>
                <span className="text-gray-600">📍 Lokáció:</span>
                <p className="font-medium">{pen.location}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Új funkció választás */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                <span className="text-lg mr-2">🔄</span>
                Új funkció: *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableFunctions.map(funcType => (
                  <label key={funcType.value} className="cursor-pointer">
                    <div className={`p-4 border rounded-lg transition-colors ${newFunction === funcType.value
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="function"
                          value={funcType.value}
                          checked={newFunction === funcType.value}
                          onChange={(e) => setNewFunction(e.target.value as PenFunctionType)}
                          className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                        />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{funcType.label}</div>
                          <div className="text-xs text-gray-500">{funcType.description}</div>
                          {newFunction === funcType.value && (
                            <div className="text-xs text-green-600 mt-1 flex items-center">
                              <span className="mr-1">📊</span>
                              Új kapacitás: {newCapacity} állat
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Kapacitás figyelmeztetés */}
            {capacityWarning && (
              <div className={`p-4 rounded-lg flex items-start ${capacityWarning.includes('túllépi') ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
                }`}>
                <span className={`text-xl mr-3 ${capacityWarning.includes('túllépi') ? '' : ''
                  }`}>
                  {capacityWarning.includes('túllépi') ? '🚨' : '⚠️'}
                </span>
                <div>
                  <div className={`text-sm font-medium ${capacityWarning.includes('túllépi') ? 'text-red-800' : 'text-yellow-800'
                    }`}>
                    Kapacitás Információ
                  </div>
                  <div className={`text-sm ${capacityWarning.includes('túllépi') ? 'text-red-700' : 'text-yellow-700'
                    }`}>
                    {capacityWarning}
                  </div>
                </div>
              </div>
            )}

            {/* Hárem specifikus mezők - TÖBBBIKÁS VERZIÓ */}
            {newFunction === 'hárem' && (
              <div className="p-4 bg-pink-50 border border-pink-200 rounded-lg">
                <h4 className="font-medium text-pink-900 mb-4 flex items-center">
                  <span className="text-lg mr-2">💕</span>
                  Hárem Beállítások
                </h4>

                <div className="space-y-4">
                  {/* Tenyészbikák listája */}
                  <div>
                    <label className="block text-sm font-medium text-pink-700 mb-2">
                      🐂 Tenyészbikák ({selectedBulls.length}):
                    </label>

                    {/* Kiválasztott bikák megjelenítése */}
                    <div className="space-y-2 mb-3">
                      {selectedBulls.map((bull) => (
                        <div key={bull.id} className="flex items-center justify-between bg-white border border-pink-200 rounded-lg p-3">
                          <div className="flex items-center">
                            <span className="text-xl mr-2">🐂</span>
                            <div>
                              <div className="font-medium text-pink-900">{bull.name}</div>
                              <div className="text-sm text-pink-600">{bull.enar} • KPLSZ: {bull.kplsz}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeBullFromHarem(bull.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Eltávolítás"
                          >
                            <span className="text-lg">❌</span>
                          </button>
                        </div>
                      ))}

                      {selectedBulls.length === 0 && (
                        <div className="text-center py-4 border-2 border-dashed border-pink-200 rounded-lg">
                          <span className="text-3xl mb-2 block">🐂</span>
                          <p className="text-pink-600 text-sm">Még nincs tenyészbika kiválasztva</p>
                        </div>
                      )}
                    </div>

                    {/* Bika hozzáadás vezérlők */}
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowBullSelector(!showBullSelector)}
                        className="flex-1 bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700 transition-colors"
                      >
                        <span className="mr-2">➕</span>
                        Tenyészbika választás
                      </button>
                      <button
                        type="button"
                        onClick={addCustomBull}
                        className="bg-pink-100 text-pink-700 px-4 py-2 rounded-md hover:bg-pink-200 transition-colors border border-pink-300"
                      >
                        <span className="mr-1">🔧</span>
                        Egyedi
                      </button>
                    </div>

                    {/* Dropdown lista - csak ha megnyitva */}
                    {showBullSelector && (
                      <div className="mt-2 border border-pink-200 rounded-lg bg-white max-h-40 overflow-y-auto">
                        {availableBulls
                          .filter(bull => !selectedBulls.find(sb => sb.id === bull.id))
                          .map((bull) => (
                            <button
                              key={bull.id}
                              type="button"
                              onClick={() => addBullToHarem(bull)}
                              className="w-full text-left px-4 py-2 hover:bg-pink-50 border-b border-pink-100 last:border-b-0"
                            >
                              <div className="flex items-center">
                                <span className="text-lg mr-2">🐂</span>
                                <div>
                                  <div className="font-medium text-gray-900">{bull.name}</div>
                                  <div className="text-xs text-gray-500">{bull.enar} • KPLSZ: {bull.kplsz}</div>
                                </div>
                              </div>
                            </button>
                          ))}

                        {availableBulls.filter(bull => !selectedBulls.find(sb => sb.id === bull.id)).length === 0 && (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">
                            Minden elérhető tenyészbika ki van választva
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Párzás kezdete */}
                  <div>
                    <label className="block text-sm font-medium text-pink-700 mb-1">
                      📅 Párzás kezdete:
                    </label>
                    <input
                      type="date"
                      value={parozasKezdete}
                      onChange={(e) => setParozasKezdete(e.target.value)}
                      className="w-full border border-pink-300 rounded-md px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>

                  {/* VV esedékessége */}
                  <div>
                    <label className="block text-sm font-medium text-pink-700 mb-1">
                      🔬 VV esedékessége:
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="date"
                        value={vvEsedekessege}
                        onChange={(e) => setVvEsedekessege(e.target.value)}
                        className="flex-1 border border-pink-300 rounded-md px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (parozasKezdete) {
                            const parozasDate = new Date(parozasKezdete);
                            const vvDate = new Date(parozasDate.getTime() + (75 * 24 * 60 * 60 * 1000));
                            setVvEsedekessege(vvDate.toISOString().split('T')[0]);
                          }
                        }}
                        disabled={!parozasKezdete}
                        className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        +75 nap
                      </button>
                    </div>
                    <p className="text-xs text-pink-600 mt-1">
                      Automatikus számítás: Párzás kezdete + 75 nap
                    </p>
                  </div>

                  {/* Hárem összefoglaló */}
                  {selectedBulls.length > 0 && (
                    <div className="bg-pink-100 border border-pink-200 rounded-lg p-3 mt-4">
                      <h5 className="font-medium text-pink-800 mb-2">📊 Hárem Összefoglaló:</h5>
                      <div className="text-sm text-pink-700">
                        <p><strong>{selectedBulls.length} tenyészbika</strong> aktív a háremben</p>
                        {parozasKezdete && (
                          <p>Párzás kezdete: <strong>{new Date(parozasKezdete).toLocaleDateString('hu-HU')}</strong></p>
                        )}
                        {vvEsedekessege && (
                          <p>VV esedékessége: <strong>{new Date(vvEsedekessege).toLocaleDateString('hu-HU')}</strong></p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Snapshot előnézet */}
            {selectedBulls.length > 0 && (
              <div className="bg-white border border-pink-300 rounded-lg p-4 mt-4">
                <h5 className="font-medium text-pink-800 mb-3 flex items-center">
                  <span className="mr-2">📸</span>
                  Snapshot Előnézet:
                </h5>
                <div className="text-sm text-pink-700 space-y-1">
                  <p><strong>🐂 Tenyészbikák:</strong> {selectedBulls.map(b => b.name).join(', ')}</p>
                  <p><strong>📊 Pillanatkép:</strong> Mentéskor az aktuális nőivarok is rögzítésre kerülnek</p>
                  <p><strong>📚 Történet:</strong> Ez lesz egy új hárem periódus a karám történetében</p>
                  {parozasKezdete && (
                    <p><strong>📅 Időszak:</strong> {new Date(parozasKezdete).toLocaleDateString('hu-HU')} -től</p>
                  )}
                </div>
              </div>
            )}

            {/* Kórház specifikus mezők */}
            {newFunction === 'kórház' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-900 mb-4 flex items-center">
                  <span className="text-lg mr-2">🏥</span>
                  Kórház Beállítások
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">
                      💊 Kezelés típusa:
                    </label>
                    <select
                      value={treatmentType}
                      onChange={(e) => setTreatmentType(e.target.value as KorhazMetadata['treatment_type'])}
                      className="w-full border border-red-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="megfigyeles">👁️ Megfigyelés</option>
                      <option value="gyogykezeles">💊 Gyógykezelés</option>
                      <option value="vakcinazas">💉 Vakcinázás</option>
                      <option value="sebezes">🔪 Sebészet</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">
                      👨‍⚕️ Állatorvos:
                    </label>
                    <input
                      type="text"
                      value={veterinarian}
                      onChange={(e) => setVeterinarian(e.target.value)}
                      className="w-full border border-red-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Dr. Nagy Péter"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">
                      📅 Várható gyógyulás:
                    </label>
                    <input
                      type="date"
                      value={expectedRecovery}
                      onChange={(e) => setExpectedRecovery(e.target.value)}
                      className="w-full border border-red-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">
                      🔄 Visszahelyezés karám ID:
                    </label>
                    <input
                      type="text"
                      value={returnPenId}
                      onChange={(e) => setReturnPenId(e.target.value)}
                      className="w-full border border-red-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Eredeti karám ID"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Átmeneti specifikus mezők */}
            {newFunction === 'átmeneti' && (
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <h4 className="font-medium text-indigo-900 mb-4 flex items-center">
                  <span className="text-lg mr-2">🔄</span>
                  Átmeneti Beállítások
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-indigo-700 mb-1">
                      ❓ Ide kerülés oka:
                    </label>
                    <select
                      value={atmenetiReason}
                      onChange={(e) => setAtmenetiReason(e.target.value as AtmenetiMetadata['reason'])}
                      className="w-full border border-indigo-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="besorolás_alatt">📋 Besorolás alatt</option>
                      <option value="funkció_váltás_alatt">🔄 Funkció váltás alatt</option>
                      <option value="vizsgálat_alatt">🔍 Vizsgálat alatt</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-indigo-700 mb-1">
                      📅 Döntési határidő:
                    </label>
                    <input
                      type="date"
                      value={decisionDeadline}
                      onChange={(e) => setDecisionDeadline(e.target.value)}
                      className="w-full border border-indigo-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-indigo-700 mb-1">
                      📝 Döntési kritériumok:
                    </label>
                    <input
                      type="text"
                      value={decisionCriteria}
                      onChange={(e) => setDecisionCriteria(e.target.value)}
                      className="w-full border border-indigo-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="VV eredmény, egészségügyi vizsgálat, stb."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notes Template + Szabad szöveg */}
            <div className="space-y-4">
              {/* Template preview */}
              {selectedTemplate && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                    <span className="text-lg mr-2">📝</span>
                    Javasolt mezők ({PEN_FUNCTION_LABELS[newFunction]}):
                  </h4>
                  <pre className="text-sm text-blue-800 whitespace-pre-wrap font-mono bg-white p-3 rounded border">
                    {selectedTemplate}
                  </pre>
                </div>
              )}

              {/* Szabad megjegyzések */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <span className="text-lg mr-2">💬</span>
                  Egyedi megjegyzések:
                </label>
                <textarea
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                  rows={4}
                  placeholder="Írj ide bármilyen megjegyzést, megfigyelést a karámmal kapcsolatban..."
                />
              </div>

              {/* Általános megjegyzések */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <span className="text-lg mr-2">📋</span>
                  Funkció váltási megjegyzés:
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                  rows={2}
                  placeholder="Megjegyzés a funkció váltásról..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* ÚJ: Történeti Periódus Beállítások */}
        <div className="p-6 border-t border-gray-200 bg-blue-50">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">📚</span>
            <h3 className="text-lg font-semibold text-blue-900">Dátum Beállítások</h3>
          </div>

          {/* Történeti checkbox */}
          <div className="mb-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isHistoricalEntry}
                onChange={(e) => setIsHistoricalEntry(e.target.checked)}
                className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-blue-700 flex items-center">
                <span className="mr-2">📚</span>
                Történeti periódus rögzítése (múltbeli esemény)
              </span>
            </label>
          </div>

          {/* Dátum mezők */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2 flex items-center">
                <span className="mr-1">📅</span>
                Kezdő dátum: *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-blue-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2 flex items-center">
                <span className="mr-1">📅</span>
                Záró dátum: {isHistoricalEntry ? '*' : '(opcionális)'}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-blue-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                min={startDate}
                disabled={!isHistoricalEntry && !endDate}
              />
              <p className="text-xs text-blue-600 mt-1">
                {isHistoricalEntry
                  ? 'Történeti mód: záró dátum kötelező'
                  : 'Üres = aktív periódus (folyamatban)'}
              </p>
            </div>
          </div>

          {/* Info üzenet */}
          {isHistoricalEntry && (
            <div className="mt-4 p-3 bg-blue-100 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <span className="text-lg mr-2">💡</span>
                <div className="text-sm text-blue-800">
                  <strong>Történeti mód:</strong> A periódus a múltban történt, pontos kezdő és záró dátumokkal.
                  <br />
                  <strong>Fontos:</strong> Ez nem fogja lezárni a jelenlegi aktív funkciót.
                </div>
              </div>
            </div>
          )}

          {/* ÚJ: Nőivarok snapshot - csak történeti módban és hárem funkcióban */}
          {isHistoricalEntry && newFunction === 'hárem' && (
            <div className="mt-4 p-4 bg-pink-50 border border-pink-200 rounded-lg">
              <h4 className="font-medium text-pink-800 mb-3">🐄 Nőivarok Snapshot</h4>

              <div>
                <label className="block text-sm font-medium text-pink-700 mb-1">
                  Nőivarok ENAR számai (vesszővel elválasztva):
                </label>
                <textarea
                  value={historicalFemales}
                  onChange={(e) => setHistoricalFemales(e.target.value)}
                  placeholder="HU 36050 0006 2, HU 36050 0003 1, HU 36050 0007 9"
                  className="w-full px-3 py-2 border border-pink-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                  rows={3}
                />
                <p className="text-xs text-pink-500 mt-1">
                  Minden ENAR-t vesszővel válassz el. Formátum: "HU 36050 0006 2"
                </p>
              </div>

              {/* Előnézet */}
              <div className="mt-3 p-3 bg-white border border-pink-200 rounded-md">
                <p className="text-sm text-pink-600">
                  📸 <strong>Snapshot előnézet:</strong>
                </p>
                <p className="text-sm">
                  🐂 Tenyészbikák: {selectedBulls.map(b => b.name).join(', ') || 'Nincs kiválasztva'}
                </p>
                <p className="text-sm">
                  🐄 Nőivarok: {historicalFemales.split(',').filter(s => s.trim()).length} manual ENAR
                </p>
              </div>
            </div>
          )}

          {!isHistoricalEntry && endDate && (
            <div className="mt-4 p-3 bg-orange-100 border border-orange-200 rounded-lg">
              <div className="flex items-start">
                <span className="text-lg mr-2">⚠️</span>
                <div className="text-sm text-orange-800">
                  <strong>Figyelem:</strong> Záró dátum megadva - ez lezárja a periódust.
                  <br />
                  Ha aktív periódust szeretnél, hagyd üresen a záró dátumot.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-3 rounded-lg border border-gray-300 transition-colors inline-flex items-center"
          >
            <span className="mr-2">❌</span>
            Mégse
          </button>
          <button
            onClick={handleFunctionChange}
            disabled={!newFunction || loading || (isHistoricalEntry && !endDate)}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Mentés...
              </>
            ) : (
              <>
                <span className="text-lg mr-2">⚙️</span>
                Funkció Váltása
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}