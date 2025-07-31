// src/lib/penHistorySync.ts
import { supabase } from '@/lib/supabase';
import { useEffect, useCallback } from 'react';

// 🔄 SZINKRONIZÁCIÓS ESEMÉNYEK
export type PenHistoryEvent = 
  | 'period_added' 
  | 'period_updated' 
  | 'animals_moved' 
  | 'function_changed'
  | 'automatic_snapshot';

// 🎯 BROADCAST ESEMÉNYEK
const eventBus = new EventTarget();

// 📡 BROADCAST FÜGGVÉNYEK
export const broadcastPenHistoryUpdate = async (penId: string, event: PenHistoryEvent, data?: any) => {
  console.log(`🔄 Broadcasting pen history update: ${penId} - ${event}`, data); // ← Ez a debug sor
  
  // ÚJ: moveDate kezelés
  if (event === 'animals_moved' && data?.moveDate) {
    console.log('🗓️ Using moveDate for period:', data.moveDate);
    await closePreviousPeriodWithDate(penId, data.moveDate);
  }
  
  eventBus.dispatchEvent(new CustomEvent('pen-history-update', {
    detail: { penId, event, data, timestamp: Date.now() }
  }));
};

export const broadcastAnimalHistoryUpdate = (animalIds: string[], event: PenHistoryEvent, data?: any) => {
  console.log(`🔄 Broadcasting animal history update: ${animalIds.length} animals - ${event}`);
  eventBus.dispatchEvent(new CustomEvent('animal-history-update', {
    detail: { animalIds, event, data, timestamp: Date.now() }
  }));
};

export const broadcastManualPeriodAdded = (penId: string, periodId: string) => {
  broadcastPenHistoryUpdate(penId, 'period_added', { periodId });
  // Érintett állatok broadcast-ja is
  fetchAnimalsInPeriod(periodId).then(animalIds => {
    if (animalIds.length > 0) {
      broadcastAnimalHistoryUpdate(animalIds, 'period_added', { penId, periodId });
    }
  });
};

export const broadcastAnimalsMoved = (animalIds: string[], fromPenId: string, toPenId: string) => {
  broadcastAnimalHistoryUpdate(animalIds, 'animals_moved', { fromPenId, toPenId });
  broadcastPenHistoryUpdate(fromPenId, 'animals_moved', { animalIds, toPenId });
  broadcastPenHistoryUpdate(toPenId, 'animals_moved', { animalIds, fromPenId });
};

// 🎣 REACT HOOK - REAL-TIME LISTENING
export const usePenHistorySync = (
  penId?: string, 
  animalId?: string, 
  onUpdate?: () => void
) => {
  const handlePenUpdate = useCallback((event: CustomEvent) => {
    const { penId: eventPenId, event: eventType, timestamp } = event.detail;
    if (penId && eventPenId === penId) {
      console.log(`🔄 Pen ${penId} received update: ${eventType}`);
      onUpdate?.();
    }
  }, [penId, onUpdate]);

  const handleAnimalUpdate = useCallback((event: CustomEvent) => {
    const { animalIds, event: eventType, timestamp } = event.detail;
    if (animalId && animalIds.includes(animalId)) {
      console.log(`🔄 Animal ${animalId} received update: ${eventType}`);
      onUpdate?.();
    }
  }, [animalId, onUpdate]);

  useEffect(() => {
    if (penId) {
      eventBus.addEventListener('pen-history-update', handlePenUpdate as EventListener);
    }
    if (animalId) {
      eventBus.addEventListener('animal-history-update', handleAnimalUpdate as EventListener);
    }

    return () => {
      eventBus.removeEventListener('pen-history-update', handlePenUpdate as EventListener);
      eventBus.removeEventListener('animal-history-update', handleAnimalUpdate as EventListener);
    };
  }, [penId, animalId, handlePenUpdate, handleAnimalUpdate]);

  return {
    lastSync: Date.now() // Placeholder - később timestamp tracking
  };
};

