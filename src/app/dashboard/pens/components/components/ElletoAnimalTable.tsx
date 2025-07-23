import React from 'react';
import Link from 'next/link';
import { WeightCell } from '@/components/shared/WeightCell';
import { AgeCell } from '@/components/shared/AgeCell';  // ← ÚJ IMPORT

// TypeScript típusok
interface Animal {
    id: string;
    enar: string;
    name?: string; 
    szuletesi_datum: string;
    kategoria: string;
    ivar: string;
    statusz: string;
    current_weight?: number;
    last_weight_measured_at?: string;
    notes?: string;
    // Ellető-specifikus mezők
    birth_date?: string;
    calf_enar?: string;
    calf_gender?: 'hímivar' | 'nőivar';
    // További mezők...
    assigned_at?: string;
    pairing_date?: string;
    vv_date?: string;
}

interface AnimalTableProps {
    animals: Animal[];
    selectedAnimals: string[];
    onToggleAnimal: (id: string) => void;
    onSelectAll: () => void;
    onClearSelection: () => void;
    handleAnimalClick: (animal: Animal) => void;
}

// Segédfunkciók
const getSafeKey = (animal: Animal, index: number): string => {
    if (animal.id && animal.id !== 'NaN' && animal.id !== '') {
        return `${animal.id}-${index}`;
    }
    if (animal.enar) {
        return `enar-${animal.enar}-${index}`;
    }
    return `fallback-${index}-${Math.random().toString(36).substr(2, 9)}`;
};

const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('hu-HU');
};

// 🍼 ELLETŐ TÁBLÁZAT - STICKY COLUMNS + MOBILRA OPTIMALIZÁLT
export const ElletoAnimalTable: React.FC<AnimalTableProps> = ({
    animals, 
    selectedAnimals, 
    onToggleAnimal, 
    onSelectAll, 
    onClearSelection, 
    handleAnimalClick
}) => {
    return (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            {/* ✅ RESPONSIVE SCROLL CONTAINER */}
            <div className="overflow-x-auto relative">
                <table className="table-auto w-full divide-y divide-gray-200">
                    {/* ✅ STICKY HEADER */}
                    <thead className="bg-gray-50 sticky top-0 z-20">
                        <tr>
                            {/* ✅ STICKY CHECKBOX OSZLOP */}
                            <th className="sticky left-0 bg-gray-50 z-10 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-14">
                                <input
                                    type="checkbox"
                                    checked={selectedAnimals.length === animals.length && animals.length > 0}
                                    onChange={() => selectedAnimals.length === animals.length ? onClearSelection() : onSelectAll()}
                                    className="rounded border-gray-300"
                                />
                            </th>
                            
                            {/* ✅ STICKY ENAR OSZLOP */}
                            <th className="sticky left-14 bg-gray-50 z-10 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-28">
                                🏷️ ENAR
                            </th>
                            
                            {/* ✅ SCROLLABLE OSZLOPOK - Optimalizált */}
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">
                                🍼 Ellés időpontja
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">
                                🌟 Ellés lefolyása
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-20">
                                ⚥ Borjú neme
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">
                                🏷️ Borjú ENAR
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-20">
                                📅 Borjú kora
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">
                                ⚖️ Súly
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-28">
                                📝 Jegyzet
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                                ⚙️
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {animals.map((animal, index) => {
                            const isClickable = animal.enar && (animal.enar.includes('/') || animal.enar.startsWith('temp-'));
                            
                            return (
                                <tr 
                                    key={getSafeKey(animal, index)}
                                    className={`hover:bg-gray-50 transition-colors ${
                                        selectedAnimals.includes(animal.id) ? 'bg-blue-50' : ''
                                    } ${isClickable ? 'cursor-pointer' : ''}`}
                                    onClick={isClickable ? () => handleAnimalClick(animal) : undefined}
                                >
                                    {/* ✅ STICKY CHECKBOX */}
                                    <td className="sticky left-0 bg-white z-10 px-3 py-2 whitespace-nowrap border-r border-gray-200">
                                        <input
                                            type="checkbox"
                                            checked={selectedAnimals.includes(animal.id)}
                                            onChange={() => onToggleAnimal(animal.id)}
                                            className="rounded border-gray-300"
                                        />
                                    </td>
                                    
                                    {/* ✅ STICKY ENAR */}
                                    <td className="sticky left-14 bg-white z-10 px-3 py-2 whitespace-nowrap border-r border-gray-200">
                                        {isClickable ? (
                                            <span className="text-orange-600 font-medium cursor-pointer hover:text-orange-800 text-xs">
                                                🐮 {animal.enar}
                                            </span>
                                        ) : (
                                            <Link 
                                                href={`/dashboard/animals/${encodeURIComponent(animal.enar)}`} 
                                                className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                                            >
                                                {animal.enar}
                                            </Link>
                                        )}
                                    </td>
                                    
                                    {/* ✅ SCROLLABLE CELLÁK - Optimalizált */}
                                    
                                    {/* ELLÉS IDŐPONTJA */}
                                    <td className="px-3 py-2 whitespace-nowrap text-xs text-green-600 font-medium">
                                        {formatDate(animal.birth_date)}
                                    </td>
                                    
                                    {/* ELLÉS LEFOLYÁSA - Teljes badge */}
                                    <td className="px-3 py-2 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            🍼 Természetes
                                        </span>
                                    </td>
                                    
                                    {/* BORJÚ NEME - Teljes név */}
                                    <td className="px-3 py-2 whitespace-nowrap">
                                        {animal.calf_gender ? (
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                animal.calf_gender === 'hímivar' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                                            }`}>
                                                {animal.calf_gender === 'hímivar' ? '♂ Hímivar' : '♀ Nőivar'}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-xs">-</span>
                                        )}
                                    </td>
                                    
                                    {/* BORJÚ ENAR */}
                                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 font-medium">
                                        {animal.calf_enar || '-'}
                                    </td>
                                    
                                    {/* ✅ BORJÚ KORA OSZLOP - AgeCell komponens */}
                                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                                        <AgeCell 
                                            birthDate={animal.birth_date || animal.szuletesi_datum}
                                            className="text-xs"
                                        />
                                    </td>
                                    
                                    {/* SÚLYMÉRÉS - WeightCell kompakt */}
                                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                                        <WeightCell 
                                            weight={animal.current_weight} 
                                            lastMeasured={animal.last_weight_measured_at}
                                            compact={true}
                                        />
                                    </td>
                                    
                                    {/* FELJEGYZÉS - Truncated */}
                                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 max-w-20 truncate" title={animal.notes || ''}>
                                        {animal.notes || '-'}
                                    </td>
                                    
                                    {/* MŰVELETEK - Minimalizált */}
                                    <td className="px-3 py-2 whitespace-nowrap">
                                        <button 
                                            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
                                            title="Műveletek"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                alert('🔧 Műveletek menü hamarosan elérhető!');
                                            }}
                                        >
                                            <span className="text-xs">⋯</span>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            {/* ✅ EMPTY STATE - Tömörített */}
            {animals.length === 0 && (
                <div className="text-center py-8">
                    <div className="text-gray-400 text-lg mb-2">🍼</div>
                    <div className="text-gray-500 text-sm">Nincs állat ebben az ellető karámban</div>
                    <div className="text-xs text-gray-400 mt-1">Az ellető karám a frissen ellett tehenek helye</div>
                </div>
            )}
        </div>
    );
};