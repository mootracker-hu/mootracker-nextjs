'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { mockStorage } from '@/lib/mockStorage';

interface AnimalFormData {
  enar: string;
  szuletesi_datum: string;
  ivar: 'hímivar' | 'nőivar';
  bekerules_datum: string;
  jelenlegi_karam: string;
  statusz: 'aktív' | 'selejtezés' | 'elhullott' | 'kikerült' | 'eladott' | 'házi vágás';
  kplsz: string;
  
  // Szülő kezelés
  szuletesi_tipus: 'nalunk_szuletett' | 'vasarolt';
  anya_tipus: 'valasztas' | 'kezzel' | 'nincs';
  apa_tipus: 'valasztas' | 'kezzel' | 'mesterseges' | 'nincs';
  anya_enar: string;
  apa_enar: string;
  anya_kezzel: string;
  apa_kezzel: string;
  mesterseges_info: string;
}

// Kategória automatikus kalkuláció
const calculateCategory = (birthDate: string, gender: string): string => {
  const birth = new Date(birthDate);
  const now = new Date();
  const ageInMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());

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

// ENAR validáció
const validateEnar = (enar: string): string | null => {
  if (!enar) return 'ENAR megadása kötelező';
  if (!/^HU\d{10}$/.test(enar)) return 'ENAR formátuma: HU + 10 számjegy (pl. HU1234567890)';
  return null;
};

// Karám javaslatok
const getKaramSuggestions = (category: string): string[] => {
  switch (category) {
    case 'növarú_borjú':
      return ['Bölcsi #1', 'Bölcsi #2', 'Ellető istálló - Fogadó #1'];
    case 'hízóbika':
      return ['Hízóbika karám #1', 'Hízóbika karám #2', 'Karám #3'];
    case 'szűz_üsző':
      return ['Óvi #1', 'Óvi #2', 'Óvi #3'];
    case 'tehén':
      return ['Hárem #1', 'Hárem #2', 'Vemhes karám #1'];
    case 'tenyészbika':
      return ['Hárem #1', 'Hárem #2', 'Tenyészbika karám'];
    default:
      return ['Karám #1', 'Karám #2', 'Karám #3'];
  }
};

