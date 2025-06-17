// src/app/dashboard/import-export/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import { 
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Download,
  Database,
  Users
} from 'lucide-react';

interface ParsedAnimal {
  enar: string;
  shortId: string;
  szuletesi_datum: string;
  ivar: string;
  kategoria: string;
  jelenlegi_karam?: string;
  statusz: string;
  anya_enar?: string;
  apa_enar?: string;
  kplsz?: string;
  bekerules_datum: string;
}

export default function ImportExportPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedAnimals, setParsedAnimals] = useState<ParsedAnimal[]>([]);
  const [importResults, setImportResults] = useState({ success: 0, errors: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');

  // Excel dátum konvertálás (44624 → 2022-03-04)
  const convertExcelDate = (excelDate: number): string => {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  };

  // ENAR formázás (HU1234567890 → HU 12345 6789 0)
  const formatEnar = (enar: string): string => {
    const cleaned = enar.replace(/\s+/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('HU')) {
      return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)} ${cleaned.slice(7, 11)} ${cleaned.slice(11)}`;
    }
    return enar;
  };

  // Rövid azonosító (utolsó 5 szám)
  const getShortId = (enar: string): string => {
    const numbers = enar.replace(/\D/g, '');
    return numbers.slice(-5);
  };

  // Kategória kalkuláció (életkor + ivar alapján)
  const calculateCategory = (birthDate: string, gender: string): string => {
    const birth = new Date(birthDate);
    const now = new Date();
    const ageMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());

    if (gender.toLowerCase().includes('nő') || gender.toLowerCase().includes('női')) {
      if (ageMonths <= 12) return 'nőivarú_borjú';
      if (ageMonths <= 24) return 'szűz_üsző';
      return 'tehén';
    } else {
      if (ageMonths <= 6) return 'hímivarú_borjú';
      return 'hízóbika';
    }
  };

  // Fájl kiválasztás
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Excel parsing
  const parseExcelFile = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProcessingMessage('Excel fájl olvasása...');

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

      setProcessingMessage('Adatok feldolgozása...');

      const animals: ParsedAnimal[] = [];
      
      // Kezdjük az 1. sorral (0 = header)
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        
        if (!row[0] || !row[1]) continue; // Üres sorok kihagyása

        const rawEnar = String(row[0] || '').trim();
        const rawBirthDate = row[1];
        const rawGender = String(row[2] || '').trim();
        const rawMotherEnar = String(row[3] || '').trim();
        const rawKplsz = String(row[4] || '').trim();

        if (!rawEnar || !rawBirthDate) continue;

        // Dátum konverzió
        let birthDate: string;
        if (typeof rawBirthDate === 'number') {
          birthDate = convertExcelDate(rawBirthDate);
        } else if (typeof rawBirthDate === 'string') {
          birthDate = rawBirthDate;
        } else {
          continue; // Érvénytelen dátum
        }

        // ENAR formázás
        const formattedEnar = formatEnar(rawEnar);
        const shortId = getShortId(formattedEnar);

        // Kategória kalkuláció
        const category = calculateCategory(birthDate, rawGender);

        const animal: ParsedAnimal = {
          enar: formattedEnar,
          shortId,
          szuletesi_datum: birthDate,
          ivar: rawGender.toLowerCase().includes('nő') ? 'nő' : 'hím',
          kategoria: category,
          statusz: 'aktív',
          anya_enar: rawMotherEnar || undefined,
          kplsz: rawKplsz || undefined,
          bekerules_datum: new Date().toISOString().split('T')[0]
        };

        animals.push(animal);
      }

      setParsedAnimals(animals);
      setCurrentStep(3);
      setProcessingMessage(`${animals.length} állat sikeresen feldolgozva!`);

    } catch (error) {
      console.error('Excel parsing hiba:', error);
      setProcessingMessage('Hiba történt az Excel fájl feldolgozása során');
    } finally {
      setIsProcessing(false);
    }
  };

  // Supabase importálás
  const importToSupabase = async () => {
    if (parsedAnimals.length === 0) return;

    setIsProcessing(true);
    setProcessingMessage('Importálás Supabase adatbázisba...');

    let successCount = 0;
    let errorCount = 0;

    try {
      // Batch import (50-esével)
      const batchSize = 50;
      for (let i = 0; i < parsedAnimals.length; i += batchSize) {
        const batch = parsedAnimals.slice(i, i + batchSize);
        
        setProcessingMessage(`Importálás: ${i + 1}-${Math.min(i + batchSize, parsedAnimals.length)} / ${parsedAnimals.length}`);

        const { data, error } = await supabase
          .from('animals')
          .insert(batch)
          .select();

        if (error) {
          console.error('Supabase batch hiba:', error);
          errorCount += batch.length;
        } else {
          successCount += batch.length;
        }

        // Kis szünet a rate limiting elkerülésére
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setImportResults({ success: successCount, errors: errorCount });
      setCurrentStep(4);
      setProcessingMessage(`Import befejezve! ${successCount} sikeres, ${errorCount} hiba`);

    } catch (error) {
      console.error('Import hiba:', error);
      setProcessingMessage('Hiba történt az importálás során');
      setImportResults({ success: successCount, errors: errorCount });
    } finally {
      setIsProcessing(false);
    }
  };

  const steps = [
    { number: 1, title: 'Fájl Kiválasztása', completed: currentStep > 1 },
    { number: 2, title: 'Adatok Feldolgozása', completed: currentStep > 2 },
    { number: 3, title: 'Előnézet', completed: currentStep > 3 },
    { number: 4, title: 'Import Eredményei', completed: currentStep > 4 }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Excel Import & Export</h1>
          <p className="text-gray-600">Excel állatlista importálása és adatok exportálása</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep === step.number 
                    ? 'bg-green-600 border-green-600 text-white' 
                    : step.completed 
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'bg-white border-gray-300 text-gray-500'
                }`}>
                  {step.completed ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.number}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-20 h-0.5 mx-4 ${
                    step.completed ? 'bg-green-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((step) => (
              <div key={step.number} className="text-xs text-gray-500 w-32 text-center">
                {step.title}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          
          {/* Step 1: Fájl kiválasztás */}
          {currentStep === 1 && (
            <div className="text-center">
              <FileSpreadsheet className="h-16 w-16 text-green-600 mx-auto mb-6" />
              <h2 className="text-xl font-semibold mb-4">Excel Fájl Kiválasztása</h2>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Kattintson ide fájl kiválasztásához
                  </p>
                  <p className="text-gray-500">Excel fájl (.xlsx, .xls)</p>
                </label>
              </div>

              {selectedFile && (
                <div className="flex items-center justify-center space-x-2 mb-6">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700">{selectedFile.name}</span>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              )}

              <button
                onClick={() => { parseExcelFile(); setCurrentStep(2); }}
                disabled={!selectedFile}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Fájl Feldolgozása
                <ArrowRight className="h-4 w-4 ml-2 inline" />
              </button>
            </div>
          )}

          {/* Step 2: Feldolgozás */}
          {currentStep === 2 && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-6"></div>
              <h2 className="text-xl font-semibold mb-4">Adatok Feldolgozása</h2>
              <p className="text-gray-600 mb-4">{processingMessage}</p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  Kérjük várjon, az Excel fájl feldolgozása folyamatban...
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Előnézet */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Importálás Előnézete</h2>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-900">{parsedAnimals.length}</div>
                  <div className="text-sm text-gray-600">Összes állat</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{parsedAnimals.length}</div>
                  <div className="text-sm text-gray-600">Érvényes</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">0</div>
                  <div className="text-sm text-gray-600">Hibás</div>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden mb-6 max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ENAR</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rövid ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategória</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Születés</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ivar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {parsedAnimals.slice(0, 10).map((animal, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-gray-900">{animal.enar}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            #{animal.shortId}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {animal.kategoria}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{animal.szuletesi_datum}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{animal.ivar}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {parsedAnimals.length > 10 && (
                <p className="text-sm text-gray-500 mb-6">
                  + még {parsedAnimals.length - 10} állat...
                </p>
              )}

              <button
                onClick={importToSupabase}
                disabled={isProcessing}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                <Database className="h-4 w-4 mr-2" />
                {isProcessing ? 'Importálás...' : `${parsedAnimals.length} Állat Importálása`}
              </button>
            </div>
          )}

          {/* Step 4: Eredmények */}
          {currentStep === 4 && (
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
              <h2 className="text-xl font-semibold mb-4">Import Befejezve!</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{importResults.success}</div>
                  <div className="text-sm text-gray-600">Sikeres import</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{importResults.errors}</div>
                  <div className="text-sm text-gray-600">Hibák</div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => router.push('/dashboard/animals')}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Állatok Megtekintése
                </button>
                
                <button
                  onClick={() => {
                    setCurrentStep(1);
                    setSelectedFile(null);
                    setParsedAnimals([]);
                    setImportResults({ success: 0, errors: 0 });
                  }}
                  className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Új Import Indítása
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold mb-2">Feldolgozás folyamatban</h3>
                <p className="text-gray-600">{processingMessage}</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}