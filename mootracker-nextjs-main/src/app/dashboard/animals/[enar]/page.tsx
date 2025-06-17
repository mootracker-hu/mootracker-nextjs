'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

// Mock adat - később ezt az adatbázisból töltjük
const mockAnimalData: { [key: string]: any } = {
  'HU004001': {
    enar: 'HU004001',
    szuletesi_datum: '2023-04-15',
    ivar: 'hímivar',
    kategoria: 'hízóbika',
    jelenlegi_karam: 'Karám #1',
    statusz: 'aktív',
    anya_enar: 'HU001234',
    apa_enar: 'HU001111',
    kplsz: 'KPLSZ123456',
    bekerules_datum: '2023-04-15',
    fotok: [],
    utolso_modositas: '2025-06-13',
    létrehozva: '2023-04-15',
    
    szuletesi_suly: 42,
    jelenlegi_suly: 380,
    
    anya: {
      enar: 'HU001234',
      nev: 'Margit',
      kategoria: 'tehén'
    },
    apa: {
      enar: 'HU001111', 
      nev: 'Géza',
      kategoria: 'tenyészbika'
    },
    
    karam_tortenet: [
      { datum: '2023-04-15', karam: 'Ellető istálló - Fogadó #1', esemeny: 'Születés' },
      { datum: '2023-06-01', karam: 'Ellető istálló - Belső karám #1', esemeny: 'Átmozgatás' },
      { datum: '2023-10-15', karam: 'Bölcsi #1', esemeny: 'Leválasztás (6 hónapos)' },
      { datum: '2024-04-15', karam: 'Karám #1', esemeny: 'Hízóbika karámba (12 hónapos)' }
    ],
    
    egeszsegugyi_tortenet: [
      { datum: '2023-04-30', esemeny: 'Fülszám + BoviPast + szarvtalanítás', kezelo: 'Dr. Nagy Péter' },
      { datum: '2023-10-15', esemeny: 'Leválasztás vakcinák', kezelo: 'Dr. Nagy Péter' },
      { datum: '2024-01-15', esemeny: 'IBR + BVD vakcina', kezelo: 'Dr. Nagy Péter' },
      { datum: '2024-06-01', esemeny: 'Ivermectin + körmölés', kezelo: 'Dr. Nagy Péter' }
    ],
    
    suly_fejlodes: [
      { datum: '2023-04-15', suly: 42, esemeny: 'Születési súly' },
      { datum: '2023-07-15', suly: 95, esemeny: '3 hónapos mérés' },
      { datum: '2023-10-15', suly: 160, esemeny: 'Leválasztáskor' },
      { datum: '2024-01-15', suly: 220, esemeny: '9 hónapos' },
      { datum: '2024-04-15', suly: 290, esemeny: '12 hónapos' },
      { datum: '2024-06-13', suly: 380, esemeny: 'Jelenlegi súly' }
    ],
    
    aktualis_feladatok: [
      { tipus: 'értékelés', esedekesseg: '2024-06-15', leiras: '14 hónapos hízóbika értékelés', prioritas: 'magas' },
      { tipus: 'vakcina', esedekesseg: '2024-07-15', leiras: 'IBR ismétlő vakcina', prioritas: 'közepes' },
      { tipus: 'suly_meres', esedekesseg: '2024-07-01', leiras: 'Havi súlymérés', prioritas: 'alacsony' }
    ]
  },
  'HU002004': {
    enar: 'HU002004',
    szuletesi_datum: '2022-12-10',
    ivar: 'nőivar',
    kategoria: 'vemhes_üsző',
    jelenlegi_karam: 'Hárem #2',
    statusz: 'aktív',
    anya_enar: 'HU001235',
    apa_enar: 'HU001112',
    kplsz: 'KPLSZ234567',
    bekerules_datum: '2022-12-10',
    fotok: [],
    utolso_modositas: '2025-06-13',
    létrehozva: '2022-12-10',
    
    szuletesi_suly: 38,
    jelenlegi_suly: 520,
    
    anya: {
      enar: 'HU001235',
      nev: 'Klára',
      kategoria: 'tehén'
    },
    apa: {
      enar: 'HU001112', 
      nev: 'Béla',
      kategoria: 'tenyészbika'
    },
    
    karam_tortenet: [
      { datum: '2022-12-10', karam: 'Ellető istálló - Fogadó #2', esemeny: 'Születés' },
      { datum: '2023-02-15', karam: 'Bölcsi #2', esemeny: 'Átmozgatás' },
      { datum: '2023-12-10', karam: 'Óvi #1', esemeny: 'Leválasztás' },
      { datum: '2024-12-10', karam: 'Hárem #2', esemeny: 'Hárembe kerülés (24 hónapos)' }
    ],
    
    egeszsegugyi_tortenet: [
      { datum: '2022-12-25', esemeny: 'Fülszám + BoviPast + szarvtalanítás', kezelo: 'Dr. Nagy Péter' },
      { datum: '2023-06-10', esemeny: 'Leválasztás vakcinák', kezelo: 'Dr. Nagy Péter' },
      { datum: '2024-01-10', esemeny: 'IBR + BVD vakcina', kezelo: 'Dr. Nagy Péter' },
      { datum: '2024-12-10', esemeny: 'Hárembe kerülés vizsgálat', kezelo: 'Dr. Nagy Péter' }
    ],
    
    suly_fejlodes: [
      { datum: '2022-12-10', suly: 38, esemeny: 'Születési súly' },
      { datum: '2023-03-10', suly: 85, esemeny: '3 hónapos mérés' },
      { datum: '2023-06-10', suly: 150, esemeny: 'Leválasztáskor' },
      { datum: '2023-12-10', suly: 280, esemeny: '12 hónapos' },
      { datum: '2024-06-10', suly: 420, esemeny: '18 hónapos' },
      { datum: '2024-12-10', suly: 520, esemeny: 'Hárembe kerüléskor' }
    ],
    
    aktualis_feladatok: [
      { tipus: 'vemhesseg_vizsgalat', esedekesseg: '2025-03-10', leiras: 'Vemhességvizsgálat - hárem után 3 hónap', prioritas: 'magas' },
      { tipus: 'vakcina', esedekesseg: '2025-07-10', leiras: 'IBR ismétlő vakcina', prioritas: 'közepes' }
    ]
  },
  'HU003021': {
    enar: 'HU003021',
    szuletesi_datum: '2020-03-22',
    ivar: 'nőivar',
    kategoria: 'tehén',
    jelenlegi_karam: 'Karám #4',
    statusz: 'aktív',
    anya_enar: 'HU001236',
    apa_enar: 'HU001113',
    kplsz: 'KPLSZ345678',
    bekerules_datum: '2020-03-22',
    fotok: [],
    utolso_modositas: '2025-06-13',
    létrehozva: '2020-03-22',
    
    szuletesi_suly: 40,
    jelenlegi_suly: 650,
    
    anya: {
      enar: 'HU001236',
      nev: 'Erzsébet',
      kategoria: 'tehén'
    },
    apa: {
      enar: 'HU001113', 
      nev: 'Károly',
      kategoria: 'tenyészbika'
    },
    
    karam_tortenet: [
      { datum: '2020-03-22', karam: 'Ellető istálló - Fogadó #3', esemeny: 'Születés' },
      { datum: '2020-09-22', karam: 'Bölcsi #1', esemeny: 'Leválasztás' },
      { datum: '2021-03-22', karam: 'Óvi #1', esemeny: '12 hónapos' },
      { datum: '2022-03-22', karam: 'Hárem #1', esemeny: 'Első hárembe kerülés' },
      { datum: '2023-01-15', karam: 'Ellető istálló - Belső #1', esemeny: 'Első ellés' },
      { datum: '2023-10-15', karam: 'Karám #4', esemeny: 'Borjú leválasztás után' }
    ],
    
    egeszsegugyi_tortenet: [
      { datum: '2020-04-06', esemeny: 'Fülszám + BoviPast + szarvtalanítás', kezelo: 'Dr. Nagy Péter' },
      { datum: '2020-09-22', esemeny: 'Leválasztás vakcinák', kezelo: 'Dr. Nagy Péter' },
      { datum: '2022-03-22', esemeny: 'Hárembe kerülés vizsgálat', kezelo: 'Dr. Nagy Péter' },
      { datum: '2023-01-15', esemeny: 'Ellés utáni vizsgálat', kezelo: 'Dr. Nagy Péter' },
      { datum: '2024-06-01', esemeny: 'IBR + BVD + Ivermectin', kezelo: 'Dr. Nagy Péter' }
    ],
    
    suly_fejlodes: [
      { datum: '2020-03-22', suly: 40, esemeny: 'Születési súly' },
      { datum: '2020-06-22', suly: 95, esemeny: '3 hónapos' },
      { datum: '2020-09-22', suly: 170, esemeny: 'Leválasztáskor' },
      { datum: '2021-03-22', suly: 320, esemeny: '12 hónapos' },
      { datum: '2022-03-22', suly: 480, esemeny: 'Hárembe kerüléskor' },
      { datum: '2023-01-15', suly: 580, esemeny: 'Elléskor' },
      { datum: '2025-06-13', suly: 650, esemeny: 'Jelenlegi súly' }
    ],
    
    aktualis_feladatok: [
      { tipus: 'harem_elokeszites', esedekesseg: '2025-08-15', leiras: 'Következő hárembe kerülés előkészítés', prioritas: 'közepes' },
      { tipus: 'vakcina', esedekesseg: '2025-12-01', leiras: 'Éves IBR + BVD vakcina', prioritas: 'alacsony' }
    ]
  },
  'HU005012': {
    enar: 'HU005012',
    szuletesi_datum: '2023-08-05',
    ivar: 'nőivar',
    kategoria: 'növarú_borjú',
    jelenlegi_karam: 'Bölcsi #1',
    statusz: 'aktív',
    anya_enar: 'HU002004',
    apa_enar: 'HU001114',
    kplsz: 'KPLSZ456789',
    bekerules_datum: '2023-08-05',
    fotok: [],
    utolso_modositas: '2025-06-13',
    létrehozva: '2023-08-05',
    
    szuletesi_suly: 35,
    jelenlegi_suly: 180,
    
    anya: {
      enar: 'HU002004',
      nev: 'Vemhes üsző',
      kategoria: 'vemhes_üsző'
    },
    apa: {
      enar: 'HU001114', 
      nev: 'Dániel',
      kategoria: 'tenyészbika'
    },
    
    karam_tortenet: [
      { datum: '2023-08-05', karam: 'Ellető istálló - Fogadó #1', esemeny: 'Születés' },
      { datum: '2023-10-05', karam: 'Ellető istálló - Belső #1', esemeny: 'Anyával együtt' },
      { datum: '2024-02-05', karam: 'Bölcsi #1', esemeny: 'Leválasztás (6 hónapos)' }
    ],
    
    egeszsegugyi_tortenet: [
      { datum: '2023-08-20', esemeny: 'Fülszám + BoviPast + szarvtalanítás', kezelo: 'Dr. Nagy Péter' },
      { datum: '2024-02-05', esemeny: 'Leválasztás vakcinák', kezelo: 'Dr. Nagy Péter' },
      { datum: '2024-08-05', esemeny: '12 hónapos vizsgálat', kezelo: 'Dr. Nagy Péter' }
    ],
    
    suly_fejlodes: [
      { datum: '2023-08-05', suly: 35, esemeny: 'Születési súly' },
      { datum: '2023-11-05', suly: 75, esemeny: '3 hónapos mérés' },
      { datum: '2024-02-05', suly: 120, esemeny: 'Leválasztáskor' },
      { datum: '2024-08-05', suly: 180, esemeny: '12 hónapos súly' }
    ],
    
    aktualis_feladatok: [
      { tipus: 'ovi_atmozgatas', esedekesseg: '2024-08-05', leiras: '12 hónapos - Óviba átmozgatás', prioritas: 'magas' },
      { tipus: 'suly_meres', esedekesseg: '2025-07-01', leiras: 'Havi súlymérés', prioritas: 'alacsony' }
    ]
  }
};

