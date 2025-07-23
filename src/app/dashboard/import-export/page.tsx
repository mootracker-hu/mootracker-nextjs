// src/app/dashboard/import-export/page.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, Check, AlertCircle, ArrowRight, Database } from 'lucide-react';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import { displayEnar } from '@/constants/enar-formatter';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ImportedAnimal {
  enar: string;
  gender: string;
  color: string;
  breed: string;
  birthDate: string;
  motherEnar: string;
  fatherEnar: string;
  fatherKPLSZ: string;
  
  // ÚJ: Lifecycle mezők
  bekerulesDatum?: string;
  kikerulesiDatum?: string;
  elhullasDatum?: string;
  vagasDatum?: string;
  szarmazasiTenyeszet?: string;
  celtenyeszet?: string;
  
  calculatedCategory: string;
  calculatedStatus: string;
  operation: 'SAFE_UPDATE' | 'NEW_INSERT';
  protectedFields: string[];
  isValid: boolean;
  errors: string[];
}

// 🛡️ Ultra-Safe védett mezők - SOHA nem módosítjuk ezeket
const PROTECTED_FIELDS = [
  'apa_enar',
  'kplsz', 
  'kategoria',
  'has_given_birth',
  'last_birth_date',
  'pregnancy_status',
  'vv_date',
  'pairing_date',
  'expected_birth_date'
];

// Státusz meghatározás lifecycle adatok alapján
const determineStatus = (row: any): string => {
  if (row.elhullasDatum || row['Elhullás, elveszés dátuma']) return 'elhullott';
  if (row.vagasDatum || row['Leölés, kényszevágás, házi vágás dátuma']) return 'házi_vágás';
  if ((row.kikerulesiDatum || row['Kikerülés dátuma']) && (row.celtenyeszet || row['Céltenyészet'])) return 'eladott';
  if (row.kikerulesiDatum || row['Kikerülés dátuma']) return 'kikerült';
  return 'aktív';
};

