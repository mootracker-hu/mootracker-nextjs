'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock adatok - később ezek az adatbázisból jönnek
const mockAnimals = [
  { enar: 'HU004001', szuletesi_datum: '2023-04-15', ivar: 'hímivar', kategoria: 'hízóbika', jelenlegi_karam: 'Karám #1', statusz: 'aktív', anya_enar: 'HU001234', apa_enar: 'HU001111' },
  { enar: 'HU002004', szuletesi_datum: '2022-12-10', ivar: 'nőivar', kategoria: 'vemhes_üsző', jelenlegi_karam: 'Hárem #2', statusz: 'aktív', anya_enar: 'HU001235', apa_enar: 'HU001112' },
  { enar: 'HU003021', szuletesi_datum: '2020-03-22', ivar: 'nőivar', kategoria: 'tehén', jelenlegi_karam: 'Karám #4', statusz: 'aktív', anya_enar: 'HU001236', apa_enar: 'HU001113' },
  { enar: 'HU005012', szuletesi_datum: '2023-08-05', ivar: 'nőivar', kategoria: 'növarú_borjú', jelenlegi_karam: 'Bölcsi #1', statusz: 'aktív', anya_enar: 'HU002004', apa_enar: 'HU001114' },
  { enar: 'HU006033', szuletesi_datum: '2022-06-18', ivar: 'nőivar', kategoria: 'szűz_üsző', jelenlegi_karam: 'Óvi #2', statusz: 'aktív', anya_enar: 'HU001237', apa_enar: 'HU001115' },
  { enar: 'HU007044', szuletesi_datum: '2021-01-30', ivar: 'hímivar', kategoria: 'tenyészbika', jelenlegi_karam: 'Hárem #1', statusz: 'aktív', anya_enar: 'HU001238', apa_enar: 'HU001116' },
  { enar: 'HU008055', szuletesi_datum: '2023-05-12', ivar: 'hímivar', kategoria: 'hízóbika', jelenlegi_karam: 'Karám #3', statusz: 'aktív', anya_enar: 'HU001239', apa_enar: 'HU001117' },
  { enar: 'HU009066', szuletesi_datum: '2022-11-25', ivar: 'nőivar', kategoria: 'vemhesülés_alatt', jelenlegi_karam: 'Hárem #3', statusz: 'aktív', anya_enar: 'HU001240', apa_enar: 'HU001118' },
];

type Animal = typeof mockAnimals[0];
type SortField = keyof Animal;

export default function AnimalsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams?.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPen, setSelectedPen] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortField, setSortField] = useState<SortField>('enar');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Kalkuláljuk az életkort
  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const now = new Date();
    const diffInMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    
    if (diffInMonths < 12) {
      return `${diffInMonths} hó`;
    } else {
      const years = Math.floor(diffInMonths / 12);
      const months = diffInMonths % 12;
      return months > 0 ? `${years} év ${months} hó` : `${years} év`;
    }
  };

  // Szűrt és rendezett állatok
  const filteredAndSortedAnimals = useMemo(() => {
    let filtered = mockAnimals.filter(animal => {
      const matchesSearch = searchTerm === '' || 
        animal.enar.toLowerCase().includes(searchTerm.toLowerCase()) ||
        animal.anya_enar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        animal.apa_enar?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === '' || animal.kategoria === selectedCategory;
      const matchesPen = selectedPen === '' || animal.jelenlegi_karam === selectedPen;
      const matchesStatus = selectedStatus === '' || animal.statusz === selectedStatus;
      
      return matchesSearch && matchesCategory && matchesPen && matchesStatus;
    });

    // Rendezés
    filtered.sort((a, b) => {
      let aValue: string | number = a[sortField] || '';
      let bValue: string | number = b[sortField] || '';
      
      if (sortField === 'szuletesi_datum') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [searchTerm, selectedCategory, selectedPen, selectedStatus, sortField, sortDirection]);

  // Paginálás
  const totalPages = Math.ceil(filteredAndSortedAnimals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAnimals = filteredAndSortedAnimals.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '⬆️' : '⬇️';
  };

  const getCategoryDisplay = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'tenyészbika': 'Tenyészbika',
      'hízóbika': 'Hízóbika', 
      'tehén': 'Tehén',
      'szűz_üsző': 'Szűz üsző',
      'vemhes_üsző': 'Vemhes üsző',
      'vemhesülés_alatt': 'Vemhesülés alatt',
      'növarú_borjú': 'Növarú borjú'
    };
    return categoryMap[category] || category;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aktív': return 'bg-green-100 text-green-800';
      case 'vemhes': return 'bg-blue-100 text-blue-800';
      case 'beteg': return 'bg-red-100 text-red-800';
      case 'selejtezés': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Egyedi kategóriák és karámok a szűrőkhöz
  const categories = [...new Set(mockAnimals.map(a => a.kategoria))];
  const pens = [...new Set(mockAnimals.map(a => a.jelenlegi_karam))];
  const statuses = [...new Set(mockAnimals.map(a => a.statusz))];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Állomány</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Összesen {filteredAndSortedAnimals.length} állat
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => router.push('/dashboard/import-export')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  📤 Import/Export
                </button>
                <button
                  onClick={() => router.push('/dashboard/animals/new')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  ➕ Új állat
                </button>
              </div>
            </div>

            {/* Szűrők */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  ENAR keresés
                </label>
                <input
                  type="text"
                  placeholder="HU1234567890"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Kategória
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Összes kategória</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{getCategoryDisplay(cat)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Karám
                </label>
                <select
                  value={selectedPen}
                  onChange={(e) => setSelectedPen(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Összes karám</option>
                  {pens.map(pen => (
                    <option key={pen} value={pen}>{pen}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Státusz
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Összes státusz</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Műveletek
                </label>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                    setSelectedPen('');
                    setSelectedStatus('');
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50"
                >
                  🔄 Szűrők törlése
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Állatok táblázat */}
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th 
                  onClick={() => handleSort('enar')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>ENAR</span>
                    <span>{getSortIcon('enar')}</span>
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('szuletesi_datum')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Születés / Életkor</span>
                    <span>{getSortIcon('szuletesi_datum')}</span>
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('ivar')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Ivar</span>
                    <span>{getSortIcon('ivar')}</span>
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('kategoria')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Kategória</span>
                    <span>{getSortIcon('kategoria')}</span>
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('jelenlegi_karam')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Karám</span>
                    <span>{getSortIcon('jelenlegi_karam')}</span>
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('statusz')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Státusz</span>
                    <span>{getSortIcon('statusz')}</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Műveletek
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentAnimals.map((animal) => (
                <tr 
                  key={animal.enar} 
                  onClick={() => router.push(`/dashboard/animals/${animal.enar}`)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {animal.enar}
                        </div>
                        {animal.anya_enar && (
                          <div className="text-xs text-gray-500">
                            🤱 {animal.anya_enar}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(animal.szuletesi_datum).toLocaleDateString('hu-HU')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {calculateAge(animal.szuletesi_datum)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {animal.ivar === 'hímivar' ? '♂️ Hímivar' : '♀️ Nőivar'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {getCategoryDisplay(animal.kategoria)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      📍 {animal.jelenlegi_karam}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(animal.statusz)}`}>
                      {animal.statusz}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/animals/${animal.enar}/edit`);
                      }}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/animals/${animal.enar}`);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      👁️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginálás */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
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
                {' '}állatból
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === page
                        ? 'z-10 bg-green-50 border-green-500 text-green-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
