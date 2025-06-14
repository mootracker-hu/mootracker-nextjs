'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mockStorage } from '@/lib/mockStorage';

interface Animal {
  enar: string;
  szuletesi_datum: string;
  ivar: 'hímivar' | 'nőivar';
  kategoria: string;
  jelenlegi_karam: string;
  statusz: string;
  anya_enar?: string;
  apa_enar?: string;
  kplsz?: string;
  bekerules_datum?: string;
  fotok?: string[];
  utolso_modositas: string;
  letrehozva: string;
}

export default function NewAnimalPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [existingAnimals, setExistingAnimals] = useState<Animal[]>([]);

  // Form adatok
  const [formData, setFormData] = useState({
    // Alapadatok
    enar: '',
    szuletesi_datum: '',
    ivar: '' as 'hímivar' | 'nőivar' | '',
    eredet: '' as 'nalunk_szuletett' | 'vasarolt' | '',
    
    // Szülők (nálunk született)
    anya_enar: '',
    apa_enar: '',
    apa_tipus: '' as 'termeszetes' | 'mesterseges' | 'ismeretlen' | '',
    kplsz: '',
    
    // Szülők (vásárolt)
    anya_enar_manual: '',
    apa_enar_manual: '',
    
    // Elhelyezés
    jelenlegi_karam: '',
    bekerules_datum: '',
    statusz: 'egészséges'
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const animals = mockStorage.getAllAnimals();
    setExistingAnimals(animals);
  }, []);

  // Kategória automatikus kalkuláció
  const calculateCategory = (birthDate: string, gender: 'hímivar' | 'nőivar'): string => {
    const birth = new Date(birthDate);
    const now = new Date();
    const ageInMonths = (now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.44);

    if (ageInMonths < 6) return 'növarú_borjú';
    
    if (gender === 'hímivar') {
      if (ageInMonths >= 24) return 'tenyészbika';
      return 'hízóbika';
    } else {
      if (ageInMonths >= 36) return 'tehén';
      if (ageInMonths >= 24) return 'szűz_üsző';
      return 'növarú_borjú';
    }
  };

  // Karám javaslatok kategória alapján
  const getKaramSuggestions = (category: string): string[] => {
    const suggestions: { [key: string]: string[] } = {
      'növarú_borjú': ['Bölcsi #1', 'Bölcsi #2', 'Ellető istálló - Fogadó #1'],
      'hízóbika': ['Hízóbika karám #1', 'Hízóbika karám #2', 'Karám #3'],
      'szűz_üsző': ['Óvi #1', 'Óvi #2', 'Óvi #3'],
      'tehén': ['Hárem #1', 'Hárem #2', 'Vemhes karám #1'],
      'tenyészbika': ['Hárem #1', 'Hárem #2', 'Tenyészbika karám']
    };
    return suggestions[category] || [];
  };

  // Potenciális anyák (nőivar + megfelelő kategória)
  const getPotentialMothers = (): Animal[] => {
    return existingAnimals.filter(animal => 
      animal.ivar === 'nőivar' && 
      ['tehén', 'szűz_üsző', 'vemhes_üsző'].includes(animal.kategoria)
    );
  };

  // Potenciális apák (hímivar + tenyészbika)
  const getPotentialFathers = (): Animal[] => {
    return existingAnimals.filter(animal => 
      animal.ivar === 'hímivar' && 
      animal.kategoria === 'tenyészbika'
    );
  };

  // Validációs függvények
  const validateStep1 = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.enar) {
      newErrors.enar = 'ENAR megadása kötelező';
    } else if (!/^HU\d{10}$/.test(formData.enar)) {
      newErrors.enar = 'ENAR formátuma: HU + 10 számjegy';
    } else if (existingAnimals.some(a => a.enar === formData.enar)) {
      newErrors.enar = 'Ez az ENAR már létezik';
    }

    if (!formData.szuletesi_datum) {
      newErrors.szuletesi_datum = 'Születési dátum megadása kötelező';
    }

    if (!formData.ivar) {
      newErrors.ivar = 'Ivar megadása kötelező';
    }

    if (!formData.eredet) {
      newErrors.eredet = 'Eredet megadása kötelező';
    }

    // Szülők validáció nálunk született esetén
    if (formData.eredet === 'nalunk_szuletett') {
      if (!formData.anya_enar && formData.anya_enar !== 'ismeretlen') {
        newErrors.anya_enar = 'Anya megadása kötelező';
      }
      
      if (!formData.apa_tipus) {
        newErrors.apa_tipus = 'Apa típus megadása kötelező';
      }
      
      if (formData.apa_tipus === 'termeszetes' && !formData.apa_enar) {
        newErrors.apa_enar = 'Apa megadása kötelező természetes szaporításnál';
      }
      
      if (formData.apa_tipus === 'mesterseges' && !formData.kplsz) {
        newErrors.kplsz = 'Spermakód megadása kötelező mesterséges termékenyítésnél';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.jelenlegi_karam) {
      newErrors.jelenlegi_karam = 'Karám megadása kötelező';
    }

    if (!formData.bekerules_datum) {
      newErrors.bekerules_datum = 'Bekerülés dátuma kötelező';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Lépés kezelés
  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      // Automatikus bekerülés dátum beállítása nálunk született esetén
      if (formData.eredet === 'nalunk_szuletett' && !formData.bekerules_datum) {
        setFormData(prev => ({ ...prev, bekerules_datum: prev.szuletesi_datum }));
      }
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Mentés
  const handleSave = async () => {
    if (!validateStep2()) return;

    try {
      // TypeScript típus ellenőrzés
      if (!formData.ivar || !formData.szuletesi_datum) {
        setErrors({ general: 'Hiányos adatok. Kérjük töltse ki az összes kötelező mezőt.' });
        return;
      }

      const category = calculateCategory(formData.szuletesi_datum, formData.ivar as 'hímivar' | 'nőivar');
      
      const newAnimal: Animal = {
        enar: formData.enar,
        szuletesi_datum: formData.szuletesi_datum,
        ivar: formData.ivar,
        kategoria: category,
        jelenlegi_karam: formData.jelenlegi_karam,
        statusz: formData.statusz,
        bekerules_datum: formData.bekerules_datum,
        fotok: [],
        utolso_modositas: new Date().toISOString(),
        letrehozva: new Date().toISOString()
      };

      // Szülők beállítása eredet alapján
      if (formData.eredet === 'nalunk_szuletett') {
        if (formData.anya_enar && formData.anya_enar !== 'ismeretlen') {
          newAnimal.anya_enar = formData.anya_enar;
        }
        
        if (formData.apa_tipus === 'termeszetes' && formData.apa_enar) {
          newAnimal.apa_enar = formData.apa_enar;
        } else if (formData.apa_tipus === 'mesterseges' && formData.kplsz) {
          newAnimal.kplsz = formData.kplsz;
        }
      } else if (formData.eredet === 'vasarolt') {
        if (formData.anya_enar_manual) {
          newAnimal.anya_enar = formData.anya_enar_manual;
        }
        if (formData.apa_enar_manual) {
          newAnimal.apa_enar = formData.apa_enar_manual;
        }
      }

      await mockStorage.createAnimal(newAnimal);
      router.push(`/dashboard/animals/${newAnimal.enar}`);
    } catch (error) {
      console.error('Mentési hiba:', error);
      setErrors({ general: 'Mentési hiba történt. Kérjük próbálja újra.' });
    }
  };

  // Kategória előnézet
  const previewCategory = formData.szuletesi_datum && formData.ivar && formData.ivar !== ''
    ? calculateCategory(formData.szuletesi_datum, formData.ivar as 'hímivar' | 'nőivar')
    : '';

  // Karám javaslatok
  const karamSuggestions = previewCategory ? getKaramSuggestions(previewCategory) : [];

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            ➕ Új állat hozzáadása
          </h1>
          <p className="text-gray-600 mt-1">
            3 lépéses wizard az állat adatainak rögzítéséhez
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2 self-start md:self-auto"
        >
          ← Vissza
        </button>
      </div>

      {/* Progress Bar */}
      <div className="bg-white p-4 md:p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 md:space-x-4 w-full">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm ${
              step >= 1 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {step > 1 ? '✅' : '1'}
            </div>
            <div className={`h-1 flex-1 max-w-16 ${step >= 2 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm ${
              step >= 2 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {step > 2 ? '✅' : '2'}
            </div>
            <div className={`h-1 flex-1 max-w-16 ${step >= 3 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm ${
              step >= 3 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {step > 3 ? '✅' : '3'}
            </div>
          </div>
        </div>
        
        <div className="flex justify-between text-xs md:text-sm text-gray-600">
          <span className={step >= 1 ? 'text-green-600 font-medium' : ''}>
            🐄 Alapadatok
          </span>
          <span className={step >= 2 ? 'text-green-600 font-medium' : ''}>
            🏠 Elhelyezés
          </span>
          <span className={step >= 3 ? 'text-green-600 font-medium' : ''}>
            ✅ Ellenőrzés
          </span>
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg border p-4 md:p-6">
        {/* STEP 1: Alapadatok */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              🐄 Alapadatok megadása
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ENAR */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🏷️ ENAR *
                </label>
                <input
                  type="text"
                  value={formData.enar}
                  onChange={(e) => setFormData(prev => ({ ...prev, enar: e.target.value.toUpperCase() }))}
                  placeholder="HU1234567890"
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.enar ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.enar && <p className="text-red-500 text-sm mt-1">{errors.enar}</p>}
              </div>

              {/* Születési dátum */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Születési dátum *
                </label>
                <input
                  type="date"
                  value={formData.szuletesi_datum}
                  onChange={(e) => setFormData(prev => ({ ...prev, szuletesi_datum: e.target.value }))}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.szuletesi_datum ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.szuletesi_datum && <p className="text-red-500 text-sm mt-1">{errors.szuletesi_datum}</p>}
              </div>

              {/* Ivar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ⚧️ Ivar *
                </label>
                <select
                  value={formData.ivar}
                  onChange={(e) => setFormData(prev => ({ ...prev, ivar: e.target.value as 'hímivar' | 'nőivar' }))}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.ivar ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Válasszon...</option>
                  <option value="hímivar">♂️ Hímivar</option>
                  <option value="nőivar">♀️ Nőivar</option>
                </select>
                {errors.ivar && <p className="text-red-500 text-sm mt-1">{errors.ivar}</p>}
              </div>

              {/* Kategória előnézet */}
              {previewCategory && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🎯 Kategória (automatikus)
                  </label>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 font-medium">
                    {previewCategory}
                  </div>
                </div>
              )}
            </div>

            {/* Állat eredete */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                🏠 Az állat eredete *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`cursor-pointer p-4 border-2 rounded-lg transition-colors ${
                  formData.eredet === 'nalunk_szuletett' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="eredet"
                    value="nalunk_szuletett"
                    checked={formData.eredet === 'nalunk_szuletett'}
                    onChange={(e) => setFormData(prev => ({ ...prev, eredet: e.target.value as 'nalunk_szuletett' }))}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <div className="text-2xl mb-2">🏠</div>
                    <div className="font-medium">Nálunk született</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Szülők kiválasztása listából
                    </div>
                  </div>
                </label>

                <label className={`cursor-pointer p-4 border-2 rounded-lg transition-colors ${
                  formData.eredet === 'vasarolt' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="eredet"
                    value="vasarolt"
                    checked={formData.eredet === 'vasarolt'}
                    onChange={(e) => setFormData(prev => ({ ...prev, eredet: e.target.value as 'vasarolt' }))}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <div className="text-2xl mb-2">🛒</div>
                    <div className="font-medium">Vásárolt állat</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Szülők kézi megadása
                    </div>
                  </div>
                </label>
              </div>
              {errors.eredet && <p className="text-red-500 text-sm mt-1">{errors.eredet}</p>}
            </div>

            {/* Szülők - Nálunk született */}
            {formData.eredet === 'nalunk_szuletett' && (
              <div className="bg-green-50 p-4 rounded-lg space-y-4">
                <h3 className="font-medium text-green-800 flex items-center gap-2">
                  🐮❤️🐂 Szülők kiválasztása
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Anya */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🐮 Anya
                    </label>
                    <select
                      value={formData.anya_enar}
                      onChange={(e) => setFormData(prev => ({ ...prev, anya_enar: e.target.value }))}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        errors.anya_enar ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Válasszon anyát...</option>
                      <option value="ismeretlen">❓ Ismeretlen</option>
                      {getPotentialMothers().map(animal => (
                        <option key={animal.enar} value={animal.enar}>
                          {animal.enar} ({animal.kategoria})
                        </option>
                      ))}
                    </select>
                    {errors.anya_enar && <p className="text-red-500 text-sm mt-1">{errors.anya_enar}</p>}
                  </div>

                  {/* Apa típus */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🐂 Apa típusa
                    </label>
                    <select
                      value={formData.apa_tipus}
                      onChange={(e) => setFormData(prev => ({ ...prev, apa_tipus: e.target.value as 'termeszetes' | 'mesterseges' | 'ismeretlen' }))}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        errors.apa_tipus ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Válasszon...</option>
                      <option value="termeszetes">🐂 Természetes fedeztetés</option>
                      <option value="mesterseges">🧪 Mesterséges termékenyítés</option>
                      <option value="ismeretlen">❓ Ismeretlen</option>
                    </select>
                    {errors.apa_tipus && <p className="text-red-500 text-sm mt-1">{errors.apa_tipus}</p>}
                  </div>
                </div>

                {/* Természetes apa */}
                {formData.apa_tipus === 'termeszetes' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🐂 Apa (tenyészbika)
                    </label>
                    <select
                      value={formData.apa_enar}
                      onChange={(e) => setFormData(prev => ({ ...prev, apa_enar: e.target.value }))}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        errors.apa_enar ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Válasszon apát...</option>
                      {getPotentialFathers().map(animal => (
                        <option key={animal.enar} value={animal.enar}>
                          {animal.enar} (tenyészbika)
                        </option>
                      ))}
                    </select>
                    {errors.apa_enar && <p className="text-red-500 text-sm mt-1">{errors.apa_enar}</p>}
                  </div>
                )}

                {/* Spermakód */}
                {formData.apa_tipus === 'mesterseges' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🧪 Spermakód
                    </label>
                    <input
                      type="text"
                      value={formData.kplsz}
                      onChange={(e) => setFormData(prev => ({ ...prev, kplsz: e.target.value }))}
                      placeholder="pl. KPLSZ123456"
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        errors.kplsz ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.kplsz && <p className="text-red-500 text-sm mt-1">{errors.kplsz}</p>}
                  </div>
                )}
              </div>
            )}

            {/* Szülők - Vásárolt állat */}
            {formData.eredet === 'vasarolt' && (
              <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                <h3 className="font-medium text-blue-800 flex items-center gap-2">
                  🐮❤️🐂 Szülők kézi megadása (opcionális)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🐮 Anya ENAR
                    </label>
                    <input
                      type="text"
                      value={formData.anya_enar_manual}
                      onChange={(e) => setFormData(prev => ({ ...prev, anya_enar_manual: e.target.value.toUpperCase() }))}
                      placeholder="HU1234567890 (ha ismert)"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🐂 Apa ENAR
                    </label>
                    <input
                      type="text"
                      value={formData.apa_enar_manual}
                      onChange={(e) => setFormData(prev => ({ ...prev, apa_enar_manual: e.target.value.toUpperCase() }))}
                      placeholder="HU1234567890 (ha ismert)"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Elhelyezés */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              🏠 Elhelyezés és státusz
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Karám */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🏠 Jelenlegi karám *
                </label>
                <select
                  value={formData.jelenlegi_karam}
                  onChange={(e) => setFormData(prev => ({ ...prev, jelenlegi_karam: e.target.value }))}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.jelenlegi_karam ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Válasszon karámot...</option>
                  {karamSuggestions.length > 0 && (
                    <optgroup label="🎯 Ajánlott kategória alapján">
                      {karamSuggestions.map(karam => (
                        <option key={karam} value={karam}>{karam}</option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="🏠 Összes karám">
                    <option value="Karám #1">Karám #1</option>
                    <option value="Karám #2">Karám #2</option>
                    <option value="Karám #3">Karám #3</option>
                    <option value="Hárem #1">Hárem #1</option>
                    <option value="Hárem #2">Hárem #2</option>
                    <option value="Bölcsi #1">Bölcsi #1</option>
                    <option value="Bölcsi #2">Bölcsi #2</option>
                    <option value="Óvi #2">Óvi #2</option>
                    <option value="Óvi #3">Óvi #3</option>
                    <option value="Hízóbika karám #1">Hízóbika karám #1</option>
                    <option value="Hízóbika karám #2">Hízóbika karám #2</option>
                    <option value="Tenyészbika karám">Tenyészbika karám</option>
                    <option value="Vemhes karám #1">Vemhes karám #1</option>
                    <option value="Ellető istálló - Fogadó #1">Ellető istálló - Fogadó #1</option>
                    <option value="Ellető istálló - Fogadó #2">Ellető istálló - Fogadó #2</option>
                  </optgroup>
                </select>
                {errors.jelenlegi_karam && <p className="text-red-500 text-sm mt-1">{errors.jelenlegi_karam}</p>}
              </div>

              {/* Bekerülés dátuma */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Bekerülés dátuma *
                </label>
                <input
                  type="date"
                  value={formData.bekerules_datum}
                  onChange={(e) => setFormData(prev => ({ ...prev, bekerules_datum: e.target.value }))}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.bekerules_datum ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.bekerules_datum && <p className="text-red-500 text-sm mt-1">{errors.bekerules_datum}</p>}
                {formData.eredet === 'nalunk_szuletett' && (
                  <p className="text-sm text-green-600 mt-1">
                    💡 Nálunk születettnél alapértelmezett: születési dátum
                  </p>
                )}
              </div>

              {/* Státusz */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📊 Egészségügyi státusz
                </label>
                <select
                  value={formData.statusz}
                  onChange={(e) => setFormData(prev => ({ ...prev, statusz: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="egészséges">✅ Egészséges</option>
                  <option value="megfigyelés_alatt">🔍 Megfigyelés alatt</option>
                  <option value="kezelés_alatt">⚕️ Kezelés alatt</option>
                  <option value="karantén">🚫 Karantén</option>
                </select>
              </div>

              {/* Kategória ismétlés */}
              {previewCategory && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🎯 Kategória
                  </label>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 font-medium">
                    {previewCategory}
                  </div>
                </div>
              )}
            </div>

            {/* Karám javaslatok */}
            {karamSuggestions.length > 0 && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                  🎯 Ajánlott karámok a "{previewCategory}" kategóriához:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {karamSuggestions.map(karam => (
                    <button
                      key={karam}
                      onClick={() => setFormData(prev => ({ ...prev, jelenlegi_karam: karam }))}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                        formData.jelenlegi_karam === karam
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-white text-green-700 border-green-300 hover:bg-green-100'
                      }`}
                    >
                      {karam}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Ellenőrzés */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              ✅ Adatok ellenőrzése
            </h2>

            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-800 mb-3">🐄 Alapadatok</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">ENAR:</span> <span className="font-medium">{formData.enar}</span></div>
                    <div><span className="text-gray-600">Születés:</span> <span className="font-medium">{formData.szuletesi_datum}</span></div>
                    <div><span className="text-gray-600">Ivar:</span> <span className="font-medium">{formData.ivar === 'hímivar' ? '♂️ Hímivar' : '♀️ Nőivar'}</span></div>
                    <div><span className="text-gray-600">Kategória:</span> <span className="font-medium text-green-600">{previewCategory}</span></div>
                    <div><span className="text-gray-600">Eredet:</span> <span className="font-medium">{formData.eredet === 'nalunk_szuletett' ? '🏠 Nálunk született' : '🛒 Vásárolt'}</span></div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-800 mb-3">🏠 Elhelyezés</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">Karám:</span> <span className="font-medium">{formData.jelenlegi_karam}</span></div>
                    <div><span className="text-gray-600">Bekerülés:</span> <span className="font-medium">{formData.bekerules_datum}</span></div>
                    <div><span className="text-gray-600">Státusz:</span> <span className="font-medium">{formData.statusz}</span></div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-800 mb-3">🐮❤️🐂 Szülők</h3>
                <div className="space-y-2 text-sm">
                  {formData.eredet === 'nalunk_szuletett' ? (
                    <>
                      <div>
                        <span className="text-gray-600">🐮 Anya:</span> 
                        <span className="font-medium ml-2">
                          {formData.anya_enar === 'ismeretlen' ? 'Ismeretlen' : formData.anya_enar || 'Nincs megadva'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">🐂 Apa:</span> 
                        <span className="font-medium ml-2">
                          {formData.apa_tipus === 'termeszetes' ? formData.apa_enar || 'Nincs megadva' :
                           formData.apa_tipus === 'mesterseges' ? `🧪 ${formData.kplsz}` : 'Ismeretlen'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="text-gray-600">🐮 Anya:</span> 
                        <span className="font-medium ml-2">{formData.anya_enar_manual || 'Nincs megadva'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">🐂 Apa:</span> 
                        <span className="font-medium ml-2">{formData.apa_enar_manual || 'Nincs megadva'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{errors.general}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 md:p-6 rounded-lg border gap-4">
        <button
          onClick={handlePrevStep}
          disabled={step === 1}
          className="w-full sm:w-auto px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
        >
          ← Vissza
        </button>

        <div className="text-sm text-gray-500 order-first sm:order-none">
          {step}. lépés / 3
        </div>

        {step < 3 ? (
          <button
            onClick={handleNextStep}
            className="w-full sm:w-auto px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2 justify-center"
          >
            Következő →
          </button>
        ) : (
          <button
            onClick={handleSave}
            className="w-full sm:w-auto px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2 font-medium justify-center"
          >
            ✅ Állat mentése
          </button>
        )}
      </div>
    </div>
  );
}
