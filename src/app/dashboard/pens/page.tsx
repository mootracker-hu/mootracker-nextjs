'use client';

import { useState } from 'react';
import { Home, Users, Search, Filter } from 'lucide-react';

// Egyszerű mock adatok - később Supabase-ből
const mockPens = [
  { id: 1, name: 'Hárem #1', type: 'hárem', capacity: 25, current: 22 },
  { id: 2, name: 'Hárem #2', type: 'hárem', capacity: 25, current: 18 },
  { id: 3, name: 'Bölcsi #1', type: 'bölcsi', capacity: 15, current: 12 },
  { id: 4, name: 'Bölcsi #2', type: 'bölcsi', capacity: 15, current: 8 },
  { id: 5, name: 'Óvi #1', type: 'óvi', capacity: 20, current: 15 },
  { id: 6, name: 'Óvi #2', type: 'óvi', capacity: 20, current: 19 },
  { id: 7, name: 'Karám #1', type: 'karám', capacity: 30, current: 25 },
  { id: 8, name: 'Karám #2', type: 'karám', capacity: 30, current: 28 },
];

export default function PensPage() {
  const [pens] = useState(mockPens);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('mind');

  // Szűrés
  const filteredPens = pens.filter(pen => {
    const matchesType = selectedType === 'mind' || pen.type === selectedType;
    const matchesSearch = pen.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Karám típus színek
  const getPenTypeColor = (type: string) => {
    switch (type) {
      case 'hárem': return 'bg-pink-500';
      case 'bölcsi': return 'bg-blue-500';
      case 'óvi': return 'bg-green-500';
      case 'karám': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  // Kapacitás színek
  const getCapacityColor = (current: number, capacity: number) => {
    const percentage = (current / capacity) * 100;
    if (percentage < 60) return 'text-green-600';
    if (percentage < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Statisztikák
  const totalCapacity = pens.reduce((sum, pen) => sum + pen.capacity, 0);
  const totalCurrent = pens.reduce((sum, pen) => sum + pen.current, 0);
  const utilizationPercentage = totalCapacity > 0 ? (totalCurrent / totalCapacity) * 100 : 0;

  const penTypes = ['mind', 'hárem', 'bölcsi', 'óvi', 'karám'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Karám Kezelés</h1>
        <p className="text-gray-600 mt-1">
          Telephelyi karámok és állatok áttekintése
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Home className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Összes Karám</p>
              <p className="text-2xl font-bold text-gray-900">{pens.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Összkapacitás</p>
              <p className="text-2xl font-bold text-gray-900">{totalCapacity}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Jelenlegi</p>
              <p className="text-2xl font-bold text-gray-900">{totalCurrent}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                utilizationPercentage < 60 ? 'bg-green-500' : 
                utilizationPercentage < 80 ? 'bg-yellow-500' : 'bg-red-500'
              }`}>
                {Math.round(utilizationPercentage)}%
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Kihasználtság</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(utilizationPercentage)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Karám keresése..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {penTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'mind' ? 'Minden típus' : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Pens Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPens.map((pen) => (
          <div key={pen.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${getPenTypeColor(pen.type)}`}></div>
                <h3 className="text-lg font-semibold text-gray-900">{pen.name}</h3>
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {pen.type}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Kapacitás:</span>
                <span className={`text-sm font-medium ${getCapacityColor(pen.current, pen.capacity)}`}>
                  {pen.current} / {pen.capacity}
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    (pen.current / pen.capacity) < 0.6 ? 'bg-green-500' :
                    (pen.current / pen.capacity) < 0.8 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min((pen.current / pen.capacity) * 100, 100)}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                  Részletek →
                </button>
                <div className="text-xs text-gray-500">
                  Mock adat
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Development Notice */}
      <div className="bg-green-50 rounded-lg p-6 border border-green-200">
        <div className="flex">
          <div className="flex-shrink-0">
            <Home className="h-5 w-5 text-green-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-900">
              Karám Management - Alapverzió Kész
            </h3>
            <div className="mt-2 text-sm text-green-700">
              <p>Működő alapfunkciók:</p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>8 karám mock adatokkal</li>
                <li>Kapacitás monitoring (színkódolt)</li>
                <li>Keresés és szűrés</li>
                <li>Responsive design</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
