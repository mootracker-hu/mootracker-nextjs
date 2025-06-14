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
    fotok: [] as string[],
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // ✅ VALIDÁCIÓ - Step 1
  const validateStep1 = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.enar) {
      newErrors.enar = 'ENAR kötelező';
    } else if (!/^HU\d{10}$/.test(formData.enar)) {
      newErrors.enar = 'ENAR formátuma: HU + 10 számjegy (pl: HU1234567890)';
    }
    
    if (!formData.szuletesi_datum) {
      newErrors.szuletesi_datum = 'Születési dátum kötelező';
    } else {
      const birthDate = new Date(formData.szuletesi_datum);
      const now = new Date();
      if (birthDate > now) {
        newErrors.szuletesi_datum = 'Születési dátum nem lehet jövőbeli';
      }
    }
    
    if (!formData.ivar) {
      newErrors.ivar = 'Ivar kiválasztása kötelező';
    }

    // Opcionális ENAR validációk
    if (formData.anya_enar && !/^HU\d{10}$/.test(formData.anya_enar)) {
      newErrors.anya_enar = 'Anya ENAR formátuma: HU + 10 számjegy';
    }
    
    if (formData.apa_enar && !/^HU\d{10}$/.test(formData.apa_enar)) {
      newErrors.apa_enar = 'Apa ENAR formátuma: HU + 10 számjegy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ VALIDÁCIÓ - Step 2
  const validateStep2 = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.jelenlegi_karam) {
      newErrors.jelenlegi_karam = 'Karám kiválasztása kötelező';
    }
    
    if (!formData.bekerules_datum) {
      newErrors.bekerules_datum = 'Bekerülés dátuma kötelező';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ ÉLETKOR KALKULÁCIÓ
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '';
    const birth = new Date(birthDate);
    const now = new Date();
    const diffInMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    
    if (diffInMonths < 1) {
      const diffInDays = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
      return `${diffInDays} nap`;
    } else if (diffInMonths < 12) {
      return `${diffInMonths} hó`;
    } else {
      const years = Math.floor(diffInMonths / 12);
      const months = diffInMonths % 12;
      return months > 0 ? `${years} év ${months} hó` : `${years} év`;
    }
  };

  // ✅ AUTOMATIKUS KATEGÓRIA KALKULÁCIÓ
  const getAutoCategory = (birthDate: string, ivar: string) => {
    if (!birthDate || !ivar) return '';
    
    const birth = new Date(birthDate);
    const now = new Date();
    const diffInMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    
    if (diffInMonths < 6) {
      return 'növarú_borjú';
    } else if (diffInMonths < 12) {
      return 'növarú_borjú';
    } else if (diffInMonths < 24) {
      return ivar === 'nőivar' ? 'szűz_üsző' : 'hízóbika';
    } else {
      return ivar === 'nőivar' ? 'szűz_üsző' : 'tenyészbika';
    }
  };

  // ✅ KATEGÓRIA MEGJELENÍTÉS
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

  // ✅ INTELLIGENS KARÁM AJÁNLÁS
  const getRecommendedPens = (birthDate: string, category: string) => {
    if (!birthDate) return [];
    
    const ageInMonths = Math.floor((new Date().getTime() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    if (ageInMonths < 2) {
      return ['Ellető istálló - Fogadó #1', 'Ellető istálló - Fogadó #2', 'Ellető istálló - Fogadó #3'];
    } else if (ageInMonths < 6) {
      return ['Ellető istálló - Belső karám #1', 'Ellető istálló - Belső karám #2'];
    } else if (ageInMonths < 12) {
      return ['Bölcsi #1', 'Bölcsi #2'];
    } else if (ageInMonths < 24) {
      return ['Óvi #1', 'Óvi #2'];
    } else {
      return category === 'hízóbika' 
        ? ['Karám #1', 'Karám #2', 'Karám #3']
        : ['Hárem #1', 'Hárem #2', 'Hárem #3'];
    }
  };

  // ✅ ÖSSZES KARÁM OPCIÓ
  const getAllPenOptions = () => [
    { id: 'elleto_fogado_1', name: 'Ellető istálló - Fogadó #1', type: 'elleto' },
    { id: 'elleto_fogado_2', name: 'Ellető istálló - Fogadó #2', type: 'elleto' },
    { id: 'elleto_fogado_3', name: 'Ellető istálló - Fogadó #3', type: 'elleto' },
    { id: 'elleto_belso_1', name: 'Ellető istálló - Belső karám #1', type: 'elleto' },
    { id: 'elleto_belso_2', name: 'Ellető istálló - Belső karám #2', type: 'elleto' },
    { id: 'bolcsi_1', name: 'Bölcsi #1', type: 'kulteri' },
    { id: 'bolcsi_2', name: 'Bölcsi #2', type: 'kulteri' },
    { id: 'ovi_1', name: 'Óvi #1', type: 'kulteri' },
    { id: 'ovi_2', name: 'Óvi #2', type: 'kulteri' },
    { id: 'karam_1', name: 'Karám #1', type: 'kulteri' },
    { id: 'karam_2', name: 'Karám #2', type: 'kulteri' },
    { id: 'karam_3', name: 'Karám #3', type: 'kulteri' },
    { id: 'harem_1', name: 'Hárem #1', type: 'kulteri' },
    { id: 'harem_2', name: 'Hárem #2', type: 'kulteri' },
    { id: 'harem_3', name: 'Hárem #3', type: 'kulteri' },
  ];

  // ✅ AUTOMATIKUS FELADATOK ELŐNÉZET
  const getUpcomingTasks = (birthDate: string, category: string) => {
    if (!birthDate) return [];
    
    const birth = new Date(birthDate);
    const tasks = [];
    
    // 15 napos feladat
    const task15Days = new Date(birth);
    task15Days.setDate(task15Days.getDate() + 15);
    if (task15Days > new Date()) {
      tasks.push({
        date: task15Days.toLocaleDateString('hu-HU'),
        task: 'Fülszám + BoviPast + szarvtalanítás',
        priority: 'magas'
      });
    }
    
    // 6 hónapos feladat
    const task6Months = new Date(birth);
    task6Months.setMonth(task6Months.getMonth() + 6);
    if (task6Months > new Date()) {
      tasks.push({
        date: task6Months.toLocaleDateString('hu-HU'),
        task: 'Leválasztás anyjától',
        priority: 'magas'
      });
    }
    
    // 12 hónapos feladat
    const task12Months = new Date(birth);
    task12Months.setMonth(task12Months.getMonth() + 12);
    if (task12Months > new Date()) {
      tasks.push({
        date: task12Months.toLocaleDateString('hu-HU'),
        task: category === 'hízóbika' ? 'Hízóbika karámba mozgatás' : 'Óviba mozgatás',
        priority: 'közepes'
      });
    }
    
    // 24 hónapos feladat (csak nőivar)
    if (formData.ivar === 'nőivar') {
      const task24Months = new Date(birth);
      task24Months.setMonth(task24Months.getMonth() + 24);
      if (task24Months > new Date()) {
        tasks.push({
          date: task24Months.toLocaleDateString('hu-HU'),
          task: 'Hárembe kerülés előkészítés',
          priority: 'közepes'
        });
      }
    }
    
    return tasks.slice(0, 3); // Első 3 feladat
  };

  // ✅ NAVIGÁCIÓ
  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  // ✅ MENTÉS
  const handleSubmit = async () => {
    // Mock mentés - később API hívás lesz
    const finalData = {
      ...formData,
      kategoria: getAutoCategory(formData.szuletesi_datum, formData.ivar),
      létrehozva: new Date().toISOString(),
      utolso_modositas: new Date().toISOString(),
      statusz: 'aktív'
    };
    
    console.log('🐄 Állat mentése:', finalData);
    
    // Szimuláljunk egy API hívást
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Siker üzenet
    alert(`✅ Állat sikeresen hozzáadva!\n\nENAR: ${formData.enar}\nKategória: ${getCategoryDisplay(getAutoCategory(formData.szuletesi_datum, formData.ivar))}\nKarám: ${formData.jelenlegi_karam}`);
    
    // Navigáljunk az állat részleteihez
    router.push(`/dashboard/animals/${formData.enar}`);
  };

  const currentCategory = getAutoCategory(formData.szuletesi_datum, formData.ivar);
  const recommendedPens = getRecommendedPens(formData.szuletesi_datum, currentCategory);
  const upcomingTasks = getUpcomingTasks(formData.szuletesi_datum, currentCategory);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center">
          <button
            onClick={handleBack}
            className="mr-4 text-gray-400 hover:text-gray-600"
          >
            ← Vissza
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Új állat hozzáadása</h1>
            <p className="mt-1 text-sm text-gray-500">
              Lépésről lépésre adatlap kitöltés és automatikus feladat generálás
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${
                currentStep >= step 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-300 text-gray-600'
              }`}>
                {currentStep > step ? '✓' : step}
              </div>
              <div className={`text-sm ml-3 ${
                currentStep >= step ? 'text-green-600 font-medium' : 'text-gray-500'
              }`}>
                {step === 1 && 'Alapadatok'}
                {step === 2 && 'Elhelyezés'}
                {step === 3 && 'Ellenőrzés'}
              </div>
              {step < 3 && (
                <div className={`w-20 h-1 mx-4 ${
                  currentStep > step ? 'bg-green-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white shadow rounded-lg p-6">
        {/* STEP 1: ALAPADATOK */}
        {currentStep === 1 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              📋 Alapadatok
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ENAR */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ENAR szám *
                </label>
                <input
                  type="text"
                  placeholder="HU1234567890"
                  value={formData.enar}
                  onChange={(e) => setFormData({ ...formData, enar: e.target.value.toUpperCase() })}
                  className={`w-full px-3 py-2 border rounded-md text-sm font-mono ${
                    errors.enar ? 'border-red-300' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                />
                {errors.enar && <p className="mt-1 text-sm text-red-600">{errors.enar}</p>}
                <p className="mt-1 text-xs text-gray-500">HU + 10 számjegy formátum</p>
              </div>

              {/* Születési dátum */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Születési dátum *
                </label>
                <input
                  type="date"
                  value={formData.szuletesi_datum}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setFormData({ ...formData, szuletesi_datum: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md text-sm ${
                    errors.szuletesi_datum ? 'border-red-300' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                />
                {errors.szuletesi_datum && <p className="mt-1 text-sm text-red-600">{errors.szuletesi_datum}</p>}
                {formData.szuletesi_datum && (
                  <p className="mt-1 text-sm text-green-600 font-medium">
                    ⏰ Életkor: {calculateAge(formData.szuletesi_datum)}
                  </p>
                )}
              </div>

              {/* Ivar */}
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

              {/* Automatikus kategória */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Automatikus kategória
                </label>
                <div className={`px-3 py-2 border rounded-md text-sm ${
                  currentCategory ? 'bg-green-50 border-green-300 text-green-800' : 'bg-gray-50 border-gray-300 text-gray-600'
                }`}>
                  {currentCategory 
                    ? `🐄 ${getCategoryDisplay(currentCategory)}`
                    : 'Születési dátum és ivar alapján kalkulálva'
                  }
                </div>
              </div>

              {/* Anya ENAR */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anya ENAR
                </label>
                <input
                  type="text"
                  placeholder="HU1234567890"
                  value={formData.anya_enar}
                  onChange={(e) => setFormData({ ...formData, anya_enar: e.target.value.toUpperCase() })}
                  className={`w-full px-3 py-2 border rounded-md text-sm font-mono ${
                    errors.anya_enar ? 'border-red-300' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                />
                {errors.anya_enar && <p className="mt-1 text-sm text-red-600">{errors.anya_enar}</p>}
              </div>

              {/* Apa ENAR */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apa ENAR
                </label>
                <input
                  type="text"
                  placeholder="HU1234567890"
                  value={formData.apa_enar}
                  onChange={(e) => setFormData({ ...formData, apa_enar: e.target.value.toUpperCase() })}
                  className={`w-full px-3 py-2 border rounded-md text-sm font-mono ${
                    errors.apa_enar ? 'border-red-300' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                />
                {errors.apa_enar && <p className="mt-1 text-sm text-red-600">{errors.apa_enar}</p>}
              </div>

              {/* KPLSZ */}
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

              {/* Születési súly */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Születési súly (kg)
                </label>
                <input
                  type="number"
                  placeholder="40"
                  min="20"
                  max="80"
                  value={formData.szuletesi_suly}
                  onChange={(e) => setFormData({ ...formData, szuletesi_suly: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: ELHELYEZÉS */}
        {currentStep === 2 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              🏠 Elhelyezés és karám kiválasztás
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Karám választás */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jelenlegi karám *
                </label>
                
                {/* Ajánlott karámok */}
                {recommendedPens.length > 0 && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                    <h4 className="text-sm font-medium text-green-900 mb-2">
                      💡 Ajánlott karámok ({calculateAge(formData.szuletesi_datum)} korosztályhoz):
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {recommendedPens.map(pen => (
                        <button
                          key={pen}
                          type="button"
                          onClick={() => setFormData({ ...formData, jelenlegi_karam: pen })}
                          className={`p-2 text-sm rounded-md border ${
                            formData.jelenlegi_karam === pen
                              ? 'bg-green-600 text-white border-green-600'
                              : 'bg-white text-green-800 border-green-300 hover:bg-green-100'
                          }`}
                        >
                          {pen}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <select
                  value={formData.jelenlegi_karam}
                  onChange={(e) => setFormData({ ...formData, jelenlegi_karam: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md text-sm ${
                    errors.jelenlegi_karam ? 'border-red-300' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                >
                  <option value="">Válassz karámot</option>
                  <optgroup label="🏥 Ellető istálló">
                    {getAllPenOptions().filter(p => p.type === 'elleto').map(pen => (
                      <option key={pen.id} value={pen.name}>{pen.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="🌾 Külteri karámok">
                    {getAllPenOptions().filter(p => p.type === 'kulteri').map(pen => (
                      <option key={pen.id} value={pen.name}>{pen.name}</option>
                    ))}
                  </optgroup>
                </select>
                {errors.jelenlegi_karam && <p className="mt-1 text-sm text-red-600">{errors.jelenlegi_karam}</p>}
              </div>

              {/* Bekerülés dátuma */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bekerülés dátuma *
                </label>
                <input
                  type="date"
                  value={formData.bekerules_datum}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setFormData({ ...formData, bekerules_datum: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md text-sm ${
                    errors.bekerules_datum ? 'border-red-300' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                />
                {errors.bekerules_datum && <p className="mt-1 text-sm text-red-600">{errors.bekerules_datum}</p>}
              </div>
            </div>

            {/* Karám tippek */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="text-sm font-medium text-blue-900 mb-2">📋 Karám kiválasztási útmutató:</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>🍼 0-2 hónap:</strong> Ellető istálló - Fogadó bokszok</p>
                    <p><strong>👶 2-6 hónap:</strong> Ellető istálló - Belső karámok (anyával)</p>
                    <p><strong>🌱 6-12 hónap:</strong> Bölcsi karámok</p>
                  </div>
                  <div>
                    <p><strong>🌾 12-24 hónap:</strong> Óvi karámok</p>
                    <p><strong>♀️ 24+ hó üszők:</strong> Hárem karámok</p>
                    <p><strong>♂️ Hízóbikák:</strong> Külön karámok</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: ELLENŐRZÉS */}
        {currentStep === 3 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              ✅ Adatok ellenőrzése és automatikus feladatok
            </h3>
            
            {/* Állat adatok összefoglaló */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">🐄 Állat adatok összefoglaló</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">ENAR:</dt>
                  <dd className="text-sm text-gray-900 font-mono">{formData.enar}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Születési dátum:</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(formData.szuletesi_datum).toLocaleDateString('hu-HU')} 
                    <span className="text-green-600 font-medium ml-2">
                      ({calculateAge(formData.szuletesi_datum)})
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Ivar:</dt>
                  <dd className="text-sm text-gray-900">
                    {formData.ivar === 'hímivar' ? '♂️ Hímivar' : '♀️ Nőivar'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Automatikus kategória:</dt>
                  <dd className="text-sm text-gray-900 font-medium text-green-600">
                    🐄 {getCategoryDisplay(currentCategory)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Jelenlegi karám:</dt>
                  <dd className="text-sm text-gray-900">📍 {formData.jelenlegi_karam}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Bekerülés:</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(formData.bekerules_datum).toLocaleDateString('hu-HU')}
                  </dd>
                </div>
                {formData.anya_enar && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Anya ENAR:</dt>
                    <dd className="text-sm text-gray-900 font-mono">🤱 {formData.anya_enar}</dd>
                  </div>
                )}
                {formData.apa_enar && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Apa ENAR:</dt>
                    <dd className="text-sm text-gray-900 font-mono">👨 {formData.apa_enar}</dd>
                  </div>
                )}
                {formData.kplsz && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">KPLSZ:</dt>
                    <dd className="text-sm text-gray-900 font-mono">{formData.kplsz}</dd>
                  </div>
                )}
                {formData.szuletesi_suly && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Születési súly:</dt>
                    <dd className="text-sm text-gray-900">{formData.szuletesi_suly} kg</dd>
                  </div>
                )}
              </div>
            </div>

            {/* Automatikus feladatok előnézet */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h4 className="text-md font-medium text-green-900 mb-4">
                ⏰ Automatikusan létrejövő feladatok
              </h4>
              <p className="text-sm text-green-800 mb-4">
                A mentés után ezek a feladatok automatikusan létrejönnek az állat születési dátuma alapján:
              </p>
              
              {upcomingTasks.length > 0 ? (
                <div className="space-y-3">
                  {upcomingTasks.map((task, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded-md border border-green-200">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{task.task}</p>
                        <p className="text-xs text-gray-500">📅 Esedékes: {task.date}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-md ${
                        task.priority === 'magas' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-green-700">
                    ℹ️ Az állat életkora alapján jelenleg nincsenek esedékes automatikus feladatok.
                  </p>
                </div>
              )}
            </div>

            {/* Következő lépések */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="text-md font-medium text-blue-900 mb-2">
                🚀 Mentés után automatikusan történik:
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Állat hozzáadása az adatbázishoz</li>
                <li>• Karám létszám frissítése</li>
                <li>• Automatikus feladatok generálása</li>
                <li>• Egészségügyi naptár bejegyzések</li>
                <li>• Átirányítás az állat részletes adatlapjára</li>
              </ul>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={handleBack}
            className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            {currentStep === 1 ? '← Mégse' : '← Vissza'}
          </button>

          {currentStep < 3 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
              Következő → 
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-8 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors flex items-center"
            >
              <span className="mr-2">🐄</span>
              Állat mentése és befejezés
            </button>
          )}
        </div>

        {/* Debug info (dev only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-md">
            <details>
              <summary className="text-sm font-medium text-gray-600 cursor-pointer">
                🔧 Debug Info (csak fejlesztéskor)
              </summary>
              <pre className="mt-2 text-xs text-gray-500 overflow-auto">
                {JSON.stringify({ 
                  formData, 
                  currentCategory, 
                  recommendedPens, 
                  upcomingTasks,
                  errors 
                }, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
