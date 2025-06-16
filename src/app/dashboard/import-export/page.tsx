// src/app/dashboard/import-export/page.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, Check, AlertCircle, ArrowRight, Database } from 'lucide-react';

interface ImportedAnimal {
  enar: string;
  gender: string;
  color: string;
  breed: string;
  birthDate: string;
  motherEnar: string;
  fatherEnar: string;
  fatherKPLSZ: string;
  calculatedCategory: string;
  isValid: boolean;
  errors: string[];
}

const ImportExportPage = () => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [importedData, setImportedData] = useState<ImportedAnimal[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importStats, setImportStats] = useState({ total: 0, valid: 0, errors: 0 });
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

  // Utolsó 5 jegy kiemelése
  const getShortEnar = (enar: string): string => {
    const clean = enar.replace(/\s/g, '');
    if (clean.length >= 5) {
      return clean.slice(-5);
    }
    return clean;
  };

  // Kategória kalkuláció
  const calculateCategory = (birthDate: string, gender: string): string => {
    const birth = new Date(birthDate);
    const now = new Date();
    const ageMonths = (now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.44);

    if (gender === 'nőivarú') {
      if (ageMonths < 12) return 'nőivarú_borjú';
      if (ageMonths < 24) return 'szűz_üsző';
      return 'szűz_üsző';
    } else if (gender === 'hímivarú') {
      if (ageMonths < 6) return 'hímivarú_borjú';
      return 'hízóbika';
    }
    return 'ismeretlen';
  };

  // Fajta prioritás
  const extractBreed = (breedData: string): string => {
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

  // Excel fájl feldolgozás
  const processExcelFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    
    // Mock Excel parsing - production-ban Papa Parse vagy SheetJS
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockData: ImportedAnimal[] = [
      {
        enar: formatEnar('HU300389120'),
        gender: 'nőivarú',
        color: normalizeColor('zsemleszínű'),
        breed: extractBreed('blonde d\'aquitaine 93.75%'),
        birthDate: '2022-03-04',
        motherEnar: formatEnar('HU300388757'),
        fatherEnar: '',
        fatherKPLSZ: '34144',
        calculatedCategory: calculateCategory('2022-03-04', 'nőivarú'),
        isValid: true,
        errors: []
      },
      {
        enar: formatEnar('HU300389132'),
        gender: 'nőivarú',
        color: normalizeColor('zsemleszínű'),
        breed: extractBreed('blonde d\'aquitaine 93.75%'),
        birthDate: '2022-11-03',
        motherEnar: formatEnar('HU300388741'),
        fatherEnar: '',
        fatherKPLSZ: '34144',
        calculatedCategory: calculateCategory('2022-11-03', 'nőivarú'),
        isValid: true,
        errors: []
      },
      {
        enar: formatEnar('HU300389133'),
        gender: 'nőivarú',
        color: normalizeColor('zsemleszínű'),
        breed: extractBreed('blonde d\'aquitaine 93.75%'),
        birthDate: '2022-11-13',
        motherEnar: formatEnar('HU300388799'),
        fatherEnar: '',
        fatherKPLSZ: '34144',
        calculatedCategory: calculateCategory('2022-11-13', 'nőivarú'),
        isValid: true,
        errors: []
      },
      {
        enar: formatEnar('HU300389139'),
        gender: 'nőivarú',
        color: normalizeColor('zsemleszínű'),
        breed: extractBreed('blonde d\'aquitaine 93.75%'),
        birthDate: '2022-11-25',
        motherEnar: formatEnar('HU300388406'),
        fatherEnar: '',
        fatherKPLSZ: '34144',
        calculatedCategory: calculateCategory('2022-11-25', 'nőivarú'),
        isValid: true,
        errors: []
      }
    ];

    setImportedData(mockData);
    setImportStats({
      total: mockData.length,
      valid: mockData.filter(a => a.isValid).length,
      errors: mockData.filter(a => !a.isValid).length
    });
    setIsProcessing(false);
    setStep(3);
  }, []);

  // Mock import (Supabase helyett)
  const handleConfirmImport = async () => {
    setIsImporting(true);
    
    try {
      const validAnimals = importedData.filter(a => a.isValid);
      
      // Mock import - Supabase helyett
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Mock import sikeres:', validAnimals.length, 'állat feldolgozva');

      setStep(4);
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import hiba történt. Kérlek próbáld újra.');
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Import/Export</h1>
            <p className="text-gray-600">Excel állatlista importálása és adatok exportálása</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > stepNum ? <Check size={16} /> : stepNum}
                </div>
                {stepNum < 4 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step > stepNum ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: File Upload */}
          {step === 1 && (
            <div className="text-center">
              <FileSpreadsheet className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Excel Importálás Varázsló</h2>
              <p className="text-gray-600 mb-6">
                Töltsd fel a hatósági egyedleltár Excel fájlt az automatikus importálás megkezdéséhez.
              </p>
              
              <div className="bg-green-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold mb-2">Támogatott oszlopok:</h3>
                <div className="text-sm text-gray-700 grid grid-cols-2 gap-2">
                  <div>• Egyed száma (ENAR)</div>
                  <div>• Neme (hímivarú/nőivarú)</div>
                  <div>• Születési dátuma</div>
                  <div>• Anya száma (ENAR)</div>
                  <div>• Apa száma (ENAR) - opcionális</div>
                  <div>• Apa azonosítója (KPLSZ 5 jegy)</div>
                  <div>• Színe</div>
                  <div>• Fajtája + arány (%)</div>
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
              
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-yellow-600 mt-1" size={20} />
                  <div className="text-left">
                    <h3 className="font-semibold text-yellow-800">Importálás előtt:</h3>
                    <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                      <li>• Automatikus kategória kalkuláció (életkor + ivar)</li>
                      <li>• ENAR formátum validáció</li>
                      <li>• Szülő kapcsolatok ellenőrzése</li>
                      <li>• Duplikátum detektálás</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={() => file && processExcelFile(file)}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 inline-flex items-center gap-2"
              >
                Importálás Megkezdése
                <ArrowRight size={20} />
              </button>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Importálás Eredményei</h2>
              
              {isProcessing ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p>Feldolgozás folyamatban...</p>
                </div>
              ) : (
                <>
                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-gray-600">{importStats.total}</div>
                      <div className="text-sm text-gray-600">Összes állat</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">{importStats.valid}</div>
                      <div className="text-sm text-gray-600">Érvényes</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-red-600">{importStats.errors}</div>
                      <div className="text-sm text-gray-600">Hibás</div>
                    </div>
                  </div>

                  {/* Animals List */}
                  <div className="border rounded-lg overflow-hidden mb-6">
                    <div className="bg-gray-50 px-4 py-2 font-medium border-b">
                      Feldolgozott Állatok
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {importedData.map((animal, index) => (
                        <div key={index} className="px-4 py-3 border-b last:border-b-0 bg-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">
                                {animal.enar}
                                <span className="ml-2 text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
                                  #{getShortEnar(animal.enar)}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600">
                                {animal.calculatedCategory} • {animal.breed}
                                {animal.color && ` • ${animal.color}`}
                                {animal.fatherKPLSZ && ` • Apa KPLSZ: ${animal.fatherKPLSZ}`}
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
                          Importálás folyamatban...
                        </>
                      ) : (
                        <>
                          <Database size={20} />
                          {importStats.valid} Állat Importálása (Mock)
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

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="text-center">
              <Check className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Importálás Sikeres!</h2>
              <p className="text-gray-600 mb-6">
                {importStats.valid} állat sikeresen feldolgozva (Mock módban)!
              </p>
              
              <div className="bg-green-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold mb-2">Következő lépések:</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Supabase valódi integráció beállítása</li>
                  <li>• Karám hozzárendelések beállítása</li>
                  <li>• Vemhesség státuszok frissítése</li>
                  <li>• Súly adatok feltöltése</li>
                </ul>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => window.open('/dashboard/animals', '_blank')}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
                >
                  Állatok Megtekintése
                </button>
                
                <button
                  onClick={() => { setStep(1); setImportedData([]); setFile(null); }}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
                >
                  Új Importálás
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