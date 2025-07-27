'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSmartPenData } from '@/hooks/useSmartPenData';

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
  function_type: string; // ✅ HOZZÁADVA
  start_date: string;
  end_date?: string;
  metadata?: any;
}

interface HaremDashboardProps {
  penId: string;
  penNumber: string;
  penFunction?: string;
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
  penFunction,
  onDataChange
}) => {

  // const { refresh: refreshSmartData } = useSmartPenData(penId);
  const [animals, setAnimals] = useState<HaremAnimal[]>([]);
  const [currentPenFunction, setCurrentPenFunction] = useState<PenFunction | null>(null);
  const [stats, setStats] = useState<HaremStats>({ haremben: 0, vemhes: 0, borjas: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ JAVÍTOTT ÁLLAPOT LOGIKA - PONTOS PREGNANCY_STATUS ELLENŐRZÉS
  const determineHaremStatus = (animal: Animal): 'haremben' | 'vemhes' | 'borjas' => {
    console.log(`🔍 Állapot ellenőrzés - ${animal.enar}:`, {
      kategoria: animal.kategoria,
      pregnancy_status: animal.pregnancy_status,
      last_birth_date: animal.last_birth_date
    });

    // ✅ TENYÉSZBIKA - mindig "háremben" marad (nincs állapotváltozás)
    if (animal.kategoria === 'tenyészbika') {
      return 'haremben';
    }

    // ✅ VEMHES STÁTUSZ - PONTOS ellenőrzés
    if (animal.pregnancy_status) {
      const status = animal.pregnancy_status.toLowerCase().trim();
      if (status === 'vemhes' ||
        status === 'pregnant' ||
        status === 'true' ||
        status === '1') {
        console.log(`✅ VEMHES: ${animal.enar} - ${animal.pregnancy_status}`);
        return 'vemhes';
      }
    }

    // ✅ BORJAS STÁTUSZ - 6 hónapon belüli ellés
    if (animal.last_birth_date) {
      const birthDate = new Date(animal.last_birth_date);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      if (birthDate >= sixMonthsAgo) {
        console.log(`✅ BORJAS: ${animal.enar} - ellés: ${animal.last_birth_date}`);
        return 'borjas';
      }
    }

    // ✅ DEFAULT - háremben
    console.log(`✅ HÁREMBEN: ${animal.enar} - alapértelmezett`);
    return 'haremben';
  };

  // ✅ FUNKCIÓ TÍPUS ALAPÚ NAPOK SZÁMÍTÁSA
  const calculateDaysInHarem = (assignedAt: string, penFunction: PenFunction | null): number => {
    try {
      let startDate = null;
      let logPrefix = "";

      // ✅ FUNKCIÓ TÍPUS ALAPJÁN KÜLÖNBÖZŐ LOGIKA
      if (penFunction?.function_type === 'hárem') {
        // HÁREM: parozás kezdetétől számol
        if (penFunction?.metadata?.parozas_kezdete) {
          startDate = penFunction.metadata.parozas_kezdete;
          logPrefix = "🐂 HÁREM - parozás kezdete";
        } else if (penFunction?.metadata?.pairing_start_date) {
          startDate = penFunction.metadata.pairing_start_date;
          logPrefix = "🐂 HÁREM - pairing start";
        } else if (penFunction?.start_date) {
          startDate = penFunction.start_date;
          logPrefix = "🐂 HÁREM - funkció kezdete";
        }
      }
      else if (penFunction?.function_type === 'vemhes') {
        // VEMHES: előbb pen_history_periods tényleges kezdet
        if (penFunction?.metadata?.actual_period_start) {
          startDate = penFunction.metadata.actual_period_start;
          logPrefix = "🤰 VEMHES - tényleges periódus kezdet";
        } else if (penFunction?.metadata?.vemhes_kezdete) {
          startDate = penFunction.metadata.vemhes_kezdete;
          logPrefix = "🤰 VEMHES - metadata kezdete";
        } else if (penFunction?.metadata?.period_start_date) {
          startDate = penFunction.metadata.period_start_date;
          logPrefix = "🤰 VEMHES - period kezdete";
        } else if (penFunction?.start_date) {
          startDate = penFunction.start_date;
          logPrefix = "🤰 VEMHES - funkció kezdete (ROSSZ!)";
        }
      }
      else {
        // EGYÉB FUNKCIÓK: funkció kezdetétől számol
        if (penFunction?.start_date) {
          startDate = penFunction.start_date;
          logPrefix = `📋 ${penFunction.function_type?.toUpperCase()} - funkció kezdete`;
        }
      }

      // FALLBACK: assigned_at
      if (!startDate) {
        startDate = assignedAt;
        logPrefix = "⚠️ FALLBACK - assigned_at";
      }

      const calculationDate = new Date(startDate);
      const currentDate = new Date();

      console.log(`${logPrefix}: ${startDate}`);
      console.log(`🐄 Állat assigned_at: ${assignedAt} ${penFunction?.function_type === 'hárem' ? '(figyelmen kívül hagyva)' : ''}`);

      // ✅ UTC MÓDSZER - PONTOS NAPOK SZÁMÍTÁSA
      const utcStart = Date.UTC(calculationDate.getFullYear(), calculationDate.getMonth(), calculationDate.getDate());
      const utcCurrent = Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

      // Napok számítása
      const diffTime = utcCurrent - utcStart;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      console.log(`🕐 Napok a funkcióban: ${diffDays} nap`);
      return Math.max(0, diffDays);

    } catch (error) {
      console.error(`❌ Dátum számítási hiba:`, error);
      return 0;
    }
  };

  // Várható ellési dátum formázása
  const formatExpectedBirth = (animal: HaremAnimal): string => {
    if (animal.expected_birth_date) {
      const date = new Date(animal.expected_birth_date);
      return date.toLocaleDateString('hu-HU');
    }
    return '-';
  };

  // Hárem releváns állatok szűrése
  const getHaremRelevantAnimals = (animals: any[]) => {
    return animals?.filter((assignment: any) => {
      const animal = assignment.animals;
      if (!animal) return false;

      // Hárem: tenyészbikák + 24+ hónapos nőivarok
      if (animal.kategoria === 'tenyészbika') return true;
      if (animal.ivar === 'nő') {
        const birthDate = new Date(animal.szuletesi_datum);
        const ageInMonths = Math.floor((new Date().getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
        return ageInMonths >= 24;
      }
      return false;
    }) || [];
  };

  // Adatok betöltése
  const loadHaremData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`🔄 Hárem adatok betöltése - Karám: ${penId}`);

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
      setCurrentPenFunction(currentFunction);
      console.log(`📋 Aktuális funkció:`, currentFunction);

      // ✅ 1B. VEMHES ESETÉN: pen_history_periods tényleges kezdet lekérdezése
      let actualPeriodStart = null;
      if (currentFunction?.function_type === 'vemhes') {
        const { data: periodData, error: periodError } = await supabase
          .from('pen_history_periods')
          .select('start_date')
          .eq('pen_id', penId)
          .eq('function_type', 'vemhes')
          .is('end_date', null)
          .order('start_date', { ascending: false })
          .limit(1);

        if (!periodError && periodData?.[0]) {
          actualPeriodStart = periodData[0].start_date;
          console.log(`📅 VEMHES tényleges kezdet (pen_history_periods): ${actualPeriodStart}`);

          // Metadata-ba belerakjuk a tényleges kezdetet
          if (currentFunction.metadata) {
            currentFunction.metadata.actual_period_start = actualPeriodStart;
          } else {
            currentFunction.metadata = { actual_period_start: actualPeriodStart };
          }
        }
      }

      // 2. Karámban lévő állatok lekérdezése
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

      if (assignmentError) throw assignmentError;
      console.log(`🐄 Talált állatok:`, assignmentData?.length);

      // 3. Hárem releváns állatok szűrése
      const relevantAnimals = getHaremRelevantAnimals(assignmentData || []);
      console.log(`🎯 Hárem releváns állatok:`, relevantAnimals.length);

      // ✅ JAVÍTOTT ÁLLATOK FELDOLGOZÁSA
      const processedAnimals: HaremAnimal[] = relevantAnimals.map((assignment: any) => {
        const animal = assignment.animals;
        const haremStatus = determineHaremStatus(animal);
        const daysInHarem = calculateDaysInHarem(assignment.assigned_at, currentFunction);

        const haremAnimal: HaremAnimal = {
          ...animal,
          haremStatus,
          haremStartDate: assignment.assigned_at,
          expectedBirthDate: animal.expected_birth_date,
          daysInHarem,
          bulls: currentFunction?.metadata?.bulls?.map((b: any) => b.name) || []
        };

        console.log(`✅ Feldolgozott állat:`, {
          enar: animal.enar,
          status: haremStatus,
          days: daysInHarem
        });

        return haremAnimal;
      });

      setAnimals(processedAnimals);

      // ✅ JAVÍTOTT STATISZTIKÁK - TENYÉSZBIKÁK IS BENNE
      const newStats: HaremStats = {
        haremben: processedAnimals.filter(a => a.haremStatus === 'haremben').length,
        vemhes: processedAnimals.filter(a => a.haremStatus === 'vemhes').length,
        borjas: processedAnimals.filter(a => a.haremStatus === 'borjas').length,
        total: processedAnimals.length
      };

      console.log(`📊 Statisztikák:`, newStats);
      setStats(newStats);

    } catch (error: any) {
      console.error('❌ Hárem adatok betöltési hiba:', error);
      setError(error.message || 'Hiba történt az adatok betöltése során');
    } finally {
      setLoading(false);
    }
  };

  // JAVÍTOTT useEffect - cseréld le a 163-170. sort
  useEffect(() => {
    // Kezdeti betöltés
    loadHaremData();
  }, [penId]); // Újratölt ha változik a karám

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
      return currentPenFunction?.metadata?.bulls?.map((b: any) => b.name).join(', ') || '-';
    }
    return animal.bulls.join(', ');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="h-16 bg-gray-200 rounded"></div>
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
            <span className="text-2xl mr-3">💕</span>
            Hárem Dashboard - Karám {penNumber}
          </h3>
          <button
            onClick={loadHaremData}
            className="text-green-600 hover:text-green-700 transition-colors"
            title="Adatok frissítése"
          >
            🔄
          </button>
        </div>

        {/* Hárem Statisztikák */}
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
        {currentPenFunction?.metadata?.bulls && (
          <div className="bg-purple-50 rounded-lg p-4 mb-6">
            <h4 className="text-lg font-semibold text-purple-900 mb-2 flex items-center">
              <span className="text-xl mr-2">🐂</span>
              Aktív Tenyészbikák
            </h4>
            <div className="flex flex-wrap gap-2">
              {currentPenFunction.metadata.bulls.map((bull: any, index: number) => (
                <span
                  key={index}
                  className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium"
                >
                  {bull.name} ({bull.enar})
                </span>
              ))}
            </div>
            {currentPenFunction.metadata.pairing_start_date && (
              <p className="text-purple-700 text-sm mt-2">
                📅 Hárem kezdete: {new Date(currentPenFunction.metadata.pairing_start_date).toLocaleDateString('hu-HU')}
              </p>
            )}
          </div>
        )}

        {/* Fogamzási Ráta */}
        {stats.total > 0 && (
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg p-4 mb-6">
            <h4 className="text-lg font-semibold text-pink-900 mb-2 flex items-center">
              <span className="text-xl mr-2">📊</span>
              Hárem Teljesítmény
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">
                  {Math.round((stats.vemhes / Math.max(stats.total - animals.filter(a => a.kategoria === 'tenyészbika').length, 1)) * 100)}%
                </div>
                <div className="text-sm text-pink-600">Fogamzási ráta</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((stats.borjas / Math.max(stats.total - animals.filter(a => a.kategoria === 'tenyészbika').length, 1)) * 100)}%
                </div>
                <div className="text-sm text-green-600">Ellési ráta</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {animals.filter(a => a.daysInHarem).reduce((avg, a) => avg + (a.daysInHarem || 0), 0) / Math.max(animals.filter(a => a.daysInHarem).length, 1) | 0}
                </div>
                <div className="text-sm text-blue-600">Átlag napok</div>
              </div>
            </div>
          </div>
        )}

        {/* Hárem Táblázat */}
        {animals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    🏷️ ENAR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    📊 Hárem Állapot
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
            <div className="text-4xl mb-4">🐄💕</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Nincs állat a háremben</h4>
            <p className="text-gray-600">
              Még nincsenek állatok hozzárendelve ehhez a háremhez.
            </p>
          </div>
        )}

        {/* Hárem Specifikus Akciógombok */}
        <div className="flex gap-4 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={() => alert('🚧 VV Eredmény rögzítés - Hamarosan!')}
            className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
          >
            🔬 Bulk VV
          </button>
          <button
            onClick={() => alert('🚧 Ellés áthelyezés - Hamarosan!')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            🍼 Ellés Áthelyezés
          </button>
          <button
            onClick={() => alert('🚧 Tenyészbika rotáció - Hamarosan!')}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            🐂 Bika Rotáció
          </button>
          <button
            onClick={() => alert('🚧 Hárem jelentés - Hamarosan!')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            📊 Hárem Jelentés
          </button>
        </div>
      </div>
    </div>
  );
};

export default HaremDashboard;