import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

// 🎯 SMART PEN DATA HOOK - KOMPATIBILIS A MEGLÉVŐ KÓDDAL
// JAVÍTÁS: A hook most a meglévő Animal típusokat használja

// ✅ Importáljuk az eredeti Animal típust
import { Animal } from '@/types/animal-types';

interface SmartPenData {
  animals: Animal[];
  bulls: Animal[];
  females: Animal[];
  metadata: any;
  lastUpdate: Date;
  loading: boolean;
  error: string | null;
}

export function useSmartPenData(penId: string) {
  const [data, setData] = useState<SmartPenData>({
    animals: [],
    bulls: [],
    females: [],
    metadata: {},
    lastUpdate: new Date(),
    loading: true,
    error: null
  });

  const supabase = createClient();

  // 🔄 AUTO-SYNC FÜGGVÉNY: Metadata frissítése fizikai állapothoz
  const autoSyncBullsMetadata = async (penId: string, physicalBulls: Animal[]) => {
    try {
      console.log('🔧 Auto-syncing bulls metadata...');
      
      // Új metadata összeállítása
      const updatedMetadata = {
        bulls: physicalBulls.map(bull => ({
          id: bull.id,
          enar: bull.enar,
          name: bull.name || bull.enar
        })),
        last_sync: new Date().toISOString()
      };

      // Jelenlegi funkció frissítése
      const { error } = await supabase
        .from('pen_functions')
        .update({ metadata: updatedMetadata })
        .eq('pen_id', penId)
        .is('end_date', null);

      if (error) {
        console.error('❌ Metadata sync error:', error);
      } else {
        console.log('✅ Bulls metadata auto-synced successfully');
      }
    } catch (error) {
      console.error('❌ Auto-sync failed:', error);
    }
  };

  // 📊 SMART DATA FETCHER
  const fetchPenData = async () => {
    if (!penId) {
      console.log('⚠️ Nincs penId, skip fetch');
      return;
    }

    try {
      console.log('🔍 Smart hook fetch start:', penId);
      setData(prev => ({ ...prev, loading: true, error: null }));
      
      // 1. ✅ SINGLE SOURCE OF TRUTH: animal_pen_assignments
      const { data: assignments, error: assignmentError } = await supabase
        .from('animal_pen_assignments')
        .select(`
          id,
          assigned_at,
          assignment_reason,
          animals!inner(
            id,
            enar,
            name,
            kategoria,
            ivar,
            szuletesi_datum,
            breed,
            current_weight,
            birth_location,
            statusz,
            anya_enar,
            apa_enar,
            created_at,
            pairing_date,
            last_weight_measured_at,
            vv_date,
            pregnancy_status,
            harem_start_date,
            vv_result,
            expected_birth_date,
            birth_date,
            calf_enar,
            calf_gender,
            treatment_type,
            treatment_start,
            expected_recovery,
            veterinarian,
            return_pen_id,
            transfer_reason,
            decision_deadline,
            target_pen_candidates,
            quarantine_reason,
            quarantine_start,
            expected_release,
            observation_points,
            culling_reason,
            culling_date,
            sales_plan,
            estimated_value,
            notes
          )
        `)
        .eq('pen_id', penId)
        .is('removed_at', null);

      if (assignmentError) {
        throw new Error(`Assignment fetch error: ${assignmentError.message}`);
      }

      // 2. ✅ METADATA FETCH: jelenlegi funkció
      const { data: penFunction, error: functionError } = await supabase
        .from('pen_functions')
        .select('id, function_type, metadata, created_at, start_date, end_date')
        .eq('pen_id', penId)
        .is('end_date', null)
        .order('start_date', { ascending: false })
        .limit(1);

      if (functionError) {
        throw new Error(`Function fetch error: ${functionError.message}`);
      }

      // 3. ✅ SMART DATA PROCESSING - KOMPATIBILIS A MEGLÉVŐ ANIMAL TÍPUSSAL
      const animals: Animal[] = (assignments as any)?.map((a: any) => ({
        // ✅ Az eredeti Animal interface szerint
        id: a.animals.id,                              // number (bigint)
        enar: a.animals.enar,
        name: a.animals.name,
        szuletesi_datum: a.animals.szuletesi_datum,
        kategoria: a.animals.kategoria,
        ivar: a.animals.ivar,
        statusz: a.animals.statusz,
        birth_location: a.animals.birth_location,
        jelenlegi_karam: penId,                        // string
        anya_enar: a.animals.anya_enar,
        apa_enar: a.animals.apa_enar,
        created_at: a.animals.created_at,
        assigned_at: a.assigned_at,
        assignment_reason: a.assignment_reason,
        // Karám-specifikus mezők
        pairing_date: a.animals.pairing_date,
        current_weight: a.animals.current_weight,
        last_weight_measured_at: a.animals.last_weight_measured_at,
        vv_date: a.animals.vv_date,
        pregnancy_status: a.animals.pregnancy_status,
        harem_start_date: a.animals.harem_start_date,
        vv_result: a.animals.vv_result,
        expected_birth_date: a.animals.expected_birth_date,
        birth_date: a.animals.birth_date,
        calf_enar: a.animals.calf_enar,
        calf_gender: a.animals.calf_gender,
        treatment_type: a.animals.treatment_type,
        treatment_start: a.animals.treatment_start,
        expected_recovery: a.animals.expected_recovery,
        veterinarian: a.animals.veterinarian,
        return_pen_id: a.animals.return_pen_id,
        transfer_reason: a.animals.transfer_reason,
        decision_deadline: a.animals.decision_deadline,
        target_pen_candidates: a.animals.target_pen_candidates,
        quarantine_reason: a.animals.quarantine_reason,
        quarantine_start: a.animals.quarantine_start,
        expected_release: a.animals.expected_release,
        observation_points: a.animals.observation_points,
        culling_reason: a.animals.culling_reason,
        culling_date: a.animals.culling_date,
        sales_plan: a.animals.sales_plan,
        estimated_value: a.animals.estimated_value,
        notes: a.animals.notes
      })) || [];

      const bulls = animals.filter(a => a.kategoria === 'tenyészbika');
      const females = animals.filter(a => 
        a.ivar === 'nő' || a.ivar === 'nőivar' || 
        a.kategoria.includes('üsző') || a.kategoria === 'tehén'
      );

      // 4. ✅ COMPUTED METADATA (nem stored!)
      const currentFunction = (penFunction as any)?.[0] || null;
      const computedMetadata = currentFunction?.metadata || {};
      
      // 5. ✅ REAL-TIME SYNC: Metadata vs Reality check
      if (currentFunction?.function_type === 'hárem') {
        const metadataBulls = computedMetadata.bulls || [];
        const physicalBullENARs = bulls.map(b => b.enar);
        const metadataBullENARs = metadataBulls.map((b: any) => b.enar);
        
        // Sync warning ha nem egyeznek
        if (JSON.stringify(physicalBullENARs.sort()) !== JSON.stringify(metadataBullENARs.sort())) {
          console.warn('🚨 SYNC WARNING: Metadata vs Physical bulls mismatch!', {
            physical: physicalBullENARs,
            metadata: metadataBullENARs
          });
          
          // Auto-fix: Update metadata to match reality
          await autoSyncBullsMetadata(penId, bulls);
        }
      }

      // 6. ✅ UPDATE STATE
      setData({
        animals,
        bulls,
        females,
        metadata: computedMetadata,
        lastUpdate: new Date(),
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('❌ Smart pen data fetch error:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  };

  // 🔄 INITIAL LOAD & DEPENDENCIES
  useEffect(() => {
    fetchPenData();
  }, [penId]);

  // 🔄 MANUAL REFRESH FUNCTION
  const refresh = () => {
    fetchPenData();
  };

  return {
    ...data,
    refresh,
    isLoading: data.loading
  };
}