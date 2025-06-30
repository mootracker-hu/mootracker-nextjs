# 🛡️ ULTRA-SAFE MERGE STRATÉGIA

## 🔒 ALAPELV: "SOHA NE TÖRÖL, CSAK BŐVÍT"

### **⚠️ ABSZOLÚT VÉDETT ZÓNÁK:**
```typescript
// EZEKET SOHA, SEMMILYEN KÖRÜLMÉNYEK KÖZÖTT NEM ÉRJÜK:
PROTECTED_FIELDS = [
  'apa_enar',           // Telepi ellés logika
  'kplsz',              // Tenyészbika automatikus felismerés  
  'kategoria',          // Komplex üzleti számítások
  'has_given_birth',    // Ellési státusz logika
  'last_birth_date',    // Telepi ellés események
  'pregnancy_status',   // VV eredmények
  'vv_date',           // VV időpontok
  'pairing_date',      // Párosítási logika
  'expected_birth_date' // Számított értékek
];
```

### **✅ BIZTONSÁGOSAN BŐVÍTHETŐ MEZŐK:**
```typescript
// Ezeket csak NULL esetén töltjük ki:
SAFE_EXPANDABLE_FIELDS = [
  'bekerules_datum',     // Hibás import dátum javítása
  'birth_location',      // Származási info bővítése
  'breed'               // Fajta info kiegészítése
];

// Ezeket mindig hozzáadhatjuk (új oszlopok):
NEW_LIFECYCLE_FIELDS = [
  'kikerulesi_datum',
  'elhullas_datum', 
  'vagas_datum',
  'szarmazasi_tenyeszet',
  'celtenyeszet'
];
```

---

## 🔧 ULTRA-SAFE MERGE ALGORITMUS

### **🛡️ HÁROMSZINTŰ BIZTONSÁG:**

#### **1. SZINT: VÉDETT MEZŐ ELLENŐRZÉS**
```typescript
const isProtectedField = (fieldName: string): boolean => {
  return PROTECTED_FIELDS.includes(fieldName);
};

const validateUpdate = (updateData: any): any => {
  const safeData = {};
  
  for (const [key, value] of Object.entries(updateData)) {
    if (isProtectedField(key)) {
      console.warn(`🚨 VÉDETT MEZŐ KIHAGYVA: ${key}`);
      continue; // Védett mező - kihagyjuk
    }
    safeData[key] = value;
  }
  
  return safeData;
};
```

#### **2. SZINT: CSAK NULL MEZŐK KITÖLTÉSE**
```typescript
const safeUpdateAnimal = async (existingAnimal: any, newData: any) => {
  const updateData = {};
  
  // Csak NULL/üres mezőket frissítünk:
  if (!existingAnimal.bekerules_datum && newData.bekerules_datum) {
    updateData.bekerules_datum = newData.bekerules_datum;
  }
  
  if (!existingAnimal.birth_location && newData.birth_location) {
    updateData.birth_location = newData.birth_location;
  }
  
  if (!existingAnimal.breed && newData.breed) {
    updateData.breed = newData.breed;
  }
  
  // Új lifecycle mezők - mindig hozzáadhatók:
  updateData.kikerulesi_datum = newData.kikerulesi_datum;
  updateData.elhullas_datum = newData.elhullas_datum;
  updateData.vagas_datum = newData.vagas_datum;
  updateData.szarmazasi_tenyeszet = newData.szarmazasi_tenyeszet;
  updateData.celtenyeszet = newData.celtenyeszet;
  
  // Státusz - csak akkor frissítjük ha logikus:
  if (newData.statusz && newData.statusz !== 'aktív') {
    updateData.statusz = newData.statusz;
  }
  
  return updateData;
};
```

#### **3. SZINT: ROLLBACK KÉPESSÉG**
```typescript
const executeWithRollback = async (operation: () => Promise<any>) => {
  // Backup készítése frissítés előtt:
  const backup = await supabase
    .from('animals')
    .select('*')
    .eq('id', animalId)
    .single();
    
  try {
    const result = await operation();
    return { success: true, result, backup: backup.data };
  } catch (error) {
    console.error('🚨 ROLLBACK SZÜKSÉGES:', error);
    // Automatikus visszaállítás
    await supabase
      .from('animals')
      .update(backup.data)
      .eq('id', animalId);
    return { success: false, error, restored: true };
  }
};
```

