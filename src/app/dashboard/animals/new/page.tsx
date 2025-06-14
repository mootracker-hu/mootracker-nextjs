'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { mockStorage } from '@/lib/mockStorage';

interface AnimalFormData {
  enar: string;
  szuletesi_datum: string;
  ivar: 'hímivar' | 'nőivar';
  anya_enar: string;
  apa_enar: string;
  kplsz: string;
  bekerules_datum: string;
  jelenlegi_karam: string;
  statusz: 'aktív' | 'selejtezés' | 'elhullott' | 'kikerült' | 'eladott' | 'házi vágás';
}

// Kategória automatikus kalkuláció születési dátum és ivar alapján
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

// Karám javaslatok kategória alapján
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
    anya_enar: '',
    apa_enar: '',
    kplsz: '',
    bekerules_datum: new Date().toISOString().split('T')[0],
    jelenlegi_karam: '',
    statusz: 'aktív'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Meglévő állatok lekérése szülő választáshoz
  const existingAnimals = mockStorage.getAllAnimals();
  const potentialMothers = existingAnimals.filter(a => a.ivar === 'nőivar' && ['tehén', 'szűz_üsző', 'vemhes_üsző'].includes(a.kategoria));
  const potentialFathers = existingAnimals.filter(a => a.ivar === 'hímivar' && a.kategoria === 'tenyészbika');

  // Form változás kezelése
  const handleInputChange = (field: keyof AnimalFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Hibák törlése amikor módosítják a mezőt
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Automatikus kategória kalkuláció születési dátum vagy ivar változáskor
  const handleBirthDateChange = (date: string) => {
    handleInputChange('szuletesi_datum', date);
    if (date && formData.ivar) {
      const category = calculateCategory(date, formData.ivar);
      const suggestions = getKaramSuggestions(category);
      if (suggestions.length > 0 && !formData.jelenlegi_karam) {
        handleInputChange('jelenlegi_karam', suggestions[0]);
      }
    }
  };

  const handleGenderChange = (gender: 'hímivar' | 'nőivar') => {
    handleInputChange('ivar', gender);
    if (formData.szuletesi_datum) {
      const category = calculateCategory(formData.szuletesi_datum, gender);
      const suggestions = getKaramSuggestions(category);
      if (suggestions.length > 0) {
        handleInputChange('jelenlegi_karam', suggestions[0]);
      }
    }
  };

  // Validáció lépésenként
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      // ENAR validáció
      const enarError = validateEnar(formData.enar);
      if (enarError) newErrors.enar = enarError;

      // Létező ENAR ellenőrzés
      if (!enarError && existingAnimals.some(a => a.enar === formData.enar)) {
        newErrors.enar = 'Ez az ENAR már létezik a rendszerben';
      }

      if (!formData.szuletesi_datum) newErrors.szuletesi_datum = 'Születési dátum megadása kötelező';
      if (!formData.ivar) newErrors.ivar = 'Ivar megadása kötelező';
    }

    if (step === 2) {
      if (!formData.jelenlegi_karam) newErrors.jelenlegi_karam = 'Karám megadása kötelező';
      if (!formData.bekerules_datum) newErrors.bekerules_datum = 'Bekerülés dátuma kötelező';
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
      // Kategória kalkuláció
      const kategoria = calculateCategory(formData.szuletesi_datum, formData.ivar);

      // Új állat mentése
      const newAnimal = await mockStorage.addAnimal({
        ...formData,
        kategoria,
        fotok: []
      });

      // Sikeres mentés - navigáció az új állat oldalra
      router.push(`/dashboard/animals/${newAnimal.enar}`);
    } catch (error) {
      console.error('Hiba az állat mentésekor:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Váratlan hiba történt' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Aktuális kategória kalkuláció előnézethez
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
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Vissza az állományhoz
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Új állat hozzáadása</h1>
        <p className="text-gray-600 mt-2">3 lépéses wizard a pontos adatrögzítésért</p>
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
                {currentStep > step ? <CheckIcon className="h-4 w-4" /> : step}
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
          <span>Alapadatok</span>
          <span>Elhelyezés</span>
          <span>Ellenőrzés</span>
        </div>
      </div>

      {/* Form content */}
      <div className="bg-white shadow rounded-lg p-6">
        {/* LÉPÉS 1: Alapadatok */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Alapadatok</h2>
            
            {/* ENAR */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ENAR <span className="text-red-500">*</span>
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
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  {errors.enar}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Magyar ENAR formátum: HU + 10 számjegy
              </p>
            </div>

            {/* Születési dátum */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Születési dátum <span className="text-red-500">*</span>
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
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  {errors.szuletesi_datum}
                </p>
              )}
            </div>

            {/* Ivar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ivar <span className="text-red-500">*</span>
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
                  <span className="ml-2 text-sm text-gray-900">Nőivar</span>
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
                  <span className="ml-2 text-sm text-gray-900">Hímivar</span>
                </label>
              </div>
            </div>

            {/* Kategória előnézet */}
            {currentCategory && (
              <div className="bg-blue-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-blue-900">Automatikusan kalkulált kategória:</h3>
                <p className="text-blue-800 font-semibold">{currentCategory}</p>
              </div>
            )}

            {/* Szülők */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Anya ENAR
                </label>
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apa ENAR
                </label>
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
              </div>
            </div>

            {/* KPLSz */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                KPLSz (ha van)
              </label>
              <input
                type="text"
                value={formData.kplsz}
                onChange={(e) => handleInputChange('kplsz', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="K001, K002..."
              />
              <p className="mt-1 text-sm text-gray-500">
                Külön nyilvántartás szám (opcionális)
              </p>
            </div>
          </div>
        )}

        {/* LÉPÉS 2: Elhelyezés */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Elhelyezés és státusz</h2>
            
            {/* Karám választás */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jelenlegi karám <span className="text-red-500">*</span>
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
                  <option key={karam} value={karam}>{karam} (ajánlott)</option>
                ))}
                <optgroup label="Egyéb karámok">
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
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  {errors.jelenlegi_karam}
                </p>
              )}
              {currentCategory && (
                <p className="mt-1 text-sm text-blue-600">
                  💡 Ajánlott karámok {currentCategory} kategóriához
                </p>
              )}
            </div>

            {/* Bekerülés dátuma */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bekerülés dátuma <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.bekerules_datum}
                onChange={(e) => handleInputChange('bekerules_datum', e.target.value)}
                className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.bekerules_datum ? 'border-red-300' : ''
                }`}
              />
              {errors.bekerules_datum && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  {errors.bekerules_datum}
                </p>
              )}
            </div>

            {/* Státusz */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Státusz
              </label>
              <select
                value={formData.statusz}
                onChange={(e) => handleInputChange('statusz', e.target.value as any)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="aktív">Aktív</option>
                <option value="selejtezés">Selejtezés</option>
                <option value="elhullott">Elhullott</option>
                <option value="kikerült">Kikerült</option>
                <option value="eladott">Eladott</option>
                <option value="házi vágás">Házi vágás</option>
              </select>
            </div>
          </div>
        )}

        {/* LÉPÉS 3: Ellenőrzés */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Adatok ellenőrzése</h2>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Összefoglaló</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">ENAR:</span>
                  <span className="ml-2 text-gray-900">{formData.enar}</span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Születési dátum:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(formData.szuletesi_datum).toLocaleDateString('hu-HU')}
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
                
                {formData.anya_enar && (
                  <div>
                    <span className="font-medium text-gray-700">Anya:</span>
                    <span className="ml-2 text-gray-900">{formData.anya_enar}</span>
                  </div>
                )}
                
                {formData.apa_enar && (
                  <div>
                    <span className="font-medium text-gray-700">Apa:</span>
                    <span className="ml-2 text-gray-900">{formData.apa_enar}</span>
                  </div>
                )}
                
                <div>
                  <span className="font-medium text-gray-700">Karám:</span>
                  <span className="ml-2 text-gray-900">{formData.jelenlegi_karam}</span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Bekerülés:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(formData.bekerules_datum).toLocaleDateString('hu-HU')}
                  </span>
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
            </div>

            {errors.submit && (
              <div className="bg-red-50 p-4 rounded-md">
                <p className="text-red-600 flex items-center">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                  {errors.submit}
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
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Előző
          </button>

          {currentStep < 3 ? (
            <button
              onClick={nextStep}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Következő
              <ArrowRightIcon className="h-4 w-4 ml-2" />
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
                  Mentés...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Állat hozzáadása
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
