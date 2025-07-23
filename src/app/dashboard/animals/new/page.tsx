'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const BREEDS = [
  'Blonde d\'aquitaine',
  'Limousin', 
  'Magyartarka',
  'Egyéb húshasznú',
  'Egyéb tejhasznú'
];

interface Animal {
  id?: number;
  enar: string;
  szuletesi_datum: string;
  ivar: 'hím' | 'nő';
  kategoria: string;
  jelenlegi_karam?: string;
  statusz: string;
  anya_enar?: string;
  apa_enar?: string;
  kplsz?: string;
  bekerules_datum?: string;
  fotok?: string[];
  name?: string;
  breed?: string;
  birth_location?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface Pen {
  id: number;
  pen_number: string;
  pen_type: string;
  location?: string;
}

export default function NewAnimalPage() {
  console.log('🚀 NEW ANIMAL PAGE LOADED - VERSION 2.0 - CACHE BUSTER');
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [existingAnimals, setExistingAnimals] = useState<Animal[]>([]);
  const [availablePens, setAvailablePens] = useState<Pen[]>([]);
  const [loading, setLoading] = useState(false);

  // Form adatok
  const [formData, setFormData] = useState({
    // Alapadatok
    enar: '',
    szuletesi_datum: '',
    ivar: '' as '' | 'hímivar' | 'nőivar',
    eredet: '' as '' | 'nalunk_szuletett' | 'vasarolt',
    name: '',
    breed: '',

    // Szülők (nálunk született)
    anya_enar: '',
    apa_enar: '',
    apa_tipus: '' as '' | 'termeszetes' | 'mesterseges' | 'ismeretlen',
    kplsz: '',

    // Szülők (vásárolt)
    anya_enar_manual: '',
    apa_enar_manual: '',

    // Elhelyezés
    jelenlegi_karam: '',
    bekerules_datum: '',
    statusz: 'aktív'
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Adatok betöltése
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Meglévő állatok betöltése
        const { data: animals } = await supabase
          .from('animals')
          .select('enar, kategoria, ivar')
          .order('enar');
        
        setExistingAnimals((animals as Animal[]) || []);

        // Elérhető karámok betöltése
        const { data: pens } = await supabase
          .from('pens')
          .select('id, pen_number, pen_type, location')
          .order('pen_number');
        
        setAvailablePens((pens as Pen[]) || []);
      } catch (error) {
        console.error('❌ Adatok betöltési hiba:', error);
      }
    };

    fetchData();
  }, []);

  // Kategória automatikus kalkuláció
  const calculateCategory = (birthDate: string, gender: 'hímivar' | 'nőivar'): string => {
    const birth = new Date(birthDate);
    const now = new Date();
    const ageInMonths = (now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.44);

    if (ageInMonths < 6) {
      return gender === 'hímivar' ? 'hímivarú_borjú' : 'nőivarú_borjú';
    }

    if (gender === 'hímivar') {
      return 'hízóbika';
    } else {
      if (ageInMonths >= 24) return 'szűz_üsző';
      return 'nőivarú_borjú';
    }
  };

  // Karám javaslatok kategória alapján
  const getKaramSuggestions = (category: string): Pen[] => {
    const categoryKeywords: { [key: string]: string[] } = {
      'nőivarú_borjú': ['bölcsi', 'ellető'],
      'hímivarú_borjú': ['bölcsi', 'ellető'],
      'hízóbika': ['hízó', 'bika'],
      'szűz_üsző': ['óvi', 'üsző'],
      'tehén': ['hárem', 'vemhes', 'tehén'],
      'tenyészbika': ['hárem', 'bika', 'tenyész']
    };

    const keywords = categoryKeywords[category] || [];
    return availablePens.filter(pen =>
      keywords.some(keyword =>
        pen.pen_type?.toLowerCase().includes(keyword) ||
        pen.pen_number?.toLowerCase().includes(keyword)
      )
    );
  };

  // Potenciális anyák (nőivar + megfelelő kategória)
  const getPotentialMothers = (): Animal[] => {
  return existingAnimals.filter(animal =>
    animal.ivar === 'nő' &&  // ✅ 'nőivar' → 'nő'
    ['tehén', 'szűz_üsző', 'vemhes_üsző'].includes(animal.kategoria)
  );
};

  // Potenciális apák (hímivar + tenyészbika)
  const getPotentialFathers = (): Animal[] => {
  return existingAnimals.filter(animal =>
    animal.ivar === 'hím' &&  // ✅ 'hímivar' → 'hím'
    animal.kategoria === 'tenyészbika'
  );
};

  // Validációs függvények
  const validateStep1 = (): boolean => {
    const newErrors: { [key: string]: string } = {};

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

    if (!formData.breed) {
      newErrors.breed = 'Fajta megadása kötelező';
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
    const newErrors: { [key: string]: string } = {};

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

  // Mentés Supabase-be
  const handleSave = async () => {
    if (!validateStep2()) return;

    try {
      setLoading(true);
      
      console.log('🔍 FormData:', formData);
      
      // TypeScript típus ellenőrzés
      if (!formData.ivar || !formData.szuletesi_datum) {
        setErrors({ general: 'Hiányos adatok. Kérjük töltse ki az összes kötelező mezőt.' });
        return;
      }

      const category = calculateCategory(formData.szuletesi_datum, formData.ivar as 'hímivar' | 'nőivar');

      // Kiválasztott karám ID-jának megkeresése
      const selectedPen = availablePens.find(pen => pen.pen_number === formData.jelenlegi_karam);
      if (!selectedPen) {
        setErrors({ jelenlegi_karam: 'Érvénytelen karám kiválasztás' });
        return;
      }

      console.log('🏠 Kiválasztott karám:', selectedPen);

      const newAnimal: any = {
        enar: formData.enar,
        szuletesi_datum: formData.szuletesi_datum,
        ivar: formData.ivar,
        kategoria: category,
        statusz: formData.statusz,
        bekerules_datum: formData.bekerules_datum || formData.szuletesi_datum,
        name: formData.name || null,
        breed: formData.breed,
        birth_location: formData.eredet === 'nalunk_szuletett' ? 'farm' : 'external',
        notes: null,
        jelenlegi_karam: formData.jelenlegi_karam // Hozzáadjuk a jelenlegi karám mezőt is
      };

      console.log('🐄 NewAnimal objektum (szülők nélkül):', newAnimal);

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
      
      // EXPLICIT birth_location beállítás a szülők beállítása UTÁN!
      if (formData.eredet === 'nalunk_szuletett') {
        newAnimal.birth_location = 'nálunk';
      } else if (formData.eredet === 'vasarolt') {
        newAnimal.birth_location = 'vásárolt';  
      } else {
        newAnimal.birth_location = 'ismeretlen';
      }

      console.log('🐄 Végső newAnimal objektum (szülőkkel):', newAnimal);

      console.log('🔍 birth_location érték:', newAnimal.birth_location);
      console.log('🔍 formData.eredet:', formData.eredet);

      // Állat mentése
      console.log('💾 Állat mentése az adatbázisba...');
      const { data: animalData, error: animalError } = await supabase
        .from('animals')
        .insert([newAnimal])
        .select()
        .single();

      if (animalError) {
        console.error('❌ Állat mentési hiba:', animalError);
        alert(`❌ Állat mentési hiba: ${animalError.message}\nKód: ${animalError.code}\nRészletek: ${animalError.details}`);
        throw animalError;
      }

      console.log('✅ Állat sikeresen mentve:', animalData);

      // Karám hozzárendelés
      console.log('🏠 Karám hozzárendelés létrehozása...');
      const { error: assignmentError } = await supabase
        .from('animal_pen_assignments')
        .insert([{
          animal_id: animalData.id,
          pen_id: selectedPen.id,
          assigned_at: formData.bekerules_datum || formData.szuletesi_datum,
          assignment_reason: 'initial_assignment',
          notes: 'Új állat regisztráció'
        }]);

      if (assignmentError) {
        console.error('❌ Karám hozzárendelési hiba:', assignmentError);
        throw assignmentError;
      }

      console.log('✅ Karám hozzárendelés sikeres');

      // Esemény naplózása
      console.log('📊 Esemény naplózása...');
      const { error: eventError } = await supabase
        .from('animal_events')
        .insert([{
          animal_id: animalData.id,
          event_type: 'registration',
          event_date: formData.bekerules_datum || formData.szuletesi_datum,
          pen_id: selectedPen.id,
          notes: `Új állat regisztrálva: ${formData.enar}`,
          reason: 'initial_registration'
        }]);

      if (eventError) {
        console.warn('⚠️ Esemény naplózási hiba:', eventError);
      } else {
        console.log('✅ Esemény naplózása sikeres');
      }

      alert('✅ Állat sikeresen regisztrálva!');
      router.push(`/dashboard/animals/${animalData.enar}`);
      
    } catch (error: any) {
      console.error('❌ Mentési hiba:', error);
      console.error('❌ Hiba részletei:', JSON.stringify(error, null, 2));
      
      // Részletes hibaüzenet
      let errorMessage = 'Ismeretlen hiba';
      if (error?.message) errorMessage = error.message;
      if (error?.details) errorMessage += ` - ${error.details}`;
      if (error?.hint) errorMessage += ` (${error.hint})`;
      
      alert(`❌ Mentési hiba: ${errorMessage}\nHibakód: ${error.code || 'ismeretlen'}`);
      setErrors({ general: `Mentési hiba történt: ${errorMessage}` });
    } finally {
      setLoading(false);
    }
  };

  // Kategória előnézet
  const previewCategory = (formData.szuletesi_datum && formData.ivar && formData.ivar.length > 0)
    ? calculateCategory(formData.szuletesi_datum, formData.ivar)
    : '';

  // Karám javaslatok
  const karamSuggestions = (previewCategory && typeof previewCategory === 'string')
    ? getKaramSuggestions(previewCategory)
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header - DESIGN SYSTEM */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-4xl mr-4">🐄</span>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Új állat hozzáadása</h1>
                <p className="mt-2 text-gray-600">3 lépéses wizard az állat adatainak rögzítéséhez</p>
              </div>
            </div>
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-gray-600 p-2 transition-colors"
            >
              ⬅️
            </button>
          </div>
        </div>

        {/* Progress Bar - DESIGN SYSTEM */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4 w-full">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                {step > 1 ? '✅' : '1'}
              </div>
              <div className={`h-2 flex-1 max-w-20 rounded-full ${step >= 2 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                {step > 2 ? '✅' : '2'}
              </div>
              <div className={`h-2 flex-1 max-w-20 rounded-full ${step >= 3 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                {step > 3 ? '✅' : '3'}
              </div>
            </div>
          </div>

          <div className="flex justify-between text-sm text-gray-600">
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
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          {/* STEP 1: Alapadatok */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center mb-6">
                <span className="text-2xl mr-3">🐄</span>
                <h2 className="text-xl font-semibold text-gray-900">Alapadatok megadása</h2>
              </div>

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
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${errors.enar ? 'border-red-500' : ''
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
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${errors.szuletesi_datum ? 'border-red-500' : ''
                      }`}
                  />
                  {errors.szuletesi_datum && <p className="text-red-500 text-sm mt-1">{errors.szuletesi_datum}</p>}
                </div>

                {/* Ivar */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ⚥ Ivar *
                  </label>
                  <select
                    value={formData.ivar}
                    onChange={(e) => setFormData(prev => ({ ...prev, ivar: e.target.value as 'hímivar' | 'nőivar' }))}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white ${errors.ivar ? 'border-red-500' : ''
                      }`}
                  >
                    <option value="">Válasszon...</option>
                    <option value="hím">♂️ hímivar</option>
                    <option value="nő">♀️ nőivar</option>
                  </select>
                  {errors.ivar && <p className="text-red-500 text-sm mt-1">{errors.ivar}</p>}
                </div>

                {/* Kategória előnézet */}
                {previewCategory && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🎯 Kategória (automatikus)
                    </label>
                    <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-800 font-medium">
                      {previewCategory}
                    </div>
                  </div>
                )}
              </div>

              {/* Név és Fajta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Név */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📝 Név
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Állat neve (opcionális)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  />
                </div>

                {/* Fajta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🐄 Fajta *
                  </label>
                  <select
                    value={formData.breed}
                    onChange={(e) => setFormData(prev => ({ ...prev, breed: e.target.value }))}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white ${errors.breed ? 'border-red-500' : ''
                      }`}
                  >
                    <option value="">Válasszon fajtát...</option>
                    {BREEDS.map(breed => (
                      <option key={breed} value={breed}>
                        {breed}
                      </option>
                    ))}
                  </select>
                  {errors.breed && <p className="text-red-500 text-sm mt-1">{errors.breed}</p>}
                </div>
              </div>

              {/* Állat eredete */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  🌍 Az állat eredete *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className={`cursor-pointer p-6 border-2 rounded-lg transition-colors ${formData.eredet === 'nalunk_szuletett'
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
                      <div className="text-3xl mb-3">🏠</div>
                      <div className="font-medium text-lg">Nálunk született</div>
                      <div className="text-sm text-gray-600 mt-2">
                        Szülők kiválasztása listából
                      </div>
                    </div>
                  </label>

                  <label className={`cursor-pointer p-6 border-2 rounded-lg transition-colors ${formData.eredet === 'vasarolt'
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
                      <div className="text-3xl mb-3">🛒</div>
                      <div className="font-medium text-lg">Vásárolt állat</div>
                      <div className="text-sm text-gray-600 mt-2">
                        Szülők kézi megadása
                      </div>
                    </div>
                  </label>
                </div>
                {errors.eredet && <p className="text-red-500 text-sm mt-1">{errors.eredet}</p>}
              </div>

              {/* Szülők - Nálunk született */}
              {formData.eredet === 'nalunk_szuletett' && (
                <div className="bg-green-50 rounded-lg border border-green-200 p-6 space-y-4">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🐮❤️🐂</span>
                    <h3 className="font-medium text-green-800">Szülők kiválasztása</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Anya */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🐮 Anya
                      </label>
                      <select
                        value={formData.anya_enar}
                        onChange={(e) => setFormData(prev => ({ ...prev, anya_enar: e.target.value }))}
                        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white ${errors.anya_enar ? 'border-red-500' : ''
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
                        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white ${errors.apa_tipus ? 'border-red-500' : ''
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
                        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white ${errors.apa_enar ? 'border-red-500' : ''
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
                        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${errors.kplsz ? 'border-red-500' : ''
                          }`}
                      />
                      {errors.kplsz && <p className="text-red-500 text-sm mt-1">{errors.kplsz}</p>}
                    </div>
                  )}
                </div>
              )}

              {/* Szülők - Vásárolt állat */}
              {formData.eredet === 'vasarolt' && (
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 space-y-4">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🐮❤️🐂</span>
                    <h3 className="font-medium text-blue-800">Szülők kézi megadása (opcionális)</h3>
                  </div>

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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
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
              <div className="flex items-center mb-6">
                <span className="text-2xl mr-3">🏠</span>
                <h2 className="text-xl font-semibold text-gray-900">Elhelyezés és státusz</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Karám */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🏠 Jelenlegi karám *
                  </label>
                  <select
                    value={formData.jelenlegi_karam}
                    onChange={(e) => setFormData(prev => ({ ...prev, jelenlegi_karam: e.target.value }))}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white ${errors.jelenlegi_karam ? 'border-red-500' : ''
                      }`}
                  >
                    <option value="">Válasszon karámot...</option>
                    {karamSuggestions.length > 0 && (
                      <optgroup label="🎯 Ajánlott kategória alapján">
                        {karamSuggestions.map(pen => (
                          <option key={pen.id} value={pen.pen_number}>
                            {pen.pen_number} ({pen.pen_type})
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="🏠 Összes karám">
                      {availablePens.map(pen => (
                        <option key={pen.id} value={pen.pen_number}>
                          {pen.pen_number} - {pen.pen_type} {pen.location && `(${pen.location})`}
                        </option>
                      ))}
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
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${errors.bekerules_datum ? 'border-red-500' : ''
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white"
                  >
                    <option value="aktív">✅ Aktív</option>
                    <option value="eladott">💰 Eladott</option>
                    <option value="elhullott">💀 Elhullott</option>
                    <option value="házi_vágás">🔪 Házi vágás</option>
                    <option value="átadott">📤 Átadott</option>
                    <option value="selejtezett">❌ Selejtezett</option>
                    <option value="kikerült">🚪 Kikerült</option>
                  </select>
                </div>

                {/* Kategória ismétlés */}
                {previewCategory && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🎯 Kategória
                    </label>
                    <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-800 font-medium">
                      {previewCategory}
                    </div>
                  </div>
                )}
              </div>

              {/* Karám javaslatok */}
              {karamSuggestions.length > 0 && (
                <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                  <div className="flex items-center mb-3">
                    <span className="text-xl mr-2">🎯</span>
                    <h4 className="font-medium text-green-800">Ajánlott karámok a "{previewCategory}" kategóriához:</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {karamSuggestions.map(pen => (
                      <button
                        key={pen.id}
                        onClick={() => setFormData(prev => ({ ...prev, jelenlegi_karam: pen.pen_number }))}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${formData.jelenlegi_karam === pen.pen_number
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-green-700 border-green-300 hover:bg-green-100'
                          }`}
                      >
                        {pen.pen_number} ({pen.pen_type})
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
              <div className="flex items-center mb-6">
                <span className="text-2xl mr-3">✅</span>
                <h2 className="text-xl font-semibold text-gray-900">Adatok ellenőrzése</h2>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center mb-3">
                      <span className="text-xl mr-2">🐄</span>
                      <h3 className="font-medium text-gray-800">Alapadatok</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-600">ENAR:</span> <span className="font-medium">{formData.enar}</span></div>
                      <div><span className="text-gray-600">Név:</span> <span className="font-medium">{formData.name || 'Nincs megadva'}</span></div>
                      <div><span className="text-gray-600">Születés:</span> <span className="font-medium">{formData.szuletesi_datum}</span></div>
                      <div><span className="text-gray-600">Ivar:</span> <span className="font-medium">{formData.ivar === 'hímivar' ? '♂️ hímivar' : '♀️ nőivar'}</span></div>
                      <div><span className="text-gray-600">Fajta:</span> <span className="font-medium">{formData.breed}</span></div>
                      <div><span className="text-gray-600">Kategória:</span> <span className="font-medium text-green-600">{previewCategory}</span></div>
                      <div><span className="text-gray-600">Eredet:</span> <span className="font-medium">{formData.eredet === 'nalunk_szuletett' ? '🏠 Nálunk született' : '🛒 Vásárolt'}</span></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center mb-3">
                      <span className="text-xl mr-2">🏠</span>
                      <h3 className="font-medium text-gray-800">Elhelyezés</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-600">Karám:</span> <span className="font-medium">{formData.jelenlegi_karam}</span></div>
                      <div><span className="text-gray-600">Bekerülés:</span> <span className="font-medium">{formData.bekerules_datum}</span></div>
                      <div><span className="text-gray-600">Státusz:</span> <span className="font-medium">{formData.statusz}</span></div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center mb-3">
                    <span className="text-xl mr-2">🐮❤️🐂</span>
                    <h3 className="font-medium text-gray-800">Szülők</h3>
                  </div>
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

        {/* Navigation Buttons - DESIGN SYSTEM */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevStep}
              disabled={step === 1}
              className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-3 rounded-lg border border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
            >
              <span className="mr-2">⬅️</span>
              Vissza
            </button>

            <div className="text-sm text-gray-500">
              {step}. lépés / 3
            </div>

            {step < 3 ? (
              <button
                onClick={handleNextStep}
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors inline-flex items-center"
              >
                <span className="mr-2">➡️</span>
                Következő
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors inline-flex items-center disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Mentés...
                  </>
                ) : (
                  <>
                    <span className="mr-2">💾</span>
                    Állat mentése
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}