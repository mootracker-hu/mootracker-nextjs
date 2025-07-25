// 🧪 scripts/testMigration.ts
import { SafetySystem } from '@/lib/migration/SafetySystem';
import { FeatureFlags } from '@/lib/migration/FeatureFlags';

// FŐFUNKCIÓ: Migration tesztelése
export async function testMigration(): Promise<void> {
  console.log('🧪 MIGRATION TESZT INDÍTÁSA');
  console.log('============================');

  try {
    // 1. FEATURE FLAGS TESZT
    console.log('\n🚩 1. Feature flags teszt...');
    FeatureFlags.printStatus();

    // 2. BACKUP TESZT
    console.log('\n💾 2. Backup teszt indítása...');
    const backupResult = await SafetySystem.createMigrationBackup();
    
    if (backupResult.success) {
      console.log('✅ BACKUP SIKERES!');
      console.log(`📋 Backup ID: ${backupResult.backupId}`);
      console.log('📊 Mentett táblák:');
      
      Object.entries(backupResult.recordCounts).forEach(([table, count]) => {
        console.log(`   - ${table}: ${count} rekord`);
      });
    } else {
      console.log('❌ BACKUP SIKERTELEN!');
      console.log(`Hiba: ${backupResult.error}`);
      return;
    }

    // 3. RENDSZER INTEGRITÁS TESZT
    console.log('\n🔍 3. Rendszer integritás teszt...');
    const integrityResult = await SafetySystem.validateSystemIntegrity();
    
    if (integrityResult.valid) {
      console.log('✅ RENDSZER INTEGRITÁS: OK');
    } else {
      console.log('⚠️ RENDSZER INTEGRITÁS PROBLÉMÁK:');
      integrityResult.issues.forEach(issue => {
        console.log(`   - ${issue}`);
      });
    }

    console.log('\n📊 Rendszer metrikák:');
    Object.entries(integrityResult.metrics).forEach(([key, value]) => {
      console.log(`   - ${key}: ${value}`);
    });

    // 4. ROLLBACK PONT TESZT
    console.log('\n🛡️ 4. Rollback pont teszt...');
    const rollbackPoint = SafetySystem.createRollbackPoint();
    console.log(`✅ Rollback pont: ${rollbackPoint.rollbackId}`);

    // 5. ÖSSZEFOGLALÓ
    console.log('\n🎉 TESZT BEFEJEZVE');
    console.log('==================');
    
    const kritikusProblémák = integrityResult.issues.filter(issue => 
      issue.includes('adatbázis') || issue.includes('backup')
    );
    
    if (kritikusProblémák.length === 0) {
      console.log('✅ Minden rendben! A migration folytatható.');
      console.log('📋 Következő lépés: Phase 1 - Komponens izolálás');
    } else {
      console.log('🚨 Kritikus problémák! Migration nem indítható.');
      kritikusProblémák.forEach(problem => {
        console.log(`   - ${problem}`);
      });
    }

  } catch (error) {
    console.error('💥 TESZT HIBA:', error);
    console.log('🚨 Migration biztonsági okokból leállítva.');
  }
}

// Browser-ben elérhető globális funkció (development)
if (typeof window !== 'undefined') {
  (window as any).testMigration = testMigration;
  (window as any).FeatureFlags = FeatureFlags;
  (window as any).SafetySystem = SafetySystem;
  
  console.log('🎯 FEJLESZTŐI FUNKCIÓK ELÉRHETŐK:');
  console.log('- testMigration() - teljes teszt futtatása');
  console.log('- FeatureFlags.printStatus() - flag-ek megtekintése');
  console.log('- SafetySystem.createMigrationBackup() - backup készítése');
}