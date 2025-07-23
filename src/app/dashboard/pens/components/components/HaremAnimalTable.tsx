import React from 'react';
import Link from 'next/link';
import { WeightCell } from '@/components/shared/WeightCell';
import AgeCell from '@/components/shared/AgeCell';  // ← ÚJ IMPORT
import { displayEnar } from '@/constants/enar-formatter';

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
    // Hárem-specifikus mezők
    harem_start_date?: string;
    pairing_date?: string;
    assigned_at?: string;
    vv_date?: string;
    vv_result?: 'vemhes' | 'ures' | 'csira';
    expected_birth_date?: string;
    birth_date?: string;
    // További mezők...
    pregnancy_status?: string;
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

const addDays = (date: Date, days: number): string => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toLocaleDateString('hu-HU');
};

const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('hu-HU');
};

// 👑 HÁREM TÁBLÁZAT - HIBRID: Eredeti design + Sticky columns + AgeCell
export const HaremAnimalTable: React.FC<AnimalTableProps> = ({
    animals, 
    selectedAnimals, 
    onToggleAnimal, 
    onSelectAll, 
    onClearSelection, 
    handleAnimalClick
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
                            
                            {/* ✅ NORMÁL OSZLOPOK - Eredeti címek és méret, minden funkció megmarad */}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                📛 Név
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                💕 Hárem kezdete
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                🔬 VV tervezett
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ✅ VV eredmény
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                🍼 Várható ellés
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                🎂 Életkor
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ⚖️ UTOLSÓ MÉRÉS
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                📝 Feljegyzés
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ⚙️ Műveletek
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {animals.map((animal, index) => {
                            // ✅ ÉLETKOR SZÁMÍTÁS EGYSZER (VV logikához szükséges!)
                            const birthDate = animal.szuletesi_datum || animal.birth_date;
                            let ageInMonths = 0;
                            if (birthDate) {
                                const birth = new Date(birthDate);
                                const today = new Date();
                                ageInMonths = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
                            }

                            // ✅ VV INTELLIGENS LOGIKA (eredeti üzleti logika 100% megtartva!)
                            const vvPlanned = (() => {
                                // 1. Csak nőivarokra (ivar ellenőrzés)
                                if (animal.ivar !== 'nőivar' && animal.ivar !== 'nő') {
                                    return '-';
                                }

                                // 2. Csak 24+ hónapos állatokra (életkor ellenőrzés)
                                if (ageInMonths > 0 && ageInMonths < 24) {
                                    return '-';
                                }

                                // 3. 24+ hónapos nőivarokra számítjuk a VV-t
                                if (animal.vv_date) {
                                    return formatDate(animal.vv_date);
                                }

                                if (animal.pairing_date) {
                                    return addDays(new Date(animal.pairing_date), 75);
                                }

                                if (animal.assigned_at) {
                                    return addDays(new Date(animal.assigned_at), 75);
                                }

                                return '-';
                            })();

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
                                                🐮 {displayEnar(animal.enar)}
                                            </span>
                                        ) : (
                                            <Link 
                                                href={`/dashboard/animals/${encodeURIComponent(animal.enar)}`} 
                                                className="text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                {displayEnar(animal.enar)}
                                            </Link>
                                        )}
                                    </td>
                                    
                                    {/* ✅ NORMÁL CELLÁK - Eredeti méret és design, minden funkció elérhető */}
                                    
                                    {/* NÉV */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                        {animal.name || '-'}
                                    </td>
                                    
                                    {/* HÁREM KEZDETE */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatDate(animal.harem_start_date)}
                                    </td>
                                    
                                    {/* VV TERVEZETT - Komplex üzleti logika */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-blue-600">
                                        {vvPlanned}
                                    </td>
                                    
                                    {/* VV EREDMÉNY - Eredeti badge-ek */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {animal.vv_result ? (
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                animal.vv_result === 'vemhes' ? 'bg-green-100 text-green-800' :
                                                animal.vv_result === 'ures' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {animal.vv_result === 'vemhes' ? '🤰 Vemhes' :
                                                 animal.vv_result === 'ures' ? '❌ Üres' : '🌱 Csíra'}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    
                                    {/* VÁRHATÓ ELLÉS */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-green-600">
                                        {formatDate(animal.expected_birth_date)}
                                    </td>
                                    
                                    {/* ✅ ÉLETKOR OSZLOP - AgeCell automatikus színezéssel */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <AgeCell birthDate={animal.szuletesi_datum || animal.birth_date || ''} />
                                    </td>
                                    
                                    {/* SÚLYMÉRÉS - WeightCell eredeti méret */}
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
            
            {/* ✅ EMPTY STATE - Eredeti méret */}
            {animals.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-gray-400 text-lg mb-2">👑</div>
                    <div className="text-gray-500">Nincs állat ebben a hárem karámban</div>
                </div>
            )}
        </div>
    );
};