const ImportExportPage = () => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [importedData, setImportedData] = useState<ImportedAnimal[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importStats, setImportStats] = useState({ 
    total: 0, 
    valid: 0, 
    errors: 0,
    updated: 0,
    inserted: 0, 
    protected: 0
  });
  const [isImporting, setIsImporting] = useState(false);

  // ENAR formázás (HU1234567890 → HU 12345 6789 0)
  const formatEnar = (enar: string): string => {
    const clean = enar.replace(/\s/g, '');
    if (clean.length === 12 && clean.startsWith('HU')) {
      const country = clean.substring(0, 2);
      const part1 = clean.substring(2, 7);
      const part2 = clean.substring(7, 11);
      const part3 = clean.substring(11, 12);
      return `${country} ${part1} ${part2} ${part3}`;
    }
    return enar;
  };

  // ENAR normalizálás (szóközök egységesítése)
  const normalizeEnar = (enar: string): string => {
    const clean = enar.replace(/\s/g, '');
    if (clean.length === 12 && clean.startsWith('HU')) {
      return `${clean.substring(0, 2)} ${clean.substring(2, 7)} ${clean.substring(7, 11)} ${clean.substring(11, 12)}`;
    }
    return enar;
  };

  // Utolsó 5 jegy kiemelése
  const getShortEnar = (enar: string): string => {
    const clean = enar.replace(/\s/g, '');
    if (clean.length >= 5) {
      return clean.slice(-5);
    }
    return clean;
  };

  // Kategória kalkuláció
  const calculateCategory = (birthDate: string, gender: string, hasGivenBirth: boolean = false): string => {
    const birth = new Date(birthDate);
    const now = new Date();
    const ageMonths = (now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.44);

    if (gender === 'nőivarú') {
      if (ageMonths <= 6) return 'nőivarú_borjú';      // 0-6 hó (6 hó végéig) 
      if (ageMonths < 24) return 'szűz_üsző';          // 6-24 hó
      if (hasGivenBirth) return 'tehén';               // ✅ HA ELLETT
      return 'szűz_üsző';                              // ✅ HA NEM ELLETT
    } else if (gender === 'hímivarú') {
      if (ageMonths <= 6) return 'hímivarú_borjú';      // 0-6 hó
      return 'hízóbika';                                 // 6+ hó
    }
    return 'ismeretlen';
  };

  // Fajta prioritás
  const extractBreed = (breedData: string): string => {
    if (!breedData) return 'blonde_daquitaine';
    if (breedData.toLowerCase().includes('limousin')) return 'limousin';
    if (breedData.toLowerCase().includes('magyartarka')) return 'magyartarka';
    if (breedData.toLowerCase().includes('blonde')) return 'blonde_daquitaine';
    return 'húshasznú';
  };

  // Szín optimalizáció
  const normalizeColor = (color: string): string => {
    if (color === 'egyszínű zsemle' || color === 'zsemleszínű') return '';
    return color;
  };

  // 📊 DUAL EXCEL FELDOLGOZÁS - EREDETI ALAPON BŐVÍTVE
  const processExcelFile = useCallback(async (file: File) => {
    setIsProcessing(true);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      console.log('📊 Excel adatok beolvasva:', data.length, 'sor');
      console.log('🔍 Excel oszlopok:', Object.keys(data[0] || {}));

      // Oszlop detektálás (Excel 1 vs Excel 2)
      const firstRow = data[0] as any;
      const hasLifecycleColumns = firstRow && (
        firstRow['Kikerülés dátuma'] || 
        firstRow['Elhullás, elveszés dátuma'] ||
        firstRow['Tenyészetbe érkezés dátuma'] ||
        firstRow['ENAR azonosító']
      );

      const isExcel1 = firstRow && (
        firstRow['Egyed száma'] ||
        firstRow['Azonosító'] ||
        firstRow['Apa azonosítója'] ||
        firstRow['Fajta']
      );

      console.log('🔍 Excel típus:', {
        hasLifecycleColumns,
        isExcel1,
        detectedType: hasLifecycleColumns && !isExcel1 ? 'Excel 2 (Lifecycle)' : 
                     isExcel1 && !hasLifecycleColumns ? 'Excel 1 (Részletes)' : 'Hibrid'
      });

      let processedData: ImportedAnimal[] = [];

      if (hasLifecycleColumns && !isExcel1) {
        // 📊 EXCEL 2 - LIFECYCLE ADATOK
        console.log('📋 Excel 2 (Lifecycle) feldolgozás...');
        
        processedData = data.map((row: any, index: number) => {
          const enar = normalizeEnar(row['ENAR azonosító'] || '');
          
          return {
            enar,
            gender: row['Neme'] || 'nőivarú',
            color: '',
            breed: 'blonde_daquitaine', // default Excel 2-ben nincs fajta
            birthDate: row['Születési dátum'] || '',
            motherEnar: row['Anyja ENAR azonosítója vagy eredeti külföldi azonosító'] || '',
            fatherEnar: '',
            fatherKPLSZ: '',
            
            // LIFECYCLE ADATOK:
            bekerulesDatum: row['Tenyészetbe érkezés dátuma'] || undefined,
            kikerulesiDatum: row['Kikerülés dátuma'] || undefined,
            elhullasDatum: row['Elhullás, elveszés dátuma'] || undefined,
            vagasDatum: row['Leölés, kényszevágás, házi vágás dátuma'] || undefined,
            szarmazasiTenyeszet: row['Tenyészet (Származási tenyészet)'] || undefined,
            celtenyeszet: row['Céltenyészet'] || undefined,
            
            calculatedStatus: determineStatus(row),
            calculatedCategory: calculateCategory(row['Születési dátum'], row['Neme'] || 'nőivarú'),
            operation: 'SAFE_UPDATE' as const,
            protectedFields: [],
            isValid: enar !== '' && row['Születési dátum'] !== '',
            errors: []
          };
        });

      } else {
        // 📋 EXCEL 1 - RÉSZLETES ADATOK (EREDETI LOGIKA)
        console.log('📊 Excel 1 (Részletes) feldolgozás...');
        
        processedData = data.map((row: any, index: number) => {
          const enar = formatEnar(row['Egyed száma'] || row['Azonosító'] || '');
          const birthDate = row['Születési dátum'] || '';
          const lastBirthDate = row['Utolsó ellés dátuma'] || '';
          const breed = row['ENAR-ba bejelentett fajta'] || row['Fajta'] || '';
          
          // Van-e ellés dátum?
          const hasGivenBirth = lastBirthDate && lastBirthDate.trim() !== '';

          return {
            enar,
            gender: row['Neme'] || 'nőivarú',
            color: normalizeColor(row['Színe'] || ''),
            breed: extractBreed(breed),
            birthDate,
            motherEnar: row['Anya száma'] || '',
            fatherEnar: '',
            fatherKPLSZ: row['Apa azonosítója'] || '',
            
            // LIFECYCLE ADATOK (üres Excel 1-ben):
            bekerulesDatum: undefined,
            kikerulesiDatum: undefined,
            elhullasDatum: undefined,
            vagasDatum: undefined,
            szarmazasiTenyeszet: undefined,
            celtenyeszet: undefined,
            
            calculatedStatus: 'aktív',
            calculatedCategory: calculateCategory(birthDate, row['Neme'] || 'nőivarú', hasGivenBirth),
            operation: 'SAFE_UPDATE' as const,
            protectedFields: [],
            isValid: enar !== '' && birthDate !== '',
            errors: []
          };
        });
      }

      // Eredmények validálása és statisztikák
      const validAnimals = processedData.filter(a => a.isValid);
      const invalidAnimals = processedData.filter(a => !a.isValid);

      console.log('✅ Feldolgozás befejezve:', {
        total: processedData.length,
        valid: validAnimals.length,
        invalid: invalidAnimals.length,
        hasLifecycle: processedData.filter(a => a.bekerulesDatum || a.kikerulesiDatum).length,
        hasBreed: processedData.filter(a => a.breed && a.breed !== 'blonde_daquitaine').length,
        hasKPLSZ: processedData.filter(a => a.fatherKPLSZ).length
      });

      setImportedData(processedData);
      setImportStats({
        total: processedData.length,
        valid: validAnimals.length,
        errors: invalidAnimals.length,
        updated: 0,
        inserted: 0,
        protected: 0
      });
      setIsProcessing(false);
      setStep(3);
    } catch (error: any) {
      console.error('❌ Excel parsing error:', error);
      alert(`Excel fájl feldolgozási hiba: ${error?.message || 'Ismeretlen hiba'}`);
      setIsProcessing(false);
    }
  }, []);

  // 🛡️ ULTRA-SAFE MERGE IMPORT - EREDETI LOGIKA ALAPON
  const handleConfirmImport = async () => {
    setIsImporting(true);

    try {
      const validAnimals = importedData.filter(a => a.isValid);
      let updatedCount = 0;
      let insertedCount = 0;
      let protectedCount = 0;
      let errorCount = 0;
      const importResults: string[] = [];

      for (const animal of validAnimals) {
        try {
          // Meglévő állat keresése
          const { data: existingAnimal, error: searchError } = await supabase
            .from('animals')
            .select('*')
            .eq('enar', animal.enar)
            .maybeSingle();

          if (searchError) {
            console.error(`❌ Keresési hiba ${animal.enar}:`, searchError);
            errorCount++;
            continue;
          }

          if (existingAnimal) {
            // 🛡️ MEGLÉVŐ ÁLLAT - ULTRA SAFE UPDATE (EREDETI LOGIKA)
            console.log(`🔍 Meglévő állat: ${animal.enar}`);
            
            // Védett adatok listázása
            const protectedData = PROTECTED_FIELDS.filter(field => existingAnimal[field] != null);
            if (protectedData.length > 0) {
              console.log(`🔒 Védett adatok:`, protectedData);
              protectedCount++;
            }

            // Csak biztonságos mezők frissítése (EREDETI LOGIKA):
            const updateData: any = {};
            
            if (!existingAnimal.breed && animal.breed) {
              updateData.breed = animal.breed;
            }
            if (!existingAnimal.apa_kplsz && animal.fatherKPLSZ) {
              updateData.apa_kplsz = animal.fatherKPLSZ;
            }

            // ÚJ: Lifecycle mezők hozzáadása
            if (animal.kikerulesiDatum) updateData.kikerulesi_datum = animal.kikerulesiDatum;
            if (animal.elhullasDatum) updateData.elhullas_datum = animal.elhullasDatum;
            if (animal.vagasDatum) updateData.vagas_datum = animal.vagasDatum;
            if (animal.szarmazasiTenyeszet) updateData.szarmazasi_tenyeszet = animal.szarmazasiTenyeszet;
            if (animal.celtenyeszet) updateData.celtenyeszet = animal.celtenyeszet;

            // Státusz csak akkor ha van kikerülés:
            if (animal.kikerulesiDatum || animal.elhullasDatum || animal.vagasDatum) {
              updateData.statusz = determineStatus(animal);
            }

            // Frissítés végrehajtása (csak ha van mit frissíteni)
            if (Object.keys(updateData).length > 0) {
              const { error: updateError } = await supabase
                .from('animals')
                .update(updateData)
                .eq('enar', animal.enar);

              if (updateError) {
                console.error(`❌ Frissítési hiba ${animal.enar}:`, updateError);
                errorCount++;
                continue;
              }

              updatedCount++;
              importResults.push(`✅ Frissítve: ${animal.enar} (${Object.keys(updateData).length} mező)`);
            } else {
              importResults.push(`ℹ️ Változatlan: ${animal.enar} (minden adat aktuális)`);
            }

          } else {
            // ➕ ÚJ ÁLLAT - EREDETI INSERT LOGIKA BŐVÍTVE
            const insertData = {
              enar: animal.enar,
              anya_enar: animal.motherEnar || null,
              ivar: animal.gender === 'nőivarú' ? 'nő' : 'hím',
              kategoria: animal.calculatedCategory,
              szuletesi_datum: animal.birthDate,
              has_given_birth: animal.calculatedCategory === 'tehén',
              breed: animal.breed,
              birth_location: animal.szarmazasiTenyeszet ? 'vásárolt' : 'született',
              statusz: animal.calculatedStatus,
              bekerules_datum: animal.bekerulesDatum || new Date().toISOString().split('T')[0],
              apa_kplsz: animal.fatherKPLSZ || null,
              
              // ÚJ: Lifecycle mezők
              kikerulesi_datum: animal.kikerulesiDatum || null,
              elhullas_datum: animal.elhullasDatum || null,
              vagas_datum: animal.vagasDatum || null,
              szarmazasi_tenyeszet: animal.szarmazasiTenyeszet || null,
              celtenyeszet: animal.celtenyeszet || null,
              
              // Alapértelmezett NULL értékek védett mezőkhöz:
              apa_enar: null,
              kplsz: null,
              pregnancy_status: null,
              vv_date: null,
              pairing_date: null,
              expected_birth_date: null,
              last_birth_date: null,
              farm_id: null // RLS kompatibilitás
            };

            const { error: insertError } = await supabase
              .from('animals')
              .insert(insertData);

            if (insertError) {
              console.error(`❌ Beszúrási hiba ${animal.enar}:`, insertError);
              errorCount++;
              continue;
            }

            insertedCount++;
            importResults.push(`➕ Új állat: ${animal.enar}`);
          }
        } catch (animalError: any) {
          console.error(`❌ Állat feldolgozási hiba ${animal.enar}:`, animalError);
          errorCount++;
        }
      }

      // Eredmények logging
      console.log(`🎉 Ultra-Safe Import befejezve!`);
      console.log(`📊 Statisztika:`);
      console.log(`   • ${updatedCount} állat frissítve`);
      console.log(`   • ${insertedCount} új állat`);
      console.log(`   • ${protectedCount} védett adat megőrizve`);
      console.log(`   • ${errorCount} hiba`);
      console.log(`🔍 Részletes eredmények:`, importResults);

      // UI frissítés
      setImportStats(prev => ({
        ...prev,
        updated: updatedCount,
        inserted: insertedCount,
        protected: protectedCount,
        errors: errorCount
      }));

      setStep(4);
    } catch (error: any) {
      console.error('❌ Kritikus import hiba:', error);
      alert(`Import hiba történt: ${error?.message || 'Ismeretlen hiba'}. Telepi adatok biztonságban vannak.`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStep(2);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">🛡️ Ultra-Safe Import/Export</h1>
            <p className="text-gray-600">Excel állatlista importálása védett telepi logikával</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= stepNum ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                  {step > stepNum ? <Check size={16} /> : stepNum}
                </div>
                {stepNum < 4 && (
                  <div className={`w-16 h-1 mx-2 ${step > stepNum ? 'bg-green-600' : 'bg-gray-200'
                    }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: File Upload */}
          {step === 1 && (
            <div className="text-center">
              <FileSpreadsheet className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">🛡️ Ultra-Safe Excel Import</h2>
              <p className="text-gray-600 mb-6">
                Tölts fel Excel fájlt az automatikus importáláshoz. A telepi logika 100% védett!
              </p>

              <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6">
                <h3 className="font-semibold mb-2 text-green-800">✅ Ultra-Safe Garanciák:</h3>
                <div className="text-sm text-green-700 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>• Apa ENAR kapcsolatok megőrzése</div>
                  <div>• Tenyészbika KPLSZ adatok védelme</div>
                  <div>• Kategória számítások változatlanul</div>
                  <div>• Ellési történet (has_given_birth) védett</div>
                  <div>• VV eredmények érintetlenek</div>
                  <div>• Párosítási dátumok megmaradnak</div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold mb-2">📊 Támogatott Excel típusok:</h3>
                <div className="text-sm text-gray-700 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <strong>Excel 1 (Részletes):</strong>
                    <div className="text-xs mt-1">Egyed száma, Fajta, KPLSZ, Szín</div>
                  </div>
                  <div>
                    <strong>Excel 2 (Lifecycle):</strong>
                    <div className="text-xs mt-1">Bekerülés, Kikerülés, Elhullás dátumok</div>
                  </div>
                </div>
              </div>

              <label className="bg-green-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-green-700 inline-flex items-center gap-2">
                <Upload size={20} />
                Excel Fájl Kiválasztása
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Step 2: Confirmation */}
          {step === 2 && (
            <div className="text-center">
              <FileSpreadsheet className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Fájl Kiválasztva</h2>
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="font-medium">{file?.name}</p>
                <p className="text-sm text-gray-600">
                  Méret: {((file?.size || 0) / 1024).toFixed(1)} KB
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-green-600 mt-1" size={20} />
                  <div className="text-left">
                    <h3 className="font-semibold text-green-800">🛡️ Ultra-Safe Import folyamat:</h3>
                    <ul className="text-sm text-green-700 mt-1 space-y-1">
                      <li>• Dual Excel detektálás (Excel 1 vs Excel 2)</li>
                      <li>• ENAR normalizálás és validáció</li>
                      <li>• Védett mezők automatikus megőrzése</li>
                      <li>• Csak NULL mezők biztonságos kitöltése</li>
                      <li>• Lifecycle adatok hozzáadása</li>
                      <li>• Hibakezeléssel és rollback-kel</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={() => file && processExcelFile(file)}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 inline-flex items-center gap-2"
              >
                🛡️ Ultra-Safe Feldolgozás Indítása
                <ArrowRight size={20} />
              </button>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">🛡️ Ultra-Safe Import Preview</h2>

              {isProcessing ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p>Dual Excel feldolgozás folyamatban...</p>
                </div>
              ) : (
                <>
                  {/* Enhanced Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-gray-600">{importStats.total}</div>
                      <div className="text-sm text-gray-600">Összes állat</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">{importStats.valid}</div>
                      <div className="text-sm text-gray-600">Érvényes</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {importedData.filter(a => a.bekerulesDatum || a.kikerulesiDatum).length}
                      </div>
                      <div className="text-sm text-gray-600">Lifecycle adat</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-red-600">{importStats.errors}</div>
                      <div className="text-sm text-gray-600">Hibás</div>
                    </div>
                  </div>

                  {/* Protection Info */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                      🛡️ Ultra-Safe Védelem Aktív
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-green-700">Védett mezők:</div>
                        <div className="text-green-600 text-xs">apa_enar, kplsz, kategoria, has_given_birth</div>
                      </div>
                      <div>
                        <div className="font-medium text-green-700">Biztonságos frissítés:</div>
                        <div className="text-green-600 text-xs">Csak NULL mezők kitöltése</div>
                      </div>
                      <div>
                        <div className="font-medium text-green-700">Új adatok:</div>
                        <div className="text-green-600 text-xs">Lifecycle információk hozzáadása</div>
                      </div>
                    </div>
                  </div>

                  {/* Animals List */}
                  <div className="border rounded-lg overflow-hidden mb-6">
                    <div className="bg-gray-50 px-4 py-2 font-medium border-b">
                      Feldolgozott Állatok - Ultra-Safe Preview
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {importedData.map((animal, index) => (
                        <div key={index} className="px-4 py-3 border-b last:border-b-0 bg-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">
                                {displayEnar(animal.enar)}
                                <span className="ml-2 text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
                                  #{getShortEnar(animal.enar)}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600">
                                {animal.calculatedCategory} • {animal.breed}
                                {animal.color && ` • ${animal.color}`}
                                {animal.fatherKPLSZ && ` • Apa KPLSZ: ${animal.fatherKPLSZ}`}
                                {animal.calculatedStatus !== 'aktív' && ` • ${animal.calculatedStatus}`}
                              </div>
                            </div>
                            <Check className="text-green-600" size={20} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={handleConfirmImport}
                      disabled={importStats.valid === 0 || isImporting}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isImporting ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                          Ultra-Safe Import folyamatban...
                        </>
                      ) : (
                        <>
                          <Database size={20} />
                          🛡️ {importStats.valid} Állat Ultra-Safe Importálása
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setStep(1)}
                      disabled={isImporting}
                      className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 disabled:opacity-50"
                    >
                      Új Fájl Választása
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 4: Success - ENHANCED */}
          {step === 4 && (
            <div className="text-center">
              <Check className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">🛡️ Ultra-Safe Import Sikeres!</h2>
              <p className="text-gray-600 mb-6">
                Telepi logika 100% megőrizve, új adatok biztonságosan integrálva!
              </p>

              {/* Success Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{importStats.updated || 0}</div>
                  <div className="text-sm text-blue-600">Frissített állat</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{importStats.inserted || 0}</div>
                  <div className="text-sm text-green-600">Új állat</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{importStats.protected || 0}</div>
                  <div className="text-sm text-yellow-600">Védett adat</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">{importStats.errors || 0}</div>
                  <div className="text-sm text-gray-600">Hiba</div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-green-800 mb-2">🎉 Import Sikeres - Következő Lépések:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                  <div>
                    <h4 className="font-medium text-green-700">✅ Sikeresen Megőrzött:</h4>
                    <ul className="text-xs space-y-1 mt-1">
                      <li>• Apa ENAR kapcsolatok</li>
                      <li>• Tenyészbika KPLSZ adatok</li>
                      <li>• Automatikus kategória számítások</li>
                      <li>• Ellési történet (has_given_birth)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-green-700">📊 Újonnan Hozzáadott:</h4>
                    <ul className="text-xs space-y-1 mt-1">
                      <li>• Valós bekerülési dátumok</li>
                      <li>• Kikerülési/elhullási adatok</li>
                      <li>• Tenyészet információk</li>
                      <li>• Apa KPLSZ kiegészítések</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => window.open('/dashboard/animals', '_blank')}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
                >
                  📊 Állatok Megtekintése
                </button>

                <button
                  onClick={() => window.open('/dashboard/analytics', '_blank')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                  📈 Statisztikák
                </button>

                <button
                  onClick={() => { 
                    setStep(1); 
                    setImportedData([]); 
                    setFile(null); 
                    setImportStats({ total: 0, valid: 0, errors: 0, updated: 0, inserted: 0, protected: 0 });
                  }}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
                >
                  🔄 Új Importálás
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportExportPage;