// 🐂 src/lib/services/BullAssignmentService.ts
// Kiszervezett tenyészbika kezelési szolgáltatás

import { supabase } from '@/lib/supabase';

export interface TenyeszBika {
  id: string;
  name: string;
  enar: string;
  kplsz?: string;
  active: boolean;
}

export interface AssignmentResult {
  success: boolean;
  message: string;
  addedBulls: number;
  errors?: string[];
}

export class BullAssignmentService {
  
  /**
   * 🐂 TENYÉSZBIKÁK FIZIKAI HOZZÁRENDELÉSE KARÁMHOZ
   * 
   * Optimalizált verzió a TeljesKaramTortenelem-ből kiszervezve
   */
  static async assignBullsToPen(
    selectedBulls: TenyeszBika[],
    penId: string,
    isHistorical: boolean = false
  ): Promise<AssignmentResult> {
    
    if (selectedBulls.length === 0) {
      return {
        success: true,
        message: 'Nincs kiválasztott tenyészbika',
        addedBulls: 0
      };
    }

    let successfullyAddedCount = 0;
    const errors: string[] = [];

    try {
      console.log(`🐂 ${selectedBulls.length} tenyészbika hozzárendelése karámhoz: ${penId}`);

      // 🔥 BATCH OPTIMALIZÁLÁS: Minden bika ID-ját egy lekérdezésben
      const bullEnars = selectedBulls.map(bull => bull.enar);
      const { data: allBullData, error: bullDataError } = await supabase
        .from('animals')
        .select('id, enar')
        .in('enar', bullEnars)
        .eq('kategoria', 'tenyészbika');

      if (bullDataError) {
        throw new Error(`Bikák lekérdezési hiba: ${bullDataError.message}`);
      }

      // ENAR → ID mapping
      const enarToIdMap = new Map<string, number>();
      allBullData?.forEach(bull => {
        enarToIdMap.set(bull.enar, bull.id);
      });

      // Minden bika feldolgozása
      for (const bull of selectedBulls) {
        try {
          await this.processSingleBullAssignment(bull, penId, enarToIdMap, isHistorical);
          successfullyAddedCount++;
          console.log(`✅ ${bull.name} (${bull.enar}) hozzárendelve`);
        } catch (bullError) {
          const errorMsg = `${bull.name}: ${(bullError as Error).message}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      return {
        success: true,
        message: `${successfullyAddedCount}/${selectedBulls.length} tenyészbika hozzárendelve`,
        addedBulls: successfullyAddedCount,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('💥 BullAssignmentService hiba:', error);
      return {
        success: false,
        message: `Hozzárendelési hiba: ${(error as Error).message}`,
        addedBulls: 0,
        errors: [`Kritikus hiba: ${(error as Error).message}`]
      };
    }
  }

  /**
   * 🔧 EGYETLEN BIKA HOZZÁRENDELÉSE (belső funkció)
   */
  private static async processSingleBullAssignment(
    bull: TenyeszBika,
    penId: string,
    enarToIdMap: Map<string, number>,
    isHistorical: boolean
  ): Promise<void> {

    // 1. DUPLIKÁCIÓ ELLENŐRZÉS
    const { data: existingAssignment } = await supabase
      .from('animal_pen_assignments')
      .select(`
        id,
        animals!inner(enar)
      `)
      .eq('pen_id', penId)
      .eq('animals.enar', bull.enar)
      .is('removed_at', null)
      .limit(1);

    if (existingAssignment && existingAssignment.length > 0) {
      console.log(`⚠️ ${bull.name} már hozzá van rendelve ehhez a karámhoz`);
      return; // Már hozzá van rendelve
    }

    // 2. ANIMAL ID MEGKERESÉSE
    const animalId = enarToIdMap.get(bull.enar);
    if (!animalId) {
      throw new Error(`Tenyészbika nem található az animals táblában: ${bull.enar}`);
    }

    // 3. RÉGI ASSIGNMENTS LEZÁRÁSA
    const { error: removeError } = await supabase
      .from('animal_pen_assignments')
      .update({
        removed_at: new Date().toISOString(),
        removal_reason: 'bika_újrahozzárendelés'
      })
      .eq('animal_id', animalId)
      .is('removed_at', null);

    if (removeError) {
      console.warn(`⚠️ ${bull.name} régi assignment lezárási hiba:`, removeError);
    }

    // 4. ÚJ ASSIGNMENT LÉTREHOZÁSA
    const { error: assignError } = await supabase
      .from('animal_pen_assignments')
      .insert({
        animal_id: animalId,
        pen_id: penId,
        assigned_at: new Date().toISOString(),
        assignment_reason: isHistorical ? 'történeti_rögzítés' : 'tenyészbika_hozzárendelés',
        notes: `Karám történetből hozzárendelve: ${bull.name} (${bull.enar})`
      });

    if (assignError) {
      throw new Error(`Assignment létrehozási hiba: ${assignError.message}`);
    }

    // 5. ANIMALS TÁBLA FRISSÍTÉSE
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

    // 6. ESEMÉNY RÖGZÍTÉSE
    await supabase
      .from('animal_events')
      .insert({
        animal_id: animalId,
        event_type: 'pen_movement',
        event_date: new Date().toISOString().split('T')[0],
        event_time: new Date().toISOString().split('T')[1].substring(0, 8),
        pen_id: penId,
        reason: 'Tenyészbika hozzárendelés',
        notes: `Karám történetből hozzárendelve: ${bull.name}`,
        is_historical: isHistorical
      });
  }

  /**
   * 🔄 BIKA ELTÁVOLÍTÁSA KARÁMBÓL
   */
  static async removeBullFromPen(
    bull: TenyeszBika,
    penId: string,
    reason: string = 'eltávolítás'
  ): Promise<AssignmentResult> {
    try {
      console.log(`🔄 ${bull.name} eltávolítása karámból: ${penId}`);

      // Animal ID megkeresése
      const { data: animalData, error: animalError } = await supabase
        .from('animals')
        .select('id')
        .eq('enar', bull.enar)
        .eq('kategoria', 'tenyészbika')
        .single();

      if (animalError || !animalData) {
        throw new Error(`Tenyészbika nem található: ${bull.enar}`);
      }

      // Assignment lezárása
      const { error: removeError } = await supabase
        .from('animal_pen_assignments')
        .update({
          removed_at: new Date().toISOString(),
          removal_reason: reason
        })
        .eq('animal_id', animalData.id)
        .eq('pen_id', penId)
        .is('removed_at', null);

      if (removeError) {
        throw new Error(`Assignment lezárási hiba: ${removeError.message}`);
      }

      // Esemény rögzítése
      await supabase
        .from('animal_events')
        .insert({
          animal_id: animalData.id,
          event_type: 'pen_movement',
          event_date: new Date().toISOString().split('T')[0],
          event_time: new Date().toISOString().split('T')[1].substring(0, 8),
          reason: `Tenyészbika eltávolítása: ${reason}`,
          notes: `${bull.name} eltávolítva karámból`,
          is_historical: false
        });

      return {
        success: true,
        message: `${bull.name} sikeresen eltávolítva`,
        addedBulls: -1
      };

    } catch (error) {
      console.error('💥 Bika eltávolítási hiba:', error);
      return {
        success: false,
        message: `Eltávolítási hiba: ${(error as Error).message}`,
        addedBulls: 0,
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * 📊 KARÁM JELENLEGI TENYÉSZBIKÁINAK LEKÉRDEZÉSE
   */
  static async getPenCurrentBulls(penId: string): Promise<TenyeszBika[]> {
    try {
      const { data: currentBulls, error } = await supabase
        .from('animal_pen_assignments')
        .select(`
          animals!inner(id, enar, kategoria),
          bulls(name, kplsz, active)
        `)
        .eq('pen_id', penId)
        .eq('animals.kategoria', 'tenyészbika')
        .is('removed_at', null);

      if (error) {
        console.error('❌ Jelenlegi bikák lekérdezési hiba:', error);
        return [];
      }

      return (currentBulls || []).map((assignment: any) => ({
        id: assignment.animals.id.toString(),
        name: assignment.bulls?.name || assignment.animals.enar.split(' ').pop() || 'Névtelen',
        enar: assignment.animals.enar,
        kplsz: assignment.bulls?.kplsz,
        active: assignment.bulls?.active ?? true
      }));

    } catch (error) {
      console.error('💥 getPenCurrentBulls hiba:', error);
      return [];
    }
  }

  /**
   * 🔍 ELÉRHETŐ TENYÉSZBIKÁK LEKÉRDEZÉSE
   */
  static async getAvailableBulls(): Promise<TenyeszBika[]> {
    try {
      // Először a bulls táblából
      const { data: bullsData, error: bullsError } = await supabase
        .from('bulls')
        .select('id, name, enar, kplsz, active')
        .eq('active', true)
        .order('name');

      if (!bullsError && bullsData && bullsData.length > 0) {
        return bullsData;
      }

      // Fallback: animals táblából
      const { data: animalBulls, error: animalError } = await supabase
        .from('animals')
        .select('id, enar, kategoria')
        .eq('kategoria', 'tenyészbika')
        .order('enar');

      if (animalError) {
        console.error('❌ Tenyészbikák lekérdezési hiba:', animalError);
        return [];
      }

      return (animalBulls || []).map(bull => ({
        id: bull.id.toString(),
        name: bull.enar.split(' ').pop() || 'Névtelen',
        enar: bull.enar,
        active: true
      }));

    } catch (error) {
      console.error('💥 getAvailableBulls hiba:', error);
      return [];
    }
  }
}