export default function AnimalDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const enar = params?.enar as string;
  
  const [animal, setAnimal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  // Hozzáadás a komponens tetejéhez (useState importok mellé):
const [isEditing, setIsEditing] = useState(false);
const [editedAnimal, setEditedAnimal] = useState(null);

// Kategória opciók definiálása
const categoryOptions = [
  { value: 'tehén', label: 'Tehén' },
  { value: 'szűz_üsző', label: 'Szűz üsző' },
  { value: 'vemhes_üsző', label: 'Vemhes üsző' },
  { value: 'vemhesülés_alatt', label: 'Vemhesülés alatt' },
  { value: 'csira_üsző', label: 'Csira üsző' },
  { value: 'üres_üsző', label: 'Üres üsző' },
  { value: 'hímivarú_borjú', label: 'Hímivarú borjú' },
  { value: 'nőivarú_borjú', label: 'Nőivarú borjú' },
  { value: 'hízóbika', label: 'Hízóbika' },
  { value: 'tenyészbika', label: 'Tenyészbika' }
];

// Change handler függvény
const handleCategoryChange = (newCategory: string) => {
  setEditedAnimal(prev => ({
    ...prev,
    kategoria: newCategory
  }));
};

// Mentés handler
const handleSave = async () => {
  try {
    // Itt később Supabase UPDATE lesz
    console.log('Mentés:', editedAnimal);
    
    // Mock mentés - localStorage update
    const animals = JSON.parse(localStorage.getItem('mootracker_animals') || '[]');
    const updatedAnimals = animals.map((a: any) => 
      a.enar === animal.enar ? editedAnimal : a
    );
    localStorage.setItem('mootracker_animals', JSON.stringify(updatedAnimals));
    
    // State frissítés
    setAnimal(editedAnimal);
    setIsEditing(false);
    
    alert('Sikeresen mentve!');
  } catch (error) {
    console.error('Mentési hiba:', error);
    alert('Mentési hiba történt!');
  }
};

// Mégse handler
const handleCancel = () => {
  setEditedAnimal(animal); // Reset az eredeti állapotra
  setIsEditing(false);
};

// Edit gomb handler frissítése
const handleEditClick = () => {
  setEditedAnimal(animal); // Jelenlegi állat adatok betöltése
  setIsEditing(true);
};

useEffect(() => {
  const loadAnimal = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // localStorage-ból olvasás (HELYES KULCS!)
    const animals = JSON.parse(localStorage.getItem('mootracker_animals') || '[]');
    const animalData = animals.find(a => a.enar === enar);
    
    // Ha nincs localStorage-ban, próbáljuk mockAnimalData-ból
    const finalAnimalData = animalData || mockAnimalData[enar];
    
    if (finalAnimalData) {
      setAnimal(finalAnimalData);
      if (finalAnimalData) {
  setAnimal(finalAnimalData);
  setEditedAnimal(finalAnimalData);
    }
    setLoading(false);
  };
  if (enar) {
    loadAnimal();
  }
}, [enar]);

  const calculateAge = (birthDate: string) => {
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

  const getCategoryDisplay = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'tenyészbika': 'Tenyészbika',
      'hízóbika': 'Hízóbika', 
      'tehén': 'Tehén',
      'szűz_üsző': 'Szűz üsző',
      'vemhes_üsző': 'Vemhes üsző',
      'vemhesülés_alatt': 'Vemhesülés alatt',
      'nöivarú_borjú': 'Nöivarú borjú'
    };
    return categoryMap[category] || category;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'magas': return 'bg-red-100 text-red-800 border-red-200';
      case 'közepes': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'alacsony': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Betöltés...</div>
      </div>
    );
  }

  if (!animal) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-lg text-gray-600 mb-4">Az állat nem található</div>
        <button
          onClick={() => router.back()}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Vissza
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => router.back()}
                  className="mr-4 text-gray-400 hover:text-gray-600"
                >
                  ← Vissza
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{animal.enar}</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    {getCategoryDisplay(animal.kategoria)} • {calculateAge(animal.szuletesi_datum)} • {animal.jelenlegi_karam}
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => router.push(`/dashboard/animals/${enar}/edit`)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  ✏️ Szerkesztés
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                  📸 Fotó hozzáadása
                </button>
              </div>
            </div>

            <div className="mt-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { id: 'details', name: 'Részletek', icon: '📋' },
                    { id: 'health', name: 'Egészségügy', icon: '💊' },
                    { id: 'weight', name: 'Súly fejlődés', icon: '📊' },
                    { id: 'pens', name: 'Karám történet', icon: '🏠' },
                    { id: 'tasks', name: 'Feladatok', icon: '⏰' },
                    { id: 'photos', name: 'Fotók', icon: '📷' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="mr-1">{tab.icon}</span>
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'alapadatok' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Alapadatok</h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">ENAR:</dt>
                  <dd className="text-sm text-gray-900 font-mono">{animal.enar}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Születési dátum:</dt>
                  <dd className="text-sm text-gray-900">{new Date(animal.szuletesi_datum).toLocaleDateString('hu-HU')}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Életkor:</dt>
                  <dd className="text-sm text-gray-900">{calculateAge(animal.szuletesi_datum)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Ivar:</dt>
                  <dd className="text-sm text-gray-900">
                    {animal.ivar === 'hímivar' ? '♂️ Hímivar' : '♀️ Nőivar'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Kategória:</dt>
                  <dd className="text-sm text-gray-900"><dd className="text-sm text-gray-900">
  {isEditing ? (
    <select
      value={editedAnimal?.kategoria || animal.kategoria}
      onChange={(e) => handleCategoryChange(e.target.value)}
      className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
    >
      {categoryOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ) : (
    getCategoryDisplay(animal.kategoria)
  )}
</dd></dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Jelenlegi karám:</dt>
                  <dd className="text-sm text-gray-900">📍 {animal.jelenlegi_karam}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Státusz:</dt>
                  <dd className="text-sm text-gray-900">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      {animal.statusz}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Szülők</h3>
              <div className="space-y-4">
                {animal.anya && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">🐄 Anya</h4>
                        <p className="text-sm text-gray-600">{animal.anya.enar}</p>
                        <p className="text-xs text-gray-500">{getCategoryDisplay(animal.anya.kategoria)}</p>
                      </div>
                      <button
                        onClick={() => router.push(`/dashboard/animals/${animal.anya.enar}`)}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        Megtekintés →
                      </button>
                    </div>
                  </div>
                )}

                {animal.apa && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">🐂 Apa</h4>
                        <p className="text-sm text-gray-600">{animal.anya.enar}</p>
                        <p className="text-xs text-gray-500">{getCategoryDisplay(animal.anya.kategoria)}</p>
                      </div>
                      <button
                        onClick={() => router.push(`/dashboard/animals/${animal.anya.enar}`)}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        Megtekintés →
                      </button>
                    </div>
                  </div>
                )}

                {animal.apa && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">👨 Apa</h4>
                        <p className="text-sm text-gray-600">{animal.anya.enar}</p>
                        <p className="text-xs text-gray-500">{getCategoryDisplay(animal.anya.kategoria)}</p>
                      </div>
                      <button
                        onClick={() => router.push(`/dashboard/animals/${animal.anya.enar}`)}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        Megtekintés →
                      </button>
                    </div>
                  </div>
                )}

                {animal.apa && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">👨 Apa</h4>
                        <p className="text-sm text-gray-600">{animal.apa.enar}</p>
                        <p className="text-xs text-gray-500">{getCategoryDisplay(animal.apa.kategoria)}</p>
                      </div>
                      <button
                        onClick={() => router.push(`/dashboard/animals/${animal.apa.enar}`)}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        Megtekintés →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
  <h3 className="text-lg font-medium text-gray-900 mb-4">Jelenlegi Adatok</h3>
  <dl className="space-y-3">
    <div className="flex justify-between">
      <dt className="text-sm font-medium text-gray-500">Születési súly:</dt>
      <dd className="text-sm text-gray-900">
        {animal.szuletesi_suly ? `${animal.szuletesi_suly} kg` : 'Nem mért'}
      </dd>
    </div>
    <div className="flex justify-between">
      <dt className="text-sm font-medium text-gray-500">Jelenlegi súly:</dt>
      <dd className="text-sm text-gray-900 font-medium">
        {animal.jelenlegi_suly ? `${animal.jelenlegi_suly} kg` : 'Nem mért'}
      </dd>
    </div>
    <div className="flex justify-between">
      <dt className="text-sm font-medium text-gray-500">Súlygyarapodás:</dt>
      <dd className="text-sm text-gray-900">
        {animal.szuletesi_suly && animal.jelenlegi_suly 
          ? `${animal.jelenlegi_suly - animal.szuletesi_suly} kg`
          : 'Számíthatatlan'
        }
      </dd>
    </div>
  </dl>
</div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Sürgős Feladatok</h3>
              <div className="space-y-3">
                {animal.aktualis_feladatok.map((task: any, index: number) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{task.leiras}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          📅 Esedékes: {new Date(task.esedekesseg).toLocaleDateString('hu-HU')}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-md border ${getPriorityColor(task.prioritas)}`}>
                        {task.prioritas}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

       {activeTab === 'health' && (
  <div className="bg-white shadow rounded-lg p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Egészségügyi Történet</h3>
    <div className="space-y-4">
      {animal.egeszsegugyi_tortenet && animal.egeszsegugyi_tortenet.length > 0 ? (
        animal.egeszsegugyi_tortenet.map((record: any, index: number) => (
          <div key={index} className="border-l-4 border-green-400 pl-4 py-2">
            <div>
              <h4 className="text-sm font-medium text-gray-900">{record.esemeny}</h4>
              <p className="text-xs text-gray-500 mt-1">
                👨‍⚕️ {record.kezelo} • 📅 {new Date(record.datum).toLocaleDateString('hu-HU')}
              </p>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center text-gray-500 py-8">
          <p>🏥 Még nincs kezelési előzmény</p>
          <p className="text-sm">Az első kezelés után itt jelennek meg az adatok</p>
        </div>
      )}
    </div>
  </div>
)}
       {activeTab === 'weight' && (
  <div className="bg-white shadow rounded-lg p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Súly Fejlődés</h3>
    <div className="space-y-4">
      {animal.suly_fejlodes && animal.suly_fejlodes.length > 0 ? (
        animal.suly_fejlodes.map((record: any, index: number) => (
          <div key={index} className="flex items-center justify-between border-b border-gray-200 pb-2">
            <div>
              <p className="text-sm font-medium text-gray-900">{record.esemeny}</p>
              <p className="text-xs text-gray-500">{new Date(record.datum).toLocaleDateString('hu-HU')}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">{record.suly} kg</p>
              {index > 0 && (
                <p className="text-xs text-gray-500">
                  +{record.suly - animal.suly_fejlodes[index - 1].suly} kg
                </p>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center text-gray-500 py-8">
          <p>📊 Még nincs súlymérési adat</p>
          <p className="text-sm">Az első mérés után itt jelennek meg az adatok</p>
        </div>
      )}
    </div>
  </div>
)}

        {activeTab === 'pens' && (
  <div className="bg-white shadow rounded-lg p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Karám Történet</h3>
    <div className="space-y-4">
      {animal.karam_tortenet && animal.karam_tortenet.length > 0 ? (
        animal.karam_tortenet.map((record: any, index: number) => (
          <div key={index} className="border-l-4 border-blue-400 pl-4 py-2">
            <div>
              <h4 className="text-sm font-medium text-gray-900">{record.esemeny}</h4>
              <p className="text-sm text-gray-600">📍 {record.karam}</p>
              <p className="text-xs text-gray-500 mt-1">
                📅 {new Date(record.datum).toLocaleDateString('hu-HU')}
              </p>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center text-gray-500 py-8">
          <p>🏠 Születés óta: {animal.jelenlegi_karam}</p>
          <p className="text-sm">Mozgatások után itt jelenik meg a történet</p>
        </div>
      )}
    </div>
  </div>
)}

        {activeTab === 'tasks' && (
  <div className="bg-white shadow rounded-lg p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Feladatok</h3>
    <div className="space-y-4">
      {animal.aktualis_feladatok && animal.aktualis_feladatok.length > 0 ? (
        animal.aktualis_feladatok.map((task: any, index: number) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">{task.leiras}</h4>
                <p className="text-sm text-gray-600 mt-1">Típus: {task.tipus}</p>
                <p className="text-xs text-gray-500 mt-1">
                  📅 Esedékesség: {new Date(task.esedekesseg).toLocaleDateString('hu-HU')}
                </p>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-md border ${getPriorityColor(task.prioritas)}`}>
                  {task.prioritas}
                </span>
                <button className="text-green-600 hover:text-green-800 text-sm">
                  ✅ Elvégezve
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center text-gray-500 py-8">
          <p>✅ Nincsenek sürgős feladatok</p>
          <p className="text-sm">Új feladatok itt fognak megjelenni</p>
        </div>
      )}
    </div>
  </div>
)}

        {activeTab === 'photos' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Fotók</h3>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📷</div>
              <p className="text-gray-500 mb-4">Még nincsenek fotók hozzáadva</p>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                📸 Első fotó hozzáadása
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
