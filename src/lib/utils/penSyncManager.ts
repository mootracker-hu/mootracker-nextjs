import { createClient } from '@/lib/supabase/client';

interface SyncResult {
  success: boolean;
  message: string;
  details?: any;
}

export class CompletePenSyncManager {
  private supabase = createClient();

  async fixAllDuplicateAssignments(): Promise<SyncResult> {
    try {
      console.log('🔧 Dupla assignment javítás kezdése...');
      
      // Keresés dupla assignments nélkül SQL függvény használata nélkül
      const { data: allAssignments, error } = await this.supabase
        .from('animal_pen_assignments')
        .select(`
          id,
          animal_id,
          pen_id,
          assigned_at,
          animals!inner(enar, name)
        `)
        .is('removed_at', null)
        .order('animal_id, assigned_at', { ascending: false });

      if (error) {
        console.error('❌ Assignment keresési hiba:', error);
        return { success: false, message: 'Keresési hiba: ' + error.message };
      }

      if (!allAssignments || allAssignments.length === 0) {
        return { success: true, message: 'Nincs aktív assignment' };
      }

      // Csoportosítás állat szerint
      const animalGroups: { [key: number]: any[] } = {};
      allAssignments.forEach(assignment => {
        if (!animalGroups[assignment.animal_id]) {
          animalGroups[assignment.animal_id] = [];
        }
        animalGroups[assignment.animal_id].push(assignment);
      });

      // Dupla assignments keresése
      const duplicates = Object.entries(animalGroups)
        .filter(([animalId, assignments]) => assignments.length > 1)
        .map(([animalId, assignments]) => ({
          animal_id: parseInt(animalId),
          enar: assignments[0].animals.enar,
          assignments: assignments
        }));

      if (duplicates.length === 0) {
        return { success: true, message: 'Nincs dupla assignment' };
      }

      console.log('🔍 Talált dupla assignments:', duplicates.length);

      let fixedCount = 0;

      for (const duplicate of duplicates) {
        console.log(`🔄 ${duplicate.enar} javítása...`);

        // A legutóbbit meghagyjuk (első a listában), a többit lezárjuk
        const toClose = duplicate.assignments.slice(1);
        
        for (const assignment of toClose) {
          await this.supabase
            .from('animal_pen_assignments')
            .update({ removed_at: new Date().toISOString() })
            .eq('id', assignment.id);
        }
        
        console.log(`✅ ${duplicate.enar}: ${toClose.length} duplikátum lezárva`);
        fixedCount++;
      }

      return {
        success: true,
        message: `${fixedCount} állat dupla assignment-je javítva`,
        details: { fixedCount, totalChecked: duplicates.length }
      };

    } catch (error) {
      console.error('❌ Sync manager hiba:', error);
      return {
        success: false,
        message: `Javítás hiba: ${error}`
      };
    }
  }
}

export const penSyncManager = new CompletePenSyncManager();