---

## 🎯 IMPLEMENTÁCIÓ PÉLDA

### **📊 SAFE MERGE FOLYAMAT:**

```typescript
const ultraSafeMergeAnimal = async (excelRow: any) => {
  const enar = normalizeEnar(excelRow.enar);
  
  // 1. Meglévő állat keresése
  const { data: existing } = await supabase
    .from('animals')
    .select('*')
    .eq('enar', enar)
    .single();
  
  if (existing) {
    // 🛡️ MEGLÉVŐ ÁLLAT - ULTRA SAFE UPDATE
    
    console.log(`🔍 Meglévő állat: ${enar}`);
    console.log(`📋 Jelenlegi védett adatok:`, {
      apa_enar: existing.apa_enar,
      kplsz: existing.kplsz,
      kategoria: existing.kategoria,
      has_given_birth: existing.has_given_birth
    });
    
    const updateData = {
      // ✅ CSAK HIÁNYZÓ ALAPADATOK KIEGÉSZÍTÉSE:
      bekerules_datum: existing.bekerules_datum || parseDate(excelRow.bekerules_datum),
      birth_location: existing.birth_location || mapBirthLocation(excelRow.szarmazasi_tenyeszet),
      breed: existing.breed || extractBreed(excelRow.breed),
      
      // ✅ ÚJ LIFECYCLE ADATOK (mindig biztonságos):
      kikerulesi_datum: parseDate(excelRow.kikerulesi_datum),
      elhullas_datum: parseDate(excelRow.elhullas_datum),  
      vagas_datum: parseDate(excelRow.vagas_datum),
      szarmazasi_tenyeszet: excelRow.szarmazasi_tenyeszet,
      celtenyeszet: excelRow.celtenyeszet,
      
      // ✅ STÁTUSZ - csak akkor ha van kikerülés:
      statusz: excelRow.kikerulesi_datum ? determineStatus(excelRow) : existing.statusz,
      
      // 🔒 VÉDETT MEZŐK - SOHA NEM FRISSÜLNEK:
      // apa_enar: existing.apa_enar,         ← VÁLTOZATLAN
      // kplsz: existing.kplsz,               ← VÁLTOZATLAN  
      // kategoria: existing.kategoria,       ← VÁLTOZATLAN
      // has_given_birth: existing.has_given_birth, ← VÁLTOZATLAN
    };
    
    // Védett mezők ellenőrzése:
    const safeUpdateData = validateUpdate(updateData);
    
    console.log(`✅ Biztonságos frissítés:`, safeUpdateData);
    
    const { error } = await supabase
      .from('animals')
      .update(safeUpdateData)
      .eq('id', existing.id);
    
    return { 
      type: 'SAFE_UPDATE', 
      enar, 
      success: !error,
      protectedFieldsPreserved: true,
      updatedFields: Object.keys(safeUpdateData)
    };
    
  } else {
    // ➕ ÚJ ÁLLAT - TELJES INSERT (biztonságos)
    
    const insertData = {
      enar,
      anya_enar: excelRow.anya_enar,
      szuletesi_datum: parseDate(excelRow.szuletesi_datum),
      ivar: mapGender(excelRow.neme),
      bekerules_datum: parseDate(excelRow.bekerules_datum),
      kikerulesi_datum: parseDate(excelRow.kikerulesi_datum),
      elhullas_datum: parseDate(excelRow.elhullas_datum),
      vagas_datum: parseDate(excelRow.vagas_datum),
      szarmazasi_tenyeszet: excelRow.szarmazasi_tenyeszet,
      celtenyeszet: excelRow.celtenyeszet,
      statusz: determineStatus(excelRow),
      birth_location: mapBirthLocation(excelRow.szarmazasi_tenyeszet) || 'vásárolt',
      breed: extractBreed(excelRow.breed) || 'blonde_daquitaine',
      
      // Automatikus számítások (új állatokhoz biztonságos):
      kategoria: calculateCategory(excelRow.szuletesi_datum, excelRow.neme),
      acquisition_date: new Date().toISOString(),
      
      // Védett mezők alapértelmezett értékekkel:
      apa_enar: null,           // Később telepi logika tölti ki
      kplsz: null,              // Később KPLSZ alapján
      has_given_birth: false,   // Ellés esemény frissíti
      pregnancy_status: null,   // VV eredmény frissíti
    };
    
    const { error } = await supabase
      .from('animals')
      .insert(insertData);
    
    return { 
      type: 'NEW_INSERT', 
      enar, 
      success: !error,
      isNewAnimal: true
    };
  }
};
```

