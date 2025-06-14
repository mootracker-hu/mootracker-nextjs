'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewAnimalPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    enar: '',
    szuletesi_datum: '',
    ivar: '',
    anya_enar: '',
    apa_enar: '',
    kplsz: '',
    bekerules_datum: new Date().toISOString().split('T')[0],
    jelenlegi_karam: '',
    szuletesi_suly: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateStep1 = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.enar) {
      newErrors.enar = 'ENAR kötelező';
    } else if (!/^HU\d{10}$/.test(formData.enar)) {
      newErrors.enar = 'ENAR formátuma: HU + 10 számjegy';
    }
    
    if (!formData.szuletesi_datum) {
      newErrors.szuletesi_datum = 'Születési dátum kötelező';
    }
    
    if (!formData.ivar) {
      newErrors.ivar = 'Ivar kiválasztása kötelező';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.jelenlegi_karam) {
      newErrors.jelenlegi_karam = 'Karám kiválasztása kötelező';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleSubmit = () => {
    // Mock mentés - később API hívás lesz
    console.log('Állat mentése:', formData);
    
    // Szimuláljunk egy sikeres mentést
    alert(`✅ Állat sikeresen hozzáadva!\nENAR: ${formData.enar}`);
    
    // Navigáljunk az állat részleteihez
    router.push(`/dashboard/animals/${formData.enar}`);
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '';
    const birth = new Date(birthDate);
    const now = new Date();
    const diffInMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    
    if (diffInMonths < 12) {
      return `${diffInMonths} hó`;
    } else {
      const years = Math.floor(diffInMonths / 12);
      const months = diffInMonths % 12;
      return months > 0 ? `${years} év ${months} hó` : `${years} év`;
    }
  };

  const getAutoCategory = (birthDate: string, ivar: string) => {
    if (!birthDate || !ivar) return '';
    
    const birth = new Date(birthDate);
    const now = new Date();
    const diffInMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    
    if (diffInMonths < 6) {
      return 'növarú_borjú';
    } else if (diffInMonths < 12) {
      return ivar === 'nőivar' ? 'növarú_borjú' : 'növarú_borjú';
    } else if (diffInMonths < 24) {
      return ivar === 'nőivar' ? 'szűz_üsző' : 'hízóbika';
    } else {
      return ivar === 'nőivar' ? 'szűz_üsző' : 'tenyészbika';
    }
  };

  const getCategoryDisplay = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'tenyészbika': 'Tenyészbika',
      'hízóbika': 'Hízóbika', 
      'tehén': 'Tehén',
      'szűz_üsző': 'Szűz üsző',
      'vemhes_üsző': 'Vemhes üsző',
      'vemhesülés_alatt': 'Vemhesülés alatt',
      'növarú_borjú': 'Növarú borjú'
    };
    return categoryMap[category] || category;
  };

  // Mock karám opciók
  const karamOptions = [
    { id: 'elleto_fogado_1', name: 'Ellető istálló - Fogadó #1' },
    { id: 'elleto_fogado_2', name: 'Ellető istálló - Fogadó #2' },
    { id: 'elleto_belso_1', name: 'Ellető istálló - Belső karám #1' },
    { id: 'elleto_belso_2', name: 'Ellető istálló - Belső karám #2' },
    { id: 'bolcsi_1', name: 'Bölcsi #1' },
    { id: 'bolcsi_2', name: 'Bölcsi #2' },
    { id: 'ovi_1', name: 'Óvi #1' },
    { id: 'ovi_2', name: 'Óvi #2' },
    { id: 'karam_1', name: 'Karám #1' },
    { id: 'karam_2', name: 'Karám #2' },
    { id: 'karam_3', name: 'Karám #3' },
    { id: 'harem_1', name: 'Hárem #1' },
    { id: 'harem_2', name: 'Hárem #2' },
    { id: 'harem_3', name: 'Hárem #3' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="mr-4 text-gray-400 hover:text-gray-600"
          >
            ← Vissza
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Új állat hozzáadása</h1>
            <p className="mt-1 text-sm text-gray-500">
              Lépésről lépésre adatlap kitöltés
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                currentStep >= step 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-300 text-gray-600'
              }`}>
                {step}
              </div>
              <div className={`text-sm ml-2 ${
                currentStep >= step ? 'text-green-600 font-medium' : 'text-gray-500'
              }`}>
                {step === 1 && 'Alapadatok'}
                {step === 2 && 'Elhelyezés'}
                {step === 3 && 'Ellenőrzés'}
              </div>
              {step < 3 && (
                <div className={`w-16 h-1 mx-4 ${
                  currentStep > step ? 'bg-green-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white shadow rounded-lg p-6">
        {currentStep === 1 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-6">Alapadatok</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ENAR szám *
                </label>
                <input
                  type="text"
                  placeholder="HU1234567890"
                  value={formData.enar}
                  onChange={(e) => setFormData({ ...formData, enar: e.target.value.toUpperCase() })}
                  className={`w-full px-3 py-2 border rounded-md text-sm ${
                    errors.enar ? 'border-red-300' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                />
                {errors.enar && <p className="mt-1 text-sm text-red-600">{errors.enar}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Születési dátum *
                </label>
                <input
                  type="date"
                  value={formData.szuletesi_datum}
                  onChange={(e) => setFormData({ ...formData, szuletesi_datum: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md text-sm ${
                    errors.szuletesi_datum ? 'border-red-300' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                />
                {errors.szuletesi_datum && <p className="mt-1 text-sm text-red-600">{errors.szuletesi_datum}</p>}
                {formData.szuletesi_datum && (
                  <p className="mt-1 text-sm text-gray-500">
                    Életkor: {calculateAge(formData.szuletesi_datum)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ivar *
                </label>
                <select
                  value={formData.ivar}
                  onChange={(e) => setFormData({ ...formData, ivar: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md text-sm ${
                    errors.ivar ? 'border-red-300' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                >
                  <option value="">Válassz ivart</option>
                  <option value="hímivar">♂️ Hímivar</option>
                  <option value="nőivar">♀️ Nőivar</option>
                </select>
                {errors.ivar && <p className="mt-1 text-sm text-red-600">{errors.ivar}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Automatikus kategória
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-600">
                  {formData.szuletesi_datum && formData.ivar 
                    ? getCategoryDisplay(getAutoCategory(formData.szuletesi_datum, formData.ivar))
                    : 'Születési dátum és ivar alapján kalkulálva'
                  }
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anya ENAR
                </label>
                <input
                  type="text"
                  placeholder="HU1234567890"
                  value={formData.anya_enar}
                  onChange={(e) => setFormData({ ...formData, anya_enar: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apa ENAR
                </label>
                <input
                  type="text"
                  placeholder="HU1234567890"
                  value={formData.apa_enar}
                  onChange={(e) => setFormData({ ...formData, apa_enar: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  KPLSZ szám
                </label>
                <input
                  type="text"
                  placeholder="KPLSZ123456"
                  value={formData.kplsz}
                  onChange={(e) => setFormData({ ...formData, kplsz: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Születési súly (kg)
                </label>
                <input
                  type="number"
                  placeholder="40"
                  value={formData.szuletesi_suly}
                  onChange={(e) => setFormData({ ...formData, szuletesi_suly: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-6">Elhelyezés</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jelenlegi karám *
                </label>
                <select
                  value={formData.jelenlegi_karam}
                  onChange={(e) => setFormData({ ...formData, jelenlegi_karam: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md text-sm ${
                    errors.jelenlegi_karam ? 'border-red-300' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                >
                  <option value="">Válassz
