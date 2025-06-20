// src/app/dashboard/pens/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
// A meglévő importok után add hozzá:
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

// TypeScript interfaces
interface Pen {
  id: string;
  pen_number: string;
  pen_type: 'outdoor' | 'barn' | 'birthing';
  capacity: number;
  location?: string;
  current_function?: PenFunction;
  animal_count: number;
}

interface PenFunction {
  id: string;
  function_type: 'bölcsi' | 'óvi' | 'hárem' | 'vemhes' | 'hízóbika' | 'ellető' | 'üres' | 'tehén';
  start_date: string;
  metadata: any;
  notes?: string;
}

export default function PensPage() {
  const router = useRouter();
  const [pens, setPens] = useState<Pen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('mind');

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

  // Karám típus megjelenítés
  const getPenTypeDisplay = (penType: string): string => {
    const typeMap: { [key: string]: string } = {
      'outdoor': '🏞️ Külső',
      'barn': '🏠 Istálló',
      'birthing': '🏥 Ellető'
    };
    return typeMap[penType] || penType;
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
          if (['E1', 'E2', 'E7', 'E8'].includes(penNumber)) return 25; // Nagy karám részek
          return 2; // Fogadó boxok (E3-E6, E9-E12)
        }

        // Külső karamok funkció-alapú kapacitása
        const isLargePen = ['14', '15'].includes(penNumber);
        const isContainerPen = ['12A', '12B'].includes(penNumber);

        if (isLargePen) return 50; // Nagy karamok
        if (isContainerPen) return 15; // Konténereknél

        // Standard karamok (1-11, 13) funkció szerint
        switch (functionType) {
          case 'hárem': return 27; // 25 nőivar + 2 tenyészbika
          case 'vemhes': return 30; // 30 vemhes üsző
          case 'tehén': return 40; // 20 tehén + borjak + 2 tenyészbika
          case 'bölcsi': return 25; // Fiatal borjak
          case 'óvi': return 25; // Üszők
          case 'hízóbika': return 20; // Hízó bikák
          default: return 25; // Alapértelmezett
        }
      };

      // Valódi karám adatok a gazdaság alapján
      const mockPensData: Pen[] = [
        // BAL OLDAL KARAMOK
        { id: '1', pen_number: '1', pen_type: 'outdoor', capacity: 0, location: 'Bal oldal', current_function: { id: '1', function_type: 'hárem', start_date: '2025-06-01', metadata: { tenyeszbika_name: 'Buksi' } }, animal_count: 23 },
        { id: '2', pen_number: '2', pen_type: 'outdoor', capacity: 0, location: 'Bal oldal', current_function: { id: '2', function_type: 'óvi', start_date: '2025-06-01', metadata: {} }, animal_count: 22 },
        { id: '3', pen_number: '3', pen_type: 'outdoor', capacity: 0, location: 'Bal oldal', current_function: { id: '3', function_type: 'bölcsi', start_date: '2025-05-15', metadata: {} }, animal_count: 21 },
        { id: '4A', pen_number: '4A', pen_type: 'outdoor', capacity: 0, location: 'Bal oldal', current_function: { id: '4A', function_type: 'hárem', start_date: '2025-05-20', metadata: { tenyeszbika_name: 'Morzsa' } }, animal_count: 25 },
        { id: '4B', pen_number: '4B', pen_type: 'outdoor', capacity: 0, location: 'Bal oldal', current_function: { id: '4B', function_type: 'vemhes', start_date: '2025-04-01', metadata: {} }, animal_count: 24 },
        { id: '13', pen_number: '13', pen_type: 'outdoor', capacity: 0, location: 'Bal oldal', current_function: { id: '13', function_type: 'tehén', start_date: '2025-03-15', metadata: {} }, animal_count: 25 },
        { id: '14', pen_number: '14', pen_type: 'outdoor', capacity: 0, location: 'Bal oldal', current_function: { id: '14', function_type: 'üres', start_date: '2025-06-18', metadata: {}, notes: 'Még nincs kész' }, animal_count: 0 },
        { id: '15', pen_number: '15', pen_type: 'outdoor', capacity: 0, location: 'Bal oldal', current_function: { id: '15', function_type: 'üres', start_date: '2025-06-18', metadata: {}, notes: 'Még nincs kész' }, animal_count: 0 },

        // JOBB OLDAL KARAMOK  
        { id: '5', pen_number: '5', pen_type: 'outdoor', capacity: 0, location: 'Jobb oldal', current_function: { id: '5', function_type: 'óvi', start_date: '2025-06-10', metadata: {} }, animal_count: 20 },
        { id: '6', pen_number: '6', pen_type: 'outdoor', capacity: 0, location: 'Jobb oldal', current_function: { id: '6', function_type: 'bölcsi', start_date: '2025-06-10', metadata: {} }, animal_count: 19 },
        { id: '7', pen_number: '7', pen_type: 'outdoor', capacity: 0, location: 'Jobb oldal', current_function: { id: '7', function_type: 'hárem', start_date: '2025-05-01', metadata: { tenyeszbika_name: 'Zorro' } }, animal_count: 26 },
        { id: '8', pen_number: '8', pen_type: 'outdoor', capacity: 0, location: 'Jobb oldal', current_function: { id: '8', function_type: 'vemhes', start_date: '2025-04-15', metadata: {} }, animal_count: 22 },
        { id: '9', pen_number: '9', pen_type: 'outdoor', capacity: 0, location: 'Jobb oldal', current_function: { id: '9', function_type: 'hízóbika', start_date: '2025-03-01', metadata: {} }, animal_count: 18 },
        { id: '10', pen_number: '10', pen_type: 'outdoor', capacity: 0, location: 'Jobb oldal', current_function: { id: '10', function_type: 'tehén', start_date: '2025-02-20', metadata: {} }, animal_count: 24 },
        { id: '11', pen_number: '11', pen_type: 'outdoor', capacity: 0, location: 'Jobb oldal', current_function: { id: '11', function_type: 'óvi', start_date: '2025-06-01', metadata: {} }, animal_count: 21 },

        // KONTÉNEREKNÉL KARAMOK
        { id: '12A', pen_number: '12A', pen_type: 'outdoor', capacity: 0, location: 'Konténereknél', current_function: { id: '12A', function_type: 'bölcsi', start_date: '2025-06-05', metadata: {} }, animal_count: 14 },
        { id: '12B', pen_number: '12B', pen_type: 'outdoor', capacity: 0, location: 'Konténereknél', current_function: { id: '12B', function_type: 'óvi', start_date: '2025-06-05', metadata: {} }, animal_count: 13 },

        // ELLETŐ ISTÁLLÓ - BAL OLDAL
        { id: 'E1', pen_number: 'E1', pen_type: 'birthing', capacity: 0, location: 'Ellető istálló - Bal oldal', current_function: { id: 'E1', function_type: 'ellető', start_date: '2025-06-15', metadata: {} }, animal_count: 22 },
        { id: 'E2', pen_number: 'E2', pen_type: 'birthing', capacity: 0, location: 'Ellető istálló - Bal oldal', current_function: { id: 'E2', function_type: 'ellető', start_date: '2025-06-17', metadata: {} }, animal_count: 20 },
        { id: 'EB3', pen_number: 'EB3', pen_type: 'birthing', capacity: 0, location: 'Ellető istálló - Bal oldal', current_function: { id: 'EB3', function_type: 'ellető', start_date: '2025-06-19', metadata: {} }, animal_count: 1 },
        { id: 'EB4', pen_number: 'EB4', pen_type: 'birthing', capacity: 0, location: 'Ellető istálló - Bal oldal', current_function: { id: 'EB4', function_type: 'üres', start_date: '2025-06-20', metadata: {} }, animal_count: 0 },
        { id: 'EB5', pen_number: 'EB5', pen_type: 'birthing', capacity: 0, location: 'Ellető istálló - Bal oldal', current_function: { id: 'EB5', function_type: 'üres', start_date: '2025-06-20', metadata: {} }, animal_count: 0 },
        { id: 'EB6', pen_number: 'EB6', pen_type: 'birthing', capacity: 0, location: 'Ellető istálló - Bal oldal', current_function: { id: 'EB6', function_type: 'üres', start_date: '2025-06-20', metadata: {} }, animal_count: 0 },

        // ELLETŐ ISTÁLLÓ - JOBB OLDAL  
        { id: 'E7', pen_number: 'E7', pen_type: 'birthing', capacity: 0, location: 'Ellető istálló - Jobb oldal', current_function: { id: 'E7', function_type: 'ellető', start_date: '2025-06-16', metadata: {} }, animal_count: 18 },
        { id: 'E8', pen_number: 'E8', pen_type: 'birthing', capacity: 0, location: 'Ellető istálló - Jobb oldal', current_function: { id: 'E8', function_type: 'üres', start_date: '2025-06-20', metadata: {} }, animal_count: 0 },
        { id: 'EB9', pen_number: 'EB9', pen_type: 'birthing', capacity: 0, location: 'Ellető istálló - Jobb oldal', current_function: { id: 'EB9', function_type: 'ellető', start_date: '2025-06-18', metadata: {} }, animal_count: 1 },
        { id: 'EB10', pen_number: 'EB10', pen_type: 'birthing', capacity: 0, location: 'Ellető istálló - Jobb oldal', current_function: { id: 'EB10', function_type: 'üres', start_date: '2025-06-20', metadata: {} }, animal_count: 0 },
        { id: 'EB11', pen_number: 'EB11', pen_type: 'birthing', capacity: 0, location: 'Ellető istálló - Jobb oldal', current_function: { id: 'EB11', function_type: 'üres', start_date: '2025-06-20', metadata: {} }, animal_count: 0 },
        { id: 'EB12', pen_number: 'EB12', pen_type: 'birthing', capacity: 0, location: 'Ellető istálló - Jobb oldal', current_function: { id: 'EB12', function_type: 'üres', start_date: '2025-06-20', metadata: {} }, animal_count: 0 }
      ];

      // Dinamikus kapacitás számítás minden karamra
      const pensWithCapacity = mockPensData.map(pen => ({
        ...pen,
        capacity: calculateCapacity(pen.current_function?.function_type || 'üres', pen.pen_number)
      }));

      setPens(pensWithCapacity);
    } catch (err) {
      console.error('Hiba a karamok betöltésekor:', err);
      setError('Hiba történt a karamok betöltésekor');
    } finally {
      setLoading(false);
    }
  };

  // Szűrés
  const filteredPens = pens.filter(pen => {
    const matchesType = selectedType === 'mind' || pen.current_function?.function_type === selectedType;
    const matchesSearch = pen.pen_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pen.location?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Statisztikák
  const totalCapacity = pens.reduce((sum, pen) => sum + pen.capacity, 0);
  const totalAnimals = pens.reduce((sum, pen) => sum + pen.animal_count, 0);
  const utilizationPercentage = totalCapacity > 0 ? (totalAnimals / totalCapacity) * 100 : 0;

  // Funkció típusok statisztikái
  const functionStats = pens.reduce((stats, pen) => {
    const funcType = pen.current_function?.function_type || 'üres';
    stats[funcType] = (stats[funcType] || 0) + 1;
    return stats;
  }, {} as { [key: string]: number });

  const functionTypes = ['mind', 'bölcsi', 'óvi', 'hárem', 'vemhes', 'hízóbika', 'ellető', 'tehén', 'üres'];

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

      {/* Statisztika Widget */}
      <PenStats pens={pens} />

      {/* Filters and Search */}
      <div className="bg-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Keresés karám száma vagy helye alapján..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Function Type Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 bg-white"
              >
                {functionTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'mind' ? 'Összes funkció' : `${getFunctionEmoji(type)} ${type.charAt(0).toUpperCase() + type.slice(1)}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Funkció statisztikák */}
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.entries(functionStats).map(([funcType, count]) => (
              <div key={funcType} className={`px-3 py-1 rounded-full text-sm font-medium ${getFunctionColor(funcType)}`}>
                {getFunctionEmoji(funcType)} {funcType}: {count}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Karám Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPens.map((pen) => (
            <div
              key={pen.id}
              onClick={() => router.push(`/dashboard/pens/${pen.id}`)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            >
              {/* Karám Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{pen.pen_number}</h3>
                  <span className="text-sm text-gray-500">{getPenTypeDisplay(pen.pen_type)}</span>
                </div>
                {pen.location && (
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <MapPin className="h-3 w-3 mr-1" />
                    {pen.location}
                  </div>
                )}
              </div>

              {/* Funkció Information */}
              <div className="p-4">
                {pen.current_function ? (
                  <div className={`mb-3 px-3 py-2 rounded-full text-sm font-medium border ${getFunctionColor(pen.current_function.function_type)}`}>
                    {getFunctionEmoji(pen.current_function.function_type)} {pen.current_function.function_type.charAt(0).toUpperCase() + pen.current_function.function_type.slice(1)}
                  </div>
                ) : (
                  <div className="mb-3 px-3 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200">
                    ❓ Nincs funkció
                  </div>
                )}

                {/* Kapacitás */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Kapacitás:</span>
                  <span className={`text-sm font-medium px-2 py-1 rounded ${getCapacityColor(pen.animal_count, pen.capacity)}`}>
                    {pen.animal_count} / {pen.capacity}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className={`h-2 rounded-full transition-all ${pen.animal_count / pen.capacity > 0.8 ? 'bg-red-500' :
                        pen.animal_count / pen.capacity > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                    style={{ width: `${Math.min((pen.animal_count / pen.capacity) * 100, 100)}%` }}
                  />
                </div>

                {/* Hárem extra info */}
                {pen.current_function?.function_type === 'hárem' && pen.current_function.metadata?.tenyeszbika_name && (
                  <div className="text-xs text-gray-500">
                    Tenyészbika: {pen.current_function.metadata.tenyeszbika_name}
                  </div>
                )}

                {/* Riasztások */}
                {pen.animal_count > pen.capacity && (
                  <div className="mt-2 flex items-center text-red-600 text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Túlzsúfolt!
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredPens.length === 0 && (
          <div className="text-center py-12">
            <Home className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nincsenek karamok</h3>
            <p className="mt-1 text-sm text-gray-500">Kezdjen el egy új karám hozzáadásával.</p>
          </div>
        )}
      </div>
    </div>
  );
}