'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Search, Plus, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';
import { mockStorage, type Animal } from '@/lib/mockStorage';

// Kategória színek
const getCategoryColor = (kategoria: string) => {
  switch (kategoria) {
    case 'tenyészbika': return 'bg-purple-100 text-purple-800';
    case 'hízóbika': return 'bg-blue-100 text-blue-800';
    case 'tehén': return 'bg-pink-100 text-pink-800';
    case 'szűz_üsző': return 'bg-green-100 text-green-800';
    case 'vemhes_üsző': return 'bg-orange-100 text-orange-800';
    case 'vemhesülés_alatt': return 'bg-yellow-100 text-yellow-800';
    case 'növarú_borjú': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// Státusz színek
const getStatusColor = (statusz: string) => {
  switch (statusz) {
    case 'aktív': return 'bg-green-100 text-green-800';
    case 'selejtezés': return 'bg-yellow-100 text-yellow-800';
    case 'elhullott': return 'bg-red-100 text-red-800';
    case 'kikerült': return 'bg-gray-100 text-gray-800';
    case 'eladott': return 'bg-blue-100 text-blue-800';
    case 'házi vágás': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// Életkor kalkuláció
const calculateAge = (birthDate: string) => {
  const birth = new Date(birthDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - birth.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 30) return `${diffDays} nap`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} hónap`;
  
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  return months > 0 ? `${years} év ${months} hó` : `${years} év`;
};

type SortField = 'enar' | 'szuletesi_datum' | 'kategoria' | 'jelenlegi_karam' | 'statusz';
type SortDirection = 'asc' | 'desc';

export default function AnimalsPage() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [karamFilter, setKaramFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('enar');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  const itemsPerPage = 50;

  // Adatok betöltése
  const loadAnimals = () => {
    setIsLoading(true);
    try {
      const data = mockStorage.getAllAnimals();
      setAnimals(data);
    } catch (error) {
      console.error('Hiba az állatok betöltésekor:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Első betöltés
  useEffect(() => {
    loadAnimals();
  }, []);

  // Szűrt és rendezett állatok
  const filteredAndSortedAnimals = useMemo(() => {
    let filtered = animals.filter(animal => {
      const matchesSearch = animal.enar.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (animal.anya_enar?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (animal.apa_enar?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = !categoryFilter || animal.kategoria === categoryFilter;
      const matchesStatus = !statusFilter || animal.statusz === statusFilter;
      const matchesKaram = !karamFilter || animal.jelenlegi_karam === karamFilter;
      
      return matchesSearch && matchesCategory && matchesStatus && matchesKaram;
    });

    // Rendezés
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (sortField === 'szuletesi_datum') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [animals, searchTerm, categoryFilter, statusFilter, karamFilter, sortField, sortDirection]);

  // Paginálás
  const totalPages = Math.ceil(filteredAndSortedAnimals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAnimals = filteredAndSortedAnimals.slice(startIndex, startIndex + itemsPerPage);

  // Rendezés kezelése
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Egyedi értékek szűrőkhöz
  const uniqueCategories = [...new Set(animals.map(a => a.kategoria))];
  const uniqueStatuses = [...new Set(animals.map(a => a.statusz))];
  const uniqueKarams = [...new Set(animals.map(a => a.jelenlegi_karam))];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Állomány</h1>
          <p className="text-gray-600 mt-2">
            {filteredAndSortedAnimals.length} állat / {animals.length} összesen
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadAnimals}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Frissítés
          </button>
          <Link
            href="/dashboard/animals/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Új állat
          </Link>
        </div>
      </div>

      {/* Keresés és szűrők */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Keresés */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keresés (ENAR, szülők)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="HU004001, HU002001..."
              />
            </div>
          </div>

          {/* Kategória szűrő */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategória</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Összes</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Karám szűrő */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Karám</label>
            <select
              value={karamFilter}
              onChange={(e) => setKaramFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Összes</option>
              {uniqueKarams.map(karam => (
                <option key={karam} value={karam}>{karam}</option>
              ))}
            </select>
          </div>

          {/* Státusz szűrő */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Státusz</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Összes</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Állatok táblázat */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('enar')}
                >
                  <div className="flex items-center">
                    ENAR 
                    {sortField === 'enar' && (
                      sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('szuletesi_datum')}
                >
                  <div className="flex items-center">
                    Születés / Életkor
                    {sortField === 'szuletesi_datum' && (
                      sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Szülők
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('kategoria')}
                >
                  <div className="flex items-center">
                    Kategória
                    {sortField === 'kategoria' && (
                      sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('jelenlegi_karam')}
                >
                  <div className="flex items-center">
                    Karám
                    {sortField === 'jelenlegi_karam' && (
                      sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('statusz')}
                >
                  <div className="flex items-center">
                    Státusz
                    {sortField === 'statusz' && (
                      sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedAnimals.map((animal) => (
                <tr key={animal.enar} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/dashboard/animals/${animal.enar}`} className="text-blue-600 hover:text-blue-900 font-medium">
                      {animal.enar}
                    </Link>
                    <div className="text-sm text-gray-500">{animal.ivar}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>{new Date(animal.szuletesi_datum).toLocaleDateString('hu-HU')}</div>
                    <div className="text-gray-500">{calculateAge(animal.szuletesi_datum)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {animal.anya_enar && (
                      <div>Anya: <Link href={`/dashboard/animals/${animal.anya_enar}`} className="text-blue-600 hover:text-blue-900">{animal.anya_enar}</Link></div>
                    )}
                    {animal.apa_enar && (
                      <div>Apa: <Link href={`/dashboard/animals/${animal.apa_enar}`} className="text-blue-600 hover:text-blue-900">{animal.apa_enar}</Link></div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(animal.kategoria)}`}>
                      {animal.kategoria}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {animal.jelenlegi_karam}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(animal.statusz)}`}>
                      {animal.statusz}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginálás */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Előző
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Következő
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">{startIndex + 1}</span>
                  {' '}-{' '}
                  <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredAndSortedAnimals.length)}</span>
                  {' '}összesen{' '}
                  <span className="font-medium">{filteredAndSortedAnimals.length}</span>
                  {' '}eredményből
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Előző
                  </button>
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    if (page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 3 || page === currentPage + 3) {
                      return (
                        <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Következő
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
