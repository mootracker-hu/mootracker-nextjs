// 🚩 lib/migration/FeatureFlags.ts

export class FeatureFlags {
  // Alapértelmezett beállítások
  private static readonly DEFAULT_FLAGS = {
    // Komponens váltás
    USE_V2_TELJES_KARAM_TORTENELEM: false,
    USE_ISOLATED_EVENT_TIMELINE: false,
    USE_SEPARATED_BULL_SERVICE: false,
    
    // Funkcionalitás
    ENABLE_REAL_TIME_CHECKBOX_SYNC: true,
    ENABLE_PERFORMANCE_MONITORING: true,
    
    // Biztonság
    ENABLE_FALLBACK_TO_V1: true,
    ENABLE_AUTO_ROLLBACK: true,
    
    // Bevezetés százaléka
    ROLLOUT_PERCENTAGE: 0
  };

  private static flags: Record<string, boolean | number> = { ...this.DEFAULT_FLAGS };

  // INICIALIZÁLÁS: Flag-ek betöltése
  static init(): void {
    console.log('🚩 Feature flags inicializálása...');
    
    // Böngésző tárhelyről betöltés ha van
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('migration_feature_flags');
      if (stored) {
        try {
          const storedFlags = JSON.parse(stored);
          this.flags = { ...this.DEFAULT_FLAGS, ...storedFlags };
          console.log('✅ Feature flags betöltve tárhelyről');
        } catch (error) {
          console.warn('⚠️ Feature flags hibás, alapértelmezett használata');
        }
      }
    }
  }

  // FLAG LEKÉRDEZÉSE
  static get(flag: keyof typeof FeatureFlags.DEFAULT_FLAGS): boolean | number {
    return this.flags[flag] ?? this.DEFAULT_FLAGS[flag];
  }

  // FLAG BEÁLLÍTÁSA
  static set(flag: keyof typeof FeatureFlags.DEFAULT_FLAGS, value: boolean | number): void {
    this.flags[flag] = value;
    
    // Böngésző tárhelyre mentés
    if (typeof window !== 'undefined') {
      localStorage.setItem('migration_feature_flags', JSON.stringify(this.flags));
    }

    console.log(`🚩 Flag frissítve: ${flag} = ${value}`);
  }

  // ÖSSZES FLAG LEKÉRDEZÉSE
  static getAll(): Record<string, boolean | number> {
    return { ...this.flags };
  }

  // ALAPÉRTELMEZETT VISSZAÁLLÍTÁSA
  static reset(): void {
    this.flags = { ...this.DEFAULT_FLAGS };
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('migration_feature_flags');
    }
    
    console.log('🔄 Feature flags alapértelmezettre állítva');
  }

  // FLAG-EK STÁTUSZ KIÍRÁSA
  static printStatus(): void {
    console.log('🚩 FEATURE FLAGS STÁTUSZ:');
    console.log('========================');
    
    Object.entries(this.flags).forEach(([flag, value]) => {
      const emoji = value ? '✅' : '❌';
      console.log(`${emoji} ${flag}: ${value}`);
    });
  }
}

// Automatikus inicializálás
FeatureFlags.init();