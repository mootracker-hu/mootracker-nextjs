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
      
      const { data: duplicates, error } = await this.supabase
        .rpc('find_duplicate_assignments');

      if (error || !duplicates || duplicates.length === 0) {
        return { success: true, message: 'Nincs dupla assignment' };
      }

      let fixedCount = 0;

      for (const duplicate of duplicates) {
        const { data: assignments } = await this.supabase
          .from('animal_pen_assignments')
          .select('id, assigned_at')
          .eq('animal_id', duplicate.animal_id)
          .is('removed_at', null)
          .order('assigned_at', { ascending: false });

        if (assignments && assignments.length > 1) {
          const toClose = assignments.slice(1);
          
          for (const assignment of toClose) {
            await this.supabase
              .from('animal_pen_assignments')
              .update({ removed_at: new Date().toISOString() })
              .eq('id', assignment.id);
          }
          
          fixedCount++;
        }
      }

      return {
        success: true,
        message: `${fixedCount} dupla assignment javítva`,
        details: { fixedCount }
      };

    } catch (error) {
      return {
        success: false,
        message: `Javítás hiba: ${error}`
      };
    }
  }
}

export const penSyncManager = new CompletePenSyncManager();