// src/app/dashboard/pens/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import PenCard from './components/pen-card';
import PenStats from './components/pen-stats';
import {
  Home,
  Users,
  Search,
  Filter,
  Plus,
  AlertTriangle,
  Calendar,
  MapPin,
  TrendingUp
} from 'lucide-react';
import { usePenAlerts } from './hooks/usePenAlerts';
import { AlertsSummary } from './components/pen-alerts-widget';

export default function PensPage() {
  const router = useRouter();
  const [pens, setPens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('mind');
  const [selectedLocation, setSelectedLocation] = useState('mind');
  // Riasztások hook hozzáadása
  const { alerts, loading: alertsLoading, getAlertCounts } = usePenAlerts();

  // Karám funkció emoji és színek
  const getFunctionEmoji = (functionType: string): string => {
    const emojiMap: { [key: string]: string } = {
      'bölcsi': '🐮',
      'óvi': '🐄',
      'hárem': '🐄💕',
      'vemhes': '🐄💖',
      'hízóbika': '🐂',
      'ellető': '🐄🍼',
      'tehén': '🐄🍼',
      'üres': '⭕'
    };
    return emojiMap[functionType] || '❓';
  };

  const getFunctionColor = (functionType: string): string => {
    const colorMap: { [key: string]: string } = {
      'bölcsi': 'bg-blue-100 text-blue-800 border-blue-200',
      'óvi': 'bg-green-100 text-green-800 border-green-200',
      'hárem': 'bg-pink-100 text-pink-800 border-pink-200',
      'vemhes': 'bg-purple-100 text-purple-800 border-purple-200',
      'hízóbika': 'bg-orange-100 text-orange-800 border-orange-200',
      'ellető': 'bg-red-100 text-red-800 border-red-200',
      'tehén': 'bg-green-100 text-green-800 border-green-200',
      'üres': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colorMap[functionType] || 'bg-gray-100 text-gray-800 border-gray-200';
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
            animals: assignments || [] // ENAR kereséshez
          };
        }));

        setPens(pensWithData);
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

  const functionTypes = ['mind', 'bölcsi', 'óvi', 'hárem', 'vemhes', 'hízóbika', 'ellető', 'tehén', 'üres'];

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Karamok betöltése...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto" />
          <p className="mt-4 text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Home className="h-6 w-6 mr-2 text-green-600" />
                Karám Kezelés
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard/pens/add')}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Új Karám
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Riasztások összesítő */}
      <AlertsSummary alerts={alerts} className="mb-6" />
      
      {/* Statisztika Widget */}
      <PenStats />

      {/* ✅ JAVÍTOTT SZŰRŐK - MINDEN MŰKÖDIK! */}
      <div className="bg-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            
            {/* Keresés - ENAR + Karám szám + Helyszín */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Keresés: karám szám, helyszín vagy ENAR (pl. 1, 12A, 36050)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
              {searchTerm && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Funkció szűrő */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 bg-white min-w-[150px]"
              >
                {functionTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'mind' ? 'Összes funkció' : `${getFunctionEmoji(type)} ${type.charAt(0).toUpperCase() + type.slice(1)}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Helyszín szűrő */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 bg-white min-w-[150px]"
              >
                <option value="mind">Összes helyszín</option>
                <option value="bal oldal">📍 Bal oldal</option>
                <option value="jobb oldal">📍 Jobb oldal</option>
                <option value="konténereknél">📦 Konténereknél</option>
                <option value="nagy karám">🔙 Nagy karamok</option>
                <option value="ellető istálló">🏠 Ellető istálló</option>
              </select>
            </div>

            {/* Szűrők törlése */}
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedType('mind');
                setSelectedLocation('mind');
              }}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors whitespace-nowrap"
            >
              🔄 Törlés
            </button>
          </div>

          {/* Aktív szűrők megjelenítése */}
          {(searchTerm || selectedType !== 'mind' || selectedLocation !== 'mind') && (
            <div className="flex flex-wrap gap-2 mb-4">
              {searchTerm && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Keresés: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedType !== 'mind' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Funkció: {selectedType}
                  <button
                    onClick={() => setSelectedType('mind')}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedLocation !== 'mind' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Helyszín: {selectedLocation}
                  <button
                    onClick={() => setSelectedLocation('mind')}
                    className="ml-2 text-purple-600 hover:text-purple-800"
                  >
                    ×
                  </button>
                </span>
              )}
              <span className="text-xs text-gray-500 self-center">
                {sortedFilteredPens.length} találat
              </span>
            </div>
          )}

          {/* Funkció statisztikák */}
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.entries(functionStats).map(([funcType, count]) => (
              <button
                key={funcType}
                onClick={() => setSelectedType(funcType === selectedType ? 'mind' : funcType)}
                className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-all hover:scale-105 ${
                  selectedType === funcType 
                    ? 'ring-2 ring-blue-400 ' + getFunctionColor(funcType)
                    : getFunctionColor(funcType)
                }`}
              >
                {getFunctionEmoji(funcType)} {funcType}: {count as number}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Karám Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedFilteredPens.map((pen: any) => (
            <PenCard key={pen.id} pen={pen} />
          ))}
        </div>

        {sortedFilteredPens.length === 0 && (
          <div className="text-center py-12">
            <Home className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchTerm || selectedType !== 'mind' || selectedLocation !== 'mind' 
                ? 'Nincs találat a szűrési feltételekre' 
                : 'Nincsenek karamok'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedType !== 'mind' || selectedLocation !== 'mind'
                ? 'Próbáljon meg más keresési feltételeket vagy törölje a szűrőket.'
                : 'Kezdjen el egy új karám hozzáadásával.'}
            </p>
            {(searchTerm || selectedType !== 'mind' || selectedLocation !== 'mind') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('mind');
                  setSelectedLocation('mind');
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                🔄 Összes szűrő törlése
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}