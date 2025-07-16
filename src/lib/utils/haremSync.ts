// src/lib/utils/haremSync.ts
'use client';

import { supabase } from '@/lib/supabase';

// 🔹 INTERFACES
interface Bull {
  id: string;
  name: string;
  enar: string;
  kplsz?: string;
  active: boolean;
  source?: 'metadata' | 'physical' | 'both'; // TypeScript safe source tracking
}

interface HaremMetadata {
  bulls: Bull[];
  pairing_start_date: string;
  expected_vv_date: string;
  breeding_method: string;
}

interface SyncResult {
  success: boolean;
  message: string;
  data?: any;
}

// 🔹 KÖZPONTI SZINKRONIZÁCIÓ FUNKCIÓ
export const syncHaremData = async (penId: string): Promise<SyncResult> => {
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
    
    if (!currentFunction || currentFunction.function_name !== 'hárem') {
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
      const isPhysicallyPresent = physicalBulls.some(pb => pb.enar === metadataBull.enar);
      
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

    // 6. Zöld sáv frissítése (cache clean)
    await refreshHaremInfo(penId);

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
export const getPhysicalBulls = async (penId: string): Promise<Bull[]> => {
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
export const findAnimalIdByEnar = async (enar: string): Promise<number | null> => {
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
export const moveAnimalToKaram = async (
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
export const addBullToHaremMetadata = async (
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

// 🔹 HÁREM INFORMÁCIÓK FRISSÍTÉSE (CACHE CLEAN)
export const refreshHaremInfo = async (penId: string): Promise<void> => {
  try {
    console.log('🔄 Hárem info cache frissítése:', penId);
    
    // TODO: Itt later implementálhatunk cache cleaning logikát
    // Egyelőre console log-gal jelezzük a frissítést
    
    console.log('✅ Hárem info cache frissítve');
  } catch (error) {
    console.error('❌ Hárem info cache frissítési hiba:', error);
  }
};

// 🔹 HÁREM METADATA FRISSÍTÉSE
export const updateHaremMetadata = async (
  penId: string, 
  bulls: Bull[]
): Promise<SyncResult> => {
  try {
    console.log('🔄 Hárem metadata teljes frissítése:', penId);

    // 1. Aktuális karám funkció lekérdezése
    const { data: penFunction, error: functionError } = await supabase
      .from('pen_functions')
      .select('*')
      .eq('pen_id', penId)
      .is('end_date', null)
      .order('start_date', { ascending: false })
      .limit(1);

    if (functionError || !penFunction?.[0]) {
      return { success: false, message: 'Karám funkció nem található' };
    }

    const currentFunction = penFunction[0];
    
    // 2. Metadata teljes frissítése
    const currentMetadata = currentFunction.metadata || {};
    
    const { error: updateError } = await supabase
      .from('pen_functions')
      .update({
        metadata: {
          ...currentMetadata,
          bulls: bulls
        }
      })
      .eq('id', currentFunction.id);

    if (updateError) {
      console.error('❌ Teljes metadata frissítési hiba:', updateError);
      return { success: false, message: 'Metadata frissítés sikertelen' };
    }

    console.log('✅ Hárem metadata teljesen frissítve');
    return { success: true, message: 'Hárem metadata frissítve' };

  } catch (error) {
    console.error('❌ Hárem metadata frissítési exception:', error);
    return { success: false, message: (error as Error).message };
  }
};

// 🔹 HÁREM INFORMÁCIÓK LEKÉRDEZÉSE (EGYESÍTETT ADATOK)
export const getHaremInfo = async (penId: string) => {
  try {
    console.log('🔍 Hárem információk lekérdezése:', penId);

    // 1. Metadata alapú bikák
    const { data: penFunction } = await supabase
      .from('pen_functions')
      .select('*')
      .eq('pen_id', penId)
      .is('end_date', null)
      .order('start_date', { ascending: false })
      .limit(1);

    const metadataBulls = penFunction?.[0]?.metadata?.bulls || [];

    // 2. Fizikailag jelenlévő tenyészbikák
    const physicalBulls = await getPhysicalBulls(penId);

    // 3. Egyesített lista (metadata + fizikai)
    const allBulls = mergeBullData(metadataBulls, physicalBulls);

    return {
      metadataBulls,
      physicalBulls,
      allBulls,
      synchronized: metadataBulls.length === physicalBulls.length
    };

  } catch (error) {
    console.error('❌ Hárem info lekérdezési hiba:', error);
    return {
      metadataBulls: [],
      physicalBulls: [],
      allBulls: [],
      synchronized: false
    };
  }
};

// 🔹 TENYÉSZBIKA ADATOK EGYESÍTÉSE
export const mergeBullData = (metadataBulls: Bull[], physicalBulls: Bull[]): Bull[] => {
  const merged = new Map<string, Bull>();

  // Metadata bikák hozzáadása
  metadataBulls.forEach(bull => {
    merged.set(bull.enar, { ...bull, source: 'metadata' as const });
  });

  // Fizikai bikák hozzáadása/frissítése
  physicalBulls.forEach(bull => {
    const existing = merged.get(bull.enar);
    if (existing) {
      // Egyesített adatok - metadata + fizikai
      merged.set(bull.enar, { 
        ...existing, 
        ...bull, 
        source: 'both' as const
      });
    } else {
      // Csak fizikai
      merged.set(bull.enar, { ...bull, source: 'physical' as const });
    }
  });

  return Array.from(merged.values());
};

// 🔹 DEBUG FUNKCIÓ - HÁREM STÁTUSZ ELLENŐRZÉSE
export const debugHaremStatus = async (penId: string): Promise<void> => {
  try {
    console.log('🔍 DEBUG: Hárem státusz ellenőrzése:', penId);
    
    const haremInfo = await getHaremInfo(penId);
    
    console.log('📊 DEBUG eredmények:', {
      penId,
      metadataBulls: haremInfo.metadataBulls.length,
      physicalBulls: haremInfo.physicalBulls.length,
      synchronized: haremInfo.synchronized,
      allBulls: haremInfo.allBulls.map((b: Bull) => ({
        name: b.name,
        enar: b.enar,
        source: b.source
      }))
    });

    // Szinkronizációs ajánlások
    if (!haremInfo.synchronized) {
      console.log('⚠️ SZINKRONIZÁCIÓS JAVASLATOK:');
      
      haremInfo.metadataBulls.forEach((mb: Bull) => {
        const physicalMatch = haremInfo.physicalBulls.find((pb: Bull) => pb.enar === mb.enar);
        if (!physicalMatch) {
          console.log(`  - ${mb.name} (${mb.enar}) metadata-ban van, de fizikailag nincs jelen`);
        }
      });
      
      haremInfo.physicalBulls.forEach((pb: Bull) => {
        const metadataMatch = haremInfo.metadataBulls.find((mb: Bull) => mb.enar === pb.enar);
        if (!metadataMatch) {
          console.log(`  - ${pb.name} (${pb.enar}) fizikailag jelen van, de metadata-ban nincs`);
        }
      });
    }

  } catch (error) {
    console.error('❌ DEBUG hiba:', error);
  }
};