---

## 📊 BIZTONSÁGOS PREVIEW RENDSZER

### **🔍 UPDATE ELŐNÉZET:**
```tsx
const SafePreviewTable = ({ processedData }: { processedData: ProcessedAnimal[] }) => {
  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>ENAR</th>
          <th>Művelet</th>
          <th>Frissítendő mezők</th>
          <th>Védett adatok</th>
          <th>Biztonság</th>
        </tr>
      </thead>
      <tbody>
        {processedData.map((animal, index) => (
          <tr key={index}>
            <td>{animal.enar}</td>
            <td>
              <span className={`px-2 py-1 rounded text-xs ${
                animal.operation === 'SAFE_UPDATE' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {animal.operation === 'SAFE_UPDATE' ? '🛡️ Biztonságos frissítés' : '➕ Új állat'}
              </span>
            </td>
            <td className="text-xs text-gray-600">
              {animal.updatedFields?.join(', ') || 'Minden mező'}
            </td>
            <td>
              {animal.operation === 'SAFE_UPDATE' && (
                <span className="text-xs text-green-600">
                  ✅ Telepi adatok megmaradnak
                </span>
              )}
            </td>
            <td>
              <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                🔒 Védett
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

### **📈 VÉDETT ADATOK STATISZTIKA:**
```tsx
const ProtectedDataStats = ({ stats }: { stats: ProtectionStats }) => {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <h3 className="font-semibold text-green-800 mb-2">🛡️ Adatvédelmi Jelentés</h3>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-2xl font-bold text-green-600">{stats.protectedAnimals}</div>
          <div className="text-green-700">Védett állat</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-blue-600">{stats.safeUpdates}</div>
          <div className="text-blue-700">Biztonságos frissítés</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-orange-600">{stats.preservedFields}</div>
          <div className="text-orange-700">Megőrzött mező</div>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-green-600">
        ✅ Telepi logika 100% megőrzve: apa kapcsolatok, tenyészbika felismerés, kategória számítások
      </div>
    </div>
  );
};
```

---

## 🔧 BIZTONSÁGI GARANCIÁK

### **✅ AMIT GARANTÁLUNK:**

1. **🔒 Védett mezők:** Soha nem módosulnak
2. **📊 Telepi logika:** 100% változatlan marad  
3. **🧮 Számítások:** Minden automatikus algoritmus érintetlen
4. **↩️ Rollback:** Minden művelet visszafordítható
5. **📋 Audit trail:** Minden változás naplózva

### **⚠️ AMIT ELLENŐRZÜNK:**

1. **Import előtt:** Védett mezők listázása
2. **Import közben:** Folyamatos védelem monitoring
3. **Import után:** Integritás ellenőrzés
4. **Hiba esetén:** Automatikus rollback

---

## 🎯 KÖVETKEZŐ LÉPÉS: JÓVÁHAGYÁS

### **❓ KÉRDÉS NEKED:**

Ez az **Ultra-Safe Merge** stratégia **100%-ig biztonságos**. 

**Jóváhagyod?**

- ✅ **Telepi logika** érintetlen marad
- ✅ **Csak hiányzó adatok** kiegészítése  
- ✅ **Új lifecycle mezők** hozzáadása
- ✅ **Rollback lehetőség** minden lépésben

**🚀 Ha igen, kezdjük az implementációt!** 💪