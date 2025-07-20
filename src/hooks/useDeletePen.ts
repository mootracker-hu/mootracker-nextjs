// src/hooks/useDeletePen.ts
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface DeletePenResult {
  success: boolean;
  message: string;
  canDelete?: boolean;
  blockers?: string[];
}

interface PenDeleteInfo {
  id: string;
  pen_number: string;
  animal_count: number;
  capacity: number;
  current_function?: {
    function_type: string;
  };
}

export const useDeletePen = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Ellenőrzi, hogy a karám törölhető-e
   */
  const checkDeletionPossibility = async (pen: PenDeleteInfo): Promise<DeletePenResult> => {
    const blockers: string[] = [];

    try {
      // 1. ELLENŐRZÉS: Vannak-e állatok a karámban?
      if (pen.animal_count > 0) {
        blockers.push(`${pen.animal_count} állat jelenleg a karámban`);
      }

      // 2. ELLENŐRZÉS: Vannak-e temp borjak?
      const { count: tempCalfCount } = await supabase
        .from('calves')
        .select('*', { count: 'exact', head: true })
        .eq('current_pen_id', pen.id)
        .eq('is_alive', true)
        .is('enar', null);

      if (tempCalfCount && tempCalfCount > 0) {
        blockers.push(`${tempCalfCount} ideiglenes borjú a karámban`);
      }

      // 3. ELLENŐRZÉS: Aktív funkció?
      const isActiveFunction = pen.current_function?.function_type && 
                              pen.current_function.function_type !== 'üres';
      
      if (isActiveFunction) {
        blockers.push(`Aktív "${pen.current_function?.function_type}" funkció`);
      }

      // 4. ELLENŐRZÉS: Függő karám történeti periódusok?
      const { count: pendingPeriods } = await supabase
        .from('pen_history_periods')
        .select('*', { count: 'exact', head: true })
        .eq('pen_id', pen.id)
        .is('end_date', null); // Aktív periódusok

      if (pendingPeriods && pendingPeriods > 0) {
        blockers.push(`${pendingPeriods} befejezetlen karám történeti periódus`);
      }

      // 5. ELLENŐRZÉS: Függő animal_pen_assignments?
      const { count: activeAssignments } = await supabase
        .from('animal_pen_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('pen_id', pen.id)
        .is('removed_at', null);

      if (activeAssignments && activeAssignments > 0) {
        blockers.push(`${activeAssignments} aktív állat hozzárendelés`);
      }

      return {
        success: true,
        canDelete: blockers.length === 0,
        message: blockers.length === 0 
          ? 'A karám biztonságosan törölhető' 
          : 'A karám nem törölhető a következő okok miatt:',
        blockers
      };

    } catch (error) {
      console.error('❌ Törlési ellenőrzés hiba:', error);
      return {
        success: false,
        message: 'Hiba történt az ellenőrzés során: ' + (error as Error).message,
        canDelete: false
      };
    }
  };

  /**
   * Karám törlése - BIZTONSÁGOS SORREND
   */
  const deletePen = async (pen: PenDeleteInfo): Promise<DeletePenResult> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🗑️ Karám törlés kezdése:', pen.pen_number);

      // 1. ÚJBÓLI ELLENŐRZÉS törlés előtt
      const checkResult = await checkDeletionPossibility(pen);
      if (!checkResult.canDelete) {
        return checkResult;
      }

      // 2. KAPCSOLÓDÓ ADATOK TÖRLÉSE (BIZTONSÁGOS SORREND)
      
      // A) Pen_functions törlése
      console.log('🗑️ Pen_functions törlése...');
      const { error: functionsError } = await supabase
        .from('pen_functions')
        .delete()
        .eq('pen_id', pen.id);

      if (functionsError) {
        throw new Error('Pen_functions törlési hiba: ' + functionsError.message);
      }

      // B) Történeti animal_pen_assignments törlése (biztonsági intézkedés)
      console.log('🗑️ Animal_pen_assignments törlése...');
      const { error: assignmentsError } = await supabase
        .from('animal_pen_assignments')
        .delete()
        .eq('pen_id', pen.id);

      if (assignmentsError) {
        console.warn('⚠️ Animal_pen_assignments törlési figyelmeztetés:', assignmentsError);
        // Ne állítsuk le emiatt, mert lehet, hogy nincs rekord
      }

      // C) Történeti pen_history_periods törlése (OPCIONÁLIS)
      console.log('🗑️ Pen_history_periods törlése...');
      const { error: historyError } = await supabase
        .from('pen_history_periods')
        .delete()
        .eq('pen_id', pen.id);

      if (historyError) {
        console.warn('⚠️ Pen_history_periods törlési figyelmeztetés:', historyError);
        // Ne állítsuk le emiatt
      }

      // 3. FŐREKORD TÖRLÉSE
      console.log('🗑️ Fő karám rekord törlése...');
      const { error: mainError } = await supabase
        .from('pens')
        .delete()
        .eq('id', pen.id);

      if (mainError) {
        throw new Error('Karám törlési hiba: ' + mainError.message);
      }

      console.log('✅ Karám sikeresen törölve:', pen.pen_number);

      return {
        success: true,
        message: `✅ Karám "${pen.pen_number}" sikeresen törölve!`,
        canDelete: true
      };

    } catch (error) {
      console.error('❌ Karám törlési hiba:', error);
      const errorMessage = 'Karám törlési hiba: ' + (error as Error).message;
      setError(errorMessage);
      
      return {
        success: false,
        message: errorMessage,
        canDelete: false
      };

    } finally {
      setLoading(false);
    }
  };

  /**
   * Quick check csak alapvető kritériumokra (UI használatra)
   */
  const canQuickDelete = (pen: PenDeleteInfo): boolean => {
    return pen.animal_count === 0 && 
           (!pen.current_function?.function_type || pen.current_function.function_type === 'üres');
  };

  return {
    deletePen,
    checkDeletionPossibility,
    canQuickDelete,
    loading,
    error
  };
};