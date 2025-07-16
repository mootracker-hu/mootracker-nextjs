'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// TypeScript interfaces
interface Animal {
  id: number;
  enar: string;
  szuletesi_datum: string;
  ivar: string;
  kategoria: string;
  pregnancy_status?: string;
  expected_birth_date?: string;
  last_birth_date?: string;
  notes?: string;
}

interface PenFunction {
  id: number;
  function_name: string;
  start_date: string;
  end_date?: string;
  metadata?: any;
}

interface HaremDashboardProps {
  penId: string;  // ✅ JAVÍTVA: string, mert Supabase UUID
  penNumber: string;
  onDataChange?: () => void;
}

interface HaremStats {
  haremben: number;
  vemhes: number;
  borjas: number;
  total: number;
}

interface HaremAnimal extends Animal {
  haremStatus: 'haremben' | 'vemhes' | 'borjas';
  haremStartDate?: string;
  expectedBirthDate?: string;
  daysInHarem?: number;
  bulls?: string[];
}

const HaremDashboard: React.FC<HaremDashboardProps> = ({ 
  penId, 
  penNumber, 
  onDataChange 
}) => {
  const [animals, setAnimals] = useState<HaremAnimal[]>([]);
  const [penFunction, setPenFunction] = useState<PenFunction | null>(null);
  const [stats, setStats] = useState<HaremStats>({ haremben: 0, vemhes: 0, borjas: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Supabase client már importálva van

 // Hárem státusz meghatározása - JAVÍTOTT LOGIKA
const determineHaremStatus = (animal: Animal): 'haremben' | 'vemhes' | 'borjas' => {
  // 🔥 KRITIKUS - TENYÉSZBIKA KIZÁRÁS
  if (animal.kategoria === 'tenyészbika') {
    return 'haremben'; // Tenyészbika soha nem lehet "vemhes"
  }
  
  // PRIORITÁS 1: VV eredmény felülírja mindent!
  if (animal.pregnancy_status === 'vemhes' || 
      animal.pregnancy_status === 'pregnant' || 
      animal.expected_birth_date) {
    return 'vemhes';
  }

  // PRIORITÁS 2: Ha van borjú születési dátuma az utóbbi 6 hónapban → borjas
  if (animal.last_birth_date) {
    const birthDate = new Date(animal.last_birth_date);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    if (birthDate >= sixMonthsAgo) {
      return 'borjas';
    }
  }

  // PRIORITÁS 3: Egyébként háremben (aktív tenyésztés)
  return 'haremben';
};

  // Napok számítása háremben
  const calculateDaysInHarem = (startDate: string): number => {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Várható ellési dátum formázása
  const formatExpectedBirth = (animal: HaremAnimal): string => {
    if (animal.expected_birth_date) {
      const date = new Date(animal.expected_birth_date);
      return date.toLocaleDateString('hu-HU');
    }
    return '-';
  };

  // Adatok betöltése
  const loadHaremData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Karám aktuális funkciójának lekérdezése
      const { data: functionData, error: functionError } = await supabase
        .from('pen_functions')
        .select('*')
        .eq('pen_id', penId)
        .is('end_date', null)
        .order('start_date', { ascending: false })
        .limit(1);

      if (functionError) throw functionError;

      const currentFunction = functionData?.[0] || null;
      setPenFunction(currentFunction);

      // 2. Karámban lévő állatok lekérdezése - HÁREM RELEVÁNS SZŰRÉSSEL
const { data: assignmentData, error: assignmentError } = await supabase
  .from('animal_pen_assignments')
  .select(`
    animal_id,
    assigned_at,
    animals (
      id,
      enar,
      szuletesi_datum,
      ivar,
      kategoria,
      pregnancy_status,
      expected_birth_date,
      last_birth_date,
      notes
    )
  `)
  .eq('pen_id', penId)
  .is('removed_at', null);

// 🔥 ÚJ - HÁREM RELEVANCIA SZŰRÉS
if (assignmentError) {
  console.error('❌ Hárem állatok lekérdezési hiba:', assignmentError);
  setError('Nem sikerült betölteni a hárem állatokat');
  return;
}

// Csak hárem-releváns állatok megtartása
const haremRelevantAnimals = assignmentData?.filter((assignment: any) => {
  const animal = assignment.animals;
  if (!animal) return false;
  
  // 1. Tenyészbikák mindig relevánsak
  if (animal.kategoria === 'tenyészbika') {
    console.log(`✅ Tenyészbika: ${animal.enar}`);
    return true;
  }
  
  // 2. Nőivarok esetén életkor ellenőrzés (24+ hónap)
  if (animal.ivar === 'nő') {
    const birthDate = new Date(animal.szuletesi_datum);
    const ageInMonths = Math.floor((new Date().getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    
    if (ageInMonths >= 24) {
      console.log(`✅ Nőivar 24+ hónap: ${animal.enar} (${ageInMonths} hónap)`);
      return true;
    } else {
      console.log(`❌ Nőivar túl fiatal: ${animal.enar} (${ageInMonths} hónap)`);
      return false;
    }
  }
  
  // 3. Minden más (hízóbika, stb.) kizárva
  console.log(`❌ Nem hárem-releváns: ${animal.enar} (${animal.kategoria})`);
  return false;
}) || [];

console.log(`🐄💕 Hárem releváns állatok: ${haremRelevantAnimals.length}/${assignmentData?.length || 0}`);

// 3. Állatok feldolgozása hárem státusszal - SZŰRT ÁLLATOKKAL!
const processedAnimals: HaremAnimal[] = haremRelevantAnimals.map((assignment: any) => {
  const animal = assignment.animals;
  const haremStatus = determineHaremStatus(animal);
  
  const haremAnimal: HaremAnimal = {
    ...animal,
    haremStatus,
    haremStartDate: assignment.assigned_at,
    expectedBirthDate: animal.expected_birth_date,
    daysInHarem: calculateDaysInHarem(assignment.assigned_at),
    bulls: currentFunction?.metadata?.bulls?.map((b: any) => b.name) || []
  };

  return haremAnimal;
});

      setAnimals(processedAnimals);

      // 4. Statisztikák számítása
      const newStats: HaremStats = {
        haremben: processedAnimals.filter(a => a.haremStatus === 'haremben').length,
        vemhes: processedAnimals.filter(a => a.haremStatus === 'vemhes').length,
        borjas: processedAnimals.filter(a => a.haremStatus === 'borjas').length,
        total: processedAnimals.length
      };
      setStats(newStats);

    } catch (error: any) {
      console.error('❌ Hárem adatok betöltési hiba:', error);
      setError(error.message || 'Hiba történt az adatok betöltése során');
    } finally {
      setLoading(false);
    }
  };

  // Komponens mount-kor adatok betöltése
  useEffect(() => {
    loadHaremData();
  }, [penId]);

  // Státusz badge színek
  const getStatusColor = (status: 'haremben' | 'vemhes' | 'borjas') => {
    switch (status) {
      case 'haremben': return 'bg-pink-100 text-pink-800';
      case 'vemhes': return 'bg-rose-100 text-rose-800';
      case 'borjas': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Státusz ikon
  const getStatusIcon = (status: 'haremben' | 'vemhes' | 'borjas') => {
    switch (status) {
      case 'haremben': return '🐄💕';
      case 'vemhes': return '🐄💖';
      case 'borjas': return '🐄🍼';
      default: return '🐄';
    }
  };

  // Tenyészbikák megjelenítése
  const getBullsDisplay = (animal: HaremAnimal): string => {
    if (!animal.bulls || animal.bulls.length === 0) {
      return penFunction?.metadata?.bulls?.map((b: any) => b.name).join(', ') || '-';
    }
    return animal.bulls.join(', ');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="text-center py-8">
            <div className="text-4xl mb-4">❌</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Hiba történt</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadHaremData}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              🔄 Újrapróbálás
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <span className="text-2xl mr-3">📊</span>
            {penFunction?.metadata?.bulls?.[0]?.name || 'Hárem'} Dashboard - Karám {penNumber}
          </h3>
          <button
            onClick={loadHaremData}
            className="text-green-600 hover:text-green-700 transition-colors"
            title="Adatok frissítése"
          >
            🔄
          </button>
        </div>

        {/* Statisztikák */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-pink-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-pink-600">{stats.haremben}</div>
            <div className="text-sm text-pink-600">🐄💕 Háremben</div>
          </div>
          <div className="bg-rose-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-rose-600">{stats.vemhes}</div>
            <div className="text-sm text-rose-600">🐄💖 Vemhes</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{stats.borjas}</div>
            <div className="text-sm text-green-600">🐄🍼 Borjas</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-blue-600">📊 Összesen</div>
          </div>
        </div>

        {/* Tenyészbika információk */}
        {penFunction?.metadata?.bulls && (
          <div className="bg-purple-50 rounded-lg p-4 mb-6">
            <h4 className="text-lg font-semibold text-purple-900 mb-2 flex items-center">
              <span className="text-xl mr-2">🐂</span>
              Aktív Tenyészbikák
            </h4>
            <div className="flex flex-wrap gap-2">
              {penFunction.metadata.bulls.map((bull: any, index: number) => (
                <span
                  key={index}
                  className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium"
                >
                  {bull.name} ({bull.enar})
                </span>
              ))}
            </div>
            {penFunction.metadata.pairing_start_date && (
              <p className="text-purple-700 text-sm mt-2">
                📅 Hárem kezdete: {new Date(penFunction.metadata.pairing_start_date).toLocaleDateString('hu-HU')}
              </p>
            )}
          </div>
        )}

        {/* Excel-szerű táblázat */}
        {animals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    🏷️ ENAR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    📊 Állapot
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    🗓️ Várható ellés
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    📅 Napok háremben
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    🐂 Tenyészbikák
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    📝 Megjegyzés
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {animals.map((animal) => (
                  <tr key={animal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{animal.enar}</div>
                      <div className="text-xs text-gray-500">{animal.kategoria}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(animal.haremStatus)}`}>
                        <span className="mr-1">{getStatusIcon(animal.haremStatus)}</span>
                        {animal.haremStatus === 'haremben' && 'Háremben'}
                        {animal.haremStatus === 'vemhes' && 'Vemhes'}
                        {animal.haremStatus === 'borjas' && 'Borjas'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {animal.haremStatus === 'vemhes' ? formatExpectedBirth(animal) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {animal.daysInHarem || 0} nap
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getBullsDisplay(animal)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {animal.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">🐄</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Nincs állat a karámban</h4>
            <p className="text-gray-600">
              Még nincsenek állatok hozzárendelve ehhez a karámhoz, vagy nem hárem funkciójú.
            </p>
          </div>
        )}

        {/* Akciógombok */}
        <div className="flex gap-4 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={() => {
              // TODO: Bulk RCC rögzítés modal
              alert('🚧 Bulk RCC rögzítés - Hamarosan!');
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            💉 Bulk RCC
          </button>
          <button
            onClick={() => {
              // TODO: Bulk ellés rögzítés modal
              alert('🚧 Bulk ellés rögzítés - Hamarosan!');
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            🍼 Bulk Ellés
          </button>
          <button
            onClick={() => {
              // TODO: Excel export funkció
              alert('🚧 Excel export - Hamarosan!');
            }}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            📊 Excel Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default HaremDashboard;