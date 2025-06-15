'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { mockStorage } from '@/lib/mockStorage';

interface Animal {
  enar: string;
  szuletesi_datum: string;
  ivar: 'hímivar' | 'nőivar';
  kategoria: string;
  jelenlegi_karam: string;
  statusz: string;
  anya_enar?: string;
  apa_enar?: string;
  kplsz?: string;
  bekerules_datum?: string;
  fotok?: string[];
  utolso_modositas: string;
  letrehozva: string;
}

type SortField = 'enar' | 'szuletesi_datum' | 'kategoria' | 'jelenlegi_karam' | 'statusz';
type SortDirection = 'asc' | 'desc';

export default function AnimalsPage() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [filteredAnimals, setFilteredAnimals] = useState<Animal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [penFilter, setPenFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('enar');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Adatok betöltése
  useEffect(() => {
    loadAnimals();
  }, []);

  const loadAnimals = () => {
  const data = JSON.parse(localStorage.getItem('animals') || '[]');
  setAnimals(data);
  setFilteredAnimals(data);
};

  // Keresés és szűrés
  useEffect(() => {
    let filtered = animals.filter(animal => {
      const matchesSearch = searchTerm === '' || 
        animal.enar.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (animal.anya_enar && animal.anya_enar.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (animal.apa_enar && animal.apa_enar.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = categoryFilter === '' || animal.kategoria === categoryFilter;
      const matchesPen = penFilter === '' || animal.jelenlegi_karam === penFilter;
      const matchesStatus = statusFilter === '' || animal.statusz === statusFilter;

      return matchesSearch && matchesCategory && matchesPen && matchesStatus;
    });

    // Rendezés
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'szuletesi_datum') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredAnimals(filtered);
    setCurrentPage(1);
  }, [animals, searchTerm, categoryFilter, penFilter, statusFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Életkor kalkuláció
  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const now = new Date();
    const diffMs = now.getTime() - birth.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (days < 30) return `${days} nap`;
    if (days < 365) return `${Math.floor(days / 30)} hónap`;
    return `${Math.floor(days / 365)} év`;
  };

  // Kategória színek
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'növarú_borjú': 'bg-yellow-100 text-yellow-800',
      'hízóbika': 'bg-blue-100 text-blue-800',
      'szűz_üsző': 'bg-pink-100 text-pink-800',
      'vemhes_üsző': 'bg-purple-100 text-purple-800',
      'tehén': 'bg-green-100 text-green-800',
      'tenyészbika': 'bg-red-100 text-red-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  // Státusz színek
  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'egészséges': 'bg-green-100 text-green-800',
      'kezelés_alatt': 'bg-yellow-100 text-yellow-800',
      'megfigyelés_alatt': 'bg-orange-100 text-orange-800',
      'beteg': 'bg-red-100 text-red-800',
      'karantén': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Egyedi kategóriák és karámok
  const categories = [...new Set(animals.map(a => a.kategoria))];
  const pens = [...new Set(animals.map(a => a.jelenlegi_karam))];
  const statuses = [...new Set(animals.map(a => a.statusz))];

  // Paginálás
  const totalPages = Math.ceil(filteredAnimals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedAnimals = filteredAnimals.slice(startIndex, startIndex + itemsPerPage);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="space-y-6 px-4 md:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            🐄 Állomány
          </h1>
          <p className="text-gray-600 mt-1">
            Összesen {filteredAnimals.length} állat ({animals.length} teljes állomány)
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={loadAnimals}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 justify-center"
          >
            🔄 Frissítés
          </button>
          <Link
            href="/dashboard/animals/new"
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 font-medium justify-center"
          >
            ➕ Új állat
          </Link>
        </div>
      </div>

      {/* Keresés és szűrők */}
      <div className="bg-white p-4 md:p-6 rounded-lg border space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔍 Keresés
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ENAR, anya vagy apa ENAR..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🏷️ Kategória
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Összes kategória</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🏠 Karám
            </label>
            <select
              value={penFilter}
              onChange={(e) => setPenFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Összes karám</option>
              {pens.map(pen => (
                <option key={pen} value={pen}>{pen}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📊 Státusz
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Összes státusz</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('');
                setPenFilter('');
                setStatusFilter('');
              }}
              className="w-full p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              🗑️ Törlés
            </button>
          </div>
        </div>
      </div>

      {/* Állatlista táblázat */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('enar')}
                >
                  🏷️ ENAR {getSortIcon('enar')}
                </th>
                <th 
                  className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('szuletesi_datum')}
                >
                  📅 Születés / Életkor {getSortIcon('szuletesi_datum')}
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ⚧️ Ivar
                </th>
                <th 
                  className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('kategoria')}
                >
                  🏷️ Kategória {getSortIcon('kategoria')}
                </th>
                <th 
                  className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('jelenlegi_karam')}
                >
                  🏠 Jelenlegi karám {getSortIcon('jelenlegi_karam')}
                </th>
                <th 
                  className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('statusz')}
                >
                  📊 Státusz {getSortIcon('statusz')}
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  🐮❤️🐂 Szülők
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  🔗 Műveletek
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayedAnimals.map((animal) => (
                <tr key={animal.enar} className="hover:bg-gray-50">
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                    <Link 
                      href={`/dashboard/animals/${animal.enar}`}
                      className="text-green-600 hover:text-green-800 font-medium text-sm"
                    >
                      {animal.enar}
                    </Link>
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="text-xs md:text-sm">{animal.szuletesi_datum}</div>
                      <div className="text-gray-500 text-xs">
                        {calculateAge(animal.szuletesi_datum)}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="hidden md:inline">
                      {animal.ivar === 'hímivar' ? '♂️ Hímivar' : '♀️ Nőivar'}
                    </span>
                    <span className="md:hidden">
                      {animal.ivar === 'hímivar' ? '♂️' : '♀️'}
                    </span>
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(animal.kategoria)}`}>
                      <span className="hidden md:inline">{animal.kategoria}</span>
                      <span className="md:hidden">{animal.kategoria.split('_')[0]}</span>
                    </span>
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                    {animal.jelenlegi_karam}
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(animal.statusz)}`}>
                      {animal.statusz}
                    </span>
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="space-y-1">
                      {animal.anya_enar && (
                        <div className="flex items-center gap-1">
                          🐮 <Link 
                            href={`/dashboard/animals/${animal.anya_enar}`}
                            className="text-green-600 hover:text-green-800 text-xs md:text-sm"
                          >
                            <span className="hidden md:inline">{animal.anya_enar}</span>
                            <span className="md:hidden">{animal.anya_enar.slice(-4)}</span>
                          </Link>
                        </div>
                      )}
                      {animal.apa_enar && (
                        <div className="flex items-center gap-1">
                          🐂 <Link 
                            href={`/dashboard/animals/${animal.apa_enar}`}
                            className="text-green-600 hover:text-green-800 text-xs md:text-sm"
                          >
                            <span className="hidden md:inline">{animal.apa_enar}</span>
                            <span className="md:hidden">{animal.apa_enar.slice(-4)}</span>
                          </Link>
                        </div>
                      )}
                      {animal.kplsz && (
                        <div className="text-xs text-purple-600">
                          🧪 {animal.kplsz}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Link 
                      href={`/dashboard/animals/${animal.enar}`}
                      className="text-green-600 hover:text-green-800 font-medium text-xs md:text-sm"
                    >
                      <span className="hidden md:inline">👁️ Megtekintés</span>
                      <span className="md:hidden">👁️</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginálás */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t">
            <div className="text-sm text-gray-700">
              {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAnimals.length)} állat, összesen {filteredAnimals.length}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Előző
              </button>
              <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Következő →
              </button>
            </div>
          </div>
        )}
      </div>

      {filteredAnimals.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">
            🔍 Nincs találat a keresési feltételekkel
          </div>
          <button
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('');
              setPenFilter('');
              setStatusFilter('');
            }}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            🗑️ Szűrők törlése
          </button>
        </div>
      )}
    </div>
  );
}