export default function NewAnimalPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<AnimalFormData>({
    enar: '',
    szuletesi_datum: '',
    ivar: 'nőivar',
    bekerules_datum: new Date().toISOString().split('T')[0],
    jelenlegi_karam: '',
    statusz: 'aktív',
    kplsz: '',
    
    szuletesi_tipus: 'nalunk_szuletett',
    anya_tipus: 'valasztas',
    apa_tipus: 'valasztas',
    anya_enar: '',
    apa_enar: '',
    anya_kezzel: '',
    apa_kezzel: '',
    mesterseges_info: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Meglévő állatok lekérése
  const existingAnimals = mockStorage.getAllAnimals();
  const potentialMothers = existingAnimals.filter(a => a.ivar === 'nőivar' && ['tehén', 'szűz_üsző', 'vemhes_üsző'].includes(a.kategoria));
  const potentialFathers = existingAnimals.filter(a => a.ivar === 'hímivar' && a.kategoria === 'tenyészbika');

  // Form változás kezelése
  const handleInputChange = (field: keyof AnimalFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Születési típus váltás
  const handleSzuletesiTipusChange = (tipus: 'nalunk_szuletett' | 'vasarolt') => {
    setFormData(prev => ({
      ...prev,
      szuletesi_tipus: tipus,
      bekerules_datum: tipus === 'nalunk_szuletett' ? prev.szuletesi_datum : new Date().toISOString().split('T')[0],
      anya_tipus: tipus === 'nalunk_szuletett' ? 'valasztas' : 'kezzel',
      apa_tipus: tipus === 'nalunk_szuletett' ? 'valasztas' : 'kezzel',
      anya_enar: '',
      apa_enar: '',
      anya_kezzel: '',
      apa_kezzel: '',
      mesterseges_info: ''
    }));
  };

  // Születési dátum változás
  const handleBirthDateChange = (date: string) => {
    const updates: Partial<AnimalFormData> = { szuletesi_datum: date };
    
    // Ha nálunk született, bekerülés = születés
    if (formData.szuletesi_tipus === 'nalunk_szuletett') {
      updates.bekerules_datum = date;
    }
    
    // Karám javaslat
    if (date && formData.ivar) {
      const category = calculateCategory(date, formData.ivar);
      const suggestions = getKaramSuggestions(category);
      if (suggestions.length > 0 && !formData.jelenlegi_karam) {
        updates.jelenlegi_karam = suggestions[0];
      }
    }
    
    setFormData(prev => ({ ...prev, ...updates }));
    if (errors.szuletesi_datum) {
      setErrors(prev => ({ ...prev, szuletesi_datum: '' }));
    }
  };

  // Ivar változás
  const handleGenderChange = (gender: 'hímivar' | 'nőivar') => {
    setFormData(prev => ({ ...prev, ivar: gender }));
    if (formData.szuletesi_datum) {
      const category = calculateCategory(formData.szuletesi_datum, gender);
      const suggestions = getKaramSuggestions(category);
      if (suggestions.length > 0) {
        setFormData(prev => ({ ...prev, jelenlegi_karam: suggestions[0] }));
      }
    }
  };

  // Validáció
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      const enarError = validateEnar(formData.enar);
      if (enarError) newErrors.enar = enarError;

      if (!enarError && existingAnimals.some(a => a.enar === formData.enar)) {
        newErrors.enar = 'Ez az ENAR már létezik a rendszerben';
      }

      if (!formData.szuletesi_datum) newErrors.szuletesi_datum = 'Születési dátum megadása kötelező';
      if (!formData.bekerules_datum) newErrors.bekerules_datum = 'Bekerülés dátuma kötelező';
    }

    if (step === 2) {
      if (!formData.jelenlegi_karam) newErrors.jelenlegi_karam = 'Karám megadása kötelező';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Lépés váltás
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Form beküldése
  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    setIsSubmitting(true);
    try {
      const kategoria = calculateCategory(formData.szuletesi_datum, formData.ivar);

      // Szülők meghatározása
      let anya_enar = '';
      let apa_enar = '';

      if (formData.anya_tipus === 'valasztas' && formData.anya_enar) {
        anya_enar = formData.anya_enar;
      } else if (formData.anya_tipus === 'kezzel' && formData.anya_kezzel) {
        anya_enar = formData.anya_kezzel;
      }

      if (formData.apa_tipus === 'valasztas' && formData.apa_enar) {
        apa_enar = formData.apa_enar;
      } else if (formData.apa_tipus === 'kezzel' && formData.apa_kezzel) {
        apa_enar = formData.apa_kezzel;
      } else if (formData.apa_tipus === 'mesterseges') {
        apa_enar = formData.mesterseges_info || 'Mesterséges termékenyítés';
      }

      const newAnimal = await mockStorage.addAnimal({
        enar: formData.enar,
        szuletesi_datum: formData.szuletesi_datum,
        ivar: formData.ivar,
        anya_enar,
        apa_enar,
        kplsz: formData.kplsz,
        bekerules_datum: formData.bekerules_datum,
        jelenlegi_karam: formData.jelenlegi_karam,
        statusz: formData.statusz,
        kategoria,
        fotok: []
      });

      router.push(`/dashboard/animals/${newAnimal.enar}`);
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Váratlan hiba történt' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCategory = formData.szuletesi_datum && formData.ivar 
    ? calculateCategory(formData.szuletesi_datum, formData.ivar)
    : '';

  const karamSuggestions = currentCategory ? getKaramSuggestions(currentCategory) : [];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link href="/dashboard/animals" className="text-blue-600 hover:text-blue-800 flex items-center">
            ← Vissza az állományhoz
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">🐄 Új állat hozzáadása</h1>
        <p className="text-gray-600 mt-2">✨ 3 lépéses wizard a pontos adatrögzítésért</p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${currentStep >= step 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
                }
              `}>
                {currentStep > step ? '✅' : step}
              </div>
              {step < 3 && (
                <div className={`
                  w-16 h-1 mx-2
                  ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}
                `} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>📋 Alapadatok</span>
          <span>🏠 Elhelyezés</span>
          <span>✅ Ellenőrzés</span>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        {/* LÉPÉS 1: Alapadatok */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">📋 Alapadatok</h2>
            
            {/* Születési típus választás */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                🎯 Állat eredete
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.szuletesi_tipus === 'nalunk_szuletett' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleSzuletesiTipusChange('nalunk_szuletett')}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      checked={formData.szuletesi_tipus === 'nalunk_szuletett'}
                      onChange={() => handleSzuletesiTipusChange('nalunk_szuletett')}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">🏠 Nálunk született</h3>
                      <p className="text-xs text-gray-500">Szülők kiválasztása listából vagy mesterséges termékenyítés</p>
                    </div>
                  </div>
                </div>

                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.szuletesi_tipus === 'vasarolt' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleSzuletesiTipusChange('vasarolt')}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      checked={formData.szuletesi_tipus === 'vasarolt'}
                      onChange={() => handleSzuletesiTipusChange('vasarolt')}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">🛒 Vásárolt állat</h3>
                      <p className="text-xs text-gray-500">Szülők kézzel bevitele vagy ismeretlen</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ENAR */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🏷️ ENAR <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.enar}
                onChange={(e) => handleInputChange('enar', e.target.value.toUpperCase())}
                className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.enar ? 'border-red-300' : ''
                }`}
                placeholder="HU1234567890"
              />
              {errors.enar && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  ⚠️ {errors.enar}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                🇭🇺 Magyar ENAR formátum: HU + 10 számjegy
              </p>
            </div>

            {/* Dátumok */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📅 Születési dátum <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.szuletesi_datum}
                  onChange={(e) => handleBirthDateChange(e.target.value)}
                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    errors.szuletesi_datum ? 'border-red-300' : ''
                  }`}
                />
                {errors.szuletesi_datum && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    ⚠️ {errors.szuletesi_datum}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  🚪 Bekerülés dátuma <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.bekerules_datum}
                  onChange={(e) => handleInputChange('bekerules_datum', e.target.value)}
                  disabled={formData.szuletesi_tipus === 'nalunk_szuletett'}
                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    formData.szuletesi_tipus === 'nalunk_szuletett' ? 'bg-gray-100' : ''
                  } ${errors.bekerules_datum ? 'border-red-300' : ''}`}
                />
                {formData.szuletesi_tipus === 'nalunk_szuletett' && (
                  <p className="mt-1 text-xs text-gray-500">🔄 Automatikusan a születési dátum</p>
                )}
                {errors.bekerules_datum && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    ⚠️ {errors.bekerules_datum}
                  </p>
                )}
              </div>
            </div>

            {/* Ivar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ⚥ Ivar <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="ivar"
                    value="nőivar"
                    checked={formData.ivar === 'nőivar'}
                    onChange={(e) => handleGenderChange(e.target.value as 'nőivar')}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-900">♀️ Nőivar</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="ivar"
                    value="hímivar"
                    checked={formData.ivar === 'hímivar'}
                    onChange={(e) => handleGenderChange(e.target.value as 'hímivar')}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-900">♂️ Hímivar</span>
                </label>
              </div>
            </div>

            {/* Kategória előnézet */}
            {currentCategory && (
              <div className="bg-blue-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-blue-900">🎯 Automatikusan kalkulált kategória:</h3>
                <p className="text-blue-800 font-semibold">✨ {currentCategory}</p>
              </div>
            )}

            {/* Szülők - Nálunk született */}
            {formData.szuletesi_tipus === 'nalunk_szuletett' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">👨‍👩‍👧‍👦 Szülők</h3>
                
                {/* Anya */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">👩 Anya</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="anya_tipus"
                        value="valasztas"
                        checked={formData.anya_tipus === 'valasztas'}
                        onChange={(e) => handleInputChange('anya_tipus', e.target.value)}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">Kiválasztás listából</span>
                    </label>
                    
                    {formData.anya_tipus === 'valasztas' && (
                      <select
                        value={formData.anya_enar}
                        onChange={(e) => handleInputChange('anya_enar', e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">Válassz anyát...</option>
                        {potentialMothers.map(animal => (
                          <option key={animal.enar} value={animal.enar}>
                            {animal.enar} ({animal.kategoria})
                          </option>
                        ))}
                      </select>
                    )}
                    
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="anya_tipus"
                        value="nincs"
                        checked={formData.anya_tipus === 'nincs'}
                        onChange={(e) => handleInputChange('anya_tipus', e.target.value)}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">Ismeretlen</span>
                    </label>
                  </div>
                </div>

                {/* Apa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">👨 Apa</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="apa_tipus"
                        value="valasztas"
                        checked={formData.apa_tipus === 'valasztas'}
                        onChange={(e) => handleInputChange('apa_tipus', e.target.value)}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">Kiválasztás listából</span>
                    </label>
                    
                    {formData.apa_tipus === 'valasztas' && (
                      <select
                        value={formData.apa_enar}
                        onChange={(e) => handleInputChange('apa_enar', e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">Válassz apát...</option>
                        {potentialFathers.map(animal => (
                          <option key={animal.enar} value={animal.enar}>
                            {animal.enar} ({animal.kategoria})
                          </option>
                        ))}
                      </select>
                    )}
                    
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="apa_tipus"
                        value="mesterseges"
                        checked={formData.apa_tipus === 'mesterseges'}
                        onChange={(e) => handleInputChange('apa_tipus', e.target.value)}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">🧪 Mesterséges termékenyítés</span>
                    </label>
                    
                    {formData.apa_tipus === 'mesterseges' && (
                      <input
                        type="text"
                        value={formData.mesterseges_info}
                        onChange={(e) => handleInputChange('mesterseges_info', e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Spermakód vagy egyéb információ..."
                      />
                    )}
                    
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="apa_tipus"
                        value="nincs"
                        checked={formData.apa_tipus === 'nincs'}
                        onChange={(e) => handleInputChange('apa_tipus', e.target.value)}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">Ismeretlen</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Szülők - Vásárolt állat */}
            {formData.szuletesi_tipus === 'vasarolt' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">👨‍👩‍👧‍👦 Szülők (opcionális)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      👩 Anya ENAR
                    </label>
                    <input
                      type="text"
                      value={formData.anya_kezzel}
                      onChange={(e) => handleInputChange('anya_kezzel', e.target.value.toUpperCase())}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="HU1234567890 vagy ismeretlen"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      👨 Apa ENAR
                    </label>
                    <input
                      type="text"
                      value={formData.apa_kezzel}
                      onChange={(e) => handleInputChange('apa_kezzel', e.target.value.toUpperCase())}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="HU1234567890 vagy ismeretlen"
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Ha ismered a szülők ENAR-ját, add meg. Egyébként hagyd üresen.
                </p>
              </div>
            )}

            {/* KPLSz */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📄 KPLSz (ha van)
              </label>
              <input
                type="text"
                value={formData.kplsz}
                onChange={(e) => handleInputChange('kplsz', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="K001, K002..."
              />
              <p className="mt-1 text-sm text-gray-500">
                📝 Külön nyilvántartás szám (opcionális)
              </p>
            </div>
          </div>
        )}

        {/* LÉPÉS 2: Elhelyezés */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">🏠 Elhelyezés és státusz</h2>
            
            {/* Karám választás */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🏠 Jelenlegi karám <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.jelenlegi_karam}
                onChange={(e) => handleInputChange('jelenlegi_karam', e.target.value)}
                className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.jelenlegi_karam ? 'border-red-300' : ''
                }`}
              >
                <option value="">Válassz karámot...</option>
                {karamSuggestions.map(karam => (
                  <option key={karam} value={karam}>✨ {karam} (ajánlott)</option>
                ))}
                <optgroup label="🏗️ Egyéb karámok">
                  <option value="Karám #1">Karám #1</option>
                  <option value="Karám #2">Karám #2</option>
                  <option value="Karám #3">Karám #3</option>
                  <option value="Hárem #1">Hárem #1</option>
                  <option value="Hárem #2">Hárem #2</option>
                  <option value="Ellető istálló - Fogadó #1">Ellető istálló - Fogadó #1</option>
                  <option value="Ellető istálló - Fogadó #2">Ellető istálló - Fogadó #2</option>
                </optgroup>
              </select>
              {errors.jelenlegi_karam && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  ⚠️ {errors.jelenlegi_karam}
                </p>
              )}
              {currentCategory && (
                <p className="mt-1 text-sm text-blue-600">
                  💡 Ajánlott karámok {currentCategory} kategóriához
                </p>
              )}
            </div>

            {/* Státusz */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📊 Státusz
              </label>
              <select
                value={formData.statusz}
                onChange={(e) => handleInputChange('statusz', e.target.value as any)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="aktív">✅ Aktív</option>
                <option value="selejtezés">⚠️ Selejtezés</option>
                <option value="elhullott">💀 Elhullott</option>
                <option value="kikerült">🚪 Kikerült</option>
                <option value="eladott">💰 Eladott</option>
                <option value="házi vágás">🔪 Házi vágás</option>
              </select>
            </div>
          </div>
        )}

        {/* LÉPÉS 3: Ellenőrzés */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">✅ Adatok ellenőrzése</h2>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">📋 Összefoglaló</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">🎯 Eredet:</span>
                  <span className="ml-2 text-gray-900">
                    {formData.szuletesi_tipus === 'nalunk_szuletett' ? '🏠 Nálunk született' : '🛒 Vásárolt állat'}
                  </span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">🏷️ ENAR:</span>
                  <span className="ml-2 text-gray-900">{formData.enar}</span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">📅 Születési dátum:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(formData.szuletesi_datum).toLocaleDateString('hu-HU')}
                  </span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">🚪 Bekerülés dátuma:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(formData.bekerules_datum).toLocaleDateString('hu-HU')}
                  </span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">⚥ Ivar:</span>
                  <span className="ml-2 text-gray-900">
                    {formData.ivar === 'hímivar' ? '♂️' : '♀️'} {formData.ivar}
                  </span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">🎯 Kategória:</span>
                  <span className="ml-2 text-gray-900 font-semibold text-blue-700">✨ {currentCategory}</span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">🏠 Karám:</span>
                  <span className="ml-2 text-gray-900">{formData.jelenlegi_karam}</span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">📊 Státusz:</span>
                  <span className="ml-2 text-gray-900">
                    {formData.statusz === 'aktív' ? '✅' : '⚠️'} {formData.statusz}
                  </span>
                </div>
                
                {formData.kplsz && (
                  <div>
                    <span className="font-medium text-gray-700">📄 KPLSz:</span>
                    <span className="ml-2 text-gray-900">{formData.kplsz}</span>
                  </div>
                )}</span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Születési dátum:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(formData.szuletesi_datum).toLocaleDateString('hu-HU')}
                  </span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Bekerülés dátuma:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(formData.bekerules_datum).toLocaleDateString('hu-HU')}
                  </span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Ivar:</span>
                  <span className="ml-2 text-gray-900">{formData.ivar}</span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Kategória:</span>
                  <span className="ml-2 text-gray-900 font-semibold text-blue-700">{currentCategory}</span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Karám:</span>
                  <span className="ml-2 text-gray-900">{formData.jelenlegi_karam}</span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Státusz:</span>
                  <span className="ml-2 text-gray-900">{formData.statusz}</span>
                </div>
                
                {formData.kplsz && (
                  <div>
                    <span className="font-medium text-gray-700">KPLSz:</span>
                    <span className="ml-2 text-gray-900">{formData.kplsz}</span>
                  </div>
                )}
              </div>

              {/* Szülők összefoglaló */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-700 mb-2">👨‍👩‍👧‍👦 Szülők:</h4>
                <div className="space-y-1 text-sm">
                  {formData.szuletesi_tipus === 'nalunk_szuletett' ? (
                    <>
                      <div>
                        <span className="text-gray-600">👩 Anya:</span>
                        <span className="ml-2 text-gray-900">
                          {formData.anya_tipus === 'valasztas' && formData.anya_enar ? formData.anya_enar :
                           formData.anya_tipus === 'nincs' ? 'Ismeretlen' : 'Nincs megadva'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">👨 Apa:</span>
                        <span className="ml-2 text-gray-900">
                          {formData.apa_tipus === 'valasztas' && formData.apa_enar ? formData.apa_enar :
                           formData.apa_tipus === 'mesterseges' ? `🧪 Mesterséges termékenyítés${formData.mesterseges_info ? ` (${formData.mesterseges_info})` : ''}` :
                           formData.apa_tipus === 'nincs' ? 'Ismeretlen' : 'Nincs megadva'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="text-gray-600">👩 Anya:</span>
                        <span className="ml-2 text-gray-900">{formData.anya_kezzel || 'Ismeretlen'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">👨 Apa:</span>
                        <span className="ml-2 text-gray-900">{formData.apa_kezzel || 'Ismeretlen'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {errors.submit && (
              <div className="bg-red-50 p-4 rounded-md">
                <p className="text-red-600 flex items-center">
                  ⚠️ {errors.submit}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Előző
          </button>

          {currentStep < 3 ? (
            <button
              onClick={nextStep}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Következő →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  💾 Mentés...
                </>
              ) : (
                <>
                  ✅ Állat hozzáadása
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
