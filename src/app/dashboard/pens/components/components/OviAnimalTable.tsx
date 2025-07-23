// ==================================================
// 📁 src/components/pen-tables/OviAnimalTable.tsx
// ==================================================
import React from 'react';
import Link from 'next/link';
import { WeightCell } from '@/components/shared/WeightCell';
import AgeCell from '@/components/shared/AgeCell';  // ← ÚJ IMPORT

// TypeScript típusok (eredeti kódból)
interface Animal {
    id: string;
    enar: string;
    name?: string; 
    szuletesi_datum: string;
    kategoria: string;
    ivar: string;
    statusz: string;
    birth_location?: 'nálunk' | 'vásárolt' | 'ismeretlen';
    jelenlegi_karam?: string;
    anya_enar?: string;
    apa_enar?: string;
    created_at: string;
    assigned_at?: string;
    assignment_reason?: string;
    pairing_date?: string;
    current_weight?: number;
    last_weight_measured_at?: string;
    vv_date?: string;
    pregnancy_status?: string;
    notes?: string;
    // További mezők...
    harem_start_date?: string;
    vv_result?: 'vemhes' | 'ures' | 'csira';
    expected_birth_date?: string;
    birth_date?: string;
    calf_enar?: string;
    calf_gender?: 'hímivar' | 'nőivar';
}

export interface AnimalTableProps {
    animals: Animal[];
    selectedAnimals: string[];
    onToggleAnimal: (id: string) => void;
    onSelectAll: () => void;
    onClearSelection: () => void;
    handleAnimalClick: (animal: Animal) => void;
}

// Segédfunkciók (eredeti kódból)
const getSafeKey = (animal: Animal, index: number): string => {
    // 1. Ha van ID és nem NaN, használd azt + index-szel
    if (animal.id && animal.id !== 'NaN' && animal.id !== '') {
        return `${animal.id}-${index}`;
    }
    // 2. Ha van ENAR, használd azt + index-szel
    if (animal.enar) {
        return `enar-${animal.enar}-${index}`;
    }
    // 3. Végső fallback
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

// 🎓 ÓVI TÁBLÁZAT - AgeCell hozzáadva mint a BolcsiAnimalTable-ben
export const OviAnimalTable: React.FC<AnimalTableProps> = ({
    animals, selectedAnimals, onToggleAnimal, onSelectAll, onClearSelection, handleAnimalClick
}) => {
    return (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="table-auto w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <input
                                    type="checkbox"
                                    checked={selectedAnimals.length === animals.length && animals.length > 0}
                                    onChange={() => selectedAnimals.length === animals.length ? onClearSelection() : onSelectAll()}
                                    className="rounded border-gray-300"
                                />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🏷️ ENAR</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📅 Születési dátum</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🎯 24 hónapos ekkor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🎂 Életkor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">⚖️ UTOLSÓ MÉRÉS</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📝 Feljegyzés</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">⚙️ Műveletek</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {animals.map((animal, index) => {
                            // ✅ EREDETI LOGIKA: 24×30.44≈731 nap számítás
                            const twentyFourMonthTarget = addDays(new Date(animal.szuletesi_datum), 731);
                            const isClickable = animal.enar && (animal.enar.includes('/') || animal.enar.startsWith('temp-'));
                            
                            return (
                                <tr key={getSafeKey(animal, index)}
                                    className={`hover:bg-gray-50 transition-colors ${
                                        selectedAnimals.includes(animal.id) ? 'bg-blue-50' : ''
                                    } ${isClickable ? 'cursor-pointer' : ''}`}
                                    onClick={isClickable ? () => handleAnimalClick(animal) : undefined}>
                                    
                                    {/* ✅ CHECKBOX - eredeti logika */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={selectedAnimals.includes(animal.id)}
                                            onChange={() => onToggleAnimal(animal.id)}
                                            className="rounded border-gray-300"
                                        />
                                    </td>
                                    
                                    {/* ✅ ENAR - eredeti logika */}
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
                                    
                                    {/* ✅ SZÜLETÉSI DÁTUM - eredeti logika */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatDate(animal.szuletesi_datum)}
                                    </td>
                                    
                                    {/* ✅ 24 HÓNAPOS CÉLNAP - eredeti logika + lila színezés */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-purple-600">
                                        {twentyFourMonthTarget}
                                    </td>
                                    
                                    {/* ✅ ÚJ: ÉLETKOR OSZLOP - AgeCell automatikus színezéssel */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <AgeCell birthDate={animal.szuletesi_datum || animal.birth_date || ''} />
                                    </td>
                                    
                                    {/* ✅ SÚLYMÉRÉS - REFAKTORÁLT: WeightCell komponens az eredeti duplikált kód helyett */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <WeightCell 
                                            weight={animal.current_weight} 
                                            lastMeasured={animal.last_weight_measured_at} 
                                        />
                                    </td>
                                    
                                    {/* ✅ FELJEGYZÉS - eredeti logika */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {animal.notes || '-'}
                                    </td>
                                    
                                    {/* ✅ MŰVELETEK - eredeti logika */}
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
                    <div className="text-gray-400 text-lg mb-2">🎓</div>
                    <div className="text-gray-500">Nincs állat ebben az óvi karámban</div>
                    <div className="text-xs text-gray-400 mt-2">
                        Az óvi karám a 12-24 hónapos növendék állatoknak a helye
                    </div>
                </div>
            )}
        </div>
    );
};