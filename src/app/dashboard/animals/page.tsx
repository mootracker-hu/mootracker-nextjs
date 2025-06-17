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
  AlertCircle
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

export default function AnimalsPage() {
  const router = useRouter();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [filteredAnimals, setFilteredAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Szűrő és keresés state-ek
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [penFilter, setPenFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Adatok betöltése Supabase-ből
  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        setLoading(true);
        console.log('Állatok betöltése Supabase-ből...');

        const { data, error } = await supabase
          .from('animals')
          .select('*')
          .order('enar', { ascending: true });

        if (error) {
          console.error('Supabase hiba:', error);
          setError('Nem sikerült betölteni az állatok listáját');
          return;
        }

        console.log(`${data?.length || 0} állat betöltve:`, data);
        setAnimals(data || []);
        setFilteredAnimals(data || []);

      } catch (err) {
        console.error('Fetch hiba:', err);
        setError('Hiba történt az adatok betöltése során');
      } finally {
        setLoading(false);
      }
    };

    fetchAnimals();
  }, []);

  // Keresés és szűrés
  useEffect(() => {
    let filtered = animals;

    // Keresés (ENAR, rövid azonosító)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(animal => 
        animal.enar.toLowerCase().includes(term) ||
        getShortId(animal.enar).includes(term)
      );
    }

    // Kategória szűrés
    if (categoryFilter) {
      filtered = filtered.filter(animal => animal.kategoria === categoryFilter);
    }

    // Karám szűrés
    if (penFilter) {
      filtered = filtered.filter(animal => animal.jelenlegi_karam === penFilter);
    }

    // Státusz szűrés
    if (statusFilter) {
      filtered = filtered.filter(animal => animal.statusz === statusFilter);
    }

    setFilteredAnimals(filtered);
  }, [animals, searchTerm, categoryFilter, penFilter, statusFilter]);

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
  const uniquePens = [...new Set(animals.map(a => a.jelenlegi_karam))].filter(Boolean);
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
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
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
              {uniquePens.map(pen => (
                <option key={pen} value={pen}>{pen}</option>
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
                      Műveletek
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAnimals.map((animal) => (
                    <tr key={animal.id} className="hover:bg-gray-50 transition-colors">
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          animal.ivar === 'nő' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {animal.ivar === 'nő' ? '♀' : '♂'} {animal.ivar}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(animal.kategoria)}`}>
                          {animal.kategoria}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {animal.jelenlegi_karam || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          animal.statusz === 'aktív' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/dashboard/animals/${encodeURIComponent(animal.enar)}`}
                          className="text-green-600 hover:text-green-900 transition-colors"
                        >
                          Megtekintés
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}