// 🤖 AUTOMATIKUS SNAPSHOT GENERÁLÁS - JAVÍTOTT OSZLOPNEVEK
export const createAutomaticPeriodSnapshot = async (
  penId: string, 
  trigger: PenHistoryEvent,
  functionType?: string
) => {
  try {
    console.log(`📸 Creating automatic snapshot for pen ${penId}, trigger: ${trigger}`);
    
    // ✅ JAVÍTOTT: Jelenlegi állatok lekérdezése a helyes oszlopnevek alapján
    const { data: penData } = await supabase
      .from('pens')
      .select('pen_number')
      .eq('id', penId)
      .single();

    if (!penData) {
      console.error('Pen not found:', penId);
      return null;
    }

    // Állatok lekérdezése a jelenlegi karám alapján
    const { data: animals, error: animalsError } = await supabase
      .from('animals')
      .select('id, enar, kategoria, name')
      .eq('jelenlegi_karam', penData.pen_number) // ✅ JAVÍTOTT oszlopnév
      .eq('statusz', 'aktív'); // ✅ JAVÍTOTT oszlopnév

    if (animalsError) {
      console.error('Error fetching animals:', animalsError);
      // Ne dobjunk hibát, csak logoljuk
      return null;
    }

    // ✅ JAVÍTOTT: Karám funkció lekérdezése a pen_functions táblából
    let currentFunction = functionType;
    if (!currentFunction) {
      const { data: penFunction } = await supabase
        .from('pen_functions')
        .select('function_type')
        .eq('pen_id', penId)
        .is('end_date', null) // Csak aktív funkció
        .order('start_date', { ascending: false })
        .limit(1)
        .single();
      currentFunction = penFunction?.function_type || 'ismeretlen';
    }

    // Előző periódus lezárása
    await closePreviousPeriod(penId);

    // Új periódus indítása
    const { data: newPeriod, error: periodError } = await supabase
      .from('pen_history_periods')
      .insert({
        pen_id: penId,
        function_type: currentFunction,
        start_date: new Date().toISOString().split('T')[0], // Eredeti logika
        animals_snapshot: animals || [],
        metadata: {
          trigger,
          animal_count: animals?.length || 0,
          created_by: 'system'
        },
        historical: false
      })
      .select()
      .single();

    if (periodError) {
      console.error('Error creating period:', periodError);
      // Ne dobjunk hibát, csak logoljuk
      return null;
    }

    console.log(`✅ Automatic snapshot created: ${newPeriod.id}`);
    return newPeriod;

  } catch (error) {
    console.error('❌ Error creating automatic snapshot:', error);
    // Ne dobjunk hibát, csak logoljuk és térjünk vissza null-lal
    return null;
  }
};

// 🔚 ELŐZŐ PERIÓDUS LEZÁRÁSA
export const closePreviousPeriod = async (penId: string) => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { error } = await supabase
      .from('pen_history_periods')
      .update({ 
        end_date: yesterday.toISOString().split('T')[0]
      })
      .eq('pen_id', penId)
      .is('end_date', null);

    if (error) {
      console.error('Error closing previous period:', error);
      // Ne dobjunk hibát
    } else {
      console.log(`🔚 Previous period closed for pen ${penId}`);
    }
  } catch (error) {
    console.error('❌ Error closing previous period:', error);
  }
};

// 🔍 HELPER FÜGGVÉNYEK
export const fetchAnimalsInPeriod = async (periodId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('pen_history_periods')
      .select('animals_snapshot')
      .eq('id', periodId)
      .single();

    if (error) {
      console.error('Error fetching animals in period:', error);
      return [];
    }
    
    const animals = data?.animals_snapshot as any[] || [];
    return animals.map(animal => animal.id || animal.enar).filter(Boolean);
  } catch (error) {
    console.error('❌ Error fetching animals in period:', error);
    return [];
  }
};

