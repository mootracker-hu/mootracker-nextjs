// src/app/dashboard/pens/page.tsx - ÉS TOVÁBBÁ A getFunctionColor JAVÍTÁS
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import PenCard from './components/pen-card';
import PenStats from './components/pen-stats';
import { useAlertsNew } from '@/hooks/useAlertsNew';
import { AlertsSummary } from './components/pen-alerts-widget';
// A meglévő importok után:
import { ColorHelpers } from '@/constants/colors';

export default function PensPage() {
  const router = useRouter();
  const [pens, setPens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('mind');
  const [selectedLocation, setSelectedLocation] = useState('mind');
  // Riasztások hook hozzáadása
  const { alerts, loading: alertsLoading } = useAlertsNew();

  // Karám funkció emoji és színek - ✅ VÉGLEGESEN JAVÍTOTT VERZIÓ
  const getFunctionEmoji = (functionType: string): string => {
    const emojiMap: Record<string, string> = {
      'bölcsi': '🐮',
      'óvi': '🐄',
      'hárem': '🐄💕',
      'vemhes': '🐄💖',
      'hízóbika': '🐂',
      'ellető': '🐄🍼',
      'tehén': '🐄🍼',
      'üres': '⭕',
      // ✅ ÚJ KARÁM TÍPUSOK
      'átmeneti': '🔄',
      'kórház': '🏥',
      'karantén': '🔒',
      'selejt': '📦'
    };
    return emojiMap[functionType] || '❓';
  };

  // ✅ JAVÍTOTT SZÍNPALETTA - MINDEN FUNKCIÓ EGYSÉGESEN!
  const getFunctionColor = (functionType: string): string => {
    return ColorHelpers.getPenFunctionColor(functionType as any);
};

  // Kapacitás kihasználtság színek
  const getCapacityColor = (current: number, capacity: number): string => {
    const percentage = (current / capacity) * 100;
    if (percentage < 60) return 'text-green-600 bg-green-50';
    if (percentage < 80) return 'text-yellow-600 bg-yellow-50';
    if (percentage < 100) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  // Adatok betöltése
  useEffect(() => {
    fetchPens();
  }, []);

  // Karám sorrendezési algoritmus - fizikai elhelyezkedés szerint
  const sortPens = (pens: any[]) => {
    return pens.sort((a, b) => {
      const penA = a.pen_number;
      const penB = b.pen_number;

      // Fizikai sorrend definiálása
      const physicalOrder: { [key: string]: number } = {
        // Külső karamok
        '1': 1, '2': 2, '3': 3, '4A': 4, '4B': 5,
        '5': 6, '6': 7, '7': 8, '8': 9, '9': 10,
        '10': 11, '11': 12, '12A': 13, '12B': 14,
        '13': 15, '14': 16, '15': 17,

        // Ellető istálló - fizikai elhelyezkedés szerint
        'E1': 100, 'E2': 101, 'EB3': 102, 'EB4': 103,
        'EB5': 104, 'EB6': 105, 'E7': 106, 'E8': 107,
        'EB9': 108, 'EB10': 109, 'EB11': 110, 'EB12': 111
      };

      const orderA = (physicalOrder as any)[penA] || 999;
      const orderB = (physicalOrder as any)[penB] || 999;

      return orderA - orderB;
    });
  };

  const fetchPens = async () => {
    try {
      setLoading(true);

      // Funkció-alapú dinamikus kapacitás számítás
      const calculateCapacity = (functionType: string, penNumber: string): number => {
        // Ellető istálló kapacitások
        if (penNumber.startsWith('E')) {
          if (['E1', 'E2', 'E7', 'E8'].includes(penNumber)) return 25;
          return 2;
        }

        // Külső karamok funkció-alapú kapacitása
        const isLargePen = ['14', '15'].includes(penNumber);
        const isContainerPen = ['12A', '12B'].includes(penNumber);

        if (isLargePen) return 50;
        if (isContainerPen) return 15;

        // Standard karamok funkció szerint
        switch (functionType) {
          case 'hárem': return 27;
          case 'vemhes': return 30;
          case 'tehén': return 40;
          case 'bölcsi': return 25;
          case 'óvi': return 25;
          case 'hízóbika': return 20;
          default: return 25;
        }
      };

      // Valódi adatok betöltése Supabase-ből
      const { data: realPens, error } = await supabase
        .from('pens')
        .select(`
          *,
          pen_functions!inner(
            id,
            function_type,
            start_date,
            metadata,
            notes
          )
        `)
        .is('pen_functions.end_date', null);

      if (error) throw error;

      if (realPens) {
        const pensWithData = await Promise.all(realPens.map(async pen => {
          // Állatok betöltése ENAR-ral együtt
          const { data: assignments, count } = await supabase
  .from('animal_pen_assignments')
  .select(`
    animals!inner(enar)
  `, { count: 'exact' })
  .eq('pen_id', pen.id)
  .is('removed_at', null);

// ÚJ: Temp ID borjak számolása
const { count: tempCalfCount } = await supabase
  .from('calves')
  .select('*', { count: 'exact', head: true })
  .eq('current_pen_id', pen.id)
  .eq('is_alive', true)
  .is('enar', null);

          return {
            id: pen.id,
            pen_number: pen.pen_number,
            pen_type: pen.pen_number.startsWith('E') ? 'birthing' : 'outdoor' as 'outdoor' | 'barn' | 'birthing',
            capacity: calculateCapacity(pen.pen_functions[0]?.function_type || 'üres', pen.pen_number),
            location: pen.location || 'Ismeretlen',
            current_function: {
              id: pen.pen_functions[0]?.id || pen.id,
              function_type: pen.pen_functions[0]?.function_type as any,
              start_date: pen.pen_functions[0]?.start_date || '2025-06-01',
              metadata: pen.pen_functions[0]?.metadata || {},
              notes: pen.pen_functions[0]?.notes
            },
            animal_count: count || 0,
            temp_calf_count: tempCalfCount || 0,
            animals: assignments || [] // ENAR kereséshez
          };
        }));

        setPens(sortPens(pensWithData));
      } else {
        setPens([]);
      }
    } catch (err) {
      console.error('Hiba a karamok betöltésekor:', err);
      setError('Hiba történt a karamok betöltésekor');
    } finally {
      setLoading(false);
    }
  };

  // ✅ JAVÍTOTT SZŰRÉSI LOGIKA - MINDEN MŰKÖDIK!
  const filteredPens = pens.filter((pen: any) => {
    // 1. Funkció szűrés
    const matchesType = selectedType === 'mind' || pen.current_function?.function_type === selectedType;

    // 2. Keresés (karám szám, helyszín, ENAR)
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      pen.pen_number.toLowerCase().includes(searchLower) ||
      pen.location?.toLowerCase().includes(searchLower) ||
      // ENAR keresés - működő verzió!
      (pen.animals && pen.animals.some((assignment: any) =>
        assignment.animals?.enar?.toLowerCase().includes(searchLower)
      ));

    // 3. Helyszín szűrés - JAVÍTOTT!
    let matchesLocation = selectedLocation === 'mind';
    if (!matchesLocation) {
      const location = pen.location?.toLowerCase() || '';
      switch (selectedLocation) {
        case 'bal oldal':
          matchesLocation = location.includes('bal oldal');
          break;
        case 'jobb oldal':
          matchesLocation = location.includes('jobb oldal');
          break;
        case 'konténereknél':
          matchesLocation = location.includes('konténer');
          break;
        case 'nagy karám':
          matchesLocation = location.includes('nagy karám') || location.includes('hátsó');
          break;
        case 'ellető istálló':
          matchesLocation = location.includes('ellető');
          break;
        default:
          matchesLocation = location.includes(selectedLocation.toLowerCase());
      }
    }

    return matchesType && matchesSearch && matchesLocation;
  });

  // Statisztikák
  const totalCapacity = pens.reduce((sum: number, pen: any) => sum + pen.capacity, 0);
  const totalAnimals = pens.reduce((sum: number, pen: any) => sum + pen.animal_count, 0);
  const utilizationPercentage = totalCapacity > 0 ? (totalAnimals / totalCapacity) * 100 : 0;

  // Funkció típusok statisztikái
  const functionStats = pens.reduce((stats: any, pen: any) => {
    const funcType = pen.current_function?.function_type || 'üres';
    stats[funcType] = (stats[funcType] || 0) + 1;
    return stats;
  }, {} as { [key: string]: number });

  const functionTypes = [
    'mind', 'bölcsi', 'óvi', 'hárem', 'vemhes', 'ellető', 'tehén', 'hízóbika', 'üres',
    'átmeneti', 'kórház', 'karantén', 'selejt'  // ✅ 4 ÚJ TÍPUS
  ];

  // Karám sorrendezés
  const sortedFilteredPens = filteredPens.sort((a: any, b: any) => {
    const aNum = a.pen_number;
    const bNum = b.pen_number;

    // E karamok a végére
    if (aNum.startsWith('E') && !bNum.startsWith('E')) return 1;
    if (!aNum.startsWith('E') && bNum.startsWith('E')) return -1;
    if (aNum.startsWith('E') && bNum.startsWith('E')) {
      return parseInt(aNum.slice(1)) - parseInt(bNum.slice(1));
    }

    // Számok vs szám+betű keverékek
    const aNumPart = parseInt(aNum);
    const bNumPart = parseInt(bNum);

    if (aNumPart !== bNumPart) {
      return aNumPart - bNumPart;
    }

    return aNum.localeCompare(bNum);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Karamok betöltése...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">⚠️</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Hiba történt</h1>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors inline-flex items-center"
          >
            <span className="mr-2">🔄</span>
            Újratöltés
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header - DESIGN SYSTEM */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-4xl mr-4">🏠</span>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Karám Kezelés</h1>
                <p className="mt-2 text-gray-600">
                  {pens.length} karám • {totalAnimals}/{totalCapacity} állat ({utilizationPercentage.toFixed(1)}% kihasználtság)
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard/pens/add')}
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors inline-flex items-center"
            >
              <span className="mr-2">➕</span>
              Új Karám
            </button>
          </div>
        </div>

        {/* Riasztások összesítő */}
        <AlertsSummary alerts={alerts as any} className="mb-6" />

        {/* Statisztika Widget */}
        <PenStats />

        {/* Szűrők - DESIGN SYSTEM */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">🔍</span>
            <h2 className="text-lg font-semibold text-gray-900">Szűrők és Keresés</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Keresés - ENAR + Karám szám + Helyszín */}
            <div className="relative md:col-span-2">
              <input
                type="text"
                placeholder="🔎 Keresés: karám szám, helyszín vagy ENAR..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl"
                >
                  ❌
                </button>
              )}
            </div>

            {/* Funkció szűrő */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white"
            >
              {functionTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'mind' ? '🏠 Összes funkció' : `${getFunctionEmoji(type)} ${type.charAt(0).toUpperCase() + type.slice(1)}`}
                </option>
              ))}
            </select>

            {/* Helyszín szűrő */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white"
            >
              <option value="mind">📍 Összes helyszín</option>
              <option value="bal oldal">📍 Bal oldal</option>
              <option value="jobb oldal">📍 Jobb oldal</option>
              <option value="konténereknél">📦 Konténereknél</option>
              <option value="nagy karám">🔙 Nagy karamok</option>
              <option value="ellető istálló">🏠 Ellető istálló</option>
            </select>
          </div>

          {/* Szűrők törlése gomb */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedType('mind');
                setSelectedLocation('mind');
              }}
              className="bg-teal-500 hover:bg-teal-600 text-white font-medium px-4 py-2 rounded-lg transition-colors inline-flex items-center text-sm"
            >
              <span className="mr-1">🔄</span>
              Szűrők törlése
            </button>
          </div>

          {/* Aktív szűrők megjelenítése */}
          {(searchTerm || selectedType !== 'mind' || selectedLocation !== 'mind') && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
              {searchTerm && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  🔍 Keresés: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    ❌
                  </button>
                </span>
              )}
              {selectedType !== 'mind' && (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getFunctionColor(selectedType)}`}>
                  🏠 Funkció: {selectedType}
                  <button
                    onClick={() => setSelectedType('mind')}
                    className="ml-2 opacity-60 hover:opacity-100"
                  >
                    ❌
                  </button>
                </span>
              )}
              {selectedLocation !== 'mind' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  📍 Helyszín: {selectedLocation}
                  <button
                    onClick={() => setSelectedLocation('mind')}
                    className="ml-2 text-purple-600 hover:text-purple-800"
                  >
                    ❌
                  </button>
                </span>
              )}
              <span className="text-xs text-gray-500 self-center">
                📊 {sortedFilteredPens.length} találat
              </span>
            </div>
          )}
        </div>

        {/* Funkció statisztikák - DESIGN SYSTEM */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center mb-3">
            <span className="text-2xl mr-3">📊</span>
            <h3 className="text-lg font-semibold text-gray-900">Funkció Statisztikák</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(functionStats).map(([funcType, count]) => (
              <button
                key={funcType}
                onClick={() => setSelectedType(funcType === selectedType ? 'mind' : funcType)}
                className={`px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all hover:scale-105 ${selectedType === funcType
                    ? 'ring-2 ring-green-500 ' + getFunctionColor(funcType)
                    : getFunctionColor(funcType)
                  }`}
              >
                {getFunctionEmoji(funcType)} {funcType}: {count as number}
              </button>
            ))}
          </div>
        </div>

   {/* Karám Grid */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {sortedFilteredPens.map((pen: any) => (
    <PenCard 
      key={pen.id} 
      pen={pen} 
      {...(alerts && { alerts })}
    />
  ))}
</div>

        {/* No Results State */}
        {sortedFilteredPens.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <span className="text-6xl mb-4 block">🏠</span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedType !== 'mind' || selectedLocation !== 'mind'
                ? 'Nincs találat a szűrési feltételekre'
                : 'Nincsenek karamok'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedType !== 'mind' || selectedLocation !== 'mind'
                ? 'Próbáljon meg más keresési feltételeket vagy törölje a szűrőket.'
                : 'Kezdjen el egy új karám hozzáadásával.'}
            </p>
            {(searchTerm || selectedType !== 'mind' || selectedLocation !== 'mind') ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('mind');
                  setSelectedLocation('mind');
                }}
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors inline-flex items-center"
              >
                <span className="mr-2">🔄</span>
                Összes szűrő törlése
              </button>
            ) : (
              <button
                onClick={() => router.push('/dashboard/pens/add')}
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors inline-flex items-center"
              >
                <span className="mr-2">➕</span>
                Új karám hozzáadása
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}