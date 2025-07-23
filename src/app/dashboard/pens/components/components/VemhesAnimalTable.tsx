// ==================================================
// 📁 src/components/pen-tables/VemhesAnimalTable.tsx
// ==================================================
import React from 'react';
import Link from 'next/link';
import { WeightCell } from '@/components/shared/WeightCell';
import AgeCell from '@/components/shared/AgeCell';  // ← ÚJ IMPORT

// TypeScript típusok
interface Animal {
    id: string;
    enar: string;
    name?: string; 
    szuletesi_datum: string;
    current_weight?: number;
    last_weight_measured_at?: string;
    notes?: string;
    expected_birth_date?: string;
    birth_date?: string;
}

export interface AnimalTableProps {
    animals: Animal[];
    selectedAnimals: string[];
    onToggleAnimal: (id: string) => void;
    onSelectAll: () => void;
    onClearSelection: () => void;
    handleAnimalClick: (animal: Animal) => void;
}

const getSafeKey = (animal: Animal, index: number): string => {
    if (animal.id && animal.id !== 'NaN' && animal.id !== '') {
        return `${animal.id}-${index}`;
    }
    if (animal.enar) {
        return `enar-${animal.enar}-${index}`;
    }
    return `fallback-${index}-${Math.random().toString(36).substr(2, 9)}`;
};

const addDays = (date: Date, days: number): string => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toLocaleDateString('hu-HU');
};

const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('hu-HU');
};

// 🤰 VEMHES TÁBLÁZAT - Sticky + AgeCell Életkor oszlop
export const VemhesAnimalTable: React.FC<AnimalTableProps> = ({
    animals, selectedAnimals, onToggleAnimal, onSelectAll, onClearSelection, handleAnimalClick
}) => {
    return (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            {/* ✅ EGYSZERŰ SCROLL CONTAINER - Sticky nélkül */}
            <div className="overflow-x-auto">
                <table className="table-auto w-full divide-y divide-gray-200">
                    {/* ✅ NORMÁL HEADER - Sticky eltávolítva */}
                    <thead className="bg-gray-50">
                        <tr>
                            {/* ✅ NORMÁL CHECKBOX OSZLOP */}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <input
                                    type="checkbox"
                                    checked={selectedAnimals.length === animals.length && animals.length > 0}
                                    onChange={() => selectedAnimals.length === animals.length ? onClearSelection() : onSelectAll()}
                                    className="rounded border-gray-300"
                                />
                            </th>
                            
                            {/* ✅ NORMÁL ENAR OSZLOP */}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                🏷️ ENAR
                            </th>
                            
                            {/* ✅ SCROLLABLE OSZLOPOK - Minden funkció megmarad */}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📛 Név</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🍼 Várható ellés</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">💉 RCC ideje</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">💉 BoviPast ideje</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🚫 Abrak elvétel</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🎂 Életkor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">⚖️ UTOLSÓ MÉRÉS</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📝 Feljegyzés</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">⚙️ Műveletek</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {animals.map((animal, index) => {
                            const expectedBirth = animal.expected_birth_date ? new Date(animal.expected_birth_date) : null;
                            const rccDate = expectedBirth ? addDays(expectedBirth, -42) : '-';
                            const bovipastDate = expectedBirth ? addDays(expectedBirth, -28) : '-';
                            const feedRemovalDate = expectedBirth ? addDays(expectedBirth, -14) : '-';
                            const isClickable = animal.enar && (animal.enar.includes('/') || animal.enar.startsWith('temp-'));

                            return (
                                <tr 
                                    key={getSafeKey(animal, index)}
                                    className={`hover:bg-gray-50 transition-colors ${
                                        selectedAnimals.includes(animal.id) ? 'bg-blue-50' : ''
                                    } ${isClickable ? 'cursor-pointer' : ''}`}
                                    onClick={isClickable ? () => handleAnimalClick(animal) : undefined}
                                >
                                    {/* ✅ NORMÁL CHECKBOX */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={selectedAnimals.includes(animal.id)}
                                            onChange={() => onToggleAnimal(animal.id)}
                                            className="rounded border-gray-300"
                                        />
                                    </td>
                                    
                                    {/* ✅ NORMÁL ENAR */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {isClickable ? (
                                            <span className="text-orange-600 font-medium cursor-pointer hover:text-orange-800">
                                                🐮 {animal.enar}
                                            </span>
                                        ) : (
                                            <Link href={`/dashboard/animals/${encodeURIComponent(animal.enar)}`} className="text-blue-600 hover:text-blue-800 font-medium">
                                                {animal.enar}
                                            </Link>
                                        )}
                                    </td>
                                    
                                    {/* ✅ SCROLLABLE CELLÁK - Minden funkció elérhető */}
                                    
                                    {/* NÉV */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                        {animal.name || '-'}
                                    </td>
                                    
                                    {/* VÁRHATÓ ELLÉS */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-green-600">
                                        {formatDate(animal.expected_birth_date)}
                                    </td>
                                    
                                    {/* RCC IDEJE (-42 nap) */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-red-600">
                                        {rccDate}
                                    </td>
                                    
                                    {/* BOVIPAST IDEJE (-28 nap) */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-orange-600">
                                        {bovipastDate}
                                    </td>
                                    
                                    {/* ABRAK ELVÉTEL (-14 nap) */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-blue-600">
                                        {feedRemovalDate}
                                    </td>
                                    
                                    {/* ✅ ÉLETKOR OSZLOP - AgeCell automatikus színezéssel */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <AgeCell birthDate={animal.szuletesi_datum || animal.birth_date || ''} />
                                    </td>
                                    
                                    {/* SÚLYMÉRÉS - WeightCell komponens használata */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <WeightCell 
                                            weight={animal.current_weight} 
                                            lastMeasured={animal.last_weight_measured_at} 
                                        />
                                    </td>
                                    
                                    {/* FELJEGYZÉS */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {animal.notes || '-'}
                                    </td>
                                    
                                    {/* MŰVELETEK */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <button 
                                            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                            title="Műveletek"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                alert('🔧 Műveletek menü hamarosan elérhető!');
                                            }}
                                        >
                                            <span className="text-lg">⋯</span>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            {/* ✅ EMPTY STATE */}
            {animals.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-gray-400 text-lg mb-2">🤰</div>
                    <div className="text-gray-500">Nincs állat ebben a vemhes karámban</div>
                    <div className="text-xs text-gray-400 mt-2">
                        A vemhes karám a terhes tehenek helye az ellés előtti időszakban
                    </div>
                </div>
            )}
        </div>
    );
};