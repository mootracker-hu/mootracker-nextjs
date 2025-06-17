// src/app/dashboard/animals/[enar]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  MapPin, 
  Users, 
  Heart, 
  Activity,
  FileText,
  Save
} from 'lucide-react';

interface Animal {
  id: number;
  enar: string;
  szuletesi_datum: string;
  ivar: string;
  kategoria: string;
  jelenlegi_karam?: string;
  statusz: string;
  anya_enar?: string;
  apa_enar?: string;
  kplsz?: string;
  bekerules_datum: string;
  created_at: string;
}

export default function AnimalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const enar = params.enar as string;
  
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('alapadatok');
  const [isEditing, setIsEditing] = useState(false);

  // Adatok betöltése Supabase-ből
  useEffect(() => {
    const fetchAnimal = async () => {
      try {
        setLoading(true);
        
        // Dekódoljuk az ENAR-t az URL-ből (pl. HU%2030223%2040224%209 → HU 30223 40224 9)
        const decodedEnar = decodeURIComponent(enar);
        
        console.log('Keresett ENAR:', decodedEnar);

        const { data, error } = await supabase
          .from('animals')
          .select('*')
          .eq('enar', decodedEnar)
          .single();

        if (error) {
          console.error('Supabase hiba:', error);
          setError('Nem sikerült betölteni az állat adatait');
          return;
        }

        if (!data) {
          setError('Nem található ez az állat');
          return;
        }

        console.log('Betöltött állat:', data);
        setAnimal(data);
      } catch (err) {
        console.error('Fetch hiba:', err);
        setError('Hiba történt az adatok betöltése során');
      } finally {
        setLoading(false);
      }
    };

    if (enar) {
      fetchAnimal();
    }
  }, [enar]);

  // Életkor kalkuláció
  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const now = new Date();
    const diffMs = now.getTime() - birth.getTime();
    const years = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
    const months = Math.floor((diffMs % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));
    
    if (years > 0) {
      return `${years} év ${months} hó`;
    }
    return `${months} hónap`;
  };

  // Rövid ENAR azonosító kivonása (utolsó 5 szám)
  const getShortId = (enar: string) => {
    const numbers = enar.replace(/\D/g, ''); // Csak számok
    return numbers.slice(-5);
  };

  // Kategória színek
  const getCategoryColor = (category: string) => {
    const colors = {
      'tehén': 'bg-green-100 text-green-800',
      'szűz_üsző': 'bg-blue-100 text-blue-800',
      'vemhes_üsző': 'bg-purple-100 text-purple-800',
      'nőivarú_borjú': 'bg-pink-100 text-pink-800',
      'hímivarú_borjú': 'bg-orange-100 text-orange-800',
      'hízóbika': 'bg-red-100 text-red-800',
      'tenyészbika': 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Adatok betöltése...</p>
        </div>
      </div>
    );
  }

  if (error || !animal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🐄</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Hiba történt</h1>
          <p className="text-gray-600 mb-4">{error || 'Ismeretlen hiba'}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Vissza
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'alapadatok', name: 'Alapadatok', icon: FileText },
    { id: 'szuletesi', name: 'Születési adatok', icon: Calendar },
    { id: 'helyzet', name: 'Jelenlegi helyzet', icon: MapPin },
    { id: 'csalad', name: 'Család', icon: Users },
    { id: 'egeszseg', name: 'Egészség', icon: Heart },
    { id: 'esemenynaplo', name: 'Eseménynapló', icon: Activity }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {animal.enar}
                </h1>
                <p className="text-sm text-gray-500">
                  #{getShortId(animal.enar)} • {animal.kategoria}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {isEditing ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Mentés
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Szerkesztés
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Alapadatok Tab */}
          {activeTab === 'alapadatok' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ENAR azonosító
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={animal.enar}
                      disabled={!isEditing}
                      className="flex-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                    />
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      #{getShortId(animal.enar)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategória
                  </label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(animal.kategoria)}`}>
                    {animal.kategoria}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ivar
                  </label>
                  <input
                    type="text"
                    value={animal.ivar}
                    disabled={!isEditing}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Státusz
                  </label>
                  <input
                    type="text"
                    value={animal.statusz}
                    disabled={!isEditing}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jelenlegi karám
                  </label>
                  <input
                    type="text"
                    value={animal.jelenlegi_karam || 'Nincs megadva'}
                    disabled={!isEditing}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Életkor
                  </label>
                  <input
                    type="text"
                    value={calculateAge(animal.szuletesi_datum)}
                    disabled
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Születési adatok Tab */}
          {activeTab === 'szuletesi' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Születési dátum
                  </label>
                  <input
                    type="date"
                    value={animal.szuletesi_datum}
                    disabled={!isEditing}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bekerülés dátuma
                  </label>
                  <input
                    type="date"
                    value={animal.bekerules_datum}
                    disabled={!isEditing}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Család Tab */}
          {activeTab === 'csalad' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anya ENAR
                  </label>
                  <input
                    type="text"
                    value={animal.anya_enar || 'Nincs megadva'}
                    disabled={!isEditing}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apa ENAR
                  </label>
                  <input
                    type="text"
                    value={animal.apa_enar || 'Nincs megadva'}
                    disabled={!isEditing}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                {animal.kplsz && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      KPLSZ szám
                    </label>
                    <input
                      type="text"
                      value={animal.kplsz}
                      disabled={!isEditing}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Placeholder tabok */}
          {['helyzet', 'egeszseg', 'esemenynaplo'].includes(activeTab) && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🐄</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Hamarosan elérhető
              </h3>
              <p className="text-gray-500">
                Ez a funkció még fejlesztés alatt áll
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}