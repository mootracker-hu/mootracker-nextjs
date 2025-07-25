// 🛡️ lib/migration/SafetySystem.ts
import { supabase } from '@/lib/supabase';

export interface BackupResult {
  success: boolean;
  backupId: string;
  tables: string[];
  recordCounts: Record<string, number>;
  timestamp: string;
  error?: string;
}

export class SafetySystem {
  // Ezeket a táblákat mentjük el
  private static readonly CRITICAL_TABLES = [
    'animals',
    'animal_pen_assignments', 
    'pen_history_periods',
    'animal_events',
    'animal_movements',
    'pen_functions',
    'pens',
    'bulls'
  ];

  // FŐFUNKCIÓ: Backup készítése
  static async createMigrationBackup(): Promise<BackupResult> {
    const backupId = `migration_backup_${Date.now()}`;
    const timestamp = new Date().toISOString();
    const recordCounts: Record<string, number> = {};
    const backupData: Record<string, any[]> = {};

    try {
      console.log('🔄 Backup készítése...');

      // Minden fontos tábla adatainak lementése
      for (const table of this.CRITICAL_TABLES) {
        console.log(`📊 ${table} táblát mentjük...`);
        
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact' });

        if (error) {
          throw new Error(`${table} backup hiba: ${error.message}`);
        }

        backupData[table] = data || [];
        recordCounts[table] = count || data?.length || 0;
        
        console.log(`✅ ${table}: ${recordCounts[table]} rekord elmentve`);
      }

      // Böngésző helyi tárhelyre mentés (development)
      if (typeof window !== 'undefined') {
        localStorage.setItem(`backup_${backupId}`, JSON.stringify({
          backupId,
          timestamp,
          data: backupData,
          recordCounts
        }));
        console.log('💾 Backup elmentve böngésző tárhelyre');
      }

      return {
        success: true,
        backupId,
        tables: this.CRITICAL_TABLES,
        recordCounts,
        timestamp
      };

    } catch (error) {
      console.error('❌ Backup sikertelen:', error);
      return {
        success: false,
        backupId,
        tables: [],
        recordCounts: {},
        timestamp,
        error: (error as Error).message
      };
    }
  }

  // ELLENŐRZŐ FUNKCIÓ: Minden rendben van-e?
  static async validateSystemIntegrity(): Promise<{
    valid: boolean;
    issues: string[];
    metrics: Record<string, any>;
  }> {
    const issues: string[] = [];
    const metrics: Record<string, any> = {};

    try {
      console.log('🔍 Rendszer ellenőrzése...');

      // 1. Adatbázis kapcsolat teszt
      const { data: connectionTest, error: connectionError } = await supabase
        .from('animals')
        .select('count', { count: 'exact', head: true });

      if (connectionError) {
        issues.push(`Adatbázis kapcsolat hiba: ${connectionError.message}`);
      } else {
        metrics.databaseConnection = 'OK';
        console.log('✅ Adatbázis kapcsolat: OK');
      }

      // 2. Táblák ellenőrzése
      for (const table of this.CRITICAL_TABLES) {
        const { data, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          issues.push(`${table} tábla nem elérhető: ${error.message}`);
        } else {
          metrics[`${table}_elérhető`] = 'igen';
        }
      }

      // 3. Teszt karám keresése
      const testPenId = await this.getTestPenId();
      if (testPenId) {
        metrics.testPenId = testPenId;
        console.log(`✅ Teszt karám találva: ${testPenId}`);
      } else {
        issues.push('Nem található teszt karám');
      }

      return {
        valid: issues.length === 0,
        issues,
        metrics
      };

    } catch (error) {
      issues.push(`Rendszer ellenőrzés hiba: ${(error as Error).message}`);
      return { valid: false, issues, metrics };
    }
  }

  // SEGÉDFUNKCIÓ: Teszt karám keresése
  static async getTestPenId(): Promise<string | null> {
    try {
      // Keressünk egy karámot ami rendelkezik állatokkal
      const { data: pensWithAnimals } = await supabase
        .from('animal_pen_assignments')
        .select('pen_id')
        .is('removed_at', null)
        .limit(1);

      return pensWithAnimals?.[0]?.pen_id || null;
    } catch {
      return null;
    }
  }

  // ROLLBACK PONT: Ha el kell dobni a változtatásokat
  static createRollbackPoint(): {
    rollbackId: string;
    timestamp: string;
    componentState: any;
  } {
    const rollbackId = `rollback_${Date.now()}`;
    const timestamp = new Date().toISOString();

    const componentState = {
      currentVersion: 'TeljesKaramTortenelem_original',
      features: [
        'handleBullPhysicalAssignment',
        'real_time_checkbox_sync', 
        'event_timeline_display',
        'harem_metadata_complex'
      ]
    };

    const rollbackData = {
      rollbackId,
      timestamp,
      componentState
    };

    // Böngésző tárhelyre mentés
    if (typeof window !== 'undefined') {
      localStorage.setItem(rollbackId, JSON.stringify(rollbackData));
      console.log(`🛡️ Rollback pont létrehozva: ${rollbackId}`);
    }

    return rollbackData;
  }
}