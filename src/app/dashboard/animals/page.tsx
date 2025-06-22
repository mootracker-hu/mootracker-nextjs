// src/app/dashboard/animals/page.tsx  
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  Users,
  Calendar,
  MapPin,
  AlertCircle,
  Check,
  X,
  ArrowRight
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
  birth_location?: 'nálunk' | 'vásárolt' | 'ismeretlen';
}

interface Pen {
  id: any;
  pen_number: any;
  location: any;
  capacity: any;
  current_function?: any;
}

export default function AnimalsPage() {
  const router = useRouter();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [filteredAnimals, setFilteredAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  // ÚJ STATE-EK KARÁM HOZZÁRENDELÉSHEZ
  const [availablePens, setAvailablePens] = useState<any[]>([]);
  const [selectedAnimals, setSelectedAnimals] = useState<number[]>([]);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [bulkTargetPen, setBulkTargetPen] = useState('');
  const [bulkReason, setBulkReason] = useState('');
  const [bulkNotes, setBulkNotes] = useState('');
  const [assignmentLoading, setAssignmentLoading] = useState(false);

  const getCategoryEmoji = (kategoria: string): string => {
    const emojiMap: { [key: string]: string } = {
      'nőivarú_borjú': '🐮',
      'szűz_üsző': '🐄',
      'háremben_lévő_üsző': '🐄💕',
      'vemhes_üsző': '🐄💖',
      'üres_üsző': '🐄🚫',
      'csíra': '🐄⚠️',
      'tehén': '🐄🍼',
      'hímivarú_borjú': '🐂',
      'hízóbika': '🐂',
      'tenyészbika': '🐂'
    };
    return emojiMap[kategoria] || '';
  };

  // Szűrő és keresés state-ek  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [penFilter, setPenFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBirthLocation, setSelectedBirthLocation] = useState('');

  // Pagination logic  
  const totalPages = Math.ceil(filteredAnimals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAnimals = filteredAnimals.slice(startIndex, endIndex);

  console.log('filteredAnimals.length:', filteredAnimals.length);
  console.log('currentPage:', currentPage);
  console.log('startIndex:', startIndex);
  console.log('endIndex:', endIndex);
  console.log('currentAnimals.length:', currentAnimals.length);
  console.log('9120 a currentAnimals-ban:', currentAnimals.filter(a => a.enar.includes('9120')));

  // ÚJ FUNKCIÓ: Elérhető karamok betöltése (JAVÍTOTT verzió)
  const fetchAvailablePens = async () => {
    try {
      console.log('🔍 Karamok betöltése kezdődik...');

      // EGYSZERŰ QUERY ELŐSZÖR
      const { data: simpleData, error: simpleError } = await supabase
        .from('pens')
        .select('id, pen_number, location, capacity')
        .order('pen_number');

      console.log('🏠 Egyszerű karamok query:', { simpleData, simpleError });

      if (simpleError) {
        console.error('❌ Egyszerű query hiba:', simpleError);
        return;
      }

      if (!simpleData || simpleData.length === 0) {
        console.error('❌ Nincsenek karamok az adatbázisban!');
        return;
      }

      // FUNKCIÓK KÜLÖN LEKÉRÉSE
      const { data: functionsData, error: functionsError } = await supabase
        .from('pen_functions')
        .select('pen_id, function_name')
        .is('end_date', null);

      console.log('🔧 Funkciók query:', { functionsData, functionsError });

      // ADATOK ÖSSZEKAPCSOLÁSA
      const pensWithFunctions = simpleData.map(pen => {
        const currentFunction = functionsData?.find(f => f.pen_id === pen.id);
        return {
          ...pen,
          current_function: currentFunction ? {
            function_name: currentFunction.function_name
          } : null
        };
      });

      console.log('✅ Végleges karamok listája:', pensWithFunctions);
      setAvailablePens(pensWithFunctions);

    } catch (err) {
      console.error('💥 fetchAvailablePens hiba:', err);
    }
  };

  // ÚJ FUNKCIÓ: Állat hozzárendelése karamhoz
  const assignAnimalToPen = async (animalId: number, penId: string, reason: string = 'manual_assignment') => {
    try {
      console.log(`🔄 Állat hozzárendelése: ${animalId} → ${penId}`);

      // 1. Régi hozzárendelés lezárása (ha van)
      await supabase
        .from('animal_pen_assignments')
        .update({ removed_at: new Date().toISOString() })
        .eq('animal_id', animalId)
        .is('removed_at', null);

      // 2. Új hozzárendelés létrehozása
      const { error } = await supabase
        .from('animal_pen_assignments')
        .insert({
          animal_id: animalId,
          pen_id: penId,
          assigned_at: new Date().toISOString(),
          assignment_reason: reason
        });

      if (error) {
        console.error('Hozzárendelési hiba:', error);
        throw error;
      }

      console.log('✅ Hozzárendelés sikeres');
      return true;
    } catch (err) {
      console.error('assignAnimalToPen hiba:', err);
      return false;
    }
  };

  // ÚJ FUNKCIÓ: Bulk hozzárendelés
  const handleBulkAssign = async () => {
    if (!bulkTargetPen || selectedAnimals.length === 0) {
      alert('Válassz ki állatokat és célkaramot!');
      return;
    }

    setAssignmentLoading(true);
    try {
      let successCount = 0;

      for (const animalId of selectedAnimals) {
        const success = await assignAnimalToPen(animalId, bulkTargetPen, bulkReason || 'bulk_assignment');
        if (success) successCount++;
      }

      alert(`${successCount}/${selectedAnimals.length} állat sikeresen hozzárendelve!`);

      // UI visszaállítás
      setSelectedAnimals([]);
      setShowBulkAssign(false);
      setBulkTargetPen('');
      setBulkReason('');
      setBulkNotes('');

      // Adatok frissítése
      fetchAnimals();

    } catch (err) {
      console.error('Bulk assignment hiba:', err);
      alert('Hiba történt a hozzárendelés során!');
    } finally {
      setAssignmentLoading(false);
    }
  };

  // Adatok betöltése Supabase-ből  
  const fetchAnimals = async () => {
    try {
      setLoading(true);
      console.log('🐄 Állatok betöltése karám adatokkal...');

      // Próbáljuk meg a JOIN query-t
      const { data: animalsWithPens, error: joinError } = await supabase
        .from('animals')
        .select(`
        *,
        animal_pen_assignments!left(
          pen_id,
          assigned_at,
          removed_at,
          pens(
            pen_number,
            location,
            pen_type
          )
        )
      `)
        .is('animal_pen_assignments.removed_at', null)
        .order('created_at', { ascending: false });

      if (joinError) {
        console.warn('⚠️ JOIN query hiba, fallback egyszerű query-re:', joinError);

        // Fallback: egyszerű állatok lekérdezés
        const { data: simpleAnimals, error: simpleError } = await supabase
          .from('animals')
          .select('*')
          .order('created_at', { ascending: false });

        if (simpleError) {
          console.error('❌ Egyszerű állatok lekérdezés is hibás:', simpleError);
          setError('Nem sikerült betölteni az állatokat');
          setLoading(false);
          return;
        }

        console.log('✅ Fallback: állatok betöltve karamok nélkül:', simpleAnimals?.length || 0);
        setAnimals(simpleAnimals || []);
        setFilteredAnimals(simpleAnimals || []);
      } else {
        console.log('✅ Állatok + karamok sikeresen betöltve:', animalsWithPens?.length || 0);
        console.log('📊 Példa állat karám adatokkal:', animalsWithPens?.[0]);
        setAnimals(animalsWithPens || []);
        setFilteredAnimals(animalsWithPens || []);
      }

      setLoading(false);
    } catch (err) {
      console.error('💥 fetchAnimals általános hiba:', err);
      setError('Hiba történt az állatok betöltésekor');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimals();
    fetchAvailablePens();
  }, []);

  // Keresés és szűrés  
  useEffect(() => {

    if (!animals || animals.length === 0) {
      setFilteredAnimals([]);
      return;
    }

    let filtered = animals;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(animal =>
        animal.enar.toLowerCase().includes(term) ||
        getShortId(animal.enar).includes(term)
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(animal => animal.kategoria === categoryFilter);
    }

    if (penFilter) {
      filtered = filtered.filter(animal => {
        const assignment = (animal as any).animal_pen_assignments?.find(
          (a: any) => a.removed_at === null
        );
        return assignment?.pens?.pen_number === penFilter;
      });
    }

    if (statusFilter) {
      filtered = filtered.filter(animal => animal.statusz === statusFilter);
    }

    if (selectedBirthLocation) {
      filtered = filtered.filter((animal) => {
        const birthLocation = (animal as any).birth_location;
        return birthLocation === selectedBirthLocation;
      });
    }

    console.log('penFilter:', penFilter);
    console.log('categoryFilter:', categoryFilter);
    console.log('filtered állatok száma:', filtered.length);
    console.log('9120 a filtered-ban:', filtered.filter(a => a.enar.includes('9120')));

    setFilteredAnimals(filtered);
  }, [animals, searchTerm, categoryFilter, penFilter, statusFilter, selectedBirthLocation]);

  // Checkbox kezelés
  const handleSelectAnimal = (animalId: number) => {
    setSelectedAnimals(prev =>
      prev.includes(animalId)
        ? prev.filter(id => id !== animalId)
        : [...prev, animalId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAnimals.length === currentAnimals.length) {
      setSelectedAnimals([]);
    } else {
      setSelectedAnimals(currentAnimals.map(animal => animal.id));
    }
  };

  // Rövid ENAR azonosító (utolsó 5 szám)  
  const getShortId = (enar: string): string => {
    const numbers = enar.replace(/\D/g, '');
    return numbers.slice(-5);
  };

  // Életkor kalkuláció  
  const calculateAge = (birthDate: string): string => {
    const birth = new Date(birthDate);
    const now = new Date();
    const diffMs = now.getTime() - birth.getTime();
    const years = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
    const months = Math.floor((diffMs % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));

    if (years > 0) {
      return `${years} év ${months > 0 ? months + ' hó' : ''}`;
    }
    return `${months} hónap`;
  };

  // Kategória színek  
  const getCategoryColor = (category: string): string => {
    const colors = {
      'tehén': 'bg-green-100 text-green-800',
      'szűz_üsző': 'bg-blue-100 text-blue-800',
      'vemhes_üsző': 'bg-purple-100 text-purple-800',
      'nőivarú_borjú': 'bg-pink-100 text-pink-800',
      'növarú_borjú': 'bg-pink-100 text-pink-800',
      'hímivarú_borjú': 'bg-orange-100 text-orange-800',
      'hízóbika': 'bg-red-100 text-red-800',
      'tenyészbika': 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Egyedi értékek lekérése szűréshez  
  const uniqueCategories = [...new Set(animals.map(a => a.kategoria))].filter(Boolean);
  const uniquePens = [...new Set(
    animals
      .map(animal => {
        const assignment = (animal as any).animal_pen_assignments?.find(
          (a: any) => a.removed_at === null
        );
        return assignment?.pens?.pen_number;
      })
      .filter(Boolean)
  )];
  const uniqueStatuses = [...new Set(animals.map(a => a.statusz))].filter(Boolean);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Állatok betöltése...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Hiba történt</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Újratöltés
          </button>
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
                <Users className="h-6 w-6 mr-2 text-green-600" />
                Állomány
              </h1>
              <p className="text-sm text-gray-500">
                Összesen {animals.length} állat ({filteredAnimals.length} megjelenítve)
                {selectedAnimals.length > 0 && (
                  <span className="ml-2 text-green-600 font-medium">
                    • {selectedAnimals.length} kiválasztva
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {/* ÚJ: Bulk Assignment gomb */}
              {selectedAnimals.length > 0 && (
                <button
                  onClick={() => setShowBulkAssign(true)}
                  className="flex items-center px-3 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <ArrowRight className="h-4 w-4 mr-1" />
                  Karám hozzárendelés ({selectedAnimals.length})
                </button>
              )}

              <Link
                href="/dashboard/import-export"
                className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload className="h-4 w-4 mr-1" />
                Importálás
              </Link>

              <Link
                href="/dashboard/animals/new"
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Új állat
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Assignment Modal */}
      {showBulkAssign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Karám hozzárendelés ({selectedAnimals.length} állat)
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Célkarám *
                </label>
                <select
                  value={bulkTargetPen}
                  onChange={(e) => setBulkTargetPen(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Válassz karamot...</option>
                  {availablePens.map(pen => (
                    <option key={pen.id} value={pen.id}>
                      {pen.pen_number} - {pen.current_function?.function_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hozzárendelés oka
                </label>
                <select
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Válassz okot...</option>
                  <option value="new_arrival">Új bekerülés</option>
                  <option value="sorting">Válogatás</option>
                  <option value="breeding">Tenyésztés</option>
                  <option value="medical">Egészségügyi</option>
                  <option value="manual_assignment">Kézi hozzárendelés</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Megjegyzés
                </label>
                <textarea
                  value={bulkNotes}
                  onChange={(e) => setBulkNotes(e.target.value)}
                  placeholder="Opcionális megjegyzés..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowBulkAssign(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Mégse
              </button>
              <button
                onClick={handleBulkAssign}
                disabled={!bulkTargetPen || assignmentLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {assignmentLoading ? 'Hozzárendelés...' : 'Hozzárendelés'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statisztika Widget - külön szekció */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full">
              <span className="text-blue-700 font-medium">📊 Összesen: {animals.length} állat</span>
            </div>

            {/* Nőivarok */}
            <div className="flex items-center bg-pink-50 px-3 py-1 rounded-full">
              <span className="text-pink-700 font-medium">🐮 {animals.filter(a => a.kategoria === 'nőivarú_borjú').length} nőivarú borjú</span>
            </div>
            <div className="flex items-center bg-purple-50 px-3 py-1 rounded-full">
              <span className="text-purple-700 font-medium">🐄 {animals.filter(a => a.kategoria === 'szűz_üsző').length} szűz üsző</span>
            </div>
            <div className="flex items-center bg-red-50 px-3 py-1 rounded-full">
              <span className="text-red-700 font-medium">🐄💕 {animals.filter(a => a.kategoria === 'háremben_lévő_üsző').length} háremben</span>
            </div>
            <div className="flex items-center bg-green-50 px-3 py-1 rounded-full">
              <span className="text-green-700 font-medium">🐄💖 {animals.filter(a => a.kategoria === 'vemhes_üsző').length} vemhes üsző</span>
            </div>
            <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full">
              <span className="text-yellow-700 font-medium">🐄🚫 {animals.filter(a => a.kategoria === 'üres_üsző').length} üres üsző</span>
            </div>
            <div className="flex items-center bg-gray-50 px-3 py-1 rounded-full">
              <span className="text-gray-700 font-medium">🐄⚠️ {animals.filter(a => a.kategoria === 'csíra').length} csíra</span>
            </div>
            <div className="flex items-center bg-green-50 px-3 py-1 rounded-full">
              <span className="text-green-700 font-medium">🐄🍼 {animals.filter(a => a.kategoria === 'tehén').length} tehén</span>
            </div>

            {/* Hímivarok */}
            <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full">
              <span className="text-blue-700 font-medium">🐂 {animals.filter(a => a.kategoria === 'hímivarú_borjú').length} hímivarú borjú</span>
            </div>
            <div className="flex items-center bg-orange-50 px-3 py-1 rounded-full">
              <span className="text-orange-700 font-medium">🐂 {animals.filter(a => a.kategoria === 'hízóbika').length} hízóbika</span>
            </div>
            <div className="flex items-center bg-red-50 px-3 py-1 rounded-full">
              <span className="text-red-700 font-medium">🐂 {animals.filter(a => a.kategoria === 'tenyészbika').length} tenyészbika</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Keresés */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="ENAR, anya vagy apa ENAR keresése..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Kategória szűrés */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Összes kategória</option>
              {uniqueCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Karám szűrés */}
            <select
              value={penFilter}
              onChange={(e) => setPenFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Összes karám</option>
              {availablePens.map(pen => (
                <option key={pen.id} value={pen.pen_number}>
                  {pen.pen_number} - {pen.location}
                </option>
              ))}
            </select>

            {/* Státusz szűrés */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Összes státusz</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            {/* Származás szűrés */}
            <select
              value={selectedBirthLocation}
              onChange={(e) => setSelectedBirthLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Összes származás</option>
              <option value="nálunk">🏠 Nálunk született</option>
              <option value="vásárolt">🛒 Vásárolt</option>
              <option value="ismeretlen">❓ Ismeretlen</option>
            </select>
          </div>
        </div>
      </div>

      {/* Animals List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredAnimals.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {animals.length === 0 ? 'Nincsenek állatok' : 'Nincs találat'}
            </h3>
            <p className="text-gray-500 mb-6">
              {animals.length === 0
                ? 'Kezdj egy Excel importálással!'
                : 'Próbáld meg módosítani a keresési feltételeket.'
              }
            </p>
            {animals.length === 0 && (
              <Link
                href="/dashboard/import-export"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Upload className="h-4 w-4 mr-2" />
                Excel Importálás
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {/* ÚJ: Checkbox oszlop */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedAnimals.length === currentAnimals.length && currentAnimals.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <span>ENAR</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Születés / Életkor</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ivar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <span>Kategória</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>Jelenlegi Karám</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Státusz
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Szülők
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <span>Származás</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Műveletek
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentAnimals.map((animal) => (
                    <tr key={animal.id} className="hover:bg-gray-50 transition-colors">
                      {/* ÚJ: Checkbox cella */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedAnimals.includes(animal.id)}
                          onChange={() => handleSelectAnimal(animal.id)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/dashboard/animals/${encodeURIComponent(animal.enar)}`}
                            className="text-sm font-medium text-green-600 hover:text-green-800 transition-colors"
                          >
                            {animal.enar}
                          </Link>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            #{getShortId(animal.enar)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>{animal.szuletesi_datum}</div>
                          <div className="text-gray-500 text-xs">
                            {calculateAge(animal.szuletesi_datum)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-xl">
                          {animal.ivar === 'nő' ? '♀️' : '♂️'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(animal.kategoria)}`}>
                          <span className="mr-1">{getCategoryEmoji(animal.kategoria)}</span>
                          {animal.kategoria}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {/* Jelenlegi karám megjelenítése - biztonságos lekérdezés */}
                        {(() => {
                          // Próbáljuk meg megtalálni az aktív hozzárendelést - típus javítással
                          const assignment = (animal as any).animal_pen_assignments?.find(
                            (a: any) => a.removed_at === null
                          );

                          const penInfo = assignment?.pens;

                          if (penInfo?.pen_number) {
                            return (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                📍 {penInfo.pen_number}
                              </span>
                            );
                          } else {
                            return (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                🏠 Nincs karám
                              </span>
                            );
                          }
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${animal.statusz === 'aktív' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                          {animal.statusz}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="space-y-1">
                          {animal.anya_enar && (
                            <div className="flex items-center text-xs">
                              <span className="text-pink-600 mr-1">♀</span>
                              <Link
                                href={`/dashboard/animals/${encodeURIComponent(animal.anya_enar)}`}
                                className="text-green-600 hover:text-green-800 transition-colors"
                              >
                                #{getShortId(animal.anya_enar)}
                              </Link>
                            </div>
                          )}
                          {animal.apa_enar && (
                            <div className="flex items-center text-xs">
                              <span className="text-blue-600 mr-1">♂</span>
                              <Link
                                href={`/dashboard/animals/${encodeURIComponent(animal.apa_enar)}`}
                                className="text-green-600 hover:text-green-800 transition-colors"
                              >
                                #{getShortId(animal.apa_enar)}
                              </Link>
                            </div>
                          )}
                          {animal.kplsz && (
                            <div className="text-xs text-gray-400">
                              KPLSZ: {animal.kplsz}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex items-center space-x-1">
                          <span className="text-base">
                            {animal.birth_location === 'nálunk' ? '🏠' : '🛒'}
                          </span>
                          <span>
                            {animal.birth_location === 'nálunk' ? 'Nálunk' : 'Vásárolt'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/dashboard/animals/${encodeURIComponent(animal.enar)}`}
                          className="text-green-600 hover:text-green-900 transition-colors"
                        >
                          🔍 Megtekintés
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls - JAVÍTOTT VERZIÓ */}
            {!loading && filteredAnimals.length > 0 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Előző
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Következő
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{startIndex + 1}</span>
                      {' - '}
                      <span className="font-medium">{Math.min(endIndex, filteredAnimals.length)}</span>
                      {' / '}
                      <span className="font-medium">{filteredAnimals.length}</span>
                      {' állat megjelenítve'}
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        «
                      </button>

                      {/* JAVÍTOTT PAGINATION GOMBOK */}
                      {(() => {
                        const maxVisible = 5;
                        const startPage = Math.max(1, currentPage - 2);
                        const endPage = Math.min(totalPages, startPage + maxVisible - 1);
                        const adjustedStartPage = Math.max(1, endPage - maxVisible + 1);

                        return Array.from({ length: endPage - adjustedStartPage + 1 }, (_, i) => {
                          const pageNum = adjustedStartPage + i;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNum
                                ? 'z-10 bg-green-50 border-green-500 text-green-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                              {pageNum}
                            </button>
                          );
                        });
                      })()}

                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        »
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}