// 🔧 DUPLIKÁCIÓ VÉDELEM
export const checkPeriodOverlap = async (
  penId: string, 
  startDate: string, 
  endDate: string | null
): Promise<boolean> => {
  try {
    let query = supabase
      .from('pen_history_periods')
      .select('id')
      .eq('pen_id', penId);

    if (endDate) {
      // Átfedés ellenőrzés: (start <= other_end) AND (end >= other_start)
      query = query.or(`end_date.gte.${startDate},end_date.is.null`)
                   .gte('start_date', startDate);
    } else {
      // Nyitott periódus - csak a start_date utáni periódusok
      query = query.gte('start_date', startDate);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error checking period overlap:', error);
      return false;
    }

    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('❌ Error checking period overlap:', error);
    return false;
  }
};

// 🎯 DEDUPLIKÁCIÓ
export const removeDuplicatePeriods = async (penId: string) => {
  try {
    const { data: periods, error } = await supabase
      .from('pen_history_periods')
      .select('*')
      .eq('pen_id', penId)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching periods for deduplication:', error);
      return;
    }

    const duplicates = [];
    for (let i = 1; i < (periods?.length || 0); i++) {
      const prev = periods![i - 1];
      const curr = periods![i];
      
      // Ha azonos kezdetű és funkciójú
      if (prev.start_date === curr.start_date && 
          prev.function_type === curr.function_type) {
        duplicates.push(curr.id);
      }
    }

    if (duplicates.length > 0) {
      const { error: deleteError } = await supabase
        .from('pen_history_periods')
        .delete()
        .in('id', duplicates);
      
      if (deleteError) {
        console.error('Error removing duplicates:', deleteError);
      } else {
        console.log(`🧹 Removed ${duplicates.length} duplicate periods`);
      }
    }
  } catch (error) {
    console.error('❌ Error removing duplicates:', error);
  }
};
// ÚJ: Periódus lezárás és új indítás moveDate-tel
const closePreviousPeriodWithDate = async (penId: string, moveDate: string) => {
  try {
    console.log(`🔚 Closing period with moveDate: ${moveDate}`);
    
    // 1. Előző periódus lezárása moveDate-tel
    const { error: closeError } = await supabase
      .from('pen_history_periods')
      .update({ 
        end_date: moveDate // ← A beállított dátum!
      })
      .eq('pen_id', penId)
      .is('end_date', null);

    if (closeError) {
      console.error('❌ Error closing period:', closeError);
    }

    // 2. Új periódus indítása moveDate + 1 nap
    const nextDay = new Date(moveDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayString = nextDay.toISOString().split('T')[0];
    
    await createNewPeriodWithDate(penId, nextDayString);
    
  } catch (error) {
    console.error('❌ Error in closePreviousPeriodWithDate:', error);
  }
};

// ÚJ: Új periódus létrehozása adott dátummal
const createNewPeriodWithDate = async (penId: string, startDate: string) => {
  try {
    console.log(`📸 Creating new period starting: ${startDate}`);
    
    // Pen adatok
    const { data: penData } = await supabase
      .from('pens')
      .select('pen_number')
      .eq('id', penId)
      .single();

    if (!penData) return;

    // Állatok lekérdezése
    const { data: animals } = await supabase
      .from('animals')
      .select('id, enar, kategoria, name')
      .eq('jelenlegi_karam', penData.pen_number)
      .eq('statusz', 'aktív');

    // Funkció lekérdezése
    const { data: penFunction } = await supabase
      .from('pen_functions')
      .select('function_type')
      .eq('pen_id', penId)
      .is('end_date', null)
      .order('start_date', { ascending: false })
      .limit(1)
      .single();

    // Új periódus létrehozása
    const { data: newPeriod } = await supabase
      .from('pen_history_periods')
      .insert({
        pen_id: penId,
        function_type: penFunction?.function_type || 'üres',
        start_date: startDate, // ← A moveDate + 1 nap!
        animals_snapshot: animals || [],
        metadata: {
          trigger: 'animals_moved',
          animal_count: animals?.length || 0,
          created_by: 'system'
        },
        historical: false
      })
      .select()
      .single();

    console.log(`✅ New period created starting: ${startDate}`);
    return newPeriod;
    
  } catch (error) {
    console.error('❌ Error creating new period:', error);
  }
};